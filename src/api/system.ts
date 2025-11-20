/**
 * 系统管理相关API - 用于获取用户、角色、部门列表
 */
import type { UserInfo, Role as RoleType, Department as DepartmentType } from '../types/api';
import { getUserListApi } from './user';
import { getRoleListApi } from './role';
import { getDeptTreeApi } from './dept';

// 导出类型
export type User = UserInfo;
export type Role = RoleType;
export type Department = DepartmentType;

/**
 * 获取所有用户列表（简化版，用于选择器）
 */
export const getAllUsers = async (): Promise<User[]> => {
  const response = await getUserListApi({ page: 1, size: 200 });
  return response.items || [];
};

/**
 * 获取所有角色列表
 */
export const getAllRoles = async (): Promise<Role[]> => {
  const response = await getRoleListApi({ page: 1, size: 200 });
  return response.items || [];
};

/**
 * 获取所有部门列表（扁平化）
 */
export const getAllDepartments = async (): Promise<Department[]> => {
  const deptTree = await getDeptTreeApi();
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
  return flattenDepts(deptTree);
};
