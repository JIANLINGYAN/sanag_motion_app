"""
Sanag 蓝牙协议测试工具 - 桌面版 (Windows)
使用 WinRT 接口进行蓝牙通信，解决 Web Bluetooth 在某些电脑上的兼容性问题
"""

import asyncio
import json
import struct
import os
from datetime import datetime
from typing import Optional, Callable
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

# 获取脚本所在目录
SCRIPT_DIR = Path(__file__).parent.resolve()
STATIC_DIR = SCRIPT_DIR / "static"

# WinRT 蓝牙相关导入
try:
    from winsdk.windows.devices.bluetooth import BluetoothLEDevice
    from winsdk.windows.devices.bluetooth.genericattributeprofile import (
        GattDeviceService,
        GattCharacteristic,
        GattCharacteristicProperties,
        GattClientCharacteristicConfigurationDescriptorValue,
        GattCommunicationStatus,
    )
    from winsdk.windows.devices.bluetooth.advertisement import (
        BluetoothLEAdvertisementWatcher,
        BluetoothLEScanningMode,
    )
    from winsdk.windows.storage.streams import Buffer, DataReader, DataWriter
    WINRT_AVAILABLE = True
except ImportError:
    WINRT_AVAILABLE = False
    print("警告: WinRT 不可用，请安装 winsdk 包: pip install winsdk")

# 蓝牙 UUID
BLE_UUID = {
    "SERVICE": "0000faa0-0000-1000-8000-00805f9b34fb",
    "WRITE": "0000faa1-0000-1000-8000-00805f9b34fb",
    "NOTIFY": "0000faa2-0000-1000-8000-00805f9b34fb",
}

# 协议常量
PROTOCOL_HEADER = {"APP_TO_DEVICE": 0xAA, "DEVICE_TO_APP": 0xA5}
FIELD_TYPE = {"DEVICE_INFO_SYNC": 0xBA, "SPORT_TARGET": 0xBB, "HEALTH_MONITOR": 0xBC, "SPORT_HEALTH": 0xBD}
TYPE_ID = {
    "PERSONAL_INFO": 0x00, "TIME_SYNC": 0x01, "HEART_RATE_ZONE": 0x02, "LACTATE_ZONE": 0x03,
    "DISTANCE_TARGET": 0x00, "CALORIE_TARGET": 0x01, "STEP_TARGET": 0x02, "DAILY_DATA": 0x03,
    "SPO2_MONITOR": 0x00, "HEART_RATE_MONITOR": 0x01, "NECK_HEALTH_MONITOR": 0x02, "FALL_MONITOR": 0x03,
    "SPO2_DATA": 0x04, "HEART_RATE_DATA": 0x05, "NECK_HEALTH_DATA": 0x06, "EMERGENCY_CONTACT": 0x07,
    "SPO2_MEASURE": 0x08, "HEART_RATE_MEASURE": 0x09, "SEDENTARY_REMINDER": 0x0A, "HEART_RATE_BROADCAST": 0x0B,
    "SPORT_STATUS": 0x00, "GPS_REPORT": 0x01, "REALTIME_SPORT_DATA": 0x02, "SPORT_SUMMARY": 0x03,
    "SPORT_SEGMENT": 0x04, "DATA_RECEIVED": 0x05, "SPORT_COUNT_QUERY": 0x06,
    "HEART_RATE_DETAIL": 0x07, "PACE_DETAIL": 0x08, "STEP_FREQ_DETAIL": 0x09, "GPS_DETAIL": 0x0A,
}
GENDER = {"UNKNOWN": 0x00, "MALE": 0x01, "FEMALE": 0x02}
SPORT_STATUS = {"NOT_STARTED": 0x00, "STARTED": 0x01, "PAUSED": 0x02, "RESUMED": 0x03, "ENDED": 0x04}
SPORT_TYPE = {"INDOOR_TREADMILL": 0x00, "OUTDOOR_RUNNING": 0x01, "OUTDOOR_WALKING": 0x02}
SWITCH_STATE = {"ON": 0x00, "OFF": 0x01}


