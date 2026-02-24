import { PROTOCOL_HEADER, FIELD_TYPE, TYPE_ID, RESPONSE_RESULT, SWITCH_STATE, GENDER, SPORT_STATUS, SPORT_TYPE, DATA_FLAG } from '@/types/bluetooth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParsedData = Record<string, any>;

// 解析结果接口
export interface ParsedResponse {
  header: string;
  fieldType: string;
  fieldTypeCode: number;
  length: number;
  typeId: number;
  typeName: string;
  data: ParsedData;
  checksum: number;
  checksumValid: boolean;
  rawData: string;
}

// 校验和计算
function calculateChecksum(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length - 1; i++) {
    sum += data[i];
  }
  return sum & 0xFF;
}

// 字节转十六进制
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

// 获取字段类型名称
function getFieldTypeName(fieldType: number): string {
  switch (fieldType) {
    case FIELD_TYPE.DEVICE_INFO_SYNC: return '设备信息同步';
    case FIELD_TYPE.SPORT_TARGET: return '运动目标';
    case FIELD_TYPE.HEALTH_MONITOR: return '健康检测';
    case FIELD_TYPE.SPORT_HEALTH: return '运动健康';
    default: return `未知(0x${fieldType.toString(16).toUpperCase()})`;
  }
}

// 获取类型标识名称
function getTypeIdName(fieldType: number, typeId: number): string {
  if (fieldType === FIELD_TYPE.DEVICE_INFO_SYNC) {
    switch (typeId) {
      case TYPE_ID.PERSONAL_INFO: return '个人信息';
      case TYPE_ID.TIME_SYNC: return '时间同步';
      case TYPE_ID.HEART_RATE_ZONE: return '心率区间';
      case TYPE_ID.LACTATE_ZONE: return '乳酸区间';
    }
  } else if (fieldType === FIELD_TYPE.SPORT_TARGET) {
    switch (typeId) {
      case TYPE_ID.DISTANCE_TARGET: return '距离目标';
      case TYPE_ID.CALORIE_TARGET: return '消耗目标';
      case TYPE_ID.STEP_TARGET: return '步数目标';
      case TYPE_ID.DAILY_DATA: return '每日数据';
    }
  } else if (fieldType === FIELD_TYPE.HEALTH_MONITOR) {
    switch (typeId) {
      case TYPE_ID.SPO2_MONITOR: return '血氧监测';
      case TYPE_ID.HEART_RATE_MONITOR: return '心率监测';
      case TYPE_ID.NECK_HEALTH_MONITOR: return '颈椎健康监测';
      case TYPE_ID.FALL_MONITOR: return '跌倒监测';
      case TYPE_ID.SPO2_DATA: return '血氧数据';
      case TYPE_ID.HEART_RATE_DATA: return '心率数据';
      case TYPE_ID.NECK_HEALTH_DATA: return '颈椎健康数据';
      case TYPE_ID.EMERGENCY_CONTACT: return '紧急联系人';
      case TYPE_ID.SPO2_MEASURE: return '血氧测量';
      case TYPE_ID.HEART_RATE_MEASURE: return '心率测量';
      case TYPE_ID.SEDENTARY_REMINDER: return '久坐提醒';
      case TYPE_ID.HEART_RATE_BROADCAST: return '心率广播';
    }
  } else if (fieldType === FIELD_TYPE.SPORT_HEALTH) {
    switch (typeId) {
      case TYPE_ID.SPORT_STATUS: return '运动状态';
      case TYPE_ID.GPS_REPORT: return 'GPS上报';
      case TYPE_ID.REALTIME_SPORT_DATA: return '实时运动数据';
      case TYPE_ID.SPORT_SUMMARY: return '运动总结';
      case TYPE_ID.SPORT_SEGMENT: return '运动分段';
      case TYPE_ID.DATA_RECEIVED: return '数据接收完成';
      case TYPE_ID.SPORT_COUNT_QUERY: return '运动条数查询';
      case TYPE_ID.HEART_RATE_DETAIL: return '心率详情';
      case TYPE_ID.PACE_DETAIL: return '配速详情';
      case TYPE_ID.STEP_FREQ_DETAIL: return '步频详情';
      case TYPE_ID.GPS_DETAIL: return 'GPS详情';
    }
  }
  return `未知(0x${typeId.toString(16).toUpperCase()})`;
}

