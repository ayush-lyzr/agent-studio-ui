import { jwtDecode } from 'jwt-decode';

/**
 * Decodes a JWT token and returns its payload
 * Note: This does NOT verify the signature - use only for reading token data
 * @param token - The JWT token string
 * @returns The decoded payload object
 * @throws Error if token is invalid or cannot be decoded
 */
export function decodeJWT<T = Record<string, any>>(token: string): T {
  return jwtDecode<T>(token);
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token string
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJWT<{ exp?: number }>(token);

    if (!payload.exp) {
      return false; // No expiration claim
    }

    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // If we can't decode it, consider it expired
  }
}

/**
 * Gets the expiration date from a JWT token
 * @param token - The JWT token string
 * @returns Date object representing expiration time, or null if no exp claim
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = decodeJWT<{ exp?: number }>(token);

    if (!payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Gets the time remaining until token expiration
 * @param token - The JWT token string
 * @returns Number of milliseconds until expiration, or null if no exp claim or already expired
 */
export function getTokenTimeRemaining(token: string): number | null {
  const expiration = getTokenExpiration(token);

  if (!expiration) {
    return null;
  }

  const remaining = expiration.getTime() - Date.now();
  return remaining > 0 ? remaining : null;
}
