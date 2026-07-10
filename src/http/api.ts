/**
 * 集中式 API 服务层
 * 将所有后端接口封装为函数，按模块组织。
 * baseURL=/api，路径以 /v1 开头，实际请求 /api/v1/xxx。
 */
import { httpGet, httpPost, httpPut, httpPatch, httpDelete } from './client';
import type {
  PageResult,
  AuthToken,
  CaptchaInfo,
  CurrentUser,
  LoginQuery,
  UserPageVO,
  UserForm,
  UserProfileVO,
  UserProfileForm,
  PasswordUpdateForm,
  RolePageVO,
  RoleForm,
  OptionLong,
  MenuVO,
  MenuForm,
  DeptVO,
  DeptForm,
  DictPageVO,
  DictForm,
  DictItemPageVO,
  DictItemForm,
  DictItemOptionVO,
  NoticePageVO,
  NoticeForm,
  NoticeDetailVO,
  ConfigVO,
  ConfigForm,
  LogPageVO,
  VisitStatsVO,
  VisitTrendVO,
  SatStationPageVO,
  SatStationForm,
  SatStationOverviewVO,
  SatDashboardOverviewVO,
  OptionString,
  SatDevicePageVO,
  SatDeviceForm,
  SatThresholdVO,
  SatThresholdForm,
  SatThresholdVersionVO,
  SatSnowStrategyVO,
  SatSnowStrategyForm,
  SatSnowExecLogVO,
  SatAlarmRule,
  SatAlarmRuleForm,
  SatAlarmRecordVO,
  SatStorageConfig,
  SatOtaVersion,
  SatOtaVersionForm,
  SatOtaTask,
  SatOtaTaskForm,
  Ys7DeviceVO,
  Ys7ChannelVO,
  Ys7LiveAddressVO,
  Ys7CaptureVO,
  Ys7TokenVO,
  SystemDetail,
  PowerChartItem,
  PowerChartParams,
  TemperatureChartItem,
  SnowHistoryParams,
  SnowDataHistoryItem,
  SnowExtraInfo,
  DashboardEnergyStats,
  DashboardRiskStats,
  SatWeatherForecastVO,
  SatEnvironmentCurrentVO,
  SatEnvironmentStatsVO,
  SatSunInterferenceVO,
} from './types';

// ==================== 认证 ====================
export const authApi = {
  /** 获取验证码 */
  captcha: () => httpGet<CaptchaInfo>('/v1/auth/captcha'),
  /** 账号密码登录（query 参数） */
  login: (query: LoginQuery) =>
    httpPost<AuthToken>('/v1/auth/login', undefined, { params: query }),
  /** 退出登录 */
  logout: () => httpDelete('/v1/auth/logout'),
  /** 刷新令牌 */
  refreshToken: (refreshToken: string) =>
    httpPost<AuthToken>('/v1/auth/refresh-token', undefined, { params: { refreshToken } }),
};

// ==================== 用户 ====================
export const userApi = {
  /** 用户分页列表 */
  getPage: (params: {
    pageNum: number;
    pageSize: number;
    keywords?: string;
    status?: number;
    deptId?: number;
    roleIds?: number[];
  }) => httpGet<PageResult<UserPageVO>>('/v1/users/page', { params }),
  /** 用户表单数据 */
  getForm: (userId: number) => httpGet<UserForm>(`/v1/users/${userId}/form`),
  /** 新增用户 */
  create: (data: UserForm) => httpPost('/v1/users', data),
  /** 修改用户 */
  update: (userId: number, data: UserForm) => httpPut(`/v1/users/${userId}`, data),
  /** 删除用户 */
  remove: (ids: string) => httpDelete(`/v1/users/${ids}`),
  /** 重置密码 */
  resetPassword: (userId: number, password: string) =>
    httpPut(`/v1/users/${userId}/password/reset`, undefined, { params: { password } }),
  /** 修改用户状态 */
  updateStatus: (userId: number, status: number) =>
    httpPatch(`/v1/users/${userId}/status`, undefined, { params: { status } }),
  /** 用户下拉选项 */
  getOptions: () => httpGet<OptionLong[]>('/v1/users/options'),
  /** 当前登录用户信息 */
  getCurrentUser: () => httpGet<CurrentUser>('/v1/users/me'),
};

