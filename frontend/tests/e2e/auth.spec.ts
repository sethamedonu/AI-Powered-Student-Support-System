import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'student@test.com';
const TEST_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'TestPass123!';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('wrong@test.com');
    await page.getByLabel(/password/i).fill('WrongPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('register shows validation for weak password', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel(/first name/i).fill('Jane');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('jane@test.com');
    await page.getByLabel(/password/i).fill('weak');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('forgot password page renders correctly', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset/i })).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login');
    const link = page.getByRole('link', { name: /sign up|register|create account/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/register/);
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });
});
