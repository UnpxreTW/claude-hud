import type { RenderContext } from "../../types.js";
import { isLimitReached } from "../../types.js";
import type { MessageKey } from "../../i18n/types.js";
import { shouldHideUsage } from "../../stdin.js";
import { critical, label, getQuotaColor, quotaBar, RESET } from "../colors.js";
import { getAdaptiveBarWidth } from "../../utils/terminal.js";
import { t } from "../../i18n/index.js";
import { progressLabel } from "./label-align.js";
import type { TimeFormatMode, UsageValueMode } from "../../config.js";
import { formatResetTime } from "../format-reset-time.js";

const FIVE_HOUR_WINDOW_MS = 5 * 60 * 60 * 1000;
const SEVEN_DAY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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

  if (ctx.usageData.balanceLabel) {
    return `${usageLabel} ${ctx.usageData.balanceLabel}`;
  }

  const timeFormat = normalizeTimeFormat(display?.timeFormat);
  const showResetLabel = display?.showResetLabel ?? true;
  const resetsKey = limitResetTimeFormat(timeFormat) === 'absolute' ? "format.resets" : "format.resetsIn";
  const usageCompact = display?.usageCompact ?? false;
  const usageValueMode = display?.usageValue ?? 'percent';

  if (isLimitReached(ctx.usageData)) {
    const limitTimeFormat = limitResetTimeFormat(timeFormat);
    const resetTime =
      ctx.usageData.fiveHour === 100
        ? formatResetTime(ctx.usageData.fiveHourResetAt, limitTimeFormat)
        : formatResetTime(ctx.usageData.sevenDayResetAt, limitTimeFormat);
    if (usageCompact) {
      return critical(`⚠ Limit${resetTime ? ` (${resetTime})` : ""}`, colors);
    }
    const resetSuffix = resetTime
      ? showResetLabel
        ? ` (${t(resetsKey)} ${resetTime})`
        : ` (${resetTime})`
      : "";
    return `${usageLabel} ${critical(`⚠ ${t("status.limitReached")}${resetSuffix}`, colors)}`;
  }

  const threshold = display?.usageThreshold ?? 0;
  const fiveHour = ctx.usageData.fiveHour;

  // Weekly usage is rendered by the independent weeklyUsage element.
  if (fiveHour === null) {
    return null;
  }

  if (fiveHour < threshold) {
    return null;
  }

  if (usageCompact) {
    return formatCompactWindowPart("5h", fiveHour, ctx.usageData.fiveHourResetAt, FIVE_HOUR_WINDOW_MS, timeFormat, colors, usageValueMode);
  }

  const usageBarEnabled = display?.usageBarEnabled ?? true;
  const barWidth = getAdaptiveBarWidth();

  const fiveHourPart = formatUsageWindowPart({
    label: "5h",
    percent: fiveHour,
    resetAt: ctx.usageData.fiveHourResetAt,
    windowMs: FIVE_HOUR_WINDOW_MS,
    colors,
    usageBarEnabled,
    barWidth,
    timeFormat,
    showResetLabel,
    usageValueMode,
  });

  return `${usageLabel} ${fiveHourPart}`;
}

export function renderWeeklyUsageLine(
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

  const sevenDay = ctx.usageData.sevenDay;
  if (sevenDay === null) {
    return null;
  }

  const timeFormat = normalizeTimeFormat(display?.timeFormat);
  const showResetLabel = display?.showResetLabel ?? true;
  const usageCompact = display?.usageCompact ?? false;
  const usageValueMode = display?.usageValue ?? 'percent';

  // Always visible: the sevenDayThreshold gate is intentionally not applied.
  if (usageCompact) {
    return formatCompactWindowPart("7d", sevenDay, ctx.usageData.sevenDayResetAt, SEVEN_DAY_WINDOW_MS, timeFormat, colors, usageValueMode);
  }

  const usageBarEnabled = display?.usageBarEnabled ?? true;
  const barWidth = getAdaptiveBarWidth();

  return formatUsageWindowPart({
    label: t("label.weekly"),
    labelKey: "label.weekly",
    percent: sevenDay,
    resetAt: ctx.usageData.sevenDayResetAt,
    windowMs: SEVEN_DAY_WINDOW_MS,
    colors,
    usageBarEnabled,
    barWidth,
    timeFormat,
    showResetLabel,
    forceLabel: true,
    alignLabels,
    usageValueMode,
  });
}

