# Analytics Functionality Fix

## Issue
The analytics page at `/admin/analytics` was not working. The page would load but show no data or display errors because the backend Lambda was returning raw analytics events instead of the aggregated metrics structure that the frontend expected.

## Root Cause Analysis

### Backend Lambda Issue
The `backend/src/functions/admin/getAnalytics.ts` Lambda was querying analytics events from DynamoDB but returning them as raw arrays:
```typescript
// ❌ Before - returning raw events
return successResponse({ aiEvents, cacheEvents, from, to }, 200, requestId);
```

### Frontend Expectations
The `frontend/src/app/(app)/admin/analytics/AnalyticsClient.tsx` component expects a structured response:
```typescript
interface AnalyticsData {
  period: string;
  metrics: MetricRow[];              // Aggregated by date
  topCategories: { category: string; count: number }[];  // Top 5
  modelUsage: { model: string; count: number }[];        // Model breakdown
}
```

### Analytics Event Recording
Analytics events were being recorded properly by the AI orchestrator, but the metadata wasn't consistently including `category` and `model` fields needed for proper aggregation.

## Changes Made

### 1. Fixed `backend/src/functions/admin/getAnalytics.ts`

#### Added Data Aggregation
```typescript
// Aggregate metrics by date
const metricsByDate = new Map<string, MetricRow>();
const categoryCount = new Map<string, number>();
const modelCount = new Map<string, number>();

// Process AI invocation events
for (const event of aiEvents) {
  const date = event.date ?? event.timestamp.split('T')[0];
  const existing = metricsByDate.get(date) ?? { date, messages: 0, cacheHits: 0, aiCalls: 0 };
  
  existing.messages += 1;
  existing.aiCalls += 1;
  metricsByDate.set(date, existing);
  
  // Track categories and models
  const category = (event.metadata?.category as string) ?? 'general';
  categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
  
  const model = (event.metadata?.model as string) ?? 'unknown';
  modelCount.set(model, (modelCount.get(model) ?? 0) + 1);
}

// Process cache hit events
for (const event of cacheEvents) {
  const date = event.date ?? event.timestamp.split('T')[0];
  const existing = metricsByDate.get(date) ?? { date, messages: 0, cacheHits: 0, aiCalls: 0 };
  
  existing.messages += 1;
  existing.cacheHits += 1;
  metricsByDate.set(date, existing);
}
```

#### Sort and Structure Response
```typescript
// Sort metrics by date
const metrics = Array.from(metricsByDate.values()).sort(
  (a, b) => a.date.localeCompare(b.date),
);

// Top 5 categories by count
const topCategories = Array.from(categoryCount.entries())
  .map(([category, count]) => ({ category, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

// Model usage sorted by count
const modelUsage = Array.from(modelCount.entries())
  .map(([model, count]) => ({ model, count }))
  .sort((a, b) => b.count - a.count);

const response: AnalyticsResponse = {
  period,
  metrics,
  topCategories,
  modelUsage,
};
```

#### Added Comprehensive Logging
```typescript
logger.info('Analytics request received', { period });
logger.info('Querying analytics data', { from, to, rangeMs });
logger.info('Analytics events retrieved', {
  aiEventsCount: aiEvents.length,
  cacheEventsCount: cacheEvents.length,
});
logger.info('Analytics aggregation complete', {
  metricsCount: metrics.length,
  topCategoriesCount: topCategories.length,
  modelUsageCount: modelUsage.length,
});
```

### 2. Enhanced `backend/src/core/infrastructure/ai/orchestrator.ts`

#### Include Category in Cache Hit Events
```typescript
// Before
await this.recordAnalytics('cache_hit', request.userId);

// After
await this.recordAnalytics('cache_hit', request.userId, {
  category: cached.category,
  model: cached.model,
});
```

#### Include Category in AI Invocation Events
```typescript
// Before
await this.recordAnalytics('ai_invocation', request.userId, {
  model: aiResponse.model,
  tokensUsed: aiResponse.tokensUsed,
  complexity,
});

// After
await this.recordAnalytics('ai_invocation', request.userId, {
  model: aiResponse.model,
  tokensUsed: aiResponse.tokensUsed,
  complexity,
  category,
});
```

