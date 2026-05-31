import type { PageServerLoad } from './$types';
import { Items } from '$lib/api/sdk.gen';
import { getToken } from '$lib/auth';

export const load: PageServerLoad = async ({ cookies }) => {
    const token = getToken(cookies);

    const response = await Items.itemsReadItems({
        query: { skip: 0, limit: 100 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    return {
        items: response.data
    };
};
