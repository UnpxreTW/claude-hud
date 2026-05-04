import { shouldHideUsage } from "../../stdin.js";
import { getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { progressLabel } from "./label-align.js";
import { formatResetTime } from "../format-reset-time.js";
export function renderWeeklyUsageLine(ctx, alignLabels = false) {
    const display = ctx.config?.display;
    const colors = ctx.config?.colors;
    if (display?.showUsage === false) {
        return null;
    }
    if (!ctx.usageData || ctx.usageData.sevenDay === null) {
        return null;
    }
    if (shouldHideUsage(ctx.stdin)) {
        return null;
    }
    const sevenDay = ctx.usageData.sevenDay;
    const timeFormat = display?.timeFormat ?? 'relative';
    const usageBarEnabled = display?.usageBarEnabled ?? true;
    const barWidth = getAdaptiveBarWidth();
    const weeklyLabel = progressLabel("label.weekly", colors, alignLabels);
    const reset = formatResetTime(ctx.usageData.sevenDayResetAt, timeFormat);
    const color = getQuotaColor(sevenDay, colors);
    const padded = String(sevenDay).padStart(3, ' ');
    const usageDisplay = `${color}${padded} %${RESET}`;
    const resetSuffix = reset ? `│ ${reset}` : "";
    if (usageBarEnabled) {
        const body = resetSuffix
            ? `${quotaBar(sevenDay, barWidth, colors)} ${usageDisplay} ${resetSuffix}`
            : `${quotaBar(sevenDay, barWidth, colors)} ${usageDisplay}`;
        return `${weeklyLabel} ${body}`;
    }
    return resetSuffix
        ? `${weeklyLabel} ${usageDisplay} ${resetSuffix}`
        : `${weeklyLabel} ${usageDisplay}`;
}
//# sourceMappingURL=weekly-usage.js.map