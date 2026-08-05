import type { APIGatewayProxyEvent } from 'aws-lambda';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthContext, UserRole } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import { env } from '../types/env.js';

const JWKS_URL = `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export async function extractAuthContext(event: APIGatewayProxyEvent): Promise<AuthContext> {
  // ── Path 1: API Gateway Cognito Authorizer ─────────────────────────────────
  // When a Cognito Authorizer validates the token it strips it from the
  // Authorization header and injects the decoded claims into
  // requestContext.authorizer.claims. This is the production path.
  const claims = event.requestContext?.authorizer?.claims as Record<string, string> | undefined;
  if (claims?.sub) {
    const groups = claims['cognito:groups']
      ? claims['cognito:groups'].split(',').map((g) => g.trim())
      : [];
    const role: UserRole = groups.includes('Administrators') ? 'admin' : 'student';
    return {
      userId: claims['sub'],
      email: claims['email'] ?? '',
      role,
      groups,
    };
  }

  // ── Path 2: Direct JWT verification (local dev / test-invoke without authorizer)
  // Used when calling Lambda directly or in local development where no
  // API Gateway Cognito Authorizer sits in front.
  const authHeader =
    event.headers['Authorization'] ?? event.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);

  try {
    // Detect token type from the unverified payload and set audience accordingly.
    const tokenParts = token.split('.');
    let tokenUse = 'id';
    if (tokenParts.length === 3) {
      try {
        const rawPayload = tokenParts[1] ?? '';
        const pad = 4 - (rawPayload.length % 4);
        const padded = pad !== 4 ? rawPayload + '='.repeat(pad) : rawPayload;
        const decoded = Buffer.from(padded, 'base64' as BufferEncoding).toString('utf8');
        const unverified = JSON.parse(decoded) as Record<string, unknown>;
        tokenUse = (unverified['token_use'] as string) ?? 'id';
      } catch {
        // ignore — fall back to id token verification
      }
    }

    const verifyOptions = tokenUse === 'access'
      ? {
          issuer: `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`,
        }
      : {
          issuer: `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`,
          audience: env.COGNITO_CLIENT_ID,
        };

    const { payload } = await jwtVerify(token, JWKS, verifyOptions);

    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
    const role: UserRole = groups.includes('Administrators') ? 'admin' : 'student';
    const email = (payload['email'] as string | undefined) ?? '';

    return {
      userId: payload['sub'] as string,
      email,
      role,
      groups,
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function requireRole(auth: AuthContext, ...roles: UserRole[]): void {
  if (!roles.includes(auth.role)) {
    throw new ForbiddenError(`Access restricted to: ${roles.join(', ')}`);
  }
}
