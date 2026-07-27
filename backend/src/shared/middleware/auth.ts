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
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`,
      audience: env.COGNITO_CLIENT_ID,
    });

    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
    const role: UserRole = groups.includes('Administrators') ? 'admin' : 'student';

    return {
      userId: payload['sub'] as string,
      email: payload['email'] as string,
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
