import { ApiClient } from './client';

export interface Role {
  id: number;
  name: string;
  key: string;
  status: number;
  is_filter_scopes: boolean;
  sort: number;
  data_scope: number;
  remark?: string;
  created_time: string;
  updated_time?: string;
}

export interface RoleParams {
  name: string;
  key: string;
  status: number;
  is_filter_scopes: boolean;
  sort?: number;
  data_scope?: number;
  remark?: string;
}

export async function getRoleListApi(params?: any) {
  return ApiClient.get('/v1/sys/roles', { params });
}

export async function createRoleApi(data: RoleParams) {
  return ApiClient.post('/v1/sys/roles', data);
}

export async function updateRoleApi(id: number, data: RoleParams) {
  return ApiClient.put(`/v1/sys/roles/${id}`, data);
}

export async function deleteRoleApi(id: number) {
  return ApiClient.delete(`/v1/sys/roles/${id}`);
}

// 批量删除角色
export async function batchDeleteRoleApi(ids: number[]) {
  return ApiClient.delete('/v1/sys/roles', { data: { pks: ids } });
}

// 获取角色关联的菜单ID列表
export async function getRoleMenusApi(roleId: number): Promise<number[]> {
  return ApiClient.get(`/v1/sys/roles/${roleId}/menus`);
}

// 更新角色菜单权限
export async function updateRoleMenusApi(roleId: number, menuIds: number[]) {
  return ApiClient.put(`/v1/sys/roles/${roleId}/menus`, { menus: menuIds });
}

// 获取角色关联的数据权限ID列表
export async function getRoleDataScopesApi(roleId: number): Promise<number[]> {
  return ApiClient.get(`/v1/sys/roles/${roleId}/scopes`);
}

// 更新角色数据权限
export async function updateRoleDataScopesApi(roleId: number, scopeIds: number[]) {
  return ApiClient.put(`/v1/sys/roles/${roleId}/scopes`, { scopes: scopeIds });
}
