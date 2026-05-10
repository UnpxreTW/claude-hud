import type { TimeFormatMode } from '../config.js';
import { t } from '../i18n/index.js';
import { getLanguage } from '../i18n/index.js';

export function formatResetTime(resetAt: Date | null, mode: TimeFormatMode = 'relative'): string {
  if (!resetAt) return '';

  const now = new Date();
  const diffMs = resetAt.getTime() - now.getTime();
  if (diffMs <= 0) {
    return getLanguage() === 'zh-TW' ? '即將重置' : '';
  }

  if (getLanguage() === 'zh-TW') {
    return formatResetTimeZhTW(resetAt, now, diffMs);
  }

  if (mode === 'relative') {
    return formatRelative(diffMs);
  }

  const absolute = formatAbsolute(resetAt, now);

  if (mode === 'absolute') {
    return absolute;
  }

  return `${formatRelative(diffMs)}, ${absolute}`;
}

function formatResetTimeZhTW(resetAt: Date, now: Date, diffMs: number): string {
  const relative = formatRelativeZhTW(diffMs);
  const hours = resetAt.getHours().toString().padStart(2, '0');
  const minutes = resetAt.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (resetAt.toDateString() === now.toDateString()) {
    return `於 ${timeStr} 重置（${relative}）`;
  }

  const month = resetAt.getMonth() + 1;
  const day = resetAt.getDate();
  return `${month} 月 ${day} 號 ${timeStr} 重置（${relative}）`;
}

function formatRelativeZhTW(diffMs: number): string {
  const diffMins = Math.ceil(diffMs / 60000);

  if (diffMins < 1) return '< 1 分鐘';
  if (diffMins < 60) return `${diffMins} 分鐘`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days} 天 ${remHours} 小時` : `${days} 天`;
  }

  return mins > 0 ? `${hours} 小時 ${mins} 分鐘` : `${hours} 小時`;
}

function formatRelative(diffMs: number): string {
  const diffMins = Math.ceil(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatAbsolute(resetAt: Date, now: Date): string {
  // The "at" prefix is i18n-aware. Locales that bake the preposition into
  // "format.resets" (e.g. zh: "重置于") set "format.at" to "" so the time
  // is returned bare ("14:30") and the preposition is supplied by the caller.
  const at = t('format.at');
  const prefix = at ? `${at} ` : '';
  const timeStr = resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Show the date only when the reset falls on a different calendar day
  if (resetAt.toDateString() === now.toDateString()) {
    return `${prefix}${timeStr}`;
  }

  const dateStr = resetAt.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${prefix}${dateStr} ${timeStr}`;
}
