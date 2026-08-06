/**
 * Test script for analytics functionality
 * 
 * Usage:
 *   node test-analytics.js <adminEmail> <adminPassword> [period]
 * 
 * Example:
 *   node test-analytics.js admin@test.com Admin123! week
 */

const API_BASE = process.env.API_URL || 'https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev';

async function login(email, password) {
  console.log(`\n1️⃣  Logging in as ${email}...`);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Login failed: ${data.error?.message || 'Unknown error'}`);
  }

  console.log('✅ Login successful');
  console.log(`   User: ${data.data.user.givenName} ${data.data.user.familyName}`);
  console.log(`   Role: ${data.data.user.role}`);
  
  return data.data.tokens.idToken;
}

async function getAnalytics(token, period = 'week') {
  console.log(`\n2️⃣  Fetching analytics for period: ${period}...`);
  
  const res = await fetch(`${API_BASE}/admin/analytics?period=${period}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  console.log(`   Response status: ${res.status}`);

  const data = await res.json();
  
  if (!res.ok || !data.success) {
    console.error('\n❌ Failed to fetch analytics!');
    console.error('   Error code:', data.error?.code);
    console.error('   Error message:', data.error?.message);
    console.error('   Full response:', JSON.stringify(data, null, 2));
    throw new Error(`Failed to fetch analytics: ${data.error?.message || 'Unknown error'}`);
  }

  return data.data;
}

function displayAnalytics(analytics) {
  console.log('\n✅ Analytics retrieved successfully!\n');
  
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Period: ${analytics.period}`);
  
  const totalMessages = analytics.metrics.reduce((s, r) => s + r.messages, 0);
  const totalCacheHits = analytics.metrics.reduce((s, r) => s + r.cacheHits, 0);
  const totalAiCalls = analytics.metrics.reduce((s, r) => s + r.aiCalls, 0);
  const cacheRate = totalMessages > 0 ? Math.round((totalCacheHits / totalMessages) * 100) : 0;
  
  console.log(`Total Messages:   ${totalMessages}`);
  console.log(`Cache Hits:       ${totalCacheHits}`);
  console.log(`AI Calls:         ${totalAiCalls}`);
  console.log(`Cache Hit Rate:   ${cacheRate}%`);
  
  console.log('\n📈 DAILY METRICS');
  console.log('═══════════════════════════════════════════════════');
  console.log('Date       | Messages | Cache Hits | AI Calls | Rate');
  console.log('-----------|----------|------------|----------|-----');
  
  if (analytics.metrics.length === 0) {
    console.log('(No data for this period)');
  } else {
    analytics.metrics.forEach(row => {
      const rate = row.messages > 0 ? Math.round((row.cacheHits / row.messages) * 100) : 0;
      console.log(
        `${row.date} | ${String(row.messages).padEnd(8)} | ${String(row.cacheHits).padEnd(10)} | ${String(row.aiCalls).padEnd(8)} | ${rate}%`
      );
    });
  }
  
  console.log('\n🏆 TOP CATEGORIES');
  console.log('═══════════════════════════════════════════════════');
  if (analytics.topCategories.length === 0) {
    console.log('(No categories tracked yet)');
  } else {
    analytics.topCategories.forEach((cat, i) => {
      const bar = '█'.repeat(Math.ceil(cat.count / 2));
      console.log(`${i + 1}. ${cat.category.padEnd(20)} ${String(cat.count).padStart(4)} ${bar}`);
    });
  }
  
  console.log('\n🤖 MODEL USAGE');
  console.log('═══════════════════════════════════════════════════');
  if (analytics.modelUsage.length === 0) {
    console.log('(No model usage tracked yet)');
  } else {
    const totalModelCalls = analytics.modelUsage.reduce((s, m) => s + m.count, 0);
    analytics.modelUsage.forEach(model => {
      const pct = Math.round((model.count / totalModelCalls) * 100);
      const bar = '█'.repeat(Math.ceil(pct / 2));
      console.log(`${model.model.padEnd(40)} ${String(model.count).padStart(4)} (${String(pct).padStart(3)}%) ${bar}`);
    });
  }
  
  console.log('\n💾 RAW DATA SAMPLE');
  console.log('═══════════════════════════════════════════════════');
  console.log(JSON.stringify(analytics, null, 2));
}

async function main() {
  const [adminEmail, adminPassword, period = 'week'] = process.argv.slice(2);

  if (!adminEmail || !adminPassword) {
    console.error('Usage: node test-analytics.js <adminEmail> <adminPassword> [period]');
    console.error('Example: node test-analytics.js admin@test.com Admin123! week');
    console.error('\nPeriod options: day, week, month');
    process.exit(1);
  }

  if (!['day', 'week', 'month'].includes(period)) {
    console.error('Error: period must be "day", "week", or "month"');
    process.exit(1);
  }

  console.log('📊 Analytics Test');
  console.log('═══════════════════════════════════════════════════');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Admin: ${adminEmail}`);
  console.log(`Period: ${period}`);

  try {
    const token = await login(adminEmail, adminPassword);
    const analytics = await getAnalytics(token, period);
    displayAnalytics(analytics);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
