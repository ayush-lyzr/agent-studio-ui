import useStore from "@/lib/store";

/**
 * Org-scoped API key used across Agent Studio.
 *
 * - Primary source: Zustand store (`useStore.getState().api_key`)
 * - Fallback: localStorage ("lyzrApiKey") for parity with older clients
 */
export function getOrgApiKey(): string {
  const fromStore = useStore.getState().api_key ?? "";
  if (fromStore.trim()) return fromStore.trim();

  if (globalThis.window === undefined) return "";
  return (localStorage.getItem("lyzrApiKey") ?? "").trim();
}

