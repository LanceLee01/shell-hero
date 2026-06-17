export interface AttackPattern {
  type: "fan" | "scatter" | "bullet-hell" | "rush"
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
  baseHp: 200,
  hpScalePerWave: 50,
  size: 40,
  color: "#ff0000",
  rewardCrystalsPerWave: 10,
  rewardGoldPerWave: 5,
  phases: [
    {
      phaseName: "Phase 1",
      hpThreshold: 1.0,
      speed: 80,
      attackPatterns: [
        { type: "fan", count: 3, spread: 0.2 }
      ],
      summonInterval: 0
    },
    {
      phaseName: "Phase 2",
      hpThreshold: 0.7,
      speed: 120,
      attackPatterns: [
        { type: "scatter", count: 5, spread: 0.15 }
      ],
      summonInterval: 8000
    },
    {
      phaseName: "Phase 3",
      hpThreshold: 0.4,
      speed: 180,
      attackPatterns: [
        { type: "bullet-hell", count: 8, spread: 6.283 },
        { type: "rush" }
      ],
      summonInterval: 0
    }
  ]
}
