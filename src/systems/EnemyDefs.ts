export enum EnemyType {
  CHARGER = "charger",
  SHOOTER = "shooter",
  ELITE = "elite",
}

export interface EnemyConfig {
  id: EnemyType
  name: string
  baseHp: number
  baseSpeed: number
  baseDamage: number
  size: number
  color: number
  behavior: string
  attackRange?: number
  shootCooldown?: number
  pellets?: number
  spread?: number
  // wave scaling
  hpScalePerWave: number
  speedScalePerWave: number
  damageScalePerWave: number
  shootCDReductionPerWave?: number
}

export const ENEMY_DEFS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.CHARGER]: {
    id: EnemyType.CHARGER, name: "冲锋", baseHp: 12, baseSpeed: 160,
    baseDamage: 8, size: 16, color: 0xff8800, behavior: "charge",
    hpScalePerWave: 2, speedScalePerWave: 4, damageScalePerWave: 1,
  },
  [EnemyType.SHOOTER]: {
    id: EnemyType.SHOOTER, name: "射击", baseHp: 18, baseSpeed: 75,
    baseDamage: 6, size: 20, color: 0xaa44ff, behavior: "shoot",
    attackRange: 150, shootCooldown: 1500,
    hpScalePerWave: 3, speedScalePerWave: 2, damageScalePerWave: 1, shootCDReductionPerWave: 20,
  },
  [EnemyType.ELITE]: {
    id: EnemyType.ELITE, name: "精英", baseHp: 50, baseSpeed: 55,
    baseDamage: 12, size: 22, color: 0xff0044, behavior: "elite",
    hpScalePerWave: 5, speedScalePerWave: 2, damageScalePerWave: 1.5,
  },
}

export const ENEMY_LIST: EnemyConfig[] = [
  ENEMY_DEFS[EnemyType.CHARGER],
  ENEMY_DEFS[EnemyType.SHOOTER],
  ENEMY_DEFS[EnemyType.ELITE],
]
