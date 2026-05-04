import type { RenderContext } from "../../types.js";
import { shouldHideUsage } from "../../stdin.js";
import { label, getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { t } from "../../i18n/index.js";
import { progressLabel } from "./label-align.js";
import type { TimeFormatMode } from "../../config.js";
import { formatResetTime } from "../format-reset-time.js";

export function renderWeeklyUsageLine(
  ctx: RenderContext,
  alignLabels = false,
): string | null {
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
  const timeFormat: TimeFormatMode = display?.timeFormat ?? 'relative';
  const showResetLabel = display?.showResetLabel ?? true;
  const resetsKey = timeFormat === 'absolute' ? "format.resets" : "format.resetsIn";
  const usageBarEnabled = display?.usageBarEnabled ?? true;
  const barWidth = getAdaptiveBarWidth();

  const weeklyLabel = progressLabel("label.weekly", colors, alignLabels);
  const reset = formatResetTime(ctx.usageData.sevenDayResetAt, timeFormat);
  const color = getQuotaColor(sevenDay, colors);
  const padded = String(sevenDay).padStart(3, ' ');
  const usageDisplay = `${color}${padded} %${RESET}`;

  const resetSuffix = reset
    ? showResetLabel
      ? `(${t(resetsKey)} ${reset})`
      : `(${reset})`
    : "";

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
