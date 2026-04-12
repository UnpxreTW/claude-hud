import { isLimitReached } from "../../types.js";
import { getProviderLabel } from "../../stdin.js";
import { critical, label, getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { t } from "../../i18n/index.js";
export function renderUsageLine(ctx) {
    const display = ctx.config?.display;
    const colors = ctx.config?.colors;
    if (display?.showUsage === false) {
        return null;
    }
    if (!ctx.usageData) {
        return null;
    }
    if (getProviderLabel(ctx.stdin)) {
        return null;
    }
    const usageLabel = label(t("label.usage"), colors);
    if (isLimitReached(ctx.usageData)) {
        const resetTime = ctx.usageData.fiveHour === 100
            ? formatResetTime(ctx.usageData.fiveHourResetAt)
            : formatResetTime(ctx.usageData.sevenDayResetAt);
        return `${usageLabel} ${critical(`⚠ ${t("status.limitReached")}${resetTime ? ` (${t("format.resets")} ${resetTime})` : ""}`, colors)}`;
    }
    const threshold = display?.usageThreshold ?? 0;
    const fiveHour = ctx.usageData.fiveHour;
    const sevenDay = ctx.usageData.sevenDay;
    const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);
    if (effectiveUsage < threshold) {
        return null;
    }
    const usageBarEnabled = display?.usageBarEnabled ?? true;
    const sevenDayThreshold = display?.sevenDayThreshold ?? 80;
    const barWidth = getAdaptiveBarWidth();
    if (fiveHour === null && sevenDay !== null) {
        const weeklyOnlyPart = formatUsageWindowPart({
            label: t("label.weekly"),
            percent: sevenDay,
            resetAt: ctx.usageData.sevenDayResetAt,
            colors,
            usageBarEnabled,
            barWidth,
            forceLabel: true,
        });
        return `${usageLabel} ${weeklyOnlyPart}`;
    }
    const fiveHourPart = formatUsageWindowPart({
        label: "5h",
        percent: fiveHour,
        resetAt: ctx.usageData.fiveHourResetAt,
        colors,
        usageBarEnabled,
        barWidth,
    });
    if (sevenDay !== null && sevenDay >= sevenDayThreshold) {
        const sevenDayPart = formatUsageWindowPart({
            label: t("label.weekly"),
            percent: sevenDay,
            resetAt: ctx.usageData.sevenDayResetAt,
            colors,
            usageBarEnabled,
            barWidth,
            forceLabel: true,
        });
        return `${usageLabel} ${fiveHourPart} | ${sevenDayPart}`;
    }
    return `${usageLabel} ${fiveHourPart}`;
}
function formatUsagePercent(percent, colors) {
    if (percent === null) {
        return label("--", colors);
    }
    const color = getQuotaColor(percent, colors);
    return `${color}${percent}%${RESET}`;
}
function formatUsageWindowPart({ label: windowLabel, percent, resetAt, colors, usageBarEnabled, barWidth, forceLabel = false, }) {
    const usageDisplay = formatUsagePercent(percent, colors);
    const reset = formatResetTime(resetAt);
    const styledLabel = label(windowLabel, colors);
    if (usageBarEnabled) {
        const body = reset
            ? `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay} (${t("format.resetsIn")} ${reset})`
            : `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay}`;
        return forceLabel ? `${styledLabel} ${body}` : body;
    }
    return reset
        ? `${styledLabel} ${usageDisplay} (${t("format.resetsIn")} ${reset})`
        : `${styledLabel} ${usageDisplay}`;
}
function formatResetTime(resetAt) {
    if (!resetAt)
        return "";
    const now = new Date();
    if (resetAt.getTime() <= now.getTime())
        return "即將重置";
    const hours = String(resetAt.getHours()).padStart(2, "0");
    const minutes = String(resetAt.getMinutes()).padStart(2, "0");
    return `於 ${hours}:${minutes} 重置`;
}
//# sourceMappingURL=usage.js.map