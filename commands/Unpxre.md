---
description: One-click setup with Unpxre's recommended settings (statusLine + zh-TW, full/lite presets)
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
---

# Unpxre Recommended Setup

Set up statusLine and apply recommended configuration in one step.

## Step 1: Detect Runtime

Use the environment context values (`Platform:` and `Shell:`) to determine
the platform, not `uname -s`.

On `darwin` or `linux`, prefer bun for performance, fall back to node:
```bash
command -v bun 2>/dev/null || command -v node 2>/dev/null
```

If empty, stop and tell the user to install Node.js or Bun first.

Verify the runtime exists:
```bash
ls -la {RUNTIME_PATH}
```

Determine source file:
- If runtime is `bun`, use `src/index.ts`
- Otherwise use `dist/index.js`

## Step 2: Generate statusLine Command

**When runtime is bun** (add `--env-file /dev/null`):
```
bash -c 'plugin_dir=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | awk -F/ '"'"'{ print $(NF-1) "\t" $(0) }'"'"' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-); exec "{RUNTIME_PATH}" --env-file /dev/null "${plugin_dir}{SOURCE}"'
```

**When runtime is node**:
```
bash -c 'plugin_dir=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | awk -F/ '"'"'{ print $(NF-1) "\t" $(0) }'"'"' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-); exec "{RUNTIME_PATH}" "${plugin_dir}{SOURCE}"'
```

## Step 3: Test Command

Run the generated command. It should produce output within a few seconds.
If it errors or hangs, stop and debug.

## Step 4: Write statusLine to settings.json

Read `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json`, merge in the
statusLine config, preserving all existing settings:

```json
{
  "statusLine": {
    "type": "command",
    "command": "{GENERATED_COMMAND}"
  }
}
```

**JSON safety**: Use a real JSON serializer, not string concatenation.
The saved JSON must contain `\\$(NF-1)` and `\\$0` (escaped backslashes).

## Step 5: Choose Preset

Use AskUserQuestion to let the user choose a preset:

- header: "配置風格"
- question: "選擇 HUD 配置風格："
- multiSelect: false
- options:
  - label: "完整版 (Full)"
    description: "全功能：工具、代理、待辦、設定計數、Session tokens、執行時間、Git 檔案統計"
  - label: "精簡版 (Lite)"
    description: "精簡顯示：第一行保留，上下文與用量合併同一行，其餘隱藏"

If the user cancels, stop and say: 設定已取消。

## Step 6: Write config.json

Write the chosen config to `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/claude-hud/config.json`.
Create the directory if it does not exist. If config.json already exists,
overwrite it entirely.

### Full config (完整版)

Use this config if the user chose "完整版 (Full)" in Step 5:

```json
{
  "lineLayout": "expanded",
  "showSeparators": true,
  "language": "zh-TW",
  "display": {
    "showModel": true,
    "showContextBar": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showProject": true,
    "showConfigCounts": true,
    "showTokenBreakdown": false,
    "showSpeed": false,
    "showUsage": true,
    "usageBarEnabled": true,
    "showDuration": true,
    "showSessionName": false,
    "showSessionTokens": true,
    "customLine": "",
    "timeFormat": "absolute"
  },
  "maxWidth": 120,
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": true
  }
}
```

### Lite config (精簡版)

Use this config if the user chose "精簡版 (Lite)" in Step 5:

```json
{
  "lineLayout": "expanded",
  "showSeparators": false,
  "language": "zh-TW",
  "display": {
    "showModel": true,
    "showContextBar": true,
    "showTools": false,
    "showAgents": false,
    "showTodos": false,
    "showProject": true,
    "showConfigCounts": false,
    "showTokenBreakdown": false,
    "showSpeed": false,
    "showUsage": true,
    "usageBarEnabled": true,
    "showDuration": false,
    "showSessionName": false,
    "showSessionTokens": false,
    "customLine": "",
    "timeFormat": "absolute",
    "mergeGroups": [["context", "usage"]]
  },
  "maxWidth": 120,
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  }
}
```

## Done

After both files are written successfully, say:

> 已套用「{選擇的版本名稱}」設定。重新啟動 Claude Code 即可看到 HUD。
> 如需調整設定，請執行 `/claude-hud:configure`。
