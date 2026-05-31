import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { Users } from '$lib/api/sdk.gen';
import { getToken } from '$lib/auth';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    const token = getToken(cookies);

    if (!locals.user?.is_superuser) {
        throw redirect(302, '/');
    }

    const response = await Users.usersReadUsers({
        query: { skip: 0, limit: 100 },
        headers: { Authorization: `Bearer ${token}` }
    });

    return {
        users: response.data
    };
};
