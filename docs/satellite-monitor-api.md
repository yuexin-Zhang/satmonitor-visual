# 卫星天线智能监管平台 — 接口文档

> 更新时间：2026-07-10  
> 在线文档（Knife4j）：http://8.145.43.245:8989/doc.html  
> OpenAPI：http://8.145.43.245:8989/v3/api-docs

---

## 1. 通用说明

### 1.1 环境

| 项 | 值 |
|----|----|
| Base URL | `http://8.145.43.245:8989` |
| 大屏地址 | `http://8.145.43.245:9000` |
| 视频 HLS（SRS） | `http://8.145.43.245:9000/live/chunan-cam1.m3u8` |

### 1.2 鉴权

```http
POST /api/v1/auth/login?username={user}&password={pass}
```

成功后在后续请求头携带：

```http
Authorization: Bearer {accessToken}
```

| 账号 | 密码 | 台站范围 |
|------|------|----------|
| `root` / `admin` | `123456` | 全局 |
| `chunan` | `123456` | 淳安台（stationId=1, tag=1） |
| `jiaxing` | `123456` | 嘉兴台（stationId=2, tag=2） |

> 白名单（可不带 Token）：`/api/v1/snow/**`、`/api/v1/sat/edge/**`（供单片机上报）

### 1.3 统一响应

```json
{
  "code": "00000",
  "msg": "一切ok",
  "data": {}
}
```

| code | 含义 |
|------|------|
| `00000` | 成功 |
| `A****` | 客户端/业务错误 |
| `B****` | 服务端错误 |

### 1.4 台站标识

| 字段 | 说明 | 示例 |
|------|------|------|
| `stationId` | 台站主键，管理端/天线配置用 | `1` 淳安，`2` 嘉兴 |
| `tag` | 单片机/历史数据标识 | `1` 淳安，`2` 嘉兴 |

非 root 账号会自动限制为本台站数据。

---

## 2. 大屏核心接口（近期重点）

### 2.1 摄像头实时画面

#### 获取直播地址

```http
GET /api/v1/sat/cameras/live-address
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceSerial | string | 否 | 设备序列号，如 `GN1818878` |
| stationId | long | 否 | 台站 ID（与 deviceSerial 二选一） |
| channelNo | int | 否 | 通道号，默认 1 |
| protocol | int | 否 | `1` ezopen / `2` HLS / `3` RTMP / `4` FLV |
| quality | int | 否 | `1` 高清 / `2` 流畅 |
| type | int | 否 | `1` 预览 / `2` 本地回放 / `3` 云回放 |

**响应 data 主要字段：**

| 字段 | 说明 |
|------|------|
| url | 主播放地址 |
| hls | HLS(m3u8) 地址（大屏优先） |
| flv | FLV 地址 |
| playerUrl | 萤石 H5 iframe 地址 |
| accessToken | 萤石 Token |
| expireTime | 过期时间 |

**大屏推荐：**

1. 优先播 SRS：`http://8.145.43.245:9000/live/chunan-cam1.m3u8`
2. 失败则用本接口 `protocol=2` 返回的 `hls` 直连萤石

#### 其它摄像头接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/sat/cameras/token` | 萤石 AccessToken |
| GET | `/api/v1/sat/cameras/{deviceSerial}/info` | 设备详情 |
| GET | `/api/v1/sat/cameras/{deviceSerial}/status` | 在线状态 |
| POST | `/api/v1/sat/cameras/{deviceSerial}/capture` | 抓图 |
| GET | `/api/v1/sat/cameras/devices` | 设备列表 |
| GET | `/api/v1/sat/cameras/{deviceSerial}/channels` | 通道列表 |

---

### 2.2 天线参数（卫星 / 方位角 / 仰角）

每个台站可独立配置并保存。

#### 获取配置

```http
GET /api/v1/sat/antenna/config?stationId=1
```

**响应示例：**

```json
{
  "code": "00000",
  "data": {
    "stationId": 1,
    "satellite": "中星6E 115.5°",
    "azimuth": "192°",
    "elevation": "40°",
    "frequency": {
      "name": "浙江一套",
      "value": 3825,
      "polarization": "垂直(V)",
      "symbolRate": 6780
    },
    "displacement": {
      "horizontal": "0°",
      "vertical": "0°",
      "roll": "0°",
      "status": "正常",
      "normalized": true,
      "normalizedAt": "2026-07-10 21:43:47"
    },
    "displacementBaseline": {
      "yaw": "-0.24",
      "pitch": "35.50",
      "roll": "-0.06",
      "normalizedAt": "2026-07-10 21:43:47"
    }
  }
}
```

