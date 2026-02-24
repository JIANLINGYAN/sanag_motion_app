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
import { Target, Footprints, Flame, Route, CalendarIcon } from 'lucide-react';
import { bluetoothService } from '@/services/bluetooth';

interface SportTargetProps {
  disabled: boolean;
}

export function SportTarget({ disabled }: SportTargetProps) {
  const [distance, setDistance] = useState(10000); // 米
  const [calories, setCalories] = useState(3000000); // 卡 (3000大卡)
  const [steps, setSteps] = useState(30000); // 步
  const [date, setDate] = useState<Date>(new Date());

  const handleSetDistanceTarget = async () => {
    await bluetoothService.setDistanceTarget(distance);
  };

  const handleGetDistanceTarget = async () => {
    await bluetoothService.getDistanceTarget();
  };

  const handleSetCalorieTarget = async () => {
    await bluetoothService.setCalorieTarget(calories);
  };

  const handleGetCalorieTarget = async () => {
    await bluetoothService.getCalorieTarget();
  };

  const handleSetStepTarget = async () => {
    await bluetoothService.setStepTarget(steps);
  };

  const handleGetStepTarget = async () => {
    await bluetoothService.getStepTarget();
  };

  const handleGetDailyData = async () => {
    if (date) {
      await bluetoothService.getDailyData(date);
    }
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          运动目标 (0xBB)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="distance">距离目标</TabsTrigger>
            <TabsTrigger value="calories">消耗目标</TabsTrigger>
            <TabsTrigger value="steps">步数目标</TabsTrigger>
            <TabsTrigger value="daily">每日数据</TabsTrigger>
          </TabsList>

          {/* 距离目标 */}
          <TabsContent value="distance" className="space-y-4">
            <div className="space-y-2">
              <Label>目标距离</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                  disabled={disabled}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">米</span>
              </div>
              <div className="text-sm text-gray-500">
                当前设置: {(distance / 1000).toFixed(2)} 公里
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetDistanceTarget} disabled={disabled} className="flex-1">
                <Route className="h-4 w-4 mr-1" />
                设置距离目标
              </Button>
              <Button onClick={handleGetDistanceTarget} disabled={disabled} variant="outline" className="flex-1">
                获取距离目标
              </Button>
            </div>
          </TabsContent>

          {/* 消耗目标 */}
          <TabsContent value="calories" className="space-y-4">
            <div className="space-y-2">
              <Label>目标消耗</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                  disabled={disabled}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">卡</span>
              </div>
              <div className="text-sm text-gray-500">
                当前设置: {(calories / 1000).toFixed(0)} 大卡
              </div>
              <div className="text-sm text-gray-400">
                范围: 0-6,000,000 卡 (0-6000 大卡)
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetCalorieTarget} disabled={disabled} className="flex-1">
                <Flame className="h-4 w-4 mr-1" />
                设置消耗目标
              </Button>
              <Button onClick={handleGetCalorieTarget} disabled={disabled} variant="outline" className="flex-1">
                获取消耗目标
              </Button>
            </div>
          </TabsContent>

          {/* 步数目标 */}
          <TabsContent value="steps" className="space-y-4">
            <div className="space-y-2">
              <Label>目标步数</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(parseInt(e.target.value) || 0)}
                  disabled={disabled}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">步</span>
              </div>
              <div className="text-sm text-gray-400">
                范围: 0-60,000 步
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetStepTarget} disabled={disabled} className="flex-1">
                <Footprints className="h-4 w-4 mr-1" />
                设置步数目标
              </Button>
              <Button onClick={handleGetStepTarget} disabled={disabled} variant="outline" className="flex-1">
                获取步数目标
              </Button>
            </div>
          </TabsContent>

          {/* 每日数据 */}
          <TabsContent value="daily" className="space-y-4">
            <div className="space-y-2">
              <Label>选择日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleGetDailyData} disabled={disabled} className="w-full">
              <CalendarIcon className="h-4 w-4 mr-1" />
              获取当天步数、卡路里、距离
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
