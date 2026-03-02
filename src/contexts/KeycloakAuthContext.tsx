import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { env } from '@/lib/env';
import { useManageAdminStore } from '@/pages/manage-admin/manage-admin.store';
import { pagosAxiosInstance } from '@/lib/axios';

interface KeycloakAuthContextType {
    authenticated: boolean;
    loading: boolean;
    initialized: boolean;
    token: string | null;
    refreshToken: string | null;
    userInfo: any;
    login: (idpHint?: string) => void;
    logout: () => void;
    getToken: () => string | null;
    refreshAccessToken: () => Promise<string | null>;
}

const KeycloakAuthContext = createContext<KeycloakAuthContextType>({
    authenticated: false,
    loading: true,
    initialized: false,
    token: null,
    refreshToken: null,
    userInfo: null,
    login: () => {},
    logout: () => {},
    getToken: () => null,
    refreshAccessToken: async () => null,
});

export const useKeycloakAuth = () => useContext(KeycloakAuthContext);

interface KeycloakAuthProviderProps {
    children: React.ReactNode;
}

// Token storage keys
const TOKEN_KEY = 'kc_token';
const REFRESH_TOKEN_KEY = 'kc_refresh_token';
const USER_INFO_KEY = 'kc_user_info';

export function KeycloakAuthProvider({ children }: KeycloakAuthProviderProps) {
    const renderCount = useRef(0);
    renderCount.current += 1;
    console.log('[KeycloakAuthProvider] RENDER #', renderCount.current);

    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);

    const initRef = useRef(false);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Store Zustand setters in refs to prevent re-render chains
    const setCurrentUserRef = useRef(useManageAdminStore.getState().setCurrentUser);

    // Update ref when setter changes (shouldn't happen with Zustand, but just in case)
    useEffect(() => {
        setCurrentUserRef.current = useManageAdminStore.getState().setCurrentUser;
    }, []);

    // Track mount/unmount
    useEffect(() => {
        console.log('[KeycloakAuthProvider] MOUNTED');
        return () => {
            console.log('[KeycloakAuthProvider] UNMOUNTED');
        };
    }, []);

    // Keycloak configuration - memoized to prevent re-creation
    const config = React.useMemo(() => {
        const keycloakUrl = env.VITE_KEYCLOAK_URL || "http://localhost:8080";
        const realm = env.VITE_KEYCLOAK_REALM || "lyzr-dev";
        const clientId = env.VITE_KEYCLOAK_CLIENT_ID || 'spa';

        return {
            keycloakUrl,
            realm,
            clientId,
            authEndpoint: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`,
            tokenEndpoint: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
            logoutEndpoint: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`,
        };
    }, []);

    // Parse JWT token to get user info and expiration
    const parseJwt = useCallback((token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Failed to parse JWT:', e);
            return null;
        }
    }, []);

    // Save tokens to storage
    const saveTokens = useCallback((accessToken: string, refreshTokenValue: string) => {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
        setToken(accessToken);
        setRefreshToken(refreshTokenValue);

        const tokenData = parseJwt(accessToken);
        if (tokenData) {
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(tokenData));
            setUserInfo(tokenData);
        }
    }, [parseJwt]);

    // Clear tokens from storage
    const clearTokens = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_INFO_KEY);
        setToken(null);
        setRefreshToken(null);
        setUserInfo(null);
        setAuthenticated(false);

        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    // Refresh access token
    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!storedRefreshToken) {
            console.log('No refresh token available');
            return null;
        }

        try {
            console.log('Refreshing access token...');
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: config.clientId,
                refresh_token: storedRefreshToken,
            });

            const response = await fetch(config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            saveTokens(data.access_token, data.refresh_token);
            console.log('Token refreshed successfully');
            return data.access_token;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            clearTokens();
            return null;
        }
    }, [config, saveTokens, clearTokens]);

    // Setup automatic token refresh
    const setupTokenRefresh = useCallback((accessToken: string) => {
        const tokenData = parseJwt(accessToken);
        if (!tokenData || !tokenData.exp) {
            return;
        }

        // Calculate time until token expires (refresh 1 minute before expiry)
        const expiresIn = tokenData.exp * 1000 - Date.now() - 60000;

        if (expiresIn > 0) {
            console.log(`Token will be refreshed in ${Math.floor(expiresIn / 1000)} seconds`);
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
            refreshTimerRef.current = setTimeout(() => {
                refreshAccessToken();
            }, expiresIn);
        } else {
            // Token already expired, refresh immediately
            refreshAccessToken();
        }
    }, [parseJwt, refreshAccessToken]);

    // Login function
    const login = useCallback((idpHint?: string) => {
        const redirectUri = window.location.origin + '/auth/callback';
        const state = Math.random().toString(36).substring(7);
        const nonce = Math.random().toString(36).substring(7);

        // Store state and nonce for verification
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_nonce', nonce);

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid profile email',
            state: state,
            nonce: nonce,
        });

        if (idpHint) {
            params.append('kc_idp_hint', idpHint);
        }

        const authUrl = `${config.authEndpoint}?${params.toString()}`;
        console.log('Redirecting to Keycloak login:', authUrl);
        window.location.href = authUrl;
    }, [config]);

    // Logout function
    const logout = useCallback(() => {
        const redirectUri = window.location.origin + '/auth/sign-in';
        const params = new URLSearchParams({
            post_logout_redirect_uri: redirectUri,
        });

        clearTokens();

        const logoutUrl = `${config.logoutEndpoint}?${params.toString()}`;
        console.log('Redirecting to Keycloak logout:', logoutUrl);
        window.location.href = logoutUrl;
    }, [config, clearTokens]);

    // Get current token
    const getToken = useCallback(() => {
        return token;
    }, [token]);

    // Exchange authorization code for tokens
    const exchangeCodeForTokens = useCallback(async (code: string) => {
        try {
            const redirectUri = window.location.origin + '/auth/callback';
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: config.clientId,
                code: code,
                redirect_uri: redirectUri,
            });

            const response = await fetch(config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                throw new Error('Token exchange failed');
            }

            const data = await response.json();
            saveTokens(data.access_token, data.refresh_token);
            setupTokenRefresh(data.access_token);
            setAuthenticated(true);

            return data.access_token;
        } catch (error) {
            console.error('Failed to exchange code for tokens:', error);
            throw error;
        }
    }, [config, saveTokens, setupTokenRefresh]);

    // Fetch user data from backend
    const fetchUserData = useCallback(async (accessToken: string) => {
        try {
            // Fetch user from keycloak backend
            const response = await pagosAxiosInstance.get('/keycloak/user', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            return null;
        }
    }, []); // No dependencies - stable function

    // Handle OAuth callback
    const handleCallback = useCallback(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = sessionStorage.getItem('oauth_state');

        if (!code) {
            return false;
        }

        // Verify state to prevent CSRF
        if (state !== storedState) {
            console.error('State mismatch - possible CSRF attack');
            return false;
        }

        try {
            const accessToken = await exchangeCodeForTokens(code);
            const userData = await fetchUserData(accessToken);

            if (userData) {
                setCurrentUserRef.current(userData);
                console.log('User authenticated and set:', userData);
            }

            // Clear OAuth session storage
            sessionStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_nonce');

            return true;
        } catch (error) {
            console.error('Failed to handle callback:', error);
            return false;
        }
    }, [exchangeCodeForTokens, fetchUserData]);

    // Initialize authentication
    useEffect(() => {
        if (initRef.current) {
            console.log('KeycloakAuth already initialized, skipping');
            return;
        }

        initRef.current = true;
        console.log('Initializing KeycloakAuth...');

        const initAuth = async () => {
            try {
                // Check if this is a callback from Keycloak
                if (window.location.pathname === '/auth/callback') {
                    const success = await handleCallback();
                    if (success) {
                        setInitialized(true);
                        setLoading(false);
                        // Redirect to home after successful login
                        window.location.replace('/');
                        return;
                    }
                }

                // Check for existing tokens
                const storedToken = localStorage.getItem(TOKEN_KEY);
                const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
                const storedUserInfo = localStorage.getItem(USER_INFO_KEY);

                if (storedToken && storedRefreshToken) {
                    console.log('Found existing tokens');

                    // Verify token is not expired
                    const tokenData = parseJwt(storedToken);
                    const isExpired = tokenData && tokenData.exp * 1000 < Date.now();

                    if (isExpired) {
                        console.log('Token expired, refreshing...');
                        const newToken = await refreshAccessToken();
                        if (newToken) {
                            setAuthenticated(true);
                            setupTokenRefresh(newToken);
                        }
                    } else {
                        console.log('Token is valid');
                        setToken(storedToken);
                        setRefreshToken(storedRefreshToken);
                        if (storedUserInfo) {
                            setUserInfo(JSON.parse(storedUserInfo));
                        }
                        setAuthenticated(true);
                        setupTokenRefresh(storedToken);
                    }
                } else {
                    console.log('No existing tokens found');
                }

                setInitialized(true);
            } catch (error) {
                console.error('KeycloakAuth initialization failed:', error);
                clearTokens();
                setInitialized(true);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Cleanup on unmount
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [handleCallback, parseJwt, refreshAccessToken, setupTokenRefresh, clearTokens]);

    const value: KeycloakAuthContextType = {
        authenticated,
        loading,
        initialized,
        token,
        refreshToken,
        userInfo,
        login,
        logout,
        getToken,
        refreshAccessToken,
    };

    return (
        <KeycloakAuthContext.Provider value={value}>
            {children}
        </KeycloakAuthContext.Provider>
    );
}