class BluetoothService:
    def __init__(self, log_callback: Optional[Callable] = None):
        self.device: Optional[BluetoothLEDevice] = None
        self.service: Optional[GattDeviceService] = None
        self.write_char: Optional[GattCharacteristic] = None
        self.notify_char: Optional[GattCharacteristic] = None
        self.connected = False
        self.log_callback = log_callback
        self.data_callback: Optional[Callable] = None
        self.device_name = ""
        
    def log(self, msg_type: str, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = {"timestamp": timestamp, "type": msg_type, "message": message}
        print(f"[{timestamp}][{msg_type.upper()}] {message}")
        if self.log_callback:
            self.log_callback(log_entry)
    
    def calculate_checksum(self, data: bytes) -> int:
        return sum(data) & 0xFF
    
    def build_packet(self, field_type: int, data: list) -> bytes:
        packet = bytes([PROTOCOL_HEADER["APP_TO_DEVICE"], field_type, len(data)] + data)
        return packet + bytes([self.calculate_checksum(packet)])
    
    async def scan_devices(self) -> list:
        """扫描蓝牙设备，使用 AdvertisementWatcher 获取真实蓝牙地址"""
        if not WINRT_AVAILABLE:
            raise RuntimeError("WinRT 不可用")
        
        self.log("info", "正在扫描蓝牙设备...")
        
        # 使用广播监听器扫描
        watcher = BluetoothLEAdvertisementWatcher()
        watcher.scanning_mode = BluetoothLEScanningMode.ACTIVE
        
        devices = {}
        prefixes = ["sanag", "塞那", "pro", "max", "apex", "ai", "for", "app"]
        
        def on_received(sender, args):
            # 获取蓝牙地址（整数格式）
            address_int = args.bluetooth_address
            # 格式化为 MAC 地址格式
            address_hex = f"{address_int:012X}"
            address_formatted = ":".join([address_hex[i:i+2] for i in range(0, 12, 2)])
            
            # 获取设备名称
            local_name = args.advertisement.local_name or ""
            
            # 过滤目标设备
            name_lower = local_name.lower()
            if local_name and any(p in name_lower for p in prefixes):
                if address_formatted not in devices:
                    devices[address_formatted] = local_name
                    self.log("info", f"发现设备: {local_name} ({address_formatted})")
        
        watcher.add_received(on_received)
        
        try:
            watcher.start()
            await asyncio.sleep(5)  # 扫描 5 秒
            watcher.stop()
        except Exception as e:
            self.log("error", f"扫描异常: {str(e)}")
            try:
                watcher.stop()
            except:
                pass
        
        # 转换为列表格式
        result = [{"name": name, "address": addr} for addr, name in devices.items()]
        self.log("info", f"扫描完成，找到 {len(result)} 个设备")
        return result
    
    async def connect(self, device_address: str) -> bool:
        """连接设备，使用蓝牙 MAC 地址"""
        try:
            self.log("info", f"开始连接: {device_address}")
            
            # 将 MAC 地址转换为整数
            address_int = int(device_address.replace(':', ''), 16)
            self.log("info", f"蓝牙地址 (整数): {address_int}")
            
            # 步骤1: 创建设备对象
            self.log("info", "[1/6] 创建蓝牙设备对象...")
            self.device = await BluetoothLEDevice.from_bluetooth_address_async(address_int)
            if not self.device:
                self.log("error", "无法获取设备对象")
                return False
            
            self.device_name = self.device.name or "未知设备"
            self.log("info", f"设备名称: {self.device_name}")
            
            # 步骤2: 获取 GATT 服务
            self.log("info", "[2/6] 获取 GATT 服务...")
            services_result = await self.device.get_gatt_services_async()
            
            if services_result.status != GattCommunicationStatus.SUCCESS:
                self.log("error", f"获取服务失败: status={services_result.status}")
                return False
            
            self.log("info", f"发现 {len(services_result.services)} 个服务")
            
            # 步骤3: 查找目标服务 FAA0
            self.log("info", "[3/6] 查找目标服务 FAA0...")
            for service in services_result.services:
                uuid = str(service.uuid).lower()
                self.log("info", f"  服务: {uuid[:8]}...")
                if uuid == BLE_UUID["SERVICE"].lower():
                    self.service = service
                    break
            
            if not self.service:
                self.log("error", "未找到目标服务 FAA0")
                return False
            
            self.log("info", "已找到服务 FAA0")
            
            # 步骤4: 获取特征值
            self.log("info", "[4/6] 获取特征值...")
            chars_result = await self.service.get_characteristics_async()
            if chars_result.status != GattCommunicationStatus.SUCCESS:
                self.log("error", f"获取特征值失败: status={chars_result.status}")
                return False
            
            self.log("info", f"发现 {len(chars_result.characteristics)} 个特征值")
            
            for char in chars_result.characteristics:
                uuid_lower = str(char.uuid).lower()
                self.log("info", f"  特征值: {uuid_lower[:8]}...")
                if uuid_lower == BLE_UUID["WRITE"].lower():
                    self.write_char = char
                    self.log("info", "  -> 写入特征值 FAA1")
                elif uuid_lower == BLE_UUID["NOTIFY"].lower():
                    self.notify_char = char
                    self.log("info", "  -> 通知特征值 FAA2")
            
            if not self.write_char or not self.notify_char:
                missing = []
                if not self.write_char: missing.append("FAA1")
                if not self.notify_char: missing.append("FAA2")
                self.log("error", f"缺少特征值: {', '.join(missing)}")
                return False
            
            # 步骤5: 开启通知
            self.log("info", "[5/6] 开启通知监听...")
            cccd_value = GattClientCharacteristicConfigurationDescriptorValue.NOTIFY
            result = await self.notify_char.write_client_characteristic_configuration_descriptor_async(cccd_value)
            
            if result != GattCommunicationStatus.SUCCESS:
                self.log("error", f"开启通知失败: status={result}")
                return False
            
            self.notify_char.add_value_changed(self._on_value_changed)
            self.log("info", "通知已开启")
            
            # 步骤6: 连接完成
            self.log("info", "[6/6] 连接完成")
            self.connected = True
            self.log("info", "========== 连接成功 ==========")
            
            # 自动同步时间
            self.log("info", "自动同步时间...")
            await self.sync_time()
            
            return True
            
        except Exception as e:
            import traceback
            self.log("error", f"连接异常: {str(e)}")
            self.log("error", traceback.format_exc())
            return False
    
    def _on_value_changed(self, sender, args):
        try:
            reader = DataReader.from_buffer(args.characteristic_value)
            data = bytes([reader.read_byte() for _ in range(args.characteristic_value.length)])
            if len(data) >= 2:
                self.log("receive", f"接收: {data.hex(' ').upper()}")
                if self.data_callback:
                    self.data_callback(data)
        except Exception as e:
            self.log("error", f"处理通知失败: {str(e)}")
    
    async def send_data(self, data: bytes) -> bool:
        if not self.write_char or not self.connected:
            self.log("error", "设备未连接")
            return False
        try:
            writer = DataWriter()
            for b in data:
                writer.write_byte(b)
            buffer = writer.detach_buffer()
            result = await self.write_char.write_value_with_result_async(buffer)
            if result.status == GattCommunicationStatus.SUCCESS:
                self.log("send", f"发送: {data.hex(' ').upper()}")
                return True
            return False
        except Exception as e:
            self.log("error", f"发送异常: {str(e)}")
            return False
    
    async def disconnect(self):
        if self.device:
            self.device.close()
        self.device = None
        self.service = None
        self.write_char = None
        self.notify_char = None
        self.connected = False
        self.device_name = ""
        self.log("info", "已断开连接")
    
    # ========== 协议方法 ==========
    
    async def sync_time(self, timezone: int = 8) -> bool:
        timestamp = str(int(datetime.now().timestamp() * 1000))
        data = [TYPE_ID["TIME_SYNC"], timezone] + [int(c) for c in timestamp]
        return await self.send_data(self.build_packet(FIELD_TYPE["DEVICE_INFO_SYNC"], data))
    
    async def set_personal_info(self, height: int, weight: float, age: int, gender: int) -> bool:
        weight_grams = int(weight * 1000)
        data = [TYPE_ID["PERSONAL_INFO"], height, (weight_grams >> 16) & 0xFF, (weight_grams >> 8) & 0xFF, weight_grams & 0xFF, age, gender]
        return await self.send_data(self.build_packet(FIELD_TYPE["DEVICE_INFO_SYNC"], data))
    
    async def get_personal_info(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["DEVICE_INFO_SYNC"], [TYPE_ID["PERSONAL_INFO"], 0xFF]))
    
    async def set_heart_rate_zones(self, zones: list) -> bool:
        data = [TYPE_ID["HEART_RATE_ZONE"], len(zones)]
        for z in zones:
            data.extend([z["min"], z["max"]])
        return await self.send_data(self.build_packet(FIELD_TYPE["DEVICE_INFO_SYNC"], data))
    
    async def set_lactate_zone(self, enabled: bool, hr_min: int, hr_max: int, pace_min: int, pace_max: int) -> bool:
        data = [TYPE_ID["LACTATE_ZONE"], SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"],
                hr_min, hr_max, (pace_min >> 8) & 0xFF, pace_min & 0xFF, (pace_max >> 8) & 0xFF, pace_max & 0xFF]
        return await self.send_data(self.build_packet(FIELD_TYPE["DEVICE_INFO_SYNC"], data))
    
    async def set_distance_target(self, distance: int) -> bool:
        data = [TYPE_ID["DISTANCE_TARGET"], (distance >> 16) & 0xFF, (distance >> 8) & 0xFF, distance & 0xFF]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_TARGET"], data))
    
    async def get_distance_target(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_TARGET"], [TYPE_ID["DISTANCE_TARGET"], 0xFF]))
    
    async def set_calorie_target(self, calories: int) -> bool:
        data = [TYPE_ID["CALORIE_TARGET"], (calories >> 16) & 0xFF, (calories >> 8) & 0xFF, calories & 0xFF]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_TARGET"], data))
    
    async def get_calorie_target(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_TARGET"], [TYPE_ID["CALORIE_TARGET"], 0xFF]))
    
    async def set_step_target(self, steps: int) -> bool:
        data = [TYPE_ID["STEP_TARGET"], (steps >> 16) & 0xFF, (steps >> 8) & 0xFF, steps & 0xFF]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_TARGET"], data))
    
    async def get_step_target(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_TARGET"], [TYPE_ID["STEP_TARGET"], 0xFF]))
    
    async def get_daily_data(self, year: int, month: int, day: int) -> bool:
        data = [TYPE_ID["DAILY_DATA"], year % 100, month, day]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_TARGET"], data))
    
    async def set_spo2_monitor(self, enabled: bool, interval: int = 10) -> bool:
        data = [TYPE_ID["SPO2_MONITOR"], SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"], interval]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_spo2_monitor(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [TYPE_ID["SPO2_MONITOR"], 0xFF]))
    
    async def set_heart_rate_monitor(self, enabled: bool, interval: int = 10) -> bool:
        data = [TYPE_ID["HEART_RATE_MONITOR"], SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"], interval]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_heart_rate_monitor(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [TYPE_ID["HEART_RATE_MONITOR"], 0xFF]))
    
    async def set_neck_health_monitor(self, enabled: bool) -> bool:
        data = [TYPE_ID["NECK_HEALTH_MONITOR"], SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"]]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_neck_health_monitor(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [TYPE_ID["NECK_HEALTH_MONITOR"], 0xFF]))
    
    async def set_fall_monitor(self, enabled: bool) -> bool:
        data = [TYPE_ID["FALL_MONITOR"], SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"]]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_fall_monitor(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [TYPE_ID["FALL_MONITOR"], 0xFF]))
    
    async def set_spo2_measure(self, start: bool) -> bool:
        data = [TYPE_ID["SPO2_MEASURE"], SWITCH_STATE["OFF"] if start else SWITCH_STATE["ON"]]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def set_heart_rate_measure(self, start: bool) -> bool:
        data = [TYPE_ID["HEART_RATE_MEASURE"], SWITCH_STATE["OFF"] if start else SWITCH_STATE["ON"]]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def set_sedentary_reminder(self, enabled: bool, interval: int = 5) -> bool:
        data = [TYPE_ID["SEDENTARY_REMINDER"], SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"], interval]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_sedentary_reminder(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [TYPE_ID["SEDENTARY_REMINDER"], 0xFF]))
    
    async def set_heart_rate_broadcast(self, enabled: bool) -> bool:
        data = [TYPE_ID["HEART_RATE_BROADCAST"], SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"]]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_heart_rate_broadcast(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [TYPE_ID["HEART_RATE_BROADCAST"], 0xFF]))
    
    async def set_emergency_contact(self, country_code: str, phone: str) -> bool:
        cc = int(country_code)
        data = [TYPE_ID["EMERGENCY_CONTACT"], (cc >> 8) & 0xFF, cc & 0xFF, len(phone)] + [int(c) for c in phone]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_emergency_contact(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [TYPE_ID["EMERGENCY_CONTACT"], 0xFF]))
    
    async def get_spo2_data(self, year: int, month: int, day: int) -> bool:
        data = [TYPE_ID["SPO2_DATA"], year % 100, month, day]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_heart_rate_data(self, year: int, month: int, day: int) -> bool:
        data = [TYPE_ID["HEART_RATE_DATA"], year % 100, month, day]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_neck_health_data(self, year: int, month: int, day: int) -> bool:
        data = [TYPE_ID["NECK_HEALTH_DATA"], year % 100, month, day]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def set_sport_state(self, status: int, sport_type: int) -> bool:
        now = datetime.now()
        data = [TYPE_ID["SPORT_STATUS"], status, now.year % 100, now.month, now.day, now.hour, now.minute, now.second, sport_type]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], data))
    
    async def get_sport_state(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], [TYPE_ID["SPORT_STATUS"], 0xFF]))
    
    async def report_gps(self, longitude: float, latitude: float) -> bool:
        lon = int(abs(longitude) * 1000000)
        lat = int(abs(latitude) * 1000000)
        data = [TYPE_ID["GPS_REPORT"],
                0x00 if longitude >= 0 else 0x01, (lon >> 24) & 0xFF, (lon >> 16) & 0xFF, (lon >> 8) & 0xFF, lon & 0xFF,
                0x00 if latitude >= 0 else 0x01, (lat >> 24) & 0xFF, (lat >> 16) & 0xFF, (lat >> 8) & 0xFF, lat & 0xFF]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], data))
    
    async def get_sport_summary(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], [TYPE_ID["SPORT_SUMMARY"]]))
    
    async def get_sport_segment(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], [TYPE_ID["SPORT_SEGMENT"]]))
    
    async def get_sport_count(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], [TYPE_ID["SPORT_COUNT_QUERY"]]))
    
    async def get_heart_rate_detail(self, year: int, month: int, day: int, hour: int, minute: int, second: int) -> bool:
        data = [TYPE_ID["HEART_RATE_DETAIL"], year % 100, month, day, hour, minute, second]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], data))
    
    async def get_pace_detail(self, year: int, month: int, day: int, hour: int, minute: int, second: int) -> bool:
        data = [TYPE_ID["PACE_DETAIL"], year % 100, month, day, hour, minute, second]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], data))
    
    async def get_step_freq_detail(self, year: int, month: int, day: int, hour: int, minute: int, second: int) -> bool:
        data = [TYPE_ID["STEP_FREQ_DETAIL"], year % 100, month, day, hour, minute, second]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], data))
    
    async def get_gps_detail(self, year: int, month: int, day: int, hour: int, minute: int, second: int) -> bool:
        data = [TYPE_ID["GPS_DETAIL"], year % 100, month, day, hour, minute, second]
        return await self.send_data(self.build_packet(FIELD_TYPE["SPORT_HEALTH"], data))

    # ========== 新增健康检测方法 ==========
    
    async def set_neck_wear_detection(self, enabled: bool) -> bool:
        data = [0x0C, SWITCH_STATE["ON"] if enabled else SWITCH_STATE["OFF"]]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_neck_wear_detection(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [0x0C, 0xFF]))
    
    async def calibrate_neck_sensor(self, step: int) -> bool:
        data = [0x0D, step]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def set_neck_stretch_reminder(self, interval: int) -> bool:
        data = [0x0E, interval]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))
    
    async def get_neck_stretch_reminder(self) -> bool:
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], [0x0E, 0xFF]))
    
    async def sync_last_7_days_health(self, year: int, month: int, day: int) -> bool:
        data = [0x0F, year % 100, month, day]
        return await self.send_data(self.build_packet(FIELD_TYPE["HEALTH_MONITOR"], data))


