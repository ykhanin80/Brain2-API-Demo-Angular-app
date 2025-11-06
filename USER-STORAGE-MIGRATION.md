# User Storage Migration to Server-Side

## Overview

Users are now stored server-side in `data/users.json` instead of localStorage. This enables the app to work properly on local networks where multiple users on different machines need access to the same user database.

## Changes Made

### 1. API Server (`api-server.mjs`)
Added user management endpoints:
- `GET /api/users` - Get all users (without password hashes)
- `POST /api/users/validate` - Validate user credentials for login
- `POST /api/users` - Create new user
- `PUT /api/users/:username` - Update existing user
- `DELETE /api/users/:username` - Delete user (admin cannot be deleted)

### 2. Password Security
- Passwords are hashed using SHA-256 before storage
- Plain text passwords are never stored
- Password hashes are never sent to the client
- `hashPassword()` and `verifyPassword()` functions handle encryption

### 3. UserService (`user.service.ts`)
Updated to use HTTP API calls instead of localStorage:
- `login()` - Now async, calls `/api/users/validate`
- `getAllUsers()` - Now async, calls `GET /api/users`
- `addUser()` - Now async, calls `POST /api/users`
- `updateUser()` - Now async, calls `PUT /api/users/:username`
- `deleteUser()` - Now async, calls `DELETE /api/users/:username`

### 4. Components Updated
- `user-login.ts` - Login method now handles async UserService.login()
- `admin.ts` - User management methods now async (loadUsers, saveUser, deleteUser)

### 5. Production Server (`standalone-server.mjs`)
Added same user management endpoints for production builds

## Default Users

Three default users are created on first run:

| Username | Password    | Role     | Access                                          |
|----------|-------------|----------|-------------------------------------------------|
| admin    | admin123    | admin    | Full access to all features                     |
| operator | operator123 | operator | Actions page only                               |
| viewer   | viewer123   | viewer   | Dashboard and All Orders (read-only)            |

**⚠️ CHANGE THESE PASSWORDS BEFORE DEPLOYMENT!**

## Storage Location

Users are stored in: `data/users.json`

Example structure:
```json
[
  {
    "username": "admin",
    "passwordHash": "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
    "role": "admin",
    "displayName": "Administrator",
    "createdAt": "2025-11-06T03:01:27.230Z"
  }
]
```

## Network Deployment

### Development
1. Start API server: `npm run api` (port 3000)
2. Start Angular dev: `npm start` (port 4200, proxies to 3000)
3. Both servers must be running

### Production
1. Build: `npm run build`
2. Run: `node standalone-server.mjs`
3. Single server serves both static files and API on port 4200

### Network Access
- The `data/users.json` file is shared across all clients
- Users created on one machine are immediately available on all machines
- All machines must access the same server
- Server machine must be accessible on the network

## Security Notes

- Passwords are hashed with SHA-256 (one-way encryption)
- Even if someone accesses `users.json`, passwords cannot be reversed
- Password hashes are never sent to the client
- API validates credentials server-side before returning user data
- Admin user cannot be deleted (protected at API level)

## Migration Path

If you have users stored in localStorage, they will need to be recreated through the Admin panel. The old localStorage users will not be automatically migrated.

## Testing Network Access

1. **Server Machine**: Run `node standalone-server.mjs` or both dev servers
2. **Client Machine 1**: Open browser to `http://[server-ip]:4200`, log in as admin, create a test user
3. **Client Machine 2**: Open browser to `http://[server-ip]:4200`, verify the new user appears and can log in
4. **Client Machine 1**: Delete the test user
5. **Client Machine 2**: Verify user is deleted (refresh Admin page)

All operations should sync across all machines in real-time (on next page load/refresh).
