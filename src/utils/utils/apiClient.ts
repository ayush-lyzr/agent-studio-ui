import axios from "axios";
import useStore from "@/lib/store";

// Note: API key is now managed through Zustand store and request interceptors

// Create instance of axios with default config
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:8001",
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the API key to all requests
apiClient.interceptors.request.use(
  (config) => {
    const apiKey = useStore.getState().api_key;
    if (apiKey) {
      config.headers["x-api-key"] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401 || error.response.status === 403) {
        // Handle unauthorized access
        console.error("Authentication error:", error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request error:", error.message);
    }

    return Promise.reject(error);
  },
);