# ========== FastAPI 应用 ==========

app = FastAPI(title="Sanag 蓝牙工具 - 桌面版")
bt_service = BluetoothService()
ws_clients = []

def broadcast_log(log_entry: dict):
    for client in ws_clients:
        try:
            asyncio.create_task(client.send_json({"type": "log", "data": log_entry}))
        except:
            pass

bt_service.log_callback = broadcast_log


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/check")
async def check_platform():
    return {"platform": "desktop", "winrt_available": WINRT_AVAILABLE}


@app.get("/api/scan")
async def scan_devices():
    """扫描设备，只返回名称和地址"""
    try:
        devices = await bt_service.scan_devices()
        return {"success": True, "devices": devices}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/connect")
async def connect_device(address: str):
    """连接设备"""
    success = await bt_service.connect(address)
    return {"success": success, "device_name": bt_service.device_name}


@app.post("/api/disconnect")
async def disconnect_device():
    await bt_service.disconnect()
    return {"success": True}


@app.get("/api/status")
async def get_status():
    return {"connected": bt_service.connected, "device_name": bt_service.device_name}


# ========== 设备信息 0xBA ==========
@app.post("/api/sync_time")
async def api_sync_time(timezone: int = 8):
    return {"success": await bt_service.sync_time(timezone)}

