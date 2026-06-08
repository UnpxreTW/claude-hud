---
description: One-click Unpxre setup — configure the claude-hud statusLine and write a recommended Traditional Chinese (Taiwan) config preset
allowed-tools: Bash, Read, Edit, Write, AskUserQuestion
---

# Unpxre one-click setup

This command sets up claude-hud for the Unpxre fork in one step:

1. Configures the auto-updating `statusLine` command in `settings.json`.
2. Asks you to pick a preset (完整版 / 精簡版) and writes the recommended
   `config.json` for it.

It is the single home for the fork's recommended config presets — all the
preset values (Traditional Chinese labels, bar characters, custom-line
position, separators, layout) live here, not in source code.

---

## Step 1: Configure the statusLine

Run the standard claude-hud statusLine setup first. Follow **every step of
`/claude-hud:setup`** (see `commands/setup.md`): platform / shell / runtime
detection, the existing-statusline detection and timestamped backup, and
writing the `statusLine` entry into `settings.json`.

`commands/setup.md` is the single source of truth for the auto-updating
statusLine command string (it dynamically finds the latest installed plugin
version at runtime). Do **not** hand-roll the command string here.

If `setup.md` reports a runtime/installation problem (missing Node/Bun, plugin
not installed, ghost install, etc.), stop and resolve it before continuing —
do not write a config preset on top of a broken statusLine.

> Skip the optional-features prompt (`setup.md` Step 4): the preset chosen in
> Step 2 below writes `config.json` instead.

---

## Step 2: Choose a preset

Use AskUserQuestion:
- header: "Unpxre 預設"
- question: "選擇要套用的 claude-hud 設定預設："
- options:
  - "完整版（Full）" — 顯示所有功能：工具、子代理、待辦、五小時與每週用量、執行時間、Session tokens、設定數量，git 顯示 dirty 與檔案統計。
  - "精簡版（Lite）" — 最小化：第一行保留模型、專案、git 分支與 dirty；上下文與五小時用量合併於同一行；其餘全部隱藏。

---

## Step 3: Write config.json

Write the chosen preset to `plugins/claude-hud/config.json` inside the Claude
config directory:
- **bash**: `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/claude-hud/config.json`
- **PowerShell**: `config.json` under `plugins\claude-hud` inside
  `$env:CLAUDE_CONFIG_DIR` when set, otherwise `Join-Path $HOME ".claude"`.

Create directories if needed. **Merge** with any existing `config.json`
(preserve unrelated keys the user already set). Write valid JSON with a real
serializer — on Windows PowerShell 5.1 use `[System.IO.File]::WriteAllText`
with `New-Object System.Text.UTF8Encoding $false` so the file is UTF-8 without
a BOM.

### 完整版 (Full)

```json
{
  "language": "zh-TW",
  "lineLayout": "expanded",
  "showSeparators": true,
  "maxWidth": 120,
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": true,
    "showFileStats": true
  },
  "display": {
    "customLinePosition": "first",
    "timeFormat": "absolute",
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showUsage": true,
    "showDuration": true,
    "showSessionTokens": true,
    "showConfigCounts": true
  },
  "colors": {
    "barFilled": "●",
    "barEmpty": "○"
  }
}
```

The weekly-usage line is an independent, always-visible element in this fork,
so it renders on its own line alongside the five-hour usage.

### 精簡版 (Lite)

```json
{
  "language": "zh-TW",
  "lineLayout": "expanded",
  "showSeparators": false,
  "maxWidth": 120,
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "customLinePosition": "first",
    "timeFormat": "absolute",
    "mergeGroups": [["context", "usage"]],
    "showTools": false,
    "showAgents": false,
    "showTodos": false,
    "showConfigCounts": false,
    "showSessionTokens": false,
    "showDuration": false,
    "showSpeed": false
  },
  "colors": {
    "barFilled": "●",
    "barEmpty": "○"
  }
}
```

Line 1 keeps the model badge, project, and git branch + dirty marker. Context
and the five-hour usage are merged onto a single line via `mergeGroups`; weekly
usage keeps the fork's default handling. Everything else is hidden.

---

## Notes on the presets

These values map to native config keys (no source patches required):

| Preset value | Config key |
|---|---|
| Traditional Chinese (Taiwan) labels | `language: "zh-TW"` (alias → `zh-Hant`) |
| Custom line at the front | `display.customLinePosition: "first"` |
| Bar characters ● / ○ | `colors.barFilled` / `colors.barEmpty` |
| Width fallback | `maxWidth: 120` (set `forceMaxWidth: true` only for a hard cap) |
| Separator line | `showSeparators` |
| Reset time as absolute clock | `display.timeFormat: "absolute"` |

---

## Step 4: Finish

After writing `config.json`, tell the user:

> ✅ Unpxre 設定已寫入。**請重新啟動 Claude Code**（離開後在終端機重新執行
> `claude`），HUD 就會以所選預設顯示。

If the user wants to fine-tune individual elements afterwards, point them at
`/claude-hud:configure`, which edits the same `config.json` while preserving
these preset values.
