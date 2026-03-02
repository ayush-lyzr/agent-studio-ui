import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import Keycloak, { KeycloakConfig } from 'keycloak-js';
import { env } from '@/lib/env';
import { useManageAdminStore } from '@/pages/manage-admin/manage-admin.store';
import axios from '@/lib/axios';
import { useMemberstack, useAuth as useMemberstackAuth } from '@memberstack/react';
import useStore from '@/lib/store';
import { IS_ENTERPRISE_DEPLOYMENT, PAGOS_URL } from '@/lib/constants';

interface AuthContextType {
    keycloak: Keycloak | null;
    authenticated: boolean;
    isLoggedIn: boolean;
    loading: boolean;
    initialized: boolean;
    idp: 'keycloak' | 'memberstack';
    login: (idpHint: string, redirectUri?: string, loginHint?: string) => void;
    logout: () => void;
    register: () => void;
    getToken: () => string | undefined;
    getUserInfo: () => any;
    updateToken: (minValidity?: number) => Promise<boolean | undefined>;
    userId: string | null,
}

const AuthContext = createContext<AuthContextType>({
    keycloak: null,
    authenticated: false,
    isLoggedIn: false,
    loading: true,
    initialized: false,
    idp: 'memberstack',
    login: () => { },
    logout: () => { },
    register: () => { },
    getToken: () => undefined,
    getUserInfo: () => null,
    updateToken: async () => false,
    userId: null
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {

    const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [idp, setIdp] = useState<'keycloak' | 'memberstack'>('memberstack');
    const [userId, setUserId] = useState<string | null>(null);
    const setAppToken = useStore(store => store.setAppToken);
    const appToken = useStore(store => store.app_token);
    const setRefreshToken = useStore(store => store.setRefreshToken);
    const { signOut, getToken: getMemberstackToken } = useMemberstackAuth();

    const [initialized, setInitialized] = useState(false);
    const initRef = useRef(false);


    const { setCurrentUser, resetStore } = useManageAdminStore()

    // Memoize keycloak config to prevent re-creation
    const keycloakConfig: KeycloakConfig = {
        url: env.VITE_KEYCLOAK_URL || "http://localhost:8080",
        realm: env.VITE_KEYCLOAK_REALM || "lyzr-dev",
        clientId: env.VITE_KEYCLOAK_CLIENT_ID || 'spa',
    }

    const { getCurrentMember } = useMemberstack();


    // Memoize getCurrentUser function
    const getCurrentUser = useCallback(async (idp: 'keycloak' | 'memberstack', token: string) => {
        if (idp == 'memberstack') {
            const response = await getCurrentMember()
            if (response.data) {
                return response.data
            }
        }

        // fetch the user from keycloak using axios instance with PAGOS base URL
        const response = await axios.get(
            `${PAGOS_URL}keycloak/user`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        )
        return response.data
    }, [getCurrentMember]);


    useEffect(() => {
        // Prevent double initialization in React StrictMode
        if (initRef.current) {
            return;
        }

        initRef.current = true;

        const initAuth = async () => {
            try {
                // Initialize Keycloak only for enterprise deployments
                if (IS_ENTERPRISE_DEPLOYMENT) {
                    // Use environment variables if available, fallback to localhost for development
                    const keycloakInstance = new Keycloak(keycloakConfig);

                    // Token refresh setup
                    keycloakInstance.onTokenExpired = () => {
                        keycloakInstance.updateToken(60 * 15).then((refreshed) => {
                            if (refreshed) {
                                console.log('Token refreshed successfully');
                                // Update tokens in the store
                                if (keycloakInstance.token) {
                                    setAppToken(keycloakInstance.token);
                                }
                                if (keycloakInstance.refreshToken) {
                                    setRefreshToken(keycloakInstance.refreshToken);
                                }
                            } else {
                                console.log('Token not refreshed, still valid');
                            }
                        }).catch((error) => {
                            console.error('Failed to refresh token:', error);
                            // Redirect to login on refresh failure
                            keycloakInstance.login();
                        });
                    };

                    const isAuthenticated = await keycloakInstance.init({
                        onLoad: 'check-sso',
                        checkLoginIframe: false,
                    });
                    setIdp('keycloak');
                    setKeycloak(keycloakInstance);
                    setAuthenticated(isAuthenticated);

                    if (isAuthenticated) {
                        const response = await getCurrentUser('keycloak', keycloakInstance.token!)
                        setCurrentUser(response.data)
                        console.log("User", response.data)
                        setUserId(response.data['id'])

                        // Store both access token and refresh token in the store
                        setAppToken(keycloakInstance.token!)
                        if (keycloakInstance.refreshToken) {
                            setRefreshToken(keycloakInstance.refreshToken)
                        }
                    }
                } else {
                    // For non-enterprise deployments, use Memberstack
                    setIdp('memberstack');
                    const memberData = await getCurrentMember();

                    if (memberData.data) {
                        setAuthenticated(true);
                        setCurrentUser(memberData.data);
                        setUserId(memberData.data.id);

                        // Get Memberstack token
                        const memberstackToken = getMemberstackToken();
                        if (memberstackToken) {
                            setAppToken(memberstackToken);
                        }
                    } else {
                        setAuthenticated(false);
                    }
                }

            } catch (error) {
                console.error('Authentication initialization failed:', error);
                setAuthenticated(false);
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        initAuth();
    }, [getCurrentMember]);

    const login = (idpHint: string, redirectUri?: string) => {
        if (keycloak) {
            keycloak.login({
                idpHint,
                redirectUri: redirectUri
            });
        } else {
            console.warn('Keycloak not initialized');
        }
    };

    const logout = () => {
        // Send logout event before clearing auth state
        const apiKey = useStore.getState().api_key;
        if (apiKey) {
            axios.post('/audit-logs/event', {
                event_type: 'logout',
                user_email: '',
                metadata: { idp },
            }, {
                headers: { 'x-api-key': apiKey },
            }).catch((err) => console.error('Failed to send logout event:', err));
        }

        // Immediately set authenticated to false to prevent redirect loops
        setAuthenticated(false);
        setUserId(null);
        sessionStorage.removeItem('login_event_sent');

        if (IS_ENTERPRISE_DEPLOYMENT && keycloak) {
            resetStore();
            setAppToken('');
            keycloak.logout();
        } else {
            signOut()
                .then(() => {
                    resetStore();
                    setAppToken('');
                    document.cookie =
                        "_ms-mid" + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                })
                .catch((err: any) => {
                    console.log("Error logging out => ", err?.message);
                });
        }
    };

    const register = () => {
        if (keycloak) {
            keycloak.register();
        } else {
            console.warn('Keycloak not initialized');
        }
    };

    const getToken = () => {
        // Return token based on the active IDP
        if (idp === 'keycloak') {
            return keycloak?.token;
        } else {
            if (appToken) return appToken
            else {
                const token = getMemberstackToken()
                if (token) {
                    setAppToken(token)
                    return token
                }
            }
        }
    };

    const getUserInfo = () => {
        return keycloak?.tokenParsed;
    };

    const updateToken = async (minValidity = 5) => {
        try {
            const refreshed = await keycloak?.updateToken(minValidity);
            return refreshed;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            return false;
        }
    };

    const value: AuthContextType = {
        keycloak,
        authenticated,
        isLoggedIn: authenticated,
        loading,
        initialized,
        idp,
        login,
        logout,
        register,
        getToken,
        getUserInfo,
        updateToken,
        userId
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
