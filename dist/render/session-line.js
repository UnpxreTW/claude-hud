import { getContextPercent, getBufferedPercent, getModelName, formatModelName, getProviderLabel, getTotalTokens, shouldHideUsage } from '../stdin.js';
import { getOutputSpeed } from '../speed-tracker.js';
import { coloredBar, git as gitColor, gitBranch as gitBranchColor, label, model as modelColor, project as projectColor, getContextColor, getQuotaColor, quotaBar, custom as customColor, RESET } from './colors.js';
import { getAdaptiveBarWidth } from '../utils/terminal.js';
import { renderCostEstimate } from './lines/cost.js';
import { renderPromptCacheLine } from './lines/prompt-cache.js';
import { t } from '../i18n/index.js';
import { formatResetTime } from './format-reset-time.js';
const DEBUG = process.env.DEBUG?.includes('claude-hud') || process.env.DEBUG === '*';
/**
 * Renders the full session line (model + context bar + project + git + counts + usage + duration).
 * Used for compact layout mode.
 */
export function renderSessionLine(ctx) {
    const model = formatModelName(getModelName(ctx.stdin), ctx.config?.display?.modelFormat, ctx.config?.display?.modelOverride);
    const rawPercent = getContextPercent(ctx.stdin);
    const bufferedPercent = getBufferedPercent(ctx.stdin);
    const autocompactMode = ctx.config?.display?.autocompactBuffer ?? 'enabled';
    const percent = autocompactMode === 'disabled' ? rawPercent : bufferedPercent;
    if (DEBUG && autocompactMode === 'disabled') {
        console.error(`[claude-hud:context] autocompactBuffer=disabled, showing raw ${rawPercent}% (buffered would be ${bufferedPercent}%)`);
    }
    const colors = ctx.config?.colors;
    const display = ctx.config?.display;
    const contextThresholds = {
        warning: display?.contextWarningThreshold,
        critical: display?.contextCriticalThreshold,
    };
    const barWidth = getAdaptiveBarWidth();
    const bar = coloredBar(percent, barWidth, colors, contextThresholds);
    const parts = [];
    const timeFormat = display?.timeFormat ?? 'relative';
    const contextValueMode = display?.contextValue ?? 'percent';
    const contextValue = formatContextValue(ctx, percent, contextValueMode);
    const contextValueDisplay = `${getContextColor(percent, colors, contextThresholds)}${contextValue}${RESET}`;
    // Model and context bar (FIRST)
    const providerLabel = getProviderLabel(ctx.stdin);
    const modelQualifier = providerLabel ?? undefined;
    let modelDisplay = modelQualifier ? `${model} | ${modelQualifier}` : model;
    if (ctx.effortLevel && ctx.effortSymbol) {
        modelDisplay += ` ${ctx.effortSymbol} ${ctx.effortLevel}`;
    }
    else if (ctx.effortLevel) {
        modelDisplay += ` ${ctx.effortLevel}`;
    }
    if (display?.showModel !== false && display?.showContextBar !== false) {
        parts.push(`${modelColor(`[${modelDisplay}]`, colors)} ${bar} ${contextValueDisplay}`);
    }
    else if (display?.showModel !== false) {
        parts.push(`${modelColor(`[${modelDisplay}]`, colors)} ${contextValueDisplay}`);
    }
    else if (display?.showContextBar !== false) {
        parts.push(`${bar} ${contextValueDisplay}`);
    }
    else {
        parts.push(contextValueDisplay);
    }
    const customLine = display?.customLine;
    if (customLine) {
        parts.push(customColor(customLine, colors));
    }
    // Project path + git status
    let projectPart = null;
    if (display?.showProject !== false && ctx.stdin.cwd) {
        // Split by both Unix (/) and Windows (\) separators for cross-platform support
        const segments = ctx.stdin.cwd.split(/[/\\]/).filter(Boolean);
        const pathLevels = ctx.config?.pathLevels ?? 1;
        // Always join with forward slash for consistent display
        // Handle root path (/) which results in empty segments
        const projectPath = segments.length > 0 ? segments.slice(-pathLevels).join('/') : '/';
        projectPart = projectColor(projectPath, colors);
    }
    let gitPart = '';
    const gitConfig = ctx.config?.gitStatus;
    const showGit = gitConfig?.enabled ?? true;
    const branchOverflow = gitConfig?.branchOverflow ?? 'truncate';
    if (showGit && ctx.gitStatus) {
        const gitParts = [ctx.gitStatus.branch];
        // Show dirty indicator
        if ((gitConfig?.showDirty ?? true) && ctx.gitStatus.isDirty) {
            gitParts.push('*');
        }
        // Show ahead/behind (with space separator for readability)
        if (gitConfig?.showAheadBehind) {
            if (ctx.gitStatus.ahead > 0) {
                gitParts.push(` ↑${ctx.gitStatus.ahead}`);
            }
            if (ctx.gitStatus.behind > 0) {
                gitParts.push(` ↓${ctx.gitStatus.behind}`);
            }
        }
        // Show file stats in Starship-compatible format (!modified +added ✘deleted ?untracked)
        if (gitConfig?.showFileStats && ctx.gitStatus.fileStats) {
            const { modified, added, deleted, untracked } = ctx.gitStatus.fileStats;
            const statParts = [];
            if (modified > 0)
                statParts.push(`!${modified}`);
            if (added > 0)
                statParts.push(`+${added}`);
            if (deleted > 0)
                statParts.push(`✘${deleted}`);
            if (untracked > 0)
                statParts.push(`?${untracked}`);
            if (statParts.length > 0) {
                gitParts.push(` ${statParts.join(' ')}`);
            }
        }
        gitPart = `${gitColor('git:(', colors)}${gitBranchColor(gitParts.join(''), colors)}${gitColor(')', colors)}`;
    }
    if (projectPart && gitPart) {
        if (branchOverflow === 'wrap') {
            parts.push(projectPart);
            parts.push(gitPart);
        }
        else {
            parts.push(`${projectPart} ${gitPart}`);
        }
    }
    else if (projectPart) {
        parts.push(projectPart);
    }
    else if (gitPart) {
        parts.push(gitPart);
    }
    // Session name (custom title from /rename, or auto-generated slug)
    if (display?.showSessionName && ctx.transcript.sessionName) {
        parts.push(label(ctx.transcript.sessionName, colors));
    }
    if (display?.showClaudeCodeVersion && ctx.claudeCodeVersion) {
        parts.push(label(`CC v${ctx.claudeCodeVersion}`, colors));
    }
    // Config counts (respects environmentThreshold)
    if (display?.showConfigCounts !== false) {
        const totalCounts = ctx.claudeMdCount + ctx.rulesCount + ctx.mcpCount + ctx.hooksCount;
        const envThreshold = display?.environmentThreshold ?? 0;
        if (totalCounts > 0 && totalCounts >= envThreshold) {
            if (ctx.claudeMdCount > 0) {
                parts.push(label(`${ctx.claudeMdCount} CLAUDE.md`, colors));
            }
            if (ctx.rulesCount > 0) {
                parts.push(label(`${ctx.rulesCount} ${t('label.rules')}`, colors));
            }
            if (ctx.mcpCount > 0) {
                parts.push(label(`${ctx.mcpCount} MCPs`, colors));
            }
            if (ctx.hooksCount > 0) {
                parts.push(label(`${ctx.hooksCount} ${t('label.hooks')}`, colors));
            }
        }
    }
    if (display?.showUsage !== false && ctx.usageData && !shouldHideUsage(ctx.stdin)) {
        const fiveHour = ctx.usageData.fiveHour;
        const usageThreshold = display?.usageThreshold ?? 0;
        if (fiveHour !== null && fiveHour >= usageThreshold) {
            const usageBarEnabled = display?.usageBarEnabled ?? true;
            const color = getQuotaColor(fiveHour, colors);
            const padded = String(fiveHour).padStart(3, ' ');
            const usageDisplay = `${color}${padded} %${RESET}`;
            const reset = formatResetTime(ctx.usageData.fiveHourResetAt, timeFormat);
            const resetSuffix = reset ? ` │ ${reset}` : '';
            if (usageBarEnabled) {
                parts.push(`${label(t('label.usage'), colors)} ${quotaBar(fiveHour, barWidth, colors)} ${usageDisplay}${resetSuffix}`);
            }
            else {
                parts.push(`${label(t('label.usage'), colors)} ${usageDisplay}${resetSuffix}`);
            }
        }
    }
    // Session token usage (cumulative)
    if (display?.showSessionTokens && ctx.transcript.sessionTokens) {
        const st = ctx.transcript.sessionTokens;
        const total = st.inputTokens + st.outputTokens + st.cacheCreationTokens + st.cacheReadTokens;
        if (total > 0) {
            const tokenSep = ctx.config?.language === 'zh-TW' ? ' ' : ', ';
            parts.push(label(`${t('format.tok')}: ${formatTokens(total)} (${t('format.in')}: ${formatTokens(st.inputTokens)}${tokenSep}${t('format.out')}: ${formatTokens(st.outputTokens)})`, colors));
        }
    }
    if (display?.showDuration !== false) {
        if (ctx.sessionDuration) {
            const durationPrefix = ctx.config?.language === 'zh-TW' ? '⏱️ 執行時間：' : '⏱️  ';
            parts.push(label(`${durationPrefix}${ctx.sessionDuration}`, colors));
        }
        else {
            parts.push(label('⏱️ --', colors));
        }
    }
    const promptCacheLine = renderPromptCacheLine(ctx);
    if (promptCacheLine) {
        parts.push(promptCacheLine);
    }
    const costEstimate = renderCostEstimate(ctx);
    if (costEstimate) {
        parts.push(costEstimate);
    }
    if (display?.showSpeed) {
        const speed = getOutputSpeed(ctx.stdin);
        if (speed !== null) {
            parts.push(label(`${t('format.out')}: ${speed.toFixed(1)} ${t('format.tokPerSec')}`, colors));
        }
    }
    if (ctx.extraLabel) {
        parts.push(label(ctx.extraLabel, colors));
    }
    let line = parts.join(' | ');
    // Token breakdown at high context
    if (display?.showTokenBreakdown !== false && percent >= (display?.contextCriticalThreshold ?? 85)) {
        const usage = ctx.stdin.context_window?.current_usage;
        if (usage) {
            const input = formatTokens(usage.input_tokens ?? 0);
            const cache = formatTokens((usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0));
            line += label(` (${t('format.in')}: ${input}, ${t('format.cache')}: ${cache})`, colors);
        }
    }
    return line;
}
function formatTokens(n) {
    if (n >= 1000000) {
        return `${(n / 1000000).toFixed(1)}M`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(0)}k`;
    }
    return n.toString();
}
function padPercent(n) {
    return `${String(n).padStart(3, ' ')} %`;
}
function formatContextValue(ctx, percent, mode) {
    const totalTokens = getTotalTokens(ctx.stdin);
    const size = ctx.stdin.context_window?.context_window_size ?? 0;
    if (mode === 'tokens') {
        if (size > 0) {
            return `${formatTokens(totalTokens)}/${formatTokens(size)}`;
        }
        return formatTokens(totalTokens);
    }
    if (mode === 'both') {
        if (size > 0) {
            return `${padPercent(percent)} (${formatTokens(totalTokens)}/${formatTokens(size)})`;
        }
        return padPercent(percent);
    }
    if (mode === 'remaining') {
        return padPercent(Math.max(0, 100 - percent));
    }
    return padPercent(percent);
}
//# sourceMappingURL=session-line.js.map