@app.post("/api/personal_info")
async def api_set_personal_info(height: int, weight: float, age: int, gender: int):
    return {"success": await bt_service.set_personal_info(height, weight, age, gender)}

@app.post("/api/get_personal_info")
async def api_get_personal_info():
    return {"success": await bt_service.get_personal_info()}

@app.post("/api/heart_rate_zones")
async def api_set_heart_rate_zones(zones: str):
    return {"success": await bt_service.set_heart_rate_zones(json.loads(zones))}

@app.post("/api/lactate_zone")
async def api_set_lactate_zone(enabled: bool, hr_min: int, hr_max: int, pace_min: int, pace_max: int):
    return {"success": await bt_service.set_lactate_zone(enabled, hr_min, hr_max, pace_min, pace_max)}


# ========== 运动目标 0xBB ==========
@app.post("/api/distance_target")
async def api_set_distance_target(distance: int, get: bool = False):
    if get:
        return {"success": await bt_service.get_distance_target()}
    return {"success": await bt_service.set_distance_target(distance)}

@app.post("/api/calorie_target")
async def api_set_calorie_target(calories: int, get: bool = False):
    if get:
        return {"success": await bt_service.get_calorie_target()}
    return {"success": await bt_service.set_calorie_target(calories)}

@app.post("/api/step_target")
async def api_set_step_target(steps: int, get: bool = False):
    if get:
        return {"success": await bt_service.get_step_target()}
    return {"success": await bt_service.set_step_target(steps)}

