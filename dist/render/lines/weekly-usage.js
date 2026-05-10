import { shouldHideUsage } from "../../stdin.js";
import { label, getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { progressLabel } from "./label-align.js";
import { formatResetTime } from "../format-reset-time.js";
export function renderWeeklyUsageLine(ctx, alignLabels = false) {
    const display = ctx.config?.display;
    const colors = ctx.config?.colors;
    if (display?.showUsage === false)
        return null;
    if (!ctx.usageData)
        return null;
    if (shouldHideUsage(ctx.stdin))
        return null;
    const sevenDay = ctx.usageData.sevenDay;
    if (sevenDay === null)
        return null;
    const usageLabel = progressLabel("label.weekly", colors, alignLabels);
    const timeFormat = display?.timeFormat ?? 'relative';
    const usageBarEnabled = display?.usageBarEnabled ?? true;
    const barWidth = getAdaptiveBarWidth();
    const usageDisplay = formatUsagePercent(sevenDay, colors);
    const reset = formatResetTime(ctx.usageData.sevenDayResetAt, timeFormat);
    if (usageBarEnabled) {
        const resetSuffix = reset ? ` │ ${reset}` : '';
        return `${usageLabel} ${quotaBar(sevenDay, barWidth, colors)} ${usageDisplay}${resetSuffix}`;
    }
    const resetSuffix = reset ? ` │ ${reset}` : '';
    return `${usageLabel} ${usageDisplay}${resetSuffix}`;
}
function formatUsagePercent(percent, colors) {
    if (percent === null)
        return label("--", colors);
    const color = getQuotaColor(percent, colors);
    const padded = String(percent).padStart(3, ' ');
    return `${color}${padded} %${RESET}`;
}
//# sourceMappingURL=weekly-usage.js.map