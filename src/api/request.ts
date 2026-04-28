import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 根据环境变量设置 baseURL
// 开发环境: Vite 代理会把 /api 转发到 mock server
// 生产环境: 项目部署在 /satmonitor-visual/ 下，API 路径为 /satmonitor-visual/api
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token（admin 登录后写入）
    const token = localStorage.getItem('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    // 统一处理后端返回的 code
    if (data.code && data.code !== '00000') {
      console.error(`[API Error] ${data.code}: ${data.msg}`);
      return Promise.reject(new Error(data.msg || '请求失败'));
    }
    return data.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // 未授权，清除 token 并跳转登录
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      }
      console.error(`[HTTP Error] ${status}:`, error.response.data);
    } else if (error.request) {
      console.error('[Network Error]: 无法连接到服务器');
    }
    return Promise.reject(error);
  }
);

export default request;

// 便捷封装
export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, config);
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config);
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config);
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config);
}
