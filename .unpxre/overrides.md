# Unpxre Custom Overrides for claude-hud

This file defines all customizations applied to the upstream claude-hud plugin.
The scheduled sync agent reads this file to re-apply overrides after merging
upstream updates.

## General Rules

- **Before applying any overrides, check for open PRs created by this sync
  agent.** If any unresolved PR exists (not yet merged or closed), process
  each one before continuing:
  1. Read the PR's review comments and CI check results
  2. If there are reviewer-requested changes or failing CI, check out the
     PR branch and apply fixes, then push the updated commits
  3. If the PR has no obvious issues (no review comments, CI passing),
     investigate what is blocking the merge — check for merge conflicts,
     missing approvals, branch protection requirements, or outdated
     branches. Fix what can be fixed (e.g. resolve conflicts, rebase on
     latest main) and leave a PR comment summarizing findings for
     @UnpxreTW
  4. If a PR's underlying override is no longer applicable (e.g. upstream
     resolved it), close the PR with a comment explaining why
  After all open PRs have been processed, continue with the normal sync
- Do not reference specific file paths — locate code by functionality
- If an override target no longer exists, check upstream commit history first
- If configurable via user config, prefer config over code modification and
  create an info Issue for @UnpxreTW
- If unresolvable, create a warning Issue for @UnpxreTW with details
- **Each override must be applied in its own separate commit and PR** —
  do not bundle multiple overrides into a single PR
- **When modifying code behavior, also update any related test cases** to
  match the new expected output. Run `npm run test:coverage` to verify
  before committing

---

## Override List

### 1. Move customLine to the front of the status line

Find the rendering logic for the main status line — the one that assembles
multiple display segments (model name, project path, git info, etc.) and joins
them with a separator.

Move `customLine` so it is rendered as the **first** segment of that line.

**If `customLine` no longer exists or the status line structure has changed
significantly:**
1. Check the upstream commit history for changes to this variable/feature
2. Determine if it was renamed, moved, or removed
3. If unresolvable, create a GitHub Issue titled
   `⚠ Override 1: customLine not found` and assign to @UnpxreTW

---

### 2. Localize session duration label and format

**Label:** Find where the session duration is displayed on the main status line.
Change the label to include `執行時間：` prefix (keep the ⏱️ emoji).
Note: there must be exactly one space between the emoji and `執行時間`.

**Format:** Find the function that formats session duration into a
human-readable string (e.g. `<1m`, `5m`, `1h 30m`).

First, check if the duration format is configurable via user config. If a
locale or format option already exists:
- Use it instead of modifying the formatting function directly
- Create a GitHub Issue titled
  `ℹ Override 2: duration format is now configurable` and assign to @UnpxreTW
  so the override can be replaced with a config setting
- Still apply the Chinese format for this sync via config if possible

If no config option exists, replace the format with Chinese units:
- Under 1 minute: `< 1 分鐘` (space before and after `1`)
- Minutes only: `{n} 分鐘` (space between number and unit)
- Hours and minutes: `{h} 小時 {m} 分鐘` (space between each number and unit)

**If the duration display or formatting function no longer exists:**
1. Check upstream commit history for changes
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 2: session duration format not found` and assign to @UnpxreTW

---

### 3. Increase terminal width fallback

The statusline runs in pipe mode where `process.stdout.columns` and
`process.env.COLUMNS` are both undefined. The terminal width detection
falls back to a default constant. The original default is too small,
causing lines to be excessively truncated.

Find the terminal width detection chain — trace from the main render
function to where it obtains the terminal width. Locate the fallback
constant used when all detection sources fail. Change its value to `120`.

First, check if this fallback is configurable via user config. If so:
- Use it instead of modifying the constant
- Create a GitHub Issue titled
  `ℹ Override 3: terminal width fallback is now configurable`
  and assign to @UnpxreTW

**If the terminal width detection logic has been significantly
restructured or the fallback constant no longer exists:**
1. Check upstream commit history for changes
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 3: terminal width fallback not found` and assign to @UnpxreTW

---

### 4. Add weekly usage as a separate line