// 获取性别名称
function getGenderName(gender: number): string {
  switch (gender) {
    case GENDER.MALE: return '男';
    case GENDER.FEMALE: return '女';
    case GENDER.UNKNOWN: return '保密';
    default: return `未知(0x${gender.toString(16)})`;
  }
}

// 获取运动状态名称
function getSportStatusName(status: number): string {
  switch (status) {
    case SPORT_STATUS.NOT_STARTED: return '未开始';
    case SPORT_STATUS.STARTED: return '已开始';
    case SPORT_STATUS.PAUSED: return '已暂停';
    case SPORT_STATUS.RESUMED: return '已恢复';
    case SPORT_STATUS.ENDED: return '已结束';
    default: return `未知(0x${status.toString(16)})`;
  }
}

// 获取运动类型名称
function getSportTypeName(type: number): string {
  switch (type) {
    case SPORT_TYPE.INDOOR_TREADMILL: return '室内跑步机';
    case SPORT_TYPE.OUTDOOR_RUNNING: return '户外跑步';
    case SPORT_TYPE.OUTDOOR_WALKING: return '户外健走';
    default: return `未知(0x${type.toString(16)})`;
  }
}

// 获取开关状态名称
function getSwitchName(state: number): string {
  return state === SWITCH_STATE.ON ? '开启' : '关闭';
}

// 获取数据标识名称
function getDataFlagName(flag: number): string {
  switch (flag) {
    case DATA_FLAG.FIRST: return '第一条';
    case DATA_FLAG.MIDDLE: return '中间数据';
    case DATA_FLAG.LAST: return '结束数据';
    case DATA_FLAG.ACTIVE_REPORT: return '主动上报';
    default: return `未知(0x${flag.toString(16)})`;
  }
}

// 获取响应结果名称
function getResultName(result: number): string {
  return result === RESPONSE_RESULT.SUCCESS ? '成功' : '失败';
}

// 解析三字节数值
function parse3ByteValue(data: Uint8Array, offset: number): number {
  return (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
}

// 解析四字节数值
function parse4ByteValue(data: Uint8Array, offset: number): number {
  return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
}

// 解析两字节数值
function parse2ByteValue(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

// ========== 具体协议解析函数 ==========

// 解析个人信息响应
function parsePersonalInfo(data: Uint8Array): Record<string, unknown> {
  if (data.length >= 5 && data[4] === 0xFF) {
    return { status: '暂无数据' };
  }
  if (data.length < 10) return { error: '数据长度不足' };
  
  const weightInGrams = parse3ByteValue(data, 5);
  return {
    height: data[4],
    weight: weightInGrams / 1000,
    weightGrams: weightInGrams,
    age: data[8],
    gender: getGenderName(data[9]),
    genderCode: data[9],
  };
}

// 解析时间同步响应
function parseTimeSync(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    result: getResultName(data[4]),
    resultCode: data[4],
  };
}

// 解析心率区间响应
function parseHeartRateZone(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    result: getResultName(data[4]),
    resultCode: data[4],
  };
}

// 解析乳酸区间响应
function parseLactateZone(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    result: getResultName(data[4]),
    resultCode: data[4],
  };
}

// 解析距离目标响应
function parseDistanceTarget(data: Uint8Array): Record<string, unknown> {
  if (data.length >= 7) {
    const distance = parse3ByteValue(data, 4);
    return {
      distance,
      distanceKm: (distance / 1000).toFixed(2),
    };
  }
  return { error: '数据长度不足' };
}

// 解析消耗目标响应
function parseCalorieTarget(data: Uint8Array): Record<string, unknown> {
  if (data.length >= 7) {
    const calories = parse3ByteValue(data, 4);
    return {
      calories,
      caloriesKcal: (calories / 1000).toFixed(0),
    };
  }
  return { error: '数据长度不足' };
}

// 解析步数目标响应
function parseStepTarget(data: Uint8Array): Record<string, unknown> {
  if (data.length >= 7) {
    const steps = parse3ByteValue(data, 4);
    return { steps };
  }
  return { error: '数据长度不足' };
}

