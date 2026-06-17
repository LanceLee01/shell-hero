import Phaser from "phaser"

// ─── Sound Key Enum ───

export enum SoundKey {
  SHOOT = "shoot",
  HIT_ENEMY = "hit_enemy",
  KILL_ENEMY = "kill_enemy",
  PLAYER_HURT = "player_hurt",
  PLAYER_DODGE = "player_dodge",
  LEVEL_UP = "level_up",
  WAVE_START = "wave_start",
  WAVE_CLEAR = "wave_clear",
  BOSS_APPEAR = "boss_appear",
  BOSS_PHASE = "boss_phase",
  BOSS_DEATH = "boss_death",
  GAME_OVER = "game_over",
  UI_CLICK = "ui_click",
}

// ─── Key → File Path Mapping ───

export const SOUND_KEYS: Record<SoundKey, string> = {
  [SoundKey.SHOOT]: "assets/audio/shoot.wav",
  [SoundKey.HIT_ENEMY]: "assets/audio/hit_enemy.wav",
  [SoundKey.KILL_ENEMY]: "assets/audio/kill_enemy.wav",
  [SoundKey.PLAYER_HURT]: "assets/audio/player_hurt.wav",
  [SoundKey.PLAYER_DODGE]: "assets/audio/player_dodge.wav",
  [SoundKey.LEVEL_UP]: "assets/audio/level_up.wav",
  [SoundKey.WAVE_START]: "assets/audio/wave_start.wav",
  [SoundKey.WAVE_CLEAR]: "assets/audio/wave_clear.wav",
  [SoundKey.BOSS_APPEAR]: "assets/audio/boss_appear.wav",
  [SoundKey.BOSS_PHASE]: "assets/audio/boss_phase.wav",
  [SoundKey.BOSS_DEATH]: "assets/audio/boss_death.wav",
  [SoundKey.GAME_OVER]: "assets/audio/game_over.wav",
  [SoundKey.UI_CLICK]: "assets/audio/ui_click.wav",
}

// ─── Sound Manager ───

export class SoundManager {
  private scene: Phaser.Scene
  private currentBGM?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound
  private bgmTween?: Phaser.Tweens.Tween

  public sfxVolume = 0.6
  public bgmVolume = 0.4

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // ── Volume Controls ──

  setSFXVolume(v: number) {
    this.sfxVolume = Phaser.Math.Clamp(v, 0, 1)
  }

  setBGMVolume(v: number) {
    this.bgmVolume = Phaser.Math.Clamp(v, 0, 1)
  }

  // ── SFX ──

  playSFX(key: SoundKey) {
    try {
      this.scene.sound.play(key, { volume: this.sfxVolume })
    } catch {
      // Autoplay policy or missing file — silently ignore
    }
  }

  // ── BGM ──

  playBGM(key: string) {
    try {
      this.stopBGM()
      const sound = this.scene.sound.add(key, { loop: true, volume: this.bgmVolume })
      sound.play()
      this.currentBGM = sound
    } catch {
      // Autoplay policy or missing file
    }
  }

  stopBGM() {
    try {
      if (this.bgmTween) {
        this.bgmTween.stop()
        this.bgmTween = undefined
      }
      if (this.currentBGM) {
        this.currentBGM.stop()
        this.currentBGM.destroy()
        this.currentBGM = undefined
      }
    } catch {
      // Ignore
    }
  }

  fadeOutBGM(duration: number) {
    try {
      if (!this.currentBGM) return
      const tweens = this.scene.tweens.add({
        targets: this.currentBGM,
        volume: 0,
        duration,
        onComplete: () => {
          this.currentBGM?.stop()
          this.currentBGM = undefined
          this.bgmTween = undefined
        },
      })
      this.bgmTween = tweens
    } catch {
      // Ignore
    }
  }

  fadeInBGM(key: string, duration: number) {
    try {
      this.stopBGM()
      const sound = this.scene.sound.add(key, { loop: true, volume: 0 })
      this.currentBGM = sound
      sound.play()
      const tweens = this.scene.tweens.add({
        targets: sound,
        volume: this.bgmVolume,
        duration,
        onComplete: () => {
          this.bgmTween = undefined
        },
      })
      this.bgmTween = tweens
    } catch {
      // Ignore
    }
  }

  // ── Preload Helper ──

  static preload(scene: Phaser.Scene) {
    for (const [key, path] of Object.entries(SOUND_KEYS)) {
      scene.load.audio(key, path)
    }
  }

  // ── Cleanup ──

  destroy() {
    this.stopBGM()
    try {
      if (this.bgmTween) {
        this.bgmTween.stop()
        this.bgmTween = undefined
      }
    } catch {
      // Ignore
    }
  }
}
