@echo off
echo Starting Wenyasha Frontend...
echo.
set "PATH=C:\Program Files\nodejs;%PATH%"

echo Installing dependencies (this may take a minute)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b
)

echo Starting Dev Server...
call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend failed.
    pause
    exit /b
)
