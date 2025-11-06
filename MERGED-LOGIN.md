# Merged Login Flow - Implementation Summary

## What Changed

The application now has a **single login page** that handles both Brain2 API authentication and local user role assignment in one step.

## Login Flow

### Before (Double Login - REMOVED):
1. User enters username/password on User Login page
2. Local authentication validates against hardcoded users
3. Redirect to Brain2 Login page
4. User enters SAME username/password again
5. Brain2 API authentication
6. Access granted

### After (Single Login - NEW):
1. User enters username/password on Login page
2. **Brain2 authentication happens first** (gets API token)
3. **Local authentication happens automatically** (validates user role)
4. Access granted immediately

## Requirements

For this to work, users **MUST** have:
- ✅ Same username in both Brain2 and local user database
- ✅ Same password in both systems

## Local Users (Hardcoded)

Currently defined in `user.service.ts`:

| Username | Password | Role | Access |
|----------|----------|------|--------|
| admin | admin123 | admin | Full access to all pages |
| operator | operator123 | operator | Actions page only |
| viewer | viewer123 | viewer | Dashboard and All Orders (read-only) |

## What Happens When

### Successful Login:
1. Brain2 validates credentials → Returns API token
2. Local system finds user by username → Validates password
3. Both authentications succeed → User is logged in
4. Redirected to appropriate page based on role

### Failed Scenarios:

**Scenario 1: Wrong Password/Username**
- Brain2 authentication fails
- Error: "Invalid username or password for Brain2"

**Scenario 2: Brain2 Server Unavailable**
- Cannot connect to Brain2
- Error: "Cannot connect to Brain2 server at [URL]. Please check server configuration."

**Scenario 3: Brain2 Success, Local User Not Found**
- Brain2 authentication succeeds
- Local user doesn't exist
- Error: "Brain2 authentication successful, but local user '[username]' not found. Please contact admin to create local user account."

## Files Modified

1. **user-login.ts** - Merged authentication logic
2. **app.routes.ts** - Redirect `/login` to `/user-login`
3. **auth.guard.ts** - Redirect to `/user-login` instead of `/login`
4. **user-login.html** - Updated title to "Login with your Brain2 credentials"

## Adding New Users

To add new users, edit `src/app/user.service.ts`:

```typescript
users: LocalUser[] = [
  {
    username: 'newuser',
    password: 'password123',
    displayName: 'New User',
    role: 'operator',
    createdAt: new Date()
  }
];
```

**Important:** The username and password MUST match the Brain2 credentials!

## Migration Notes

- Old `/login` route now redirects to `/user-login`
- Old Login component (`login.ts`) still exists but is not used
- Can be removed in future cleanup if Brain2-only login is no longer needed
- All auth guards now redirect to `/user-login`

## Testing

Test with these credentials (assuming they exist in Brain2):

```
Username: admin
Password: admin123
Expected: Full access to all pages

Username: operator
Password: operator123
Expected: Access to Actions page only

Username: viewer
Password: viewer123
Expected: Read-only access to Dashboard and All Orders
```
