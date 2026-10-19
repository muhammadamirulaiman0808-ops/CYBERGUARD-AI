import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./authState";
import {
  UNAUTHORIZED_EVENT,
  clearSession,
  getToken,
  getTokenExpiry,
  getUsername,
  isTokenValid,
  saveSession,
  updateStoredUsername,
} from "../utils/auth";

const SIGNED_OUT = { token: null, username: null };

function initialSession() {
  const token = getToken();
  if (!isTokenValid(token)) {
    clearSession();
    return SIGNED_OUT;
  }
  return { token, username: getUsername() || "" };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(initialSession);

  const login = useCallback((token, username) => {
    saveSession(token, username);
    setSession({ token, username });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(SIGNED_OUT);
  }, []);

  const setUsername = useCallback((username) => {
    updateStoredUsername(username);
    setSession((current) => ({ ...current, username }));
  }, []);

  // The API layer fires this event when the server answers 401.
  useEffect(() => {
    const onUnauthorized = () => {
      setSession(SIGNED_OUT);
      toast("Your session expired. Log in again to continue.", { id: "session-expired" });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Log out at the moment the token runs out, instead of at the next failed request.
  useEffect(() => {
    if (!session.token) return undefined;
    const expiry = getTokenExpiry(session.token);
    if (!expiry) return undefined;

    const timer = setTimeout(() => {
      clearSession();
      setSession(SIGNED_OUT);
      toast("Your session expired. Log in again to continue.", { id: "session-expired" });
    }, Math.max(expiry - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [session.token]);

  const value = useMemo(
    () => ({
      user: session.token ? { username: session.username } : null,
      login,
      logout,
      setUsername,
    }),
    [session, login, logout, setUsername],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