// ==================== 个人中心 ====================
export const profileApi = {
  /** 获取个人中心用户信息 */
  get: () => httpGet<UserProfileVO>('/v1/users/profile'),
  /** 修改个人中心用户信息 */
  update: (data: UserProfileForm) => httpPut('/v1/users/profile', data),
  /** 修改密码 */
  changePassword: (data: PasswordUpdateForm) => httpPut('/v1/users/password', data),
};

// ==================== 角色 ====================
export const roleApi = {
  /** 角色分页列表 */
  getPage: (params: { pageNum: number; pageSize: number; keywords?: string }) =>
    httpGet<PageResult<RolePageVO>>('/v1/roles/page', { params }),
  /** 角色下拉列表 */
  getOptions: () => httpGet<OptionLong[]>('/v1/roles/options'),
  /** 角色表单数据 */
  getForm: (roleId: number) => httpGet<RoleForm>(`/v1/roles/${roleId}/form`),
  /** 新增角色 */
  create: (data: RoleForm) => httpPost('/v1/roles', data),
  /** 修改角色 */
  update: (id: number, data: RoleForm) => httpPut(`/v1/roles/${id}`, data),
  /** 删除角色 */
  remove: (ids: string) => httpDelete(`/v1/roles/${ids}`),
  /** 修改角色状态 */
  updateStatus: (roleId: number, status: number) =>
    httpPut(`/v1/roles/${roleId}/status`, undefined, { params: { status } }),
  /** 获取角色的菜单ID集合 */
  getMenuIds: (roleId: number) => httpGet<number[]>(`/v1/roles/${roleId}/menuIds`),
  /** 角色分配菜单权限 */
  assignMenus: (roleId: number, menuIds: number[]) =>
    httpPut(`/v1/roles/${roleId}/menus`, menuIds),
};

// ==================== 菜单 ====================
export const menuApi = {
  /** 菜单列表（树形） */
  getList: () => httpGet<MenuVO[]>('/v1/menus'),
  /** 菜单下拉列表 */
  getOptions: () => httpGet<OptionLong[]>('/v1/menus/options'),
  /** 菜单表单数据 */
  getForm: (id: number) => httpGet<MenuForm>(`/v1/menus/${id}/form`),
  /** 新增菜单 */
  create: (data: MenuForm) => httpPost('/v1/menus', data),
  /** 修改菜单 */
  update: (id: number, data: MenuForm) => httpPut(`/v1/menus/${id}`, data),
  /** 删除菜单 */
  remove: (id: number) => httpDelete(`/v1/menus/${id}`),
  /** 修改菜单显示状态 */
  toggleVisible: (menuId: number, visible: number) =>
    httpPatch(`/v1/menus/${menuId}`, undefined, { params: { visible } }),
};

// ==================== 部门 ====================
export const deptApi = {
  /** 部门列表（树形） */
  getList: () => httpGet<DeptVO[]>('/v1/dept'),
  /** 部门下拉列表 */
  getOptions: () => httpGet<OptionLong[]>('/v1/dept/options'),
  /** 部门表单数据 */
  getForm: (deptId: number) => httpGet<DeptForm>(`/v1/dept/${deptId}/form`),
  /** 新增部门 */
  create: (data: DeptForm) => httpPost('/v1/dept', data),
  /** 修改部门 */
  update: (deptId: number, data: DeptForm) => httpPut(`/v1/dept/${deptId}`, data),
  /** 删除部门 */
  remove: (ids: string) => httpDelete(`/v1/dept/${ids}`),
};

