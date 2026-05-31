import type { Cookies } from '@sveltejs/kit';

const TOKEN_COOKIE = 'access_token';
const TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

export function getToken(cookies: Cookies): string | undefined {
    return cookies.get(TOKEN_COOKIE);
}

export function setToken(cookies: Cookies, token: string): void {
    cookies.set(TOKEN_COOKIE, token, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: TOKEN_MAX_AGE
    });
}

export function deleteToken(cookies: Cookies): void {
    cookies.delete(TOKEN_COOKIE, { path: '/' });
}
