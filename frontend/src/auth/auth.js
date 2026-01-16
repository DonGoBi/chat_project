// src/auth/auth.js

// A simple auth utility to simulate JWT handling.
// In a real app, this would be more complex, interacting with localStorage
// and possibly decoding the token.

const TOKEN_KEY = 'jwt_token';

/**
 * Checks if the user is authenticated.
 * For now, this will always return false to test the protected route.
 * Later, it will check for a valid token in localStorage.
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  // Returns true if token exists, false otherwise.
  // The `!!` operator converts a value to a boolean.
  return !!token;
};

/**
 * Stores the token after login. We will use this later.
 * @param {string} token The JWT token from the server.
 */
export const login = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Removes the token on logout. We will use this later.
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        logout();
        window.location.href = '/login';
        throw new Error("Unauthorized");
    }

    return response;
};
