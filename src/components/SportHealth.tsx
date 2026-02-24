import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Square, MapPin, TrendingUp, Database, Activity, Footprints, Navigation } from 'lucide-react';
import { bluetoothService } from '@/services/bluetooth';
import { SPORT_STATUS, SPORT_TYPE, type SportState, type GPSCoordinate } from '@/types/bluetooth';

interface SportHealthProps {
  disabled: boolean;
}

export function SportHealth({ disabled }: SportHealthProps) {
  const [sportStatus, setSportStatus] = useState<number>(SPORT_STATUS.NOT_STARTED);
  const [sportType, setSportType] = useState<number>(SPORT_TYPE.OUTDOOR_RUNNING);
  const [longitude, setLongitude] = useState<number>(114.061219);
  const [latitude, setLatitude] = useState<number>(22.604802);
  
  // 运动开始时间（用于查询详情）
  const [startTime, setStartTime] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
    second: new Date().getSeconds(),
  });

  const handleSportStateChange = async (status: number) => {
    const now = new Date();
    const state: SportState = {
      status,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      sportType,
    };
    await bluetoothService.setSportState(state);
    setSportStatus(status);
  };

  const handleGetSportState = async () => {
    await bluetoothService.getSportState();
  };

  const handleReportGPS = async () => {
    const coord: GPSCoordinate = { longitude, latitude };
    await bluetoothService.reportGPS(coord);
  };

  const handleGetSportSummary = async () => {
    await bluetoothService.getSportSummary();
  };

  const handleGetSportSegment = async () => {
    await bluetoothService.getSportSegment();
  };

  const handleGetSportCount = async () => {
    await bluetoothService.getSportCount();
  };

  const handleGetHeartRateDetail = async () => {
    await bluetoothService.getHeartRateDetail(startTime);
  };

  const handleGetPaceDetail = async () => {
    await bluetoothService.getPaceDetail(startTime);
  };

  const handleGetStepFreqDetail = async () => {
    await bluetoothService.getStepFreqDetail(startTime);
  };

  const handleGetGPSDetail = async () => {
    await bluetoothService.getGPSDetail(startTime);
  };

  const handleNotifyDataReceived = async () => {
    await bluetoothService.notifyDataReceived(startTime);
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          运动健康功能 (0xBD)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status">运动状态</TabsTrigger>
            <TabsTrigger value="gps">GPS上报</TabsTrigger>
            <TabsTrigger value="summary">运动总结</TabsTrigger>
            <TabsTrigger value="query">数据查询</TabsTrigger>
            <TabsTrigger value="detail">详情查询</TabsTrigger>
          </TabsList>

          {/* 运动状态 */}
          <TabsContent value="status" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>运动类型</Label>
                <Select
                  value={sportType.toString()}
                  onValueChange={(value) => setSportType(parseInt(value))}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SPORT_TYPE.INDOOR_TREADMILL.toString()}>室内跑步机</SelectItem>
                    <SelectItem value={SPORT_TYPE.OUTDOOR_RUNNING.toString()}>户外跑步</SelectItem>
                    <SelectItem value={SPORT_TYPE.OUTDOOR_WALKING.toString()}>户外健走</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={() => handleSportStateChange(SPORT_STATUS.STARTED)}
                  disabled={disabled}
                  variant={sportStatus === SPORT_STATUS.STARTED ? 'default' : 'outline'}
                  className="flex flex-col items-center py-4"
                >
                  <Play className="h-5 w-5 mb-1" />
                  开始
                </Button>
                <Button
                  onClick={() => handleSportStateChange(SPORT_STATUS.PAUSED)}
                  disabled={disabled}
                  variant={sportStatus === SPORT_STATUS.PAUSED ? 'default' : 'outline'}
                  className="flex flex-col items-center py-4"
                >
                  <Pause className="h-5 w-5 mb-1" />
                  暂停
                </Button>
                <Button
                  onClick={() => handleSportStateChange(SPORT_STATUS.RESUMED)}
                  disabled={disabled}
                  variant={sportStatus === SPORT_STATUS.RESUMED ? 'default' : 'outline'}
                  className="flex flex-col items-center py-4"
                >
                  <RotateCcw className="h-5 w-5 mb-1" />
                  恢复
                </Button>
                <Button
                  onClick={() => handleSportStateChange(SPORT_STATUS.ENDED)}
                  disabled={disabled}
                  variant={sportStatus === SPORT_STATUS.ENDED ? 'destructive' : 'outline'}
                  className="flex flex-col items-center py-4"
                >
                  <Square className="h-5 w-5 mb-1" />
                  结束
                </Button>
              </div>
              
              <Button onClick={handleGetSportState} disabled={disabled} variant="outline" className="w-full">
                获取当前运动状态
              </Button>
            </div>
          </TabsContent>

          {/* GPS上报 */}
          <TabsContent value="gps" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>经度</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>纬度</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p>示例坐标（深圳）：</p>
              <p>经度: 114.061219</p>
              <p>纬度: 22.604802</p>
            </div>
            <Button onClick={handleReportGPS} disabled={disabled} className="w-full">
              <MapPin className="h-4 w-4 mr-1" />
              上报GPS坐标
            </Button>
          </TabsContent>

          {/* 运动总结 */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleGetSportSummary} disabled={disabled}>
                <TrendingUp className="h-4 w-4 mr-1" />
                获取运动总结
              </Button>
              <Button onClick={handleGetSportSegment} disabled={disabled} variant="outline">
                获取分段数据
              </Button>
            </div>
            <div className="border-t pt-4">
              <Button onClick={handleGetSportCount} disabled={disabled} className="w-full">
                <Database className="h-4 w-4 mr-1" />
                查询储存运动条数
              </Button>
            </div>
            <div className="border-t pt-4">
              <Label className="mb-2 block">通知数据接收完成</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input
                  placeholder="年"
                  value={startTime.year % 100}
                  onChange={(e) => setStartTime({ ...startTime, year: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="月"
                  value={startTime.month}
                  onChange={(e) => setStartTime({ ...startTime, month: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="日"
                  value={startTime.day}
                  onChange={(e) => setStartTime({ ...startTime, day: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input
                  placeholder="时"
                  value={startTime.hour}
                  onChange={(e) => setStartTime({ ...startTime, hour: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="分"
                  value={startTime.minute}
                  onChange={(e) => setStartTime({ ...startTime, minute: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="秒"
                  value={startTime.second}
                  onChange={(e) => setStartTime({ ...startTime, second: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
              </div>
              <Button onClick={handleNotifyDataReceived} disabled={disabled} variant="outline" className="w-full">
                通知设备数据已接收
              </Button>
            </div>
          </TabsContent>

          {/* 数据查询 */}
          <TabsContent value="query" className="space-y-4">
            <div className="space-y-2">
              <Label>运动开始时间（用于查询各项数据）</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="年"
                  value={startTime.year % 100}
                  onChange={(e) => setStartTime({ ...startTime, year: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="月"
                  value={startTime.month}
                  onChange={(e) => setStartTime({ ...startTime, month: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="日"
                  value={startTime.day}
                  onChange={(e) => setStartTime({ ...startTime, day: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="时"
                  value={startTime.hour}
                  onChange={(e) => setStartTime({ ...startTime, hour: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="分"
                  value={startTime.minute}
                  onChange={(e) => setStartTime({ ...startTime, minute: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="秒"
                  value={startTime.second}
                  onChange={(e) => setStartTime({ ...startTime, second: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleGetHeartRateDetail} disabled={disabled}>
                <Activity className="h-4 w-4 mr-1" />
                查询心率详情
              </Button>
              <Button onClick={handleGetPaceDetail} disabled={disabled}>
                <TrendingUp className="h-4 w-4 mr-1" />
                查询配速详情
              </Button>
              <Button onClick={handleGetStepFreqDetail} disabled={disabled}>
                <Footprints className="h-4 w-4 mr-1" />
                查询步频详情
              </Button>
              <Button onClick={handleGetGPSDetail} disabled={disabled}>
                <Navigation className="h-4 w-4 mr-1" />
                查询GPS详情
              </Button>
            </div>
          </TabsContent>

          {/* 详情查询 */}
          <TabsContent value="detail" className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">数据查询说明</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>心率详情：获取运动过程中的所有心率数据</li>
                <li>配速详情：获取运动过程中的所有配速数据</li>
                <li>步频详情：获取运动过程中的所有步频数据</li>
                <li>GPS详情：获取运动过程中的所有定位数据</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label>运动开始时间</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="年"
                  value={startTime.year % 100}
                  onChange={(e) => setStartTime({ ...startTime, year: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="月"
                  value={startTime.month}
                  onChange={(e) => setStartTime({ ...startTime, month: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="日"
                  value={startTime.day}
                  onChange={(e) => setStartTime({ ...startTime, day: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="时"
                  value={startTime.hour}
                  onChange={(e) => setStartTime({ ...startTime, hour: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="分"
                  value={startTime.minute}
                  onChange={(e) => setStartTime({ ...startTime, minute: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
                <Input
                  placeholder="秒"
                  value={startTime.second}
                  onChange={(e) => setStartTime({ ...startTime, second: parseInt(e.target.value) || 0 })}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleGetHeartRateDetail} disabled={disabled} variant="outline">
                查询心率详情
              </Button>
              <Button onClick={handleGetPaceDetail} disabled={disabled} variant="outline">
                查询配速详情
              </Button>
              <Button onClick={handleGetStepFreqDetail} disabled={disabled} variant="outline">
                查询步频详情
              </Button>
              <Button onClick={handleGetGPSDetail} disabled={disabled} variant="outline">
                查询GPS详情
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
