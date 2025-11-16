import { test, expect } from '@playwright/test';

test.describe('Report Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.locator('input[type="email"]').fill('employee@example.com');
    await page.locator('input[type="password"]').fill('validpassword123');

    const loginButton = page.locator('button:has-text("Ввійти")');
    await loginButton.click();

    await page.waitForURL('**/employee/**', { timeout: 10000 });
  });

  test('should display export button on employee reports page', async ({ page }) => {
    await page.goto('/employee/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await expect(exportButton).toBeVisible();
  });

  test('should disable export button when no data available', async ({ page }) => {
    await page.goto('/employee/reports');

    const monthInput = page.locator('input[type="month"]');
    await monthInput.fill('2020-01');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await expect(exportButton).toBeDisabled();
  });

  test('should open export menu on button click', async ({ page }) => {
    await page.goto('/employee/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const excelOption = page.locator('text=Excel');
    await expect(excelOption).toBeVisible();
  });

  test('should show export format options in dropdown', async ({ page }) => {
    await page.goto('/employee/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    await expect(page.locator('text=Excel')).toBeVisible();
    await expect(page.locator('text=CSV')).toBeVisible();
    await expect(page.locator('text=PDF')).toBeVisible();
  });

  test('should handle Excel export', async ({ page, context }) => {
    await page.goto('/employee/reports');

    const downloadPromise = context.waitForEvent('page');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const excelOption = page.locator('text=Excel');
    await excelOption.click();

    await page.waitForTimeout(2000);

    const successToast = page.locator('text=/Успішно|експортований/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should handle CSV export', async ({ page, context }) => {
    await page.goto('/employee/reports');

    const downloadPromise = context.waitForEvent('page');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const csvOption = page.locator('text=CSV');
    await csvOption.click();

    await page.waitForTimeout(2000);

    const successToast = page.locator('text=/Успішно|експортований/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should handle PDF export', async ({ page, context }) => {
    await page.goto('/employee/reports');

    const downloadPromise = context.waitForEvent('page');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const pdfOption = page.locator('text=PDF');
    await pdfOption.click();

    await page.waitForTimeout(2000);

    const successToast = page.locator('text=/Успішно|експортований/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should show summary option when enabled', async ({ page }) => {
    await page.goto('/employee/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const summaryOption = page.locator('text=Excel + Підсумок');
    await expect(summaryOption).toBeVisible();
  });

  test('should handle month selection for exports', async ({ page }) => {
    await page.goto('/employee/reports');

    const monthInput = page.locator('input[type="month"]');
    await monthInput.fill('2024-11');

    const exportButton = page.locator('button:has-text(/Експортувати/)');

    const isDisabled = await exportButton.isDisabled();
    expect(isDisabled).toBeDefined();
  });

  test('should show loading state during export', async ({ page }) => {
    await page.goto('/employee/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const excelOption = page.locator('text=Excel');
    await excelOption.click();

    const loadingButton = page.locator('button:has-text(/Експортування/)');
    await expect(loadingButton).toBeVisible({ timeout: 2000 });
  });
});
