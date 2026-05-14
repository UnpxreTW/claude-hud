import type { Language, MessageKey, Messages } from "./types.js";
import { en } from "./en.js";
import { zh } from "./zh.js";
import { zhTW } from "./zh-TW.js";

export type { Language, MessageKey, Messages };

const locales: Record<string, Messages> = {
  en,
  zh,
  "zh-Hans": zh,
  "zh-TW": zhTW,
};

type CanonicalLanguage = "en" | "zh-Hans" | "zh-TW";

const CANONICAL: Record<Language, CanonicalLanguage> = {
  en: "en",
  zh: "zh-Hans",
  "zh-Hans": "zh-Hans",
  "zh-TW": "zh-TW",
};

let currentLanguage: Language = "en";

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function getCanonicalLanguage(): CanonicalLanguage {
  return CANONICAL[currentLanguage] ?? "en";
}

export function isCjkLanguage(): boolean {
  const canon = getCanonicalLanguage();
  return canon === "zh-Hans" || canon === "zh-TW";
}

export function t(key: MessageKey): string {
  const canon = getCanonicalLanguage();
  return locales[canon]?.[key] ?? locales.en[key] ?? key;
}
