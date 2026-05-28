// src/utils/apiResponse.js
// Centralized API response utilities.
// These work alongside the axios interceptors in api.js.

/**
 * Safely extracts `.data.result` from a successful Axios response.
 * Returns null if not present.
 */
export function unwrapResult(response) {
  return response?.data?.result ?? null;
}

/**
 * Extracts a human-readable error message from an Axios error.
 * Priority: response.data.errors[] > response.data.message > error.message > fallback
 *
 * @param {Error} error - Axios error object
 * @param {string} fallback - default message
 * @returns {string}
 */
export function getErrorMessage(error, fallback = 'An unexpected error occurred.') {
  if (!error) return fallback;

  // Axios HTTP error
  const data = error.response?.data;
  if (data) {
    if (Array.isArray(data.errors) && data.errors.length > 0) return data.errors.join(', ');
    if (data.message) return data.message;
  }

  // Network or other errors
  return error.message || fallback;
}

/**
 * Returns true if the response indicates success.
 * Handles both explicit `success: true` and 2xx-only responses.
 */
export function isSuccess(response) {
  if (!response) return false;
  const data = response.data;
  if (data && typeof data.success === 'boolean') return data.success;
  return response.status >= 200 && response.status < 300;
}

/**
 * Wraps an async API call and returns { data, error }.
 * Caller doesn't need try/catch.
 *
 * @example
 * const { data, error } = await safeCall(() => UserManagementService.fetchUserList());
 * if (error) toast.error(error);
 */
export async function safeCall(fn, fallback = null) {
  try {
    const response = await fn();
    return { data: response, error: null };
  } catch (err) {
    return { data: fallback, error: getErrorMessage(err) };
  }
}
