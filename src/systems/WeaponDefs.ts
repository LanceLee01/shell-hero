export enum WeaponId {
  PISTOL = "pistol",
  SHOTGUN = "shotgun",
  SMG = "smg",
  LASER = "laser",
  GRENADE = "grenade",
  FREEZE = "freeze",
  MINIGUN = "minigun",
  CANNON = "cannon",
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
  isBossWeapon?: boolean
  special?: "laser" | "grenade" | "freeze" | "minigun" | "cannon"
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
  [WeaponId.LASER]: {
    id: WeaponId.LASER, name: "激光枪", damage: 8, fireRate: 50,
    isMelee: false, range: 300, projSpeed: 800, pellets: 1, isBossWeapon: true, special: "laser",
  },
  [WeaponId.GRENADE]: {
    id: WeaponId.GRENADE, name: "榴弹炮", damage: 40, fireRate: 800,
    isMelee: false, range: 300, projSpeed: 400, pellets: 1, isBossWeapon: true, special: "grenade",
  },
  [WeaponId.FREEZE]: {
    id: WeaponId.FREEZE, name: "冰冻枪", damage: 10, fireRate: 300,
    isMelee: false, range: 300, projSpeed: 500, pellets: 1, isBossWeapon: true, special: "freeze",
  },
  [WeaponId.MINIGUN]: {
    id: WeaponId.MINIGUN, name: "机枪", damage: 5, fireRate: 40,
    isMelee: false, range: 300, projSpeed: 600, pellets: 1, isBossWeapon: true, special: "minigun",
  },
  [WeaponId.CANNON]: {
    id: WeaponId.CANNON, name: "能量炮", damage: 100, fireRate: 1500,
    isMelee: false, range: 300, projSpeed: 700, pellets: 1, isBossWeapon: true, special: "cannon",
  },
}

export const WEAPON_LIST: WeaponDef[] = [
  WEAPON_DEFS[WeaponId.PISTOL],
  WEAPON_DEFS[WeaponId.SHOTGUN],
  WEAPON_DEFS[WeaponId.SMG],
]

export const BASE_WEAPON_LIST: WeaponDef[] = Object.values(WEAPON_DEFS).filter(w => !w.isBossWeapon)
