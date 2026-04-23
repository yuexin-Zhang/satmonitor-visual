export const BLADE_STATUS = {
  NORMAL: 'normal',
  HEATING: 'heating',
  FAULT: 'fault',
  OFFLINE: 'offline'
};

export const FAULT_TYPES = {
  HEATER_SHORT_CIRCUIT: 'HE001',
  HEATER_OPEN_CIRCUIT: 'HE002',
  TEMP_SENSOR_ERROR: 'TE001',
  NO_RESPONSE: 'CM001',
  OVER_TEMPERATURE: 'TE002',
  UNDER_TEMPERATURE: 'TE003',
  COMMUNICATION_FAILURE: 'CM002'
};

export const FAULT_SUGGESTIONS = {
  'HE001': '检查加热器电路，可能存在短路故障',
  'HE002': '检查加热器连接，可能断路或接触不良',
  'TE001': '检查温度传感器及连接线路',
  'CM001': '检查控制器通信或电源',
  'TE002': '检查温控系统，可能散热不良',
  'TE003': '检查加热器工作状态',
  'CM002': '检查通信线路和模块'
};

export const MESH_NAMES = {
  BLADES: ['radar_01', 'radar_02', 'radar_03', 'radar_04', 'radar_05', 'radar_06'],
  BASE: 'radar_b',
  CONTROL_UNIT: 'control_unit',
  ALARM_DETECTOR: 'Rainwater_detection',
  HIGH_FREQUENCY: 'High_frequency'
};

export const STATUS_COLORS = {
  NORMAL: { emissive: 0x000000, emissiveIntensity: 0 },
  HEATING: { emissive: 0xff0000, emissiveIntensity: 0.8, color: 0xff0000 },
  FAULT: { emissive: 0x0000ff, emissiveIntensity: 0.4, color: 0x0000aa },
  OFFLINE: { emissive: 0x000000, emissiveIntensity: 0, color: 0x808080 }
};

