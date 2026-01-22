@echo off
echo ========================================
echo   AnimaTeX STUDIO - BUILD
echo   TeXmExDeX Type Tools
echo ========================================
echo.

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building production version...
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD COMPLETE!
echo ========================================
echo.
echo Static files are in the 'dist' folder
echo You can now deploy these files to any web server
echo.
echo To preview the build locally, run:
echo   npm run preview
echo.
pause