// ==================== 字典 ====================
export const dictApi = {
  /** 字典分页列表 */
  getPage: (params: { pageNum: number; pageSize: number; keywords?: string }) =>
    httpGet<PageResult<DictPageVO>>('/v1/dicts/page', { params }),
  /** 字典列表（全部） */
  getList: () => httpGet<DictPageVO[]>('/v1/dicts'),
  /** 字典表单数据 */
  getForm: (id: number) => httpGet<DictForm>(`/v1/dicts/${id}/form`),
  /** 新增字典 */
  create: (data: DictForm) => httpPost('/v1/dicts', data),
  /** 修改字典 */
  update: (id: number, data: DictForm) => httpPut(`/v1/dicts/${id}`, data),
  /** 删除字典 */
  remove: (ids: string) => httpDelete(`/v1/dicts/${ids}`),
  /** 字典项分页列表 */
  getItemsPage: (dictCode: string, params: { pageNum: number; pageSize: number; keywords?: string }) =>
    httpGet<PageResult<DictItemPageVO>>(`/v1/dicts/${dictCode}/items/page`, { params }),
  /** 字典项列表（全部） */
  getItems: (dictCode: string) => httpGet<DictItemOptionVO[]>(`/v1/dicts/${dictCode}/items`),
  /** 字典项表单数据 */
  getItemForm: (dictCode: string, itemId: number) =>
    httpGet<DictItemForm>(`/v1/dicts/${dictCode}/items/${itemId}/form`),
  /** 新增字典项 */
  createItem: (dictCode: string, data: DictItemForm) =>
    httpPost(`/v1/dicts/${dictCode}/items`, { ...data, dictCode }),
  /** 修改字典项 */
  updateItem: (dictCode: string, itemId: number, data: DictItemForm) =>
    httpPut(`/v1/dicts/${dictCode}/items/${itemId}`, data),
  /** 删除字典项 */
  removeItem: (dictCode: string, itemIds: string) =>
    httpDelete(`/v1/dicts/${dictCode}/items/${itemIds}`),
};

// ==================== 通知公告 ====================
export const noticeApi = {
  /** 通知公告分页列表 */
  getPage: (params: { pageNum: number; pageSize: number; title?: string }) =>
    httpGet<PageResult<NoticePageVO>>('/v1/notices/page', { params }),
  /** 通知详情 */
  getDetail: (id: number) => httpGet<NoticeDetailVO>(`/v1/notices/${id}/detail`),
  /** 通知表单数据 */
  getForm: (id: number) => httpGet<NoticeForm>(`/v1/notices/${id}/form`),
  /** 新增通知 */
  create: (data: NoticeForm) => httpPost('/v1/notices', data),
  /** 修改通知 */
  update: (id: number, data: NoticeForm) => httpPut(`/v1/notices/${id}`, data),
  /** 删除通知 */
  remove: (ids: string) => httpDelete(`/v1/notices/${ids}`),
  /** 发布通知 */
  publish: (id: number) => httpPut(`/v1/notices/${id}/publish`),
  /** 撤回通知 */
  revoke: (id: number) => httpPut(`/v1/notices/${id}/revoke`),
};

// ==================== 系统配置 ====================
export const configApi = {
  /** 系统配置分页列表 */
  getPage: (params: { pageNum: number; pageSize: number; keywords?: string }) =>
    httpGet<PageResult<ConfigVO>>('/v1/config/page', { params }),
  /** 系统配置表单数据 */
  getForm: (id: number) => httpGet<ConfigForm>(`/v1/config/${id}/form`),
  /** 新增系统配置 */
  create: (data: ConfigForm) => httpPost('/v1/config', data),
  /** 修改系统配置 */
  update: (id: number, data: ConfigForm) => httpPut(`/v1/config/${id}`, data),
  /** 删除系统配置 */
  remove: (id: number) => httpDelete(`/v1/config/${id}`),
  /** 刷新系统配置缓存 */
  refresh: () => httpPut('/v1/config/refresh'),
};

// ==================== 日志 ====================
export const logApi = {
  /** 日志分页列表 */
  getPage: (params: { pageNum: number; pageSize: number; keywords?: string; module?: string }) =>
    httpGet<PageResult<LogPageVO>>('/v1/logs/page', { params }),
  /** 访问统计 */
  getVisitStats: () => httpGet<VisitStatsVO>('/v1/logs/visit-stats'),
  /** 访问趋势 */
  getVisitTrend: () => httpGet<VisitTrendVO>('/v1/logs/visit-trend'),
};

