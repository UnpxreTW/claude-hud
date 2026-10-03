import type { ContextUsage } from '../stdin.js';
/** `1.2M`, `45k`, or `800`. */
export declare function formatTokens(n: number): string;
/** A percentage padded to a 3-char number plus ` %`, e.g. `  1 %`, ` 11 %`, `100 %`. */
export declare function padPercent(n: number): string;
export declare function formatContextValue(context: ContextUsage, mode: 'percent' | 'tokens' | 'remaining' | 'both'): string;
export declare function formatSessionDuration(ms: number | null | undefined): string;
//# sourceMappingURL=format.d.ts.map