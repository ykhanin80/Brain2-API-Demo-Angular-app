# Deployment Guide for Customer PCs (Without Node.js)

## Option 1: Portable Node.js (Recommended)

Since customers don't have Node.js installed, include a portable version.

### Deployment Package Contents:

```
order-app-deployment/
├── node-portable/           # Portable Node.js runtime
├── api-server.mjs          # API server
├── install-service.js      # Service installer
├── uninstall-service.js    # Service uninstaller  
├── data/                   # Data folder
│   ├── users.json
│   └── action-configurations.json
├── node_modules/           # Dependencies
├── package.json
├── start-api.bat           # Manual start script
└── README.txt              # Customer instructions
```

### Steps to Create Deployment Package:

1. **Download Portable Node.js:**
   - Go to https://nodejs.org/
   - Download Windows 64-bit Binary (.zip)
   - Extract to `node-portable` folder

2. **Copy Required Files:**
   ```bash
   # Run these commands in PowerShell
   mkdir order-app-deployment
   cd order-app-deployment
   
   # Copy API files
   copy ..\api-server.mjs .
   copy ..\install-service.js .
   copy ..\uninstall-service.js .
   copy ..\package.json .
   
   # Copy data folder
   xcopy ..\data data\ /E /I
   
   # Copy node_modules
   xcopy ..\node_modules node_modules\ /E /I
   ```

3. **Create start-api.bat:**
   ```batch
   @echo off
   echo Starting Order App API Server...
   node-portable\node.exe api-server.mjs
   pause
   ```

4. **Create install-service.bat:**
   ```batch
   @echo off
   echo Installing Order App API as Windows Service...
   echo Please run this as Administrator!
   pause
   node-portable\node.exe install-service.js
   pause
   ```

---

## Option 2: Install Node.js on Customer PC

If you can install Node.js on the customer's PC:

### Installation Steps:

1. **Install Node.js:**
   - Download from https://nodejs.org/ (LTS version)
   - Run installer with default options

2. **Deploy Files:**
   - Copy entire `order-app` folder to customer PC
   - Or just copy these files:
     ```
     api-server.mjs
     install-service.js
     uninstall-service.js
     package.json
     data/
     node_modules/
     ```

3. **Install as Service:**
   ```bash
   # Open PowerShell as Administrator
   cd C:\path\to\order-app
   node install-service.js
   ```

---

## Option 3: Docker Container (For Advanced Setups)

If customer has Docker:

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY api-server.mjs package.json ./
   COPY data ./data
   COPY node_modules ./node_modules
   EXPOSE 3000
   CMD ["node", "api-server.mjs"]
   ```

2. **Build and Run:**
   ```bash
   docker build -t order-app-api .
   docker run -d -p 3000:3000 --name order-app-api order-app-api
   ```

---

## Recommended Deployment Structure

### For Customer PC (Recommended):

```
C:\OrderApp\
├── API\
│   ├── node-portable\           # Portable Node.js
│   ├── api-server.mjs
│   ├── data\
│   ├── node_modules\
│   ├── package.json
│   ├── START-API.bat            # Double-click to run
│   ├── INSTALL-SERVICE.bat      # Right-click > Run as Admin
│   └── UNINSTALL-SERVICE.bat
└── Web\
    └── (Your Angular app files from IIS)
```

### API Server Location:
- **Development**: `C:\BIZERBA\development\order-app\api-server.mjs`
- **Production**: `C:\OrderApp\API\` (or wherever you deploy)

---

## Customer Instructions

### Manual Start (Testing):
1. Navigate to `C:\OrderApp\API\`
2. Double-click `START-API.bat`
3. API will run at http://localhost:3000
4. Swagger docs at http://localhost:3000/api-docs

### Install as Windows Service (Production):
1. Navigate to `C:\OrderApp\API\`
2. Right-click `INSTALL-SERVICE.bat`
3. Select "Run as administrator"
4. Service will start automatically
5. Service will auto-start on PC reboot

### Verify Service:
1. Press `Win + R`
2. Type `services.msc`
3. Look for "OrderAppAPI"
4. Should show "Running" status

---

## Network Access

### Configure IIS for Angular App:
Your Angular app should be served by IIS and point to:
```
http://localhost:3000/api
```

### If API needs to be accessed from network:
1. Update api-server.mjs to bind to all interfaces:
   ```javascript
   const HOST = '0.0.0.0';  // Instead of localhost
   app.listen(PORT, HOST, () => { ... });
   ```

2. Add firewall rule:
   ```powershell
   New-NetFirewallRule -DisplayName "Order App API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

3. Update Angular app's API URL in your IIS config or proxy

---

## File Locations Summary

### Development:
- **API Server**: `C:\BIZERBA\development\order-app\api-server.mjs`
- **Data Files**: `C:\BIZERBA\development\order-app\data\`
- **Angular App**: `C:\BIZERBA\development\order-app\dist\order-app\browser\`

### Production (Recommended):
- **API Server**: `C:\OrderApp\API\api-server.mjs`
- **Data Files**: `C:\OrderApp\API\data\`
- **Angular App**: `C:\inetpub\wwwroot\order-app\` (or your IIS path)

---

## Next Steps

1. Choose deployment method (Option 1 recommended for no Node.js)
2. Create deployment package
3. Test on clean PC
4. Document for customer
5. Deploy to production

Would you like me to create the batch files and deployment scripts?
