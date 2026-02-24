# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 常用命令

```bash
npm run dev      # 启动开发服务器 (Vite)
npm run build    # 构建生产版本 (TypeScript 检查 + Vite 打包)
npm run lint     # 运行 ESLint 代码检查
npm run preview  # 预览生产构建结果
```

## 技术栈

- Node.js 20, React 19, TypeScript 5.9, Vite 7.2.4
- Tailwind CSS v3.4.19 + shadcn/ui 组件库
- Web Bluetooth API (仅支持 Chrome/Edge 浏览器)

## 架构概述

这是一个 Sanag 运动耳机蓝牙协议测试工具，用于通过 Web Bluetooth API 发送和接收蓝牙协议指令。

### 核心服务层 (`src/services/`)

**`bluetooth.ts`** - 蓝牙服务类 (BluetoothService)
- 单例模式，管理设备连接、断开、数据收发
- 使用 BLE_UUID (Service: `0xFAA0`, Write: `0xFAA1`, Notify: `0xFAA2`)
- 协议包结构: `[Header(0xAA)][FieldType][Length][Data...][Checksum]`
- 提供 `onData(fieldType, callback)` 注册数据回调，`send()` 发送数据
- 设备名称过滤前缀: sanag, Sanag, 塞那, Pro, Max, for, APP, AI

**`protocolParser.ts`** - 协议解析器
- 解析设备响应数据 `[Header(0xA5)][FieldType][Length][TypeId][Data...][Checksum]`
- 返回 `ParsedResponse` 对象，包含解析后的类型名称和结构化数据

### 类型定义 (`src/types/bluetooth.ts`)

定义所有协议常量和数据接口：
- `FIELD_TYPE`: 4个功能模块标识 (0xBA设备信息, 0xBB运动目标, 0xBC健康检测, 0xBD运动健康)
- `TYPE_ID`: 各模块下的具体命令类型标识
- 数据接口: PersonalInfo, TimeSync, SportTarget, RealtimeSportData, SportSummary 等

### 功能组件 (`src/components/`)

每个组件对应一个协议功能模块，通过 `bluetoothService` 发送指令：
- `DeviceConnection.tsx` - 设备连接/断开控制
- `DeviceInfoSync.tsx` - 0xBA 设备信息同步 (个人信息、时间、心率/乳酸区间)
- `SportTarget.tsx` - 0xBB 运动目标设置 (距离、卡路里、步数)
- `HealthMonitor.tsx` - 0xBC 健康检测 (血氧、心率、颈椎健康、跌倒监测)
- `HealthChart.tsx` - 健康数据图表可视化组件
- `SportHealth.tsx` - 0xBD 运动健康 (运动状态、GPS、实时数据、运动总结)
- `LogPanel.tsx` / `ResponsePanel.tsx` - 日志和响应展示

### 数据流

1. 用户操作组件 → 调用 `bluetoothService` 的方法 (如 `setPersonalInfo()`) 发送指令
2. 设备响应 → `notifyCharacteristic` 触发 → 解析器解析 → 回调更新 UI
3. `App.tsx` 注册全局数据回调，解析后显示 Toast 并更新 `ResponsePanel`

### 日志机制

- `bluetoothService.setLogCallback(callback)` - 注册日志回调，接收连接/发送/接收/错误事件
- `LogPanel` 组件通过此回调展示所有蓝牙通信日志

### UI 组件

使用 shadcn/ui，位于 `src/components/ui/`。导入方式：
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
```

路径别名 `@/` 映射到 `./src/` (见 `vite.config.ts`)。
