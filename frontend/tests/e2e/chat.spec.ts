import { test, expect, type Page } from '@playwright/test';

const TEST_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'student@test.com';
const TEST_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'TestPass123!';

async function login(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard renders welcome message and chat link', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /new chat|start chat/i })).toBeVisible();
  });

  test('navigating to chat shows message input', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByPlaceholder(/ask a question|type your message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    await page.goto('/chat');
    const sendBtn = page.getByRole('button', { name: /send/i });
    await expect(sendBtn).toBeDisabled();
  });

  test('typing a message enables the send button', async ({ page }) => {
    await page.goto('/chat');
    const input = page.getByPlaceholder(/ask a question|type your message/i);
    await input.fill('What are the tuition fees?');
    await expect(page.getByRole('button', { name: /send/i })).toBeEnabled();
  });

  test('sending a message shows user message in chat', async ({ page }) => {
    await page.goto('/chat');
    const input = page.getByPlaceholder(/ask a question|type your message/i);
    await input.fill('What are the admission requirements?');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText('What are the admission requirements?')).toBeVisible();
  });

  test('AI response appears after sending message', async ({ page }) => {
    await page.goto('/chat');
    const input = page.getByPlaceholder(/ask a question|type your message/i);
    await input.fill('What are the tuition fees?');
    await page.getByRole('button', { name: /send/i }).click();
    // Wait for typing indicator to disappear and response to appear
    await expect(page.locator('[data-role="assistant"]').first()).toBeVisible({ timeout: 30000 });
  });

  test('conversations list shows previous chats', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page.getByRole('heading', { name: /conversations/i })).toBeVisible();
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: /chat/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /conversations/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
  });
});
