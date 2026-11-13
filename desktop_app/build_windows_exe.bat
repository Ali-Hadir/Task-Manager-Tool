@echo off
title Build TaskFlow Standalone Desktop App
echo ==========================================================
echo  Building TaskFlow Standalone Executable (.exe) for USB
echo ==========================================================
echo.

:: 1. Check if PyInstaller is installed
python -m pip install --upgrade pyinstaller
if %errorlevel% neq 0 (
    echo Error: Failed to install PyInstaller. Make sure Python is installed and added to PATH.
    pause
    exit /b %errorlevel%
)

echo.
echo Packaging TaskFlow into a single standalone .exe with icon...
python -m PyInstaller --noconsole --onefile --icon="app_icon.ico" --name="TaskFlow" desktop_gui.py

if %errorlevel% neq 0 (
    echo Error: PyInstaller build failed.
    pause
    exit /b %errorlevel%
)

:: 2. Create clean USB distribution folder
if not exist "USB_Distribution" mkdir "USB_Distribution"
copy /y "dist\TaskFlow.exe" "USB_Distribution\TaskFlow.exe"

echo.
echo ==========================================================
echo  BUILD SUCCESSFUL!
echo ==========================================================
echo.
echo  Your standalone application is ready at:
echo  desktop_app\USB_Distribution\TaskFlow.exe
echo.
echo  You can copy "TaskFlow.exe" directly onto your USB drive!
echo  Any team member can double-click it on their PC without
echo  installing Python, Visual Studio Code, or any dependencies.
echo.
echo ==========================================================
pause
