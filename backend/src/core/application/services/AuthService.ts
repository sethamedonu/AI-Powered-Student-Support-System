import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { IUserRepository } from '../../domain/repositories/index.js';
import type { IAuditRepository } from '../../domain/repositories/index.js';
import type {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  AuthTokens,
  RegisterResult,
  LoginResult,
} from '../dtos/auth.dto.js';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
  InternalError,
} from '../../../shared/errors/index.js';
import { env } from '../../../shared/types/env.js';
import { createLogger } from '../../../shared/utils/logger.js';

const logger = createLogger('AuthService');

export class AuthService {
  private readonly cognito: CognitoIdentityProviderClient;

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly auditRepo: IAuditRepository,
  ) {
    this.cognito = new CognitoIdentityProviderClient({
      region: env.AWS_REGION,
      ...(env.COGNITO_ENDPOINT ? { endpoint: env.COGNITO_ENDPOINT } : {}),
    });
  }

  async register(dto: RegisterDto, ipAddress?: string): Promise<RegisterResult> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    let cognitoUserId: string;

    try {
      const result = await this.cognito.send(
        new SignUpCommand({
          ClientId: env.COGNITO_CLIENT_ID,
          Username: dto.email,
          Password: dto.password,
          UserAttributes: [
            { Name: 'email', Value: dto.email },
            { Name: 'given_name', Value: dto.givenName },
            { Name: 'family_name', Value: dto.familyName },
            { Name: 'custom:role', Value: 'student' },
            ...(dto.studentId ? [{ Name: 'custom:studentId', Value: dto.studentId }] : []),
          ],
        }),
      );

      cognitoUserId = result.UserSub ?? '';
      if (!cognitoUserId) throw new InternalError('Failed to retrieve user ID from Cognito');
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      const msg = error instanceof Error ? error.message : 'Registration failed';
      if (msg.includes('UsernameExistsException')) {
        throw new ConflictError('An account with this email already exists');
      }
      throw new ValidationError(msg);
    }

    // Add new student to the Students Cognito group so JWT carries the correct group claim
    try {
      await this.cognito.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID,
          Username: dto.email,
          GroupName: 'Students',
        }),
      );
    } catch (groupError) {
      // Non-fatal — log but don't fail registration
      logger.warn('Failed to add user to Students group', { email: dto.email, error: String(groupError) });
    }

    await this.userRepo.create({
      userId: cognitoUserId,
      email: dto.email,
      givenName: dto.givenName,
      familyName: dto.familyName,
      role: 'student',
      studentId: dto.studentId,
    });

    await this.auditRepo.log({
      userId: cognitoUserId,
      action: 'USER_REGISTERED',
      resource: 'user',
      resourceId: cognitoUserId,
      ipAddress,
    });

    logger.info('User registered', { userId: cognitoUserId, email: dto.email });

    return {
      userId: cognitoUserId,
      email: dto.email,
      message: 'Registration successful. Please check your email for a verification code.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    try {
      await this.cognito.send(
        new ConfirmSignUpCommand({
          ClientId: env.COGNITO_CLIENT_ID,
          Username: dto.email,
          ConfirmationCode: dto.code,
        }),
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Verification failed';
      if (msg.includes('CodeMismatchException')) {
        throw new ValidationError('Invalid verification code');
      }
      if (msg.includes('ExpiredCodeException')) {
        throw new ValidationError('Verification code has expired. Please request a new one.');
      }
      throw new ValidationError(msg);
    }

    const user = await this.userRepo.findByEmail(dto.email);
    if (user) {
      await this.auditRepo.log({
        userId: user.userId,
        action: 'EMAIL_VERIFIED',
        resource: 'user',
        resourceId: user.userId,
      });
    }

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async login(dto: LoginDto, ipAddress?: string): Promise<LoginResult> {
    let tokens: AuthTokens;

    try {
      const result = await this.cognito.send(
        new InitiateAuthCommand({
          AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
          ClientId: env.COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: dto.email,
            PASSWORD: dto.password,
          },
        }),
      );

      const auth = result.AuthenticationResult;
      if (!auth?.AccessToken || !auth.IdToken || !auth.RefreshToken) {
        throw new UnauthorizedError('Authentication failed');
      }

      tokens = {
        accessToken: auth.AccessToken,
        idToken: auth.IdToken,
        refreshToken: auth.RefreshToken,
        expiresIn: auth.ExpiresIn ?? 3600,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      const msg = error instanceof Error ? error.message : 'Login failed';
      if (
        msg.includes('NotAuthorizedException') ||
        msg.includes('UserNotFoundException')
      ) {
        throw new UnauthorizedError('Invalid email or password');
      }
      if (msg.includes('UserNotConfirmedException')) {
        throw new ValidationError('Please verify your email before logging in');
      }
      throw new UnauthorizedError('Login failed');
    }

    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new UnauthorizedError('User account not found');
    if (!user.isActive) throw new UnauthorizedError('Your account has been deactivated');

    // Derive the authoritative role from Cognito group membership.
    // This is the single source of truth — Cognito groups control access.
    // If DynamoDB is out of sync (e.g. user was added to Administrators group
    // manually in the console), we fix it here transparently.
    let authorativeRole: 'student' | 'admin' = 'student';
    try {
      const groupsResult = await this.cognito.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID,
          Username: dto.email,
        }),
      );
      const groupNames = (groupsResult.Groups ?? []).map((g) => g.GroupName ?? '');
      authorativeRole = groupNames.includes('Administrators') ? 'admin' : 'student';
    } catch (groupError) {
      // If we can't read groups, fall back to DynamoDB role — non-fatal
      logger.warn('Could not read Cognito groups, falling back to DynamoDB role', { email: dto.email, error: String(groupError) });
      authorativeRole = user.role;
    }

    // Sync DynamoDB if role has drifted from Cognito group membership
    if (user.role !== authorativeRole) {
      logger.info('Syncing DynamoDB role from Cognito groups', {
        userId: user.userId,
        oldRole: user.role,
        newRole: authorativeRole,
      });
      await this.userRepo.update(user.userId, { role: authorativeRole });
      user.role = authorativeRole;
    }

    await this.auditRepo.log({
      userId: user.userId,
      action: 'USER_LOGIN',
      resource: 'user',
      resourceId: user.userId,
      ipAddress,
    });

    logger.info('User logged in', { userId: user.userId, role: authorativeRole });

    return {
      tokens,
      user: {
        userId: user.userId,
        email: user.email,
        givenName: user.givenName,
        familyName: user.familyName,
        role: authorativeRole,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    try {
      await this.cognito.send(
        new ForgotPasswordCommand({
          ClientId: env.COGNITO_CLIENT_ID,
          Username: dto.email,
        }),
      );
    } catch {
      // Silently succeed to prevent email enumeration
    }

    return {
      message: 'If an account exists with this email, a password reset code has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      await this.cognito.send(
        new ConfirmForgotPasswordCommand({
          ClientId: env.COGNITO_CLIENT_ID,
          Username: dto.email,
          ConfirmationCode: dto.code,
          Password: dto.newPassword,
        }),
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Reset failed';
      if (msg.includes('CodeMismatchException')) {
        throw new ValidationError('Invalid reset code');
      }
      if (msg.includes('ExpiredCodeException')) {
        throw new ValidationError('Reset code has expired. Please request a new one.');
      }
      throw new ValidationError('Password reset failed');
    }

    const user = await this.userRepo.findByEmail(dto.email);
    if (user) {
      await this.auditRepo.log({
        userId: user.userId,
        action: 'PASSWORD_RESET',
        resource: 'user',
        resourceId: user.userId,
      });
    }

    return { message: 'Password reset successfully. You can now log in.' };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const result = await this.cognito.send(
        new InitiateAuthCommand({
          AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
          ClientId: env.COGNITO_CLIENT_ID,
          AuthParameters: {
            REFRESH_TOKEN: dto.refreshToken,
          },
        }),
      );

      const auth = result.AuthenticationResult;
      if (!auth?.AccessToken || !auth.IdToken) {
        throw new UnauthorizedError('Token refresh failed');
      }

      return {
        accessToken: auth.AccessToken,
        idToken: auth.IdToken,
        refreshToken: dto.refreshToken,
        expiresIn: auth.ExpiresIn ?? 3600,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}
