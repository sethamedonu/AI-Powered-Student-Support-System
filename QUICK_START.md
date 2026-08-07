# AI Student Support System - Quick Start Guide

## ✅ System Status

### All Infrastructure Working
- ✅ Backend: 22 Lambda functions deployed
- ✅ API Gateway: https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev
- ✅ Frontend: https://dev.dwfkamikpgffo.amplifyapp.com
- ✅ Cognito: 7 confirmed users
- ✅ GitHub Actions CI: Passing
- ✅ Amplify Deploy: Passing

## 🚀 How to Use the Application

### Step 1: Log In
1. Go to **https://dev.dwfkamikpgffo.amplifyapp.com/auth/login**
2. Use one of the existing test accounts (contact admin for passwords):
   - setnetnetworks@gmail.com
   - reennhyira85@gmail.com
   - fred.testing.app@gmail.com
   - setnet.test@zohomail.com
   - domprehdoreenappiah@gmail.com
   - sethkelvin3@gmail.com
   - terrence.binful@azubiafrica.org

### Step 2: Access Features

After logging in, you can access:

#### For All Users:
- **Dashboard** (`/dashboard`) - Overview and quick access
- **Chat** (`/chat`) - AI-powered Q&A with category selection
- **Conversations** (`/conversations`) - View conversation history
- **Feedback** (`/feedback`) - Submit feedback with star ratings

#### For Admin Users:
- **Analytics** (`/admin/analytics`) - Usage metrics and AI performance
- **User Management** (`/admin/users`) - View and manage users
- **Feedback List** (`/admin/feedback`) - View all user feedback
- **Knowledge Base** (`/admin/knowledge`) - Manage knowledge base content

## 🔍 Troubleshooting "Failed to Load Data" Errors

### This is EXPECTED if:
❌ **You're not logged in** → Solution: Log in first
❌ **Your token expired** (after 1 hour) → Solution: Log in again
❌ **You're not an admin** (for admin pages) → Solution: Use an admin account

### Verify You're Logged In:

Open browser console (F12) and check:
```javascript
console.log('Logged in:', !!localStorage.getItem('idToken'));
```

If it returns `false`, you need to log in.

### Test API Connectivity:

After logging in, test the API in browser console:
```javascript
const token = localStorage.getItem('idToken');
fetch('https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/conversations?limit=5', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('✅ Working:', data))
.catch(err => console.error('❌ Error:', err));
```

Expected response:
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

## 🛠️ Deploy Workflow Fixed

The deploy workflow now uses `npm install` instead of `npm ci` to avoid lockfile conflicts.

### Trigger Deploy Manually:
```bash
# Go to GitHub Actions
# Select "Deploy — Infrastructure & Backend"
# Click "Run workflow"
# Choose environment: dev
# Choose action: apply
```

## 📊 Monitoring

### Check Lambda Logs:
```bash
aws logs tail /aws/lambda/aisss-dev-conversations-list --region us-east-1 --since 30m --follow
```

### Check API Health:
```bash
curl https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "environment": "development",
    "timestamp": "...",
    "services": {
      "database": "connected",
      "sqs": "connected"
    }
  }
}
```

### Check Amplify Deployment:
```bash
aws amplify list-apps --region us-east-1
```

## 🔐 User Roles

### Regular User:
- View own conversations
- Chat with AI
- Submit feedback
- Access dashboard

### Admin User:
- All regular user features
- View analytics
- Manage users (promote/demote, enable/disable)
- View all feedback
- Manage knowledge base

## 📝 Common Operations

### Create a New User (via Cognito):
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_PXvI63Kwg \
  --username "user@example.com" \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
  --region us-east-1
```

### Promote User to Admin:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_PXvI63Kwg \
  --username "user@example.com" \
  --group-name admin \
  --region us-east-1
```

### Check User Groups:
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_PXvI63Kwg \
  --username "user@example.com" \
  --region us-east-1
```

## 🎯 Feature Highlights

### AI Chat Features:
- 9 knowledge categories (General, Admissions, Registration, Tuition, Exams, Calendar, Graduation, Scholarships, Campus Services)
- Context-aware responses using Amazon Bedrock
- Conversation history
- Cache optimization for faster responses
- Model usage tracking

### Admin Analytics:
- Message volume over time
- Cache hit rate (cost optimization)
- Top question categories
- AI model usage breakdown
- Detailed metrics table

### Feedback System:
- 5-star ratings
- Category-based feedback
- Admin dashboard for feedback review

## 🚨 Known Limitations

1. **Token Expiry**: ID tokens expire after 1 hour. Users need to re-login.
2. **Real-time Updates**: Pages don't auto-refresh. Use browser refresh (F5) to see latest data.
3. **Error Messages**: Some errors show generic messages. Check browser console for details.

## 📚 Additional Resources

- **Full Debug Guide**: See `FRONTEND_DEBUG_GUIDE.md` for detailed troubleshooting
- **API Documentation**: Check backend Lambda function handlers
- **Infrastructure**: See `infrastructure/` directory for Terraform configs

## ✅ Success Criteria

The application is working correctly when:
- ✅ You can log in successfully
- ✅ Dashboard loads without errors
- ✅ Chat sends and receives messages
- ✅ Conversations page shows your chat history
- ✅ Feedback form submits successfully
- ✅ Admin pages load (for admin users)

## 💡 Pro Tips

1. **Bookmark the login page** for quick access
2. **Use browser console** (F12) to debug API issues
3. **Clear cache** if seeing old data: Hard reload with Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. **Check token expiry** if data suddenly stops loading after working
5. **Use category suggestions** in chat for quick questions

---

**Need Help?**
- Check browser console for errors (F12)
- Review `FRONTEND_DEBUG_GUIDE.md` for detailed troubleshooting
- Check Lambda logs for backend issues
- Verify you're logged in with valid tokens
