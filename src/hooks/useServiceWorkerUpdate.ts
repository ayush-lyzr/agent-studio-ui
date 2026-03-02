// import { isDevEnv } from "@/lib/constants";
// import { useState, useEffect, useCallback, useRef } from "react";
// import { registerSW } from "virtual:pwa-register";

// interface ServiceWorkerUpdateState {
//   updateAvailable: boolean;
//   isUpdating: boolean;
//   error: string | null;
//   registration: ServiceWorkerRegistration | null;
// }

// interface UseServiceWorkerUpdateReturn extends ServiceWorkerUpdateState {
//   updateApp: () => Promise<void>;
//   dismissUpdate: () => void;
// }

// export const useServiceWorkerUpdate = (): UseServiceWorkerUpdateReturn => {
//   const [state, setState] = useState<ServiceWorkerUpdateState>({
//     updateAvailable: false,
//     isUpdating: false,
//     error: null,
//     registration: null,
//   });

//   const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(
//     null,
//   );
//   const isInitializedRef = useRef(false);

//   const updateApp = useCallback(async () => {
//     if (!updateSWRef.current) return;

//     setState((prev) => ({ ...prev, isUpdating: true, error: null }));

//     try {
//       await updateSWRef.current(false); // Don't auto-reload

//       // Wait a bit for the new SW to take control
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       // Manual reload with cache busting
//       window.location.reload();
//     } catch (error) {
//       console.error("Failed to update service worker:", error);
//       setState((prev) => ({
//         ...prev,
//         isUpdating: false,
//         error: error instanceof Error ? error.message : "Update failed",
//       }));
//     }
//   }, []);

//   const dismissUpdate = useCallback(() => {
//     setState((prev) => ({
//       ...prev,
//       updateAvailable: false,
//       error: null,
//     }));
//   }, []);

//   useEffect(() => {
//     if (isInitializedRef.current) return;
//     isInitializedRef.current = true;

//     const intervalMS = isDevEnv ? 1 * 10 * 1000 : 60 * 60 * 1000;

//     const updateSW = registerSW({
//       onNeedRefresh() {
//         console.log("New content available, prompting user...");
//         setState((prev) => ({ ...prev, updateAvailable: true }));
//       },

//       onOfflineReady() {
//         console.log("App ready to work offline");
//       },

//       onRegistered(registration) {
//         console.log("SW Registered:", registration);
//         setState((prev) => ({ ...prev, ...registration }));

//         // Set up periodic update checks
//         if (registration) {
//           const checkForUpdates = () => {
//             registration.update().catch(console.error);
//           };

//           const intervalId = setInterval(checkForUpdates, intervalMS);

//           // Cleanup function will be returned by the effect
//           return () => {
//             clearInterval(intervalId);
//           };
//         }
//       },

//       onRegisterError(error) {
//         console.error("SW registration failed:", error);
//         setState((prev) => ({
//           ...prev,
//           error: error instanceof Error ? error.message : "Registration failed",
//         }));
//       },
//     });

//     updateSWRef.current = updateSW;

//     // Cleanup function
//     return () => {
//       // Clear any pending updates
//       updateSWRef.current = null;
//     };
//   }, []);

//   // Listen for visibility changes to check for updates when user returns
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (!document.hidden && state.registration) {
//         // Check for updates when user returns to the tab
//         state.registration.update().catch(console.error);
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     return () => {
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//     };
//   }, [state.registration]);

//   return {
//     ...state,
//     updateApp,
//     dismissUpdate,
//   };
// };
