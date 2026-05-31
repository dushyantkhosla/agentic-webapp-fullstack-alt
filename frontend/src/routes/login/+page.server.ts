import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { Login } from '$lib/api/sdk.gen';
import { setToken } from '$lib/auth';

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();
        const password = data.get('password')?.toString();

        if (!email || !password) {
            return fail(400, { email, error: 'Email and password are required' });
        }

        try {
            const response = await Login.loginLoginAccessToken({
                body: {
                    username: email,
                    password
                }
            });
            setToken(cookies, response.data.access_token);
        } catch {
            return fail(400, { email, error: 'Incorrect email or password' });
        }

        throw redirect(303, '/');
    }
};