// 解析每日数据响应
function parseDailyData(data: Uint8Array): Record<string, unknown> {
  if (data.length < 13) return { error: '数据长度不足' };
  return {
    steps: parse3ByteValue(data, 4),
    calories: parse3ByteValue(data, 7),
    caloriesKcal: (parse3ByteValue(data, 7) / 1000).toFixed(0),
    distance: parse3ByteValue(data, 10),
    distanceKm: (parse3ByteValue(data, 10) / 1000).toFixed(2),
  };
}

// 解析血氧监测设置响应
function parseSpO2Monitor(data: Uint8Array): Record<string, unknown> {
  if (data.length < 6) return { error: '数据长度不足' };
  return {
    enabled: data[4] === SWITCH_STATE.ON,
    state: getSwitchName(data[4]),
    interval: data[5],
  };
}

// 解析心率监测设置响应
function parseHeartRateMonitor(data: Uint8Array): Record<string, unknown> {
  if (data.length < 6) return { error: '数据长度不足' };
  return {
    enabled: data[4] === SWITCH_STATE.ON,
    state: getSwitchName(data[4]),
    interval: data[5],
  };
}

// 解析颈椎健康监测响应
function parseNeckHealthMonitor(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    enabled: data[4] === SWITCH_STATE.ON,
    state: getSwitchName(data[4]),
  };
}

// 解析跌倒监测响应
function parseFallMonitor(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    enabled: data[4] === SWITCH_STATE.ON,
    state: getSwitchName(data[4]),
  };
}

// 解析血氧数据
function parseSpO2Data(data: Uint8Array): Record<string, unknown> {
  if (data.length < 8) return { error: '数据长度不足' };
  return {
    hour: data[4],
    minute: data[5],
    value: data[6],
    flag: getDataFlagName(data[7]),
    flagCode: data[7],
  };
}

// 解析心率数据
function parseHeartRateData(data: Uint8Array): Record<string, unknown> {
  if (data.length < 8) return { error: '数据长度不足' };
  return {
    hour: data[4],
    minute: data[5],
    value: data[6],
    flag: getDataFlagName(data[7]),
    flagCode: data[7],
  };
}

// 解析颈椎健康数据
function parseNeckHealthData(data: Uint8Array): Record<string, unknown> {
  if (data.length < 13) return { error: '数据长度不足' };
  return {
    totalDuration: parse4ByteValue(data, 4),
    totalDurationHours: (parse4ByteValue(data, 4) / 60).toFixed(1),
    level1: data[8],
    level2: data[9],
    level3: data[10],
    level4: data[11],
    level5: data[12],
  };
}

// 解析紧急联系人
function parseEmergencyContact(data: Uint8Array): Record<string, unknown> {
  if (data.length >= 5 && data[4] === 0xFF) {
    return { status: '未设置' };
  }
  if (data.length < 7) return { error: '数据长度不足' };
  
  const countryCode = parse2ByteValue(data, 4);
  const phoneLength = data[6];
  let phoneNumber = '';
  for (let i = 0; i < phoneLength && 7 + i < data.length; i++) {
    phoneNumber += data[7 + i];
  }
  return {
    countryCode: `+${countryCode}`,
    phoneNumber,
    fullNumber: `+${countryCode} ${phoneNumber}`,
  };
}

// 解析血氧测量状态
function parseSpO2Measure(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    measuring: data[4] === SWITCH_STATE.OFF,
    state: data[4] === SWITCH_STATE.OFF ? '测量中' : '已停止',
  };
}

// 解析心率测量状态
function parseHeartRateMeasure(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    measuring: data[4] === SWITCH_STATE.OFF,
    state: data[4] === SWITCH_STATE.OFF ? '测量中' : '已停止',
  };
}

// 解析久坐提醒
function parseSedentaryReminder(data: Uint8Array): Record<string, unknown> {
  if (data.length < 6) return { error: '数据长度不足' };
  return {
    enabled: data[4] === SWITCH_STATE.ON,
    state: getSwitchName(data[4]),
    interval: data[5],
  };
}