@app.post("/api/daily_data")
async def api_get_daily_data(year: int, month: int, day: int):
    return {"success": await bt_service.get_daily_data(year, month, day)}


# ========== 健康检测 0xBC ==========
@app.post("/api/spo2_monitor")
async def api_set_spo2_monitor(enabled: bool, interval: int = 10, get: bool = False):
    if get:
        return {"success": await bt_service.get_spo2_monitor()}
    return {"success": await bt_service.set_spo2_monitor(enabled, interval)}

@app.post("/api/heart_rate_monitor")
async def api_set_heart_rate_monitor(enabled: bool, interval: int = 10, get: bool = False):
    if get:
        return {"success": await bt_service.get_heart_rate_monitor()}
    return {"success": await bt_service.set_heart_rate_monitor(enabled, interval)}

@app.post("/api/neck_health_monitor")
async def api_set_neck_health_monitor(enabled: bool, get: bool = False):
    if get:
        return {"success": await bt_service.get_neck_health_monitor()}
    return {"success": await bt_service.set_neck_health_monitor(enabled)}

@app.post("/api/fall_monitor")
async def api_set_fall_monitor(enabled: bool, get: bool = False):
    if get:
        return {"success": await bt_service.get_fall_monitor()}
    return {"success": await bt_service.set_fall_monitor(enabled)}

