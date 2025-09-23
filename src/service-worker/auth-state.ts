/**
 * Shared auth state for service worker modules
 * Avoids circular dependencies and dynamic imports
 */

let authToken: string | null = null;

export const getAuthToken = (): string | null => authToken;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const isAuthenticated = (): boolean => !!authToken;
