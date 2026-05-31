import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Users } from '$lib/api/sdk.gen';
import { getToken } from '$lib/auth';

export const load: PageServerLoad = async ({ cookies }) => {
    const token = getToken(cookies);

    const response = await Users.usersReadUserMe({
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    return {
        user: response.data
    };
};

export const actions: Actions = {
    update_profile: async ({ request, cookies }) => {
        const token = getToken(cookies);
        const data = await request.formData();
        const full_name = data.get('full_name')?.toString();
        const email = data.get('email')?.toString();

        if (!full_name || !email) {
            return fail(400, { profileError: 'Full name and email are required' });
        }

        try {
            await Users.usersUpdateUserMe({
                body: { full_name, email },
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            return fail(400, { profileError: 'Failed to update profile' });
        }

        return { profileSuccess: true };
    },

    change_password: async ({ request, cookies }) => {
        const token = getToken(cookies);
        const data = await request.formData();
        const current_password = data.get('current_password')?.toString();
        const new_password = data.get('new_password')?.toString();
        const confirm_password = data.get('confirm_password')?.toString();

        if (!current_password || !new_password || !confirm_password) {
            return fail(400, { passwordError: 'All fields are required' });
        }

        if (new_password !== confirm_password) {
            return fail(400, { passwordError: 'Passwords do not match' });
        }

        try {
            await Users.usersUpdatePasswordMe({
                body: { current_password, new_password },
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            return fail(400, { passwordError: 'Failed to change password' });
        }

        return { passwordSuccess: true };
    },

    delete_account: async ({ cookies }) => {
        const token = getToken(cookies);
        try {
            await Users.usersDeleteUserMe({
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            return fail(400, { deleteError: 'Failed to delete account' });
        }

        cookies.delete('access_token', { path: '/' });
        throw redirect(303, '/login');
    },

    logout: async ({ cookies }) => {
        cookies.delete('access_token', { path: '/' });
        throw redirect(303, '/login');
    }
};
