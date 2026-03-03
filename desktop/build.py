"""
PyInstaller 打包脚本
用于将桌面端应用打包为独立的可执行文件
"""
import PyInstaller.__main__
import os
import sys

# 获取当前目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# PyInstaller 参数
args = [
    'server.py',                          # 主程序入口
    '--name=SanagBluetoothTool',          # 应用名称（英文，避免编码问题）
    '--onefile',                          # 打包为单文件
    '--console',                          # 保留控制台（Uvicorn 需要 stdout）
    '--icon=NONE',                        # 可以添加图标文件路径
    
    # 添加数据文件（静态资源）
    f'--add-data={BASE_DIR}/static/index.html;static',
    
    # 隐藏导入（确保这些模块被打包进去）
    '--hidden-import=uvicorn.logging',
    '--hidden-import=uvicorn.loops.auto',
    '--hidden-import=uvicorn.loops.asyncio',
    '--hidden-import=uvicorn.protocols.http.auto',
    '--hidden-import=uvicorn.protocols.http.h11_impl',
    '--hidden-import=uvicorn.protocols.websockets.auto',
    '--hidden-import=uvicorn.protocols.websockets.websockets_impl',
    '--hidden-import=fastapi',
    '--hidden-import=websockets',
    '--hidden-import=websockets.legacy',
    '--hidden-import=websockets.legacy.server',
    '--hidden-import=websockets.legacy.protocol',
    '--hidden-import=websockets.extensions',
    '--hidden-import=websockets.extensions.permessage_deflate',
    '--hidden-import=anyio',
    '--hidden-import=anyio._backends._trio',
    '--hidden-import=anyio._backends._asyncio',
    '--hidden-import=starlette',
    '--hidden-import=starlette.middleware',
    '--hidden-import=starlette.middleware.cors',
    '--hidden-import=starlette.middleware.errors',
    '--hidden-import=pydantic',
    '--hidden-import=pydantic.deprecated',
    
    # 清理和优化
    '--clean',                            # 清理临时文件
    '--noconfirm',                        # 不询问确认
    
    # 输出目录
    f'--distpath={BASE_DIR}/dist',
    f'--workpath={BASE_DIR}/build',
    f'--specpath={BASE_DIR}',
]

# Windows 特定：添加 winsdk 相关隐藏导入
if sys.platform == 'win32':
    winsdk_imports = [
        '--hidden-import=winsdk',
        '--hidden-import=winsdk.windows.devices.bluetooth',
        '--hidden-import=winsdk.windows.devices.bluetooth.genericattributeprofile',
        '--hidden-import=winsdk.windows.devices.bluetooth.advertisement',
        '--hidden-import=winsdk.windows.storage.streams',
    ]
    args.extend(winsdk_imports)

print("开始打包 Sanag 蓝牙工具...")
print(f"输出目录: {BASE_DIR}/dist")
print(f"工作目录: {BASE_DIR}/build")
print()

PyInstaller.__main__.run(args)

print()
print("=" * 50)
print("Build Complete!")
print(f"Executable: {BASE_DIR}\\dist\\SanagBluetoothTool.exe")
print("")
print("Usage:")
print("  1. Copy the 'dist' folder to target PC")
print("  2. Run 'start.bat' (with console) or 'start_silent.bat' (background)")
print("  3. Browser will open automatically at http://localhost:8000")
print("=" * 50)
