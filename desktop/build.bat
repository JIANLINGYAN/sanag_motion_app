@echo off
chcp 65001 >nul
echo ==========================================
echo   Sanag Bluetooth Tool - Build Script
echo ==========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [Error] Python not found
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
python -m pip install -q pyinstaller fastapi uvicorn websockets winsdk anyio
if errorlevel 1 (
    echo [Error] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies ready
echo.

echo [2/4] Cleaning old builds...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"
if exist "*.spec" del /f /q "*.spec"
echo [OK] Cleaned
echo.

echo [3/4] Building... (This may take a few minutes)
python build.py
if errorlevel 1 (
    echo [Error] Build failed
    pause
    exit /b 1
)
echo.

echo [4/4] Creating launcher...
echo @echo off > "dist/start.bat"
echo start "SanagBluetoothTool" "SanagBluetoothTool.exe" >> "dist/start.bat"
echo [OK] Launcher created
echo.
echo Creating silent launcher (background mode)...
(
echo @echo off
echo start /b "" "SanagBluetoothTool.exe" ^>nul 2^>^&1
echo echo Sanag Bluetooth Tool started in background
echo echo Open http://localhost:8000 in your browser
echo timeout /t 3 ^>nul
echo start http://localhost:8000
) > "dist/start_silent.bat"
echo.

echo ==========================================
echo   Build Complete!
echo ==========================================
echo.
echo Output: %CD%\dist\SanagBluetoothTool.exe
echo.
echo Usage:
echo   1. Copy "dist" folder to target PC
echo   2. Run "start.bat" (with console window)
echo      Or "start_silent.bat" (background mode)
echo   3. Browser will open automatically
echo.
pause
