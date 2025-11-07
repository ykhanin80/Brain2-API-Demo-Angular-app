@echo off
echo ========================================
echo   Install Order App API as Service
echo ========================================
echo.
echo This will install the API server as a Windows Service
echo that starts automatically when Windows boots.
echo.
echo IMPORTANT: You must run this as Administrator!
echo.
pause

node install-service.js

echo.
echo ========================================
echo Installation complete!
echo.
echo The service "OrderAppAPI" has been installed.
echo You can manage it from Services (services.msc)
echo.
echo API URL: http://localhost:3000
echo Swagger: http://localhost:3000/api-docs
echo ========================================
pause
