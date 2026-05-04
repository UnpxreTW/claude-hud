---
description: One-click setup with Unpxre's recommended settings (statusLine + zh-TW + full features)
allowed-tools: Bash, Read, Write, Edit
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

## Step 5: Write config.json

Write the following to `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/claude-hud/config.json`.
Create the directory if it does not exist. If config.json already exists,
overwrite it entirely.

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

## Done

After both files are written successfully, say:

> Setup complete. Restart Claude Code to see the HUD.
> To change settings later, run `/claude-hud:configure`.
