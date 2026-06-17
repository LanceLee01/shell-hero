import Phaser from "phaser"
import { WEAPON_LIST, WeaponDef, WeaponId } from "@/systems/WeaponDefs"
import { MapTheme } from "@/systems/MapThemes"

export class WeaponSelectScene extends Phaser.Scene {
  private theme!: MapTheme

  constructor() {
    super("WeaponSelectScene")
  }

  init(data: { theme: MapTheme }) {
    this.theme = data.theme
  }

  create() {
    this.cameras.main.setBackgroundColor(0x111122)
    this.cameras.main.fadeIn(300)

    this.add.text(480, 50, "选择初始武器", {
      fontSize: "28px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5)

    WEAPON_LIST.forEach((w, i) => {
      const cx = 160 + i * 320; const cy = 300
      this.createWeaponCard(cx, cy, w)
    })

    const back = this.add.text(60, 600, "< 返回", {
      fontSize: "16px", color: "#aaaacc", fontFamily: "monospace",
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })

    back.on("pointerover", () => back.setColor("#ffffff"))
    back.on("pointerout", () => back.setColor("#aaaacc"))
    back.on("pointerdown", () => {
      this.cameras.main.fadeOut(200)
      this.time.delayedCall(200, () => this.scene.start("MapSelectScene"))
    })
  }

  private getWeaponTexture(w: WeaponDef): string {
    if (w.id === WeaponId.SHOTGUN) return "weapon_shotgun"
    if (w.id === WeaponId.SMG) return "weapon_smg"
    return "weapon_pistol"
  }

  private createWeaponCard(cx: number, cy: number, w: WeaponDef) {
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a3e, 1)
    bg.fillRoundedRect(cx - 120, cy - 140, 240, 280, 12)
    bg.lineStyle(2, 0x4fc3f7, 0.4)
    bg.strokeRoundedRect(cx - 120, cy - 140, 240, 280, 12)

    const texKey = this.getWeaponTexture(w)
    if (this.textures.exists(texKey)) {
      const tex = this.add.image(cx, cy - 60, texKey)
      tex.setScale(6)
      tex.setAlpha(0.9)
    }

    this.add.text(cx, cy + 10, w.name, {
      fontSize: "20px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5)

    const dps = Math.round(w.damage * (1000 / w.fireRate))
    const maxDps = 300
    const maxFireRate = 600

    this.add.text(cx, cy + 40, "伤害", { fontSize: "12px", color: "#888888", fontFamily: "monospace" }).setOrigin(0.5)
    this.drawBar(cx, cy + 54, w.damage, 30)
    this.add.text(cx, cy + 70, `${w.damage}`, { fontSize: "11px", color: "#ff8888", fontFamily: "monospace" }).setOrigin(0.5)

    this.add.text(cx, cy + 90, "射速", { fontSize: "12px", color: "#888888", fontFamily: "monospace" }).setOrigin(0.5)
    const rateScore = Math.round((1 - w.fireRate / maxFireRate) * 100)
    this.drawBar(cx, cy + 104, w.fireRate, maxFireRate, true)
    this.add.text(cx, cy + 120, `${w.fireRate}ms`, { fontSize: "11px", color: "#88ff88", fontFamily: "monospace" }).setOrigin(0.5)

    this.add.text(cx, cy + 140, "DPS", { fontSize: "12px", color: "#888888", fontFamily: "monospace" }).setOrigin(0.5)
    this.drawBar(cx, cy + 154, dps, maxDps)
    this.add.text(cx, cy + 170, `${dps}`, { fontSize: "11px", color: "#ffcc44", fontFamily: "monospace" }).setOrigin(0.5)

    if (w.pellets && w.pellets > 1) {
      this.add.text(cx, cy + 190, `弹道: ${w.pellets}`, {
        fontSize: "13px", color: "#88ccff", fontFamily: "monospace",
      }).setOrigin(0.5)
    }

    const zone = this.add.zone(cx, cy, 240, 280).setInteractive({ useHandCursor: true })
    zone.on("pointerover", () => {
      bg.clear()
      bg.fillStyle(0x2a2a5e, 1)
      bg.fillRoundedRect(cx - 120, cy - 140, 240, 280, 12)
      bg.lineStyle(3, 0x4fc3f7, 1)
      bg.strokeRoundedRect(cx - 120, cy - 140, 240, 280, 12)
    })
    zone.on("pointerout", () => {
      bg.clear()
      bg.fillStyle(0x1a1a3e, 1)
      bg.fillRoundedRect(cx - 120, cy - 140, 240, 280, 12)
      bg.lineStyle(2, 0x4fc3f7, 0.4)
      bg.strokeRoundedRect(cx - 120, cy - 140, 240, 280, 12)
    })
    zone.on("pointerdown", () => {
      this.cameras.main.fadeOut(300)
      this.time.delayedCall(300, () => {
        this.scene.start("GameScene", { theme: this.theme, weaponId: w.id })
      })
    })
  }

  private drawBar(cx: number, y: number, value: number, max: number, inverted = false) {
    const barW = 160
    const barH = 8
    const ratio = inverted ? 1 - Math.min(value / max, 1) : Math.min(value / max, 1)
    const g = this.add.graphics()
    g.fillStyle(0x333355, 1)
    g.fillRoundedRect(cx - barW / 2, y, barW, barH, 3)
    const color = ratio > 0.6 ? 0x4fc3f7 : ratio > 0.3 ? 0xffcc44 : 0xff4444
    g.fillStyle(color, 1)
    if (ratio > 0) {
      g.fillRoundedRect(cx - barW / 2, y, Math.max(barW * ratio, 4), barH, 3)
    }
  }
}
