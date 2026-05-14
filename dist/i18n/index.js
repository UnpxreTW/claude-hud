import { en } from "./en.js";
import { zh } from "./zh.js";
import { zhTW } from "./zh-TW.js";
const locales = {
    en,
    zh,
    "zh-Hans": zh,
    "zh-TW": zhTW,
    "zh-Hant-TW": zhTW,
};
const CANONICAL = {
    en: "en",
    zh: "zh-Hans",
    "zh-Hans": "zh-Hans",
    "zh-TW": "zh-Hant-TW",
    "zh-Hant-TW": "zh-Hant-TW",
};
let currentLanguage = "en";
export function setLanguage(lang) {
    currentLanguage = lang;
}
export function getLanguage() {
    return currentLanguage;
}
export function getCanonicalLanguage() {
    return CANONICAL[currentLanguage] ?? currentLanguage;
}
export function isCjkLanguage() {
    const canon = getCanonicalLanguage();
    return canon === "zh-Hans" || canon === "zh-Hant-TW";
}
export function t(key) {
    const canon = getCanonicalLanguage();
    return locales[canon]?.[key] ?? locales.en[key] ?? key;
}
//# sourceMappingURL=index.js.map