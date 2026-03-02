import { useEffect, useState, useRef } from "react";
import { useAuth as useMemberstackAuth, useMemberstack } from "@memberstack/react";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useAuth } from "@/contexts/AuthContext";
import { IS_ENTERPRISE_DEPLOYMENT } from "@/lib/constants";

export const useCurrentUser = () => {
  // Memberstack auth hooks
  const { userId: memberstackUserId, getToken: getMemberstackToken } = useMemberstackAuth();
  const { getCurrentMember } = useMemberstack();

  // Keycloak auth from AuthContext
  const {
    keycloak,
    authenticated: isKeycloakAuthenticated,
    loading: isKeycloakLoading,
    initialized: isKeycloakInitialized,
    getToken: getKeycloakToken,
    userId: keycloakUserId,
    idp
  } = useAuth();

  const { current_user, setCurrentUser } = useManageAdminStore(
    (state) => state,
  );

  // Determine which auth system is active
  const isUsingKeycloak = IS_ENTERPRISE_DEPLOYMENT || idp === 'keycloak';
  const userId = isUsingKeycloak ? keycloakUserId : memberstackUserId;
  const token = isUsingKeycloak ? getKeycloakToken() : getMemberstackToken();

  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Store functions in refs to avoid dependency issues
  const getCurrentMemberRef = useRef(getCurrentMember);
  const setCurrentUserRef = useRef(setCurrentUser);

  // Keep refs updated
  getCurrentMemberRef.current = getCurrentMember;
  setCurrentUserRef.current = setCurrentUser;

  // Reset hasFetchedRef when user signs out
  useEffect(() => {
    const isAuthenticated = isUsingKeycloak ? isKeycloakAuthenticated : !!memberstackUserId;
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
    }
  }, [isUsingKeycloak, isKeycloakAuthenticated, memberstackUserId]);

  // Fetch user data - only depends on stable auth state values
  useEffect(() => {
    // Skip if already fetched
    if (hasFetchedRef.current) return;

    // Check if user is authenticated before fetching
    const isAuthenticated = isUsingKeycloak
      ? (isKeycloakInitialized && isKeycloakAuthenticated)
      : !!memberstackUserId;

    // Don't fetch if not authenticated (e.g., on sign-in page)
    if (!isAuthenticated) return;

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        if (isUsingKeycloak) {
          if (isKeycloakAuthenticated) {
            hasFetchedRef.current = true;
          }
        } else {
          // Memberstack authentication
          const res = await getCurrentMemberRef.current();
          if (res.data) {
            setCurrentUserRef.current(res.data);
            hasFetchedRef.current = true;
          }
        }
      } catch (error) {
        console.log("Error fetching current user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    // Only primitive/stable values as dependencies
  }, [isUsingKeycloak, isKeycloakInitialized, isKeycloakAuthenticated, memberstackUserId]);

  // Only include keycloak loading state when using keycloak
  const combinedLoading = isUsingKeycloak
    ? (isLoading || isKeycloakLoading)
    : isLoading;

  return {
    userId,
    currentUser: current_user,
    token,
    isLoading: combinedLoading,
    keycloak,
    isKeycloakAuthenticated,
    idp,
    isUsingKeycloak
  };
};
