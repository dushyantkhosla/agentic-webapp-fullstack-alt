import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const PUBLIC_ROUTES = ['/login', '/signup', '/recover-password', '/reset-password'];

export const load: LayoutServerLoad = async ({ url, locals }) => {
    // Only redirect to /login if on a protected route with no user
    if (!locals.user && !PUBLIC_ROUTES.includes(url.pathname)) {
        throw redirect(302, '/login');
    }

    // Redirect away from auth pages if already logged in
    if (locals.user && PUBLIC_ROUTES.includes(url.pathname)) {
        throw redirect(302, '/');
    }

    return {
        user: locals.user
    };
};
