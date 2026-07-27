import type { RenderContext } from '../../types.js';
import { label } from '../colors.js';
import { t } from '../../i18n/index.js';
import { formatTokens } from '../../utils/format.js';

export function formatSessionTokenSummary(
  tokens: NonNullable<RenderContext['transcript']['sessionTokens']>,
  prefix: string,
  /**
   * Separator between the prefix and the total. Defaults to a plain space for
   * the expanded line, whose prefix is a bare noun rather than a label; the
   * compact line passes the locale's label separator instead.
   */
  prefixSeparator = ' ',
): string | null {
  const total = tokens.inputTokens + tokens.outputTokens + tokens.cacheCreationTokens + tokens.cacheReadTokens;
  if (total === 0) {
    return null;
  }

  const separator = t('format.labelSeparator');
  const parts: string[] = [
    `${t('format.in')}${separator}${formatTokens(tokens.inputTokens)}`,
    `${t('format.out')}${separator}${formatTokens(tokens.outputTokens)}`,
  ];

  if (tokens.cacheCreationTokens > 0 || tokens.cacheReadTokens > 0) {
    parts.push(`${t('format.cache')}${separator}${formatTokens(tokens.cacheCreationTokens + tokens.cacheReadTokens)}`);
  }

  return `${prefix}${prefixSeparator}${formatTokens(total)} (${parts.join(', ')})`;
}

export function renderSessionTokensLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  if (display?.showSessionTokens === false) {
    return null;
  }

  const tokens = ctx.transcript.sessionTokens;
  if (!tokens) {
    return null;
  }

  const colors = ctx.config?.colors;
  const summary = formatSessionTokenSummary(tokens, t('label.tokens'));
  return summary ? label(summary, colors) : null;
}
