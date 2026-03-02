import { useEffect, useState } from "react";
import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: "http://localhost:8080",
  realm: "lyzr-dev",
  clientId: "spa"
};

export const useKeycloak = () => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        setIsLoading(true);
        const keycloakInstance = new Keycloak(keycloakConfig);

        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`
        });

        setKeycloak(keycloakInstance);
        setIsAuthenticated(authenticated);
        setIsInitialized(true);

        if (authenticated) {
          console.log("Keycloak: User is authenticated");
          console.log("Token:", keycloakInstance.token);
        } else {
          console.log("Keycloak: User is not authenticated");
        }
      } catch (error) {
        console.error("Keycloak initialization error:", error);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const login = () => {
    keycloak?.login();
  };

  const logout = () => {
    keycloak?.logout();
  };

  const register = () => {
    keycloak?.register();
  };

  const updateToken = async (minValidity = 5) => {
    try {
      const refreshed = await keycloak?.updateToken(minValidity);
      if (refreshed) {
        console.log("Token refreshed");
      }
      return refreshed;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  };

  const getToken = () => {
    return keycloak?.token;
  };

  const getUserInfo = () => {
    return keycloak?.tokenParsed;
  };

  return {
    keycloak,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    register,
    updateToken,
    getToken,
    getUserInfo
  };
};
