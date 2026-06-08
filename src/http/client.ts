import axios, { AxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动根据接口路径带上对应的 token
api.interceptors.request.use((config) => {
  const url = config.url || '';
  if (url.startsWith('/admin')) {
    const token = localStorage.getItem('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    const token = localStorage.getItem('monitor_token') || localStorage.getItem('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 响应拦截器：剥掉统一包装层 { code, msg, data }
api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code && data.code !== '00000') {
      return Promise.reject(new Error(data.msg || '请求失败'));
    }
    return data.data;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        if (import.meta.env.DEV) {
          return Promise.reject(error);
        }
        const isAdminPage = window.location.pathname.includes('/admin');
        if (isAdminPage) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = import.meta.env.BASE_URL + 'admin/login';
        } else {
          localStorage.removeItem('monitor_token');
          localStorage.removeItem('monitor_user');
          window.location.href = import.meta.env.BASE_URL + 'login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// 类型安全的 HTTP 辅助函数（仅做类型适配，不含业务封装）
export function httpGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.get(url, config) as Promise<T>;
}

export function httpPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.post(url, data, config) as Promise<T>;
}

export function httpPut<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.put(url, data, config) as Promise<T>;
}

export function httpDelete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.delete(url, config) as Promise<T>;
}
