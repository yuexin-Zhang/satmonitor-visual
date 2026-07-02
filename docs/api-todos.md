# Dashboard 待补充 API 清单

> 本文档列出 Dashboard 大屏中使用 mock/静态常量的数据字段，这些数据**后续需要后端提供 API 接口**支持。
> 文档最后更新时间：2026-07-02

---

## 优先级 P0 - 高优先级

### 1. 天线基础参数（AntennaInfo 组件）

**当前状态**：使用静态常量 `ANTENNA_CONST`，页面显示 (mock) 标记

**字段清单**：
| 字段 | 当前值 | 说明 | 建议接口 |
|------|--------|------|----------|
| 卫星名称 | `中星6E 115.5°` | 卫星标识和轨道位置 | `GET /v1/sat/antenna/config` 或扩展 `/v1/snow/extra-info` |
| 方位角 | `192°` | 天线指向方位角 | 同上 |
| 仰角 | `40°` | 天线指向仰角 | 同上 |
| 频率名称 | `浙江一套` | 频道/节目名称 | 同上 |
| 频率值 | `3825` | 下行频率（MHz） | 同上 |
| 极化方式 | `垂直(V)` | 信号极化方式 | 同上 |
| 符号率 | `6780` | 符号率（Ksps） | 同上 |

**后端建议**：
- 方案 1：扩展 `/v1/snow/extra-info` 接口，返回完整的天线参数配置
- 方案 2：新增 `/v1/sat/antenna/info` 或 `/v1/sat/antenna/config` 接口
- 响应示例：
```json
{
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
    "horizontal": "0.001°",
    "vertical": "-0.002°",
    "status": "正常"
  }
}
```

**前端代码位置**：`src/components/AntennaInfo.tsx:15-21`

---

### 2. 位移状况（AntennaInfo 组件）

**当前状态**：使用静态常量，页面显示 (mock) 标记

**字段清单**：
| 字段 | 当前值 | 说明 | 建议接口 |
|------|--------|------|----------|
| 水平位移 | `0.001°` | 水平方向位移量 | 同上（天线基础参数接口） |
| 垂直位移 | `-0.002°` | 垂直方向位移量 | 同上 |
| 状态 | `正常` | 位移状态评估 | 同上 |

**说明**：可与天线基础参数合并为一个接口返回。

---

## 优先级 P1 - 中优先级

### 3. 天气数据（EnvironmentalInfo 组件）

**当前状态**：使用静态常量 `DEFAULT_WEATHER`，页面显示 (mock) 标记

**字段清单**：
| 字段 | 当前值 | 说明 | 建议接口 |
|------|--------|------|----------|
| 三天天气（今天） | `晴朗, 27°C` | 今天天气 | 第三方天气 API 或后端转发 |
| 三天天气（明天） | `多云, 25°C` | 明天天气 | 同上 |
| 三天天气（后天） | `小雨, 23°C` | 后天天气 | 同上 |

**后端建议**：
- 方案 1：后端接入第三方天气 API（如和风天气、中国天气网）
- 方案 2：新增 `/v1/sat/weather/forecast` 接口
- 方案 3：使用免费天气 API（如 OpenWeatherMap）
- 响应示例：
```json
{
  "today": { "condition": "晴朗", "temp": 27, "icon": "Sun" },
  "tomorrow": { "condition": "多云", "temp": 25, "icon": "Cloud" },
  "dayAfterTomorrow": { "condition": "小雨", "temp": 23, "icon": "CloudRain" }
}
```

**前端代码位置**：`src/components/EnvironmentalInfo.tsx:26-30`

---

### 4. 湿度数据（EnvironmentalInfo 组件）

**当前状态**：使用静态常量 `DEFAULT_HUMIDITY = 60`，页面显示 (mock) 标记

**字段清单**：
| 字段 | 当前值 | 说明 | 建议接口 |
|------|--------|------|----------|
| 湿度百分比 | `60%` | 环境湿度 | 扩展 `SystemDetail.humidity` 字段 |

**后端建议**：
- 在 `/v1/snow/detail` 响应中添加 `humidity` 字段
- 或新增 `/v1/sat/environment/humidity` 接口
- 响应示例：
```json
{
  "organizationName": "淳安广播转播台",
  "humidity": 60,
  "rainSnow": "无雨雪",
  // ...其他字段
}
```

