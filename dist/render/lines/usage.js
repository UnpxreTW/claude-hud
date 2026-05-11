import { shouldHideUsage } from "../../stdin.js";
import { getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { progressLabel } from "./label-align.js";
import { formatResetTime } from "../format-reset-time.js";
export function renderUsageLine(ctx, alignLabels = false) {
    const display = ctx.config?.display;
    const colors = ctx.config?.colors;
    if (display?.showUsage === false)
        return null;
    if (!ctx.usageData)
        return null;
    if (shouldHideUsage(ctx.stdin))
        return null;
    const fiveHour = ctx.usageData.fiveHour;
    if (fiveHour === null)
        return null;
    const threshold = display?.usageThreshold ?? 0;
    if (fiveHour < threshold)
        return null;
    const usageLabel = progressLabel("label.usage", colors, alignLabels);
    const timeFormat = display?.timeFormat ?? 'relative';
    const usageBarEnabled = display?.usageBarEnabled ?? true;
    const barWidth = getAdaptiveBarWidth();
    const color = getQuotaColor(fiveHour, colors);
    const padded = String(fiveHour).padStart(3, ' ');
    const usageDisplay = `${color}${padded} %${RESET}`;
    const reset = formatResetTime(ctx.usageData.fiveHourResetAt, timeFormat);
    if (usageBarEnabled) {
        const resetSuffix = reset ? ` │ ${reset}` : '';
        return `${usageLabel} ${quotaBar(fiveHour, barWidth, colors)} ${usageDisplay}${resetSuffix}`;
    }
    const resetSuffix = reset ? ` │ ${reset}` : '';
    return `${usageLabel} ${usageDisplay}${resetSuffix}`;
}
//# sourceMappingURL=usage.js.map