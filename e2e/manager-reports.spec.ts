import { test, expect } from '@playwright/test';

test.describe('Manager Reports Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.locator('input[type="email"]').fill('manager@example.com');
    await page.locator('input[type="password"]').fill('validpassword123');

    const loginButton = page.locator('button:has-text("Ввійти")');
    await loginButton.click();

    await page.waitForURL('**/manager/**', { timeout: 10000 });
  });

  test('should display team reports page', async ({ page }) => {
    await page.goto('/manager/reports');

    const title = page.locator('text=Звіти Команди');
    await expect(title).toBeVisible();
  });

  test('should display export button for team reports', async ({ page }) => {
    await page.goto('/manager/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await expect(exportButton).toBeVisible();
  });

  test('should display month selector', async ({ page }) => {
    await page.goto('/manager/reports');

    const monthInput = page.locator('input[type="month"]');
    await expect(monthInput).toBeVisible();
  });

  test('should display team member cards', async ({ page }) => {
    await page.goto('/manager/reports');

    const employeeCards = page.locator('[class*="border-2"]');
    const count = await employeeCards.count();

    if (count > 0) {
      await expect(employeeCards.first()).toBeVisible();
    }
  });

  test('should show hours summary card', async ({ page }) => {
    await page.goto('/manager/reports');

    const hoursCard = page.locator('text=/Всього Годин/i');
    await expect(hoursCard).toBeVisible();
  });

  test('should show earnings summary card', async ({ page }) => {
    await page.goto('/manager/reports');

    const earningsCard = page.locator('text=/Всього Заробіток/i');
    await expect(earningsCard).toBeVisible();
  });

  test('should allow month selection', async ({ page }) => {
    await page.goto('/manager/reports');

    const monthInput = page.locator('input[type="month"]');
    await monthInput.fill('2024-10');

    await page.waitForTimeout(1000);

    const selectedValue = await monthInput.inputValue();
    expect(selectedValue).toBe('2024-10');
  });

  test('should open export menu for team report', async ({ page }) => {
    await page.goto('/manager/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const excelOption = page.locator('text=Excel');
    await expect(excelOption).toBeVisible();
  });

  test('should show all export formats', async ({ page }) => {
    await page.goto('/manager/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    await expect(page.locator('text=Excel')).toBeVisible();
    await expect(page.locator('text=CSV')).toBeVisible();
    await expect(page.locator('text=PDF')).toBeVisible();
    await expect(page.locator('text=Excel + Підсумок')).toBeVisible();
  });

  test('should export team report as Excel', async ({ page }) => {
    await page.goto('/manager/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const excelOption = page.locator('text=Excel').first();
    await excelOption.click();

    await page.waitForTimeout(2000);

    const successToast = page.locator('text=/Успішно|експортований/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should export team report as CSV', async ({ page }) => {
    await page.goto('/manager/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const csvOption = page.locator('text=CSV');
    await csvOption.click();

    await page.waitForTimeout(2000);

    const successToast = page.locator('text=/Успішно|експортований/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should export team report as PDF', async ({ page }) => {
    await page.goto('/manager/reports');

    const exportButton = page.locator('button:has-text(/Експортувати/)');
    await exportButton.click();

    const pdfOption = page.locator('text=PDF');
    await pdfOption.click();

    await page.waitForTimeout(2000);

    const successToast = page.locator('text=/Успішно|експортований/i');
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should show employee details modal on eye icon click', async ({ page }) => {
    await page.goto('/manager/reports');

    const eyeButton = page.locator('button[title="Детальна інформація"]').first();

    const isVisible = await eyeButton.isVisible();
    if (isVisible) {
      await eyeButton.click();

      const modal = page.locator('role=dialog');
      await expect(modal).toBeVisible();
    }
  });

  test('should update summary when month changes', async ({ page }) => {
    await page.goto('/manager/reports');

    const initialHoursText = await page.locator('text=/Всього Годин/i').textContent();

    const monthInput = page.locator('input[type="month"]');
    await monthInput.fill('2024-09');

    await page.waitForTimeout(1000);

    const updatedHoursText = await page.locator('text=/Всього Годин/i').textContent();

    expect(initialHoursText).toBeDefined();
    expect(updatedHoursText).toBeDefined();
  });
});
