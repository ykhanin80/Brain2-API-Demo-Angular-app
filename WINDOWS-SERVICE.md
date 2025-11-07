# Windows Service Deployment

This guide explains how to deploy the Order App API as a Windows Service.

## Prerequisites

- Node.js installed on the Windows server
- Administrator privileges
- The `node-windows` package is already installed

## Installation Steps

### 1. Install as Windows Service

Open PowerShell or Command Prompt **as Administrator** and run:

```bash
node install-service.js
```

This will:
- Install the API server as a Windows Service named "OrderAppAPI"
- Configure it to start automatically on system boot
- Start the service immediately

### 2. Verify Installation

The service should now be running. Check:
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

You can also verify in Windows Services:
1. Press `Win + R`
2. Type `services.msc`
3. Look for "OrderAppAPI"

## Managing the Service

### Using Windows Services GUI

1. Open Services (`services.msc`)
2. Find "OrderAppAPI"
3. Right-click for options:
   - **Start** - Start the service
   - **Stop** - Stop the service
   - **Restart** - Restart the service
   - **Properties** - Configure startup type, recovery options, etc.

### Using Command Line

```bash
# Start service
net start OrderAppAPI

# Stop service
net stop OrderAppAPI

# Check service status
sc query OrderAppAPI
```

### Using PowerShell

```powershell
# Start service
Start-Service -Name "OrderAppAPI"

# Stop service
Stop-Service -Name "OrderAppAPI"

# Restart service
Restart-Service -Name "OrderAppAPI"

# Get service status
Get-Service -Name "OrderAppAPI"
```

## Uninstallation

To remove the Windows Service, run **as Administrator**:

```bash
node uninstall-service.js
```

## Service Configuration

### Location
- Service Name: `OrderAppAPI`
- Display Name: `Order App Backend API Server`
- Startup Type: Automatic
- Log Files: `%APPDATA%\OrderAppAPI\daemon\`

### Automatic Restart
The service is configured to:
- Start automatically when Windows boots
- Restart automatically if it crashes
- Run in the background (no console window)

### Logs
Service logs are written to:
- Standard output: `%APPDATA%\OrderAppAPI\daemon\OrderAppAPI.out.log`
- Error output: `%APPDATA%\OrderAppAPI\daemon\OrderAppAPI.err.log`

You can monitor logs in real-time:
```powershell
Get-Content "$env:APPDATA\OrderAppAPI\daemon\OrderAppAPI.out.log" -Wait
```

## Network Configuration

### Allow Through Firewall

If you need to access the API from other machines on the network:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Order App API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Change Port

To change the default port (3000):
1. Edit `api-server.mjs`
2. Change `const PORT = 3000;` to your desired port
3. Uninstall and reinstall the service

## Troubleshooting

### Service Won't Start

1. Check the error logs:
   ```
   %APPDATA%\OrderAppAPI\daemon\OrderAppAPI.err.log
   ```

2. Verify Node.js is in system PATH:
   ```powershell
   node --version
   ```

3. Check if port 3000 is already in use:
   ```powershell
   netstat -ano | findstr :3000
   ```

### Permission Issues

- Make sure to run install/uninstall scripts as Administrator
- Verify the service account has read/write access to the `data` folder

### Service Crashes on Startup

Check `api-server.mjs` runs manually first:
```bash
node api-server.mjs
```

If it works manually but not as a service, check:
- File paths are absolute, not relative
- Required files (data/users.json, etc.) exist
- Environment variables are set correctly

## Production Checklist

- [ ] Service installed and running
- [ ] Firewall rules configured (if needed)
- [ ] Data folder has proper permissions
- [ ] Logs directory is accessible
- [ ] Service recovery options configured
- [ ] Backup strategy for data folder
- [ ] Monitoring solution in place

## API Documentation

Once the service is running:
- **Swagger UI**: http://localhost:3000/api-docs
- **API Base URL**: http://localhost:3000/api

## Support

For issues or questions about the service deployment, check:
1. Service logs in `%APPDATA%\OrderAppAPI\daemon\`
2. Windows Event Viewer (Application logs)
3. The service status in Services (services.msc)