#### Added Better Logging
```typescript
private async recordAnalytics(
  metricType: string,
  userId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await this.analyticsRepo.record({
      metricType,
      value: 1,
      metadata: { userId, ...metadata },
    });
    logger.debug('Analytics event recorded', { metricType, metadata });
  } catch (error) {
    logger.warn('Failed to record analytics', { metricType, error: String(error) });
  }
}
```

### 3. Created `test-analytics.js` Test Script

A comprehensive test script that:
- ✅ Logs in as admin
- ✅ Fetches analytics for a given period (day/week/month)
- ✅ Displays formatted summary with totals
- ✅ Shows daily metrics table
- ✅ Displays top categories with bar charts
- ✅ Shows model usage percentages
- ✅ Includes raw JSON for debugging

## Response Structure

### Before (Broken)
```json
{
  "success": true,
  "data": {
    "aiEvents": [
      { "metricType": "ai_invocation", "timestamp": "..." },
      ...
    ],
    "cacheEvents": [
      { "metricType": "cache_hit", "timestamp": "..." },
      ...
    ],
    "from": "2026-07-23T...",
    "to": "2026-07-30T..."
  }
}
```

### After (Fixed)
```json
{
  "success": true,
  "data": {
    "period": "week",
    "metrics": [
      {
        "date": "2026-07-24",
        "messages": 45,
        "cacheHits": 12,
        "aiCalls": 33
      },
      {
        "date": "2026-07-25",
        "messages": 67,
        "cacheHits": 23,
        "aiCalls": 44
      }
    ],
    "topCategories": [
      { "category": "admissions", "count": 34 },
      { "category": "registration", "count": 28 },
      { "category": "tuition", "count": 19 },
      { "category": "exams", "count": 15 },
      { "category": "general", "count": 12 }
    ],
    "modelUsage": [
      { "model": "amazon.nova-lite-v1:0", "count": 45 },
      { "model": "anthropic.claude-3-5-sonnet-20241022-v2:0", "count": 22 }
    ]
  }
}
```

## What the Frontend Displays

### Summary Cards
- **Total Messages**: Sum of all messages in the period
- **Cache Hits**: Number of cache hits (instant responses)
- **AI Calls**: Number of calls to Bedrock models
- **Cache Hit Rate**: Percentage of messages served from cache

### Message Volume Chart
- Bar chart showing messages per day
- Visual representation of usage patterns
- Helps identify peak usage times

### Top Question Categories
- Top 5 categories by volume
- Shows what topics students ask about most
- Colored bars with counts

### AI Model Usage
- Breakdown of Nova Lite vs Claude usage
- Percentage and count for each model
- Shows cost optimization (Nova is cheaper)

### Detailed Metrics Table
- Daily breakdown with all metrics
- Color-coded cache hit rates:
  - 🟢 Green: ≥70% (excellent)
  - 🟡 Yellow: 40-69% (moderate)
  - 🔴 Red: <40% (poor)

## Testing Instructions

### Method 1: Use the Web UI (Easiest)

1. **Wait for deployment** (GitHub Actions should complete in ~5-10 minutes)

2. **Navigate to analytics page**
   - Go to https://dev.dwfkamikpgffo.amplifyapp.com/admin
   - Log in with admin credentials
   - Click "View analytics" button

3. **Interact with the dashboard**
   - Toggle between "Today", "This week", "This month"
   - View the summary cards, charts, and tables
   - Check that data loads without errors

### Method 2: Use the Test Script

```bash
# Test with week period (default)
node test-analytics.js admin@test.com Admin123! week

# Test with day period
node test-analytics.js admin@test.com Admin123! day

# Test with month period
node test-analytics.js admin@test.com Admin123! month
```

**Expected output:**
```
📊 Analytics Test
═══════════════════════════════════════════════════
API Base: https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev
Admin: admin@test.com
Period: week

1️⃣  Logging in as admin@test.com...
✅ Login successful
   User: Admin User
   Role: admin

2️⃣  Fetching analytics for period: week...
   Response status: 200

✅ Analytics retrieved successfully!

📊 SUMMARY
═══════════════════════════════════════════════════
Period: week
Total Messages:   112
Cache Hits:       35
AI Calls:         77
Cache Hit Rate:   31%

📈 DAILY METRICS
═══════════════════════════════════════════════════
Date       | Messages | Cache Hits | AI Calls | Rate
-----------|----------|------------|----------|-----
2026-07-24 | 45       | 12         | 33       | 27%
2026-07-25 | 67       | 23         | 44       | 34%

🏆 TOP CATEGORIES
═══════════════════════════════════════════════════
1. admissions            34 █████████████████
2. registration          28 ██████████████
3. tuition               19 █████████
4. exams                 15 ███████
5. general               12 ██████

🤖 MODEL USAGE
═══════════════════════════════════════════════════
amazon.nova-lite-v1:0                     45 ( 58%) █████████████████████████████
anthropic.claude-3-5-sonnet-20241022-v2:0 22 ( 42%) █████████████████████

✅ Test completed successfully!
```

