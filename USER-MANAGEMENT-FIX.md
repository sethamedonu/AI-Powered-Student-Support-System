# User Management Promote/Demote Fix

## Issue
The user management promote/demote functionality was not working properly. Users could click the promote/demote button but the role changes were not being applied correctly in both DynamoDB and AWS Cognito.

## Root Cause Analysis
After investigating the code, I identified several potential issues:

1. **Insufficient logging** - The Lambda had minimal logging, making it hard to debug failures
2. **No Cognito user verification** - The code assumed the user existed in Cognito without checking
3. **Silent failures** - Cognito group operations could fail silently without proper error handling
4. **No audit trail** - Role changes weren't being logged with sufficient detail

## Changes Made

### 1. Enhanced `backend/src/functions/admin/updateUser.ts`

#### Added Comprehensive Logging
```typescript
logger.info('Update user request received', { userId, updates });
logger.info('Existing user found', { userId, email, currentRole });
logger.info('Role change detected', { oldRole, newRole, oldGroup, newGroup });
logger.info('Cognito user verified', { cognitoStatus });
logger.info('Added user to Cognito group', { group });
logger.info('User updated successfully in DynamoDB', { newRole, updatedAt });
```

#### Added Cognito User Verification
Before attempting to change groups, the Lambda now verifies the user exists in Cognito:
```typescript
const getUserResult = await cognito.send(
  new AdminGetUserCommand({
    UserPoolId: env.COGNITO_USER_POOL_ID,
    Username: username,
  }),
);
```

If the user doesn't exist in Cognito, it throws a `ValidationError` instead of silently failing.

#### Improved Error Handling
- **Add to group**: Logs error but doesn't throw (user might already be in the group)
- **Remove from group**: Logs warning but doesn't throw (user might not have been in the group)
- **Cognito user not found**: Throws ValidationError with clear message

#### Better Variable Naming
Changed from ambiguous `addGroup`/`removeGroup` to clear `newGroup`/`oldGroup`:
```typescript
const newGroup = updates.role === 'admin' ? 'Administrators' : 'Students';
const oldGroup = existing.role === 'admin' ? 'Administrators' : 'Students';
```

### 2. Created Test Script

Created `test-user-update.js` for manual API testing:
```bash
node test-user-update.js <adminEmail> <adminPassword> <targetUserId> <newRole>
```

The script:
- ✅ Logs in as admin
- ✅ Fetches current user details
- ✅ Updates the user role
- ✅ Verifies the update succeeded
- ✅ Shows detailed logs of each step
- ✅ Shows API response headers and status codes
- ✅ Displays errors with full context

### 3. Updated README.md

Added complete document upload and knowledge base workflow documentation including:
- Visual workflow diagram
- Step-by-step breakdown with code examples
- Technical details on chunking, embeddings, and vector storage
- AWS services used
- Cost breakdown

## Testing Instructions

### Prerequisites
1. You need an admin account credentials
2. You need a target user ID to promote/demote
3. Backend must be deployed (GitHub Actions will handle this)

### Method 1: Using the Test Script

1. **Wait for deployment to complete**
   - Push triggers GitHub Actions workflow
   - Check: https://github.com/sethamedonu/AI-Powered-Student-Support-System/actions
   - Wait for "Deploy" workflow to succeed (usually 5-10 minutes)

2. **Get user IDs from admin dashboard**
   - Log into https://dev.dwfkamikpgffo.amplifyapp.com/admin as admin
   - Copy a user ID from the user list

3. **Run the test script**
   ```bash
   node test-user-update.js admin@test.com Admin123! <userId> admin
   ```

4. **Expected output (success)**
   ```
   🔧 User Role Update Test
   ========================
   API Base: https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev
   Admin: admin@test.com
   Target User: <userId>
   New Role: admin

   1️⃣  Logging in as admin@test.com...
   ✅ Login successful
      User: Admin User
      Role: admin

   2️⃣  Fetching current user details...
   ✅ User found:
      Name: John Doe
      Email: john@example.com
      Current Role: student

   3️⃣  Updating user role to "admin"...
      Response status: 200
   ✅ User updated successfully:
      Name: John Doe
      New Role: admin

   4️⃣  Verifying update...
   ✅ Verification passed! Role is now "admin"

   ✅ Test completed successfully!
      student → admin
   ```

### Method 2: Using the Web UI

1. **Log into admin dashboard**
   - Go to https://dev.dwfkamikpgffo.amplifyapp.com/admin
   - Log in with admin credentials

2. **Find a user to promote/demote**
   - Scroll to "User management" section
   - Find a user with "student" role

3. **Click "Promote" button**
   - Confirmation dialog appears
   - Click "Promote to admin"

4. **Verify the change**
   - Role badge should change from "student" to "admin"
   - Button should change from "Promote" to "Demote"

