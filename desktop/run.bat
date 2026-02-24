@echo off
chcp 65001 >nul
echo ========================================
echo Sanag 蓝牙工具 - 桌面版
echo ========================================
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

REM 检查依赖
echo 正在检查依赖...
pip install -r requirements.txt -q

echo.
echo 启动服务器...
echo 请在浏览器中打开: http://localhost:8000
echo.
python server.py

pause
