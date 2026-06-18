import Phaser from "phaser"
import { MapTheme, THEMES } from "@/systems/MapThemes"
import { loadSave, saveSave, SaveData, SaveSlot, getActiveSlot, switchSlot, createSlot, deleteSlot } from "@/systems/TalentDefs"
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

    const activeSlot = getActiveSlot(this.save)
    this.add.text(480, 65, "晶石: " + activeSlot.crystals, {
      fontSize: "14px", color: "#ffd700", fontFamily: "monospace",
    }).setOrigin(0.5)

    const talentBtn = this.add.text(860, 30, "天赋树", {
      fontSize: "16px", color: "#4fc3f7", fontFamily: "monospace",
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    talentBtn.on("pointerover", () => talentBtn.setColor("#ffffff"))
    talentBtn.on("pointerout", () => talentBtn.setColor("#4fc3f7"))
    talentBtn.on("pointerdown", () => this.scene.start("TalentScene"))

    // 存档槽位选择
    this.createSaveSlots()

    const themes = Object.values(MapTheme)
    const cols = 2
    const cardW = 300
    const cardH = 200
    const gapX = 40
    const gapY = 30
    const startX = 480 - (cols * cardW + (cols - 1) * gapX) / 2
    const startY = 180

    themes.forEach((theme, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = startX + col * (cardW + gapX) + cardW / 2
      const cy = startY + row * (cardH + gapY) + cardH / 2
      const c = THEMES[theme]
      this.createCard(cx, cy, cardW, cardH, c.title, c.desc, c.ground, c.bg, theme)
    })
  }

  private createSaveSlots() {
    const slotW = 160
    const slotH = 80
    const gap = 20
    const startX = 480 - (this.save.slots.length * (slotW + gap)) / 2
    const startY = 100

    this.save.slots.forEach((slot, i) => {
      const cx = startX + i * (slotW + gap) + slotW / 2
      const isActive = i === this.save.activeSlot
      const accent = isActive ? 0x4fc3f7 : 0x444466

      const card = this.add.graphics()
      card.fillStyle(0x1a1a3e, 1)
      card.fillRoundedRect(cx - slotW / 2, startY - slotH / 2, slotW, slotH, 8)
      card.lineStyle(2, accent, isActive ? 1 : 0.6)
      card.strokeRoundedRect(cx - slotW / 2, startY - slotH / 2, slotW, slotH, 8)

      this.add.text(cx, startY - 20, slot.name, {
        fontSize: "14px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
      }).setOrigin(0.5)

      this.add.text(cx, startY, "晶石: " + slot.crystals, {
        fontSize: "11px", color: "#ffd700", fontFamily: "monospace",
      }).setOrigin(0.5)

      const lastSave = slot.lastSave ? new Date(slot.lastSave).toLocaleDateString() : "未保存"
      this.add.text(cx, startY + 18, lastSave, {
        fontSize: "10px", color: "#aaaacc", fontFamily: "monospace",
      }).setOrigin(0.5)

      const hitZone = this.add.zone(cx, startY, slotW, slotH).setInteractive({ useHandCursor: true })

      hitZone.on("pointerover", () => {
        card.clear()
        card.fillStyle(0x2a2a5e, 1)
        card.fillRoundedRect(cx - slotW / 2, startY - slotH / 2, slotW, slotH, 8)
        card.lineStyle(3, accent, 1)
        card.strokeRoundedRect(cx - slotW / 2, startY - slotH / 2, slotW, slotH, 8)
      })
      hitZone.on("pointerout", () => {
        card.clear()
        card.fillStyle(0x1a1a3e, 1)
        card.fillRoundedRect(cx - slotW / 2, startY - slotH / 2, slotW, slotH, 8)
        card.lineStyle(2, accent, isActive ? 1 : 0.6)
        card.strokeRoundedRect(cx - slotW / 2, startY - slotH / 2, slotW, slotH, 8)
      })

      // Left click: switch to this slot
      hitZone.on("pointerdown", () => {
        switchSlot(this.save, i)
        saveSave(this.save)
        this.scene.restart()
      })
    })

    // New save slot button
    if (this.save.slots.length < 3) {
      const addX = startX + this.save.slots.length * (slotW + gap) + slotW / 2
      const addCard = this.add.graphics()
      addCard.fillStyle(0x1a1a3e, 1)
      addCard.fillRoundedRect(addX - slotW / 2, startY - slotH / 2, slotW, slotH, 8)
      addCard.lineStyle(2, 0x444466, 0.6)
      addCard.strokeRoundedRect(addX - slotW / 2, startY - slotH / 2, slotW, slotH, 8)

      this.add.text(addX, startY, "+ 新存档", {
        fontSize: "14px", color: "#4fc3f7", fontFamily: "monospace",
      }).setOrigin(0.5)

      const addZone = this.add.zone(addX, startY, slotW, slotH).setInteractive({ useHandCursor: true })
      addZone.on("pointerdown", () => {
        createSlot(this.save, "存档 " + (this.save.slots.length + 1))
        saveSave(this.save)
        this.scene.restart()
      })
    }
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
