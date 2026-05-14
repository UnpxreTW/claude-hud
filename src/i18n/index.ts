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
  "zh-Hant-TW": zhTW,
};

const CANONICAL: Record<Language, string> = {
  en: "en",
  zh: "zh-Hans",
  "zh-Hans": "zh-Hans",
  "zh-TW": "zh-Hant-TW",
  "zh-Hant-TW": "zh-Hant-TW",
};

let currentLanguage: Language = "en";

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function getCanonicalLanguage(): string {
  return CANONICAL[currentLanguage] ?? currentLanguage;
}

export function isCjkLanguage(): boolean {
  const canon = getCanonicalLanguage();
  return canon === "zh-Hans" || canon === "zh-Hant-TW";
}

export function t(key: MessageKey): string {
  const canon = getCanonicalLanguage();
  return locales[canon]?.[key] ?? locales.en[key] ?? key;
}
