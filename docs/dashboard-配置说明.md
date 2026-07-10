# Dashboard 数据配置说明

## 📋 概述

本文档详细说明了 Dashboard 界面中各类数据的来源和可配置性，帮助管理员了解哪些数据可以通过 Admin 后台修改，哪些数据需要代码修改。

---

## ✅ 可通过 Admin 修改的数据

### 1. 阈值配置
**配置页面**: `/admin/strategy-config`
**API接口**: `/v1/sat/thresholds/{stationId}`
**配置文件**: `src/pages/Admin/StrategyConfig.tsx`

| 配置项 | 说明 | 影响范围 |
|--------|------|----------|
| `signalMin` | 信号强度最小阈值 | 影响信号告警判定和阈值柱状图显示 |
| `tempMax` | 温度最大阈值 | 影响温度告警判定和阈值柱状图显示 |
| `displacementMax` | 位移最大阈值 | 影响位移告警判定和阈值柱状图显示 |

**功能特性**:
- 支持版本历史管理
- 支持配置回滚
- 修改后实时生效

### 2. 融雪策略配置
**配置页面**: `/admin/strategy-config`
**API接口**: `/v1/sat/snow-strategies/{stationId}`
**配置文件**: `src/pages/Admin/StrategyConfig.tsx`

| 配置项 | 说明 |
|--------|------|
| 策略名称 | 自定义策略标识 |
| 运行模式 | 手动/自动模式切换 |
| 温度阈值 | 触发融雪的温度条件 |
| 持续时间 | 温度条件需持续的时长 |

### 3. 告警规则配置
**配置页面**: `/admin/alarms`
**API接口**: `/v1/sat/alarms/rules`
**配置文件**: `src/pages/Admin/Alarms.tsx`

| 配置项 | 说明 |
|--------|------|
| 告警类型 | 信号、温度、位移、设备状态等 |
| 告警级别 | 信息、警告、严重、紧急 |
| 超时时间 | 告警触发前的等待时间 |
| 通知渠道 | 告警通知的方式 |

### 4. 系统通用配置
**配置页面**: `/admin/system-config`
**API接口**: `/v1/config`
**配置文件**: `src/pages/Admin/SystemConfig.tsx`

| 配置项 | 说明 |
|--------|------|
| 系统通用参数 | 各类系统级配置项 |
| 刷新间隔设置 | 数据更新频率 |

### 5. 存储配置
**配置页面**: `/admin/storage-config`
**API接口**: `/v1/sat/storage-config`
**配置文件**: `src/pages/Admin/StorageConfig.tsx`

| 配置项 | 说明 |
|--------|------|
| 存储路径 | 数据文件存储位置 |
| 保留策略 | 数据保留时长 |
| 清理规则 | 自动清理策略 |

### 6. AI 配置
**配置页面**: `/admin/ai-config`
**配置文件**: `src/pages/Admin/AIConfig.tsx`

| 配置项 | 说明 |
|--------|------|
| AI 模型参数 | 模型相关配置 |
| 分析策略 | AI分析行为设置 |

---

## ❌ 不可通过 Admin 修改的数据（硬编码）

以下数据目前在代码中硬编码，如需修改需要更改源代码：

### 1. 天线基础信息
**文件**: `src/components/dashboard/AntennaInfo.tsx:15-21`

| 数据项 | 当前值 | 说明 |
|--------|--------|------|
| 卫星名称 | `中星6E 115.5°` | 显示的卫星标识 |
| 方位角 | `192°` | 天线方位角 |
| 仰角 | `40°` | 天线仰角 |
| 频率名称 | `浙江一套` | 频道名称 |
| 频率值 | `3825` | 下行频率(MHz) |
| 极化方式 | `垂直(V)` | 信号极化 |
| 符号率 | `6780` | 符号率(Ksps) |
| 水平位移 | `0.001°` | 天线水平偏差 |
| 垂直位移 | `-0.002°` | 天线垂直偏差 |

### 2. 天气/环境信息
**文件**: `src/components/dashboard/EnvironmentalInfo.tsx:26-37`

