export interface TalentDef {
  id: string
  name: string
  desc: (level: number) => string
  maxLevel: number
  costPerLevel: number
}

export const TALENTS: TalentDef[] = [
  { id: "hp", name: "生命强化", desc: (l) => `最大HP +${(l + 1) * 10}`, maxLevel: 5, costPerLevel: 30 },
  { id: "damage", name: "攻击强化", desc: (l) => `伤害 +${(l + 1) * 5}%`, maxLevel: 5, costPerLevel: 40 },
  { id: "speed", name: "迅捷", desc: (l) => `移速 +${(l + 1) * 5}%`, maxLevel: 5, costPerLevel: 30 },
  { id: "gold", name: "初始财富", desc: (l) => `开局金币 +${(l + 1) * 30}`, maxLevel: 3, costPerLevel: 50 },
  { id: "dodge_cd", name: "翻滚大师", desc: (l) => `翻滚CD -${(l + 1) * 100}ms`, maxLevel: 3, costPerLevel: 60 },
  { id: "xp_boost", name: "经验加成", desc: (l) => `经验获取 +${(l + 1) * 10}%`, maxLevel: 3, costPerLevel: 50 },
]

const STORAGE_KEY = "roguelike_save"

export interface SaveData {
  crystals: number
  talents: Record<string, number>
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { crystals: 0, talents: {} }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function getTalentLevel(data: SaveData, id: string): number {
  return data.talents[id] || 0
}

export interface TalentBonuses {
  maxHp: number
  damagePercent: number
  speedPercent: number
  startGold: number
  dodgeCdReduction: number
  xpPercent: number
}

export function computeBonuses(data: SaveData): TalentBonuses {
  return {
    maxHp: getTalentLevel(data, "hp") * 10,
    damagePercent: getTalentLevel(data, "damage") * 5,
    speedPercent: getTalentLevel(data, "speed") * 5,
    startGold: getTalentLevel(data, "gold") * 30,
    dodgeCdReduction: getTalentLevel(data, "dodge_cd") * 100,
    xpPercent: getTalentLevel(data, "xp_boost") * 10,
  }
}