// 解析心率广播
function parseHeartRateBroadcast(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    enabled: data[4] === SWITCH_STATE.ON,
    state: getSwitchName(data[4]),
  };
}

// 解析运动状态
function parseSportStatus(data: Uint8Array): Record<string, unknown> {
  if (data.length < 12) return { error: '数据长度不足' };
  return {
    status: getSportStatusName(data[4]),
    statusCode: data[4],
    startTime: `20${data[5]}-${data[6].toString().padStart(2, '0')}-${data[7].toString().padStart(2, '0')} ${data[8].toString().padStart(2, '0')}:${data[9].toString().padStart(2, '0')}:${data[10].toString().padStart(2, '0')}`,
    sportType: getSportTypeName(data[11]),
    sportTypeCode: data[11],
  };
}

// 解析实时运动数据
function parseRealtimeSportData(data: Uint8Array): Record<string, unknown> {
  if (data.length < 24) return { error: '数据长度不足' };
  return {
    duration: parse3ByteValue(data, 4),
    durationFormatted: formatDuration(parse3ByteValue(data, 4)),
    distance: parse3ByteValue(data, 7),
    distanceKm: (parse3ByteValue(data, 7) / 1000).toFixed(2),
    steps: parse3ByteValue(data, 10),
    calories: parse2ByteValue(data, 13),
    heartRate: data[15],
    pace: parse2ByteValue(data, 16) / 100,
    stepFreq: data[18],
    groundContactTime: parse2ByteValue(data, 19),
    airTime: parse2ByteValue(data, 21),
    verticalAmplitude: data[23],
  };
}

// 格式化时长
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 解析运动总结
function parseSportSummary(data: Uint8Array): Record<string, unknown> {
  if (data.length < 49) return { error: '数据长度不足' };
  return {
    startTime: `20${data[4]}-${data[5].toString().padStart(2, '0')}-${data[6].toString().padStart(2, '0')} ${data[7].toString().padStart(2, '0')}:${data[8].toString().padStart(2, '0')}:${data[9].toString().padStart(2, '0')}`,
    sportType: getSportTypeName(data[10]),
    sportTypeCode: data[10],
    duration: parse3ByteValue(data, 11),
    durationFormatted: formatDuration(parse3ByteValue(data, 11)),
    distance: parse3ByteValue(data, 14),
    distanceKm: (parse3ByteValue(data, 14) / 1000).toFixed(2),
    vo2max: data[17],
    steps: parse3ByteValue(data, 18),
    calories: parse2ByteValue(data, 21),
    fastestPace: (parse2ByteValue(data, 23) / 100).toFixed(2),
    slowestPace: (parse2ByteValue(data, 25) / 100).toFixed(2),
    averagePace: (parse2ByteValue(data, 27) / 100).toFixed(2),
    minHeartRate: data[29],
    maxHeartRate: data[30],
    avgHeartRate: data[31],
    avgStepFreq: data[32],
    aerobicPerformance: data[33],
    anaerobicPerformance: data[34],
    avgGroundContactTime: parse2ByteValue(data, 35),
    avgAirTime: parse2ByteValue(data, 37),
    avgVerticalAmplitude: data[39],
    avgBalance: data[40],
    recoveryTime: data[41],
    heartRateZone1: data[42],
    heartRateZone2: data[43],
    heartRateZone3: data[44],
    heartRateZone4: data[45],
    heartRateZone5: data[46],
    lactateHeartRateZone: data[47],
    lactatePaceZone: data[48],
  };
}

// 解析运动分段
function parseSportSegment(data: Uint8Array): Record<string, unknown> {
  if (data.length < 11) return { error: '数据长度不足' };
  return {
    index: data[4],
    isLast: data[4] === 0xFF,
    duration: parse2ByteValue(data, 5),
    pace: (parse2ByteValue(data, 7) / 100).toFixed(2),
    avgHeartRate: data[9],
    avgStepFreq: data[10],
  };
}

// 解析数据接收完成
function parseDataReceived(data: Uint8Array): Record<string, unknown> {
  if (data.length < 5) return { error: '数据长度不足' };
  return {
    result: data[4] === 0x00 ? '成功' : '失败',
    resultCode: data[4],
  };
}