#### 保存配置

```http
PUT /api/v1/sat/antenna/config
Content-Type: application/json
```

```json
{
  "stationId": 1,
  "satellite": "中星6E 115.5°",
  "azimuth": "192°",
  "elevation": "40°",
  "frequency": {
    "name": "浙江一套",
    "value": 3825,
    "polarization": "垂直(V)",
    "symbolRate": 6780
  }
}
```

| 字段 | 说明 |
|------|------|
| stationId | 必填，台站 ID |
| satellite | 卫星名称及轨道位置 |
| azimuth | 方位角 |
| elevation | 仰角 |
| frequency | 频率参数（可选） |

> 保存时会保留已有的位移归一化基准，不会被清空。

---

### 2.3 位移归一化

将当前 MCU 上报的 yaw/pitch/roll 设为基准；之后展示与告警均按**相对偏移**计算，偏移绝对值 ≥ 1° 才告警。

```http
POST /api/v1/sat/antenna/normalize?stationId=1
```

**响应示例：**

```json
{
  "code": "00000",
  "data": {
    "yaw": "-0.24",
    "pitch": "35.50",
    "roll": "-0.06",
    "normalizedAt": "2026-07-10 21:43:47"
  }
}
```

效果：

1. 写入 `displacementBaseline`
2. 位移显示归零（相对基准为 0°）
3. 自动关闭该台站未完结的 `attitude_offset` 告警

---

### 2.4 信号强度折线图

#### 智能聚合

```http
GET /api/v1/snow/signal-chart?tag=1&startTime=2026-07-10 00:00:00&endTime=2026-07-10 23:59:59
```

| 参数 | 说明 |
|------|------|
| tag | 台站标识 1/2 |
| startTime | `yyyy-MM-dd HH:mm:ss` |
| endTime | `yyyy-MM-dd HH:mm:ss` |

聚合规则：

| 时间跨度 | 粒度 |
|----------|------|
| ≤ 6 小时 | 原始点 |
| ≤ 7 天 | 按小时 |
| ≤ 90 天 | 按天 |
| 更长 | 按周 |

#### 指定粒度

```http
GET /api/v1/snow/signal-chart-by-level?tag=1&startTime=...&endTime=...&timeLevel=1
```

| timeLevel | 含义 |
|-----------|------|
| 1 | 小时 |
| 2 | 天 |
| 3 | 周 |

**响应点结构：**

```json
{
  "time": "2026-07-10 06:00:00",
  "signalStrength": 99.0,
  "maxSignalStrength": 99.0,
  "minSignalStrength": 99.0,
  "sampleCount": 168,
  "timeLevel": 1
}
```

#### 同类图表接口

| 路径 | 说明 |
|------|------|
| `/api/v1/snow/temperature-chart` | 温度折线 |
| `/api/v1/snow/temperature-chart-by-level` | 温度按粒度 |
| `/api/v1/snow/power-chart` | 功率折线 |
| `/api/v1/snow/power-chart-by-level` | 功率按粒度 |
| `/api/v1/snow/data-history` | 原始历史（含 signalStrength / time 别名） |

---

### 2.5 实时数据（单片机 / 大屏轮询）

```http
GET /api/v1/snow/detail?tag=1
```

返回展示层数据，含：

- `signalStrength` 信号强度
- `yaw` / `pitch` / `roll`（已按归一化基准换算；接近 0 显示「正常」）
- 温湿度、雨雪、电表等

上报（单片机）：

```http
POST /api/v1/snow/save
Content-Type: application/json
```

```json
{
  "tag": 1,
  "data": "{ ... MCU JSON ... }"
}
```

或：

```http
POST /api/v1/sat/edge/system-info
```

---

## 3. 模块接口一览

### 3.1 台站 ` /api/v1/sat/stations`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/page` | 分页 |
| GET | `/options` | 下拉选项 |
| GET | `/{id}/form` | 详情表单 |
| GET | `/{id}/overview` | 运行总览 |
| POST | `/` | 新增 |
| PUT | `/{id}` | 修改 |
| DELETE | `/{id}` | 删除 |
| GET | `/template` | 导入模板 |
| POST | `/import` | 批量导入 |
| GET | `/export` | 导出 |

### 3.2 设备 `/api/v1/sat/devices`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/page` | 分页 |
| GET | `/{id}/form` | 详情 |
| POST | `/` | 新增 |
| PUT | `/{id}` | 修改 |
| DELETE | `/{id}` | 删除 |
| PUT | `/{id}/fault` | 标记故障 |
| PUT | `/{id}/normal` | 标记正常 |
| GET | `/template` | 导入模板 |
| POST | `/import` | 导入 |
| GET | `/export` | 导出 |

