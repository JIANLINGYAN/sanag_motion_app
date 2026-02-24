import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { DeviceConnection } from '@/components/DeviceConnection';
import { DeviceInfoSync } from '@/components/DeviceInfoSync';
import { SportTarget } from '@/components/SportTarget';
import { HealthMonitor } from '@/components/HealthMonitor';
import { SportHealth } from '@/components/SportHealth';
import { LogPanel } from '@/components/LogPanel';
import { ResponsePanel } from '@/components/ResponsePanel';
import { HealthChart, type HealthDataPoint } from '@/components/HealthChart';
import { bluetoothService } from '@/services/bluetooth';
import { parseResponse, type ParsedResponse } from '@/services/protocolParser';
import { FIELD_TYPE, TYPE_ID, type LogEntry } from '@/types/bluetooth';
import { Bluetooth, Settings, Target, Heart, Activity, Terminal } from 'lucide-react';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [parsedResponse, setParsedResponse] = useState<ParsedResponse | null>(null);
  
  // 健康数据可视化
  const [heartRateData, setHeartRateData] = useState<HealthDataPoint[]>([]);
  const [spo2Data, setSpo2Data] = useState<HealthDataPoint[]>([]);

  // 添加日志
  const addLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 清空健康数据
  const clearHealthData = useCallback(() => {
    setHeartRateData([]);
    setSpo2Data([]);
  }, []);

  // 关闭响应面板
  const closeResponsePanel = useCallback(() => {
    setParsedResponse(null);
  }, []);

  // 设置日志回调
  useEffect(() => {
    bluetoothService.setLogCallback(addLog);
  }, [addLog]);

  // 注册数据接收回调
  useEffect(() => {
    const handleData = (data: Uint8Array) => {
      // 解析响应数据
      const parsed = parseResponse(data);
      if (parsed) {
        setParsedResponse(parsed);
        
        // 处理心率数据
        if (parsed.fieldTypeCode === FIELD_TYPE.HEALTH_MONITOR && 
            parsed.typeId === TYPE_ID.HEART_RATE_DATA) {
          const { hour, minute, value } = parsed.data;
          if (typeof hour === 'number' && typeof minute === 'number' && typeof value === 'number') {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const timestamp = hour * 60 + minute;
            setHeartRateData(prev => {
              // 避免重复数据
              if (prev.some(d => d.time === timeStr)) return prev;
              return [...prev, { time: timeStr, value, timestamp }].sort((a, b) => a.timestamp - b.timestamp);
            });
          }
        }
        
        // 处理血氧数据
        if (parsed.fieldTypeCode === FIELD_TYPE.HEALTH_MONITOR && 
            parsed.typeId === TYPE_ID.SPO2_DATA) {
          const { hour, minute, value } = parsed.data;
          if (typeof hour === 'number' && typeof minute === 'number' && typeof value === 'number') {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const timestamp = hour * 60 + minute;
            setSpo2Data(prev => {
              // 避免重复数据
              if (prev.some(d => d.time === timeStr)) return prev;
              return [...prev, { time: timeStr, value, timestamp }].sort((a, b) => a.timestamp - b.timestamp);
            });
          }
        }
        
        // 显示 Toast 提示
        const result = parsed.data.result || parsed.data.status || parsed.data.state || '收到响应';
        toast.success(
          `${parsed.typeName}: ${result}`,
          { duration: 3000 }
        );
      }
    };

    // 注册所有字段类型的回调
    Object.values(FIELD_TYPE).forEach((fieldType) => {
      bluetoothService.onData(fieldType, handleData);
    });

    return () => {
      Object.values(FIELD_TYPE).forEach((fieldType) => {
        bluetoothService.offData(fieldType, handleData);
      });
    };
  }, []);

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      toast.success('设备连接成功');
    } else {
      toast.info('设备已断开');
      setParsedResponse(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Bluetooth className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sanag 蓝牙协议测试工具</h1>
                <p className="text-sm text-gray-500">运动耳机蓝牙协议控制指令测试</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Device Connection */}
          <DeviceConnection onConnectionChange={handleConnectionChange} />

          {/* Response Panel - 显示解析后的响应数据 */}
          {parsedResponse && (
            <ResponsePanel response={parsedResponse} onClose={closeResponsePanel} />
          )}

          {/* Protocol Test Tabs */}
          <Tabs defaultValue="device-info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="device-info" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">设备信息 (0xBA)</span>
                <span className="sm:hidden">0xBA</span>
              </TabsTrigger>
              <TabsTrigger value="sport-target" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">运动目标 (0xBB)</span>
                <span className="sm:hidden">0xBB</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">健康检测 (0xBC)</span>
                <span className="sm:hidden">0xBC</span>
              </TabsTrigger>
              <TabsTrigger value="sport-health" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">运动健康 (0xBD)</span>
                <span className="sm:hidden">0xBD</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="device-info" className="mt-4">
              <DeviceInfoSync disabled={!isConnected} />
            </TabsContent>

            <TabsContent value="sport-target" className="mt-4">
              <SportTarget disabled={!isConnected} />
            </TabsContent>

            <TabsContent value="health" className="mt-4 space-y-4">
              <HealthMonitor 
                disabled={!isConnected} 
                heartRateData={heartRateData}
                spo2Data={spo2Data}
                onClearHealthData={clearHealthData}
              />
              <HealthChart heartRateData={heartRateData} spo2Data={spo2Data} />
            </TabsContent>

            <TabsContent value="sport-health" className="mt-4">
              <SportHealth disabled={!isConnected} />
            </TabsContent>
          </Tabs>

          {/* Log Panel */}
          <div className="mt-6">
            <LogPanel logs={logs} onClear={clearLogs} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Terminal className="h-4 w-4" />
              <span>Web Bluetooth API 测试工具</span>
            </div>
            <div>支持 Chrome / Edge 浏览器</div>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
