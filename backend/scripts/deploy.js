const { LambdaClient, UpdateFunctionCodeCommand } = require('@aws-sdk/client-lambda');
const path = require('path');
const fs = require('fs');

const ENVIRONMENT = process.argv[2] ?? 'dev';
const APP_NAME = 'aisss';
const REGION = process.env['AWS_REGION'] ?? 'us-east-1';

const FUNCTIONS = [
  'health',
  'auth-register',
  'auth-login',
  'auth-verify',
  'auth-forgot-password',
  'auth-reset-password',
  'auth-refresh',
  'chat-send',
  'chat-process',
  'conversations-list',
  'conversations-get',
  'conversations-delete',
  'feedback-submit',
  'analytics-get',
  'admin-users-list',
  'admin-users-update',
  'admin-knowledge-upsert',
];

const lambda = new LambdaClient({ region: REGION });
const distDir = path.join(__dirname, '..', 'dist');

async function deployFunction(name) {
  const functionName = `${APP_NAME}-${ENVIRONMENT}-${name}`;
  const zipPath = path.join(distDir, `${name}.zip`);

  if (!fs.existsSync(zipPath)) {
    console.warn(`⚠️  Skipping ${functionName} — zip not found at ${zipPath}`);
    return;
  }

  const zipBuffer = fs.readFileSync(zipPath);

  await lambda.send(
    new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer,
      Publish: true,
    }),
  );

  console.log(`✅ Deployed: ${functionName}`);
}

async function main() {
  console.log(`\n🚀 Deploying ${FUNCTIONS.length} Lambda functions to [${ENVIRONMENT}]...\n`);

  for (const fn of FUNCTIONS) {
    await deployFunction(fn);
  }

  console.log(`\n✅ All functions deployed to [${ENVIRONMENT}].\n`);
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
