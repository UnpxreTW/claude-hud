import { en } from "./en.js";
import { zhHans } from "./zh-Hans.js";
import { zhTW } from "./zh-TW.js";
const locales = {
    en,
    zh: zhHans,
    "zh-Hans": zhHans,
    "zh-TW": zhTW,
};
// Resolve short language tags to canonical BCP 47 forms.
// Based on CLDR likely subtags: zh → zh-Hans-CN, zh-TW → zh-Hant-TW
// https://www.unicode.org/cldr/charts/latest/supplemental/likely_subtags.html
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