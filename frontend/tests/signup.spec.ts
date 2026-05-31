import { expect, test } from '@playwright/test';
import { randomEmail, randomName, randomPassword } from './utils/random';

test.use({ storageState: { cookies: [], origins: [] } });

test('Sign up page inputs are visible', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('full-name-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
});

test('Sign up with matching passwords navigates to login', async ({ page }) => {
    const email = randomEmail();
    const password = randomPassword();

    await page.goto('/signup');
    await page.getByTestId('full-name-input').fill(randomName());
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('confirm-password-input').fill(password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
});
