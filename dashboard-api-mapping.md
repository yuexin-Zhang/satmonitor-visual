# 大屏数据 - 接口字段映射文档

> 后端基础地址：`http://8.145.43.245:8989/api/v1`
> 开发环境通过 Vite 代理：`/api` → `http://8.145.43.245:8989`
> 生产环境通过 Nginx 代理：`/satmonitor-visual/api/` → `http://127.0.0.1:8080/api/`
> Apifox 文档：https://s.apifox.cn/77cfa9ea-132e-4e65-931a-75f178e3c4aa

---

## 可用接口总览

| # | 接口名称 | 方法 | 路径 | 前端是否调用 |
|---|---------|------|------|-------------|
| 1 | 获取系统信息 | GET | `/api/v1/snow/detail` | ✅ 是（5个组件各调用一次） |
| 2 | 保存额外信息 | POST | `/api/v1/snow/save-extra-info` | ❌ 未调用 |
| 3 | 获取萤石token | GET | `/api/v1/snow/ys7-token` | ❌ 未调用 |
| 4 | 获取传感器温度统计数据 | GET | `/api/v1/snow/temperature-chart-by-level` | ❌ 未调用 |
| 5 | 获取功率统计数据 | GET | `/api/v1/snow/power-chart-by-level` | ✅ 是（PowerInfo 调用） |

---

## 接口详情与字段映射

### 接口 1：获取系统信息

```
GET /api/v1/snow/detail?tag=1
```

**响应示例：**
```json
{
  "code": "00000",
  "data": {
    "yaw": "正常",
    "roll": "正常",
    "pitch": "正常",
    "power": "",
    "energy": "",
    "relays": [
      { "id": 1, "name": "加热继电器 1", "state": false },
      { "id": 2, "name": "加热继电器 2", "state": false },
      { "id": 3, "name": "加热继电器 3", "state": false },
      { "id": 4, "name": "加热继电器 4", "state": false },
      { "id": 5, "name": "加热继电器 5", "state": false },
      { "id": 6, "name": "加热继电器 6", "state": false },
      { "id": 7, "name": "报警继电器 7", "state": false },
      { "id": 8, "name": "继电器 8", "state": false }
    ],
    "current": "",
    "voltage": "",
    "rainSnow": "无雨雪",
    "tempsensors": [
      { "id": 1, "name": "锅面_1_2", "value": 25 },
      { "id": 2, "name": "锅面_3_4", "value": 25 },
      { "id": 3, "name": "锅面_5_6", "value": 25 },
      { "id": 4, "name": "锅面_7_8", "value": 25 },
      { "id": 5, "name": "锅面_9_10", "value": 25 },
      { "id": 6, "name": "锅面_11_12", "value": 25 }
    ],
    "airTemperature": 25,
    "potTemperature": -127,
    "signalStrength": "99",
    "organizationName": "淳安台"
  },
  "msg": "一切ok"
}
```

**字段 → 页面映射：**

| 接口字段 | 类型 | 显示位置（组件） | 页面展示内容 | 数据来源 |
|---------|------|----------------|-------------|---------|
| `organizationName` | string | **Header** (`Header.tsx`) | 左上角站点名称（如"淳安台"） | 优先用接口；无值时 fallback mock `siteName` |
| `signalStrength` | string | **天线信息** (`AntennaInfo.tsx`) | 强度预警区域的信号强度百分比（如"99%"） | 优先用接口；无值时不显示 |
| `rainSnow` | string | **气象&融雪** (`EnvironmentalInfo.tsx`) | 雨雪传感器状态文字（如"无雨雪"） | 优先用接口；无值时 fallback mock |
| `tempsensors` | array | **气象&融雪** (`EnvironmentalInfo.tsx`) | 锅面温度传感器网格（6个传感器名称+温度值） | 优先用接口；无值时为空 |
| `airTemperature` | number | **气象&融雪** (`EnvironmentalInfo.tsx`) | 温度传感器区域右侧"空气: XX°C" | 优先用接口；无值时显示"--" |
| `potTemperature` | number | **气象&融雪** (`EnvironmentalInfo.tsx`) | 温度传感器区域右侧"锅面: XX°C"（-127时不显示，表示传感器未连接） | 仅用接口数据 |
| `voltage` | string | **电源信息** (`PowerInfo.tsx`) | 电压值 | 优先用接口；空值时 fallback mock "220V" |
| `current` | string | **电源信息** (`PowerInfo.tsx`) | 电流值 | 优先用接口；空值时 fallback mock "2.5A" |
| `relays` | array | **电源信息** (`PowerInfo.tsx`) | 继电器状态网格（8个继电器 ON/OFF 状态） | 仅用接口数据 |
| `yaw` | string | **位移状况** (`PositionStatus.tsx`) | 偏航状态 | 仅用接口数据；无值时显示"--" |
| `roll` | string | **位移状况** (`PositionStatus.tsx`) | 横滚状态 | 仅用接口数据；无值时显示"--" |
| `pitch` | string | **位移状况** (`PositionStatus.tsx`) | 俯仰状态 | 仅用接口数据；无值时显示"--" |
| `power` | string | — | 当前未展示（接口返回为空） | — |
| `energy` | string | — | 当前未展示（接口返回为空） | — |

---

### 接口 2：保存额外信息

```
POST /api/v1/snow/save-extra-info
Body: { "tag": 1, "data": { "relayStates": [0,0,0,0,0,0,0,0] } }
```

