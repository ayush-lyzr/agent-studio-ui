import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BASE_URL, DEFAULT_ERROR_MESSAGE, PAGOS_URL, IS_ENTERPRISE_DEPLOYMENT, KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID } from "./constants";

import { toast } from "sonner";
import { Path } from "./types";
import useStore from "./store";

const instance = axios.create({
  timeout: 4000 * 1000,
  baseURL: BASE_URL + "/v3",
  headers: { Accept: "application/json" },
});

// Attach API key from store to every request so backend receives x-api-key
instance.interceptors.request.use((config) => {
  const apiKey = useStore.getState().api_key;
  if (apiKey && config.headers) {
    config.headers["x-api-key"] = apiKey;
  }
  return config;
});

// Flag to prevent infinite retry loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const e: any = error?.response?.data;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };


    // Handle 401 errors for enterprise deployment with PAGOS endpoints
    if (error?.response?.status === 401) {

      const requestUrl = originalRequest?.url || '';
      const isPagosEndpoint = requestUrl.startsWith(PAGOS_URL);

      if (IS_ENTERPRISE_DEPLOYMENT && isPagosEndpoint && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return instance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Get refresh token from the store
          const { refresh_token: storedRefreshToken, setAppToken, setRefreshToken } = useStore.getState();

          if (!storedRefreshToken) {
            throw new Error("Refresh token not available");
          }

          // Call Keycloak token refresh endpoint directly
          const tokenEndpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
          const tokenResponse = await axios.post(
            tokenEndpoint,
            new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: KEYCLOAK_CLIENT_ID,
              refresh_token: storedRefreshToken,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );

          const { access_token, refresh_token } = tokenResponse.data;

          if (access_token) {
            // Update the store with new tokens
            setAppToken(access_token);
            if (refresh_token) {
              setRefreshToken(refresh_token);
            }

            // Update the authorization header with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }

            processQueue(null, access_token);
            isRefreshing = false;

            // Retry the original request with new token
            return instance(originalRequest);
          } else {
            throw new Error("Token refresh failed - no access token received");
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          console.error('Token refresh error:', refreshError);

          // If token refresh fails, redirect to login
          toast.error("Session expired. Please login again.", { duration: 5 * 1000 });
          window.location.href = Path.LOGIN;

          return Promise.reject(refreshError);
        }
      }

      // For non-enterprise or non-PAGOS endpoints, redirect to login
      // if (!IS_ENTERPRISE_DEPLOYMENT || !isPagosEndpoint) {
      //   toast.error("Session expired. Please login again.", { duration: 5 * 1000 });
      //   window.location.href = Path.LOGIN;
      //   return Promise.reject(error.response);
      // }
    }

    // Check if request URL contains 'organizations/current' to skip error toast
    const requestUrl = originalRequest?.url || '';
    const isOrganizationCurrentEndpoint = requestUrl.includes('organizations/current');

    // Handle other error codes
    switch (error?.response?.status) {
      case 404:
        if (location.pathname.includes(Path.AGENT_CREATE)) {
          toast.error("Agent not found", { duration: 3 * 1000 });
          window.location.href = Path.AGENT_BUILDER;
        }
        // to avoid initial user not found error 
        if (!isOrganizationCurrentEndpoint) {
          if (Array.isArray(e.detail)) {
            e.detail.forEach((obj: any) => {
              toast.error(obj?.msg, { duration: 5 * 1000 });
            });
          } else {
            toast.error(
              e?.detail?.length > 100
                ? `${e?.detail?.slice(0, 100)}...`
                : e?.detail,
              { duration: 5 * 1000 },
            );
          }
        }
        break;
      case 400:
      case 422:
      case 500:
      case 503:
      case 504:
        if (!isOrganizationCurrentEndpoint) {
          if (Array.isArray(e.detail)) {
            e.detail.forEach((obj: any) => {
              toast.error(obj?.msg, { duration: 5 * 1000 });
            });
          } else {
            toast.error(
              e?.detail?.length > 100
                ? `${e?.detail?.slice(0, 100)}...`
                : e?.detail,
              { duration: 5 * 1000 },
            );
          }
        }
        break;
      default:
        console.log(DEFAULT_ERROR_MESSAGE);
        break;
    }
    return Promise.reject(error.response);
  },
);


export const pagosAxiosInstance = axios.create({ 
  baseURL : PAGOS_URL
})

export default instance;
