export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720
export const TILE_SIZE = 32

export const PLAYER = {
  SPEED: 200,
  MAX_HP: 100,
  INVINCIBLE_DURATION: 500,
}

export const DODGE = {
  SPEED: 500,
  DURATION: 180,
  COOLDOWN: 800,
}

export const COLORS = {
  PLAYER: 0x4fc3f7,
  ENEMY: 0xff5252,
  HP_BAR: 0x4caf50,
  HP_BG: 0x333333,
  GOLD: 0xffd700,
  HEART: 0xff4444,
  UI_BG: 0x222222,
}

// 游戏运行时常量
export const GAMEPLAY = {
  /** 60fps 下一帧的毫秒数 */
  FRAME_MS: 16.67,
  /** 手雷爆炸半径 */
  GRENADE_RADIUS: 40,
  /** Boss AI 第 2 阶段攻击间隔 */
  BOSS_ATTACK_INTERVAL_PHASE2: 250,
  /** 敌人射击冷却基础值 */
  ENEMY_SHOOT_COOLDOWN_BASE: 1500,
}