@app.post("/api/spo2_measure")
async def api_set_spo2_measure(start: bool):
    return {"success": await bt_service.set_spo2_measure(start)}

@app.post("/api/heart_rate_measure")
async def api_set_heart_rate_measure(start: bool):
    return {"success": await bt_service.set_heart_rate_measure(start)}

@app.post("/api/sedentary_reminder")
async def api_set_sedentary_reminder(enabled: bool, interval: int = 5, get: bool = False):
    if get:
        return {"success": await bt_service.get_sedentary_reminder()}
    return {"success": await bt_service.set_sedentary_reminder(enabled, interval)}

@app.post("/api/heart_rate_broadcast")
async def api_set_heart_rate_broadcast(enabled: bool, get: bool = False):
    if get:
        return {"success": await bt_service.get_heart_rate_broadcast()}
    return {"success": await bt_service.set_heart_rate_broadcast(enabled)}

@app.post("/api/emergency_contact")
async def api_set_emergency_contact(country_code: str, phone: str, get: bool = False):
    if get:
        return {"success": await bt_service.get_emergency_contact()}
    return {"success": await bt_service.set_emergency_contact(country_code, phone)}

@app.post("/api/spo2_data")
async def api_get_spo2_data(year: int, month: int, day: int):
    return {"success": await bt_service.get_spo2_data(year, month, day)}

