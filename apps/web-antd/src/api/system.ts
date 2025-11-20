/**
 * 系统管理相关API - 用于获取用户、角色、部门列表
 */
import { requestClient } from '#/api/request';

export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  dept?: {
    id: number;
    name: string;
  };
}

export interface Role {
  id: number;
  name: string;
  code?: string;
  remark?: string;
}

export interface Department {
  id: number;
  name: string;
  parent_id?: number;
  children?: Department[];
}

/**
 * 获取所有用户列表（用于选择器）
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await requestClient.get<any>('/api/v1/sys/users', {
      params: { page: 1, size: 200 },
    });
    return response.items || [];
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return [];
  }
}

/**
 * 获取所有角色列表
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    const response = await requestClient.get<any>('/api/v1/sys/roles', {
      params: { page: 1, size: 200 },
    });
    return response.items || [];
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return [];
  }
}

/**
 * 获取所有部门列表（扁平化）
 */
export async function getAllDepartments(): Promise<Department[]> {
  try {
    const deptTree = await requestClient.get<Department[]>('/api/v1/sys/depts');
    
    // 将树形结构扁平化
    const flattenDepts = (depts: Department[]): Department[] => {
      const result: Department[] = [];
      const traverse = (nodes: Department[]) => {
        nodes.forEach(node => {
          result.push(node);
          if (node.children && node.children.length > 0) {
            traverse(node.children);
          }
        });
      };
      traverse(depts);
      return result;
    };
    
    return flattenDepts(Array.isArray(deptTree) ? deptTree : []);
  } catch (error) {
    console.error('获取部门列表失败:', error);
    return [];
  }
}
