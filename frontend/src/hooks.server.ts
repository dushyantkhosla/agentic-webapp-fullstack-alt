import type { Handle } from '@sveltejs/kit';
import { getToken } from '$lib/auth';

const BACKEND_URL = import.meta.env.PUBLIC_API_URL || 'http://backend:8000';

export const handle: Handle = async ({ event, resolve }) => {
    const token = getToken(event.cookies);

    if (token) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                event.locals.user = await response.json();
            } else {
                event.locals.user = null;
            }
        } catch {
            // Backend unreachable — continue without user
            event.locals.user = null;
        }
    } else {
        event.locals.user = null;
    }

    return resolve(event);
};