| 数据项 | 说明 |
|--------|------|
| 天气预报 | 今天/明天/后天的天气状况 |
| 温度/湿度 | 默认环境数值 |
| 天气图标 | 天气状况对应的图标 |

### 3. 日凌信息
**文件**: `src/components/dashboard/SunInterference.tsx:6-8`

| 数据项 | 当前值 | 说明 |
|--------|--------|------|
| 今日告警 | `false` | 是否有日凌告警 |
| 下次周期 | `'暂无数据'` | 下次日凌时间 |
| 年度次数 | `0` | 本年日凌发生次数 |

### 4. 视频流配置
**文件**: `src/components/dashboard/LiveVideo.tsx:9-14`

| 数据项 | 当前值 | 说明 |
|--------|--------|------|
| 设备序列号 | `GN1818878` | 萤石云设备ID |
| 通道号 | `1` | 视频通道 |
| 备用URL | 萤石云开放直播流 | 备用视频源 |

### 5. 天线3D显示地址
**文件**: `src/components/dashboard/AntennaDisplay.tsx:5`

| 数据项 | 当前值 | 说明 |
|--------|--------|------|
| iframe地址 | `http://8.145.43.245:8082/` | 外部3D展示服务地址 |

### 6. 功率信息默认值
**文件**: `src/components/dashboard/PowerInfo.tsx:9-11`

| 数据项 | 当前值 | 说明 |
|--------|--------|------|
| 功率阈值 | `4.2` | 默认功率警告阈值 |
| 年度能耗 | `0` | 默认年度能耗值 |

---

## 🔄 动态获取的数据（实时数据）

以下数据从后端API实时获取，无需手动配置：

| 数据类型 | API接口 | 显示位置 |
|----------|---------|----------|
| 设备实时状态 | `/v1/snow/detail` | 整个Dashboard |
| 扩展信息 | `/v1/snow/extra-info` | 环境信息、电源信息 |
| 历史数据 | `/v1/snow/data-history` | 图表展示 |
| 告警记录 | `/v1/sat/alarms/records/page` | 运维记录 |
| 融雪执行日志 | `/v1/sat/snow-exec-logs/page` | 运维记录 |
| 功率历史 | `/v1/snow/power-chart-by-level` | 功率图表 |
| 温度历史 | `/v1/snow/temperature-chart-by-level` | 温度图表 |
| 台站运行总览 | `/v1/sat/stations/{id}/overview` | 统计数据 |

---

## 📝 改进建议

为提高系统灵活性，建议将以下硬编码数据迁移到 Admin 可配置范围：

1. **天线基础参数** → 迁移到台站配置或系统配置
2. **视频流配置** → 迁移到存储配置
3. **3D显示地址** → 迁移到系统配置
4. **天气信息** → 接入真实天气API或配置自定义数据源
5. **功率默认阈值** → 迁移到阈值配置

---

## 🔗 相关文件索引

| 文件路径 | 说明 |
|----------|------|
| `src/components/Dashboard.tsx` | Dashboard主组件 |
| `src/components/dashboard/AntennaInfo.tsx` | 天线信息面板 |
| `src/components/dashboard/EnvironmentalInfo.tsx` | 环境信息面板 |
| `src/components/dashboard/PowerInfo.tsx` | 电源信息面板 |
| `src/components/dashboard/SunInterference.tsx` | 日凌信息面板 |
| `src/components/dashboard/LiveVideo.tsx` | 实时视频面板 |
| `src/components/dashboard/AntennaDisplay.tsx` | 天线3D显示 |
| `src/components/dashboard/OperationsRecord.tsx` | 运维记录面板 |
| `src/pages/Admin/SystemConfig.tsx` | 系统配置页面 |
| `src/pages/Admin/StrategyConfig.tsx` | 阈值和策略配置页面 |
| `src/pages/Admin/Alarms.tsx` | 告警规则配置页面 |
| `src/http/api.ts` | API接口定义 |
| `src/http/types.ts` | API类型定义 |

---

**文档更新时间**: 2026-07-02
**项目版本**: 当前 main 分支
