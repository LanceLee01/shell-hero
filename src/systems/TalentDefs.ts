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
const MAX_SLOTS = 3

export interface SaveSlot {
  id: number
  name: string
  crystals: number
  talents: Record<string, number>
  lastSave: string
}

export interface SaveData {
  activeSlot: number
  slots: SaveSlot[]
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      // 兼容旧格式
      if (data.slots) return data
      if (data.crystals !== undefined) {
        return {
          activeSlot: 0,
          slots: [{
            id: 0,
            name: "存档 1",
            crystals: data.crystals,
            talents: data.talents || {},
            lastSave: new Date().toISOString()
          }]
        }
      }
    }
  } catch { /* ignore */ }
  return {
    activeSlot: 0,
    slots: [{
      id: 0,
      name: "存档 1",
      crystals: 0,
      talents: {},
      lastSave: ""
    }]
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function getActiveSlot(data: SaveData): SaveSlot {
  return data.slots[data.activeSlot] || data.slots[0]
}

export function switchSlot(data: SaveData, slotId: number): void {
  if (slotId >= 0 && slotId < data.slots.length) {
    data.activeSlot = slotId
  }
}

export function createSlot(data: SaveData, name: string): void {
  if (data.slots.length < MAX_SLOTS) {
    data.slots.push({
      id: data.slots.length,
      name,
      crystals: 0,
      talents: {},
      lastSave: ""
    })
  }
}

export function deleteSlot(data: SaveData, slotId: number): void {
  if (data.slots.length > 1 && slotId < data.slots.length) {
    data.slots.splice(slotId, 1)
    data.slots.forEach((s, i) => s.id = i)
    if (data.activeSlot >= data.slots.length) {
      data.activeSlot = data.slots.length - 1
    }
  }
}

export function getTalentLevel(slot: SaveSlot, id: string): number {
  return slot.talents[id] || 0
}

export interface TalentBonuses {
  maxHp: number
  damagePercent: number
  speedPercent: number
  startGold: number
  dodgeCdReduction: number
  xpPercent: number
}

export function computeBonuses(slot: SaveSlot): TalentBonuses {
  return {
    maxHp: getTalentLevel(slot, "hp") * 10,
    damagePercent: getTalentLevel(slot, "damage") * 5,
    speedPercent: getTalentLevel(slot, "speed") * 5,
    startGold: getTalentLevel(slot, "gold") * 30,
    dodgeCdReduction: getTalentLevel(slot, "dodge_cd") * 100,
    xpPercent: getTalentLevel(slot, "xp_boost") * 10,
  }
}
