import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import axios, { AxiosResponse } from "axios";
import { PAGOS_URL, PlanType } from "./constants";
import { ISemanticTableMeta } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const resolveModelDisplayName = (
  modelId: string,
  displayNames?: Record<string, string>,
  fallbackDisplayNames?: Record<string, string>,
): string => {
  const direct = displayNames?.[modelId] || fallbackDisplayNames?.[modelId];
  if (direct) return direct;
  const fallback = modelId.includes("/") ? modelId.split("/").pop() : modelId;
  return fallback || modelId;
};

export const extractModelIds = (models: unknown): string[] => {
  const results: string[] = [];

  const extractFromEntry = (entry: unknown): string | undefined => {
    if (Array.isArray(entry)) {
      const first = entry[0];
      if (typeof first === "string") return first;
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    } else if (typeof entry === "string") {
      return entry;
    }
    return undefined;
  };

  const walk = (input: unknown) => {
    if (Array.isArray(input)) {
      input.forEach((item) => {
        const modelId = extractFromEntry(item);
        if (modelId) {
          results.push(modelId);
          return;
        }
        if (item && typeof item === "object") {
          walk(item);
        }
      });
      return;
    }

    if (input && typeof input === "object") {
      Object.values(input as Record<string, unknown>).forEach(walk);
    }
  };

  walk(models);
  return Array.from(new Set(results));
};

export const getKeys = async ({
  token,
  organization_id,
}: {
  token: string;
  organization_id: string;
}) => {
  try {
    const response: AxiosResponse<any> = await axios.get<any>(
      "/keys/by_organization",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        baseURL: PAGOS_URL,
        params: { organization_id },
      },
    );
    return response.data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response &&
      error.response.status === 422
    ) {
      return { detail: "Validation Error" };
    }
    throw error;
  }
};