**前端代码位置**：`src/components/EnvironmentalInfo.tsx:31`

---

### 5. 雪天统计（EnvironmentalInfo 组件）

**当前状态**：使用静态常量，页面显示 (mock) 标记

**字段清单**：
| 字段 | 当前值 | 说明 | 建议接口 |
|------|--------|------|----------|
| 天气预测有雪天数 | `0天` | 预测有雪天数统计 | 需要天气数据支持 |
| 实测有雪累计次数 | `0次` | 实际检测到有雪的次数 | 新增统计接口 |

**后端建议**：
- 在 `/v1/sat/dashboard/environment-stats` 中添加环境统计字段
- 或单独提供 `/v1/sat/snow/statistics` 接口
- 响应示例：
```json
{
  "yearlyStats": {
    "snowForecastDays": 5,
    "snowDetectedCount": 3
  }
}
```

**前端代码位置**：`src/components/EnvironmentalInfo.tsx:32-37`

---

## 优先级 P2 - 低优先级

### 6. 日凌信息（SunInterference 组件）

**当前状态**：使用静态常量，页面显示 (mock) 标记

**字段清单**：
| 字段 | 当前值 | 说明 | 建议接口 |
|------|--------|------|----------|
| 今日是否有预警 | `false` | 今日是否触发日凌预警 | 新增日凌接口 |
| 距离最近日凌时间 | `暂无数据` | 下一次日凌发生时间 | 同上 |
| 本年度预警累计次数 | `0次` | 本年度日凌预警总数 | 同上 |

**后端建议**：
- 新增 `/v1/sat/sun-interference/next` 接口（获取下次日凌时间）
- 新增 `/v1/sat/sun-interference/yearly-stats` 接口（年度统计）
- 或在告警记录中扩展 `alarmType='sun-interference'` 后由前端聚合
- 响应示例：
```json
{
  "todayAlert": false,
  "nextPeriod": "2026-03-15 14:30:00 - 2026-03-15 14:45:00",
  "yearlyCount": 0
}
```

**前端代码位置**：`src/components/SunInterference.tsx:6-8`

---

## 不需要 API 的硬编码配置

以下字段使用硬编码阈值，**不需要**后端提供接口：

| 字段 | 当前值 | 说明 | 是否需要修改 |
|------|--------|------|--------------|
| 温度阈值 | `35°C` | EnvironmentalInfo 温度预警阈值 | 否，合理配置 |
| 功率阈值 | `4.2 kWh` | PowerInfo 功率预警阈值 | 否，合理配置 |
| 信号阈值 | `70` | AntennaInfo 信号预警阈值 | ✅ 已有接口 `/v1/sat/thresholds/{stationId}` |

---

## 接口优先级建议

根据业务需求，建议接口开发优先级：

1. **第一批（P0）**：天线基础参数接口 - 直接影响核心功能展示
2. **第二批（P1）**：天气数据、湿度数据 - 提升用户体验
3. **第三批（P2）**：日凌信息、雪天统计 - 辅助性功能

---

## 前端对接准备工作

当后端接口准备好后，前端需要做以下修改：

1. 移除相关组件中的静态常量定义
2. 在 `useEffect` 中调用新的 API 接口
3. 将数据存储在 state 中
4. 移除页面上的 (mock) 标记
5. 添加错误处理和降级策略

**示例**（以天线基础参数为例）：

```typescript
// 移除静态常量
// const ANTENNA_CONST = { ... };

// 添加 state
const [antennaConfig, setAntennaConfig] = useState(null);

// 添加 API 调用
useEffect(() => {
  antennaApi.getConfig(stationId)
    .then(setAntennaConfig)
    .catch(() => {}); // 降级到默认值
}, [stationId]);

// 使用数据
const satellite = antennaConfig?.satellite || '中星6E 115.5°';
```

---

## 总结

- **需要新增接口**：6 个模块（天线参数、天气、湿度、雪天统计、日凌信息等）
- **硬编码保持不变**：温度阈值、功率阈值
- **已有接口覆盖**：信号阈值
- **前端已做好准备**：所有 mock 数据都有 (mock) 标记，便于后续替换
