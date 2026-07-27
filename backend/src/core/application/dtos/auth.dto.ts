import { z } from 'zod';

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  givenName: z.string().min(1).max(100),
  familyName: z.string().min(1).max(100),
  studentId: z.string().max(50).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

// ─── Response Types ───────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResult {
  userId: string;
  email: string;
  message: string;
}

export interface LoginResult {
  tokens: AuthTokens;
  user: {
    userId: string;
    email: string;
    givenName: string;
    familyName: string;
    role: string;
  };
}
