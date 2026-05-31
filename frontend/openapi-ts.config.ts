import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: './openapi.json',
    output: {
        path: './src/lib/api'
    },
    plugins: [
        '@hey-api/client-fetch',
        {
            name: '@hey-api/sdk',
            operations: { strategy: 'byTags', nesting: 'operationId' }
        },
        {
            name: 'zod',
            output: './src/lib/schemas/zod'
        }
    ]
});
