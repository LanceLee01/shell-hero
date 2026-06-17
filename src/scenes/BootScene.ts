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
    this.load.image("enemy", "assets/enemy.png")
    this.load.image("weapon_pistol", "assets/weapon_pistol.png")
    this.load.image("weapon_smg", "assets/weapon_smg.png")
    this.generateBullets()
    this.generateItems()
    this.generateUI()
    this.generateShotgunTexture()
    this.generateEnemyTextures()
    this.generateBossTextures()
    this.generateEnemyBulletTextures()

    // Audio: SFX (via SoundManager) + BGM
    SoundManager.preload(this)
    this.load.audio("bgm_menu", "assets/audio/bgm_menu.wav")
    this.load.audio("bgm_game", "assets/audio/bgm_game.wav")
  }

  private generateTileset(theme: MapTheme) {
    const g = this.add.graphics()
    const T = TILE_SIZE
    const c = THEMES[theme]

    g.fillStyle(c.obstacle, 1)
    g.fillRect(T * TileType.WALL, 0, T, T)
    g.fillStyle(0x000000, 0.2)
    g.fillRect(T * TileType.WALL + 4, T - 8, T - 8, 4)

    g.fillStyle(c.ground, 1)
    g.fillRect(T * TileType.FLOOR, 0, T, T)
    g.fillStyle(c.ground2, 0.4)
    g.fillRect(T * TileType.FLOOR + 6, 8, 8, 4)
    g.fillRect(T * TileType.FLOOR + 20, 20, 6, 3)

    g.fillStyle(c.path, 1)
    g.fillRect(T * TileType.CORRIDOR, 0, T, T)
    g.fillStyle(c.path2, 0.5)
    g.fillRect(T * TileType.CORRIDOR + 16, 6, 6, 3)

    g.generateTexture(`tileset_${theme}`, T * 3, T)
    g.destroy()
  }

  private generateBullets() {
    const g = this.add.graphics()

    g.fillStyle(0xffeb3b, 1)
    g.fillCircle(4, 4, 4)
    g.generateTexture("bullet", 8, 8)

    g.clear()
    g.fillStyle(0xffcc00, 1)
    g.fillCircle(3, 3, 3)
    g.generateTexture("bullet_smg", 6, 6)

    g.clear()
    g.fillStyle(0xffffff, 0.9)
    g.fillCircle(3, 3, 3)
    g.generateTexture("bullet_pistol", 6, 6)

    g.destroy()
  }

  private generateItems() {
    const g = this.add.graphics()

    g.fillStyle(COLORS.HEART, 1)
    g.fillCircle(8, 8, 8)
    g.fillStyle(0xffffff, 0.3)
    g.fillCircle(6, 6, 3)
    g.generateTexture("item_health_small", 16, 16)
    g.clear()
    g.fillStyle(COLORS.HEART, 1)
    g.fillCircle(12, 12, 12)
    g.fillStyle(0xffffff, 0.3)
    g.fillCircle(9, 9, 4)
    g.generateTexture("item_health_large", 24, 24)

    g.clear()
    g.fillStyle(COLORS.GOLD, 1)
    g.fillCircle(6, 6, 6)
    g.fillStyle(0xffffff, 0.4)
    g.fillCircle(4, 4, 2)
    g.generateTexture("item_gold_coin", 12, 12)

    g.clear()
    g.fillStyle(0x00ff88, 1)
    g.beginPath()
    g.moveTo(6, 0); g.lineTo(12, 6); g.lineTo(6, 12); g.lineTo(0, 6)
    g.closePath(); g.fillPath()
    g.fillStyle(0x88ffcc, 0.6)
    g.fillCircle(6, 6, 3)
    g.generateTexture("item_xp", 12, 12)

    g.destroy()
  }

  private generateShotgunTexture() {
    const g = this.add.graphics()
    g.fillStyle(0x444444, 1)
    g.fillRect(0, 0, 48, 10)
    g.fillStyle(0x555555, 1)
    g.fillRect(6, 1, 36, 8)
    g.fillStyle(0x663300, 1)
    g.fillRect(42, 1, 6, 8)
    g.fillStyle(0x333333, 1)
    g.fillRect(2, 3, 6, 4)
    g.fillStyle(0x555555, 1)
    g.fillRect(12, 2, 8, 6)
    g.generateTexture("weapon_shotgun", 48, 10)
    g.destroy()
  }

  private generateUI() {
    const g = this.add.graphics()

    g.fillStyle(COLORS.UI_BG, 0.7)
    g.fillRoundedRect(0, 0, 220, 36, 6)
    g.generateTexture("ui_weapon_bar", 220, 36)

    g.destroy()
  }

  private generateEnemyTextures() {
    const g = this.add.graphics()

    // Charger: small enemy (16x16)
    g.fillStyle(0xff8800, 1)
    g.fillCircle(8, 8, 8)
    g.fillStyle(0xcc6600, 1)
    g.fillCircle(8, 8, 5)
    g.generateTexture("enemy_charger", 16, 16)

    g.clear()

    // Shooter: medium enemy (20x20)
    g.fillStyle(0xaa44ff, 1)
    g.fillCircle(10, 10, 10)
    g.fillStyle(0x8833cc, 1)
    g.fillCircle(10, 10, 6)
    g.generateTexture("enemy_shooter", 20, 20)

    g.clear()

    // Elite: large enemy (32x32)
    g.fillStyle(0xff0044, 1)
    g.fillCircle(16, 16, 16)
    g.fillStyle(0xcc0033, 1)
    g.fillCircle(16, 16, 10)
    g.lineStyle(2, 0xff4488, 0.6)
    g.strokeCircle(16, 16, 18)
    g.generateTexture("enemy_elite", 32, 32)

    g.destroy()
  }

  private generateBossTextures() {
    const g = this.add.graphics()

    // Boss: large dark purple hexagon with glow border
    g.fillStyle(0x4a0080, 1)
    g.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const x = 20 + 20 * Math.cos(angle)
      const y = 20 + 20 * Math.sin(angle)
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.closePath(); g.fillPath()
    g.lineStyle(3, 0x8844cc, 1)
    g.strokePath()
    g.generateTexture("boss", 40, 40)

    g.destroy()
  }

  private generateEnemyBulletTextures() {
    const g = this.add.graphics()

    g.fillStyle(0xff4444, 1)
    g.fillCircle(3, 3, 3)
    g.generateTexture("bullet_enemy", 6, 6)

    g.destroy()
  }

  create() {
    this.scene.start("MapSelectScene")
  }
}
