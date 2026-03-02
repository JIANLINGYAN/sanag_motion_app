import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon, Heart, Activity, Phone, AlertTriangle, PersonStanding, Radio, Trash2, Watch, Ruler, CalendarDays } from 'lucide-react';
import { bluetoothService } from '@/services/bluetooth';
import { type MonitorSetting, type EmergencyContact } from '@/types/bluetooth';
import { Switch } from '@/components/ui/switch';
import { type HealthDataPoint } from '@/components/HealthChart';

interface HealthMonitorProps {
  disabled: boolean;
  heartRateData: HealthDataPoint[];
  spo2Data: HealthDataPoint[];
  onClearHealthData: () => void;
}

export function HealthMonitor({ disabled, heartRateData, spo2Data, onClearHealthData }: HealthMonitorProps) {
  const [date, setDate] = useState<Date>(new Date());
  
  // 监测设置
  const [spo2Setting, setSpo2Setting] = useState<MonitorSetting>({ enabled: true, interval: 10 });
  const [hrSetting, setHrSetting] = useState<MonitorSetting>({ enabled: true, interval: 10 });
  const [neckSetting, setNeckSetting] = useState<MonitorSetting>({ enabled: true });
  const [fallSetting, setFallSetting] = useState<MonitorSetting>({ enabled: true });
  const [sedentarySetting, setSedentarySetting] = useState<MonitorSetting>({ enabled: true, interval: 5 });
  const [hrBroadcast, setHrBroadcast] = useState(true);

  // 传感器设置
  const [neckWearDetection, setNeckWearDetection] = useState(true);
  const [neckStretchEnabled, setNeckStretchEnabled] = useState(true);
  const [neckStretchInterval, setNeckStretchInterval] = useState(30);
  const [calibrationStep, setCalibrationStep] = useState(0);

  // 测量状态
  const [spo2Measuring, setSpo2Measuring] = useState(false);
  const [hrMeasuring, setHrMeasuring] = useState(false);

  // 提醒设置
  const [hrHighAlert, setHrHighAlert] = useState({ enabled: true, threshold: 190 });
  const [hrLowAlert, setHrLowAlert] = useState({ enabled: true, threshold: 40 });
  const [spo2LowAlert, setSpo2LowAlert] = useState({ enabled: true, threshold: 90 });

  // 紧急联系人
  const [contact, setContact] = useState<EmergencyContact>({
    countryCode: '86',
    phoneNumber: '13230650700',
  });

  // 血氧监测
  const handleSetSpO2Monitor = async () => {
    await bluetoothService.setSpO2Monitor(spo2Setting);
  };
  const handleGetSpO2Monitor = async () => {
    await bluetoothService.getSpO2Monitor();
  };

  // 心率监测
  const handleSetHeartRateMonitor = async () => {
    await bluetoothService.setHeartRateMonitor(hrSetting);
  };
  const handleGetHeartRateMonitor = async () => {
    await bluetoothService.getHeartRateMonitor();
  };

  // 颈椎健康监测
  const handleSetNeckHealthMonitor = async () => {
    await bluetoothService.setNeckHealthMonitor(neckSetting);
  };
  const handleGetNeckHealthMonitor = async () => {
    await bluetoothService.getNeckHealthMonitor();
  };

  // 跌倒监测
  const handleSetFallMonitor = async () => {
    await bluetoothService.setFallMonitor(fallSetting);
  };
  const handleGetFallMonitor = async () => {
    await bluetoothService.getFallMonitor();
  };

  // 获取数据
  const handleGetSpO2Data = async () => {
    if (date) await bluetoothService.getSpO2Data(date);
  };
  const handleGetHeartRateData = async () => {
    if (date) await bluetoothService.getHeartRateData(date);
  };
  const handleGetNeckHealthData = async () => {
    if (date) await bluetoothService.getNeckHealthData(date);
  };

  // 紧急联系人
  const handleSetEmergencyContact = async () => {
    await bluetoothService.setEmergencyContact(contact);
  };
  const handleGetEmergencyContact = async () => {
    await bluetoothService.getEmergencyContact();
  };

  // 主动测量
  const handleToggleSpO2Measure = async () => {
    const newState = !spo2Measuring;
    setSpo2Measuring(newState);
    await bluetoothService.setSpO2Measure(newState);
  };
  const handleToggleHeartRateMeasure = async () => {
    const newState = !hrMeasuring;
    setHrMeasuring(newState);
    await bluetoothService.setHeartRateMeasure(newState);
  };

  // 久坐提醒
  const handleSetSedentaryReminder = async () => {
    await bluetoothService.setSedentaryReminder(sedentarySetting);
  };
  const handleGetSedentaryReminder = async () => {
    await bluetoothService.getSedentaryReminder();
  };

  // 心率广播
  const handleSetHeartRateBroadcast = async () => {
    await bluetoothService.setHeartRateBroadcast(hrBroadcast);
  };
  const handleGetHeartRateBroadcast = async () => {
    await bluetoothService.getHeartRateBroadcast();
  };

  // 颈椎传感器佩戴检测
  const handleSetNeckWearDetection = async () => {
    await bluetoothService.setNeckSensorWearDetection(neckWearDetection);
  };
  const handleGetNeckWearDetection = async () => {
    await bluetoothService.getNeckSensorWearDetection();
  };

  // 颈椎传感器校准
  const handleCalibrateNeckSensor = async (step: number) => {
    setCalibrationStep(step);
    await bluetoothService.setNeckSensorCalibration(step);
  };

  // 颈椎舒展提醒
  const handleSetNeckStretchReminder = async () => {
    await bluetoothService.setNeckStretchReminder({ enabled: neckStretchEnabled, interval: neckStretchInterval });
  };
  const handleGetNeckStretchReminder = async () => {
    await bluetoothService.getNeckStretchReminder();
  };

  // 同步最近7天健康数据
  const handleSyncLast7DaysHealth = async () => {
    if (date) await bluetoothService.syncLast7DaysHealth(date);
  };

  // 心率过高提醒
  const handleSetHeartRateHighAlert = async () => {
    await bluetoothService.setHeartRateHighAlert(hrHighAlert);
  };
  const handleGetHeartRateHighAlert = async () => {
    await bluetoothService.getHeartRateHighAlert();
  };

  // 心率过低提醒
  const handleSetHeartRateLowAlert = async () => {
    await bluetoothService.setHeartRateLowAlert(hrLowAlert);
  };
  const handleGetHeartRateLowAlert = async () => {
    await bluetoothService.getHeartRateLowAlert();
  };

  // 血氧过低提醒
  const handleSetSpO2LowAlert = async () => {
    await bluetoothService.setSpO2LowAlert(spo2LowAlert);
  };
  const handleGetSpO2LowAlert = async () => {
    await bluetoothService.getSpO2LowAlert();
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            健康检测 (0xBC)
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              心率: {heartRateData.length} | 血氧: {spo2Data.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearHealthData}
              disabled={heartRateData.length === 0 && spo2Data.length === 0}
              title="清除图表数据"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="spo2" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="spo2">血氧</TabsTrigger>
            <TabsTrigger value="heartrate">心率</TabsTrigger>
            <TabsTrigger value="neck">颈椎</TabsTrigger>
            <TabsTrigger value="fall">跌倒</TabsTrigger>
            <TabsTrigger value="contact">联系人</TabsTrigger>
            <TabsTrigger value="sensor">传感器</TabsTrigger>
            <TabsTrigger value="sync">数据同步</TabsTrigger>
            <TabsTrigger value="other">其他</TabsTrigger>
          </TabsList>

          {/* 血氧监测 */}
          <TabsContent value="spo2" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>血氧监测开关</Label>
                <Switch
                  checked={spo2Setting.enabled}
                  onCheckedChange={(checked) =>
                    setSpo2Setting({ ...spo2Setting, enabled: checked })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>监测间隔 (分钟)</Label>
                <Input
                  type="number"
                  value={spo2Setting.interval}
                  onChange={(e) =>
                    setSpo2Setting({
                      ...spo2Setting,
                      interval: parseInt(e.target.value) || 10,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetSpO2Monitor} disabled={disabled} className="flex-1">
                  设置血氧监测
                </Button>
                <Button onClick={handleGetSpO2Monitor} disabled={disabled} variant="outline" className="flex-1">
                  获取设置
                </Button>
              </div>
              <div className="border-t pt-4">
                <Label className="mb-2 block">选择日期获取数据</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" disabled={disabled}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleGetSpO2Data} disabled={disabled} className="w-full mt-2">
                  获取血氧数据
                </Button>
              </div>
              <div className="border-t pt-4">
                <Button
                  onClick={handleToggleSpO2Measure}
                  disabled={disabled}
                  variant={spo2Measuring ? 'destructive' : 'default'}
                  className="w-full"
                >
                  <Activity className="h-4 w-4 mr-1" />
                  {spo2Measuring ? '停止血氧测量' : '开始血氧测量'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 心率监测 */}
          <TabsContent value="heartrate" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>心率监测开关</Label>
                <Switch
                  checked={hrSetting.enabled}
                  onCheckedChange={(checked) =>
                    setHrSetting({ ...hrSetting, enabled: checked })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>监测间隔 (分钟)</Label>
                <Input
                  type="number"
                  value={hrSetting.interval}
                  onChange={(e) =>
                    setHrSetting({
                      ...hrSetting,
                      interval: parseInt(e.target.value) || 10,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetHeartRateMonitor} disabled={disabled} className="flex-1">
                  设置心率监测
                </Button>
                <Button onClick={handleGetHeartRateMonitor} disabled={disabled} variant="outline" className="flex-1">
                  获取设置
                </Button>
              </div>
              <div className="border-t pt-4">
                <Label className="mb-2 block">选择日期获取数据</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" disabled={disabled}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleGetHeartRateData} disabled={disabled} className="w-full mt-2">
                  获取心率数据
                </Button>
              </div>
              <div className="border-t pt-4">
                <Button
                  onClick={handleToggleHeartRateMeasure}
                  disabled={disabled}
                  variant={hrMeasuring ? 'destructive' : 'default'}
                  className="w-full"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  {hrMeasuring ? '停止心率测量' : '开始心率测量'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 颈椎健康 */}
          <TabsContent value="neck" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>颈椎健康监测开关</Label>
                <Switch
                  checked={neckSetting.enabled}
                  onCheckedChange={(checked) =>
                    setNeckSetting({ ...neckSetting, enabled: checked })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetNeckHealthMonitor} disabled={disabled} className="flex-1">
                  <PersonStanding className="h-4 w-4 mr-1" />
                  设置颈椎监测
                </Button>
                <Button onClick={handleGetNeckHealthMonitor} disabled={disabled} variant="outline" className="flex-1">
                  获取设置
                </Button>
              </div>
              <div className="border-t pt-4">
                <Label className="mb-2 block">选择日期获取数据</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" disabled={disabled}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleGetNeckHealthData} disabled={disabled} className="w-full mt-2">
                  获取颈椎健康数据
                </Button>
              </div>
              <div className="border-t pt-4">
                <Label className="mb-2 block">颈椎舒展提醒设置</Label>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">提醒开关</Label>
                  <Switch
                    checked={neckStretchEnabled}
                    onCheckedChange={setNeckStretchEnabled}
                    disabled={disabled}
                  />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    type="number"
                    min={10}
                    max={60}
                    value={neckStretchInterval}
                    onChange={(e) => setNeckStretchInterval(parseInt(e.target.value) || 30)}
                    disabled={disabled}
                    placeholder="10-60分钟"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">分钟</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetNeckStretchReminder} disabled={disabled} className="flex-1" size="sm">
                    <Ruler className="h-4 w-4 mr-1" />
                    设置舒展提醒
                  </Button>
                  <Button onClick={handleGetNeckStretchReminder} disabled={disabled} variant="outline" className="flex-1" size="sm">
                    获取设置
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 跌倒监测 */}
          <TabsContent value="fall" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>跌倒监测开关</Label>
                <Switch
                  checked={fallSetting.enabled}
                  onCheckedChange={(checked) =>
                    setFallSetting({ ...fallSetting, enabled: checked })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetFallMonitor} disabled={disabled} className="flex-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  设置跌倒监测
                </Button>
                <Button onClick={handleGetFallMonitor} disabled={disabled} variant="outline" className="flex-1">
                  获取设置
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 紧急联系人 */}
          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>国际区号</Label>
                <Input
                  value={contact.countryCode}
                  onChange={(e) =>
                    setContact({ ...contact, countryCode: e.target.value })
                  }
                  disabled={disabled}
                  placeholder="如: 86"
                />
              </div>
              <div className="space-y-2">
                <Label>电话号码</Label>
                <Input
                  value={contact.phoneNumber}
                  onChange={(e) =>
                    setContact({ ...contact, phoneNumber: e.target.value })
                  }
                  disabled={disabled}
                  placeholder="如: 13230650700"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetEmergencyContact} disabled={disabled} className="flex-1">
                  <Phone className="h-4 w-4 mr-1" />
                  设置紧急联系人
                </Button>
                <Button onClick={handleGetEmergencyContact} disabled={disabled} variant="outline" className="flex-1">
                  获取联系人
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 传感器设置 */}
          <TabsContent value="sensor" className="space-y-4">
            <div className="space-y-4">
              {/* 颈椎传感器佩戴检测 */}
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Watch className="h-4 w-4" />
                  颈椎传感器佩戴检测
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <Label>检测开关</Label>
                  <Switch
                    checked={neckWearDetection}
                    onCheckedChange={setNeckWearDetection}
                    disabled={disabled}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetNeckWearDetection} disabled={disabled} size="sm" className="flex-1">
                    设置
                  </Button>
                  <Button onClick={handleGetNeckWearDetection} disabled={disabled} variant="outline" size="sm" className="flex-1">
                    获取
                  </Button>
                </div>
              </div>

              {/* 颈椎传感器校准 */}
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">颈椎传感器校准</h4>
                <p className="text-sm text-gray-500 mb-3">请按顺序完成以下三步校准：</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => handleCalibrateNeckSensor(1)}
                    disabled={disabled}
                    variant={calibrationStep === 1 ? 'default' : 'outline'}
                    size="sm"
                  >
                    第一步：直视
                  </Button>
                  <Button
                    onClick={() => handleCalibrateNeckSensor(2)}
                    disabled={disabled}
                    variant={calibrationStep === 2 ? 'default' : 'outline'}
                    size="sm"
                  >
                    第二步：低头
                  </Button>
                  <Button
                    onClick={() => handleCalibrateNeckSensor(3)}
                    disabled={disabled}
                    variant={calibrationStep === 3 ? 'default' : 'outline'}
                    size="sm"
                  >
                    第三步：回正
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 数据同步 */}
          <TabsContent value="sync" className="space-y-4">
            <div className="space-y-4">
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  同步最近7天健康数据
                </h4>
                <p className="text-sm text-gray-500 mb-3">选择日期，获取从该日期往前7天的所有健康数据</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start mb-3" disabled={disabled}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleSyncLast7DaysHealth} disabled={disabled} className="w-full">
                  开始同步7天数据
                </Button>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p className="font-medium">数据类型包括：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>活动数据（步数、卡路里、距离）</li>
                  <li>心率数据</li>
                  <li>血氧数据</li>
                  <li>颈椎健康数据</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* 其他设置 */}
          <TabsContent value="other" className="space-y-4">
            <div className="space-y-4">
              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">久坐提醒</h4>
                <div className="flex items-center justify-between mb-2">
                  <Label>提醒开关</Label>
                  <Switch
                    checked={sedentarySetting.enabled}
                    onCheckedChange={(checked) =>
                      setSedentarySetting({ ...sedentarySetting, enabled: checked })
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2 mb-3">
                  <Label>提醒间隔 (分钟, 范围1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={sedentarySetting.interval}
                    onChange={(e) =>
                      setSedentarySetting({
                        ...sedentarySetting,
                        interval: parseInt(e.target.value) || 5,
                      })
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetSedentaryReminder} disabled={disabled} size="sm" className="flex-1">
                    设置
                  </Button>
                  <Button onClick={handleGetSedentaryReminder} disabled={disabled} variant="outline" size="sm" className="flex-1">
                    获取
                  </Button>
                </div>
              </div>

              <div className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">心率广播</h4>
                <div className="flex items-center justify-between mb-3">
                  <Label>广播开关</Label>
                  <Switch
                    checked={hrBroadcast}
                    onCheckedChange={setHrBroadcast}
                    disabled={disabled}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetHeartRateBroadcast} disabled={disabled} size="sm" className="flex-1">
                    <Radio className="h-4 w-4 mr-1" />
                    设置
                  </Button>
                  <Button onClick={handleGetHeartRateBroadcast} disabled={disabled} variant="outline" size="sm" className="flex-1">
                    获取
                  </Button>
                </div>
              </div>

              {/* 心率过高提醒 */}
              <div className="border p-4 rounded-lg border-red-200 bg-red-50/30">
                <h4 className="font-medium mb-3 text-red-900">心率过高提醒</h4>
                <div className="flex items-center justify-between mb-2">
                  <Label>提醒开关</Label>
                  <Switch
                    checked={hrHighAlert.enabled}
                    onCheckedChange={(checked) =>
                      setHrHighAlert({ ...hrHighAlert, enabled: checked })
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2 mb-3">
                  <Label>阈值 (bpm)</Label>
                  <select
                    value={hrHighAlert.threshold}
                    onChange={(e) =>
                      setHrHighAlert({ ...hrHighAlert, threshold: parseInt(e.target.value) })
                    }
                    disabled={disabled}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value={150}>150</option>
                    <option value={160}>160</option>
                    <option value={170}>170</option>
                    <option value={180}>180</option>
                    <option value={190}>190 (默认)</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetHeartRateHighAlert} disabled={disabled} size="sm" className="flex-1 bg-red-500 hover:bg-red-600">
                    设置
                  </Button>
                  <Button onClick={handleGetHeartRateHighAlert} disabled={disabled} variant="outline" size="sm" className="flex-1">
                    获取
                  </Button>
                </div>
              </div>

              {/* 心率过低提醒 */}
              <div className="border p-4 rounded-lg border-blue-200 bg-blue-50/30">
                <h4 className="font-medium mb-3 text-blue-900">心率过低提醒</h4>
                <div className="flex items-center justify-between mb-2">
                  <Label>提醒开关</Label>
                  <Switch
                    checked={hrLowAlert.enabled}
                    onCheckedChange={(checked) =>
                      setHrLowAlert({ ...hrLowAlert, enabled: checked })
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2 mb-3">
                  <Label>阈值 (bpm)</Label>
                  <select
                    value={hrLowAlert.threshold}
                    onChange={(e) =>
                      setHrLowAlert({ ...hrLowAlert, threshold: parseInt(e.target.value) })
                    }
                    disabled={disabled}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value={40}>40 (默认)</option>
                    <option value={45}>45</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetHeartRateLowAlert} disabled={disabled} size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                    设置
                  </Button>
                  <Button onClick={handleGetHeartRateLowAlert} disabled={disabled} variant="outline" size="sm" className="flex-1">
                    获取
                  </Button>
                </div>
              </div>

              {/* 血氧过低提醒 */}
              <div className="border p-4 rounded-lg border-cyan-200 bg-cyan-50/30">
                <h4 className="font-medium mb-3 text-cyan-900">血氧过低提醒</h4>
                <div className="flex items-center justify-between mb-2">
                  <Label>提醒开关</Label>
                  <Switch
                    checked={spo2LowAlert.enabled}
                    onCheckedChange={(checked) =>
                      setSpo2LowAlert({ ...spo2LowAlert, enabled: checked })
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2 mb-3">
                  <Label>阈值 (%)</Label>
                  <select
                    value={spo2LowAlert.threshold}
                    onChange={(e) =>
                      setSpo2LowAlert({ ...spo2LowAlert, threshold: parseInt(e.target.value) })
                    }
                    disabled={disabled}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value={80}>80</option>
                    <option value={85}>85</option>
                    <option value={90}>90 (默认)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSetSpO2LowAlert} disabled={disabled} size="sm" className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                    设置
                  </Button>
                  <Button onClick={handleGetSpO2LowAlert} disabled={disabled} variant="outline" size="sm" className="flex-1">
                    获取
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
