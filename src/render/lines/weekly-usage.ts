import type { RenderContext } from "../../types.js";
import { getProviderLabel } from "../../stdin.js";
import { label, getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { t } from "../../i18n/index.js";

export function renderWeeklyUsageLine(ctx: RenderContext): string | null {
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

  const sevenDay = ctx.usageData.sevenDay;
  if (sevenDay === null) {
    return null;
  }

  const weeklyLabel = label(t("label.weekly"), colors);
  const barWidth = getAdaptiveBarWidth();
  const usageBarEnabled = display?.usageBarEnabled ?? true;

  const usageDisplay = formatUsagePercent(sevenDay, colors);
  const reset = formatResetTime(ctx.usageData.sevenDayResetAt);

  if (usageBarEnabled) {
    const body = reset
      ? `${quotaBar(sevenDay, barWidth, colors)} ${usageDisplay} │ ${reset}`
      : `${quotaBar(sevenDay, barWidth, colors)} ${usageDisplay}`;
    return `${weeklyLabel}  ${body}`;
  }

  return reset
    ? `${weeklyLabel} ${usageDisplay} │ ${reset}`
    : `${weeklyLabel} ${usageDisplay}`;
}

function formatUsagePercent(
  percent: number | null,
  colors?: RenderContext["config"]["colors"],
): string {
  if (percent === null) {
    return label("--", colors);
  }
  const color = getQuotaColor(percent, colors);
  return `${color}${String(percent).padStart(3)} %${RESET}`;
}

function formatResetTime(resetAt: Date | null): string {
  if (!resetAt) return "";
  const month = resetAt.getMonth() + 1;
  const day = resetAt.getDate();
  const hh = String(resetAt.getHours()).padStart(2, "0");
  return `${month} 月 ${day} 號 ${hh}:00 重置`;
}
