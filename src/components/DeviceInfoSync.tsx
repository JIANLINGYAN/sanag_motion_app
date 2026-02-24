import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Clock, Heart, Activity } from 'lucide-react';
import { bluetoothService } from '@/services/bluetooth';
import { GENDER, type PersonalInfo, type TimeSync, type HeartRateZone, type LactateZone } from '@/types/bluetooth';

interface DeviceInfoSyncProps {
  disabled: boolean;
}

export function DeviceInfoSync({ disabled }: DeviceInfoSyncProps) {
  // 个人信息
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    height: 170,
    weight: 60,
    age: 25,
    gender: GENDER.MALE,
  });

  // 时间同步
  const [timezone, setTimezone] = useState(8);

  // 心率区间
  const [heartRateZones, setHeartRateZones] = useState<HeartRateZone[]>([
    { min: 75, max: 85 },
    { min: 85, max: 95 },
    { min: 95, max: 105 },
    { min: 105, max: 115 },
    { min: 115, max: 125 },
  ]);

  // 乳酸区间
  const [lactateZone, setLactateZone] = useState<LactateZone>({
    enabled: true,
    heartRateMin: 150,
    heartRateMax: 180,
    paceMin: 300,
    paceMax: 360,
  });

  const handleSetPersonalInfo = async () => {
    await bluetoothService.setPersonalInfo(personalInfo);
  };

  const handleGetPersonalInfo = async () => {
    await bluetoothService.getPersonalInfo();
  };

  const handleSyncTime = async () => {
    const timeSync: TimeSync = {
      timezone,
      timestamp: Date.now(),
    };
    await bluetoothService.syncTime(timeSync);
  };

  const handleSetHeartRateZones = async () => {
    await bluetoothService.setHeartRateZones(heartRateZones);
  };

  const handleSetLactateZone = async () => {
    await bluetoothService.setLactateZone(lactateZone);
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          设备信息同步 (0xBA)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">个人信息</TabsTrigger>
            <TabsTrigger value="time">时间同步</TabsTrigger>
            <TabsTrigger value="heartrate">心率区间</TabsTrigger>
            <TabsTrigger value="lactate">乳酸区间</TabsTrigger>
          </TabsList>

          {/* 个人信息 */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>身高 (cm)</Label>
                <Input
                  type="number"
                  value={personalInfo.height}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, height: parseInt(e.target.value) || 0 })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>体重 (kg)</Label>
                <Input
                  type="number"
                  value={personalInfo.weight}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, weight: parseInt(e.target.value) || 0 })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>年龄</Label>
                <Input
                  type="number"
                  value={personalInfo.age}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, age: parseInt(e.target.value) || 0 })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>性别</Label>
                <Select
                  value={personalInfo.gender.toString()}
                  onValueChange={(value) =>
                    setPersonalInfo({ ...personalInfo, gender: parseInt(value) })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENDER.MALE.toString()}>男</SelectItem>
                    <SelectItem value={GENDER.FEMALE.toString()}>女</SelectItem>
                    <SelectItem value={GENDER.UNKNOWN.toString()}>保密</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetPersonalInfo} disabled={disabled} className="flex-1">
                设置个人信息
              </Button>
              <Button onClick={handleGetPersonalInfo} disabled={disabled} variant="outline" className="flex-1">
                获取个人信息
              </Button>
            </div>
          </TabsContent>

          {/* 时间同步 */}
          <TabsContent value="time" className="space-y-4">
            <div className="space-y-2">
              <Label>时区</Label>
              <Select
                value={timezone.toString()}
                onValueChange={(value) => setTimezone(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 25 }, (_, i) => i - 12).map((tz) => (
                    <SelectItem key={tz} value={tz.toString()}>
                      {tz >= 0 ? `东${tz}区` : `西${Math.abs(tz)}区`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                当前时间戳: {Date.now()}
              </p>
              <p className="text-sm text-gray-600">
                当前时间: {new Date().toLocaleString()}
              </p>
            </div>
            <Button onClick={handleSyncTime} disabled={disabled} className="w-full">
              <Clock className="h-4 w-4 mr-1" />
              同步时间
            </Button>
          </TabsContent>

          {/* 心率区间 */}
          <TabsContent value="heartrate" className="space-y-4">
            <div className="space-y-3">
              {heartRateZones.map((zone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm w-16">区间 {index + 1}</span>
                  <Input
                    type="number"
                    placeholder="最小值"
                    value={zone.min}
                    onChange={(e) => {
                      const newZones = [...heartRateZones];
                      newZones[index].min = parseInt(e.target.value) || 0;
                      setHeartRateZones(newZones);
                    }}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="最大值"
                    value={zone.max}
                    onChange={(e) => {
                      const newZones = [...heartRateZones];
                      newZones[index].max = parseInt(e.target.value) || 0;
                      setHeartRateZones(newZones);
                    }}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">bpm</span>
                </div>
              ))}
            </div>
            <Button onClick={handleSetHeartRateZones} disabled={disabled} className="w-full">
              <Heart className="h-4 w-4 mr-1" />
              设置心率区间
            </Button>
          </TabsContent>

          {/* 乳酸区间 */}
          <TabsContent value="lactate" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>启用乳酸区间</Label>
                <Select
                  value={lactateZone.enabled ? '1' : '0'}
                  onValueChange={(value) =>
                    setLactateZone({ ...lactateZone, enabled: value === '1' })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">启用</SelectItem>
                    <SelectItem value="0">关闭</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>心率最小值 (bpm)</Label>
                <Input
                  type="number"
                  value={lactateZone.heartRateMin}
                  onChange={(e) =>
                    setLactateZone({
                      ...lactateZone,
                      heartRateMin: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>心率最大值 (bpm)</Label>
                <Input
                  type="number"
                  value={lactateZone.heartRateMax}
                  onChange={(e) =>
                    setLactateZone({
                      ...lactateZone,
                      heartRateMax: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>最低配速 (秒/公里)</Label>
                <Input
                  type="number"
                  value={lactateZone.paceMin}
                  onChange={(e) =>
                    setLactateZone({
                      ...lactateZone,
                      paceMin: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>最高配速 (秒/公里)</Label>
                <Input
                  type="number"
                  value={lactateZone.paceMax}
                  onChange={(e) =>
                    setLactateZone({
                      ...lactateZone,
                      paceMax: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              配速说明: 5分钟/公里 = 300秒/公里
            </div>
            <Button onClick={handleSetLactateZone} disabled={disabled} className="w-full">
              <Activity className="h-4 w-4 mr-1" />
              设置乳酸区间
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
