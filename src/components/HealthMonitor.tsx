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
import { CalendarIcon, Heart, Activity, Phone, AlertTriangle, PersonStanding, Radio, Trash2 } from 'lucide-react';
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
  
  // 测量状态
  const [spo2Measuring, setSpo2Measuring] = useState(false);
  const [hrMeasuring, setHrMeasuring] = useState(false);
  
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="spo2">血氧</TabsTrigger>
            <TabsTrigger value="heartrate">心率</TabsTrigger>
            <TabsTrigger value="neck">颈椎</TabsTrigger>
            <TabsTrigger value="fall">跌倒</TabsTrigger>
            <TabsTrigger value="contact">联系人</TabsTrigger>
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
