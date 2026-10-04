import type { Frame, Layout } from './frame.js';
import { type LabelAlign } from './labels.js';
/**
 * The five-hour usage window (plus any model-scoped weekly windows) as
 * separator-joined parts. The main weekly window is its own `weeklyUsage`
 * element now, so this no longer renders it. Expanded joins the parts into one
 * line; compact lays them out with the rest of its line and leaves `Usage` off
 * the limit and below-threshold parts.
 */
export declare function usageParts(f: Frame, layout: Layout, align?: LabelAlign): string[] | null;
/**
 * The weekly (7-day) usage window as its own always-visible element, mirroring
 * the five-hour usage line (label, bar, percentage, reset time). It honours the
 * `sevenDayThreshold` gate (default 0, so always shown) instead of riding the
 * usage element's threshold, and no longer prefixes the `Usage` label.
 */
export declare function weeklyUsageParts(f: Frame, layout: Layout, align?: LabelAlign): string[] | null;
//# sourceMappingURL=usage.d.ts.map