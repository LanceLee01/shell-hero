export enum ItemType {
  HEAL = "heal",
  GOLD = "gold",
  XP = "xp",
  WEAPON = "weapon",
}

export interface ItemDef {
  id: string
  type: ItemType
  name: string
  value?: number
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  health_small: { id: "health_small", type: ItemType.HEAL, name: "小血瓶", value: 20 },
  health_large: { id: "health_large", type: ItemType.HEAL, name: "大血瓶", value: 50 },
  gold_coin: { id: "gold_coin", type: ItemType.GOLD, name: "金币", value: 1 },
  xp_orb: { id: "xp_orb", type: ItemType.XP, name: "经验", value: 10 },
}