// ==================== 台站 ====================
export const stationApi = {
  /** 台站分页列表 */
  getPage: (params: {
    pageNum: number;
    pageSize: number;
    keywords?: string;
    region?: string;
    status?: number;
  }) => httpGet<PageResult<SatStationPageVO>>('/v1/sat/stations/page', { params }),
  /** 台站下拉选项 */
  getOptions: () => httpGet<OptionLong[]>('/v1/sat/stations/options'),
  /** 台站详情表单 */
  getForm: (id: number) => httpGet<SatStationForm>(`/v1/sat/stations/${id}/form`),
  /** 台站运行总览 */
  getOverview: (id: number) => httpGet<SatStationOverviewVO>(`/v1/sat/stations/${id}/overview`),
  /** 新增台站 */
  create: (data: SatStationForm) => httpPost('/v1/sat/stations', data),
  /** 修改台站 */
  update: (id: number, data: SatStationForm) => httpPut(`/v1/sat/stations/${id}`, data),
  /** 删除台站 */
  remove: (id: number) => httpDelete(`/v1/sat/stations/${id}`),
};

// ==================== 看板 ====================
export const dashboardApi = {
  /** 全局运行总览 */
  getOverview: () => httpGet<SatDashboardOverviewVO>('/v1/sat/dashboard/overview'),
  /** 能耗统计 */
  getEnergyStats: (params?: { stationId?: number; startTime?: string; endTime?: string }) =>
    httpGet<DashboardEnergyStats>('/v1/sat/dashboard/energy-stats', { params }),
  /** 风险事件统计 */
  getRiskStats: (params?: { stationId?: number; startTime?: string; endTime?: string }) =>
    httpGet<DashboardRiskStats>('/v1/sat/dashboard/risk-stats', { params }),
};

// ==================== Snow 实时设备数据（单片机/网关上报） ====================
// 所有接口均通过 tag 标识台站设备；timeLevel: 1=小时/日/周粒度, 2=月/半年/年粒度
export const snowApi = {
  /** 系统实时详情（姿态/电源/温度/继电器/信号/雨雪等综合数据） */
  getDetail: (tag: number) =>
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag } }),
  /** 扩展信息（天线基础参数、台站元信息等） */
  getExtraInfo: (tag: number) =>
    httpGet<SnowExtraInfo>('/v1/snow/extra-info', { params: { tag } }),
  /** 功率历史（智能聚合，自动按区间选粒度） */
  getPowerChart: (params: SnowHistoryParams) =>
    httpGet<PowerChartItem[]>('/v1/snow/power-chart', { params }),
  /** 功率历史（按指定粒度聚合，timeLevel 控制粒度） */
  getPowerChartByLevel: (params: SnowHistoryParams) =>
    httpGet<PowerChartItem[]>('/v1/snow/power-chart-by-level', { params }),
  /** 温度历史（智能聚合） */
  getTemperatureChart: (params: SnowHistoryParams) =>
    httpGet<TemperatureChartItem[]>('/v1/snow/temperature-chart', { params }),
  /** 温度历史（按指定粒度聚合） */
  getTemperatureChartByLevel: (params: SnowHistoryParams) =>
    httpGet<TemperatureChartItem[]>('/v1/snow/temperature-chart-by-level', { params }),
  /** 系统数据历史（多指标折线图：信号/温度/电压/电流/功率等） */
  getDataHistory: (params: SnowHistoryParams) =>
    httpGet<SnowDataHistoryItem[]>('/v1/snow/data-history', { params }),
  /** 萤石云 AccessToken（直播/抓图前换取） */
  getYs7Token: () => httpGet<Ys7TokenVO>('/v1/snow/ys7-token'),
};

// ==================== 111.天气数据 ====================
export const weatherApi = {
  /** 三天天气预报 */
  getForecast: (stationId: number) =>
    httpGet<SatWeatherForecastVO>('/v1/sat/weather/forecast', { params: { stationId } }),
};

