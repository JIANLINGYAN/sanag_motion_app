import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, BluetoothOff, RefreshCw } from 'lucide-react';
import { bluetoothService } from '@/services/bluetooth';

interface DeviceConnectionProps {
  onConnectionChange: (connected: boolean) => void;
}

export function DeviceConnection({ onConnectionChange }: DeviceConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    // 检查蓝牙是否可用
    if (!navigator.bluetooth) {
      alert('您的浏览器不支持 Web Bluetooth API，请使用 Chrome 或 Edge 浏览器');
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await bluetoothService.connect();
      if (success) {
        setIsConnected(true);
        setDeviceName(bluetoothService.getDeviceName());
        onConnectionChange(true);
        
        // 连接成功后自动同步时间（东八区 +8）
        const now = new Date();
        await bluetoothService.syncTime({
          timezone: 8,
          timestamp: now.getTime(),
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothService.disconnect();
    setIsConnected(false);
    setDeviceName('');
    onConnectionChange(false);
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bluetooth className="h-5 w-5" />
          设备连接
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <Badge variant="default" className="bg-green-500">
                  <Bluetooth className="h-3 w-3 mr-1" />
                  已连接
                </Badge>
                <span className="text-sm font-medium">{deviceName}</span>
              </>
            ) : (
              <Badge variant="secondary">
                <BluetoothOff className="h-3 w-3 mr-1" />
                未连接
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                <BluetoothOff className="h-4 w-4 mr-1" />
                断开连接
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Bluetooth className="h-4 w-4 mr-1" />
                )}
                {isConnecting ? '连接中...' : '连接设备'}
              </Button>
            )}
          </div>
        </div>
        
        {!isConnected && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium">连接说明：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>请确保设备已开启并在附近</li>
              <li>设备名称需包含: sanag, Sanag, 塞那, Pro, Max 等</li>
              <li>首次连接需要在弹出的窗口中选择设备</li>
              <li>请使用 Chrome 或 Edge 浏览器</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
