import type { RenderContext } from "../../types.js";
import type { MessageKey } from "../../i18n/types.js";
import { shouldHideUsage } from "../../stdin.js";
import { label, getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { t } from "../../i18n/index.js";
import { progressLabel } from "./label-align.js";
import type { TimeFormatMode } from "../../config.js";
import { formatResetTime } from "../format-reset-time.js";

export function renderUsageLine(
  ctx: RenderContext,
  alignLabels = false,
): string | null {
  const display = ctx.config?.display;
  const colors = ctx.config?.colors;

  if (display?.showUsage === false) {
    return null;
  }

  if (!ctx.usageData) {
    return null;
  }

  if (shouldHideUsage(ctx.stdin)) {
    return null;
  }

  const usageLabel = progressLabel("label.usage", colors, alignLabels);
  const timeFormat: TimeFormatMode = display?.timeFormat ?? 'relative';
  const usageCompact = display?.usageCompact ?? false;

  const threshold = display?.usageThreshold ?? 0;
  const fiveHour = ctx.usageData.fiveHour;
  const sevenDay = ctx.usageData.sevenDay;

  const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);
  if (effectiveUsage < threshold) {
    return null;
  }

  const sevenDayThreshold = display?.sevenDayThreshold ?? 80;

  if (usageCompact) {
    const fiveHourPart = fiveHour !== null
      ? formatCompactWindowPart("5h", fiveHour, ctx.usageData.fiveHourResetAt, timeFormat, colors)
      : null;
    const sevenDayPart = (sevenDay !== null && (fiveHour === null || sevenDay >= sevenDayThreshold))
      ? formatCompactWindowPart("7d", sevenDay, ctx.usageData.sevenDayResetAt, timeFormat, colors)
      : null;

    if (fiveHourPart && sevenDayPart) {
      return `${fiveHourPart} | ${sevenDayPart}`;
    }
    return fiveHourPart ?? sevenDayPart ?? null;
  }

  const usageBarEnabled = display?.usageBarEnabled ?? true;
  const barWidth = getAdaptiveBarWidth();

  if (fiveHour === null && sevenDay !== null) {
    const weeklyOnlyPart = formatUsageWindowPart({
      label: t("label.weekly"),
      labelKey: "label.weekly",
      percent: sevenDay,
      resetAt: ctx.usageData.sevenDayResetAt,
      colors,
      usageBarEnabled,
      barWidth,
      timeFormat,
      forceLabel: true,
      alignLabels,
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
    timeFormat,
  });

  return `${usageLabel} ${fiveHourPart}`;
}

function formatCompactWindowPart(
  windowLabel: string,
  percent: number | null,
  resetAt: Date | null,
  timeFormat: TimeFormatMode,
  colors?: RenderContext["config"]["colors"],
): string {
  const usageDisplay = formatUsagePercent(percent, colors);
  const reset = formatResetTime(resetAt, timeFormat);
  const styledLabel = label(`${windowLabel}:`, colors);
  return reset
    ? `${styledLabel} ${usageDisplay} │ ${reset}`
    : `${styledLabel} ${usageDisplay}`;
}

function formatUsagePercent(
  percent: number | null,
  colors?: RenderContext["config"]["colors"],
): string {
  if (percent === null) {
    return label("--", colors);
  }
  const color = getQuotaColor(percent, colors);
  const padded = String(percent).padStart(3, ' ');
  return `${color}${padded} %${RESET}`;
}

function formatUsageWindowPart({
  label: windowLabel,
  labelKey,
  percent,
  resetAt,
  colors,
  usageBarEnabled,
  barWidth,
  timeFormat = 'relative',
  forceLabel = false,
  alignLabels = false,
}: {
  label: string;
  labelKey?: MessageKey;
  percent: number | null;
  resetAt: Date | null;
  colors?: RenderContext["config"]["colors"];
  usageBarEnabled: boolean;
  barWidth: number;
  timeFormat?: TimeFormatMode;
  forceLabel?: boolean;
  alignLabels?: boolean;
}): string {
  const usageDisplay = formatUsagePercent(percent, colors);
  const reset = formatResetTime(resetAt, timeFormat);
  const styledLabel = labelKey
    ? progressLabel(labelKey, colors, alignLabels)
    : label(windowLabel, colors);

  const resetSuffix = reset ? `│ ${reset}` : "";

  if (usageBarEnabled) {
    const body = resetSuffix
      ? `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay} ${resetSuffix}`
      : `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay}`;
    return forceLabel ? `${styledLabel} ${body}` : body;
  }

  return resetSuffix
    ? `${styledLabel} ${usageDisplay} ${resetSuffix}`
    : `${styledLabel} ${usageDisplay}`;
}
