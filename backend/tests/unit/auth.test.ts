import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/core/application/services/AuthService.js';
import type { IUserRepository, IAuditRepository } from '../../src/core/domain/repositories/index.js';
import type { User } from '../../src/core/domain/entities/User.js';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../src/shared/errors/index.js';

// ─── Shared mock send fn ──────────────────────────────────────────────────────
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: vi.fn().mockImplementation(() => ({ send: mockSend })),
  SignUpCommand: vi.fn(),
  ConfirmSignUpCommand: vi.fn(),
  InitiateAuthCommand: vi.fn(),
  ForgotPasswordCommand: vi.fn(),
  ConfirmForgotPasswordCommand: vi.fn(),
  AdminAddUserToGroupCommand: vi.fn(),
  AdminGetUserCommand: vi.fn(),
  GetUserCommand: vi.fn(),
  AuthFlowType: {
    USER_PASSWORD_AUTH: 'USER_PASSWORD_AUTH',
    REFRESH_TOKEN_AUTH: 'REFRESH_TOKEN_AUTH',
  },
}));

const mockUser: User = {
  userId: 'user-123',
  email: 'student@test.com',
  givenName: 'John',
  familyName: 'Doe',
  role: 'student',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockUserRepo: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

const mockAuditRepo: IAuditRepository = {
  log: vi.fn(),
  listByUser: vi.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(mockUserRepo, mockAuditRepo);
  });

  // ─── register ───────────────────────────────────────────────────────────────
  describe('register', () => {
    it('registers a new user successfully', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepo.create).mockResolvedValue(mockUser);
      mockSend.mockResolvedValue({ UserSub: 'user-123' });

      const result = await service.register({
        email: 'student@test.com',
        password: 'Password1!',
        givenName: 'John',
        familyName: 'Doe',
      });

      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('student@test.com');
      expect(mockUserRepo.create).toHaveBeenCalledOnce();
      expect(mockAuditRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_REGISTERED' }),
      );
    });

    it('throws ConflictError if email already exists in DynamoDB', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'student@test.com',
          password: 'Password1!',
          givenName: 'John',
          familyName: 'Doe',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError on Cognito UsernameExistsException', async () => {
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(null);
      mockSend.mockRejectedValue(new Error('UsernameExistsException'));

      await expect(
        service.register({
          email: 'student@test.com',
          password: 'Password1!',
          givenName: 'John',
          familyName: 'Doe',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  // ─── verifyEmail ─────────────────────────────────────────────────────────────
  describe('verifyEmail', () => {
    it('verifies email successfully', async () => {
      mockSend.mockResolvedValue({});
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);

      const result = await service.verifyEmail({ email: 'student@test.com', code: '123456' });

      expect(result.message).toContain('verified');
      expect(mockAuditRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'EMAIL_VERIFIED' }),
      );
    });

    it('throws ValidationError on CodeMismatchException', async () => {
      mockSend.mockRejectedValue(new Error('CodeMismatchException'));

      await expect(
        service.verifyEmail({ email: 'student@test.com', code: '000000' }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError on ExpiredCodeException', async () => {
      mockSend.mockRejectedValue(new Error('ExpiredCodeException'));

      await expect(
        service.verifyEmail({ email: 'student@test.com', code: '123456' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('logs in successfully and returns tokens + user', async () => {
      mockSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
        },
      });
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);

      const result = await service.login({ email: 'student@test.com', password: 'Password1!' });

      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.user.email).toBe('student@test.com');
      expect(result.user.role).toBe('student');
      expect(mockAuditRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_LOGIN' }),
      );
    });

    it('throws UnauthorizedError on NotAuthorizedException', async () => {
      mockSend.mockRejectedValue(new Error('NotAuthorizedException'));

      await expect(
        service.login({ email: 'student@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws ValidationError when user is not confirmed', async () => {
      mockSend.mockRejectedValue(new Error('UserNotConfirmedException'));

      await expect(
        service.login({ email: 'student@test.com', password: 'Password1!' }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws UnauthorizedError when user account is inactive', async () => {
      mockSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
        },
      });
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login({ email: 'student@test.com', password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  // ─── forgotPassword ──────────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('always returns success message (prevents email enumeration)', async () => {
      mockSend.mockRejectedValue(new Error('UserNotFoundException'));

      const result = await service.forgotPassword({ email: 'unknown@test.com' });
      expect(result.message).toContain('If an account exists');
    });

    it('returns success when Cognito call succeeds', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.forgotPassword({ email: 'student@test.com' });
      expect(result.message).toContain('If an account exists');
    });
  });

  // ─── resetPassword ───────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      mockSend.mockResolvedValue({});
      vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(mockUser);

      const result = await service.resetPassword({
        email: 'student@test.com',
        code: '123456',
        newPassword: 'NewPassword1!',
      });

      expect(result.message).toContain('reset successfully');
      expect(mockAuditRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET' }),
      );
    });

    it('throws ValidationError on CodeMismatchException', async () => {
      mockSend.mockRejectedValue(new Error('CodeMismatchException'));

      await expect(
        service.resetPassword({
          email: 'student@test.com',
          code: '000000',
          newPassword: 'NewPassword1!',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─── refreshTokens ───────────────────────────────────────────────────────────
  describe('refreshTokens', () => {
    it('refreshes tokens successfully', async () => {
      mockSend.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
        },
      });

      const result = await service.refreshTokens({ refreshToken: 'valid-refresh-token' });

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('valid-refresh-token');
    });

    it('throws UnauthorizedError on invalid refresh token', async () => {
      mockSend.mockRejectedValue(new Error('NotAuthorizedException'));

      await expect(
        service.refreshTokens({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
