@echo off
echo ========================================
echo   Uninstall Order App API Service
echo ========================================
echo.
echo This will remove the OrderAppAPI Windows Service.
echo.
echo IMPORTANT: You must run this as Administrator!
echo.
pause

node uninstall-service.js

echo.
echo ========================================
echo Uninstallation complete!
echo The OrderAppAPI service has been removed.
echo ========================================
pause
