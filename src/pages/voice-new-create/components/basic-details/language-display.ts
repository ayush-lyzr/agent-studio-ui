const GLOBE_ICON = "🌐";
const MULTILINGUAL_CODE = "multi";
const REGIONAL_INDICATOR_A = 127_462;

export type LanguageOptionPresentation = {
  normalizedCode: string;
  label: string;
  icon: string;
  region?: string;
  isFallbackIcon: boolean;
};

function normalizeLanguageCode(rawCode: string): string {
  return String(rawCode ?? "")
    .trim()
    .replaceAll("_", "-");
}

function getDefaultLocale(uiLocale?: string): string {
  if (uiLocale && uiLocale.trim()) return uiLocale.trim();
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en";
}

function resolveLanguageLabel(
  normalizedCode: string,
  uiLocale?: string,
): string {
  if (!normalizedCode) return "";
  if (normalizedCode.toLowerCase() === MULTILINGUAL_CODE) return "Multilingual";

  try {
    const displayNames = new Intl.DisplayNames([getDefaultLocale(uiLocale)], {
      type: "language",
    });
    return displayNames.of(normalizedCode) ?? normalizedCode;
  } catch {
    return normalizedCode;
  }
}

function isAlpha2Region(value: string | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value);
}

function getExplicitAlpha2Region(normalizedCode: string): string | undefined {
  const segments = normalizedCode.split("-").filter(Boolean);
  if (segments.length < 2) return undefined;

  for (const segment of segments.slice(1)) {
    if (segment.length === 1) return undefined;
    if (/^\d{3}$/.test(segment)) return undefined;
    if (isAlpha2Region(segment)) return segment.toUpperCase();
  }

  return undefined;
}

function getMaximizedAlpha2Region(normalizedCode: string): string | undefined {
  try {
    const locale = new Intl.Locale(normalizedCode).maximize();
    if (!isAlpha2Region(locale.region)) return undefined;
    return locale.region.toUpperCase();
  } catch {
    return undefined;
  }
}

function regionToFlagEmoji(region: string): string {
  const upper = region.toUpperCase();
  if (!isAlpha2Region(upper)) return GLOBE_ICON;

  return String.fromCodePoint(
    ...[...upper].map((char) => REGIONAL_INDICATOR_A + (char.codePointAt(0)! - 65)),
  );
}

export function getLanguageOptionPresentation(
  rawCode: string,
  uiLocale?: string,
): LanguageOptionPresentation {
  const normalizedCode = normalizeLanguageCode(rawCode);
  if (!normalizedCode) {
    return {
      normalizedCode: "",
      label: "",
      icon: GLOBE_ICON,
      isFallbackIcon: true,
    };
  }

  const label = resolveLanguageLabel(normalizedCode, uiLocale);
  if (normalizedCode.toLowerCase() === MULTILINGUAL_CODE) {
    return {
      normalizedCode,
      label,
      icon: GLOBE_ICON,
      isFallbackIcon: true,
    };
  }

  const region =
    getExplicitAlpha2Region(normalizedCode) ??
    getMaximizedAlpha2Region(normalizedCode);
  const icon = region ? regionToFlagEmoji(region) : GLOBE_ICON;

  return {
    normalizedCode,
    label,
    icon,
    region,
    isFallbackIcon: !region,
  };
}