### Method 3: Use cURL

```bash
# Login
TOKEN=$(curl -s -X POST https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.data.tokens.idToken')

# Get week analytics
curl -X GET "https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/analytics?period=week" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# Get day analytics
curl -X GET "https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/analytics?period=day" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

## What If There's No Data?

If you see empty arrays or zeros, it means:
1. **No analytics events have been recorded yet** - Users need to send messages to the chatbot
2. **Analytics events are outside the time range** - Try a longer period (month)
3. **DynamoDB analytics table is empty** - Check table exists and has correct name

### Generate Test Data

To generate analytics data for testing:

1. **Send chat messages**
   - Go to https://dev.dwfkamikpgffo.amplifyapp.com/chat
   - Log in as a student
   - Ask several questions (admissions, registration, tuition topics)
   - Each question generates analytics events

2. **Wait a moment**
   - Analytics are written asynchronously
   - Usually available within seconds

3. **Refresh analytics page**
   - New data should appear immediately

## Debugging

### Check CloudWatch Logs

```bash
# Get analytics Lambda logs
aws logs tail /aws/lambda/aisss-dev-admin-analytics --follow

# Look for these log messages
# ✅ "Analytics request received"
# ✅ "Querying analytics data"
# ✅ "Analytics events retrieved"
# ✅ "Analytics aggregation complete"
```

### Check DynamoDB Table

```bash
# Scan the analytics table
aws dynamodb scan \
  --table-name aisss-dev-analytics \
  --limit 10

# Query specific metric type
aws dynamodb query \
  --table-name aisss-dev-analytics \
  --key-condition-expression "metricType = :type" \
  --expression-attribute-values '{":type":{"S":"ai_invocation"}}'
```

### Verify Table Exists

```bash
# List all tables
aws dynamodb list-tables | grep analytics

# Describe the table
aws dynamodb describe-table --table-name aisss-dev-analytics
```

## Common Errors

### Error: "Failed to load analytics data"
**Cause**: Lambda timeout, DynamoDB throttling, or table doesn't exist  
**Solution**: Check CloudWatch logs, verify table name in Lambda env vars

### Empty Data (All Zeros)
**Cause**: No chat messages have been sent yet  
**Solution**: Send test messages through the chat interface

### Wrong Date Range
**Cause**: Analytics events exist but outside the queried time range  
**Solution**: Try different periods (day → week → month)

### Missing Categories or Models
**Cause**: Older analytics events don't have metadata.category or metadata.model  
**Solution**: Code now includes these fields, new events will have them

## Deployment Status

✅ **Code committed** to `dev` branch (commit `08a2145`)  
✅ **Pushed to GitHub** - Deployment pipeline triggered  
⏳ **GitHub Actions deploying** (check https://github.com/sethamedonu/AI-Powered-Student-Support-System/actions)  
⏳ **Backend Lambda will be updated automatically**  

Once deployment completes (~5-10 minutes), the analytics page will work!

## Summary

**What was broken:**
- ❌ Backend returned raw events instead of aggregated metrics
- ❌ Frontend expected structured data (metrics, topCategories, modelUsage)
- ❌ Analytics events missing category/model metadata
- ❌ No logging to debug issues

**What was fixed:**
- ✅ Lambda now aggregates data by date
- ✅ Calculates daily messages, cache hits, AI calls
- ✅ Aggregates top 5 categories by count
- ✅ Aggregates model usage with percentages
- ✅ Includes category/model in all analytics events
- ✅ Added comprehensive logging
- ✅ Created test script for manual verification

**Expected behavior after deployment:**
- Analytics page loads without errors ✅
- Summary cards show correct totals ✅
- Daily metrics chart displays data ✅
- Top categories list shows popular topics ✅
- Model usage shows Nova/Claude breakdown ✅
- Data updates when toggling periods ✅
