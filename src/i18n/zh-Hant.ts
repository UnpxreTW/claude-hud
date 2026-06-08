import type { Messages } from "./types.js";

export const zhHant: Messages = {
  // Labels
  "label.context": "上下文佔用",
  "label.usage": "五小時上限",
  "label.weekly": "每週使用量",
  "label.approxRam": "記憶體用量",
  "label.promptCache": "快取",
  "label.rules": "規則",
  "label.hooks": "hooks",
  "label.estimatedCost": "估算",
  "label.cost": "費用",
  "label.tokens": "Tokens",
  "label.sessionStarted": "工作階段開始",
  "label.lastReply": "上次回覆",
  "label.advisor": "顧問",
  "label.duration": "執行時間",

  // Status
  "status.limitReached": "已達上限",
  "status.allTodosComplete": "全部完成",
  "status.expired": "已過期",

  // Format
  "format.resets": "重置於",
  "format.resetsIn": "",
  "format.at": "",
  "format.in": "輸入",
  "format.cache": "快取",
  "format.out": "輸出",
  "format.tok": "tok",
  "format.tokPerSec": "tok/s",
  "format.justNow": "剛剛",
  "format.ago": "前",

  // Init
  "init.initializing": "[claude-hud] 正在初始化...",
  "init.macosNote":
    "[claude-hud] 注意：在 macOS 上，您可能需要重啟 Claude Code 才能顯示 HUD。",
};