export const getConfigs = async (
  path: string,
  baseUrl: string,
  apiKey: string,
  setState: CallableFunction,
) => {
  const url = `${baseUrl}/v3${path}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "x-api-key": apiKey,
      },
    });
    setState(response.data);
  } catch (error) {
    console.error("Error fetching environments:", error);
    throw error;
  }
};

export const getRagConfigs = async (
  baseUrl: string,
  isSemanticModel: boolean | null,
  apiKey: string,
  setState: CallableFunction,
) => {
  try {
    const response = await axios.get(
      `${baseUrl}/${apiKey}/?semantic_data_models=${isSemanticModel}`,
      {
        headers: { "x-api-key": apiKey },
      },
    );
    const configs = response.data.configs.map(
      (item: {
        _id: string;
        description: string;
        collection_name: string;
        llm_model: string;
        embedding_model: string;
        vector_store_provider: string;
        meta_data: ISemanticTableMeta;
      }) => ({
        id: item._id,
        name: item.description,
        collection_name: item.collection_name,
        llm_model: item.llm_model,
        embedding_model: item.embedding_model,
        vector_store_provider: item.vector_store_provider,
        meta_data: item.meta_data ?? {},
      }),
    );
    setState(configs);
  } catch (error) {
    console.error("Error fetching RAG Configs:", error);
    throw error;
  }
};

export interface Tools {
  userTools: any[];
  tools: any[];
  providers: any[];
}

// export const fetchTools = async (
//   baseUrl: string,
//   apiKey: string,
//   setState: (tools: Tools) => void,
// ) => {
//   try {
//     const [userToolsRes, toolsRes, providersRes] = await Promise.all([
//       axios.get(`${baseUrl}/v3/tools/composio/user`, {
//         headers: { "x-api-key": apiKey },
//       }),
//       axios.get(`${baseUrl}/v3/tools/`, {
//         headers: { "x-api-key": apiKey },
//       }),
//       axios.get(`${baseUrl}/v3/providers/type?provider_type=tool`, {
//         headers: { "x-api-key": apiKey },
//       }),
//     ]);

//     setState({
//       userTools: userToolsRes.data || [],
//       tools: toolsRes.data?.tools || [],
//       providers: providersRes.data || [],
//     });
//   } catch (error) {
//     console.error("Error fetching tools:", error);
//     setState({
//       userTools: [],
//       tools: [],
//       providers: [],
//     });
//   }
// };

export const getNextInvoiceDate = (createdAt: string) => {
  // Parse the created_at date
  const createdDate = new Date(createdAt).valueOf();
  if (isNaN(createdDate)) {
    throw new Error("Invalid created_at date format");
  }
  // Get the current date
  const currentDate = new Date();
  // Calculate the next invoice date
  let nextInvoiceDate = new Date(createdDate);
  while (nextInvoiceDate <= currentDate) {
    // Add 30 days to the current invoice date until it's in the future
    nextInvoiceDate.setDate(nextInvoiceDate.getDate() + 30);
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(nextInvoiceDate);
};

export const monthMap = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export const getCurrentBillingCycle = (
  createdAt: string,
  cycle: "monthly" | "yearly" | "quarterly",
) => {
  // Parse the created_at date
  const createdDate = new Date(createdAt).valueOf();
  if (isNaN(createdDate)) {
    throw new Error("Invalid created_at date format");
  }
  let nextInvoiceDate = getNextBillingDate(new Date(createdDate), cycle);
  let prevInvoiceDate = new Date(nextInvoiceDate);

  prevInvoiceDate.setMonth(nextInvoiceDate.getMonth() - monthMap[cycle]);

  return { from: prevInvoiceDate, to: nextInvoiceDate };
};

export const formatDate = (timestamp: string): string => {
  const sanitized = timestamp.replace(/(\.\d{3})\d+/, "$1");
  const date = new Date(sanitized + "Z");

  // Returns date in this format: May 22, 2025, 12:02 AM
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

export function getNextBillingDate(
  firstBilledDate: Date,
  cycle: "monthly" | "quarterly" | "yearly",
) {
  const firstDate = new Date(firstBilledDate);
  const today = new Date();
  // If the first billed date is in the future, return it directly
  if (firstDate > today) return firstDate;

  let nextBillingDate = new Date(firstDate);
  if (cycle === "yearly") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    return nextBillingDate;
  }

  if (cycle === "monthly") {
    // Check if the first billed date is the last day of the month
    const isEndOfMonth =
      firstDate.getDate() ===
      new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0).getDate();

    // Keep adding months until the billing date is in the future
    while (nextBillingDate <= today) {
      // Move to the next month
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      // If the original date was the end of the month, adjust to the new month's last day
      if (isEndOfMonth) {
        const daysInMonth = new Date(
          nextBillingDate.getFullYear(),
          nextBillingDate.getMonth() + 1,
          0,
        ).getDate();
        nextBillingDate.setDate(daysInMonth);
      }
    }
  }

  if (cycle === "quarterly") {
    // Check if the first billed date is the last day of the month
    const isEndOfMonth =
      firstDate.getDate() ===
      new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0).getDate();

    // Keep adding months until the billing date is in the future
    while (nextBillingDate <= today) {
      // Move to the next month
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);

      // If the original date was the end of the month, adjust to the new month's last day
      if (isEndOfMonth) {
        const daysInMonth = new Date(
          nextBillingDate.getFullYear(),
          nextBillingDate.getMonth() + 1,
          0,
        ).getDate();
        nextBillingDate.setDate(daysInMonth);
      }
    }
  }
  return nextBillingDate;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function convertToReadableNumber(price: number) {
  return (Math.trunc(price * 100) / 100)
    ?.toString()
    ?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const readFileAsync = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (!file) {
      reject("File not found");
    }

    reader.onload = () => {
      const content = reader.result;
      const saDict = JSON.parse(content?.toString() ?? "{}");
      resolve(saDict);
    };
    reader.onerror = () => reject(reader.error);

    reader.readAsText(file); // Change to readAsDataURL, readAsArrayBuffer, etc., if needed
  });
};

export const isValidJson = (json: string) => {
  try {
    const parsed = JSON.parse(json);
    if (Object.keys(parsed)?.length === 0) return false;
    return typeof parsed === "object" && parsed !== null;
  } catch (e) {
    return false;
  }
};

export const getCookie = (name: string): Record<string, string> | null => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      const value = decodeURIComponent(cookieValue);
      return value.split(",").reduce((prev, curr) => {
        const obj = curr.split(":");
        Object.assign(prev, { [obj[0]]: obj[1] });
        return prev;
      }, {});
    }
  }
  return null;
};

export const isOrgMode = (planName?: string) => {
  if (!planName) return false;
  return ![
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(planName as PlanType);
};

/**
 * Returns a hex color string for a shade of black.
 * @param blackness A number from 0 (white) to 1 (black)
 * @returns Hex color string (e.g. "#333333")
 */
export function getBlackHex(blackness: number): string {
  // Clamp blackness between 0 and 1
  const b = Math.max(0, Math.min(1, blackness));
  // Calculate the value (0 = black, 255 = white)
  const val = Math.round(255 * (1 - b));
  // Convert to hex and pad with zeros if needed
  const hex = val.toString(16).padStart(2, "0");
  // Return the hex color
  return `#${hex}${hex}${hex}`;
}

