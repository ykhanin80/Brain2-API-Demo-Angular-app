# Development Setup with API Server

## Running in Development Mode

To run the application with the backend API for action configurations, you need to start **two** servers:

### Terminal 1: Backend API Server (Port 3000)
```bash
npm run api
```

This starts the Express server that provides the `/api/action-configurations` endpoints.

### Terminal 2: Angular Development Server (Port 4200)
```bash
npm start
```

This starts the Angular dev server with proxy configuration that forwards `/api/*` requests to the backend server on port 3000.

### Access the Application
Open your browser to: **http://localhost:4200**

---

## Running in Production Mode

For production, use the standalone server that serves both the Angular app and API:

```bash
npm run build          # Build the application
npm run serve:prod     # Start combined server on port 4200
```

---

## How It Works

**Development Mode:**
- Angular dev server runs on port 4200
- Backend API server runs on port 3000
- Proxy configuration (`proxy.conf.json`) forwards API calls from 4200 → 3000
- Hot reload enabled for Angular code changes

**Production Mode:**
- Single server runs on port 4200
- Serves static files from `dist/order-app/browser`
- Handles API endpoints directly
- No hot reload, requires rebuild for changes

---

## API Endpoints

### GET /api/action-configurations
Loads all action button configurations from `data/action-configurations.json`

**Response:**
```json
[
  {
    "id": "default_1",
    "buttonLabel": "Line 1",
    "productionLine": "Line 1",
    "jobName": "SendToLine1",
    "order": 0
  }
]
```

### POST /api/action-configurations
Saves all action button configurations to `data/action-configurations.json`

**Request Body:**
```json
[
  { "id": "...", "buttonLabel": "...", "productionLine": "...", "jobName": "...", "order": 0 }
]
```

**Response:**
```json
{
  "success": true,
  "message": "Configurations saved successfully"
}
```

---

## Data Storage

Configurations are stored in: `data/action-configurations.json`

This file is:
- ✅ Shared across all users
- ✅ Persists through server restarts
- ✅ Can be backed up
- ✅ Can be version controlled

---

## Troubleshooting

**Issue:** Can't see configured actions on Actions page

**Solution:** Make sure the API server is running (`npm run api`)

**Issue:** API returns 404

**Solution:** 
1. Check if API server is running on port 3000
2. Check if proxy.conf.json exists
3. Restart Angular dev server with `npm start`

**Issue:** Configurations not persisting

**Solution:** Check if `data/` directory exists and server has write permissions
