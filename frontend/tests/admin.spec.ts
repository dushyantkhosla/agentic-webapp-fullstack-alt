import { expect, test } from '@playwright/test';

test('Admin page loads for superuser', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByText('Manage user accounts and permissions')).toBeVisible();
});
