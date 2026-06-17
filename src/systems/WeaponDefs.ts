export enum WeaponId {
  PISTOL = "pistol",
  SHOTGUN = "shotgun",
  SMG = "smg",
}

export interface WeaponDef {
  id: WeaponId
  name: string
  damage: number
  fireRate: number
  isMelee: boolean
  range: number
  projSpeed?: number
  pellets?: number
  spread?: number
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  [WeaponId.PISTOL]: {
    id: WeaponId.PISTOL, name: "手枪", damage: 15, fireRate: 220,
    isMelee: false, range: 300, projSpeed: 600,
  },
  [WeaponId.SHOTGUN]: {
    id: WeaponId.SHOTGUN, name: "霰弹枪", damage: 12, fireRate: 450,
    isMelee: false, range: 200, projSpeed: 500, pellets: 5, spread: 0.25,
  },
  [WeaponId.SMG]: {
    id: WeaponId.SMG, name: "冲锋枪", damage: 7, fireRate: 70,
    isMelee: false, range: 250, projSpeed: 550,
  },
}

export const WEAPON_LIST: WeaponDef[] = [
  WEAPON_DEFS[WeaponId.PISTOL],
  WEAPON_DEFS[WeaponId.SHOTGUN],
  WEAPON_DEFS[WeaponId.SMG],
]