// ==================== 112.环境数据 ====================
export const environmentApi = {
  /** 当前环境数据(湿度/雨雪等) */
  getCurrent: (stationId: number) =>
    httpGet<SatEnvironmentCurrentVO>('/v1/sat/environment/current', { params: { stationId } }),
  /** 环境统计(雪天预测/实测) */
  getStats: (stationId: number, year?: number) =>
    httpGet<SatEnvironmentStatsVO>('/v1/sat/environment/stats', { params: { stationId, year } }),
};

// ==================== 113.日凌干扰 ====================
export const sunInterferenceApi = {
  /** 日凌干扰状态 */
  getStatus: (stationId: number) =>
    httpGet<SatSunInterferenceVO>('/v1/sat/sun-interference/status', { params: { stationId } }),
};

// ==================== 设备 ====================
export const deviceApi = {
  /** 设备分页列表 */
  getPage: (params: {
    pageNum: number;
    pageSize: number;
    keywords?: string;
    stationId?: number;
  }) => httpGet<PageResult<SatDevicePageVO>>('/v1/sat/devices/page', { params }),
  /** 设备详情表单 */
  getForm: (id: number) => httpGet<SatDeviceForm>(`/v1/sat/devices/${id}/form`),
  /** 新增设备 */
  create: (data: SatDeviceForm) => httpPost('/v1/sat/devices', data),
  /** 修改设备 */
  update: (id: number, data: SatDeviceForm) => httpPut(`/v1/sat/devices/${id}`, data),
  /** 删除设备 */
  remove: (id: number) => httpDelete(`/v1/sat/devices/${id}`),
  /** 标记故障 */
  markFault: (id: number) => httpPut(`/v1/sat/devices/${id}/fault`),
  /** 标记正常 */
  markNormal: (id: number) => httpPut(`/v1/sat/devices/${id}/normal`),
};

// ==================== 阈值配置 ====================
export const thresholdApi = {
  /** 获取台站阈值配置 */
  get: (stationId: number) => httpGet<SatThresholdVO>(`/v1/sat/thresholds/${stationId}`),
  /** 更新阈值配置并下发 */
  update: (data: SatThresholdForm) => httpPut('/v1/sat/thresholds', data),
  /** 阈值版本历史 */
  getVersions: (stationId: number) =>
    httpGet<SatThresholdVersionVO[]>(`/v1/sat/thresholds/${stationId}/versions`),
  /** 阈值版本回滚 */
  rollback: (stationId: number, versionId: number) =>
    httpPost(`/v1/sat/thresholds/${stationId}/rollback/${versionId}`),
};

// ==================== 融雪策略 ====================
export const strategyApi = {
  /** 获取台站融雪策略 */
  get: (stationId: number) => httpGet<SatSnowStrategyVO>(`/v1/sat/snow-strategies/${stationId}`),
  /** 更新融雪策略并下发 */
  update: (data: SatSnowStrategyForm) => httpPut('/v1/sat/snow-strategies', data),
  /** 批量应用融雪策略 */
  apply: (stationIds: number[], data: SatSnowStrategyForm) =>
    httpPost('/v1/sat/snow-strategies/apply', { ...data, stationIds }),
};

// ==================== 融雪执行日志 ====================
export const snowExecLogApi = {
  /** 融雪执行日志分页 */
  getPage: (params: {
    pageNum: number;
    pageSize: number;
    stationId?: number;
    status?: number;
    /** 执行类型：1=自动 2=手动 3=自测；不传则全部 */
    execType?: number;
  }) => httpGet<PageResult<SatSnowExecLogVO>>('/v1/sat/snow-exec-logs/page', { params }),
};

