import { expect, test } from '@playwright/test';

test('Settings page loads with tabs', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'User Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My profile' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Danger zone' })).toBeVisible();
});
