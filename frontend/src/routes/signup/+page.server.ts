import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { Users } from '$lib/api/sdk.gen';

export const actions: Actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();
        const full_name = data.get('full_name')?.toString();
        const password = data.get('password')?.toString();
        const confirm_password = data.get('confirm_password')?.toString();

        if (!email || !full_name || !password || !confirm_password) {
            return fail(400, { email, full_name, error: 'All fields are required' });
        }

        if (password !== confirm_password) {
            return fail(400, { email, full_name, error: 'Passwords do not match' });
        }

        if (password.length < 8) {
            return fail(400, { email, full_name, error: 'Password must be at least 8 characters' });
        }

        try {
            await Users.usersRegisterUser({
                body: { email, full_name, password }
            });
        } catch (e: any) {
            const detail = e?.body?.detail ?? 'Registration failed';
            return fail(400, { email, full_name, error: detail });
        }

        throw redirect(303, '/login');
    }
};
