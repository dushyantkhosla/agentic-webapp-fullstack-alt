import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { Login } from '$lib/api/sdk.gen';

export const actions: Actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();

        if (!email) {
            return fail(400, { error: 'Email is required' });
        }

        try {
            await Login.loginRecoverPassword({ body: { email } });
        } catch {
            return fail(400, { error: 'Failed to send recovery email' });
        }

        return { success: true };
    }
};
