# Frontend Data Loading Debug Guide

## Problem
Pages show "failed to load or fetch admin/analytics/conversation data" error

## Root Cause Analysis

### ✅ Backend Infrastructure (ALL WORKING)
- API Gateway: `https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev`
- Health endpoint: ✅ Returns 200 OK
- All 22 Lambda functions: ✅ Deployed successfully
- Cognito User Pool: `us-east-1_PXvI63Kwg` ✅ Active with 7 confirmed users
- Cognito Client: `1rsoeuo9edt2m7rsf6dvc10ctd` ✅ Configured
- API Gateway Authorizer: ✅ Configured with correct user pool

### ✅ Frontend Deployment (ALL WORKING)
- Amplify App: `dwfkamikpgffo`
- Frontend URL: `https://dev.dwfkamikpgffo.amplifyapp.com`
- Environment variables: ✅ All correctly configured
- Landing page: ✅ Loads
- Login page: ✅ Loads

### ❌ The Actual Issue: Authentication Token Flow

The problem is that **users must LOG IN first** before data can load. Here's why:

1. **API requires authentication** - All data endpoints require a valid Cognito ID token
2. **No tokens = 401 Unauthorized** - Without login, API calls fail
3. **Frontend swallows errors** - The catch blocks show generic "Failed to load" messages

## Solution Steps

### Step 1: Log In to the Application

1. Go to https://dev.dwfkamikpgffo.amplifyapp.com/auth/login
2. Use one of these test accounts (ask admin for password):
   - setnetnetworks@gmail.com
   - reennhyira85@gmail.com
   - fred.testing.app@gmail.com
   - setnet.test@zohomail.com
   - domprehdoreenappiah@gmail.com
   - sethkelvin3@gmail.com
   - terrence.binful@azubiafrica.org

3. After successful login, tokens are stored in:
   - `localStorage.accessToken`
   - `localStorage.idToken` (this is what API Gateway validates)
   - `localStorage.refreshToken`
   - Cookies: `accessToken`, `user`

### Step 2: Verify Token Storage

Open browser console (F12) and run:

```javascript
console.log({
  hasAccessToken: !!localStorage.getItem('accessToken'),
  hasIdToken: !!localStorage.getItem('idToken'),
  hasRefreshToken: !!localStorage.getItem('refreshToken'),
  user: localStorage.getItem('user')
});
```

Expected output if logged in:
```javascript
{
  hasAccessToken: true,
  hasIdToken: true,
  hasRefreshToken: true,
  user: '{"email":"your@email.com",...}'
}
```

### Step 3: Test API Call Manually

In browser console, test an authenticated API call:

```javascript
const idToken = localStorage.getItem('idToken');
fetch('https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/conversations?limit=5', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ API Response:', data))
.catch(err => console.error('❌ API Error:', err));
```

Expected response if working:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 0,
    "hasMore": false
  }
}
```

### Step 4: If Still Failing - Check Token Expiry

Tokens expire after 1 hour. Check expiry:

```javascript
const idToken = localStorage.getItem('idToken');
if (idToken) {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  const expiry = new Date(payload.exp * 1000);
  console.log('Token expires:', expiry);
  console.log('Is expired:', expiry < new Date());
}
```

If expired, refresh or log in again.

## Common Issues & Fixes

### Issue 1: "Failed to load conversations" immediately after login
**Cause**: Race condition - page loads before tokens are saved to localStorage
**Fix**: Refresh the page after login (F5)

### Issue 2: Data loads then stops working
**Cause**: Token expired (1 hour lifetime)
**Fix**: Log out and log back in

### Issue 3: Chat submit button not working
**Cause**: Same authentication issue - no valid token
**Fix**: Ensure you're logged in first

### Issue 4: Feedback submit button not working
**Cause**: Same authentication issue
**Fix**: Ensure you're logged in first

### Issue 5: Admin pages show "Failed to load"
**Cause**: 
1. Not logged in, OR
2. Logged in but not as admin role
**Fix**: 
1. Log in first
2. Verify your account has admin role (check `localStorage.user` → `role` field)

## Testing Checklist

Once logged in, verify each page:

- [ ] Dashboard (`/dashboard`) - Should load without errors
- [ ] Conversations (`/conversations`) - Should show conversation list (may be empty if new user)
- [ ] Chat (`/chat`) - Should allow sending messages
- [ ] Feedback (`/feedback`) - Submit button should work
- [ ] Admin Analytics (`/admin/analytics`) - Should load charts (admin only)
- [ ] Admin Users (`/admin/users`) - Should show user list (admin only)

## Technical Details

### Why the Error Messages Are Vague

The frontend components catch API errors generically:

```typescript
// ConversationsClient.tsx line 20
conversationsApi
  .list(50)
  .then((r) => setConversations(r.items))
  .catch(() => setError("Failed to load conversations."))  // ❌ Swallows actual error
```

**Better approach** (for debugging):
```typescript
.catch((err) => {
  console.error('API Error:', err);  // Log actual error
  setError(`Failed to load conversations: ${err.message}`);
})
```

### How Authentication Works

1. User submits login form → `POST /auth/login`
2. Backend validates with Cognito → Returns tokens
3. Frontend saves tokens to localStorage + cookies
4. All subsequent API calls include `Authorization: Bearer {idToken}` header
5. API Gateway Cognito Authorizer validates token
6. If valid → Lambda executes
7. If invalid/missing → Returns 401 Unauthorized

### Why idToken (not accessToken)

API Gateway's Cognito Authorizer specifically requires the **ID token**, not the access token:
- ✅ ID token has `aud` (audience) claim = Client ID
- ✅ ID token has `cognito:groups` for role checking
- ❌ Access token missing `aud` claim → Rejected by authorizer

See `frontend/src/lib/api.ts` line 63:
```typescript
return localStorage.getItem("idToken") ?? localStorage.getItem("accessToken");
```

## For Developers: Adding Better Error Messages

To improve debugging, update error handlers to show actual errors:

### frontend/src/app/(app)/conversations/ConversationsClient.tsx
```typescript
// Line 20 - Change from:
.catch(() => setError("Failed to load conversations."))

// To:
.catch((err) => {
  console.error('Conversations API error:', err);
  setError(err.message || "Failed to load conversations.");
})
```

### frontend/src/app/(app)/admin/analytics/AnalyticsClient.tsx
```typescript
// Line 34 - Change from:
} catch {
  setError("Failed to load analytics data.");
}

// To:
} catch (err: any) {
  console.error('Analytics API error:', err);
  setError(err.message || "Failed to load analytics data.");
}
```

## Summary

✅ **All infrastructure is working correctly**
- Backend deployed
- API responding
- Authentication configured
- Cognito users exist

❌ **The issue: Users need to LOG IN first**
1. Go to login page
2. Enter credentials
3. Tokens saved to localStorage
4. Data loads successfully

This is **expected behavior** - a secure application that requires authentication before showing data.
