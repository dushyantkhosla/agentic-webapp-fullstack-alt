import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Login } from '$lib/api/sdk.gen';

export const load: PageServerLoad = async ({ url }) => {
    const token = url.searchParams.get('token');
    if (!token) {
        throw redirect(302, '/login');
    }
    return { token };
};

export const actions: Actions = {
    default: async ({ request, url }) => {
        const token = url.searchParams.get('token');
        if (!token) {
            return fail(400, { error: 'Missing reset token' });
        }

        const data = await request.formData();
        const new_password = data.get('new_password')?.toString();
        const confirm_password = data.get('confirm_password')?.toString();

        if (!new_password || !confirm_password) {
            return fail(400, { error: 'All fields are required' });
        }

        if (new_password !== confirm_password) {
            return fail(400, { error: 'Passwords do not match' });
        }

        if (new_password.length < 8) {
            return fail(400, { error: 'Password must be at least 8 characters' });
        }

        try {
            await Login.loginResetPassword({
                body: { new_password, token }
            });
        } catch {
            return fail(400, { error: 'Failed to reset password' });
        }

        throw redirect(303, '/login');
    }
};
