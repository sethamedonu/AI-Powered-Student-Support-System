/**
 * Debug script to test user update and document upload
 */

const API_BASE = 'https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev';

async function login() {
  console.log('\n🔐 Logging in as admin...');
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'Admin123!' }),
    });

    const data = await res.json();
    console.log(`   Response status: ${res.status}`);
    console.log(`   Response data:`, JSON.stringify(data, null, 2));

    if (!res.ok || !data.success) {
      throw new Error(`Login failed: ${data.error?.message || JSON.stringify(data)}`);
    }

    console.log('✅ Login successful');
    return data.data.tokens.idToken;
  } catch (err) {
    console.error('   Login error:', err.message);
    throw err;
  }
}

async function listUsers(token) {
  console.log('\n📋 Fetching users...');
  const res = await fetch(`${API_BASE}/admin/users?limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Failed to fetch users: ${data.error?.message}`);
  }

  console.log(`Found ${data.data.items.length} users:\n`);
  data.data.items.forEach((u, i) => {
    console.log(`${i + 1}. ${u.givenName} ${u.familyName}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Role: ${u.role}`);
    console.log(`   User ID: ${u.userId}\n`);
  });

  return data.data.items;
}

async function testUserUpdate(token, userId, newRole) {
  console.log(`\n🔄 Testing PATCH /admin/users/${userId}`);
  console.log(`   Changing role to: ${newRole}`);

  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ role: newRole }),
  });

  console.log(`   Response status: ${res.status} ${res.statusText}`);
  console.log(`   Response headers:`, Object.fromEntries(res.headers.entries()));

  const text = await res.text();
  console.log(`   Response body:`, text);

  try {
    const data = JSON.parse(text);
    if (res.ok && data.success) {
      console.log('✅ Update successful!');
      console.log(`   New role: ${data.data.role}`);
      return data.data;
    } else {
      console.log('❌ Update failed!');
      console.log(`   Error code: ${data.error?.code}`);
      console.log(`   Error message: ${data.error?.message}`);
      return null;
    }
  } catch (e) {
    console.log('❌ Failed to parse response as JSON');
    return null;
  }
}

async function testDocumentUpload(token) {
  console.log('\n📄 Testing document upload flow...');
  
  // Step 1: Request upload URL
  console.log('\n1️⃣  Requesting pre-signed URL...');
  const uploadRes = await fetch(`${API_BASE}/admin/documents/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: 'test-document.pdf',
      contentType: 'application/pdf',
      folder: 'uploads',
    }),
  });

  console.log(`   Status: ${uploadRes.status} ${uploadRes.statusText}`);
  
  const uploadData = await uploadRes.json();
  
  if (!uploadRes.ok || !uploadData.success) {
    console.log('❌ Failed to get upload URL');
    console.log(`   Error: ${uploadData.error?.message}`);
    return;
  }

  console.log('✅ Upload URL received');
  console.log(`   Bucket: ${uploadData.data.bucket}`);
  console.log(`   S3 Key: ${uploadData.data.s3Key}`);
  console.log(`   Upload URL: ${uploadData.data.uploadUrl.substring(0, 80)}...`);

  // Step 2: Test upload with small dummy file
  console.log('\n2️⃣  Testing file upload to S3...');
  const dummyPdfContent = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');
  
  try {
    const s3Res = await fetch(uploadData.data.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: dummyPdfContent,
    });

    console.log(`   S3 Response status: ${s3Res.status} ${s3Res.statusText}`);
    console.log(`   S3 Response headers:`, Object.fromEntries(s3Res.headers.entries()));

    if (s3Res.ok) {
      console.log('✅ File uploaded successfully to S3!');
    } else {
      console.log('❌ S3 upload failed');
      const errorText = await s3Res.text();
      console.log(`   Error response: ${errorText}`);
    }
  } catch (err) {
    console.log('❌ Network error during S3 upload');
    console.log(`   Error: ${err.message}`);
    console.log(`   Stack: ${err.stack}`);
  }
}

async function main() {
  console.log('🧪 Debug Script for User Update & Document Upload');
  console.log('═══════════════════════════════════════════════════');

  try {
    const token = await login();
    const users = await listUsers(token);

    if (users.length > 0) {
      // Find a non-admin user to promote
      const student = users.find(u => u.role === 'student');
      if (student) {
        console.log(`\n🎯 Testing promote functionality with user: ${student.email}`);
        await testUserUpdate(token, student.userId, 'admin');
        
        // Try to demote back
        console.log(`\n🎯 Testing demote functionality...`);
        await testUserUpdate(token, student.userId, 'student');
      } else {
        console.log('\n⚠️  No student users found to test promote functionality');
      }
    }

    // Test document upload
    await testDocumentUpload(token);

    console.log('\n✅ Debug script completed!');
  } catch (error) {
    console.error('\n❌ Script failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
