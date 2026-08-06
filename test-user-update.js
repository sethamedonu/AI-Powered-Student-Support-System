/**
 * Test script for user promote/demote functionality
 * 
 * Usage:
 *   node test-user-update.js <adminEmail> <adminPassword> <targetUserId> <newRole>
 * 
 * Example:
 *   node test-user-update.js admin@test.com Admin123! user-123-456 admin
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
  console.log(`   ID Token: ${data.data.tokens.idToken.substring(0, 50)}...`);
  
  return data.data.tokens.idToken;
}

async function getUserDetails(token, userId) {
  console.log(`\n2️⃣  Fetching current user details...`);
  
  // Get user from the list of users
  const res = await fetch(`${API_BASE}/admin/users?limit=100`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Failed to fetch users: ${data.error?.message || 'Unknown error'}`);
  }

  const user = data.data.items.find(u => u.userId === userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  console.log('✅ User found:');
  console.log(`   Name: ${user.givenName} ${user.familyName}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Current Role: ${user.role}`);
  console.log(`   Active: ${user.isActive}`);
  
  return user;
}

async function updateUserRole(token, userId, newRole) {
  console.log(`\n3️⃣  Updating user role to "${newRole}"...`);
  
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ role: newRole }),
  });

  console.log(`   Response status: ${res.status}`);
  console.log(`   Response headers:`, Object.fromEntries(res.headers.entries()));

  const data = await res.json();
  
  if (!res.ok || !data.success) {
    console.error('\n❌ Update failed!');
    console.error('   Error code:', data.error?.code);
    console.error('   Error message:', data.error?.message);
    console.error('   Full response:', JSON.stringify(data, null, 2));
    throw new Error(`Update failed: ${data.error?.message || 'Unknown error'}`);
  }

  console.log('✅ User updated successfully:');
  console.log(`   Name: ${data.data.givenName} ${data.data.familyName}`);
  console.log(`   New Role: ${data.data.role}`);
  console.log(`   Updated At: ${data.data.updatedAt}`);
  
  return data.data;
}

async function verifyUpdate(token, userId, expectedRole) {
  console.log(`\n4️⃣  Verifying update...`);
  
  const user = await getUserDetails(token, userId);
  
  if (user.role === expectedRole) {
    console.log(`✅ Verification passed! Role is now "${expectedRole}"`);
    return true;
  } else {
    console.log(`❌ Verification failed! Expected "${expectedRole}" but got "${user.role}"`);
    return false;
  }
}

async function main() {
  const [adminEmail, adminPassword, targetUserId, newRole] = process.argv.slice(2);

  if (!adminEmail || !adminPassword || !targetUserId || !newRole) {
    console.error('Usage: node test-user-update.js <adminEmail> <adminPassword> <targetUserId> <newRole>');
    console.error('Example: node test-user-update.js admin@test.com Admin123! user-123-456 admin');
    process.exit(1);
  }

  if (!['student', 'admin'].includes(newRole)) {
    console.error('Error: newRole must be either "student" or "admin"');
    process.exit(1);
  }

  console.log('🔧 User Role Update Test');
  console.log('========================');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Admin: ${adminEmail}`);
  console.log(`Target User: ${targetUserId}`);
  console.log(`New Role: ${newRole}`);

  try {
    const token = await login(adminEmail, adminPassword);
    const currentUser = await getUserDetails(token, targetUserId);
    
    if (currentUser.role === newRole) {
      console.log(`\n⚠️  User already has role "${newRole}". No update needed.`);
      console.log('   Test completed successfully (no-op).');
      return;
    }

    const updatedUser = await updateUserRole(token, targetUserId, newRole);
    await verifyUpdate(token, targetUserId, newRole);

    console.log('\n✅ Test completed successfully!');
    console.log(`   ${currentUser.role} → ${updatedUser.role}`);

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
