export interface AttackPattern {
  type: "fan" | "scatter" | "bullet-hell" | "rush" | "homing" | "ring-burst" | "laser-sweep"
  count?: number
  spread?: number
  interval?: number
}

export interface BossPhase {
  phaseName: string
  hpThreshold: number
  speed: number
  attackPatterns: AttackPattern[]
  summonInterval?: number
}

export interface BossConfig {
  name: string
  baseHp: number
  hpScalePerWave: number
  size: number
  color: string
  phases: BossPhase[]
  rewardCrystalsPerWave?: number
  rewardGoldPerWave?: number
}

export const BOSS_DEF: BossConfig = {
  name: "Boss",
  baseHp: 300,
  hpScalePerWave: 75,
  size: 40,
  color: "#ff0000",
  phases: [
    {
      phaseName: "Phase 1",
      hpThreshold: 0.7,
      speed: 100,
      attackPatterns: [
        { type: "fan", count: 3, spread: 0.2 },
        { type: "homing", count: 1 },
      ],
    },
    {
      phaseName: "Phase 2",
      hpThreshold: 0.4,
      speed: 150,
      attackPatterns: [
        { type: "scatter", count: 5, spread: 0.15 },
        { type: "ring-burst", count: 2, spread: 0.3 },
      ],
      summonInterval: 8000,
    },
    {
      phaseName: "Phase 3",
      hpThreshold: 0,
      speed: 220,
      attackPatterns: [
        { type: "bullet-hell", count: 12, spread: Math.PI * 2 },
        { type: "laser-sweep", count: 3 },
        { type: "rush" },
      ],
    },
  ],
  rewardCrystalsPerWave: 10,
  rewardGoldPerWave: 5,
}
