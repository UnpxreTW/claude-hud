import { en } from "./en.js";
import { zh } from "./zh.js";
import { zhTW } from "./zh-TW.js";
const locales = {
    en,
    zh,
    "zh-Hans": zh,
    "zh-TW": zhTW,
};
// Resolve short language tags to canonical BCP 47 forms per CLDR likely subtags.
// https://www.unicode.org/cldr/charts/latest/supplemental/likely_subtags.html
//   zh   → zh-Hans (CLDR: zh → zh-Hans-CN)
//   zh-TW → zh-TW  (CLDR: zh-TW → zh-Hant-TW, Phase 2 will adopt full form)
const CANONICAL = {
    "en": "en",
    "zh": "zh-Hans",
    "zh-Hans": "zh-Hans",
    "zh-TW": "zh-TW",
};
let currentLanguage = "en";
export function setLanguage(lang) {
    currentLanguage = lang;
}
export function getLanguage() {
    return currentLanguage;
}
export function getCanonicalLanguage() {
    return CANONICAL[currentLanguage] ?? "en";
}
export function isCjkLanguage() {
    const canon = getCanonicalLanguage();
    return canon === "zh-Hans" || canon === "zh-TW";
}
export function t(key) {
    const canon = getCanonicalLanguage();
    return locales[canon]?.[key] ?? locales.en[key] ?? key;
}
//# sourceMappingURL=index.js.map