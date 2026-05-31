import { expect, type Page, test } from '@playwright/test';
import { firstSuperuser, firstSuperuserPassword } from './config';
import { randomPassword } from './utils/random';

test.use({ storageState: { cookies: [], origins: [] } });

const fillForm = async (page: Page, email: string, password: string) => {
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
};

test('Inputs are visible, empty and editable', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toHaveText('');
    await expect(page.getByTestId('email-input')).toBeEditable();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toHaveText('');
    await expect(page.getByTestId('password-input')).toBeEditable();
});

test('Log In button is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

test('Forgot Password link is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();
});

test('Log in with valid email and password', async ({ page }) => {
    await page.goto('/login');
    await fillForm(page, firstSuperuser, firstSuperuserPassword);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL('/');
    await expect(page.getByText('Welcome back, nice to see you again!')).toBeVisible();
});

test('Log in with invalid email', async ({ page }) => {
    await page.goto('/login');
    await fillForm(page, 'invalidemail', firstSuperuserPassword);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.getByText('Incorrect email or password')).toBeVisible();
});

test('Log in with invalid password', async ({ page }) => {
    const password = randomPassword();
    await page.goto('/login');
    await fillForm(page, firstSuperuser, password);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.getByText('Incorrect email or password')).toBeVisible();
});
