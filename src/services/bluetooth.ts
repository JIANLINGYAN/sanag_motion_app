import {
  BLE_UUID,
  PROTOCOL_HEADER,
  FIELD_TYPE,
  TYPE_ID,
  SWITCH_STATE,
  type BluetoothDeviceInfo,
  type PersonalInfo,
  type TimeSync,
  type HeartRateZone,
  type LactateZone,
  type MonitorSetting,
  type EmergencyContact,
  type SportState,
  type GPSCoordinate,
  type LogEntry,
} from '@/types/bluetooth';

// 日志回调类型
export type LogCallback = (log: LogEntry) => void;

// 数据接收回调
export type DataCallback = (data: Uint8Array) => void;

class BluetoothService {
  private deviceInfo: BluetoothDeviceInfo | null = null;
  private logCallback: LogCallback | null = null;
  private dataCallbacks: Map<number, DataCallback[]> = new Map();
  private isConnected = false;

  // 设置日志回调
  setLogCallback(callback: LogCallback) {
    this.logCallback = callback;
  }

  // 添加日志
  private log(type: LogEntry['type'], message: string, data?: Uint8Array) {
    if (this.logCallback) {
      this.logCallback({
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        data,
      });
    }
  }

  // 计算校验和
  private calculateChecksum(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum & 0xFF;
  }

  // 构建协议包
  private buildPacket(fieldType: number, data: number[]): Uint8Array {
    const length = data.length;
    const packet = new Uint8Array([PROTOCOL_HEADER.APP_TO_DEVICE, fieldType, length, ...data]);
    const checksum = this.calculateChecksum(packet);
    return new Uint8Array([...packet, checksum]);
  }