// 解析运动条数查询
function parseSportCountQuery(data: Uint8Array): Record<string, unknown> {
  if (data.length >= 5 && data[4] === 0xFF) {
    return { count: 0, records: [] };
  }
  if (data.length < 5) return { error: '数据长度不足' };
  
  const count = data[4];
  const records = [];
  for (let i = 0; i < count && 5 + i * 6 < data.length; i++) {
    const offset = 5 + i * 6;
    records.push({
      index: i + 1,
      startTime: `20${data[offset]}-${data[offset + 1].toString().padStart(2, '0')}-${data[offset + 2].toString().padStart(2, '0')} ${data[offset + 3].toString().padStart(2, '0')}:${data[offset + 4].toString().padStart(2, '0')}:${data[offset + 5].toString().padStart(2, '0')}`,
    });
  }
  return { count, records };
}

// 解析心率详情
function parseHeartRateDetail(data: Uint8Array): Record<string, unknown> {
  if (data.length < 6) return { error: '数据长度不足' };
  
  const count = data[4] - 1;
  const records = [];
  for (let i = 0; i < count && 5 + i * 5 < data.length; i++) {
    const offset = 5 + i * 5;
    records.push({
      day: data[offset],
      hour: data[offset + 1],
      minute: data[offset + 2],
      second: data[offset + 3],
      heartRate: data[offset + 4],
    });
  }
  return { count, records };
}

// 解析配速详情
function parsePaceDetail(data: Uint8Array): Record<string, unknown> {
  if (data.length < 6) return { error: '数据长度不足' };
  
  const count = data[4] - 1;
  const records = [];
  for (let i = 0; i < count && 5 + i * 6 < data.length; i++) {
    const offset = 5 + i * 6;
    records.push({
      day: data[offset],
      hour: data[offset + 1],
      minute: data[offset + 2],
      second: data[offset + 3],
      pace: (parse2ByteValue(data, offset + 4) / 100).toFixed(2),
    });
  }
  return { count, records };
}

// 解析步频详情
function parseStepFreqDetail(data: Uint8Array): Record<string, unknown> {
  if (data.length < 6) return { error: '数据长度不足' };
  
  const count = data[4] - 1;
  const records = [];
  for (let i = 0; i < count && 5 + i * 5 < data.length; i++) {
    const offset = 5 + i * 5;
    records.push({
      day: data[offset],
      hour: data[offset + 1],
      minute: data[offset + 2],
      second: data[offset + 3],
      stepFreq: data[offset + 4],
    });
  }
  return { count, records };
}

// 解析GPS详情
function parseGPSDetail(data: Uint8Array): Record<string, unknown> {
  if (data.length < 6) return { error: '数据长度不足' };
  
  const count = data[4] - 1;
  const records = [];
  for (let i = 0; i < count && 5 + i * 14 < data.length; i++) {
    const offset = 5 + i * 14;
    const lonSign = data[offset + 4] === 0 ? 1 : -1;
    const latSign = data[offset + 9] === 0 ? 1 : -1;
    records.push({
      day: data[offset],
      hour: data[offset + 1],
      minute: data[offset + 2],
      second: data[offset + 3],
      longitude: (lonSign * parse4ByteValue(data, offset + 5) / 1000000).toFixed(6),
      latitude: (latSign * parse4ByteValue(data, offset + 10) / 1000000).toFixed(6),
    });
  }
  return { count, records };
}

// ========== 主解析函数 ==========

