# Admin Panel Setup Guide

This guide explains how to set up and manage admin access for the Cura healthcare application.

## Overview

The admin protection system prevents unauthorized access to admin pages through:
- Principal-based authentication
- Route guards that redirect non-admin users
- Conditional navigation elements
- Access validation on every admin page load

## Admin Pages Protected

The following pages are protected and require admin access:
- `/admin` - Add Records (Admin Panel)
- `/admin2` - Manage Records
- `/admin3` - User Activity

## Setting Up Admin Access

### Step 1: Identify User Principals

1. **In Development Mode**: Users will see a debug panel in the bottom-right corner showing their principal ID when authenticated.

2. **Production Mode**: Admin principals need to be obtained through the ICP authentication system.

### Step 2: Add Admin Principals

Edit the admin configuration file:

```typescript
// File: src/config/adminConfig.ts

export const ADMIN_PRINCIPALS = [
  'development-user-principal', // Remove this in production
  'your-actual-admin-principal-id-here',
  'another-admin-principal-id-here',
  // Add more admin principals as needed
];
```

### Step 3: Remove Development Fallback

For production, remove the development principal:

```typescript
export const ADMIN_PRINCIPALS = [
  // Remove this line in production:
  // 'development-user-principal',
  
  'actual-admin-principal-1',
  'actual-admin-principal-2',
];
```

## How Admin Protection Works

### 1. Route Guards (`AdminRoute` component)
- Wraps admin pages in `App.tsx`
- Checks authentication status
- Validates admin principal against whitelist
- Shows loading state during validation
- Redirects unauthorized users with error message

### 2. Authentication Context Enhancement
- Added `isAdmin` boolean to auth state
- Added `checkAdminStatus()` function
- Automatically sets admin status on login/logout

### 3. Navigation Updates
- Admin navigation items only appear for admin users
- Visual separation between regular and admin sections
- Different color scheme for admin items (red theme)

### 4. Access Control Flow

```
User visits /admin -> AdminRoute checks:
├── Is user authenticated? 
│   ├── No -> Redirect to /login
│   └── Yes -> Continue
├── Is principal in admin list?
│   ├── No -> Show access denied page
│   └── Yes -> Allow access to admin page
```

## Security Features

### URL Protection
- Direct URL access is blocked for non-admin users
- Users cannot bypass protection by typing URLs directly
- Consistent validation across all admin routes

### Visual Feedback
- Loading states during authentication checks
- Clear error messages for unauthorized access
- Debug information in development mode

### Principal-Based Security
- Uses ICP's principal system for authentication
- No client-side security bypasses
- Server-side validation ready (can be extended)

## Development Features

### Debug Panel (`PrincipalDisplay`)
- Shows current user's principal ID
- Copy-to-clipboard functionality
- Admin status indicator
- Only visible in development mode
- Instructions for adding principals to config

### Logging
- Console logs for admin status checks
- Authentication state changes logged
- Principal validation results logged

## Common Issues & Solutions

### Issue: User shows as admin in dev but not production
**Solution**: Make sure to add their production principal to the `ADMIN_PRINCIPALS` array

### Issue: Admin links not showing
**Solution**: Check that the user's principal is correctly added to the admin configuration

### Issue: Still can access admin pages after logout
**Solution**: Admin status is automatically cleared on logout - check browser cache

### Issue: Getting "Access Denied" even as admin
**Solution**: Verify the principal ID exactly matches what's in the configuration (case-sensitive)

## Production Checklist

- [ ] Remove `development-user-principal` from `ADMIN_PRINCIPALS`
- [ ] Add actual admin principal IDs
- [ ] Test admin access with production authentication
- [ ] Verify non-admin users get proper access denied messages
- [ ] Remove or disable `PrincipalDisplay` component
- [ ] Test direct URL access attempts by non-admin users

## Managing Admins at Runtime

The system includes functions for runtime admin management (if needed):

```typescript
import { addAdminPrincipal, removeAdminPrincipal } from './config/adminConfig';

// Add new admin
addAdminPrincipal('new-admin-principal-id');

// Remove admin
removeAdminPrincipal('old-admin-principal-id');
```

**Note**: Runtime changes are not persistent across app reloads. For permanent changes, update the `adminConfig.ts` file.

## Support

For issues with admin access:
1. Check browser console for authentication logs
2. Verify principal IDs match exactly
3. Test with development debug panel enabled
4. Contact system administrator for principal ID assistance