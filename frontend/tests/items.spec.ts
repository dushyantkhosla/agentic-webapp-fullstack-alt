import { expect, test } from '@playwright/test';

test('Items page loads', async ({ page }) => {
    await page.goto('/items');
    await expect(page.getByText('Create and manage your items')).toBeVisible();
});

test('Items page shows empty state when no items', async ({ page }) => {
    await page.goto('/items');
    await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
});
