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

  if (display?.showUsage === false) return null;
  if (!ctx.usageData) return null;
  if (shouldHideUsage(ctx.stdin)) return null;

  const sevenDay = ctx.usageData.sevenDay;
  if (sevenDay === null) return null;

  const usageLabel = progressLabel("label.weekly", colors, alignLabels);
  const timeFormat: TimeFormatMode = display?.timeFormat ?? 'relative';
  const usageBarEnabled = display?.usageBarEnabled ?? true;
  const barWidth = getAdaptiveBarWidth();

  const color = getQuotaColor(sevenDay, colors);
  const padded = String(sevenDay).padStart(3, ' ');
  const usageDisplay = `${color}${padded} %${RESET}`;
  const reset = formatResetTime(ctx.usageData.sevenDayResetAt, timeFormat);

  if (usageBarEnabled) {
    const resetSuffix = reset ? ` ${label('│', colors)} ${reset}` : '';
    return `${usageLabel} ${quotaBar(sevenDay, barWidth, colors)} ${usageDisplay}${resetSuffix}`;
  }

  const resetSuffix = reset ? ` ${label('│', colors)} ${reset}` : '';
  return `${usageLabel} ${usageDisplay}${resetSuffix}`;
}