export function parseResponse(data: Uint8Array): ParsedResponse | null {
  if (data.length < 4) return null;

  const header = data[0];
  if (header !== PROTOCOL_HEADER.DEVICE_TO_APP) {
    return null;
  }

  const fieldType = data[1];
  const length = data[2];
  const typeId = data[3];
  const checksum = data[data.length - 1];
  const checksumValid = calculateChecksum(data) === checksum;

  let parsedData: Record<string, unknown> = {};

  // 根据字段类型和类型标识选择解析函数
  if (fieldType === FIELD_TYPE.DEVICE_INFO_SYNC) {
    switch (typeId) {
      case TYPE_ID.PERSONAL_INFO:
        parsedData = parsePersonalInfo(data);
        break;
      case TYPE_ID.TIME_SYNC:
        parsedData = parseTimeSync(data);
        break;
      case TYPE_ID.HEART_RATE_ZONE:
        parsedData = parseHeartRateZone(data);
        break;
      case TYPE_ID.LACTATE_ZONE:
        parsedData = parseLactateZone(data);
        break;
    }
  } else if (fieldType === FIELD_TYPE.SPORT_TARGET) {
    switch (typeId) {
      case TYPE_ID.DISTANCE_TARGET:
        parsedData = parseDistanceTarget(data);
        break;
      case TYPE_ID.CALORIE_TARGET:
        parsedData = parseCalorieTarget(data);
        break;
      case TYPE_ID.STEP_TARGET:
        parsedData = parseStepTarget(data);
        break;
      case TYPE_ID.DAILY_DATA:
        parsedData = parseDailyData(data);
        break;
    }
  } else if (fieldType === FIELD_TYPE.HEALTH_MONITOR) {
    switch (typeId) {
      case TYPE_ID.SPO2_MONITOR:
        parsedData = parseSpO2Monitor(data);
        break;
      case TYPE_ID.HEART_RATE_MONITOR:
        parsedData = parseHeartRateMonitor(data);
        break;
      case TYPE_ID.NECK_HEALTH_MONITOR:
        parsedData = parseNeckHealthMonitor(data);
        break;
      case TYPE_ID.FALL_MONITOR:
        parsedData = parseFallMonitor(data);
        break;
      case TYPE_ID.SPO2_DATA:
        parsedData = parseSpO2Data(data);
        break;
      case TYPE_ID.HEART_RATE_DATA:
        parsedData = parseHeartRateData(data);
        break;
      case TYPE_ID.NECK_HEALTH_DATA:
        parsedData = parseNeckHealthData(data);
        break;
      case TYPE_ID.EMERGENCY_CONTACT:
        parsedData = parseEmergencyContact(data);
        break;
      case TYPE_ID.SPO2_MEASURE:
        parsedData = parseSpO2Measure(data);
        break;
      case TYPE_ID.HEART_RATE_MEASURE:
        parsedData = parseHeartRateMeasure(data);
        break;
      case TYPE_ID.SEDENTARY_REMINDER:
        parsedData = parseSedentaryReminder(data);
        break;
      case TYPE_ID.HEART_RATE_BROADCAST:
        parsedData = parseHeartRateBroadcast(data);
        break;
    }
  } else if (fieldType === FIELD_TYPE.SPORT_HEALTH) {
    switch (typeId) {
      case TYPE_ID.SPORT_STATUS:
        parsedData = parseSportStatus(data);
        break;
      case TYPE_ID.REALTIME_SPORT_DATA:
        parsedData = parseRealtimeSportData(data);
        break;
      case TYPE_ID.SPORT_SUMMARY:
        parsedData = parseSportSummary(data);
        break;
      case TYPE_ID.SPORT_SEGMENT:
        parsedData = parseSportSegment(data);
        break;
      case TYPE_ID.DATA_RECEIVED:
        parsedData = parseDataReceived(data);
        break;
      case TYPE_ID.SPORT_COUNT_QUERY:
        parsedData = parseSportCountQuery(data);
        break;
      case TYPE_ID.HEART_RATE_DETAIL:
        parsedData = parseHeartRateDetail(data);
        break;
      case TYPE_ID.PACE_DETAIL:
        parsedData = parsePaceDetail(data);
        break;
      case TYPE_ID.STEP_FREQ_DETAIL:
        parsedData = parseStepFreqDetail(data);
        break;
      case TYPE_ID.GPS_DETAIL:
        parsedData = parseGPSDetail(data);
        break;
    }
  }

  return {
    header: `0x${header.toString(16).toUpperCase().padStart(2, '0')}`,
    fieldType: getFieldTypeName(fieldType),
    fieldTypeCode: fieldType,
    length,
    typeId,
    typeName: getTypeIdName(fieldType, typeId),
    data: parsedData,
    checksum,
    checksumValid,
    rawData: bytesToHex(data),
  };
}