  // 超时包装器
  private withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`${errorMsg}`)), ms)
      )
    ]);
  }

  // 连接蓝牙设备
  async connect(): Promise<boolean> {
    let device: BluetoothDevice | null = null;
    let server: BluetoothRemoteGATTServer | null = null;

    try {
      // 第一步：扫描设备
      this.log('info', '正在扫描蓝牙设备...');
      
      device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'sanag' },
          { namePrefix: 'Sanag' },
          { namePrefix: '塞那' },
          { namePrefix: 'Pro' },
          { namePrefix: 'Max' },
          { namePrefix: 'for' },
          { namePrefix: 'APP' },
          { namePrefix: 'AI' },
          { namePrefix: 'apex' },
          { namePrefix: 'Apex' },
        ],
        optionalServices: [BLE_UUID.SERVICE],
      });

      this.log('info', `找到设备: ${device.name || '未知设备'}`);

      // 监听设备断开事件
      device.addEventListener('gattserverdisconnected', () => {
        this.log('info', '设备已断开连接');
        this.deviceInfo = null;
        this.isConnected = false;
      });

      // 第二步：连接 GATT
      this.log('info', '正在连接 GATT...');
      if (!device.gatt) {
        throw new Error('设备不支持 GATT');
      }
      
      server = await device.gatt.connect();
      this.log('info', 'GATT 已连接');

      // 第三步：获取所有服务（触发服务发现）
      this.log('info', '正在发现服务...');
      const allServices = await this.withTimeout(
        server.getPrimaryServices(),
        10000,
        '服务发现超时'
      );
      
      this.log('info', `发现 ${allServices.length} 个服务`);
      
      // 查找我们的服务
      let service: BluetoothRemoteGATTService | null = null;
      for (const s of allServices) {
        this.log('info', `  - ${s.uuid}`);
        if (s.uuid === BLE_UUID.SERVICE || 
            s.uuid === BLE_UUID.SERVICE.toLowerCase() ||
            s.uuid === BLE_UUID.SERVICE.toUpperCase()) {
          service = s;
          this.log('info', '✓ 找到目标服务');
          break;
        }
      }
      
      if (!service) {
        // 尝试直接获取服务
        this.log('info', '尝试直接获取目标服务...');
        try {
          service = await server.getPrimaryService(BLE_UUID.SERVICE);
        } catch {
          throw new Error('未找到目标服务 FAA0');
        }
      }

      // 第四步：获取特征值
      this.log('info', '正在获取特征值...');
      const characteristics = await service.getCharacteristics();
      this.log('info', `发现 ${characteristics.length} 个特征值`);
      
      let writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
      let notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
      
      for (const char of characteristics) {
        this.log('info', `  - ${char.uuid}`);
        if (char.uuid === BLE_UUID.WRITE || char.uuid === BLE_UUID.WRITE.toLowerCase()) {
          writeCharacteristic = char;
        }
        if (char.uuid === BLE_UUID.NOTIFY || char.uuid === BLE_UUID.NOTIFY.toLowerCase()) {
          notifyCharacteristic = char;
        }
      }

      if (!writeCharacteristic || !notifyCharacteristic) {
        throw new Error('未找到必要的特征值');
      }
      
      this.log('info', '✓ 已获取特征值');

      // 第五步：开启通知
      this.log('info', '正在开启通知...');
      await this.withTimeout(
        notifyCharacteristic.startNotifications(),
        5000,
        '开启通知超时'
      );
      
      notifyCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value) {
          const data = new Uint8Array(value.buffer);
          this.handleNotification(data);
        }
      });
      this.log('info', '✓ 已开启通知');

      this.deviceInfo = {
        device,
        server,
        service,
        writeCharacteristic,
        notifyCharacteristic,
      };

      this.isConnected = true;
      this.log('info', '========== 连接成功 ==========');
      return true;
      
    } catch (error) {
      const err = error as Error;
      this.log('error', `连接失败: ${err.name} - ${err.message}`);
      
      // 清理
      if (server?.connected) {
        server.disconnect();
      }
      this.isConnected = false;
      this.deviceInfo = null;
      return false;
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    if (this.deviceInfo) {
      await this.deviceInfo.server.disconnect();
      this.deviceInfo = null;
      this.isConnected = false;
      this.log('info', '已断开连接');
    }
  }

  // 发送数据
  private async sendData(data: Uint8Array): Promise<boolean> {
    if (!this.deviceInfo) {
      this.log('error', '设备未连接');
      return false;
    }

    try {
      await this.deviceInfo.writeCharacteristic.writeValue(data.buffer as ArrayBuffer);
      this.log('send', `发送: ${this.bytesToHex(data)}`, data);
      return true;
    } catch (error) {
      this.log('error', `发送失败: ${error}`);
      return false;
    }
  }

  // 处理通知
  private handleNotification(data: Uint8Array) {
    this.log('receive', `接收: ${this.bytesToHex(data)}`, data);
    
    // 解析字段类型
    if (data.length >= 2) {
      const fieldType = data[1];
      const callbacks = this.dataCallbacks.get(fieldType);
      if (callbacks) {
        callbacks.forEach(cb => cb(data));
      }
    }
  }

  // 注册数据回调
  onData(fieldType: number, callback: DataCallback) {
    if (!this.dataCallbacks.has(fieldType)) {
      this.dataCallbacks.set(fieldType, []);
    }
    this.dataCallbacks.get(fieldType)?.push(callback);
  }

  // 取消注册数据回调
  offData(fieldType: number, callback: DataCallback) {
    const callbacks = this.dataCallbacks.get(fieldType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 字节数组转十六进制字符串
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }

  // ========== 设备信息同步 (0xBA) ==========

  // 1.1 设置个人信息
  async setPersonalInfo(info: PersonalInfo): Promise<boolean> {
    const weightInGrams = Math.floor(info.weight * 1000);
    const data = [
      TYPE_ID.PERSONAL_INFO,
      info.height,
      (weightInGrams >> 16) & 0xFF,
      (weightInGrams >> 8) & 0xFF,
      weightInGrams & 0xFF,
      info.age,
      info.gender,
    ];
    const packet = this.buildPacket(FIELD_TYPE.DEVICE_INFO_SYNC, data);
    return this.sendData(packet);
  }

  // 1.1 获取个人信息
  async getPersonalInfo(): Promise<boolean> {
    const data = [TYPE_ID.PERSONAL_INFO, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.DEVICE_INFO_SYNC, data);
    return this.sendData(packet);
  }

  // 1.2 时间同步
  async syncTime(timeSync: TimeSync): Promise<boolean> {
    const timestamp = timeSync.timestamp.toString();
    const data = [
      TYPE_ID.TIME_SYNC,
      timeSync.timezone,
      ...timestamp.split('').map(c => parseInt(c)),
    ];
    const packet = this.buildPacket(FIELD_TYPE.DEVICE_INFO_SYNC, data);
    return this.sendData(packet);
  }

  // 1.3 设置心率区间
  async setHeartRateZones(zones: HeartRateZone[]): Promise<boolean> {
    const data = [TYPE_ID.HEART_RATE_ZONE, zones.length];
    zones.forEach(zone => {
      data.push(zone.min, zone.max);
    });
    const packet = this.buildPacket(FIELD_TYPE.DEVICE_INFO_SYNC, data);
    return this.sendData(packet);
  }

  // 1.4 设置乳酸区间
  async setLactateZone(zone: LactateZone): Promise<boolean> {
    const data = [
      TYPE_ID.LACTATE_ZONE,
      zone.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
      zone.heartRateMin,
      zone.heartRateMax,
      (zone.paceMin >> 8) & 0xFF,
      zone.paceMin & 0xFF,
      (zone.paceMax >> 8) & 0xFF,
      zone.paceMax & 0xFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.DEVICE_INFO_SYNC, data);
    return this.sendData(packet);
  }

  // ========== 运动目标 (0xBB) ==========

  // 2.1 设置运动距离目标
  async setDistanceTarget(distance: number): Promise<boolean> {
    const data = [
      TYPE_ID.DISTANCE_TARGET,
      (distance >> 16) & 0xFF,
      (distance >> 8) & 0xFF,
      distance & 0xFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_TARGET, data);
    return this.sendData(packet);
  }

  // 2.1 获取运动距离目标
  async getDistanceTarget(): Promise<boolean> {
    const data = [TYPE_ID.DISTANCE_TARGET, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_TARGET, data);
    return this.sendData(packet);
  }

  // 2.2 设置运动消耗目标
  async setCalorieTarget(calories: number): Promise<boolean> {
    const data = [
      TYPE_ID.CALORIE_TARGET,
      (calories >> 16) & 0xFF,
      (calories >> 8) & 0xFF,
      calories & 0xFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_TARGET, data);
    return this.sendData(packet);
  }

  // 2.2 获取运动消耗目标
  async getCalorieTarget(): Promise<boolean> {
    const data = [TYPE_ID.CALORIE_TARGET, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_TARGET, data);
    return this.sendData(packet);
  }

  // 2.3 设置运动步数目标
  async setStepTarget(steps: number): Promise<boolean> {
    const data = [
      TYPE_ID.STEP_TARGET,
      (steps >> 16) & 0xFF,
      (steps >> 8) & 0xFF,
      steps & 0xFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_TARGET, data);
    return this.sendData(packet);
  }

  // 2.3 获取运动步数目标
  async getStepTarget(): Promise<boolean> {
    const data = [TYPE_ID.STEP_TARGET, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_TARGET, data);
    return this.sendData(packet);
  }

  // 2.4 获取当天步数、卡路里、距离
  async getDailyData(date: Date): Promise<boolean> {
    const data = [
      TYPE_ID.DAILY_DATA,
      date.getFullYear() % 100,
      date.getMonth() + 1,
      date.getDate(),
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_TARGET, data);
    return this.sendData(packet);
  }

  // ========== 健康检测相关 (0xBC) ==========

  // 3.1 血氧监测设置
  async setSpO2Monitor(setting: MonitorSetting): Promise<boolean> {
    const data = [
      TYPE_ID.SPO2_MONITOR,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
      setting.interval || 10,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.1 获取血氧监测设置
  async getSpO2Monitor(): Promise<boolean> {
    const data = [TYPE_ID.SPO2_MONITOR, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.2 心率监测设置
  async setHeartRateMonitor(setting: MonitorSetting): Promise<boolean> {
    const data = [
      TYPE_ID.HEART_RATE_MONITOR,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
      setting.interval || 10,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.2 获取心率监测设置
  async getHeartRateMonitor(): Promise<boolean> {
    const data = [TYPE_ID.HEART_RATE_MONITOR, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.3 颈椎健康监测设置
  async setNeckHealthMonitor(setting: MonitorSetting): Promise<boolean> {
    const data = [
      TYPE_ID.NECK_HEALTH_MONITOR,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.3 获取颈椎健康监测设置
  async getNeckHealthMonitor(): Promise<boolean> {
    const data = [TYPE_ID.NECK_HEALTH_MONITOR, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.4 跌倒监测设置
  async setFallMonitor(setting: MonitorSetting): Promise<boolean> {
    const data = [
      TYPE_ID.FALL_MONITOR,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.4 获取跌倒监测设置
  async getFallMonitor(): Promise<boolean> {
    const data = [TYPE_ID.FALL_MONITOR, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.5 获取血氧数据
  async getSpO2Data(date: Date): Promise<boolean> {
    const data = [
      TYPE_ID.SPO2_DATA,
      date.getFullYear() % 100,
      date.getMonth() + 1,
      date.getDate(),
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.6 获取心率数据
  async getHeartRateData(date: Date): Promise<boolean> {
    const data = [
      TYPE_ID.HEART_RATE_DATA,
      date.getFullYear() % 100,
      date.getMonth() + 1,
      date.getDate(),
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.7 获取颈椎健康数据
  async getNeckHealthData(date: Date): Promise<boolean> {
    const data = [
      TYPE_ID.NECK_HEALTH_DATA,
      date.getFullYear() % 100,
      date.getMonth() + 1,
      date.getDate(),
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.8 设置紧急联系人
  async setEmergencyContact(contact: EmergencyContact): Promise<boolean> {
    const countryCode = parseInt(contact.countryCode);
    const phoneBytes = contact.phoneNumber.split('').map(c => parseInt(c));
    const data = [
      TYPE_ID.EMERGENCY_CONTACT,
      (countryCode >> 8) & 0xFF,
      countryCode & 0xFF,
      phoneBytes.length,
      ...phoneBytes,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.8 获取紧急联系人
  async getEmergencyContact(): Promise<boolean> {
    const data = [TYPE_ID.EMERGENCY_CONTACT, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.9 主动血氧测量
  async setSpO2Measure(start: boolean): Promise<boolean> {
    const data = [
      TYPE_ID.SPO2_MEASURE,
      start ? SWITCH_STATE.OFF : SWITCH_STATE.ON,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.9 获取血氧测量状态
  async getSpO2MeasureStatus(): Promise<boolean> {
    const data = [TYPE_ID.SPO2_MEASURE, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.10 主动心率测量
  async setHeartRateMeasure(start: boolean): Promise<boolean> {
    const data = [
      TYPE_ID.HEART_RATE_MEASURE,
      start ? SWITCH_STATE.OFF : SWITCH_STATE.ON,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.10 获取心率测量状态
  async getHeartRateMeasureStatus(): Promise<boolean> {
    const data = [TYPE_ID.HEART_RATE_MEASURE, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.11 久坐提醒设置（3月3号更新：只有开关，无时间间隔）
  async setSedentaryReminder(setting: MonitorSetting): Promise<boolean> {
    const data = [
      TYPE_ID.SEDENTARY_REMINDER,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.11 获取久坐提醒设置
  async getSedentaryReminder(): Promise<boolean> {
    const data = [TYPE_ID.SEDENTARY_REMINDER, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.12 心率广播设置
  async setHeartRateBroadcast(enabled: boolean): Promise<boolean> {
    const data = [
      TYPE_ID.HEART_RATE_BROADCAST,
      enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.12 获取心率广播设置
  async getHeartRateBroadcast(): Promise<boolean> {
    const data = [TYPE_ID.HEART_RATE_BROADCAST, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.13 颈椎传感器佩戴检测设置
  async setNeckSensorWearDetection(enabled: boolean): Promise<boolean> {
    const data = [
      TYPE_ID.NECK_SENSOR_WEAR_DETECTION,
      enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.13 获取颈椎传感器佩戴检测设置
  async getNeckSensorWearDetection(): Promise<boolean> {
    const data = [TYPE_ID.NECK_SENSOR_WEAR_DETECTION, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.14 颈椎传感器校准
  async setNeckSensorCalibration(step: number): Promise<boolean> {
    const data = [
      TYPE_ID.NECK_SENSOR_CALIBRATION,
      step, // 0x01: 直视, 0x02: 低头, 0x03: 回正
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.15 颈椎舒展提醒设置
  async setNeckStretchReminder(setting: { enabled: boolean; interval: number }): Promise<boolean> {
    const data = [
      TYPE_ID.NECK_STRETCH_REMINDER,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
      setting.interval, // 10-60分钟
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.15 获取颈椎舒展提醒设置
  async getNeckStretchReminder(): Promise<boolean> {
    const data = [TYPE_ID.NECK_STRETCH_REMINDER, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.16 同步最近7天健康数据
  async syncLast7DaysHealth(date: Date): Promise<boolean> {
    const data = [
      TYPE_ID.SYNC_LAST_7_DAYS_HEALTH,
      date.getFullYear() % 100,
      date.getMonth() + 1,
      date.getDate(),
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.17 心率过高提醒设置
  async setHeartRateHighAlert(setting: { enabled: boolean; threshold: number }): Promise<boolean> {
    const data = [
      TYPE_ID.HEART_RATE_HIGH_ALERT,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
      setting.threshold,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.17 获取心率过高提醒设置
  async getHeartRateHighAlert(): Promise<boolean> {
    const data = [TYPE_ID.HEART_RATE_HIGH_ALERT, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.18 心率过低提醒设置
  async setHeartRateLowAlert(setting: { enabled: boolean; threshold: number }): Promise<boolean> {
    const data = [
      TYPE_ID.HEART_RATE_LOW_ALERT,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
      setting.threshold,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.18 获取心率过低提醒设置
  async getHeartRateLowAlert(): Promise<boolean> {
    const data = [TYPE_ID.HEART_RATE_LOW_ALERT, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.19 血氧过低提醒设置
  async setSpO2LowAlert(setting: { enabled: boolean; threshold: number }): Promise<boolean> {
    const data = [
      TYPE_ID.SPO2_LOW_ALERT,
      setting.enabled ? SWITCH_STATE.ON : SWITCH_STATE.OFF,
      setting.threshold,
    ];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // 3.19 获取血氧过低提醒设置
  async getSpO2LowAlert(): Promise<boolean> {
    const data = [TYPE_ID.SPO2_LOW_ALERT, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.HEALTH_MONITOR, data);
    return this.sendData(packet);
  }

  // ========== 运动健康功能 (0xBD) ==========

  // 4.1 运动状态设置
  async setSportState(state: SportState): Promise<boolean> {
    const data = [
      TYPE_ID.SPORT_STATUS,
      state.status,
      state.year % 100,
      state.month,
      state.day,
      state.hour,
      state.minute,
      state.second,
      state.sportType,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.1 获取运动状态
  async getSportState(): Promise<boolean> {
    const data = [TYPE_ID.SPORT_STATUS, 0xFF];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.2 上报GPS坐标
  async reportGPS(coord: GPSCoordinate): Promise<boolean> {
    const longitude = Math.abs(Math.floor(coord.longitude * 1000000));
    const latitude = Math.abs(Math.floor(coord.latitude * 1000000));
    const data = [
      TYPE_ID.GPS_REPORT,
      coord.longitude >= 0 ? 0x00 : 0x01,
      (longitude >> 24) & 0xFF,
      (longitude >> 16) & 0xFF,
      (longitude >> 8) & 0xFF,
      longitude & 0xFF,
      coord.latitude >= 0 ? 0x00 : 0x01,
      (latitude >> 24) & 0xFF,
      (latitude >> 16) & 0xFF,
      (latitude >> 8) & 0xFF,
      latitude & 0xFF,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.4 获取运动总结
  async getSportSummary(): Promise<boolean> {
    const data = [TYPE_ID.SPORT_SUMMARY];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.5 获取运动分段数据
  async getSportSegment(): Promise<boolean> {
    const data = [TYPE_ID.SPORT_SEGMENT];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.6 通知数据接收完成
  async notifyDataReceived(startTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }): Promise<boolean> {
    const data = [
      TYPE_ID.DATA_RECEIVED,
      startTime.year % 100,
      startTime.month,
      startTime.day,
      startTime.hour,
      startTime.minute,
      startTime.second,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.7 获取运动总结条数
  async getSportCount(): Promise<boolean> {
    const data = [TYPE_ID.SPORT_COUNT_QUERY];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.8 获取心率数据详情
  async getHeartRateDetail(startTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }): Promise<boolean> {
    const data = [
      TYPE_ID.HEART_RATE_DETAIL,
      startTime.year % 100,
      startTime.month,
      startTime.day,
      startTime.hour,
      startTime.minute,
      startTime.second,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.9 获取配速数据详情
  async getPaceDetail(startTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }): Promise<boolean> {
    const data = [
      TYPE_ID.PACE_DETAIL,
      startTime.year % 100,
      startTime.month,
      startTime.day,
      startTime.hour,
      startTime.minute,
      startTime.second,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.10 获取步频数据详情
  async getStepFreqDetail(startTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }): Promise<boolean> {
    const data = [
      TYPE_ID.STEP_FREQ_DETAIL,
      startTime.year % 100,
      startTime.month,
      startTime.day,
      startTime.hour,
      startTime.minute,
      startTime.second,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 4.11 获取GPS数据详情
  async getGPSDetail(startTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }): Promise<boolean> {
    const data = [
      TYPE_ID.GPS_DETAIL,
      startTime.year % 100,
      startTime.month,
      startTime.day,
      startTime.hour,
      startTime.minute,
      startTime.second,
    ];
    const packet = this.buildPacket(FIELD_TYPE.SPORT_HEALTH, data);
    return this.sendData(packet);
  }

  // 获取连接状态
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // 获取设备名称
  getDeviceName(): string {
    return this.deviceInfo?.device.name || '';
  }
}

export const bluetoothService = new BluetoothService();
