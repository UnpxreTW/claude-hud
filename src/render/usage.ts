import type { MessageKey } from '../i18n/types.js';
import { t } from '../i18n/index.js';
import { FIVE_HOUR_WINDOW_MS, SEVEN_DAY_WINDOW_MS, isPaceAlert, resolveUsagePaces, type UsagePace } from '../usage-pace.js';
import type { Frame, Layout } from './frame.js';
import { formatQuotaPercent, label, quotaBar } from './colors.js';
import { barLabel, type LabelAlign } from './labels.js';
import { formatWindowTime, wallClock } from './time.js';

interface UsageWindow {
  label: string;
  /** Aligned label key for stacked bars (the weekly window). */
  labelKey?: MessageKey;
  percent: number | null;
  resetAt: Date | null;
  windowMs: number;
  pace: UsagePace | null;
  /** Prefix the label even in bar mode. */
  forceLabel?: boolean;
  /** Compact bars show `(1h 30m / 5h)`; this names the window after the slash. */
  durationLabel?: string;
}

function formatWindow(f: Frame, layout: Layout, w: UsageWindow, align: LabelAlign): string {
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
 * The five-hour usage window (plus any model-scoped weekly windows) as
 * separator-joined parts. The main weekly window is its own `weeklyUsage`
 * element now, so this no longer renders it. Expanded joins the parts into one
 * line; compact lays them out with the rest of its line and leaves `Usage` off
 * the limit and below-threshold parts.
 */
export function usageParts(f: Frame, layout: Layout, align: LabelAlign = {}): string[] | null {
  const display = f.config?.display;
  const usage = f.usageData;
  if (display?.showUsage === false || !usage) return null;

  const colors = f.config?.colors;
  const compact = layout === 'compact';
  const usageLabel = barLabel('label.usage', colors, align);
  const withLabel = (part: string): string => `${usageLabel} ${part}`;
  const balance = usage.balanceLabel ?? null;
  const withBalance = (parts: string[]): string[] => (balance ? [...parts, balance] : parts);
  const scopedWindows = display?.showModelScopedUsage === false ? [] : usage.scopedWindows ?? [];
  const hasWindowData = usage.fiveHour !== null || scopedWindows.length > 0;

  if (balance && !hasWindowData) return [withLabel(balance)];

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

  // Weekly rides its own element, so its pace no longer reveals the five-hour row.
  const alert = [paces.fiveHour, ...paces.scoped].some(isPaceAlert);
  const effectiveUsage = Math.max(usage.fiveHour ?? 0, ...scopedWindows.map((w) => w.percent ?? 0));
  if (effectiveUsage < (display?.usageThreshold ?? 0) && !alert) {
    return balance ? [compact ? balance : withLabel(balance)] : null;
  }

  const fiveHour = (): string => formatWindow(f, layout, {
    label: '5h',
    percent: usage.fiveHour,
    resetAt: usage.fiveHourResetAt,
    windowMs: FIVE_HOUR_WINDOW_MS,
    pace: paces.fiveHour,
  }, align);

  if (display?.usageCompact) {
    const windows = [usage.fiveHour !== null ? fiveHour() : null].filter((part): part is string => part !== null);
    const parts = [...windows, ...scoped];
    return parts.length > 0 ? withBalance(parts) : null;
  }

  if (usage.fiveHour === null) {
    const [first, ...rest] = scoped;
    return first ? withBalance([withLabel(first), ...rest]) : balance ? [withLabel(balance)] : null;
  }

  const parts = [withLabel(fiveHour())];
  return withBalance([...parts, ...scoped]);
}

/**
 * The weekly (7-day) usage window as its own always-visible element, mirroring
 * the five-hour usage line (label, bar, percentage, reset time). It honours the
 * `sevenDayThreshold` gate (default 0, so always shown) instead of riding the
 * usage element's threshold, and no longer prefixes the `Usage` label.
 */
export function weeklyUsageParts(f: Frame, layout: Layout, align: LabelAlign = {}): string[] | null {
  const display = f.config?.display;
  const usage = f.usageData;
  if (display?.showUsage === false || !usage || usage.sevenDay === null) return null;

  const paces = resolveUsagePaces(usage, [], display, f.now);
  if (!paces.showSevenDay) return null;

  const weekly = formatWindow(f, layout, {
    label: display?.usageCompact ? '7d' : t('label.weekly'),
    labelKey: 'label.weekly',
    percent: usage.sevenDay,
    resetAt: usage.sevenDayResetAt,
    windowMs: SEVEN_DAY_WINDOW_MS,
    pace: paces.sevenDay,
    forceLabel: true,
  }, align);
  return [weekly];
}
