import Phaser from "phaser"
import { BootScene } from "@/scenes/BootScene"
import { MapSelectScene } from "@/scenes/MapSelectScene"
import { WeaponSelectScene } from "@/scenes/WeaponSelectScene"
import { TalentScene } from "@/scenes/TalentScene"
import { GameScene } from "@/scenes/GameScene"
import { GAME_WIDTH, GAME_HEIGHT } from "@/config"

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MapSelectScene, WeaponSelectScene, TalentScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
}

new Phaser.Game(config)
