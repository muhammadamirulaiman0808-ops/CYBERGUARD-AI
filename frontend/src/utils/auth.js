// Session storage. The token and username keys are the same ones the first version used.

const TOKEN_KEY = "token";
const USER_KEY = "username";

export const UNAUTHORIZED_EVENT = "cyberguard:unauthorized";

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getToken() {
  return read(TOKEN_KEY);
}

export function getUsername() {
  return read(USER_KEY);
}

export function saveSession(token, username) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
  } catch {
    // Storage can be blocked (private mode). The session then lasts until the page closes.
  }
}

export function updateStoredUsername(username) {
  try {
    localStorage.setItem(USER_KEY, username);
  } catch {
    // ignore
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

// Reads the "exp" claim (in milliseconds) from a JWT without verifying it. The server is the
// real authority; this only lets the app log out politely instead of waiting for a 401.
export function getTokenExpiry(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  const expiry = getTokenExpiry(token);
  return expiry === null || expiry > Date.now();
}
