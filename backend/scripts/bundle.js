const { build } = require('esbuild');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FUNCTIONS = [
  { name: 'health', entry: 'src/functions/health/index.ts' },
  { name: 'auth-register', entry: 'src/functions/auth/register.ts' },
  { name: 'auth-login', entry: 'src/functions/auth/login.ts' },
  { name: 'auth-verify', entry: 'src/functions/auth/verify.ts' },
  { name: 'auth-forgot-password', entry: 'src/functions/auth/forgotPassword.ts' },
  { name: 'auth-reset-password', entry: 'src/functions/auth/resetPassword.ts' },
  { name: 'auth-refresh', entry: 'src/functions/auth/refresh.ts' },
  { name: 'chat-send', entry: 'src/functions/chat/send.ts' },
  { name: 'chat-process', entry: 'src/functions/chat/process.ts' },
  { name: 'conversations-list', entry: 'src/functions/conversations/list.ts' },
  { name: 'conversations-get', entry: 'src/functions/conversations/get.ts' },
  { name: 'conversations-delete', entry: 'src/functions/conversations/delete.ts' },
  { name: 'feedback-submit', entry: 'src/functions/feedback/submit.ts' },
  { name: 'analytics-get', entry: 'src/functions/analytics/get.ts' },
  { name: 'admin-users-list', entry: 'src/functions/admin/listUsers.ts' },
  { name: 'admin-users-update', entry: 'src/functions/admin/updateUser.ts' },
  { name: 'admin-knowledge-upsert', entry: 'src/functions/admin/upsertKnowledge.ts' },
];

const outDir = path.join(__dirname, '..', 'dist');

async function bundleFunction(fn) {
  const outfile = path.join(outDir, fn.name, 'index.js');

  await build({
    entryPoints: [path.join(__dirname, '..', fn.entry)],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outfile,
    external: [],
    sourcemap: false,
    treeShaking: true,
    logLevel: 'warning',
  });

  // Zip the bundle
  const zipPath = path.join(outDir, `${fn.name}.zip`);
  execSync(`cd "${path.join(outDir, fn.name)}" && zip -r "${zipPath}" .`);

  console.log(`✅ Bundled: ${fn.name} → ${zipPath}`);
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n📦 Bundling ${FUNCTIONS.length} Lambda functions...\n`);

  await Promise.all(FUNCTIONS.map(bundleFunction));

  console.log('\n✅ All functions bundled successfully.\n');
}

main().catch((err) => {
  console.error('Bundle failed:', err);
  process.exit(1);
});
