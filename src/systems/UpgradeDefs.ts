export interface UpgradeDef {
  id: string
  name: string
  desc: string
}

export const ALL_UPGRADES: UpgradeDef[] = [
  { id: "damage", name: "攻击强化", desc: "伤害 +20%" },
  { id: "fire_rate", name: "速射", desc: "攻速 +15%" },
  { id: "max_hp", name: "生命强化", desc: "最大HP +20" },
  { id: "speed", name: "迅捷", desc: "移速 +10%" },
  { id: "proj_speed", name: "弹道加速", desc: "弹速 +25%" },
  { id: "pellets", name: "散射", desc: "额外弹道 +1" },
  { id: "barrier_range", name: "屏障扩展", desc: "光环半径 +30" },
  { id: "barrier_damage", name: "屏障强化", desc: "光环伤害 +5/秒" },
]

export function getRandomUpgrades(count: number): UpgradeDef[] {
  const shuffled = [...ALL_UPGRADES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const XP_BASE = 30
export const XP_INCREMENT = 25