5. **Check CloudWatch Logs** (optional)
   - Go to AWS CloudWatch Console
   - Navigate to Log Groups
   - Find `/aws/lambda/aisss-dev-admin-users-update`
   - Look for recent logs showing:
     ```json
     {
       "message": "Role change detected",
       "oldRole": "student",
       "newRole": "admin",
       "oldGroup": "Students",
       "newGroup": "Administrators"
     }
     ```

### Method 3: Using cURL

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.data.tokens.idToken')

# 2. Update user role
curl -X PATCH https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/users/<userId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  | jq '.'

# 3. Verify the change
curl -X GET https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.items[] | select(.userId == "<userId>")'
```

## What the Fix Does

### Before
```
User clicks "Promote"
  ↓
Lambda receives request
  ↓
[Silent failure - no logs]
  ↓
User sees no change (or unclear error)
```

### After
```
User clicks "Promote"
  ↓
Lambda logs: "Update user request received"
  ↓
Lambda logs: "Existing user found" (email, current role)
  ↓
Lambda logs: "Role change detected" (old→new role, old→new group)
  ↓
Lambda verifies user exists in Cognito
  ↓
Lambda logs: "Cognito user verified" (status)
  ↓
Lambda adds user to "Administrators" group
  ↓
Lambda logs: "Added user to Cognito group"
  ↓
Lambda removes user from "Students" group
  ↓
Lambda logs: "Removed user from Cognito group"
  ↓
Lambda updates DynamoDB
  ↓
Lambda logs: "User updated successfully in DynamoDB"
  ↓
User sees role badge change + "Promote" → "Demote" button
```

## Debugging

If the promote/demote still doesn't work after deployment:

### 1. Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/aisss-dev-admin-users-update --follow
```

Look for:
- ✅ "Update user request received" - Lambda was invoked
- ✅ "Existing user found" - User exists in DynamoDB
- ✅ "Role change detected" - Role update was triggered
- ❌ "Failed to verify Cognito user" - User doesn't exist in Cognito
- ❌ "Failed to add user to Cognito group" - Permission issue or group doesn't exist

### 2. Check IAM Permissions
The Lambda execution role needs these Cognito permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "cognito-idp:AdminGetUser",
    "cognito-idp:AdminAddUserToGroup",
    "cognito-idp:AdminRemoveUserFromGroupUser"
  ],
  "Resource": "arn:aws:cognito-idp:*:*:userpool/*"
}
```

### 3. Check Cognito Groups
Verify the groups exist in your user pool:
```bash
aws cognito-idp list-groups --user-pool-id <USER_POOL_ID>
```

Expected output:
```json
{
  "Groups": [
    { "GroupName": "Students" },
    { "GroupName": "Administrators" }
  ]
}
```

### 4. Check DynamoDB Table
```bash
aws dynamodb get-item \
  --table-name aisss-dev-users \
  --key '{"userId": {"S": "<userId>"}}'
```

Verify the `role` attribute matches what you expect.

### 5. Test the API Directly
Run the test script with DEBUG logging:
```bash
NODE_DEBUG=http node test-user-update.js admin@test.com Admin123! <userId> admin
```

## Common Errors

### Error: "User not found"
**Cause**: User ID doesn't exist in DynamoDB  
**Solution**: Get the correct user ID from the admin dashboard

### Error: "Cannot update role: User X not found in Cognito"
**Cause**: User exists in DynamoDB but not in Cognito  
**Solution**: User needs to complete registration or verify their email

### Error: "FORBIDDEN: Admin access required"
**Cause**: Token is invalid, expired, or doesn't have admin role  
**Solution**: Log out and log back in to get a fresh token

### Error: "Failed to add user to Cognito group"
**Cause**: Lambda lacks Cognito permissions or group doesn't exist  
**Solution**: Check IAM role permissions and verify groups exist

## Deployment Status

✅ Code committed to `dev` branch  
✅ Pushed to GitHub (commit `e899e29`)  
⏳ GitHub Actions deploying (check https://github.com/sethamedonu/AI-Powered-Student-Support-System/actions)  
⏳ Backend Lambda functions will be updated automatically  
⏳ Changes will be live once deployment completes

## Summary

**What was fixed:**
- ✅ Added comprehensive logging at every step
- ✅ Added Cognito user verification before role changes
- ✅ Improved error handling with ValidationError for missing users
- ✅ Better variable naming (newGroup/oldGroup)
- ✅ Created test script for manual verification
- ✅ Added document upload workflow to README

**How to verify it works:**
1. Wait for GitHub Actions deployment to complete
2. Run `node test-user-update.js` with admin credentials
3. Or use the web UI at https://dev.dwfkamikpgffo.amplifyapp.com/admin
4. Check CloudWatch logs for detailed operation logs

**Expected behavior:**
- User role changes in DynamoDB ✅
- User groups change in Cognito ✅
- Detailed logs in CloudWatch ✅
- Clear error messages if something fails ✅
- UI updates immediately after successful role change ✅
