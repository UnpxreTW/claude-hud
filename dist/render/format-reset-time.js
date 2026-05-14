import { t, getCanonicalLanguage } from '../i18n/index.js';
export function formatResetTime(resetAt, mode = 'relative') {
    if (!resetAt)
        return '';
    const now = new Date();
    const diffMs = resetAt.getTime() - now.getTime();
    if (diffMs <= 0) {
        return getCanonicalLanguage() === 'zh-TW' ? '即將重置' : '';
    }
    if (getCanonicalLanguage() === 'zh-TW') {
        const abs = formatAbsoluteZhTW(resetAt, now);
        if (mode === 'relative')
            return formatRelativeZhTW(diffMs);
        if (mode === 'absolute')
            return abs;
        return `${abs}（${formatRelativeZhTW(diffMs)}）`;
    }
    if (mode === 'relative') {
        return formatRelative(diffMs);
    }
    const absolute = formatAbsolute(resetAt, now);
    if (mode === 'absolute') {
        return absolute;
    }
    return `${formatRelative(diffMs)}, ${absolute}`;
}
function formatRelative(diffMs) {
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60) {
        return `${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
    }
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
function formatRelativeZhTW(diffMs) {
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 1)
        return '< 1 分鐘';
    if (diffMins < 60)
        return `${diffMins} 分鐘`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return remHours > 0 ? `${days} 天 ${remHours} 小時` : `${days} 天`;
    }
    return mins > 0 ? `${hours} 小時 ${mins} 分鐘` : `${hours} 小時`;
}
function formatAbsolute(resetAt, now) {
    const at = t('format.at');
    const prefix = at ? `${at} ` : '';
    const timeStr = resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (resetAt.toDateString() === now.toDateString()) {
        return `${prefix}${timeStr}`;
    }
    const dateStr = resetAt.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${prefix}${dateStr} ${timeStr}`;
}
function formatAbsoluteZhTW(resetAt, now) {
    const hours = String(resetAt.getHours()).padStart(2, '0');
    const minutes = String(resetAt.getMinutes()).padStart(2, '0');
    if (resetAt.toDateString() === now.toDateString()) {
        return `於 ${hours}:${minutes} 重置`;
    }
    const month = resetAt.getMonth() + 1;
    const day = resetAt.getDate();
    return `${month} 月 ${day} 號 ${hours}:${minutes} 重置`;
}
//# sourceMappingURL=format-reset-time.js.map