### 3.3 阈值 `/api/v1/sat/thresholds`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/{stationId}` | 获取阈值 |
| PUT | `/` | 更新并下发 |
| GET | `/{stationId}/versions` | 版本历史 |
| POST | `/{stationId}/rollback/{versionId}` | 回滚 |

### 3.4 融雪策略 `/api/v1/sat/snow-strategies`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/{stationId}` | 获取策略 |
| PUT | `/` | 更新并下发 |
| POST | `/apply` | 批量应用 |

### 3.5 告警 `/api/v1/sat/alarms`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/rules` | 规则列表 |
| POST | `/rules` | 新增规则 |
| PUT | `/rules/{id}` | 修改规则 |
| DELETE | `/rules/{id}` | 删除规则 |
| GET | `/records/page` | 告警记录分页 |
| PUT | `/records/{id}/confirm` | 确认 |
| PUT | `/records/{id}/handle` | 处置 |
| PUT | `/records/{id}/close` | 闭环 |
| POST | `/records/escalation/run` | 手动升级扫描 |

常见 `alarmType`：`attitude_offset`（位移）、`signal_low`（信号低）、`power_abnormal`、`temp_sensor_fault`、`snow_exceed`

### 3.6 看板 `/api/v1/sat/dashboard`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/overview` | 全局总览 |
| GET | `/risk-stats` | 风险统计 |
| GET | `/energy-stats` | 能耗统计 |
| GET | `/environment-stats` | 环境统计 |
| GET | `/report/export` | 运维报表导出 |

### 3.7 天气 / 环境

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/sat/weather/forecast?stationId=` | 三天预报 |
| GET | `/api/v1/sat/environment/current?stationId=` | 当前环境 |
| GET | `/api/v1/sat/environment/stats?stationId=` | 环境统计 |
| GET | `/api/v1/sat/sun-interference/status?stationId=` | 日凌干扰 |

### 3.8 边缘终端 `/api/v1/sat/edge`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/system-info` | 单片机上报 |
| GET | `/config?tag=` | 拉取待同步配置 |
| GET | `/commands/pending?tag=` | 待执行指令 |
| POST | `/commands/{id}/ack` | 指令确认 |
| POST | `/relay/control` | 继电器控制 |

### 3.9 其它

| 模块 | 前缀 | 说明 |
|------|------|------|
| OTA | `/api/v1/sat/ota` | 固件版本 / 升级任务 |
| 融雪日志 | `/api/v1/sat/snow-exec-logs` | 执行日志分页 |
| 存储配置 | `/api/v1/sat/storage-config` | 数据保留策略 |
| AI 配置 | `/api/v1/sat/ai-config` | AI/数字孪生 |

---

## 4. 大屏对接示例

### 4.1 登录

```bash
curl -X POST 'http://8.145.43.245:8989/api/v1/auth/login?username=chunan&password=123456'
```

### 4.2 读/写天线参数

```bash
TOKEN=...

# 读取
curl -H "Authorization: Bearer $TOKEN" \
  'http://8.145.43.245:8989/api/v1/sat/antenna/config?stationId=1'

# 保存
curl -X PUT -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"stationId":1,"satellite":"中星6E 115.5°","azimuth":"192°","elevation":"40°"}' \
  'http://8.145.43.245:8989/api/v1/sat/antenna/config'
```

### 4.3 位移归一化

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  'http://8.145.43.245:8989/api/v1/sat/antenna/normalize?stationId=1'
```

### 4.4 信号强度折线

```bash
curl -H "Authorization: Bearer $TOKEN" \
  'http://8.145.43.245:8989/api/v1/snow/signal-chart?tag=1&startTime=2026-07-10%2000:00:00&endTime=2026-07-10%2023:59:59'
```

### 4.5 直播地址

```bash
curl -H "Authorization: Bearer $TOKEN" \
  'http://8.145.43.245:8989/api/v1/sat/cameras/live-address?deviceSerial=GN1818878&channelNo=1&protocol=2'
```

---

## 5. 相关链接

| 资源 | 地址 |
|------|------|
| Knife4j | http://8.145.43.245:8989/doc.html |
| 大屏 | http://8.145.43.245:9000 |
| Apifox 导入说明 | [docs/apifox-sync.md](./apifox-sync.md) |
| 冒烟脚本 | `scripts/sat-api-smoke-test.sh` |