The original `usage` element contains both five-hour and weekly usage data.
Weekly usage is hidden behind a threshold (only shown when exceeding ~80%).

Split weekly usage out into its own independent HUD element so it is always
visible as a separate line regardless of threshold.

Steps:
1. Add a new element type (e.g. `weeklyUsage`) to the HUD element type
   definition
2. Create a render function for weekly usage. The output format should
   follow the same pattern as the existing five-hour usage rendering:
   label, bar, percentage, and reset time — using the same bar function,
   color scheme, and layout spacing as the original
3. Remove weekly usage rendering from the original usage element so it
   only handles five-hour usage
4. Export and register the new render function in the render coordinator's
   element-to-renderer mapping
5. Update the default element order to:
   `[project, usage, weeklyUsage, context, ...]`
   — placing `weeklyUsage` after `usage` and before `context`, which
   naturally breaks the context+usage same-line combining logic

First, check if upstream has already separated weekly usage into its own
element. If so, skip this override and create a GitHub Issue titled
`ℹ Override 4: weekly usage already separated upstream` and assign to
@UnpxreTW.

**If the usage or element system has been significantly restructured:**
1. Check upstream commit history for changes
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 4: usage/element structure changed` and assign to @UnpxreTW

---

### 5. Change bar characters from blocks to dots

Find the functions that render quota/progress bars (the ones that produce
filled and empty segments using repeated characters like `█` and `░`).

Replace the filled character with `●` and the empty character with `○`.
Preserve the original color scheme — only change the characters.

First, check if bar characters are configurable via user config. If so:
- Use config instead of modifying the functions
- Create a GitHub Issue titled
  `ℹ Override 5: bar characters are now configurable` and assign to @UnpxreTW

**If the bar rendering functions no longer exist:**
1. Check upstream commit history for changes
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 5: bar rendering functions not found` and assign to @UnpxreTW

---

### 6. Add Traditional Chinese (Taiwan) locale

The project has an i18n system with `en` and `zh` (Simplified Chinese)
locales. Add a new `zh-TW` locale for Traditional Chinese (Taiwan).

Steps:
1. Add `zh-TW` to the Language type definition
2. Create the `zh-TW` locale file with these translations:
   - `label.usage`: `五小時上限`
   - `label.weekly`: `每週使用量`
   - `label.context`: `上下文佔用`
   - `label.approxRam`: `記憶體用量`
   - `label.rules`: `規則`
   - `label.hooks`: `hooks`
   - `label.estimatedCost`: `估算`
   - `label.cost`: `費用`
   - `status.limitReached`: `已達上限`
   - `status.allTodosComplete`: `全部完成`
   - `format.resets`: `重置於`
   - `format.resetsIn`: `重置剩餘`
   - `format.in`: `輸入`
   - `format.cache`: `快取`
   - `format.out`: `輸出`
   - `format.tokPerSec`: `tok/s`
   - `init.initializing`: `[claude-hud] 正在初始化...`
   - `init.macosNote`: `[claude-hud] 注意：在 macOS 上，您可能需要重啟 Claude Code 才能顯示 HUD。`
3. Register `zh-TW` in the locale registry
4. Update the language validation to accept `zh-TW`

Note: `label.usage` and `label.weekly` are intentionally different from
direct translation — they describe the specific rate limit windows
(`五小時上限` = five-hour limit, `每週使用量` = weekly usage).

If upstream adds a `zh-TW` locale natively, compare translations and
create a GitHub Issue titled `ℹ Override 6: zh-TW locale now available
upstream` and assign to @UnpxreTW.