**用途：** 保存继电器状态等额外信息到后端
**前端状态：** 未调用

---

### 接口 3：获取萤石token

```
GET /api/v1/snow/ys7-token
```

**响应示例：**
```json
{
  "code": "00000",
  "data": {
    "accessToken": "at.caxxxxxx",
    "expireTime": "1772778516371"
  },
  "msg": "一切ok"
}
```

**用途：** 获取萤石云视频流 accessToken，可用于动态获取实时监控视频地址
**前端状态：** 未调用。当前 `LiveVideo.tsx` 使用硬编码的萤石云 HLS 地址

---

### 接口 4：获取传感器温度统计数据

```
GET /api/v1/snow/temperature-chart-by-level?tag=1&startTime=...&endTime=...&timeLevel=1
```

**响应示例：**
```json
{
  "code": "00000",
  "data": [
    {
      "sensorName": "锅面_1_2",
      "time": "2026-03-25 13:00:00",
      "temperature": 36.97,
      "maxTemperature": 38.88,
      "minTemperature": 33.13,
      "sampleCount": 40,
      "timeLevel": 1
    }
  ],
  "msg": "一切ok"
}
```

**用途：** 获取传感器温度的时序统计数据，可用于绘制温度趋势图
**前端状态：** 未调用。当前 `EnvironmentalInfo.tsx` 中温度数据仅展示实时值，无趋势图

---

### 接口 5：获取功率统计数据

```
GET /api/v1/snow/power-chart-by-level?tag=1&startTime=...&endTime=...&timeLevel=2
```

**响应示例：**
```json
{
  "code": "00000",
  "data": [{ "time": "2026-05-27", "value": 4.2 }],
  "msg": "一切ok"
}
```

**字段 → 页面映射：**

| 接口字段 | 类型 | 显示位置（组件） | 页面展示内容 | 数据来源 |
|---------|------|----------------|-------------|---------|
| `data[].time` | string | **电源信息** (`PowerInfo.tsx`) | 功率曲线图 X 轴标签 | 优先用接口；无数据时 fallback mock |
| `data[].value` | number | **电源信息** (`PowerInfo.tsx`) | 功率曲线图 Y 轴数据 | 优先用接口；无数据时 fallback mock |

---

## 纯 Mock 数据（无接口对接）

以下大屏区域完全使用前端 Mock 数据，不调用任何后端接口：

| 组件 | Mock 数据内容 | 数据来源 |
|------|-------------|---------|
| **天线信息** (`AntennaInfo.tsx`) | 卫星名称、方位角、仰角、频率参数、信号历史折线图、位移值、预警次数 | `MOCK_DASHBOARD_CONFIG.antenna` |
| **日凌信息** (`SunInterference.tsx`) | 今日是否预警、下次日凌时间、年度累计预警次数 | `MOCK_DASHBOARD_CONFIG.sunInterference` |
| **实时画面** (`LiveVideo.tsx`) | 视频流地址、流名称、启用状态 | `MOCK_DASHBOARD_CONFIG.liveVideo` |
| **智能运检提示** (`MaintenanceTips.tsx`) | 报警消息、报警列表（localStorage 持久化） | `MOCK_DASHBOARD_CONFIG.maintenanceTips` + 本地生成 |
| **运维记录** (`OperationsRecord.tsx`) | 13条模拟运维记录（按日期分组） | 组件内 `defaultRecords` 硬编码 |
| **天线3D展示** (`AntennaDisplay.tsx`) | iframe 嵌入 `http://8.145.43.245:8082/` 外部服务 | 外部 iframe |
| **位移状况** (`PositionStatus.tsx`) | 水平/垂直位移值、状态、预警次数 | `MOCK_DASHBOARD_CONFIG.position` |
| **电源信息** (`PowerInfo.tsx`) | 年度累计耗电量、功率历史数据（接口无数据时的回退） | `MOCK_DASHBOARD_CONFIG.power` |
| **气象&融雪** (`EnvironmentalInfo.tsx`) | 天气预报、湿度柱状图、年度统计 | `MOCK_DASHBOARD_CONFIG.environment` |
| **Header 底部状态栏** (`Dashboard.tsx`) | NETWORK / DATABASE / ENCRYPTION / SYSTEM_UPTIME | 硬编码 |

---

## 数据流架构

```
┌──────────────────────────────────────────────────────────────────┐
│                        大屏页面 (Dashboard)                       │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ Header   │  │AntennaInfo│  │SunInterf.│  ← 左列              │
│  └────┬─────┘  └────┬─────┘  └──────────┘                       │
│       │              │                                             │
│       │ 5个组件各自独立调用同一个接口                                │
│       ▼              ▼                                             │
│  GET /v1/snow/detail?tag=1                                       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │EnvironInf│  │ PowerInfo│  │Operations│  ← 右列              │
│  └────┬─────┘  └────┬─────┘  └──────────┘                       │
│       │              │                                             │
│       │         GET /v1/snow/power-chart-by-level                 │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐                                  │
│  │LiveVideo │  │MaintenanceTip│  ← 中列                          │
│  │(纯Mock)  │  │(纯Mock)      │                                  │
│  └──────────┘  └──────────────┘                                   │
│                                                                  │
│  ┌──────────────┐                                                │
│  │AntennaDisplay │ ← iframe 嵌入外部服务                          │
│  │(外部服务)     │   http://8.145.43.245:8082/                    │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```
