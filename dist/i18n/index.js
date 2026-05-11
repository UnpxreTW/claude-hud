import { en } from "./en.js";
import { zh } from "./zh.js";
import { zhTW } from "./zh-TW.js";
const locales = { en, zh, "zh-TW": zhTW };
let currentLanguage = "en";
export function setLanguage(lang) {
    currentLanguage = lang;
}
export function getLanguage() {
    return currentLanguage;
}
export function t(key) {
    return locales[currentLanguage][key] ?? locales.en[key] ?? key;
}
//# sourceMappingURL=index.js.map