function formatCompactWindowPart(
  windowLabel: string,
  percent: number | null,
  resetAt: Date | null,
  windowMs: number,
  timeFormat: TimeFormatMode,
  colors?: RenderContext["config"]["colors"],
  usageValueMode: UsageValueMode = 'percent',
): string {
  const usageDisplay = formatUsagePercent(percent, colors, usageValueMode);
  const reset = formatWindowTime(resetAt, windowMs, timeFormat);
  const styledLabel = label(`${windowLabel}:`, colors);
  return reset
    ? `${styledLabel} ${usageDisplay} ${label(`(${reset})`, colors)}`
    : `${styledLabel} ${usageDisplay}`;
}

function formatUsagePercent(
  percent: number | null,
  colors?: RenderContext["config"]["colors"],
  mode: UsageValueMode = 'percent',
): string {
  if (percent === null) {
    return label("--", colors);
  }
  const color = getQuotaColor(percent, colors);
  const displayPercent = mode === 'remaining' ? Math.max(0, 100 - percent) : percent;
  return `${color}${displayPercent}%${RESET}`;
}

function formatUsageWindowPart({
  label: windowLabel,
  labelKey,
  percent,
  resetAt,
  windowMs,
  colors,
  usageBarEnabled,
  barWidth,
  timeFormat = 'relative',
  showResetLabel,
  forceLabel = false,
  alignLabels = false,
  usageValueMode = 'percent',
}: {
  label: string;
  labelKey?: MessageKey;
  percent: number | null;
  resetAt: Date | null;
  windowMs: number;
  colors?: RenderContext["config"]["colors"];
  usageBarEnabled: boolean;
  barWidth: number;
  timeFormat?: TimeFormatMode;
  showResetLabel: boolean;
  forceLabel?: boolean;
  alignLabels?: boolean;
  usageValueMode?: UsageValueMode;
}): string {
  const usageDisplay = formatUsagePercent(percent, colors, usageValueMode);
  const reset = formatWindowTime(resetAt, windowMs, timeFormat);
  const styledLabel = labelKey
    ? progressLabel(labelKey, colors, alignLabels)
    : label(windowLabel, colors);
  const showResetWording = timeFormat !== 'elapsed' && timeFormat !== 'elapsedAndAbsolute';
  const resetsKey = timeFormat === 'absolute' ? "format.resets" : "format.resetsIn";

  const resetSuffix = reset
    ? showResetLabel && showResetWording
      ? `(${t(resetsKey)} ${reset})`
      : `(${reset})`
    : "";

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

function normalizeTimeFormat(value: unknown): TimeFormatMode {
  if (
    value === 'absolute'
    || value === 'both'
    || value === 'elapsed'
    || value === 'elapsedAndAbsolute'
  ) {
    return value;
  }

  return 'relative';
}

function limitResetTimeFormat(timeFormat: TimeFormatMode): 'relative' | 'absolute' | 'both' {
  if (timeFormat === 'elapsedAndAbsolute') {
    return 'absolute';
  }

  if (timeFormat === 'elapsed') {
    return 'relative';
  }

  return timeFormat;
}

function formatWindowTime(
  resetAt: Date | null,
  windowMs: number,
  timeFormat: TimeFormatMode,
): string {
  if (timeFormat === 'elapsed') {
    return formatElapsedWindow(resetAt, windowMs);
  }

  if (timeFormat === 'elapsedAndAbsolute') {
    const elapsed = formatElapsedWindow(resetAt, windowMs);
    const absolute = formatResetTime(resetAt, 'absolute');
    if (elapsed && absolute) {
      return `${elapsed}, ${absolute}`;
    }
    return elapsed || absolute;
  }

  return formatResetTime(resetAt, timeFormat);
}

function formatElapsedWindow(resetAt: Date | null, windowMs: number): string {
  if (!resetAt) {
    return '';
  }

  const windowStart = resetAt.getTime() - windowMs;
  const rawElapsed = ((Date.now() - windowStart) / windowMs) * 100;
  const elapsed = Math.max(0, Math.min(100, Math.round(rawElapsed)));
  return `${elapsed}% elapsed`;
}
