import axios, { AxiosRequestConfig } from 'axios';
import type { AuthToken } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 公开接口白名单：登录/验证码/刷新令牌不带 Authorization，
// 避免 localStorage 中残留的过期 token 污染请求导致 "访问令牌无效或已过期"
const PUBLIC_API_PATTERNS = [
  '/v1/auth/login',
  '/v1/auth/captcha',
  '/v1/auth/refresh-token',
];

// 请求拦截器：admin 页面下所有请求都附加 admin_token，否则用 monitor_token
api.interceptors.request.use((config) => {
  const url = config.url || '';
  if (PUBLIC_API_PATTERNS.some((p) => url.includes(p))) {
    // 公开接口主动移除可能残留的 Authorization 头
    if (config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  }
  const isAdminPage = window.location.pathname.includes('/admin');
  const token = isAdminPage
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('monitor_token') || localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== 并发限流（信号量）====================
// 后端对单 token 同时处理的请求数有上限，大屏挂载瞬间会并发十余个请求，
// 触发 400「请求并发数超出限制」。此处在前端用信号量限制同时在途的请求数，
// 超出的请求排队等待，从源头避免并发超限。
const MAX_CONCURRENCY = 2;
// 后端并发上限可能比前端信号量更严格，偶发 A0502 时做指数退避重试。
// 重试计数必须按 "url+params" 字符串键记录：axios 内部 mergeConfig 会生成新 config
// 对象，若把计数挂在 config 属性上会丢失，导致重试无限循环（历史 bug）。
const CONCURRENCY_MAX_RETRY = 2;
const CONCURRENCY_RETRY_BASE_DELAY = 250; // ms
const ccAttempts = new Map<string, number>();
function ccRetryKey(cfg: AxiosRequestConfig | undefined): string {
  if (!cfg) return '';
  const params = cfg.params;
  return `${cfg.url || ''}#${params ? JSON.stringify(params) : ''}`;
}
let inflight = 0;
const concurrencyQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (inflight < MAX_CONCURRENCY) {
    inflight++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    // 排队等待：releaseSlot 会在有空位时唤醒并维护计数
    concurrencyQueue.push(resolve);
  });
}

function releaseSlot(): void {
  inflight = Math.max(0, inflight - 1);
  const next = concurrencyQueue.shift();
  if (next) {
    inflight++;
    next();
  }
}

// 请求拦截器：发送前先获取并发名额（名额满则排队等待）
api.interceptors.request.use((config) => acquireSlot().then(() => config));

// 响应拦截器：无论成功/失败都释放名额。
// 注意：此拦截器必须先于下方「解包/401」拦截器注册，确保它最先执行，
// 这样即便后续拦截器 reject（业务错误码）或触发 401 重试，名额都已正确释放。
api.interceptors.response.use(
  (response) => {
    releaseSlot();
    return response;
  },
  (error) => {
    releaseSlot();
    return Promise.reject(error);
  },
);

// ==================== Token 自动刷新机制 ====================
// 任意请求收到 401 时，自动用 refreshToken 换新 token 并重试原请求；
// 并发请求只刷新一次，其余排队等待；只有刷新失败/无 refreshToken 时才登出。
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (e: any) => void;
}> = [];
const retriedConfigs = new WeakSet<AxiosRequestConfig>();

function currentScopeIsAdmin(): boolean {
  return window.location.pathname.includes('/admin');
}

function getRefreshToken(): string | null {
  return currentScopeIsAdmin()
    ? localStorage.getItem('admin_refresh_token')
    : localStorage.getItem('monitor_refresh_token') ||
        localStorage.getItem('admin_refresh_token');
}

function storeNewTokens(accessToken: string, refreshToken: string) {
  if (currentScopeIsAdmin()) {
    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_refresh_token', refreshToken);
  } else {
    localStorage.setItem('monitor_token', accessToken);
    localStorage.setItem('monitor_refresh_token', refreshToken);
  }
}

function clearAuthAndRedirect() {
  if (currentScopeIsAdmin()) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    window.location.href = import.meta.env.BASE_URL + 'admin/login';
  } else {
    localStorage.removeItem('monitor_token');
    localStorage.removeItem('monitor_refresh_token');
    localStorage.removeItem('monitor_user');
    window.location.href = import.meta.env.BASE_URL + 'login';
  }
}

