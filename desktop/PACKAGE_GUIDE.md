# Sanag 蓝牙工具 - 桌面版打包指南

## 打包前准备

### 1. 安装依赖

确保已安装所有必要的依赖：

```bash
cd desktop
pip install -r requirements.txt
```

### 2. 安装 PyInstaller

```bash
pip install pyinstaller
```

## 打包方法

### 方法一：使用自动打包脚本（推荐）

双击运行 `build.bat`：

```batch
build.bat
```

脚本会自动完成以下操作：
1. 检查并安装依赖
2. 清理旧的构建文件
3. 运行 PyInstaller 打包
4. 创建启动脚本

### 方法二：使用 Python 脚本打包

```bash
python build.py
```

### 方法三：手动打包

```bash
pyinstaller server.py ^
  --name="Sanag蓝牙工具" ^
  --onefile ^
  --windowed ^
  --add-data="static/index.html;static" ^
  --hidden-import=uvicorn.logging ^
  --hidden-import=uvicorn.loops.auto ^
  --hidden-import=fastapi ^
  --hidden-import=websockets ^
  --hidden-import=winsdk ^
  --hidden-import=winsdk.windows.devices.bluetooth ^
  --hidden-import=winsdk.windows.devices.bluetooth.genericattributeprofile ^
  --hidden-import=winsdk.windows.devices.bluetooth.advertisement ^
  --hidden-import=winsdk.windows.storage.streams ^
  --clean
```

## 打包输出

打包完成后，文件结构如下：

```
desktop/
├── dist/
│   ├── Sanag蓝牙工具.exe      # 主程序（可独立运行）
│   └── 启动Sanag蓝牙工具.bat   # 启动脚本（可选）
├── build/                      # 临时构建文件（可删除）
├── server.spec                 # PyInstaller 配置文件
└── ...
```

## 在其他电脑上使用

### 系统要求

- **操作系统**: Windows 10/11（64位）
- **无需安装 Python**
- **蓝牙**: 支持 BLE（低功耗蓝牙）

### 使用方法

1. **复制文件**
   将整个 `dist` 文件夹复制到目标电脑

2. **运行程序**
   - 双击 `启动Sanag蓝牙工具.bat` 启动（推荐，会自动打开浏览器）
   - 或直接双击 `Sanag蓝牙工具.exe`

3. **访问界面**
   打开浏览器访问：http://localhost:8000

### 防火墙提示

首次运行时，Windows 可能会弹出防火墙提示：
- 勾选「专用网络」和「公用网络」
- 点击「允许访问」

## 常见问题

### 问题1：打包后静态文件找不到

**原因**: PyInstaller 未正确包含静态文件

**解决**: 确保使用了 `--add-data="static/index.html;static"` 参数

### 问题2：运行时提示缺少 winsdk

**原因**: winsdk 模块未正确打包

**解决**: 确保在打包命令中添加了所有 winsdk 相关的 `--hidden-import`

### 问题3：蓝牙功能无法使用

**原因**: 
1. 目标电脑没有蓝牙适配器
2. 蓝牙驱动未正确安装
3. Windows 版本不支持 WinRT 蓝牙 API

**解决**:
1. 检查设备管理器中蓝牙是否正常工作
2. 更新蓝牙驱动程序
3. 确保 Windows 版本为 Windows 10 版本 1803 或更高

### 问题4：端口被占用

**错误信息**: `Address already in use`

**解决**: 
1. 关闭其他占用 8000 端口的程序
2. 或在代码中修改端口（修改 `uvicorn.run()` 中的 port 参数）

## 自定义配置

### 修改端口号

编辑 `server.py`，找到最后一行的 `uvicorn.run()`，修改 `port` 参数：

```python
uvicorn.run(app, host="0.0.0.0", port=8080)  # 改为 8080 端口
```

### 添加程序图标

准备 `.ico` 格式的图标文件，打包时添加：

```bash
pyinstaller server.py --icon=icon.ico ...
```

或在 `build.py` 中修改：
```python
'--icon=icon.ico',
```

### 修改应用名称

编辑 `build.py` 或 `build.bat`，修改 `--name` 参数。

## 高级：创建安装程序

如需创建更专业的安装程序，可以使用：

1. **Inno Setup**（推荐）
   - 免费、开源
   - 支持创建专业的 Windows 安装程序

2. **NSIS (Nullsoft Scriptable Install System)**
   - 轻量级
   - 脚本化配置

### Inno Setup 示例脚本

创建 `setup.iss`：

```pascal
[Setup]
AppName=Sanag蓝牙工具
AppVersion=1.0
DefaultDirName={autopf}\Sanag蓝牙工具
DefaultGroupName=Sanag蓝牙工具
OutputDir=output
OutputBaseFilename=Sanag蓝牙工具安装程序

[Files]
Source: "dist\Sanag蓝牙工具.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\启动Sanag蓝牙工具.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Sanag蓝牙工具"; Filename: "{app}\启动Sanag蓝牙工具.bat"
Name: "{commondesktop}\Sanag蓝牙工具"; Filename: "{app}\启动Sanag蓝牙工具.bat"
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `server.py` | 主程序源代码 |
| `requirements.txt` | Python 依赖列表 |
| `build.py` | PyInstaller 打包脚本（Python） |
| `build.bat` | 一键打包批处理脚本 |
| `PACKAGE_GUIDE.md` | 本说明文档 |

## 技术支持

如有问题，请检查：
1. Python 版本是否为 3.8+
2. 是否安装了所有依赖
3. Windows 版本是否支持 WinRT
