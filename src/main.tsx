
import React from "react";
import ReactDOM from "react-dom/client";
import { MemberstackProvider } from "@memberstack/react";
import mixpanel from "mixpanel-browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "@/index.css";
import {
  // isDevEnv,
  isMixpanelActive,
  MEMBERSTACK_PUBLICKEY,
  MIXPANEL_KEY,
  IS_PROPHET_DEPLOYMENT,
} from "./lib/constants";
import { BRAND } from "./lib/branding";
import AppRouter from "@/router";
import { UserbackProvider } from "./contexts/feedback-context";
// import { UpdateNotification } from "./components/custom/update-notification";
import { AuthProvider } from "./contexts/AuthContext";


const config = {
  publicKey: MEMBERSTACK_PUBLICKEY,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

if (isMixpanelActive) {
  mixpanel.init(MIXPANEL_KEY, {
    debug: true,
    persistence: "localStorage",
    record_sessions_percent: 20,
  });
}

// Set favicon based on deployment type
const setFavicon = () => {
  const favicon = document.getElementById('favicon') as HTMLLinkElement;
  if (favicon) {
    if (IS_PROPHET_DEPLOYMENT) {
      // Use Prophet logo only when IS_PROPHET_DEPLOYMENT is true
      favicon.href = '/prophetLogo.png';
    } else {
      favicon.href = BRAND.logoUrl;
    }
  }
};

// Set favicon immediately
setFavicon();

(async () => {
  const reloadFlag = "app_hard_reloaded";
  const forceReloadKey = "forceReload";

  console.log("🌀 Starting hard reload logic");

  const url = new URL(window.location.href);
  const hasForceReloadParam = url.searchParams.has(forceReloadKey);

  if (localStorage.getItem(reloadFlag) && hasForceReloadParam) {
    console.log("✅ Already reloaded once. Cleaning up.");
    localStorage.removeItem(reloadFlag);

    // Optional: Clean the URL back after reload
    url.searchParams.delete(forceReloadKey);
    window.history.replaceState({}, document.title, url.toString());
    return;
  }

  let needsReload = false;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(
        "📦 Found service worker registrations:",
        registrations.length,
      );
      for (const reg of registrations) {
        const success = await reg.unregister();
        console.log("Unregistered:", success);
        if (success) needsReload = true;
      }
    }

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      console.log("🗃 Cache names:", cacheNames);
      for (const name of cacheNames) {
        const deleted = await caches.delete(name);
        console.log("Deleted cache:", name, "->", deleted);
        if (deleted) needsReload = true;
      }
    }
  } catch (err) {
    console.warn("⚠️ Error during cleanup:", err);
  }

  if (needsReload && !hasForceReloadParam) {
    console.log("🔁 Reloading with flag...");
    localStorage.setItem(reloadFlag, "true");

    // Wait briefly to let cleanup finalize
    await new Promise((r) => setTimeout(r, 100));

    // Add a timestamp to ensure URL is unique (bypasses cache)
    const reloadUrl = new URL(window.location.href);
    reloadUrl.searchParams.set(forceReloadKey, Date.now().toString());
    window.location.href = reloadUrl.toString();
  } else {
    console.log("❎ No reload needed or already reloaded.");
  }
})();

// ✅ Inject gtag & VWO scripts dynamically based on env
if (import.meta.env.VITE_BASE_URL) {
  const gtagScript = document.createElement("script");
  gtagScript.src = `${import.meta.env.VITE_BASE_URL}/static/js/gtag-setup.js`;
  gtagScript.async = true;
  document.body.appendChild(gtagScript);

  const vwoScript = document.createElement("script");
  vwoScript.src = `${import.meta.env.VITE_BASE_URL}/static/js/vwo-async.js`;
  vwoScript.id = "vwoCode";
  vwoScript.async = true;
  document.body.appendChild(vwoScript);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <MemberstackProvider config={config}>
          <UserbackProvider>
            <AuthProvider>

              <AppRouter />
              <Toaster />
              {/* {isDevEnv ? <UpdateNotification /> : <></>} */}
              <SonnerToaster
                closeButton
                theme="light"
                position="top-right"
                toastOptions={{
                  className: "font-sans",
                  closeButton: true,
                  duration: 3000,
                }}
              />
            </AuthProvider>

          </UserbackProvider>
        </MemberstackProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