// 响应拦截器：剥掉统一包装层 { code, msg, data }，并对 401 做 token 自动刷新
api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data && typeof data === 'object' && 'code' in data && data.code !== '00000') {
      // 并发限流（A0502 / "请求并发数超出限制"）：指数退避重试。
      // 计数按 url+params 字符串键（ccAttempts），成功或用尽次数后清零。
      const isConcurrencyErr =
        data.code === 'A0502' ||
        (typeof data.msg === 'string' && data.msg.includes('并发'));
      if (isConcurrencyErr) {
        const key = ccRetryKey(response.config);
        const attempt = ccAttempts.get(key) ?? 0;
        if (attempt < CONCURRENCY_MAX_RETRY) {
          ccAttempts.set(key, attempt + 1);
          const wait = CONCURRENCY_RETRY_BASE_DELAY * 2 ** attempt;
          return new Promise((resolve) => setTimeout(resolve, wait)).then(
            () => api(response.config),
          );
        }
        ccAttempts.delete(key);
      }
      return Promise.reject(new Error(data.msg || '请求失败'));
    }
    // 成功：清理该请求的重试计数（无记录时 delete 是无副作用 no-op）
    ccAttempts.delete(ccRetryKey(response.config));
    // 统一包装则返回 data.data，否则原样返回
    if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
      return data.data;
    }
    return data;
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as AxiosRequestConfig | undefined;

    // 非 401 错误：直接拒绝
    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const url = String(originalRequest.url || '');

    // 登录接口 401：账号/密码错误，不跳转，交由登录页展示错误
    if (url.includes('/v1/auth/login')) {
      return Promise.reject(error);
    }

    // 刷新接口本身 401：refreshToken 已失效，直接登出
    if (url.includes('/v1/auth/refresh-token')) {
      if (!import.meta.env.DEV) clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // 已重试过仍 401：避免死循环，直接登出
    if (retriedConfigs.has(originalRequest)) {
      if (!import.meta.env.DEV) clearAuthAndRedirect();
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    // 无 refreshToken：直接登出
    if (!refreshToken) {
      if (!import.meta.env.DEV) clearAuthAndRedirect();
      return Promise.reject(error);
    }

    retriedConfigs.add(originalRequest);

    // 已有刷新在进行：排队等待新 token
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    // 发起刷新
    isRefreshing = true;
    try {
      const tokenData = await httpPost<AuthToken>('/v1/auth/refresh-token', undefined, {
        params: { refreshToken },
      });
      storeNewTokens(tokenData.accessToken, tokenData.refreshToken);
      const newToken = tokenData.accessToken;
      // 唤醒所有排队请求
      pendingQueue.forEach((p) => p.resolve(newToken));
      pendingQueue = [];
      isRefreshing = false;
      // 重试原请求
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      isRefreshing = false;
      pendingQueue.forEach((p) => p.reject(refreshErr));
      pendingQueue = [];
      if (!import.meta.env.DEV) clearAuthAndRedirect();
      return Promise.reject(refreshErr);
    }
  }
);

export default api;

/**
 * 从 localStorage 读取当前登录用户绑定的 stationId。
 * 大屏为单站模式：监管端登录后用户信息存于 monitor_user（管理后台为 admin_user）。
 * 用于调用 /v1/sat/* 这类按 stationId 过滤的接口；未登录或无绑定台站时返回 undefined。
 */
export function getStationIdFromStorage(): number | undefined {
  try {
    const raw =
      localStorage.getItem('monitor_user') || localStorage.getItem('admin_user');
    if (!raw) return undefined;
    const u = JSON.parse(raw);
    const id = u?.stationId;
    return typeof id === 'number' && id > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 大屏单站模式下的有效 stationId：优先取登录用户绑定台站，未绑定（如管理员账号
 * allStationsAccess 或未登录）时回退默认 1。/v1/sat/* 的看板统计接口
 * （energy-stats / risk-stats 等）要求 stationId 必填，未绑定时直接传 undefined
 * 会因 axios 丢参触发 A0410「请求必填参数为空」。
 */
export function getEffectiveStationId(): number {
  return getStationIdFromStorage() ?? 1;
}

// 类型安全的 HTTP 辅助函数（仅做类型适配，不含业务封装）
// ==================== GET 在途请求合并 ====================
// 大屏多个组件会各自请求同一接口（典型：/v1/snow/detail 被 Header / AntennaInfo /
// EnvironmentalInfo / PowerInfo 同时调用，首屏重复 4 次）。这里把"同时在途的相同 GET"
// 合并到同一个 Promise，4 次收敛为 1 次真实请求，显著降低首屏并发压力。
// 请求完成（成功/失败）后立即从映射移除，后续调用（含定时刷新）会发起新请求，不返回过期数据。
const inflightGets = new Map<string, Promise<unknown>>();
function inflightKey(url: string, config?: AxiosRequestConfig): string {
  const params = config?.params;
  return `${url}#${params ? JSON.stringify(params) : ''}`;
}

export function httpGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const key = inflightKey(url, config);
  const existing = inflightGets.get(key);
  if (existing) return existing as Promise<T>;
  const p = api.get(url, config) as Promise<T>;
  inflightGets.set(key, p);
  p.finally(() => {
    // 仅清理当前这条 Promise；若已有更新请求覆盖则保留新的
    if (inflightGets.get(key) === p) inflightGets.delete(key);
  });
  return p;
}

export function httpPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.post(url, data, config) as Promise<T>;
}

export function httpPut<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.put(url, data, config) as Promise<T>;
}

export function httpPatch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return api.patch(url, data, config) as Promise<T>;
}

export function httpDelete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.delete(url, config) as Promise<T>;
}
