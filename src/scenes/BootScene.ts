import Phaser from "phaser"
import { COLORS, TILE_SIZE } from "@/config"
import { TileType } from "@/map/types"
import { MapTheme, THEMES } from "@/systems/MapThemes"
import { SoundManager } from "@/systems/SoundManager"

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene")
  }

  preload() {
    for (const theme of Object.values(MapTheme)) {
      this.generateTileset(theme)
    }
    this.load.image("player", "assets/player.png")
    this.load.image("weapon_pistol", "assets/weapon_pistol.png")
    this.load.image("weapon_smg", "assets/weapon_smg.png")
    this.load.image("enemy_charger", "assets/enemies/charger.png")
    this.load.image("enemy_shooter", "assets/enemies/shooter.png")
    this.load.image("enemy_elite", "assets/enemies/elite.png")
    this.load.image("boss", "assets/enemies/boss.png")
    this.generateBullets()
    this.generateItems()
    this.generateUI()
    this.generateShotgunTexture()
    this.generateEnemyBulletTextures()
    this.generateBossWeaponTextures()

    // Audio: SFX (via SoundManager) + BGM
    SoundManager.preload(this)
    this.load.audio("bgm_menu", "assets/audio/bgm_menu.wav")
    this.load.audio("bgm_game", "assets/audio/bgm_game.wav")
  }

  private generateTileset(theme: MapTheme) {
    const g = this.add.graphics()
    const T = TILE_SIZE
    const c = THEMES[theme]

    // Wall tile (col 0)
    g.fillStyle(c.obstacle, 1)
    g.fillRect(T * TileType.WALL, 0, T, T)
    // Brick pattern
    g.lineStyle(1, 0x000000, 0.15)
    for (let row = 0; row < 4; row++) {
      const y = row * 8
      g.lineBetween(T * TileType.WALL, y, T * TileType.WALL + T, y)
      const offset = row % 2 === 0 ? 0 : 8
      for (let x = offset; x < T; x += 16) {
        g.lineBetween(T * TileType.WALL + x, y, T * TileType.WALL + x, y + 8)
      }
    }
    // Bottom shadow
    g.fillStyle(0x000000, 0.25)
    g.fillRect(T * TileType.WALL + 4, T - 8, T - 8, 4)

    // Floor tile (col 1)
    g.fillStyle(c.ground, 1)
    g.fillRect(T * TileType.FLOOR, 0, T, T)
    // Ground texture dots and variation
    g.fillStyle(c.ground2, 0.5)
    g.fillRect(T * TileType.FLOOR + 6, 8, 8, 4)
    g.fillRect(T * TileType.FLOOR + 20, 20, 6, 3)
    g.fillRect(T * TileType.FLOOR + 2, 26, 4, 2)
    g.fillRect(T * TileType.FLOOR + 24, 6, 3, 3)
    // Subtle edge highlight
    g.lineStyle(1, 0xffffff, 0.06)
    g.lineBetween(T * TileType.FLOOR, 0, T * TileType.FLOOR + T, 0)
    g.lineBetween(T * TileType.FLOOR, 0, T * TileType.FLOOR, T)

    // Corridor tile (col 2)
    g.fillStyle(c.path, 1)
    g.fillRect(T * TileType.CORRIDOR, 0, T, T)
    g.fillStyle(c.path2, 0.5)
    g.fillRect(T * TileType.CORRIDOR + 16, 6, 6, 3)
    g.fillRect(T * TileType.CORRIDOR + 4, 18, 5, 3)
    g.fillRect(T * TileType.CORRIDOR + 22, 24, 4, 2)
    // Path edge highlight
    g.lineStyle(1, 0xffffff, 0.04)
    g.lineBetween(T * TileType.CORRIDOR, 0, T * TileType.CORRIDOR + T, 0)

    g.generateTexture(`tileset_${theme}`, T * 3, T)
    g.destroy()
  }

  private generateBullets() {
    const g = this.add.graphics()

    // Bullet (shotgun) - yellow with bright core
    g.fillStyle(0xff8800, 1)
    g.fillCircle(4, 4, 4)
    g.fillStyle(0xffeb3b, 1)
    g.fillCircle(4, 4, 2.5)
    g.fillStyle(0xffffff, 0.9)
    g.fillCircle(4, 4, 1)
    g.generateTexture("bullet", 8, 8)

    g.clear()
    // SMG bullet - dark yellow with golden core
    g.fillStyle(0xcc8800, 1)
    g.fillCircle(3, 3, 3)
    g.fillStyle(0xffcc00, 0.9)
    g.fillCircle(3, 3, 1.5)
    g.fillStyle(0xffffff, 0.8)
    g.fillCircle(3, 3, 0.8)
    g.generateTexture("bullet_smg", 6, 6)

    g.clear()
    // Pistol bullet - light grey with bright white core
    g.fillStyle(0x999999, 1)
    g.fillCircle(3, 3, 3)
    g.fillStyle(0xffffff, 0.9)
    g.fillCircle(3, 3, 1.5)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(3, 3, 0.7)
    g.generateTexture("bullet_pistol", 6, 6)

    g.destroy()
  }

  private generateItems() {
    const g = this.add.graphics()

    // Health small - heart with cross
    g.fillStyle(0xcc0033, 1)
    g.fillCircle(8, 8, 8)
    g.fillStyle(COLORS.HEART, 1)
    g.fillCircle(8, 8, 6)
    // Red cross in center
    g.fillStyle(0xffffff, 0.8)
    g.fillRect(6, 5, 4, 6)
    g.fillRect(5, 6, 6, 4)
    g.fillStyle(0xffffff, 0.3)
    g.fillCircle(6, 5, 2)
    g.generateTexture("item_health_small", 16, 16)

    g.clear()
    // Health large - bigger heart with cross
    g.fillStyle(0xcc0033, 1)
    g.fillCircle(12, 12, 12)
    g.fillStyle(COLORS.HEART, 1)
    g.fillCircle(12, 12, 10)
    // Red cross
    g.fillStyle(0xffffff, 0.8)
    g.fillRect(9, 7, 6, 10)
    g.fillRect(7, 9, 10, 6)
    g.fillStyle(0xffffff, 0.3)
    g.fillCircle(9, 8, 3)
    g.generateTexture("item_health_large", 24, 24)

    g.clear()
    // Gold coin with star symbol
    g.fillStyle(0xcc8800, 1)
    g.fillCircle(6, 6, 6)
    g.fillStyle(COLORS.GOLD, 1)
    g.fillCircle(6, 6, 5)
    g.fillStyle(0xffffff, 0.5)
    g.fillCircle(4, 4, 2)
    // Star/diamond symbol
    g.fillStyle(0xcc8800, 0.9)
    g.fillRect(5, 3, 2, 6)
    g.fillRect(3, 5, 6, 2)
    g.generateTexture("item_gold_coin", 12, 12)

    g.clear()
    // XP orb - layered diamond with glow
    g.fillStyle(0x00aa66, 1)
    g.beginPath()
    g.moveTo(6, 0); g.lineTo(12, 6); g.lineTo(6, 12); g.lineTo(0, 6)
    g.closePath(); g.fillPath()
    g.fillStyle(0x00ff88, 1)
    g.beginPath()
    g.moveTo(6, 2); g.lineTo(10, 6); g.lineTo(6, 10); g.lineTo(2, 6)
    g.closePath(); g.fillPath()
    g.fillStyle(0x88ffcc, 0.7)
    g.fillCircle(6, 6, 2.5)
    g.generateTexture("item_xp", 12, 12)

    g.destroy()
  }

  private generateShotgunTexture() {
    const g = this.add.graphics()
    // Body
    g.fillStyle(0x444444, 1)
    g.fillRect(0, 0, 48, 10)
    // Metallic highlight
    g.fillStyle(0x666666, 1)
    g.fillRect(6, 1, 36, 8)
    // Barrel end
    g.fillStyle(0x888888, 0.6)
    g.fillRect(40, 1, 4, 8)
    // Wood grip
    g.fillStyle(0x663300, 1)
    g.fillRect(0, 1, 8, 8)
    g.fillStyle(0x884400, 0.5)
    g.fillRect(1, 1, 6, 4)
    // Trigger guard
    g.fillStyle(0x333333, 1)
    g.fillRect(8, 2, 4, 6)
    g.fillStyle(0x444444, 0.5)
    g.fillRect(9, 2, 2, 5)
    // Barrel detail
    g.fillStyle(0x555555, 1)
    g.fillRect(14, 2, 24, 6)
    g.lineStyle(1, 0x777777, 0.4)
    g.lineBetween(14, 4, 38, 4)
    g.lineBetween(14, 7, 38, 7)
    // Muzzle
    g.fillStyle(0x888888, 0.8)
    g.fillRect(44, 2, 4, 6)
    g.generateTexture("weapon_shotgun", 48, 10)
    g.destroy()
  }

  private generateUI() {
    const g = this.add.graphics()

    g.fillStyle(COLORS.UI_BG, 0.85)
    g.fillRoundedRect(0, 0, 220, 36, 6)
    // Border highlight
    g.lineStyle(1, 0x4fc3f7, 0.3)
    g.strokeRoundedRect(0, 0, 220, 36, 6)
    // Inner highlight
    g.lineStyle(1, 0xffffff, 0.08)
    g.strokeRoundedRect(2, 2, 216, 32, 5)
    g.generateTexture("ui_weapon_bar", 220, 36)

    g.destroy()
  }

  private generateEnemyBulletTextures() {
    const g = this.add.graphics()

    g.fillStyle(0xcc0033, 1)
    g.fillCircle(3, 3, 3)
    g.fillStyle(0xff4444, 1)
    g.fillCircle(3, 3, 2)
    g.fillStyle(0xff8888, 0.7)
    g.fillCircle(3, 3, 1)
    g.generateTexture("bullet_enemy", 6, 6)

    g.destroy()
  }

  private generateBossWeaponTextures() {
    const g = this.add.graphics()

    // bullet_laser — 红色光束 (8x5)
    g.fillStyle(0xff2222, 1)
    g.fillRect(0, 1, 8, 3)
    g.fillStyle(0xff8888, 0.8)
    g.fillRect(1, 2, 6, 1)
    g.generateTexture("bullet_laser", 8, 5)

    // bullet_grenade — 橙色大弹丸 (8x8)
    g.clear()
    g.fillStyle(0xcc4400, 1)
    g.fillCircle(4, 4, 4)
    g.fillStyle(0xff8800, 0.8)
    g.fillCircle(4, 4, 2.5)
    g.generateTexture("bullet_grenade", 8, 8)

    // bullet_freeze — 蓝色菱形 (6x6)
    g.clear()
    g.fillStyle(0x44aaff, 1)
    g.beginPath()
    g.moveTo(3, 0); g.lineTo(6, 3); g.lineTo(3, 6); g.lineTo(0, 3)
    g.closePath(); g.fillPath()
    g.fillStyle(0x88ccff, 0.6)
    g.fillCircle(3, 3, 1.5)
    g.generateTexture("bullet_freeze", 6, 6)

    // bullet_minigun — 亮黄色小点 (4x4)
    g.clear()
    g.fillStyle(0xffdd00, 1)
    g.fillCircle(2, 2, 2)
    g.fillStyle(0xffffff, 0.8)
    g.fillCircle(2, 2, 1)
    g.generateTexture("bullet_minigun", 4, 4)

    // bullet_cannon — 白色大光球 (10x10)
    g.clear()
    g.fillStyle(0xccccff, 1)
    g.fillCircle(5, 5, 5)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(5, 5, 3)
    g.fillStyle(0xffffff, 0.9)
    g.fillCircle(5, 5, 1.5)
    g.generateTexture("bullet_cannon", 10, 10)

    // weapon_pickup — 发光星形拾取物 (16x16)
    g.clear()
    g.fillStyle(0x4fc3f7, 1)
    g.beginPath()
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i - Math.PI / 4
      const x = 8 + 7 * Math.cos(a)
      const y = 8 + 7 * Math.sin(a)
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.closePath(); g.fillPath()
    g.fillStyle(0xffffff, 0.5)
    g.fillCircle(8, 8, 3)
    g.lineStyle(1, 0xffffff, 0.4)
    g.strokeCircle(8, 8, 7)
    g.generateTexture("weapon_pickup", 16, 16)

    g.destroy()
  }

  create() {
    this.scene.start("MapSelectScene")
  }
}
