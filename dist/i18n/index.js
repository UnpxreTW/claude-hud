import { en } from "./en.js";
import { zh } from "./zh.js";
import { zhTW } from "./zh-TW.js";
const locales = {
    en,
    zh,
    "zh-Hans": zh,
    "zh-TW": zhTW,
};
const CANONICAL = {
    en: "en",
    zh: "zh-Hans",
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