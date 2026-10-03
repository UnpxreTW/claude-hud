import type { ContextUsage } from '../stdin.js';
import { interpolate, t } from '../i18n/index.js';

/** `1.2M`, `45k`, or `800`. */
export function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

/** A percentage padded to a 3-char number plus ` %`, e.g. `  1 %`, ` 11 %`, `100 %`. */
export function padPercent(n: number): string {
  return `${String(n).padStart(3)} %`;
}

// percent → "45 %", tokens → "45k/200k", remaining → " 55 %", both → "45 % (45k/200k)".
export function formatContextValue(
  context: ContextUsage,
  mode: 'percent' | 'tokens' | 'remaining' | 'both',
): string {
  const { percent, tokens, size } = context;
  const ratio = size > 0 ? `${formatTokens(tokens)}/${formatTokens(size)}` : formatTokens(tokens);
  if (mode === 'tokens') return ratio;
  if (mode === 'both') return size > 0 ? `${padPercent(percent)} (${ratio})` : padPercent(percent);
  if (mode === 'remaining') return padPercent(Math.max(0, 100 - percent));
  return padPercent(percent);
}

// Units come from the locale's pattern strings, so CJK renders e.g. `1 小時 30 分鐘`
// while English keeps `1h 30m`. No raw language tag is compared here.
export function formatSessionDuration(ms: number | null | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return t('format.durationUnder1Min');
  if (mins < 60) return interpolate(t('format.durationMinutes'), { m: mins });
  return interpolate(t('format.durationHourMinutes'), { h: Math.floor(mins / 60), m: mins % 60 });
}
