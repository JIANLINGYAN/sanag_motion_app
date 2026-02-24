import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Heart, Activity } from 'lucide-react';

export interface HealthDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

interface HealthChartProps {
  heartRateData: HealthDataPoint[];
  spo2Data: HealthDataPoint[];
}

export function HealthChart({ heartRateData, spo2Data }: HealthChartProps) {
  // 合并心率和血氧数据用于双轴图表
  const combinedData = mergeData(heartRateData, spo2Data);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          健康数据可视化
        </CardTitle>
      </CardHeader>
      <CardContent>
        {heartRateData.length === 0 && spo2Data.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无数据，请连接设备后获取心率和血氧数据
          </div>
        ) : (
          <div className="space-y-6">
            {/* 心率图表 */}
            {heartRateData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  心率 (BPM)
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={heartRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis domain={[40, 200]} fontSize={12} />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number) => [`${value} BPM`, '心率']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 3 }}
                      activeDot={{ r: 5 }}
                      name="心率"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 血氧图表 */}
            {spo2Data.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Activity className="h-4 w-4 text-blue-500" />
                  血氧饱和度 (%)
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={spo2Data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis domain={[80, 100]} fontSize={12} />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number) => [`${value}%`, '血氧']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 3 }}
                      activeDot={{ r: 5 }}
                      name="血氧"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 组合图表 - 如果同时有心率和血氧数据 */}
            {heartRateData.length > 0 && spo2Data.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">心率与血氧对比</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis
                      yAxisId="left"
                      domain={[40, 200]}
                      fontSize={12}
                      stroke="#ef4444"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[80, 100]}
                      fontSize={12}
                      stroke="#3b82f6"
                    />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 2 }}
                      name="心率 (BPM)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="spo2"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 2 }}
                      name="血氧 (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 数据统计 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {heartRateData.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="font-medium text-red-700">心率统计</div>
                  <div className="text-red-600 mt-1">
                    平均: {Math.round(heartRateData.reduce((a, b) => a + b.value, 0) / heartRateData.length)} BPM
                  </div>
                  <div className="text-red-600">
                    范围: {Math.min(...heartRateData.map(d => d.value))} - {Math.max(...heartRateData.map(d => d.value))} BPM
                  </div>
                  <div className="text-red-600">
                    数据点: {heartRateData.length}
                  </div>
                </div>
              )}
              {spo2Data.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-700">血氧统计</div>
                  <div className="text-blue-600 mt-1">
                    平均: {Math.round(spo2Data.reduce((a, b) => a + b.value, 0) / spo2Data.length)}%
                  </div>
                  <div className="text-blue-600">
                    范围: {Math.min(...spo2Data.map(d => d.value))} - {Math.max(...spo2Data.map(d => d.value))}%
                  </div>
                  <div className="text-blue-600">
                    数据点: {spo2Data.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 合并心率和血氧数据
function mergeData(heartRateData: HealthDataPoint[], spo2Data: HealthDataPoint[]) {
  const timeMap = new Map<string, { heartRate?: number; spo2?: number; timestamp: number }>();

  heartRateData.forEach((d) => {
    const existing = timeMap.get(d.time) || { timestamp: d.timestamp };
    timeMap.set(d.time, { ...existing, heartRate: d.value });
  });

  spo2Data.forEach((d) => {
    const existing = timeMap.get(d.time) || { timestamp: d.timestamp };
    timeMap.set(d.time, { ...existing, spo2: d.value });
  });

  return Array.from(timeMap.entries())
    .map(([time, data]) => ({
      time,
      heartRate: data.heartRate,
      spo2: data.spo2,
      timestamp: data.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