@app.post("/api/heart_rate_data")
async def api_get_heart_rate_data(year: int, month: int, day: int):
    return {"success": await bt_service.get_heart_rate_data(year, month, day)}

@app.post("/api/neck_health_data")
async def api_get_neck_health_data(year: int, month: int, day: int):
    return {"success": await bt_service.get_neck_health_data(year, month, day)}


# ========== 运动健康 0xBD ==========
@app.post("/api/sport_state")
async def api_set_sport_state(status: int, sport_type: int, get: bool = False):
    if get:
        return {"success": await bt_service.get_sport_state()}
    return {"success": await bt_service.set_sport_state(status, sport_type)}

@app.post("/api/report_gps")
async def api_report_gps(longitude: float, latitude: float):
    return {"success": await bt_service.report_gps(longitude, latitude)}

@app.post("/api/sport_summary")
async def api_get_sport_summary():
    return {"success": await bt_service.get_sport_summary()}

@app.post("/api/sport_segment")
async def api_get_sport_segment():
    return {"success": await bt_service.get_sport_segment()}

@app.post("/api/sport_count")
async def api_get_sport_count():
    return {"success": await bt_service.get_sport_count()}

@app.post("/api/heart_rate_detail")
async def api_get_heart_rate_detail(year: int, month: int, day: int, hour: int, minute: int, second: int):
    return {"success": await bt_service.get_heart_rate_detail(year, month, day, hour, minute, second)}

@app.post("/api/pace_detail")
async def api_get_pace_detail(year: int, month: int, day: int, hour: int, minute: int, second: int):
    return {"success": await bt_service.get_pace_detail(year, month, day, hour, minute, second)}

@app.post("/api/step_freq_detail")
async def api_get_step_freq_detail(year: int, month: int, day: int, hour: int, minute: int, second: int):
    return {"success": await bt_service.get_step_freq_detail(year, month, day, hour, minute, second)}

@app.post("/api/gps_detail")
async def api_get_gps_detail(year: int, month: int, day: int, hour: int, minute: int, second: int):
    return {"success": await bt_service.get_gps_detail(year, month, day, hour, minute, second)}


# 新增缺失的 API 路由
@app.post("/api/neck_wear_detection")
async def api_set_neck_wear_detection(enabled: bool, get: bool = False):
    if get:
        return {"success": await bt_service.get_neck_wear_detection()}
    return {"success": await bt_service.set_neck_wear_detection(enabled)}


@app.post("/api/neck_sensor_calibration")
async def api_neck_sensor_calibration(step: int):
    return {"success": await bt_service.calibrate_neck_sensor(step)}


@app.post("/api/neck_stretch_reminder")
async def api_set_neck_stretch_reminder(interval: int, get: bool = False):
    if get:
        return {"success": await bt_service.get_neck_stretch_reminder()}
    return {"success": await bt_service.set_neck_stretch_reminder(interval)}


@app.post("/api/sync_last_7_days_health")
async def api_sync_last_7_days_health(year: int, month: int, day: int):
    return {"success": await bt_service.sync_last_7_days_health(year, month, day)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_clients.append(websocket)
    
    # 获取当前事件循环
    loop = asyncio.get_event_loop()
    
    def on_data(data: bytes):
        try:
            # 使用 run_coroutine_threadsafe 从非 asyncio 线程调度协程
            future = asyncio.run_coroutine_threadsafe(
                websocket.send_json({"type": "data", "data": list(data)}),
                loop
            )
            future.result(timeout=5)  # 等待完成，超时5秒
        except Exception as e:
            pass
    
    bt_service.data_callback = on_data
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in ws_clients:
            ws_clients.remove(websocket)
    except Exception:
        if websocket in ws_clients:
            ws_clients.remove(websocket)


try:
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
except:
    pass


if __name__ == "__main__":
    print("=" * 50)
    print("Sanag 蓝牙工具 - 桌面版 (WinRT)")
    print("=" * 50)
    print(f"WinRT 可用: {WINRT_AVAILABLE}")
    print("访问: http://localhost:8000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
