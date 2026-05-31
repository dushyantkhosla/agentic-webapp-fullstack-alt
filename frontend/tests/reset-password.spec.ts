import { expect, test } from '@playwright/test';

test('Reset password page redirects without token', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
});

test('Reset password page loads with token', async ({ page }) => {
    await page.goto('/reset-password?token=test-token');
    await expect(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
    await expect(page.getByTestId('new-password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
});
