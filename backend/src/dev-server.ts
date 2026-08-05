/**
 * Local development server — routes HTTP requests to Lambda handlers directly.
 * Replaces SAM Local. Run with: npx ts-node --esm src/dev-server.ts
 */
import http from 'http';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createLogger } from './shared/utils/logger.js';

const logger = createLogger('dev-server');

// ─── Import all handlers ──────────────────────────────────────────────────────
import { handler as health } from './functions/health/index.js';
import { handler as authRegister } from './functions/auth/register.js';
import { handler as authLogin } from './functions/auth/login.js';
import { handler as authVerify } from './functions/auth/verify.js';
import { handler as authForgot } from './functions/auth/forgotPassword.js';
import { handler as authReset } from './functions/auth/resetPassword.js';
import { handler as authRefresh } from './functions/auth/refresh.js';
import { handler as chatSend } from './functions/chat/sendMessage.js';
import { handler as convList } from './functions/conversations/list.js';
import { handler as convGet } from './functions/conversations/get.js';
import { handler as convDelete } from './functions/conversations/delete.js';
import { handler as feedbackSubmit } from './functions/feedback/submit.js';
import { handler as analyticsGet } from './functions/analytics/get.js';
import { handler as adminStats } from './functions/admin/getStats.js';
import { handler as adminAnalytics } from './functions/admin/getAnalytics.js';
import { handler as adminUsersList } from './functions/admin/listUsers.js';
import { handler as adminUsersUpdate } from './functions/admin/updateUser.js';
import { handler as adminFeedbackList } from './functions/admin/listFeedback.js';
import { handler as adminKnowledge } from './functions/admin/upsertKnowledge.js';

type LambdaHandler = (event: APIGatewayProxyEvent, ctx: Context) => Promise<APIGatewayProxyResult>;

// ─── Route table: [method, path-pattern, handler, paramMap] ──────────────────
const routes: [string, RegExp, LambdaHandler, Record<string, number>][] = [
  ['GET',    /^\/health$/,                         health,            {}],
  ['POST',   /^\/auth\/register$/,                 authRegister,      {}],
  ['POST',   /^\/auth\/login$/,                    authLogin,         {}],
  ['POST',   /^\/auth\/verify$/,                   authVerify,        {}],
  ['POST',   /^\/auth\/forgot-password$/,          authForgot,        {}],
  ['POST',   /^\/auth\/reset-password$/,           authReset,         {}],
  ['POST',   /^\/auth\/refresh$/,                  authRefresh,       {}],
  ['POST',   /^\/chat\/send$/,                   chatSend,          {}],
  ['GET',    /^\/conversations$/,                  convList,          {}],
  ['GET',    /^\/conversations\/([^/]+)$/,         convGet,           { conversationId: 1 }],
  ['DELETE', /^\/conversations\/([^/]+)$/,         convDelete,        { conversationId: 1 }],
  ['POST',   /^\/feedback$/,                       feedbackSubmit,    {}],
  ['GET',    /^\/analytics$/,                      analyticsGet,      {}],
  ['GET',    /^\/admin\/stats$/,                   adminStats,        {}],
  ['GET',    /^\/admin\/analytics$/,               adminAnalytics,    {}],
  ['GET',    /^\/admin\/users$/,                   adminUsersList,    {}],
  ['PUT',    /^\/admin\/users\/([^/]+)$/,          adminUsersUpdate,  { userId: 1 }],
  ['GET',    /^\/admin\/feedback$/,                adminFeedbackList, {}],
  ['POST',   /^\/admin\/knowledge$/,               adminKnowledge,    {}],
  ['PUT',    /^\/admin\/knowledge$/,               adminKnowledge,    {}],
];

function makeContext(path: string): Context {
  return {
    awsRequestId: `local-${Date.now()}`,
    functionName: `local-${path.replace(/\//g, '-').slice(1) || 'root'}`,
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:local:000000000000:function:local',
    memoryLimitInMB: '512',
    logGroupName: '/aws/lambda/local',
    logStreamName: 'local',
    getRemainingTimeInMillis: () => 30000,
    done: (): void => {},
    fail: (): void => {},
    succeed: (): void => {},
    callbackWaitsForEmptyEventLoop: false,
  };
}

function buildEvent(
  req: http.IncomingMessage,
  body: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
): APIGatewayProxyEvent {
  return {
    httpMethod: req.method ?? 'GET',
    path: req.url?.split('?')[0] ?? '/',
    headers: req.headers as Record<string, string>,
    multiValueHeaders: {},
    queryStringParameters: Object.keys(queryParams).length ? queryParams : null,
    multiValueQueryStringParameters: null,
    pathParameters: Object.keys(pathParams).length ? pathParams : null,
    stageVariables: null,
    requestContext: {
      identity: { sourceIp: '127.0.0.1' },
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
    body: body || null,
    isBase64Encoded: false,
  };
}

const PORT = Number(process.env['PORT'] ?? 3000);

const server = http.createServer((req, res) => {
  const rawPath = req.url?.split('?')[0] ?? '/';
  const rawQuery = req.url?.includes('?') ? req.url.split('?')[1] : '';
  const queryParams: Record<string, string> = {};
  if (rawQuery) {
    new URLSearchParams(rawQuery).forEach((v, k) => { queryParams[k] = v; });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk: unknown) => { body += String(chunk); });
  req.on('end', (): void => {
    void (async (): Promise<void> => {
      let matched: LambdaHandler | null = null;
      let pathParams: Record<string, string> = {};

      for (const [method, pattern, handler, paramMap] of routes) {
        if (req.method !== method) continue;
        const m = rawPath.match(pattern);
        if (!m) continue;
        matched = handler;
        for (const [name, idx] of Object.entries(paramMap)) {
          pathParams[name] = m[idx] ?? '';
        }
        break;
      }

      if (!matched) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: `No route: ${req.method} ${rawPath}` } }));
        return;
      }

      try {
        const event = buildEvent(req, body, pathParams, queryParams);
        const ctx = makeContext(rawPath);
        const result = await matched(event, ctx);
        const headers = { 'Content-Type': 'application/json', ...result.headers };
        res.writeHead(result.statusCode, headers);
        res.end(result.body);
      } catch (err) {
        logger.error('Dev server error', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unhandled server error' } }));
      }
    })();
  });
});

server.listen(PORT, '0.0.0.0', (): void => {
  console.warn(`\n🚀 AISSS dev server running at http://0.0.0.0:${PORT}\n`);
  console.warn('Routes:');
  routes.forEach(([method, pattern]) => console.warn(`  ${method.padEnd(7)} ${String(pattern)}`));
  console.warn('');
});
