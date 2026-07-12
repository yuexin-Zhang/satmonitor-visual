# 驾驶舱大屏 UI → API 数据映射文档

> 本文档详细列出驾驶舱大屏（`/` 路由）上每一块 UI 数据来源、对应的接口、请求参数、响应结构以及集成状态。
> 文档对应代码：`src/components/*`、`src/http/api.ts`、`src/http/types.ts`。

## 目录

- [全局说明](#全局说明)
- [可用接口总览（前端是否调用）](#可用接口总览前端是否调用)
- [1. Header 顶部栏](#1-header-顶部栏)
- [2. AntennaInfo 天线信息（左上）](#2-antennainfo-天线信息左上)
- [3. PositionStatus 位移状况（嵌入 AntennaInfo）](#3-positionstatus-位移状况嵌入-antennainfo)
- [4. SunInterference 日凌信息](#4-suninterference-日凌信息)
- [5. LiveVideo 实时画面监控](#5-livevideo-实时画面监控)
- [6. AntennaDisplay 天线监控（中央 iframe）](#6-antennadisplay-天线监控中央-iframe)
- [7. MaintenanceTips 智能运检提示](#7-maintenancetips-智能运检提示)
- [8. EnvironmentalInfo 气象&融雪](#8-environmentalinfo-气象融雪)
- [9. PowerInfo 电源信息](#9-powerinfo-电源信息)
- [10. OperationsRecord 运维记录](#10-operationsrecord-运维记录)
- [11. ThresholdBarChart 通用柱状图（内部组件）](#11-thresholdbarchart-通用柱状图内部组件)
- [12. Footer 底部状态栏](#12-footer-底部状态栏)
- [13. AlertListDialog / AlertImageDialog 报警弹窗](#13-alertlistdialog--alertimagedialog-报警弹窗)
- [汇总：未集成/无后端对应的部分](#汇总未集成无后端对应的部分)

---

## 全局说明

### 路径前缀与代理

- axios `baseURL = '/api'`（dev），Vite proxy 不做 rewrite。
- 代码中所有 `/v1/xxx` 实际请求到 `http://8.145.43.245:8989/api/v1/xxx`，与 Swagger 一致。
- 响应统一包装 `{ code: '00000', msg, data }`，由 `client.ts` 响应拦截器剥出 `data`。

### 设备标识

- 大屏默认展示单台站设备，硬编码 `tag = 1`。
- `/v1/snow/*` 接口用 `tag` query 参数（来自 `SatStation.tag`）。
- `/v1/sat/*` 接口用 `stationId`（来自登录用户 `CurrentUser.stationId`）。前端通过
  `getStationIdFromStorage()`（`src/http/client.ts`）从 `localStorage.monitor_user` 读取；
  未登录或无绑定台站时传 `undefined`（全局聚合）或回退默认值。

### 认证模式（重要）

后端 Swagger 暴露的接口分两类，认证要求不同（已实测确认）：

| 路径前缀 | 认证要求 | 说明 |
|---------|---------|------|
| `/v1/snow/*` | ❌ **公开免认证** | legacy 单片机/网关上报接口，包含 detail / power-chart / temperature-chart / data-history / ys7-token 等 |
| `/v1/sat/*` | ✅ **必须有效 Bearer token** | 新管理接口，包含 cameras / stations / alarms / snow-exec-logs / dashboard / thresholds 等 |

**对大屏的影响**：
- 调 `/v1/snow/*` 的模块（Header / AntennaInfo / EnvironmentalInfo / PowerInfo）**始终可用**，不依赖登录。
- 调 `/v1/sat/*` 的模块（AntennaInfo 阈值与风险统计 / LiveVideo 第 1 级 / MaintenanceTips / OperationsRecord / EnvironmentalInfo 融雪统计 / PowerInfo 能耗统计）**要求 `monitor_token` 是真实 JWT**。
- 监管端登录 `Monitor/Login.tsx` 调 `authApi.login()` 真实登录，拿到合法 JWT 后所有 `/v1/sat/*` 自动可用。

### 集成状态图例

| 标记 | 含义 |
|------|------|
| ✅ 已集成 | 已接入真实后端 API（接口失败时显示空状态/占位，不再使用 mock 数据） |
| 🟡 中性默认 | 后端无对应接口或字段，使用固定常量占位（**非随机 mock**） |
| 🔵 待后端补充 | Swagger 暂无对应接口，建议后端新增 |
| ⚪ 纯前端 | 无需后端，纯客户端逻辑/计算 |
| **(mock)** | UI 上显示的琥珀色小标记，表示该数据为中性默认值，非后端实时接口返回 |

> **关于 mock 数据**：本次改造已全面移除 `MOCK_DASHBOARD_CONFIG` 在大屏组件中的使用。
> 凡后端有接口的字段一律改为真实调用；无接口的字段使用**中性静态常量**（如 0、`暂无数据`、
> 固定默认值），不再注入随机/虚假数据。原 `src/http/mock.ts` 文件保留但大屏不再引用。
>
> **关于 (mock) 标记**：为方便区分真实接口数据和默认值，在 UI 上对使用静态常量的字段添加了
> **(mock)** 标记（琥珀色小字体）。包括：卫星名称/方位角/仰角/频率（AntennaInfo）、
> 温度/功率阈值（ThresholdBarChart）。

---

## 可用接口总览（前端是否调用）

> 列出 `src/http/api.ts` 中封装的全部接口，以及大屏是否真正调用。
> 之前部分接口「未调用」的原因：它们虽在 `api.ts` 中封装了（Swagger 暴露），但对应 UI 字段
> 当时直接读 `MOCK_DASHBOARD_CONFIG`，未走真实接口。本次改造已把这些「能用的 API」全部接入。

### snowApi（`/v1/snow/*`，公开免认证）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getDetail` | `GET /v1/snow/detail` | ✅ 调用 | Header / AntennaInfo / EnvironmentalInfo / PowerInfo |
| `getExtraInfo` | `GET /v1/snow/extra-info` | ⚪ 未调用 | 实测仅返回 `{relayStates:[...]}`，与 `detail.relays` 重复，大屏暂不需要 |
| `getPowerChart` | `GET /v1/snow/power-chart` | ⚪ 未调用 | 用其按粒度聚合版本 `getPowerChartByLevel` 代替 |
| `getPowerChartByLevel` | `GET /v1/snow/power-chart-by-level` | ✅ 调用 | PowerInfo 功率曲线 |
| `getTemperatureChart` | `GET /v1/snow/temperature-chart` | ⚪ 未调用 | 用其按粒度聚合版本 `getTemperatureChartByLevel` 代替 |
| `getTemperatureChartByLevel` | `GET /v1/snow/temperature-chart-by-level` | ✅ 调用 | EnvironmentalInfo 温度趋势 |
| `getDataHistory` | `GET /v1/snow/data-history` | ✅ 调用 | AntennaInfo 信号强度柱状图 |
| `getYs7Token` | `GET /v1/snow/ys7-token` | ✅ 调用 | LiveVideo 第 2 级降级取流（**本次接入**） |

### dashboardApi（`/v1/sat/dashboard/*`，需登录）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getOverview` | `GET /v1/sat/dashboard/overview` | ⚪ 未调用 | 多台站总览用，单站大屏暂不需要 |
| `getEnergyStats` | `GET /v1/sat/dashboard/energy-stats` | ✅ 调用 | PowerInfo 年度累计耗电 |
| `getRiskStats` | `GET /v1/sat/dashboard/risk-stats` | ✅ 调用 | AntennaInfo 信号/偏移预警次数 |

### stationApi（`/v1/sat/stations/*`，需登录）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getOverview` | `GET /v1/sat/stations/{stationId}/overview` | ✅ 调用 | Footer 底部状态栏 NETWORK 在线状态 / LAST_REPORT（**本次接入**） |
| `getPage` / `getForm` / `create` / `update` / `remove` / `getOptions` | CRUD | ⚪ 未调用 | 属管理后台（Admin 台站管理页），大屏不需要 |

### thresholdApi（`/v1/sat/thresholds/*`，需登录）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `get` | `GET /v1/sat/thresholds/{stationId}` | ✅ 调用 | AntennaInfo 信号阈值 signalMin（**本次接入**） |

### cameraApi（`/v1/sat/cameras/*`，需登录）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getLiveAddress` | `GET /v1/sat/cameras/live-address` | ✅ 调用 | LiveVideo 第 1 级取流 |
| `capture` | `POST /v1/sat/cameras/{deviceSerial}/capture` | ✅ 调用 | MaintenanceTips 报警抓拍（**本次接入**） |

### alarmApi（`/v1/sat/alarms/*`，需登录）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getRecordsPage` | `GET /v1/sat/alarms/records/page` | ✅ 调用 | MaintenanceTips / OperationsRecord |
| `close` | `PUT /v1/sat/alarms/records/{id}/close` | ✅ 调用 | MaintenanceTips 标记处理 |

### snowExecLogApi（`/v1/sat/snow-exec-logs/*`，需登录）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getPage` | `GET /v1/sat/snow-exec-logs/page` | ✅ 调用 | OperationsRecord 运维记录 / EnvironmentalInfo 融雪统计（按 execType 聚合，**本次接入**） |

### weatherApi（`/v1/sat/weather/*`，需登录，111.天气数据）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getForecast` | `GET /v1/sat/weather/forecast` | ✅ 调用 | EnvironmentalInfo 三天天气卡片（**本次接入**） |

### environmentApi（`/v1/sat/environment/*`，需登录，112.环境数据）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getCurrent` | `GET /v1/sat/environment/current` | ✅ 调用 | EnvironmentalInfo 湿度（**本次接入**） |
| `getStats` | `GET /v1/sat/environment/stats` | ✅ 调用 | EnvironmentalInfo 雪天预测/实测统计（**本次接入**） |

### sunInterferenceApi（`/v1/sat/sun-interference/*`，需登录，113.日凌干扰）

| 接口 | 方法 & 路径 | 大屏是否调用 | 调用位置 |
|------|------------|:----------:|---------|
| `getStatus` | `GET /v1/sat/sun-interference/status` | ✅ 调用 | SunInterference 日凌信息（**本次接入**） |

> 说明：标 ⚪ 的接口并非「遗漏」，而是功能上被其它接口覆盖（如 `getXxxChart` 被聚合版覆盖、
> `getExtraInfo` 被含更全字段的 `getDetail` 覆盖、`getOverview` 属多站总览）。如后续需要可随时接入。

---

## 1. Header 顶部栏

**组件文件**: `src/components/Header.tsx`

| UI 元素 | 数据字段 | 来源 | 接口 / 实现 |
|---------|---------|------|-------------|
| 站点名称（左上角） | `organizationName` | ✅ | `GET /v1/snow/detail?tag=1` → `SystemDetail.organizationName`，失败时回退中性占位 `监测台站` |
| 中央主标题「卫星天线智能可视化监管」 | 静态字符串 | ⚪ | 硬编码 |
| 右上角日期 YYYY.MM.DD | — | ⚪ | `dayjs().format('YYYY.MM.DD')` |
| 右上角实时时钟 HH:mm:ss | — | ⚪ | `setInterval(() => dayjs(), 1000)` |
| 右上角退出按钮 | — | ⚪ | 清除 `monitor_token` / `monitor_user`，跳转 `/login` |

**接口调用示例**：
```
GET /api/v1/snow/detail?tag=1
→ { organizationName: '淳安广播转播台', yaw, roll, pitch, voltage, ... }
```

**API 封装**：`snowApi.getDetail(tag)` （`src/http/api.ts`）

---

## 2. AntennaInfo 天线信息（左上）

**组件文件**: `src/components/AntennaInfo.tsx`

| UI 元素 | 数据字段 | 来源 | 接口 / 实现 |
|---------|---------|------|-------------|
| 卫星名称 | `satellite` | 🟡 | 静态常量（后端 `/v1/snow/extra-info` 实测**仅返回 relayStates**，不含卫星/方位/仰角/频率）；**UI 显示 (mock) 标记** |
| 方位角 | `azimuth` | 🟡 | 同上，静态常量；**UI 显示 (mock) 标记** |
| 仰角 | `elevation` | 🟡 | 同上，静态常量；**UI 显示 (mock) 标记** |
| 频率名称 | `frequency.name` | 🟡 | 同上，静态常量；**UI 显示 (mock) 标记** |
| 频率值 | `frequency.value` | 🟡 | 同上，静态常量；**UI 显示 (mock) 标记** |
| 极化方式 | `frequency.polarization` | 🟡 | 同上，静态常量；**UI 显示 (mock) 标记** |
| 符号率 | `frequency.symbolRate` | 🟡 | 同上，静态常量；**UI 显示 (mock) 标记** |
| 位移状况·水平 | `displacement.horizontal` | 🟡 | 静态常量（`detail.yaw` 是文本「正常」非角度，无法直接换算） |
| 位移状况·垂直 | `displacement.vertical` | 🟡 | 同上，静态常量 |
| 位移状况·状态 | `displacement.status` | 🟡 | 静态常量；**UI 显示 (mock) 标记** |
| 实时信号强度百分比 | `signalStrength` | ✅ | `GET /v1/snow/detail?tag=1` → `SystemDetail.signalStrength`（字符串如 `"92"`） |
| 强度预警状态 | — | ✅ | 由实时 `signalStrength` 与阈值比较计算（低于阈值显示「预警」，否则「正常」） |
| **信号强度柱状图（含时间范围切换）** | signal history | ✅ | `GET /v1/snow/data-history?tag=1&startTime=&endTime=&timeLevel=1\|2` → 取 `signalStrength`；无数据显示「暂无数据」占位 |
| 阈值线 | `config.signalMin` | ✅ | `GET /v1/sat/thresholds/{stationId}` → 防御性读取 `config.signalMin`；接口失败回退默认 70 |
| 本年度·信号强度预警次数 | riskStats.signal | ✅ | `GET /v1/sat/dashboard/risk-stats?stationId=&startTime=&endTime=` 防御性读取计数 |
| 本年度·天线偏移预警次数 | riskStats.offset | ✅ | 同上 |

**关键接口**：

```http
# 实时设备详情
GET /api/v1/snow/detail?tag=1
Response: SystemDetail {
  organizationName, yaw, roll, pitch,
  voltage, current, power, energy,
  relays[], tempsensors[],
  rainSnow, airTemperature, potTemperature,
  signalStrength
}

# 信号强度历史（多指标折线图，自动包含 signalStrength）
GET /api/v1/snow/data-history?tag=1&startTime=2026-06-20%2000:00:00&endTime=2026-06-27%2023:59:59&timeLevel=1
Response: SnowDataHistoryItem[] = [{ time, signalStrength, airTemperature, voltage, ... }]

# 信号阈值（本次新增）
GET /api/v1/sat/thresholds/{stationId}
Response: SatThresholdVO { id, stationId, config, version, syncStatus, syncTime, updateTime }
# 前端读取 config.signalMin（config 可能是对象或 JSON 字符串，字段名做兼容：signalMin / signalStrengthMin / minSignal）

# 年度风险统计（本次新增）
GET /api/v1/sat/dashboard/risk-stats?stationId=1&startTime=2026-01-01%2000:00:00&endTime=2026-12-31%2023:59:59
Response: DashboardRiskStats（后端自定义结构，前端防御性读取 signalAlertCount / offsetAlertCount 等字段）
```

**API 封装**：
- `snowApi.getDetail(1)`
- `snowApi.getDataHistory({ tag, startTime, endTime, timeLevel })`
- `thresholdApi.get(stationId ?? 1)` — **本次新增**
- `dashboardApi.getRiskStats({ stationId, startTime, endTime })` — **本次新增**

**时间范围映射**：
| UI 按钮 | startTime 计算 | endTime | timeLevel |
|---------|----------------|---------|-----------|
| 小时 | now - 1h | today 23:59:59 | 1 |
| 日 | today 00:00:00 | today 23:59:59 | 1 |
| 周 | today - 7d | today 23:59:59 | 1 |
| 月 | today - 30d | today 23:59:59 | 2 |
| 6 个月 | today - 180d | today 23:59:59 | 2 |
| 年 | today - 1y | today 23:59:59 | 2 |

---

## 3. PositionStatus 位移状况（嵌入 AntennaInfo）

**组件文件**: `src/components/PositionStatus.tsx`

> ⚠️ **当前未渲染**：`Dashboard.tsx` 中虽然 `import` 了该组件，但 JSX 里并未挂载（功能与 `AntennaInfo` 重叠，已被 AntennaInfo 覆盖）。
> 组件内部代码仍在（`httpGet('/v1/snow/detail')` 取 yaw/roll/pitch），位移与预警次数均为常量占位。如需启用，需在 `Dashboard.tsx` 中重新挂载并把预警次数接入 `dashboardApi.getRiskStats`。

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| 水平位移 | `horizontal` | 🟡 | 静态常量（`0.001°`） |
| 垂直位移 | `vertical` | 🟡 | 静态常量（`-0.002°`） |
| 偏航角 yaw | `yaw` | ✅ | `GET /v1/snow/detail?tag=1` → `SystemDetail.yaw`（组件代码已接，但组件未渲染） |
| 横滚角 roll | `roll` | ✅ | 同上 → `SystemDetail.roll` |
| 俯仰角 pitch | `pitch` | ✅ | 同上 → `SystemDetail.pitch` |
| 状态「正常」 | `status` | 🟡 | 静态常量 |
| 信号强度预警次数 | `signalAlertCount` | 🟡 | 静态常量 `0`（组件未渲染，未接 risk-stats；运行时由 AntennaInfo 承载） |
| 天线偏移预警次数 | `offsetAlertCount` | 🟡 | 静态常量 `0`（同上） |

---

## 4. SunInterference 日凌信息

**组件文件**: `src/components/SunInterference.tsx`

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| 日凌标签 | — | ⚪ | 静态 |
| 今日是否有预警 | `todayAlert` | ✅ | `GET /v1/sat/sun-interference/status?stationId=` → `SatSunInterferenceVO.todayAlert`（**本次接入**）；接口失败回退默认 `false` |
| 距离最近日凌时间 | `nextPeriod` | ✅ | 同上 → `SatSunInterferenceVO.nextPeriod`（**本次接入**）；接口失败回退默认 `暂无数据` |
| 本年度预警累计次数 | `yearlyCount` | ✅ | 同上 → `SatSunInterferenceVO.yearlyCount`（**本次接入**）；接口失败回退默认 `0` |

**关键接口**：

```http
# 日凌干扰状态（本次新增，113.日凌干扰）
GET /api/v1/sat/sun-interference/status?stationId=1
Response: SatSunInterferenceVO = {
  stationId: 1,
  todayAlert: false,
  nextPeriod: '2026-07-15 14:30 ~ 15:00',
  yearlyCount: 3
}
```

**API 封装**：`sunInterferenceApi.getStatus(stationId)`（`src/http/api.ts`）— **本次接入**

**刷新策略**：每 5 分钟自动轮询一次。

---

## 5. LiveVideo 实时画面监控

**组件文件**: `src/components/LiveVideo.tsx`

**取流采用三级降级策略**，按顺序尝试，任一成功即停止：

```
1) /v1/sat/cameras/live-address   (后端封装，自动管理 ys7 token)
   ↓ 401 / 失败 / 返回空
2) /v1/snow/ys7-token + 萤石开放 API  (公开免认证，前端直连萤石)
   ↓ 失败 / ret=60060 未绑定
3) 硬编码兜底 URL  (可能已过期，会触发 onError)
```

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| **视频流地址（HLS / iframe）** | `streamUrl` | ✅ | 第 1 级 `GET /v1/sat/cameras/live-address` → 优先 HLS（`.m3u8`），次选 `playerUrl`（iframe 模式）；失败降级第 2 级；仍失败用兜底 URL |
| 流名称 | `streamName` | ✅ | 由 `deviceSerial_channelNo` 拼接，来自接口响应或默认 `GN1818878_1` |
| 播放模式 | `useIframe` | ⚪ | true=iframe 模式（playerUrl），false=ReactPlayer 模式（HLS） |
| 启用状态 | `enabled` | ⚪ | 组件 prop，默认 `true` |
| 过期自动刷新 | — | ✅ | 根据 `expireTime` 提前 5 分钟重新拉取；无 expireTime 时 30 分钟轮询；萤石直连模式 24 小时刷新 |
| REC 闪烁标识 | — | ⚪ | 前端 UI |
| 加载/错误/重试 | — | ⚪ | ReactPlayer / iframe 播放状态 + 8 秒自动重试 |

**关键接口**：

```http
# 第 1 级：后端 live-address（封装萤石，需登录态）
GET /api/v1/sat/cameras/live-address?deviceSerial=GN1818878&channelNo=1&protocol=1
# 注意：后端实际返回格式为单个对象（非数组），前端已做兼容处理
Response: Ys7LiveAddressVO = {
  deviceSerial, channelNo,
  url,              // ezopen:// 协议地址（ReactPlayer 不支持）
  ezopenUrl,        // ezopen:// 协议地址
  playerUrl,        // H5 iframe 嵌入地址（当前使用）
  expireTime, accessToken
}
# 如后端返回格式变更为数组，前端也已兼容：Ys7LiveAddressVO[]

# 第 2 级：公开 ys7-token（免认证）
GET /api/v1/snow/ys7-token
Response: Ys7TokenVO { accessToken, expireTime }

# 第 2 级后续：用 token 直调萤石开放 API（前端 fetch）
POST https://open.ys7.com/api/lapp/live/address/get
Body: accessToken=<token>&source=GN1818878:1
Response: { code:"200", data:[{ hls, hlsHd, status, exception, ret, desc }] }
# 注意：ret=60060 "The address is unbound" 表示萤石账号未开通直播权限
# ret=9048 "免费版并发数达到上限" 表示萤石账号免费版并发限制
```

**API 封装**：
- `cameraApi.getLiveAddress({ deviceSerial, channelNo, protocol })` — 第 1 级
- `snowApi.getYs7Token()` — 第 2 级前置
- 萤石开放 API 由组件内 `fetch` 直接调用 — 第 2 级

**已知限制**（截至 2026-07-02 实测）：
- 后端 `/v1/sat/cameras/live-address` 返回单个对象而非数组，前端已兼容
- 后端返回 `playerUrl`（iframe 嵌入地址）而非标准 HLS 流，前端已支持 iframe 模式
- 萤石账号返回 `ret=60060 "The address is unbound"` 表示未开通直播权限
- 萤石账号返回 `ret=9048 "免费版并发数达到上限"` 表示免费版并发限制（需等待或升级）
- WebSocket 错误 `Received unexpected continuation frame` 通常由并发限制或网络问题导致

**调试信息**：每级失败会 `console.warn` 打印原因，浏览器 Network 可看到完整请求链路；`source` state 标记当前命中级别（`backend` / `ys7-direct` / `fallback`）。

---

## 6. AntennaDisplay 天线监控（中央 iframe）

**组件文件**: `src/components/AntennaDisplay.tsx`

| UI 元素 | 来源 | 说明 |
|---------|------|------|
| 3D 天线监控视图 | ⚪ iframe | 嵌入 `http://8.145.43.245:8082/`（外部 3D 可视化服务） |

**说明**：该模块为独立外部服务，不通过本仓后端 Swagger API。如需深度集成，需与外部服务团队协商接口。

---

## 7. MaintenanceTips 智能运检提示

**组件文件**: `src/components/MaintenanceTips.tsx`

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| 报警/正常状态切换 | `isAlerting` | ✅ | 由后端告警记录驱动；`alarmApi.getRecordsPage({status:0})` 有数据则报警 |
| 报警音效（WebAudio 振荡器） | — | ⚪ | 前端 `useAlarmSound` hook |
| 静音开关 | — | ⚪ | 前端 state |
| 正常态文案 | — | ⚪ | 固定文案「系统运行正常，暂无异常告警。」 |
| 最新报警消息 | `latestPending.message` | ✅ | `GET /v1/sat/alarms/records/page?status=0` → `SatAlarmRecordVO.content` |
| 报警时间 | `latestPending.time` | ✅ | 同上 → `triggerTime` |
| 待处理数量 | `pendingCount` | ✅ | 同上，统计 `status=0` 的记录数 |
| 「查看全部报警」按钮 + 报警列表弹窗 | alerts[] | ✅ | 同上，同时拉 `status=0`（待处理）和 `status=1`（已确认）合并 |
| 「标记处理」按钮 | — | ✅ | 前端乐观更新 + `PUT /v1/sat/alarms/records/{id}/close`，并写入 localStorage 标记 |
| 「查看详情」/ 图片弹窗 | picUrl | ✅ | 点击时实时调 `POST /v1/sat/cameras/{deviceSerial}/capture` 获取抓拍（**本次接入**）；抓图中显示 loading，失败显示错误占位 |

**关键接口**：

```http
# 拉取待处理告警
GET /api/v1/sat/alarms/records/page?pageNum=1&pageSize=50&status=0
Response: PageResult<SatAlarmRecordVO> = {
  list: [{ id, stationId, alarmType, title, content, status, triggerTime, ... }],
  total
}

# 拉取已确认告警（用于「已处理」Tab）
GET /api/v1/sat/alarms/records/page?pageNum=1&pageSize=50&status=1

# 闭环（标记处理）
PUT /api/v1/sat/alarms/records/{id}/close

# 实时抓拍（本次新增）
POST /api/v1/sat/cameras/GN1818878/capture?channelNo=1
Response: Ys7CaptureVO { deviceSerial, channelNo, picUrl }
```

**API 封装**：
- `alarmApi.getRecordsPage({ pageNum, pageSize, status })`
- `alarmApi.close(id)`
- `cameraApi.capture(deviceSerial, channelNo)` — **本次新增**

**刷新策略**：每 30 秒自动轮询一次告警列表。

---

## 8. EnvironmentalInfo 气象&融雪

**组件文件**: `src/components/EnvironmentalInfo.tsx`

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| 三天天气卡片（今天/明天/后天） | `weather[]` | ✅ | `GET /v1/sat/weather/forecast?stationId=` → today/tomorrow/dayAfterTomorrow（**本次接入**）；接口失败回退默认占位 |
| 雨雪传感器文本 | `rainSnow` | ✅ | `GET /v1/snow/detail?tag=1` → `SystemDetail.rainSnow` |
| 雨雪传感器状态（正常/异常） | — | ✅ | 基于 `rainSnow` 文本判断（正常态） |
| 湿度百分比 | `humidityAvg` | ✅ | `GET /v1/sat/environment/current?stationId=` → `SatEnvironmentCurrentVO.humidity`（**本次接入**）；接口失败回退默认 60 |
| **温度趋势柱状图（最近 6 小时）** | temp history | ✅ | `GET /v1/snow/temperature-chart-by-level?tag=1&startTime=&endTime=&timeLevel=1` → 取空气温度传感器；无数据显示「暂无数据」占位 |
| 温度阈值（35°C） | — | 🟡 | 硬编码阈值；**UI 显示 (mock) 标记** |
| 本年度·天气预测有雪天数 | `snowForecastDays` | ✅ | `GET /v1/sat/environment/stats?stationId=&year=` → `SatEnvironmentStatsVO.snowForecastDays`（**本次接入**）；接口失败回退默认 0 |
| 本年度·实测有雪累计次数 | `snowDetectedCount` | ✅ | 同上 → `SatEnvironmentStatsVO.snowDetectedCount`（**本次接入**）；接口失败回退默认 0 |
| 本年度·执行融雪测试次数 | `meltTests` | ✅ | `GET /v1/sat/snow-exec-logs/page?execType=3` 取 `total`（**本次接入**） |
| 本年度·执行融雪功能次数 | `meltExecutions` | ✅ | `GET /v1/sat/snow-exec-logs/page` 取 `total`（**本次接入**） |

**注意**：锅面温度传感器数据（`tempsensors[]`、`airTemperature`、`potTemperature`）**已移除**，应在中间 3D 天线显示（AntennaDisplay）中展示。

**关键接口**：

```http
# 温度历史（按粒度聚合）
GET /api/v1/snow/temperature-chart-by-level?tag=1&startTime=2026-06-27%2000:00:00&endTime=2026-06-27%2023:59:59&timeLevel=1
Response: TemperatureChartItem[] = [{
  sensorName: '空气温度',
  time: '2026-06-27 14:00:00',
  temperature: 27.5,
  maxTemperature, minTemperature, sampleCount, timeLevel
}]

# 设备实时详情（含温度传感器、雨雪、空气/锅面温度）
GET /api/v1/snow/detail?tag=1

# 融雪执行日志（按 execType 统计，本次新增）
GET /api/v1/sat/snow-exec-logs/page?pageNum=1&pageSize=1&execType=3   # meltTests 取 total
GET /api/v1/sat/snow-exec-logs/page?pageNum=1&pageSize=1              # meltExecutions 取 total
# execType: 1=自动 2=手动 3=自测；可选 stationId 过滤

# 三天天气预报（本次新增）
GET /api/v1/sat/weather/forecast?stationId=1
Response: SatWeatherForecastVO = {
  stationId: 1,
  today:        { condition: '晴朗', temp: 27, icon: 'Sun' },
  tomorrow:     { condition: '多云', temp: 25, icon: 'Cloud' },
  dayAfterTomorrow: { condition: '小雨', temp: 23, icon: 'CloudRain' }
}

# 当前环境数据（湿度/雨雪等，本次新增）
GET /api/v1/sat/environment/current?stationId=1
Response: SatEnvironmentCurrentVO = {
  stationId, organizationName, humidity: 65, airTemperature: 27.5, rainSnow: '无雨雪'
}

# 环境统计（雪天预测/实测，本次新增）
GET /api/v1/sat/environment/stats?stationId=1&year=2026
Response: SatEnvironmentStatsVO = {
  stationId, year: 2026, snowForecastDays: 5, snowDetectedCount: 12
}
```

**API 封装**：
- `snowApi.getTemperatureChartByLevel({ tag, startTime, endTime, timeLevel })`
- `snowApi.getDetail(1)`
- `snowExecLogApi.getPage({ pageNum, pageSize, stationId, execType })` — **本次接入**
- `weatherApi.getForecast(stationId)` — **本次接入**（111.天气数据）
- `environmentApi.getCurrent(stationId)` — **本次接入**（112.环境数据）
- `environmentApi.getStats(stationId, year?)` — **本次接入**（112.环境数据）

**刷新策略**：每 1 小时刷新一次（`setInterval(fetchData, 3600_000)`）。

---

## 9. PowerInfo 电源信息

**组件文件**: `src/components/PowerInfo.tsx`

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| 电压 | `voltage` | ✅ | `GET /v1/snow/detail?tag=1` → `SystemDetail.voltage` |
| 电流 | `current` | ✅ | 同上 → `SystemDetail.current` |
| 本年度累计耗电 kWh | `yearlyConsumption` | ✅ | `GET /v1/sat/dashboard/energy-stats` 防御性读取累计用电量（**本次接入**） |
| **功率曲线柱状图（含时间范围切换）** | power history | ✅ | `GET /v1/snow/power-chart-by-level?tag=1&startTime=&endTime=&timeLevel=1\|2`；无数据显示「暂无数据」占位 |
| 功率阈值（4.2 kWh） | — | 🟡 | 硬编码阈值；**UI 显示 (mock) 标记** |

**注意**：继电器状态数据（`relays[]`）**已移除**，应在中间 3D 天线显示（AntennaDisplay）中展示。

**关键接口**：

```http
# 功率历史（按粒度聚合）
GET /api/v1/snow/power-chart-by-level?tag=1&startTime=2026-06-20%2000:00:00&endTime=2026-06-27%2023:59:59&timeLevel=2
Response: PowerChartItem[] = [{ time: '2026-06-20', value: 4.2 }]

# 年度累计耗电（本次新增）
GET /api/v1/sat/dashboard/energy-stats?stationId=1&startTime=2026-01-01%2000:00:00&endTime=2026-12-31%2023:59:59
Response: DashboardEnergyStats（后端自定义结构，前端兼容读取 yearlyConsumption / totalConsumption / totalEnergy / totalKwh 等）
```

**API 封装**：
- `snowApi.getDetail(1)`
- `snowApi.getPowerChartByLevel({ tag, startTime, endTime, timeLevel })`
- `dashboardApi.getEnergyStats({ stationId, startTime, endTime })` — **本次接入**

**时间范围映射**：同 AntennaInfo（小时/日/周 → timeLevel=1，月/半年/年 → timeLevel=2）。

---

## 10. OperationsRecord 运维记录

**组件文件**: `src/components/OperationsRecord.tsx`

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| 按日期分组的记录列表 | records[] | ✅ | 合并拉取 `alarmApi.getRecordsPage` + `snowExecLogApi.getPage`，按时间倒序；无数据显示空状态 |
| 空状态 | — | ⚪ | 接口无记录时展示「暂无运维记录」占位 |
| 单条记录·图标 | `iconType` | ⚪ | 根据 `alarmType` / `execType` / `status` 前端映射 |
| 单条记录·时间 | `time` | ✅ | `triggerTime`（告警）/ `startTime`（融雪日志）取 HH:mm |
| 单条记录·编码 | `code` | ✅ | `alarmType` / `SNOW-{id}` |
| 单条记录·标题 | `title` | ✅ | `SatAlarmRecordVO.title` / `自动/手动/自测启动加热` |
| 单条记录·副标题 | `subtitle` | ✅ | `SatAlarmRecordVO.content` / `triggerReason` |
| 日期分组标签（今天/昨天/具体日期） | `date` | ⚪ | 前端 `formatDateLabel()` 计算 |

**关键接口**：

```http
# 最近 30 天告警记录
GET /api/v1/sat/alarms/records/page?pageNum=1&pageSize=30&startTime=2026-05-28%2000:00:00&endTime=2026-06-27%2023:59:59
Response: PageResult<SatAlarmRecordVO>

# 融雪执行日志
GET /api/v1/sat/snow-exec-logs/page?pageNum=1&pageSize=30
Response: PageResult<SatSnowExecLogVO> = {
  list: [{
    id, stationId, stationName,
    execType (1=自动 2=手动 3=自测),
    triggerReason, startTime, endTime,
    status (0=执行中 1=成功 2=失败),
    createTime
  }]
}
```

**API 封装**：
- `alarmApi.getRecordsPage({ pageNum, pageSize, startTime, endTime })`
- `snowExecLogApi.getPage({ pageNum, pageSize })`

**图标映射规则**：
| alarmType 关键字 | 状态=pending | 状态=resolved |
|------------------|--------------|--------------|
| signal/信号 | `signal-fault` | `signal` |
| power/电源/电压/电流 | `power-fault` | `power` |
| temp/温度 | `temp-fault` | `temp` |
| rain/snow/雨雪 | `rain-snow-fault` | `rain-snow` |
| move/位移/offset | `move-fault` | `move` |
| antenna/天线 | `antenna-fault` | `antenna` |
| heat/加热 | `heat-fault` | `heat` |
| 其它 | `info` | `info` |

---

## 11. ThresholdBarChart 通用柱状图（内部组件）

**组件文件**: `src/components/ThresholdBarChart.tsx`

**纯展示组件**，被 AntennaInfo（信号强度）、EnvironmentalInfo（温度）、PowerInfo（功率）复用。

| Props | 类型 | 说明 |
|-------|------|------|
| `data` | `{ label, value }[]` | 柱状图数据，来自上游组件 |
| `threshold` | `number` | 阈值线，低于阈值显示红色 |
| `yMax` / `yTickInterval` | `number` / `number[]` | Y 轴范围 |
| `range` / `onRangeChange` | `TimeRange` | 时间范围切换（小时/日/周/月/6个月/年） |
| `unit` | `string` | 单位（%, °C, kWh） |

底层依赖 `@mui/x-charts/BarChart`。上游组件在接口无数据时统一传入 `[{ label: '暂无数据', value: 0 }]` 占位。

---

## 12. Footer 底部状态栏

**组件文件**: `src/components/Dashboard.tsx`（footer 部分）

| UI 元素 | 数据字段 | 来源 | 接口 |
|---------|---------|------|------|
| NETWORK: ONLINE / OFFLINE | `onlineStatus` | ✅ | `GET /v1/sat/stations/{stationId}/overview` → `SatStationOverviewVO.onlineStatus`（1=在线 绿灯，0=离线 红灯）；未登录或接口失败回退默认 ONLINE（**本次接入**） |
| DATABASE: CONNECTED | — | ⚪ | 静态（后端无对应健康检查接口） |
| ENCRYPTION: AES-256 | — | ⚪ | 静态（前端加密策略标识） |
| LAST_REPORT: 设备最后上报时间 | `lastReportTime` | ✅ | 同上 → `SatStationOverviewVO.lastReportTime`；无数据显示 `--`（替代原硬编码的 `SYSTEM_UPTIME: 142:55:12`，**本次接入**） |

**关键接口**：

```http
# 台站运行总览（需登录态）
GET /api/v1/sat/stations/{stationId}/overview
Response: SatStationOverviewVO {
  stationId, tag, stationName,
  onlineStatus,       // 1=在线 0=离线
  alarmCount,         // 未处理告警数（大屏未用，由 MaintenanceTips 独立拉取）
  todaySnowCount,     // 今日融雪执行次数（大屏未用，由 EnvironmentalInfo 独立拉取）
  realtimeData,       // 实时数据快照（大屏未用，由各面板独立拉取 snow/detail）
  lastReportTime      // 设备最后上报时间
}
```

**API 封装**：`stationApi.getOverview(stationId)`（`src/http/api.ts`）

**降级策略**：`getStationIdFromStorage()` 返回 `undefined`（未登录）时不发起请求，Footer 维持静态默认；请求失败同样回退默认，不阻塞渲染。

---

## 13. AlertListDialog / AlertImageDialog 报警弹窗

**组件文件**: `src/components/AlertListDialog.tsx`、`src/components/AlertImageDialog.tsx`

**纯 UI 组件**，数据来自 MaintenanceTips 传入的 `alerts[]`（已由 `alarmApi.getRecordsPage` 提供）。

| Tab | 数据来源 | 接口 |
|-----|---------|------|
| 待处理（pending） | `alerts.filter(a => a.status === 'pending')` | ✅ `alarmApi.getRecordsPage({status:0})` |
| 已处理（resolved） | `alerts.filter(a => a.status === 'resolved')` | ✅ `alarmApi.getRecordsPage({status:1})` |
| 「标记处理」按钮 | — | ✅ `alarmApi.close(id)` + 本地 localStorage |
| 「查看图片」按钮 | picUrl | ✅ 点击时 `cameraApi.capture` 实时抓拍，弹窗支持 loading / 错误态 |

`AlertImageDialog` 新增 `loading` / `errorText` 两个 props：抓图期间显示加载动画，失败显示原因占位。

---

## 汇总：未集成/无后端对应的部分

### 🔵 完全无后端接口（建议后端补充）

| UI 模块 | 字段 | 建议新增接口 |
|---------|------|-------------|
| AntennaInfo | satellite / azimuth / elevation / frequency / displacement | `extra-info` 实测无此数据，需后端新增专门接口（如 `/v1/sat/antenna/info`） |

> 以上字段当前均使用**中性静态常量**（0 / `暂无数据` / 固定默认值），不再注入随机 mock 数据。
> 注：原 Footer `SYSTEM_UPTIME` 无对应接口，已改用 `stationApi.getOverview` 的 `lastReportTime` 替代（见 §12），不再列入本表。
> 注：SunInterference（日凌）、EnvironmentalInfo（天气/湿度/雪天统计）已接入 111/112/113 接口，不再列入本表。

### ✅ 本次新接入的真实接口

| UI 模块 | 字段 | 接口 |
|---------|------|------|
| AntennaInfo | 信号阈值 signalMin | `GET /v1/sat/thresholds/{stationId}` |
| AntennaInfo | 信号/偏移预警次数 | `GET /v1/sat/dashboard/risk-stats` |
| PowerInfo | 年度累计耗电 | `GET /v1/sat/dashboard/energy-stats` |
| EnvironmentalInfo | 融雪测试/执行次数 | `GET /v1/sat/snow-exec-logs/page`（按 execType） |
| EnvironmentalInfo | 三天天气预报 | `GET /v1/sat/weather/forecast`（111.天气数据） |
| EnvironmentalInfo | 湿度 | `GET /v1/sat/environment/current`（112.环境数据） |
| EnvironmentalInfo | 雪天预测/实测统计 | `GET /v1/sat/environment/stats`（112.环境数据） |
| SunInterference | 日凌预警状态/时间/次数 | `GET /v1/sat/sun-interference/status`（113.日凌干扰） |
| MaintenanceTips | 报警抓拍图 | `POST /v1/sat/cameras/{deviceSerial}/capture` |
| Footer | NETWORK 在线状态 / LAST_REPORT | `GET /v1/sat/stations/{stationId}/overview` |

### ✅ 已完全集成的部分

| UI 模块 | 字段 | 接口 |
|---------|------|------|
| Header | organizationName | `/v1/snow/detail` |
| AntennaInfo | signalStrength（实时）/ 强度预警状态 / 信号阈值 / 预警次数 | `/v1/snow/detail` + `/v1/sat/thresholds` + `/v1/sat/dashboard/risk-stats` |
| AntennaInfo | 信号强度柱状图 | `/v1/snow/data-history` |
| LiveVideo | streamUrl / streamName（三级降级取流 + 过期自动刷新） | `/v1/sat/cameras/live-address` → `/v1/snow/ys7-token` + 萤石直连 → 兜底 URL |
| PositionStatus | yaw / roll / pitch | `/v1/snow/detail`（⚠️ 组件当前未渲染，见 §3） |
| EnvironmentalInfo | rainSnow / airTemperature / potTemperature / tempsensors | `/v1/snow/detail` |
| EnvironmentalInfo | 温度趋势柱状图 / 融雪统计 | `/v1/snow/temperature-chart-by-level` + `/v1/sat/snow-exec-logs/page` |
| EnvironmentalInfo | 三天天气 / 湿度 / 雪天统计 | `/v1/sat/weather/forecast` + `/v1/sat/environment/current` + `/v1/sat/environment/stats` |
| SunInterference | 日凌预警状态/时间/次数 | `/v1/sat/sun-interference/status` |
| PowerInfo | voltage / current / relays / 年度耗电 | `/v1/snow/detail` + `/v1/sat/dashboard/energy-stats` |
| PowerInfo | 功率曲线柱状图 | `/v1/snow/power-chart-by-level` |
| MaintenanceTips | 报警列表（待处理/已处理）/ 标记处理 / 抓拍图 | `/v1/sat/alarms/records/page` + `/v1/sat/alarms/records/{id}/close` + `/v1/sat/cameras/{serial}/capture` |
| OperationsRecord | 运维记录（告警+融雪合并） | `/v1/sat/alarms/records/page` + `/v1/sat/snow-exec-logs/page` |
| Footer | NETWORK 在线状态 / LAST_REPORT 最后上报 | `/v1/sat/stations/{stationId}/overview` |

---

## 附录：snowApi 完整接口清单

```ts
// src/http/api.ts
export const snowApi = {
  getDetail: (tag) => GET /v1/snow/detail?tag=                  // SystemDetail        ✅ 调用
  getExtraInfo: (tag) => GET /v1/snow/extra-info?tag=            // SnowExtraInfo       ⚪ 未调用(仅 relayStates,与 detail 重复)
  getPowerChart: (params) => GET /v1/snow/power-chart            // PowerChartItem[]    ⚪ 未调用(用 ByLevel 版)
  getPowerChartByLevel: (params) => GET /v1/snow/power-chart-by-level  // PowerChartItem[]  ✅ 调用
  getTemperatureChart: (params) => GET /v1/snow/temperature-chart       // TemperatureChartItem[]  ⚪ 未调用(用 ByLevel 版)
  getTemperatureChartByLevel: (params) => GET /v1/snow/temperature-chart-by-level  // TemperatureChartItem[]  ✅ 调用
  getDataHistory: (params) => GET /v1/snow/data-history          // SnowDataHistoryItem[]  ✅ 调用
  getYs7Token: () => GET /v1/snow/ys7-token                      // Ys7TokenVO         ✅ 调用
};

// params: { tag?: number; startTime?: string; endTime?: string; timeLevel?: 1|2 }
// startTime/endTime 格式: 'YYYY-MM-DD HH:mm:ss'
// timeLevel: 1=小时/日/周粒度, 2=月/半年/年粒度
```

## 附录：dashboardApi / thresholdApi / cameraApi / stationApi 接口清单

```ts
export const dashboardApi = {
  getOverview: () => GET /v1/sat/dashboard/overview              // SatDashboardOverviewVO  ⚪ 未调用(多站总览)
  getEnergyStats: (params?) => GET /v1/sat/dashboard/energy-stats  // DashboardEnergyStats  ✅ 调用(PowerInfo)
  getRiskStats: (params?) => GET /v1/sat/dashboard/risk-stats      // DashboardRiskStats    ✅ 调用(AntennaInfo)
};

export const thresholdApi = {
  get: (stationId) => GET /v1/sat/thresholds/{stationId}          // SatThresholdVO        ✅ 调用(AntennaInfo 信号阈值)
};

export const cameraApi = {
  getLiveAddress: (params) => GET /v1/sat/cameras/live-address    // Ys7LiveAddressVO[]    ✅ 调用(LiveVideo)
  capture: (deviceSerial, channelNo) => POST /v1/sat/cameras/{deviceSerial}/capture  // Ys7CaptureVO  ✅ 调用(MaintenanceTips 抓拍)
};

export const stationApi = {
  getOverview: (stationId) => GET /v1/sat/stations/{stationId}/overview  // SatStationOverviewVO  ✅ 调用(Footer 在线状态/最后上报)
  // 其余 getPage/getForm/create/update/remove/getOptions 属管理后台，大屏未用
};

export const weatherApi = {                           // 111.天气数据
  getForecast: (stationId) => GET /v1/sat/weather/forecast      // SatWeatherForecastVO  ✅ 调用(EnvironmentalInfo 三天天气)
};

export const environmentApi = {                      // 112.环境数据
  getCurrent: (stationId) => GET /v1/sat/environment/current    // SatEnvironmentCurrentVO  ✅ 调用(EnvironmentalInfo 湿度)
  getStats: (stationId, year?) => GET /v1/sat/environment/stats  // SatEnvironmentStatsVO  ✅ 调用(EnvironmentalInfo 雪天统计)
};

export const sunInterferenceApi = {                  // 113.日凌干扰
  getStatus: (stationId) => GET /v1/sat/sun-interference/status  // SatSunInterferenceVO  ✅ 调用(SunInterference)
};
```
