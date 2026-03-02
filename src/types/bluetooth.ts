// 蓝牙协议类型定义

// 协议头
export const PROTOCOL_HEADER = {
  APP_TO_DEVICE: 0xAA,
  DEVICE_TO_APP: 0xA5,
};

// 字段类型
export const FIELD_TYPE = {
  // 设备信息同步 (0xBA)
  DEVICE_INFO_SYNC: 0xBA,
  // 运动目标 (0xBB)
  SPORT_TARGET: 0xBB,
  // 健康检测相关 (0xBC)
  HEALTH_MONITOR: 0xBC,
  // 运动健康功能 (0xBD)
  SPORT_HEALTH: 0xBD,
};

// 类型标识 (data[3])
export const TYPE_ID = {
  // 0xBA 类型标识
  PERSONAL_INFO: 0x00,
  TIME_SYNC: 0x01,
  HEART_RATE_ZONE: 0x02,
  LACTATE_ZONE: 0x03,
  
  // 0xBB 类型标识
  DISTANCE_TARGET: 0x00,
  CALORIE_TARGET: 0x01,
  STEP_TARGET: 0x02,
  DAILY_DATA: 0x03,
  
  // 0xBC 类型标识
  SPO2_MONITOR: 0x00,
  HEART_RATE_MONITOR: 0x01,
  NECK_HEALTH_MONITOR: 0x02,
  FALL_MONITOR: 0x03,
  SPO2_DATA: 0x04,
  HEART_RATE_DATA: 0x05,
  NECK_HEALTH_DATA: 0x06,
  EMERGENCY_CONTACT: 0x07,
  SPO2_MEASURE: 0x08,
  HEART_RATE_MEASURE: 0x09,
  SEDENTARY_REMINDER: 0x0a,
  HEART_RATE_BROADCAST: 0x0b,
  NECK_SENSOR_WEAR_DETECTION: 0x0c,
  NECK_SENSOR_CALIBRATION: 0x0d,
  NECK_STRETCH_REMINDER: 0x0e,
  SYNC_LAST_7_DAYS_HEALTH: 0x0f,

  // 0xBD 类型标识
  SPORT_STATUS: 0x00,
  GPS_REPORT: 0x01,
  REALTIME_SPORT_DATA: 0x02,
  SPORT_SUMMARY: 0x03,
  SPORT_SEGMENT: 0x04,
  DATA_RECEIVED: 0x05,
  SPORT_COUNT_QUERY: 0x06,
  HEART_RATE_DETAIL: 0x07,
  PACE_DETAIL: 0x08,
  STEP_FREQ_DETAIL: 0x09,
  GPS_DETAIL: 0x0A,
};

// 性别
export const GENDER = {
  UNKNOWN: 0x00,
  MALE: 0x01,
  FEMALE: 0x02,
};

// 运动状态
export const SPORT_STATUS = {
  NOT_STARTED: 0x00,
  STARTED: 0x01,
  PAUSED: 0x02,
  RESUMED: 0x03,
  ENDED: 0x04,
};

// 运动类型
export const SPORT_TYPE = {
  INDOOR_TREADMILL: 0x00,
  OUTDOOR_RUNNING: 0x01,
  OUTDOOR_WALKING: 0x02,
};

// 开关状态
export const SWITCH_STATE = {
  ON: 0x00,
  OFF: 0x01,
};

// 数据标识
export const DATA_FLAG = {
  FIRST: 0x00,
  MIDDLE: 0x01,
  LAST: 0x02,
  COMPLETE: 0x03, // 7天数据全部返回完成
  ACTIVE_REPORT: 0xFF,
};

// 响应结果
export const RESPONSE_RESULT = {
  SUCCESS: 0x00,
  FAILURE: 0x01,
};

// 蓝牙 UUID
export const BLE_UUID = {
  SERVICE: '0000faa0-0000-1000-8000-00805f9b34fb',
  WRITE: '0000faa1-0000-1000-8000-00805f9b34fb',
  NOTIFY: '0000faa2-0000-1000-8000-00805f9b34fb',
};

// 个人信�
export interface PersonalInfo {
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: number;
}

// 时间同步
export interface TimeSync {
  timezone: number; // 东时区 1-12, 西时区 -1 到 -12
  timestamp: number; // 毫秒时间戳
}

// 心率区间
export interface HeartRateZone {
  min: number;
  max: number;
}

// 乳酸区间
export interface LactateZone {
  enabled: boolean;
  heartRateMin: number;
  heartRateMax: number;
  paceMin: number; // 秒/公里
  paceMax: number; // 秒/公里
}

// 运动目标
export interface SportTarget {
  distance: number; // 米
  calories: number; // 卡
  steps: number;
}

// 每日数据
export interface DailyData {
  steps: number;
  calories: number;
  distance: number;
}

// 监测设置
export interface MonitorSetting {
  enabled: boolean;
  interval?: number; // 分钟
}

// 血氧数据
export interface SpO2Data {
  hour: number;
  minute: number;
  value: number; // %
  flag: number;
}

// 心率数据
export interface HeartRateData {
  hour: number;
  minute: number;
  value: number; // bpm
  flag: number;
}

// 颈椎健康数据
export interface NeckHealthData {
  totalDuration: number; // 分钟
  level1: number; // %
  level2: number; // %
  level3: number; // %
  level4: number; // %
  level5: number; // %
}

// 紧急联系人
export interface EmergencyContact {
  countryCode: string;
  phoneNumber: string;
}

// 运动状态
export interface SportState {
  status: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  sportType: number;
}

// GPS 坐标
export interface GPSCoordinate {
  longitude: number;
  latitude: number;
}

// 实时运动数据
export interface RealtimeSportData {
  duration: number; // 秒
  distance: number; // 米
  steps: number;
  calories: number; // 卡
  heartRate: number; // bpm
  pace: number; // 米/秒
  stepFreq: number; // 步/分钟
  groundContactTime: number; // 毫秒
  airTime: number; // 毫秒
  verticalAmplitude: number; // 厘米
}

// 运动总结
export interface SportSummary {
  startTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
  sportType: number;
  duration: number; // 秒
  distance: number; // 米
  vo2max: number;
  steps: number;
  calories: number; // 卡
  fastestPace: number; // 米/秒
  slowestPace: number; // 米/秒
  averagePace: number; // 米/秒
  minHeartRate: number;
  maxHeartRate: number;
  avgHeartRate: number;
  avgStepFreq: number;
  aerobicPerformance: number; // 0-5
  anaerobicPerformance: number; // 0-5
  avgGroundContactTime: number; // 毫秒
  avgAirTime: number; // 毫秒
  avgVerticalAmplitude: number; // 厘米
  avgBalance: number; // %
  recoveryTime: number; // 小时
  heartRateZone1: number; // %
  heartRateZone2: number; // %
  heartRateZone3: number; // %
  heartRateZone4: number; // %
  heartRateZone5: number; // %
  lactateHeartRateZone: number; // %
  lactatePaceZone: number; // %
}

// 运动分段
export interface SportSegment {
  index: number;
  duration: number; // 秒
  pace: number; // 米/秒
  avgHeartRate: number;
  avgStepFreq: number;
}

// 日志条目
export interface LogEntry {
  timestamp: string;
  type: 'send' | 'receive' | 'info' | 'error';
  message: string;
  data?: Uint8Array;
}

// 蓝牙设备信息
export interface BluetoothDeviceInfo {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  writeCharacteristic: BluetoothRemoteGATTCharacteristic;
  notifyCharacteristic: BluetoothRemoteGATTCharacteristic;
}
