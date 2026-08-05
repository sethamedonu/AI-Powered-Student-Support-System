import type { APIGatewayProxyEvent } from 'aws-lambda';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthContext, UserRole } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import { env } from '../types/env.js';

const JWKS_URL = `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export async function extractAuthContext(event: APIGatewayProxyEvent): Promise<AuthContext> {
  const authHeader =
    event.headers['Authorization'] ?? event.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);

  try {
    // API Gateway Cognito Authorizer passes through the ID token (has aud = client_id).
    // We also support access tokens for flexibility (e.g. direct Lambda testing).
    // Detect token type from the unverified payload and set audience accordingly.
    const tokenParts = token.split('.');
    let tokenUse = 'id';
    if (tokenParts.length === 3) {
      try {
        const rawPayload = tokenParts[1];
        const pad = 4 - (rawPayload.length % 4);
        const padded = pad !== 4 ? rawPayload + '='.repeat(pad) : rawPayload;
        const unverified = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
        tokenUse = (unverified['token_use'] as string) ?? 'id';
      } catch {
        // ignore — fall back to id token verification
      }
    }

    const verifyOptions = tokenUse === 'access'
      ? {
          issuer: `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`,
          // access tokens use client_id claim not aud — skip audience check
        }
      : {
          issuer: `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`,
          audience: env.COGNITO_CLIENT_ID,
        };

    const { payload } = await jwtVerify(token, JWKS, verifyOptions);

    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
    const role: UserRole = groups.includes('Administrators') ? 'admin' : 'student';

    // email is present in id token; for access token fall back to sub
    const email = (payload['email'] as string | undefined) ?? (payload['username'] as string | undefined) ?? '';

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
