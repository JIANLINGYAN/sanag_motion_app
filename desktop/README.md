# Sanag 蓝牙工具 - 桌面版

解决 Web Bluetooth 在某些电脑上的兼容性问题，使用 Windows RT 蓝牙接口。

## 系统要求

- Windows 10 或更高版本
- Python 3.8+
- 蓝牙适配器

## 快速启动

### 方式一：双击运行
```
双击 run.bat
```

### 方式二：命令行运行
```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python server.py
```

然后在浏览器中打开: http://localhost:8000

## 功能

- ✅ 设备扫描与连接
- ✅ 自动同步时间
- ✅ 个人信息设置
- ✅ 心率/血氧监测
- ✅ 运动目标设置
- ✅ 实时日志显示

## 与 Web 版本的区别

| 特性 | Web 版本 | 桌面版 |
|------|---------|--------|
| 平台 | 全平台 | Windows only |
| 蓝牙接口 | Web Bluetooth API | WinRT |
| 兼容性 | 部分电脑不稳定 | 稳定 |
| 安装 | 无需安装 | 需要 Python |
| 访问方式 | 浏览器直接访问 | 本地服务器 |

## 文件结构

```
desktop/
├── server.py          # Python 后端服务
├── requirements.txt   # Python 依赖
├── run.bat           # Windows 启动脚本
├── README.md         # 说明文档
└── static/
    └── index.html    # 前端界面
```

## 故障排除

### WinRT 安装失败
```bash
pip install winsdk --pre
```

### 找不到设备
1. 确保蓝牙已开启
2. 确保设备在附近
3. 尝试在 Windows 蓝牙设置中先配对设备

### 端口被占用
修改 `server.py` 最后一行的端口号:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # 改为其他端口
```
