import Phaser from "phaser"
import { MapTheme, THEMES } from "@/systems/MapThemes"
import { loadSave, SaveData } from "@/systems/TalentDefs"
import { SoundManager } from "@/systems/SoundManager"

export class MapSelectScene extends Phaser.Scene {
  private save!: SaveData
  private soundManager!: SoundManager

  constructor() {
    super("MapSelectScene")
  }

  create() {
    this.save = loadSave()
    this.soundManager = new SoundManager(this)
    this.soundManager.playBGM("bgm_menu")
    this.cameras.main.setBackgroundColor(0x111122)

    this.add.text(480, 30, "选择地图", {
      fontSize: "28px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5)

    this.add.text(480, 65, `晶石: ${this.save.crystals}`, {
      fontSize: "14px", color: "#ffd700", fontFamily: "monospace",
    }).setOrigin(0.5)

    const talentBtn = this.add.text(860, 30, "天赋树", {
      fontSize: "16px", color: "#4fc3f7", fontFamily: "monospace",
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    talentBtn.on("pointerover", () => talentBtn.setColor("#ffffff"))
    talentBtn.on("pointerout", () => talentBtn.setColor("#4fc3f7"))
    talentBtn.on("pointerdown", () => this.scene.start("TalentScene"))

    const themes = Object.values(MapTheme)
    const cols = 2
    const cardW = 300
    const cardH = 200
    const gapX = 40
    const gapY = 30
    const startX = 480 - (cols * cardW + (cols - 1) * gapX) / 2
    const startY = 110

    themes.forEach((theme, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = startX + col * (cardW + gapX) + cardW / 2
      const cy = startY + row * (cardH + gapY) + cardH / 2
      const c = THEMES[theme]
      this.createCard(cx, cy, cardW, cardH, c.title, c.desc, c.ground, c.bg, theme)
    })
  }

  private createCard(
    cx: number, cy: number, w: number, h: number,
    title: string, desc: string, accent: number, bg: number,
    theme: MapTheme,
  ) {
    const card = this.add.graphics()
    card.fillStyle(0x1a1a3e, 1)
    card.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12)
    card.lineStyle(2, accent, 0.6)
    card.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 12)

    const preview = this.add.graphics()
    preview.fillStyle(bg, 1)
    preview.fillRect(cx - 100, cy - 60, 200, 80)

    this.add.text(cx, cy + 40, title, {
      fontSize: "18px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5)

    this.add.text(cx, cy + 62, desc, {
      fontSize: "11px", color: "#aaaacc", fontFamily: "monospace",
    }).setOrigin(0.5)

    const hitZone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true })

    hitZone.on("pointerover", () => {
      card.clear()
      card.fillStyle(0x2a2a5e, 1)
      card.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12)
      card.lineStyle(3, accent, 1)
      card.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 12)
    })
    hitZone.on("pointerout", () => {
      card.clear()
      card.fillStyle(0x1a1a3e, 1)
      card.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12)
      card.lineStyle(2, accent, 0.6)
      card.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 12)
    })
    hitZone.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.time.delayedCall(300, () => {
        this.scene.start("WeaponSelectScene", { theme })
      })
    })
  }

  shutdown() {
    this.soundManager.destroy()
  }
}
