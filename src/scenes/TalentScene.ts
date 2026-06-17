import Phaser from "phaser"
import { TALENTS, loadSave, saveSave, SaveData, getTalentLevel } from "@/systems/TalentDefs"

export class TalentScene extends Phaser.Scene {
  private save!: SaveData
  private crystalText!: Phaser.GameObjects.Text
  private talentContainer!: Phaser.GameObjects.Container

  constructor() {
    super("TalentScene")
  }

  create() {
    this.save = loadSave()
    this.cameras.main.setBackgroundColor(0x111122)

    this.add.text(480, 40, "天赋树", {
      fontSize: "28px", color: "#4fc3f7", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5)

    this.crystalText = this.add.text(480, 78, "", {
      fontSize: "16px", color: "#ffd700", fontFamily: "monospace",
    }).setOrigin(0.5)
    this.updateCrystalText()

    this.talentContainer = this.add.container(0, 0)
    this.renderTalents()

    const back = this.add.text(60, 600, "< 返回", {
      fontSize: "16px", color: "#aaaacc", fontFamily: "monospace",
    }).setInteractive({ useHandCursor: true })
    back.on("pointerover", () => back.setColor("#ffffff"))
    back.on("pointerout", () => back.setColor("#aaaacc"))
    back.on("pointerdown", () => this.scene.start("MapSelectScene"))
  }

  private updateCrystalText() {
    this.crystalText.setText(`晶石: ${this.save.crystals}`)
  }

  private renderTalents() {
    this.talentContainer.removeAll(true)

    TALENTS.forEach((t, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const cx = 160 + col * 320
      const cy = 170 + row * 150

      const level = getTalentLevel(this.save, t.id)
      const maxed = level >= t.maxLevel
      const cost = t.costPerLevel * (level + 1)
      const canAfford = this.save.crystals >= cost && !maxed

      const bg = this.add.graphics()
      const bgColor = maxed ? 0x1a2a1a : canAfford ? 0x1a1a3e : 0x1a1a1a
      const borderColor = maxed ? 0x4caf50 : canAfford ? 0x4fc3f7 : 0x444444
      bg.fillStyle(bgColor, 1)
      bg.fillRoundedRect(cx - 130, cy - 55, 260, 110, 10)
      bg.lineStyle(2, borderColor, maxed ? 0.8 : canAfford ? 0.6 : 0.3)
      bg.strokeRoundedRect(cx - 130, cy - 55, 260, 110, 10)

      const nameText = this.add.text(cx - 110, cy - 40, `${t.name} Lv.${level}/${t.maxLevel}`, {
        fontSize: "15px", color: maxed ? "#4caf50" : "#ffffff", fontFamily: "monospace", fontStyle: "bold",
      })

      const descText = this.add.text(cx - 110, cy - 18, t.desc(level), {
        fontSize: "12px", color: "#aaaacc", fontFamily: "monospace",
      })

      let actionText: Phaser.GameObjects.Text
      if (maxed) {
        actionText = this.add.text(cx + 110, cy, "已满级", {
          fontSize: "13px", color: "#4caf50", fontFamily: "monospace",
        }).setOrigin(1, 0.5)
      } else if (canAfford) {
        actionText = this.add.text(cx + 110, cy, `升级 (${cost})`, {
          fontSize: "13px", color: "#4fc3f7", fontFamily: "monospace",
        }).setOrigin(1, 0.5)

        const zone = this.add.zone(cx + 110, cy, 120, 40).setInteractive({ useHandCursor: true })
        zone.on("pointerdown", () => {
          this.save.talents[t.id] = (this.save.talents[t.id] || 0) + 1
          this.save.crystals -= cost
          saveSave(this.save)
          this.updateCrystalText()
          this.renderTalents()
        })
      } else {
        actionText = this.add.text(cx + 110, cy, `需要 ${cost}`, {
          fontSize: "13px", color: "#ff5252", fontFamily: "monospace",
        }).setOrigin(1, 0.5)
      }

      this.talentContainer.add([bg, nameText, descText, actionText])
    })
  }
}
