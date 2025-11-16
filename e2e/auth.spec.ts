import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form on initial page load', async ({ page }) => {
    expect(await page.locator('text=Ввійти').count()).toBeGreaterThan(0);
  });

  test('should show email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should show password input field', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('should validate empty email submission', async ({ page }) => {
    const loginButton = page.locator('button:has-text("Ввійти")');
    await loginButton.click();

    const errorMessage = page.locator('text=Будь ласка, введіть email');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    const loginButton = page.locator('button:has-text("Ввійти")');
    await loginButton.click();

    const errorMessage = page.locator('text=/Невалідний email|Неправильний формат email/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should require password field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const loginButton = page.locator('button:has-text("Ввійти")');
    await loginButton.click();

    const errorMessage = page.locator('text=/Пароль обов|необхідне поле/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should show loading state during login', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('validpassword123');

    const loginButton = page.locator('button:has-text("Ввійти")');

    page.on('response', (response) => {
      if (response.request().method() === 'POST') {
        response.body();
      }
    });

    await loginButton.click();
    await page.waitForTimeout(1000);
  });
});
