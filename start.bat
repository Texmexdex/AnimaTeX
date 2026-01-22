@echo off
echo ========================================
echo   AnimaTeX STUDIO LAUNCHER
echo   TeXmExDeX Type Tools
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo Make sure Node.js is installed
        pause
        exit /b 1
    )
    echo.
)

echo Starting AnimaTeX Studio...
echo.
echo The app will open in your browser automatically.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

pause
