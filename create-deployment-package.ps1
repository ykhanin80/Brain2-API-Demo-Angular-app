# Create Deployment Package for Customer PC
# This script creates a complete deployment package with all necessary files

param(
   [string]$OutputPath = ".\deployment-package"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Order App Deployment Package Creator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create deployment folder
Write-Host "Creating deployment folder..." -ForegroundColor Yellow
if (Test-Path $OutputPath) {
   Remove-Item $OutputPath -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputPath | Out-Null

# Copy API server files
Write-Host "Copying API server files..." -ForegroundColor Yellow
Copy-Item "api-server.mjs" -Destination $OutputPath
Copy-Item "package.json" -Destination $OutputPath
Copy-Item "install-service.js" -Destination $OutputPath
Copy-Item "uninstall-service.js" -Destination $OutputPath

# Copy batch files
Write-Host "Copying batch files..." -ForegroundColor Yellow
Copy-Item "START-API.bat" -Destination $OutputPath
Copy-Item "INSTALL-SERVICE.bat" -Destination $OutputPath
Copy-Item "UNINSTALL-SERVICE.bat" -Destination $OutputPath

# Copy data folder
Write-Host "Copying data folder..." -ForegroundColor Yellow
Copy-Item "data" -Destination $OutputPath -Recurse

# Copy node_modules
Write-Host "Copying node_modules (this may take a while)..." -ForegroundColor Yellow
Copy-Item "node_modules" -Destination $OutputPath -Recurse

# Copy documentation
Write-Host "Copying documentation..." -ForegroundColor Yellow
Copy-Item "DEPLOYMENT.md" -Destination "$OutputPath\README.md"
Copy-Item "WINDOWS-SERVICE.md" -Destination $OutputPath

# Create README.txt for customer
Write-Host "Creating customer README..." -ForegroundColor Yellow
$readmeContent = @"
ORDER APP API SERVER - DEPLOYMENT INSTRUCTIONS
==============================================

QUICK START (For Testing):
--------------------------
1. Ensure Node.js is installed on this PC
   - If not, download from: https://nodejs.org/
   - Install LTS version (recommended)

2. Double-click START-API.bat
   - API will start on http://localhost:3000
   - Swagger docs: http://localhost:3000/api-docs
   - Press Ctrl+C to stop

INSTALL AS WINDOWS SERVICE (For Production):
--------------------------------------------
1. Right-click INSTALL-SERVICE.bat
2. Select "Run as administrator"
3. Wait for installation to complete
4. Service will start automatically
5. Service will auto-start on PC reboot

VERIFY INSTALLATION:
-------------------
1. Press Win + R
2. Type: services.msc
3. Look for "OrderAppAPI"
4. Status should show "Running"

MANAGE SERVICE:
--------------
- Start: net start OrderAppAPI
- Stop:  net stop OrderAppAPI
- Uninstall: Run UNINSTALL-SERVICE.bat as Administrator

API ENDPOINTS:
-------------
- API Base: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api-docs

DATA FILES:
----------
All user data and configurations are stored in the 'data' folder:
- data/users.json - User accounts
- data/action-configurations.json - Action configurations

NETWORK ACCESS:
--------------
If the Angular app is on a different machine:
1. Configure firewall to allow port 3000
2. Update Angular app to point to this server's IP
   Example: http://192.168.1.100:3000/api

TROUBLESHOOTING:
---------------
1. Check if Node.js is installed:
   - Open PowerShell
   - Type: node --version
   - Should show v18.x.x or higher

2. Check if port 3000 is available:
   - Open PowerShell
   - Type: netstat -ano | findstr :3000
   - Should be empty if port is free

3. View service logs:
   - Press Win + R
   - Type: %APPDATA%\OrderAppAPI\daemon
   - Check .log files for errors

SUPPORT:
-------
For issues or questions:
1. Check README.md for detailed documentation
2. Check WINDOWS-SERVICE.md for service management
3. Contact your system administrator

VERSION: 1.1.5
"@

$readmeContent | Out-File -FilePath "$OutputPath\README.txt" -Encoding UTF8

# Create deployment summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Package Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $OutputPath" -ForegroundColor White
Write-Host ""
Write-Host "Package Contents:" -ForegroundColor Yellow
Write-Host "  - API Server (api-server.mjs)" -ForegroundColor White
Write-Host "  - Dependencies (node_modules)" -ForegroundColor White
Write-Host "  - Data Files (data/)" -ForegroundColor White
Write-Host "  - Batch Scripts (START-API.bat, etc.)" -ForegroundColor White
Write-Host "  - Service Installers" -ForegroundColor White
Write-Host "  - Documentation (README.txt, etc.)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Copy the '$OutputPath' folder to customer PC" -ForegroundColor White
Write-Host "  2. Ensure Node.js is installed on customer PC" -ForegroundColor White
Write-Host "  3. Run INSTALL-SERVICE.bat as Administrator" -ForegroundColor White
Write-Host ""
Write-Host "Note: Customer PC must have Node.js installed!" -ForegroundColor Red
Write-Host "Download from: https://nodejs.org/" -ForegroundColor Cyan
Write-Host ""

# Calculate package size
$size = (Get-ChildItem $OutputPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Package Size: $([math]::Round($size, 2)) MB" -ForegroundColor White
Write-Host ""
