# API URL Configuration Summary

## Environment Files

### Development (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200/api'  // Proxied to localhost:3000/api
};
```

### Production (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:5005/api/order'  // Proxied by OrderAppHost to localhost:3000/api
};
```

## How It Works

### Development (Port 4200):
1. Angular dev server runs on `http://localhost:4200`
2. API calls go to `http://localhost:4200/api/*`
3. `proxy.conf.json` forwards to `http://localhost:3000/api/*`
4. API server responds from `http://localhost:3000`

```
Angular (4200) → Proxy → API Server (3000)
```

### Production (Port 5005):
1. OrderAppHost serves Angular app on `http://localhost:5005`
2. Angular API calls go to `http://localhost:5005/api/order/*`
3. OrderAppHost proxy forwards to `http://localhost:3000/api/*`
4. API server responds from `http://localhost:3000`

```
Angular (5005) → OrderAppHost Proxy → API Server (3000)
```

## API Endpoints Mapping

### User Service URLs:

**Development:**
- `GET http://localhost:4200/api/users` → `http://localhost:3000/api/users`
- `POST http://localhost:4200/api/users/validate` → `http://localhost:3000/api/users/validate`
- `PUT http://localhost:4200/api/users/:username` → `http://localhost:3000/api/users/:username`
- `DELETE http://localhost:4200/api/users/:username` → `http://localhost:3000/api/users/:username`

**Production:**
- `GET http://localhost:5005/api/order/users` → `http://localhost:3000/api/users`
- `POST http://localhost:5005/api/order/users/validate` → `http://localhost:3000/api/users/validate`
- `PUT http://localhost:5005/api/order/users/:username` → `http://localhost:3000/api/users/:username`
- `DELETE http://localhost:5005/api/order/users/:username` → `http://localhost:3000/api/users/:username`

### Actions Config Service URLs:

**Development:**
- `GET http://localhost:4200/api/action-configurations` → `http://localhost:3000/api/action-configurations`
- `POST http://localhost:4200/api/action-configurations` → `http://localhost:3000/api/action-configurations`

**Production:**
- `GET http://localhost:5005/api/order/action-configurations` → `http://localhost:3000/api/action-configurations`
- `POST http://localhost:5005/api/order/action-configurations` → `http://localhost:3000/api/action-configurations`

## OrderAppHost Configuration

Your OrderAppHost proxy should be configured like:

```javascript
// Proxy configuration in OrderAppHost
app.use('/api/order', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/order': '/api'  // Remove /api/order prefix, forward to /api
  }
}));
```

## Build Output

**Latest Production Build:** `C:\BIZERBA\development\order-app\dist\order-app\browser\`

**Version:** 1.1.5

**Deploy to OrderAppHost:**
Copy contents of `dist/order-app/browser/` to your OrderAppHost static files directory.

## API Server

**Location:** `C:\BIZERBA\development\order-app\api-server.mjs`

**Runs on:** `http://localhost:3000`

**Endpoints:**
- API Base: `http://localhost:3000/api`
- Swagger Docs: `http://localhost:3000/api-docs`

**Start Command:**
```bash
node api-server.mjs
```

**Hosted by:** OrderAppHost (as you mentioned)

## Testing

### Development Mode:
```bash
npm start
# Opens http://localhost:4200
# API calls proxied to localhost:3000
```

### Production Mode:
1. Build: `ng build --configuration production`
2. Copy `dist/order-app/browser/*` to OrderAppHost
3. OrderAppHost serves on port 5005
4. API calls go to `/api/order/*` and proxied to localhost:3000

## Summary

✅ Development uses direct proxy from port 4200 to 3000
✅ Production uses OrderAppHost proxy from port 5005 to 3000  
✅ All API calls now use environment-based URLs
✅ No hardcoded API URLs in services
✅ Version 1.1.5 built and ready for deployment
