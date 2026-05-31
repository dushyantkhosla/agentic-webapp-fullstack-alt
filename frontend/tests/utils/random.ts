export function randomPassword(): string {
    return `Pass${Math.random().toString(36).slice(2)}!`;
}

export function randomEmail(): string {
    return `test-${Math.random().toString(36).slice(2, 10)}@example.com`;
}

export function randomName(): string {
    return `User ${Math.random().toString(36).slice(2, 8)}`;
}
