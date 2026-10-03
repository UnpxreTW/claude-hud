import { t } from '../i18n/index.js';
import { FIVE_HOUR_WINDOW_MS, SEVEN_DAY_WINDOW_MS, resolveUsagePaces } from '../usage-pace.js';
import { formatQuotaPercent, label, quotaBar } from './colors.js';
import { barLabel } from './labels.js';
import { formatWindowTime, wallClock } from './time.js';
function formatWindow(f, layout, w, align) {
    const display = f.config?.display;
    const colors = f.config?.colors;
    const timeFormat = display?.timeFormat ?? 'relative';
    const percent = formatQuotaPercent(w.percent, colors, display?.usageValue ?? 'percent', w.pace);
    const reset = formatWindowTime(w.resetAt, w.windowMs, timeFormat, wallClock(display), f.now);
    // The reset time rides a `│` separator as bare time — no parentheses and no
    // "resets in" wording (so showResetLabel no longer gates usage lines).
    if (display?.usageCompact) {
        return reset
            ? `${label(`${w.label}:`, colors)} ${percent} ${label(`│ ${reset}`, colors)}`
            : `${label(`${w.label}:`, colors)} ${percent}`;
    }
    const styledLabel = w.labelKey ? barLabel(w.labelKey, colors, align) : label(w.label, colors);
    if (display?.usageBarEnabled ?? true) {
        const barReset = layout === 'compact' && timeFormat === 'relative' && reset
            ? `${reset} / ${w.durationLabel ?? w.label}`
            : reset;
        const body = `${quotaBar(w.percent ?? 0, f.barWidth, colors, w.pace)} ${percent}${barReset ? ` │ ${barReset}` : ''}`;
        return w.forceLabel ? `${styledLabel} ${body}` : body;
    }
    return `${styledLabel} ${percent}${reset ? ` │ ${reset}` : ''}`;
}
/**
 * The usage windows as separator-joined parts. Expanded joins them into one line;
 * compact lays them out with the rest of its line and leaves `Usage` off the
 * limit, weekly-only, and below-threshold parts.
 */
export function usageParts(f, layout, align = {}) {
    const display = f.config?.display;
    const usage = f.usageData;
    if (display?.showUsage === false || !usage)
        return null;
    const colors = f.config?.colors;
    const compact = layout === 'compact';
    const usageLabel = barLabel('label.usage', colors, align);
    const withLabel = (part) => `${usageLabel} ${part}`;
    const balance = usage.balanceLabel ?? null;
    const withBalance = (parts) => (balance ? [...parts, balance] : parts);
    const scopedWindows = display?.showModelScopedUsage === false ? [] : usage.scopedWindows ?? [];
    const hasWindowData = usage.fiveHour !== null || usage.sevenDay !== null || scopedWindows.length > 0;
    if (balance && !hasWindowData)
        return [withLabel(balance)];
    const paces = resolveUsagePaces(usage, scopedWindows, display, f.now);
    const scoped = scopedWindows.map((w, i) => formatWindow(f, layout, {
        label: w.label,
        percent: w.percent,
        resetAt: w.resetAt,
        windowMs: SEVEN_DAY_WINDOW_MS,
        pace: paces.scoped[i],
        forceLabel: true,
        durationLabel: '7d',
    }, align));
    const effectiveUsage = Math.max(usage.fiveHour ?? 0, usage.sevenDay ?? 0, ...scopedWindows.map((w) => w.percent ?? 0));
    if (effectiveUsage < (display?.usageThreshold ?? 0) && !paces.alert) {
        return balance ? [compact ? balance : withLabel(balance)] : null;
    }
    const fiveHour = () => formatWindow(f, layout, {
        label: '5h',
        percent: usage.fiveHour,
        resetAt: usage.fiveHourResetAt,
        windowMs: FIVE_HOUR_WINDOW_MS,
        pace: paces.fiveHour,
    }, align);
    const sevenDay = () => formatWindow(f, layout, {
        label: display?.usageCompact ? '7d' : t('label.weekly'),
        labelKey: 'label.weekly',
        percent: usage.sevenDay,
        resetAt: usage.sevenDayResetAt,
        windowMs: SEVEN_DAY_WINDOW_MS,
        pace: paces.sevenDay,
        forceLabel: true,
    }, align);
    if (display?.usageCompact) {
        const windows = [
            usage.fiveHour !== null ? fiveHour() : null,
            usage.sevenDay !== null && (usage.fiveHour === null || paces.showSevenDay) ? sevenDay() : null,
        ].filter((part) => part !== null);
        const parts = [...windows, ...scoped];
        return parts.length > 0 ? withBalance(parts) : null;
    }
    if (usage.fiveHour === null && usage.sevenDay === null) {
        const [first, ...rest] = scoped;
        return first ? withBalance([withLabel(first), ...rest]) : balance ? [withLabel(balance)] : null;
    }
    if (usage.fiveHour === null) {
        const weekly = sevenDay();
        return withBalance([compact ? weekly : withLabel(weekly), ...scoped]);
    }
    const parts = [withLabel(fiveHour())];
    if (paces.showSevenDay)
        parts.push(sevenDay());
    return withBalance([...parts, ...scoped]);
}
//# sourceMappingURL=usage.js.map