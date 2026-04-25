# Security Audit Skill Plan

## Overview

建立 `/claude-hud:security-audit` skill，用於檢查公開儲存庫的安全
設定並產出建議清單。適用於 fork 維護情境，確保上游設定不會遺留安全
風險。

- **檔案位置**: `commands/security-audit.md`
- **觸發方式**: `/claude-hud:security-audit`
- **輸出格式**: 逐項檢查結果表格（✅ / ⚠️ / ❌），附修正建議

---

## Skill Metadata

```yaml
---
description: Audit repository security settings for public repos
allowed-tools: Bash, Read, Grep, Glob, WebFetch
---
```

---

## Checklist

### 1. Branch Protection

透過 GitHub API 檢查 main 分支保護規則：

| 檢查項目 | 說明 |
|----------|------|
| require PR | main 是否要求通過 PR 合併 |
| require review | 是否要求至少 1 位 reviewer 審核 |
| code owner review | 是否啟用 Code Owner review |
| dismiss stale reviews | 新 commit 後是否自動 dismiss 舊 review |
| force push | 是否禁止 force push |
| status checks | 是否要求 CI status checks 通過 |
| bypass list | 哪些帳號/app 可以繞過保護規則 |

### 2. CODEOWNERS

| 檢查項目 | 說明 |
|----------|------|
| 檔案存在 | `.github/CODEOWNERS` 是否存在 |
| Owner 正確 | 是否指向 fork 維護者而非上游作者 |
| 路徑覆蓋 | 是否覆蓋關鍵路徑（`src/`、`.github/`、`.unpxre/`） |

### 3. Workflow Security

| 檢查項目 | 說明 |
|----------|------|
| 觸發限制 | `@claude` 等 bot 觸發是否限制特定使用者 |
| 最小權限 | 所有 workflow 的 `permissions` 是否遵循最小權限原則 |
| pull_request_target | 是否有 workflow 使用此觸發器（可被 fork PR 利用） |
| secrets 暴露 | Secrets 是否可能暴露給 fork PR |

### 4. Public Repo Settings

| 檢查項目 | 說明 |
|----------|------|
| 敏感檔案追蹤 | `.env`、credential 檔案是否被 git 追蹤 |
| .gitignore 完整性 | 是否忽略常見敏感檔案模式 |
| Hardcoded secrets | 程式碼中是否有硬寫的 API key、token、密碼 |
| Dependabot | 依賴更新自動化是否啟用 |
| Fork workflow 限制 | GitHub Actions 是否限制 fork PR 的 workflow 執行 |

---

## Implementation Steps

### Step 1: Detect Repository Context

- 確認 repo 是 public 還是 private
- 偵測 remote URL 取得 owner/repo
- 確認是否為 fork（比對 upstream remote）

### Step 2: Check Branch Protection

- 呼叫 GitHub API 取得 main 分支保護規則
- 若 API 無權限，改用 `git push --dry-run` 等間接方式推斷
- 逐項比對建議設定

### Step 3: Check CODEOWNERS

- 讀取 `.github/CODEOWNERS`
- 比對 owner 是否為當前 repo 的維護者
- 檢查是否有遺漏的關鍵路徑

### Step 4: Audit Workflows

- 掃描 `.github/workflows/*.yml`
- 檢查每個 workflow 的觸發條件、permissions、是否有使用者過濾
- 標記使用 `pull_request_target` 的 workflow

### Step 5: Scan for Secrets

- 檢查 `.gitignore` 是否包含常見敏感檔案模式
- 用 regex 掃描程式碼中的 API key / token 模式
- 檢查是否有 `.env` 等檔案已被追蹤

### Step 6: Generate Report

- 彙整所有檢查結果
- 以表格形式輸出（✅ / ⚠️ / ❌）
- 對每個 ⚠️ 和 ❌ 提供具體修正建議

---

## Background

此 Skill 的需求來自以下實際問題：

- Fork 自上游的 `CODEOWNERS` 仍指向原作者，導致 Code Owner review
  請求發送對象錯誤
- `claude.yml` 的 `@claude` 觸發未限制使用者，任何人都能觸發
  Claude 執行程式碼
- Branch protection 設定在 force push 後暴露出 CI 與 commit 訊息
  格式問題
- 公開 repo 的 fork PR 可能觸發 workflow 並存取 secrets