// ==================== 告警 ====================
export const alarmApi = {
  /** 告警规则列表 */
  getRules: () => httpGet<SatAlarmRule[]>('/v1/sat/alarms/rules'),
  /** 新增告警规则 */
  createRule: (data: SatAlarmRuleForm) => httpPost('/v1/sat/alarms/rules', data),
  /** 修改告警规则 */
  updateRule: (id: number, data: SatAlarmRuleForm) => httpPut(`/v1/sat/alarms/rules/${id}`, data),
  /** 删除告警规则 */
  removeRule: (id: number) => httpDelete(`/v1/sat/alarms/rules/${id}`),
  /** 告警记录分页 */
  getRecordsPage: (params: {
    pageNum: number;
    pageSize: number;
    stationId?: number;
    alarmType?: string;
    alarmLevel?: number;
    status?: number;
    startTime?: string;
    endTime?: string;
  }) => httpGet<PageResult<SatAlarmRecordVO>>('/v1/sat/alarms/records/page', { params }),
  /** 确认告警 */
  confirm: (id: number, remark?: string) =>
    httpPut(`/v1/sat/alarms/records/${id}/confirm`, remark ? { remark } : undefined),
  /** 处置告警 */
  handle: (id: number, remark?: string) =>
    httpPut(`/v1/sat/alarms/records/${id}/handle`, remark ? { remark } : undefined),
  /** 闭环告警 */
  close: (id: number, remark?: string) =>
    httpPut(`/v1/sat/alarms/records/${id}/close`, remark ? { remark } : undefined),
};

// ==================== 存储配置 ====================
export const storageConfigApi = {
  /** 存储配置列表 */
  getList: () => httpGet<SatStorageConfig[]>('/v1/sat/storage-config/list'),
  /** 批量更新存储配置 */
  batchUpdate: (configs: Record<string, string>) =>
    httpPut('/v1/sat/storage-config/batch', configs),
};

// ==================== AI 配置 ====================
export const aiConfigApi = {
  /** 获取 AI 配置 */
  get: () => httpGet<Record<string, any>>('/v1/sat/ai-config'),
  /** 更新 AI 配置 */
  update: (data: Record<string, any>) => httpPut('/v1/sat/ai-config', data),
};

// ==================== OTA 升级 ====================
export const otaApi = {
  /** 固件版本分页 */
  getVersionsPage: (params: { pageNum: number; pageSize: number }) =>
    httpGet<PageResult<SatOtaVersion>>('/v1/sat/ota/versions/page', { params }),
  /** 上传固件版本 */
  createVersion: (data: SatOtaVersionForm) => httpPost('/v1/sat/ota/versions', data),
  /** 升级任务分页 */
  getTasksPage: (params: { pageNum: number; pageSize: number }) =>
    httpGet<PageResult<SatOtaTask>>('/v1/sat/ota/tasks/page', { params }),
  /** 创建升级任务 */
  createTask: (data: SatOtaTaskForm) => httpPost('/v1/sat/ota/tasks', data),
};

// ==================== 摄像头(萤石) ====================
export const cameraApi = {
  /** 账号下设备列表 */
  getDevices: () => httpGet<Ys7DeviceVO[]>('/v1/sat/cameras/devices'),
  /** 获取萤石 AccessToken */
  getToken: () => httpGet<Ys7TokenVO>('/v1/sat/cameras/token'),
  /** 设备通道列表 */
  getChannels: (deviceSerial: string) =>
    httpGet<Ys7ChannelVO[]>(`/v1/sat/cameras/${deviceSerial}/channels`),
  /** 获取设备详情 */
  getDeviceInfo: (deviceSerial: string) =>
    httpGet<Ys7DeviceVO>(`/v1/sat/cameras/${deviceSerial}/info`),
  /** 获取设备在线状态 */
  getDeviceStatus: (deviceSerial: string) =>
    httpGet<number>(`/v1/sat/cameras/${deviceSerial}/status`),
  /** 获取直播/回放地址 */
  getLiveAddress: (params: { deviceSerial: string; channelNo?: number; protocol?: number }) =>
    httpGet<Ys7LiveAddressVO[]>('/v1/sat/cameras/live-address', { params }),
  /** 设备抓图 */
  capture: (deviceSerial: string, channelNo: number) =>
    httpPost<Ys7CaptureVO>(`/v1/sat/cameras/${deviceSerial}/capture`, undefined, {
      params: { channelNo },
    }),
};

// ==================== 文件上传 ====================
export const fileApi = {
  /** 文件上传 */
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpPost<{ url: string; name?: string }>('/v1/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