**If the i18n system has been significantly restructured:**
1. Check upstream commit history for changes
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 6: i18n system changed` and assign to @UnpxreTW

---

### 7. Format percentages and bar spacing

**Percentage format:** Find all places where usage and context percentages
are displayed. Format the number with padding to 3 characters, followed by
a space and `%`:
- Single digit: `  1 %` (two leading spaces)
- Double digit: ` 11 %` (one leading space)
- Triple digit: `100 %` (no leading space)

This applies to:
- Five-hour usage percentage
- Weekly usage percentage
- Context usage percentage (all display modes that show `%`)

**Bar spacing:** Find all places where label, bar, and percentage are
assembled on the same line. Ensure exactly **two spaces** between label
and bar, and exactly **one space** between bar and percentage (the
percentage string itself already contains a leading space from padding).

**If percentage formatting or spacing has changed or is now configurable:**
1. Check upstream commit history
2. Create a GitHub Issue with details and assign to @UnpxreTW

---

### 8. Format five-hour reset time as clock time

Find where the five-hour usage reset time is formatted. The original
displays a countdown (e.g. `resets in 2h 30m`). Replace with actual
clock time:
- Before reset: `於 HH:MM 重置` (24-hour format, zero-padded)
- At or past reset time: `即將重置`
- No data: empty string

**If the reset time formatting has changed or is now configurable:**
1. Check upstream commit history
2. Create a GitHub Issue with details and assign to @UnpxreTW

---

### 9. Format weekly reset time with date

Find where the weekly usage reset time is formatted. Replace with:
- `{month} 月 {day} 號 HH:00 重置` (hour zero-padded, no minutes)
- No data: empty string

**If the reset time formatting has changed or is now configurable:**
1. Check upstream commit history
2. Create a GitHub Issue with details and assign to @UnpxreTW

---

### 10. Add prefix to environment info line

Find where the environment information line is rendered (the one showing
counts like rules, hooks, CLAUDE.md files). Add `參考：` as a prefix
before the content.

**If the environment line rendering has changed:**
1. Check upstream commit history
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 10: environment line not found` and assign to @UnpxreTW

---

### 11. Always show usage bar when limit is reached

Find where usage rendering has a special branch for when the rate limit
is reached (e.g. checking a flag like `isLimitReached`). This branch
replaces the normal bar display with a warning message like
`⚠ Limit reached`.

Remove this special branch entirely so the bar continues to display
at 100% naturally. The bar itself already handles a full state visually.

This applies to both the expanded usage element and the compact session
line rendering if applicable.

**If the limit-reached logic has already been removed or restructured:**
1. Check upstream commit history
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 11: limit-reached logic not found` and assign to @UnpxreTW

---

### 12. Add zh-TW option to configure command

Find the plugin's configure command (the guided configuration flow that
lets users choose language, layout, presets, etc.).

Add `zh-TW` (繁體中文) as a language option alongside the existing
`en` and `zh` choices. The option should:
- Display as: `繁體中文（台灣）`
- Save as: `language: "zh-TW"`

Update both the new user flow and the update config flow language
questions to include this option.

**If the configure command structure has changed:**
1. Check upstream commit history
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 12: configure command changed` and assign to @UnpxreTW

---

### 13. Add separators toggle to configure command

Find the plugin's configure command. Add a "Separators" option to the
Turn On / Turn Off questions so users can enable or disable the
separator line between info lines and activity lines.

- Display as: `Separators` — horizontal line between info and activity
- Config key: `showSeparators: true/false`

**If the configure command structure has changed:**
1. Check upstream commit history
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 13: configure command changed` and assign to @UnpxreTW

---

### 14. Clear resetsIn translation for zh-TW

In the zh-TW locale file, set `format.resetsIn` to an empty string `""`.

The reset time values already contain the full descriptive text
(e.g. `於 14:30 重置`, `4 月 15 號 09:00 重置`), so the `resetsIn`
prefix is redundant and would result in duplicated text.

**If the i18n key has been removed or renamed:**
1. Check upstream commit history
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 14: format.resetsIn key changed` and assign to @UnpxreTW

---

### 15. Replace parentheses with separator for reset time display

Find where the reset time is appended to the usage display line.
The original wraps the reset time in parentheses:
`(resetsIn resetTime)`

Replace the parentheses with a `│` separator:
`│ resetTime`

This applies to all usage lines that show reset time (five-hour usage,
weekly usage, and the compact session line if applicable).

**If the usage line assembly logic has changed:**
1. Check upstream commit history
2. If unresolvable, create a GitHub Issue titled
   `⚠ Override 15: usage line assembly changed` and assign to @UnpxreTW