export function isStringifiedJSONString(input: string): boolean {
  try {
    const parsed = JSON.parse(input);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false; // Not valid JSON
  }
}

export function convertToJSONString(input: string): string {
  const lines = input.split("\n");
  const result: Record<string, string[]> = {};

  for (const line of lines) {
    const [key, value] = line.split(":").map((str) => str.trim());
    if (!key || !value) continue;

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(value);
  }

  return JSON.stringify(result, null, 2);
}

export function convertJSONStringToArray(
  jsonStr: string,
): { name: string; usage_description: string }[] {
  const parsed = JSON.parse(jsonStr);
  const result: { name: string; usage_description: string }[] = [];

  for (const [key, values] of Object.entries(parsed)) {
    if (Array.isArray(values)) {
      for (const value of values) {
        result.push({ name: key, usage_description: value });
      }
    }
  }
  return result;
}

export const extractJsonFromResponse = (responseText: any): any => {
  if (typeof responseText === "object" && responseText !== null) {
    return responseText;
  }

  if (!responseText || typeof responseText !== "string") {
    throw new Error(
      `Invalid response: expected string or object, got ${typeof responseText}`,
    );
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error("Could not parse JSON from response string");
  }
};

export const cleanEventText = (text: string): string => {
  if (!text) return text;

  // Remove <EXECUTION_COMPLETE> tags
  return text.replace(/<EXECUTION_COMPLETE>/g, "");
};

export const formatTruncatedCredits = (credits: number) => {
  return credits >= 1000000
    ? `${Math.floor(credits / 1000000)}M`
    : credits >= 1000
      ? `${Math.floor(credits / 1000)}K`
      : credits.toString();
};

export function formatTime(timestamp: string) {
  return new Date(
    timestamp.endsWith("Z") || timestamp.includes("+")
      ? timestamp
      : `${timestamp}Z`,
  );
}
export function formatTimeAgo(timestamp: Date, locale = "en") {
  const now = new Date();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffInSeconds = (now.getTime() - timestamp.getTime()) / 1000;

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; value: number }> = [
    { unit: "year", value: 31536000 }, // seconds in a year
    { unit: "month", value: 2592000 }, // seconds in a month (approx)
    { unit: "day", value: 86400 }, // seconds in a day
    { unit: "hour", value: 3600 }, // seconds in an hour
    { unit: "minute", value: 60 }, // seconds in a minute
    { unit: "second", value: 1 }, // seconds in a second
  ];

  for (const { unit, value } of units) {
    const diff = Math.floor(diffInSeconds / value);
    if (diff >= 1 || (unit === "second" && diffInSeconds > -60)) {
      // Handle "just now" for seconds
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      return rtf.format(-diff, unit); // Use negative for "ago"
    }
  }
  return rtf.format(0, "second"); // For "just now"
}

/**
 * RBAC Permission Utilities
 */

/**
 * Checks if a user has a specific permission based on their organization role and permissions
 * @param permission - The permission to check (e.g., "agents:read", "agents:create")
 * @param organization - The current organization object with role, permissions, and is_new_rbac flag
 * @returns boolean - true if the user has the permission
 */
export const hasPermission = (
  permission: string,
  organization?: {
    is_new_rbac?: boolean;
    role?: string;
    permissions?: string[];
  }
): boolean => {
  if (!organization?.is_new_rbac) {
    return true; // Old RBAC system - show all items
  }

  // Allow all permissions for role_owner
  if (organization?.role === 'role_owner') {
    return true;
  }

  const permissions = organization?.permissions || [];

  // Check for exact permission match
  if (permissions.includes(permission)) {
    return true;
  }

  // Check for wildcard permissions (e.g., "agents:*" matches "agents:read", "agents:create")
  const [resource] = permission.split(':');
  if (permissions.includes(`${resource}:*`)) {
    return true;
  }

  return false;
};

/**
 * Checks if a user has any of the permissions in the provided list
 * @param permissionList - Array of permissions to check
 * @param organization - The current organization object with role, permissions, and is_new_rbac flag
 * @returns boolean - true if the user has at least one of the permissions
 */
export const hasAnyPermission = (
  permissionList: string[],
  organization?: {
    is_new_rbac?: boolean;
    role?: string;
    permissions?: string[];
  }
): boolean => {
  if (!organization?.is_new_rbac) {
    return true; // Old RBAC system - show all items
  }

  // Allow all permissions for role_owner
  if (organization?.role === 'role_owner') {
    return true;
  }

  return permissionList.some(permission => hasPermission(permission, organization));
};
