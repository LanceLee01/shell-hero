/**
 * Debug Logger — 带标签和类别的控制台日志工具
 *
 * 用法:
 *   Logger.log("boss", "bossDeath() called, HP:", this.bossHP)
 *   Logger.log("weapon", "Switching to slot", slot)
 *   Logger.error("boss", "bossDeath failed:", err)
 *
 * 启用/禁用:
 *   localStorage.setItem("debug", "boss,weapon,bullet,physics")
 *   或 localStorage.setItem("debug", "*")  // 全部开启
 *   或 localStorage.removeItem("debug")     // 全部关闭
 */

type LogCategory = "boss" | "weapon" | "bullet" | "physics" | "system" | "enemy"

const STORAGE_KEY = "debug"

function getEnabledCategories(): Set<string> {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (!val) return new Set()
    if (val === "*") return new Set(["*"])
    return new Set(val.split(",").map(s => s.trim()))
  } catch {
    return new Set()
  }
}

function isEnabled(category: LogCategory): boolean {
  const cats = getEnabledCategories()
  return cats.has("*") || cats.has(category)
}

export const Logger = {
  log(category: LogCategory, ...args: unknown[]) {
    if (!isEnabled(category)) return
    const ts = new Date().toISOString().slice(11, 23)
    console.log(`[${ts}][${category.toUpperCase()}]`, ...args)
  },

  warn(category: LogCategory, ...args: unknown[]) {
    if (!isEnabled(category)) return
    const ts = new Date().toISOString().slice(11, 23)
    console.warn(`[${ts}][${category.toUpperCase()}]`, ...args)
  },

  error(category: LogCategory, ...args: unknown[]) {
    // 错误始终显示
    const ts = new Date().toISOString().slice(11, 23)
    console.error(`[${ts}][${category.toUpperCase()}]`, ...args)
  },

  /** 开启特定类别 */
  enable(category: LogCategory) {
    try {
      const cats = getEnabledCategories()
      cats.add(category)
      localStorage.setItem(STORAGE_KEY, Array.from(cats).join(","))
    } catch { /* ignore */ }
  },

  /** 开启全部日志 */
  enableAll() {
    try { localStorage.setItem(STORAGE_KEY, "*") } catch { /* ignore */ }
  },

  /** 关闭全部日志 */
  disableAll() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  },
}
