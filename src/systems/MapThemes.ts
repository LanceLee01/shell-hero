export enum MapTheme {
  GRASSLAND = "grassland",
  DESERT = "desert",
  SNOW = "snow",
  VOLCANO = "volcano",
}

export interface ThemeColors {
  ground: number
  ground2: number
  obstacle: number
  path: number
  path2: number
  bg: number
  title: string
  desc: string
}

export const THEMES: Record<MapTheme, ThemeColors> = {
  [MapTheme.GRASSLAND]: {
    ground: 0x4a7c3f, ground2: 0x3d6b34, obstacle: 0x5c4033,
    path: 0x8b7355, path2: 0x7a6548, bg: 0x87ceeb,
    title: "草原", desc: "平坦开阔的绿色草原",
  },
  [MapTheme.DESERT]: {
    ground: 0xd4a76a, ground2: 0xc49a5e, obstacle: 0x8b7355,
    path: 0xcdb38c, path2: 0xb8966a, bg: 0xffd27a,
    title: "沙漠", desc: "炙热滚烫的黄色沙漠",
  },
  [MapTheme.SNOW]: {
    ground: 0xdce8f0, ground2: 0xc8d8e4, obstacle: 0x8899aa,
    path: 0xaabbcc, path2: 0x99aabb, bg: 0xb0c4de,
    title: "雪地", desc: "白雪皑皑的冰封之地",
  },
  [MapTheme.VOLCANO]: {
    ground: 0x5a2a2a, ground2: 0x4a2020, obstacle: 0x3a3a3a,
    path: 0x8a4a4a, path2: 0x7a3a3a, bg: 0x2a0a0a,
    title: "火山", desc: "岩浆涌动的灼热地狱",
  },
}
