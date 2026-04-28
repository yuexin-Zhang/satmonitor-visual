import { get, post, put, del } from './request';

// 登录
export interface LoginParams {
  username: string;
  password: string;
}
export interface LoginResult {
  token: string;
  user: { id: string; username: string; role: string };
}
export const login = (params: LoginParams) => post<LoginResult>('/admin/login', params);

// 系统配置
export interface SystemConfig {
  siteName: string;
  alertThresholds: {
    signalMin: number;
    tempMax: number;
    displacementMax: number;
  };
  heatingPolicy: string;
  notificationEnabled: boolean;
}
export const fetchConfig = () => get<SystemConfig>('/admin/config');
export const saveConfig = (config: Partial<SystemConfig>) => post<SystemConfig>('/admin/config', config);

// 用户管理
export interface User {
  id: string;
  username: string;
  role: string;
  status: string;
  createdAt: string;
}
export const fetchUsers = () => get<User[]>('/admin/users');
export const createUser = (user: Omit<User, 'id' | 'createdAt'>) => post<User>('/admin/users', user);
export const updateUser = (id: string, user: Partial<User>) => put<User>(`/admin/users/${id}`, user);
export const deleteUser = (id: string) => del(`/admin/users/${id}`);

// 操作日志
export interface OperationLog {
  id: string;
  user: string;
  action: string;
  detail: string;
  time: string;
}
export const fetchOperationLogs = () => get<OperationLog[]>('/admin/operation-logs');
