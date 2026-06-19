import Phaser from "phaser"
import { TILE_SIZE, PLAYER, DODGE, COLORS, GAME_WIDTH, GAME_HEIGHT } from "@/config"
import { MAP_WIDTH, MAP_HEIGHT, TileType } from "@/map/types"
import { EnemyType, ENEMY_LIST, ENEMY_DEFS, EnemyConfig } from "@/systems/EnemyDefs"
import { WeaponId, WEAPON_LIST, WeaponDef } from "@/systems/WeaponDefs"
import { ItemType, ITEM_DEFS, ItemDef } from "@/systems/ItemDefs"
import { XP_BASE, XP_INCREMENT, getRandomUpgrades } from "@/systems/UpgradeDefs"
import { MapTheme, THEMES } from "@/systems/MapThemes"
import { loadSave, computeBonuses, saveSave, getActiveSlot } from "@/systems/TalentDefs"
import { BOSS_DEF } from "@/systems/BossDefs"
import { SoundManager, SoundKey } from "@/systems/SoundManager"

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>
  private keyboard!: Record<string, Phaser.Input.Keyboard.Key>
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private pickups!: Phaser.Physics.Arcade.Group
  private hpBar!: Phaser.GameObjects.Graphics
  private playerHP: number = PLAYER.MAX_HP
  private invincible: boolean = false

  private weaponIdx: number = 0
  private weaponTimer: number = 0
  private initWeaponId?: WeaponId
  private weaponSlots: (WeaponDef | null)[] = [null, null, null]
  private key1!: Phaser.Input.Keyboard.Key
  private key2!: Phaser.Input.Keyboard.Key
  private key3!: Phaser.Input.Keyboard.Key
  private dodgeCooldownMs: number = DODGE.COOLDOWN

  private isDodging: boolean = false
  private dodgeTimer: number = 0
  private dodgeCooldownTimer: number = 0
  private dodgeDirX: number = 0
  private dodgeDirY: number = 0

  private gold: number = 0

  private uiWeaponBg!: Phaser.GameObjects.Image
  private uiWeaponLabels: Phaser.GameObjects.Text[] = []
  private uiResources!: Phaser.GameObjects.Text
  private uiWaveText!: Phaser.GameObjects.Text
  private uiXpBar!: Phaser.GameObjects.Graphics

  private waveNumber: number = 0
  private waveActive: boolean = false

  private level: number = 0
  private xp: number = 0
  private xpToNext: number = XP_BASE
  private damageMult: number = 1
  private fireRateMult: number = 1
  private speedMult: number = 1
  private maxHpBonus: number = 0
  private projSpeedMult: number = 1
  private extraPellets: number = 0
  private playerMaxHP: number = PLAYER.MAX_HP

  private upgradeActive: boolean = false
  private upgradeElements: Phaser.GameObjects.GameObject[] = []
  private xpOrbValue: number = 10
  private theme!: MapTheme

  private boss!: Phaser.Physics.Arcade.Sprite | null
  private bossHP: number = 0
  private bossMaxHP: number = 0
  private bossPhase: number = 0
  private bossAttackTimer: number = 0

  private bossHPBarBg!: Phaser.GameObjects.Graphics
  private bossHPBarFill!: Phaser.GameObjects.Graphics
  private bossHPBarText!: Phaser.GameObjects.Text

  private soundManager!: SoundManager
  private damageOverlay!: Phaser.GameObjects.Graphics

  constructor() {
    super("GameScene")
  }

  init(data: { theme?: MapTheme; weaponId?: WeaponId }) {
    this.theme = data.theme || MapTheme.GRASSLAND
    this.initWeaponId = data.weaponId
  }

  create() {
    this.playerHP = PLAYER.MAX_HP
    this.invincible = false
    this.weaponIdx = 0
    this.weaponTimer = 0
    this.isDodging = false
    this.dodgeTimer = 0
    this.dodgeCooldownTimer = 0
    this.dodgeCooldownMs = DODGE.COOLDOWN
    this.gold = 0
    this.waveNumber = 0
    this.waveActive = false
    this.level = 0
    this.xp = 0
    this.xpToNext = XP_BASE
    this.damageMult = 1
    this.fireRateMult = 1
    this.speedMult = 1
    this.maxHpBonus = 0
    this.projSpeedMult = 1
    this.extraPellets = 0
    this.playerMaxHP = PLAYER.MAX_HP
    this.upgradeActive = false
    this.boss = null
    this.bossHP = 0
    this.bossMaxHP = 0
    this.bossPhase = 0
    this.bossAttackTimer = 0

    if (this.initWeaponId) {
      const idx = WEAPON_LIST.findIndex((w) => w.id === this.initWeaponId)
      if (idx >= 0) this.weaponIdx = idx
    }

    // 初始化武器槽位：slot 0 = 初始武器
    const initWeapon = WEAPON_LIST.find(w => w.id === this.initWeaponId)
    this.weaponSlots[0] = initWeapon || WEAPON_LIST[0]

    const talSave = loadSave()
    const talBonus = computeBonuses(getActiveSlot(talSave))
    this.maxHpBonus = talBonus.maxHp
    this.playerMaxHP = PLAYER.MAX_HP + this.maxHpBonus
    this.playerHP = this.playerMaxHP
    this.damageMult = 1 + talBonus.damagePercent / 100
    this.speedMult = 1 + talBonus.speedPercent / 100
    this.gold = talBonus.startGold
    this.dodgeCooldownMs = Math.max(200, DODGE.COOLDOWN - talBonus.dodgeCdReduction)
    this.xpOrbValue = Math.round(10 * (1 + talBonus.xpPercent / 100))

    this.soundManager = new SoundManager(this)
    this.soundManager.fadeInBGM("bgm_game", 1000)

    this.cameras.main.setBackgroundColor(THEMES[this.theme].bg)
    this.cameras.main.fadeIn(500)

    this.createGround()
    this.spawnPlayer()
    this.createControls()
    this.createBullets()
    this.createPickups()
    this.scatterItems()
    this.enemies = this.physics.add.group()
    this.enemyBullets = this.physics.add.group({ defaultKey: "bullet_enemy", maxSize: 100 })
    this.createHPBar()
    this.createBossHPBar()
    this.createHUD()
    this.setupCollisions()
    this.setupCamera()
    this.createDamageOverlay()

    this.time.delayedCall(1500, () => this.startNextWave())
  }

  private createGround() {
    const map = this.make.tilemap({
      tileWidth: TILE_SIZE, tileHeight: TILE_SIZE,
      width: MAP_WIDTH, height: MAP_HEIGHT,
    })
    const key = `tileset_${this.theme}`
    const tileset = map.addTilesetImage(key, key, TILE_SIZE, TILE_SIZE, 0, 0)!
    const layer = map.createBlankLayer("ground", tileset, 0, 0, MAP_WIDTH, MAP_HEIGHT)!
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        layer.putTileAt(TileType.FLOOR, x, y)
      }
    }
  }

  private spawnPlayer() {
    this.player = this.physics.add.sprite(
      Math.floor(MAP_WIDTH / 2) * TILE_SIZE,
      Math.floor(MAP_HEIGHT / 2) * TILE_SIZE,
      "player",
    )
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
    this.player.setCircle(16, 0, 5)
  }

  private createControls() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.keyboard = {
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    }
    this.key1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
    this.key2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
    this.key3 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
  }

  private createBullets() {
    this.bullets = this.physics.add.group({ defaultKey: "bullet", maxSize: 200 })
  }

  private createPickups() {
    this.pickups = this.physics.add.group()
  }

  private scatterItems() {
    for (let i = 0; i < 4; i++) this.spawnPickupAtRandom(ITEM_DEFS.gold_coin)
    for (let i = 0; i < 2; i++) this.spawnPickupAtRandom(ITEM_DEFS.health_small)
  }

  private spawnPickupAtRandom(itemDef: ItemDef) {
    const x = Phaser.Math.Between(2, MAP_WIDTH - 3) * TILE_SIZE
    const y = Phaser.Math.Between(2, MAP_HEIGHT - 3) * TILE_SIZE
    this.spawnPickup(x, y, itemDef)
  }

  private startNextWave() {
    if (this.upgradeActive) {
      this.time.delayedCall(200, () => this.startNextWave())
      return
    }
    if (this.waveActive) return
    this.waveNumber++
    this.waveActive = true

    if (this.waveNumber % 5 === 0) {
      this.spawnBoss()
    } else {
      this.spawnWave()
    }
  }

  private spawnBoss() {
    this.soundManager.playSFX(SoundKey.BOSS_APPEAR)
    // Clear regular enemies
    this.enemies.getChildren().forEach(e => {
      const enemy = e as Phaser.Physics.Arcade.Sprite
      if (enemy.active) enemy.destroy()
    })

    const centerX = Math.floor(MAP_WIDTH / 2) * TILE_SIZE
    const centerY = Math.floor(MAP_HEIGHT / 2) * TILE_SIZE

    this.boss = this.physics.add.sprite(centerX, centerY, "boss") as Phaser.Physics.Arcade.Sprite
    this.boss.setCircle(22, 4, 0)
    this.boss.setDepth(8)
    this.boss.setData("isBoss", true)

    this.bossMaxHP = BOSS_DEF.baseHp + this.waveNumber * BOSS_DEF.hpScalePerWave
    this.bossHP = this.bossMaxHP
    this.bossPhase = 0
    this.bossAttackTimer = 0

    this.enemies.add(this.boss)
    this.cameras.main.shake(500, 0.02)
    // Boss pulse: scale tween 1.0 <-> 1.05 infinite loop
    this.tweens.add({
      targets: this.boss,
      scaleX: 1.05, scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
    this.showWaveText("BOSS!")

    // Show boss HP bar
    this.bossHPBarBg.setVisible(true)
    this.bossHPBarFill.setVisible(true)
    this.bossHPBarText.setVisible(true)
    this.updateBossHPBar()
  }

  private spawnWave() {
    const count = 5 + this.waveNumber * 3
    for (let i = 0; i < count; i++) {
      const edge = Phaser.Math.Between(0, 3)
      let x: number, y: number
      const m = 2
      switch (edge) {
        case 0: x = m; y = Phaser.Math.Between(m, MAP_HEIGHT - m); break
        case 1: x = MAP_WIDTH - m; y = Phaser.Math.Between(m, MAP_HEIGHT - m); break
        case 2: x = Phaser.Math.Between(m, MAP_WIDTH - m); y = m; break
        default: x = Phaser.Math.Between(m, MAP_WIDTH - m); y = MAP_HEIGHT - m; break
      }
      const rand = Math.random()
      let type: EnemyConfig
      if (rand < 0.5) type = ENEMY_LIST[0] // charger
      else if (rand < 0.8) type = ENEMY_LIST[1] // shooter
      else type = ENEMY_LIST[2] // elite
      this.spawnEnemy(type, x * TILE_SIZE, y * TILE_SIZE)
    }
    this.showWaveText(`Wave ${this.waveNumber}`)
  }

  private spawnEnemy(type: EnemyConfig, x: number, y: number) {
    const textureKey = `enemy_${type.id}`
    if (!this.textures.exists(textureKey)) return
    const enemy = this.enemies.create(x, y, textureKey) as Phaser.Physics.Arcade.Sprite
    enemy.setCircle(type.size, 0, 0)
    enemy.setData("hp", type.baseHp + this.waveNumber * 2)
    enemy.setData("type", type.id)
    enemy.setData("damage", type.baseDamage)
    enemy.setDepth(5)

    if (type.id === EnemyType.ELITE) {
      enemy.setData("summonTimer", 5000)
      enemy.setData("summonCount", 0)
      enemy.setDepth(7)
      this.tweens.add({
        targets: enemy,
        scaleX: 1.15, scaleY: 1.15,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    }
  }

  private spawnChargerSummon(parentEnemy: Phaser.Physics.Arcade.Sprite) {
    const def = ENEMY_DEFS[EnemyType.CHARGER]
    const textureKey = `enemy_${def.id}`
    if (!this.textures.exists(textureKey)) return
    const enemy = this.enemies.create(parentEnemy.x, parentEnemy.y, textureKey) as Phaser.Physics.Arcade.Sprite
    enemy.setCircle(def.size, 0, 0)
    enemy.setData("type", EnemyType.CHARGER)
    enemy.setData("hp", def.baseHp + this.waveNumber * 2)
    enemy.setData("damage", def.baseDamage)
    enemy.setData("isSummon", true)
    enemy.setData("parentEnemy", parentEnemy)
    enemy.setDepth(5)
  }

  private showWaveText(msg: string) {
    this.soundManager.playSFX(SoundKey.WAVE_START)
    this.uiWaveText.setText(msg)
    this.tweens.killTweensOf(this.uiWaveText)
    this.uiWaveText.setAlpha(1).setScale(1)
    this.tweens.add({ targets: this.uiWaveText, alpha: 0, scale: 1.5, duration: 800, delay: 400 })
  }

  private checkWave() {
    if (!this.waveActive || this.upgradeActive) return
    if (this.boss && this.boss.active) return // boss handles its own clear
    if (this.enemies.countActive(true) > 0) return
    this.waveActive = false
    this.showWaveText("Wave Clear!")
    this.time.delayedCall(2500, () => this.startNextWave())
  }

  private createHPBar() {
    this.hpBar = this.add.graphics().setDepth(20)
  }

  private createBossHPBar() {
    const centerX = this.cameras.main.centerX
    this.bossHPBarBg = this.add.graphics().setDepth(110).setScrollFactor(0)
    this.bossHPBarBg.setVisible(false)
    this.bossHPBarFill = this.add.graphics().setDepth(111).setScrollFactor(0)
    this.bossHPBarFill.setVisible(false)
    this.bossHPBarText = this.add.text(centerX, -15, "BOSS", {
      fontSize: "14px", color: "#ff4444", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(112).setScrollFactor(0)
    this.bossHPBarText.setVisible(false)
  }

  private updateBossHPBar() {
    const centerX = this.cameras.main.centerX
    const barX = centerX - 150
    const barY = 10
    const barW = 300
    const barH = 20

    this.bossHPBarBg.clear()
    this.bossHPBarBg.fillStyle(0x333333, 1)
    this.bossHPBarBg.fillRoundedRect(barX, barY, barW, barH, 4)

    const ratio = Math.max(0, this.bossHP / this.bossMaxHP)
    this.bossHPBarFill.clear()
    this.bossHPBarFill.fillStyle(0xff4444, 1)
    this.bossHPBarFill.fillRect(barX, barY, barW * ratio, barH)

    this.bossHPBarText.setText(`BOSS - Phase ${this.bossPhase + 1}`)
    this.bossHPBarText.setPosition(centerX, -15)
  }

  private createHUD() {
    this.uiWeaponBg = this.add.image(130, GAME_HEIGHT - 20, "ui_weapon_bar").setDepth(100).setScrollFactor(0)
    for (let i = 0; i < 3; i++) {
      const w = this.weaponSlots[i]
      const label = w ? `${i + 1} ${w.name}` : `${i + 1} 空`
      this.uiWeaponLabels.push(
        this.add.text(26 + i * 73, GAME_HEIGHT - 27, label, {
          fontSize: "13px", color: "#888888", fontFamily: "monospace",
        }).setDepth(101).setScrollFactor(0),
      )
    }
    this.uiResources = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 27, "", {
      fontSize: "13px", color: "#ffd700", fontFamily: "monospace",
    }).setDepth(101).setScrollFactor(0).setOrigin(1, 0)

    this.uiWaveText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "", {
      fontSize: "32px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
    }).setDepth(102).setScrollFactor(0).setOrigin(0.5).setAlpha(0)

    this.uiXpBar = this.add.graphics().setDepth(100).setScrollFactor(0)

    this.updateHUD()
  }

  private setupCollisions() {
    this.physics.add.overlap(this.bullets, this.enemies,
      this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
    this.physics.add.overlap(this.player, this.enemies,
      this.onEnemyTouchPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
    this.physics.add.overlap(this.player, this.pickups,
      this.onPlayerPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
    this.physics.add.overlap(this.player, this.enemyBullets,
      this.onPlayerHitByBullet as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
  }

  private setupCamera() {
    const worldW = MAP_WIDTH * TILE_SIZE
    const worldH = MAP_HEIGHT * TILE_SIZE
    this.physics.world.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
  }

  private createDamageOverlay() {
    this.damageOverlay = this.add.graphics().setDepth(300).setScrollFactor(0)
    this.damageOverlay.fillStyle(0xff0000, 0)
    this.damageOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  private flashDamageOverlay() {
    this.tweens.killTweensOf(this.damageOverlay)
    this.damageOverlay.clear()
    this.damageOverlay.fillStyle(0xff0000, 0.25)
    this.damageOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.tweens.add({
      targets: this.damageOverlay,
      alpha: { from: 1, to: 0 },
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.damageOverlay.clear()
        this.damageOverlay.fillStyle(0xff0000, 0)
        this.damageOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        this.damageOverlay.setAlpha(1)
      },
    })
  }

  update(_time: number, delta: number) {
    if (this.upgradeActive) return
    this.handleWeaponSwitch()
    this.handleDodge(delta)
    this.updatePlayerMovement()
    this.updatePlayerAim(delta)
    this.updateEnemyAI()
    this.updateBossAI(_time, delta)
    if (this.boss && this.boss.active) this.updateBossHPBar()
    this.updateHomingBullets()
    this.updateHPBar()
    this.cleanupBullets()
    this.updateHUD()
    this.checkWave()
    this.magnetXP(delta)
  }

  private handleWeaponSwitch() {
    if (this.upgradeActive) return
    const keys = [this.key1, this.key2, this.key3]
    for (let i = 0; i < 3; i++) {
      if (Phaser.Input.Keyboard.JustDown(keys[i]) && this.weaponSlots[i]) {
        if (this.weaponIdx !== i) {
          this.weaponIdx = i
          this.weaponTimer = 0
          this.updateHUD()
        }
      }
    }
  }

  private handleDodge(delta: number) {
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= delta
    if (Phaser.Input.Keyboard.JustDown(this.keyboard.SPACE) && !this.isDodging && this.dodgeCooldownTimer <= 0) {
      const body = this.player.body as Phaser.Physics.Arcade.Body
      this.dodgeDirX = body.velocity.x
      this.dodgeDirY = body.velocity.y
      if (this.dodgeDirX === 0 && this.dodgeDirY === 0) {
        this.dodgeDirX = Math.cos(this.player.rotation - Math.PI / 2)
        this.dodgeDirY = Math.sin(this.player.rotation - Math.PI / 2)
      }
      const len = Math.sqrt(this.dodgeDirX ** 2 + this.dodgeDirY ** 2)
      if (len > 0) { this.dodgeDirX /= len; this.dodgeDirY /= len }
      this.isDodging = true; this.invincible = true
      this.dodgeTimer = DODGE.DURATION
      this.player.setAlpha(0.5)
      this.soundManager.playSFX(SoundKey.PLAYER_DODGE)
    }
    if (this.isDodging) {
      const body = this.player.body as Phaser.Physics.Arcade.Body
      body.setVelocity(this.dodgeDirX * DODGE.SPEED, this.dodgeDirY * DODGE.SPEED)
      this.dodgeTimer -= delta
      if (this.dodgeTimer <= 0) {
        this.isDodging = false; this.invincible = false
        this.dodgeCooldownTimer = this.dodgeCooldownMs
        this.player.setAlpha(1)
      }
    }
  }

  private updatePlayerMovement() {
    if (this.isDodging) return
    const body = this.player.body as Phaser.Physics.Arcade.Body
    let vx = 0, vy = 0
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1
    else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1
    if (vx !== 0 && vy !== 0) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2 }
    body.setVelocity(vx * PLAYER.SPEED * this.speedMult, vy * PLAYER.SPEED * this.speedMult)
  }

  private updatePlayerAim(delta: number) {
    const pointer = this.input.activePointer
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y)
    this.player.setRotation(angle)

    if (this.weaponTimer > 0) { this.weaponTimer -= delta; return }
    if (!pointer.isDown) return

    const weapon = this.weaponSlots[this.weaponIdx]
    if (!weapon) return
    this.soundManager.playSFX(SoundKey.SHOOT)
    this.fireProjectile(angle, weapon)
    this.weaponTimer = weapon.fireRate * this.fireRateMult
  }

  private fireProjectile(angle: number, weapon: typeof WEAPON_LIST[0]) {
    const dmg = Math.round(weapon.damage * this.damageMult)
    const speed = (weapon.projSpeed || 500) * this.projSpeedMult
    const pellets = (weapon.pellets || 1) + this.extraPellets
    const spread = weapon.spread || 0

    for (let i = 0; i < pellets; i++) {
      const s = weapon.spread || 0.12
      const offset = pellets === 1 ? 0 : (i / (pellets - 1) - 0.5) * s
      const a = angle + offset

      const bulletKey = weapon.id === WeaponId.SHOTGUN ? "bullet" :
        weapon.id === WeaponId.SMG ? "bullet_smg" :
        weapon.id === WeaponId.LASER ? "bullet_laser" :
        weapon.id === WeaponId.GRENADE ? "bullet_grenade" :
        weapon.id === WeaponId.FREEZE ? "bullet_freeze" :
        weapon.id === WeaponId.MINIGUN ? "bullet_minigun" :
        weapon.id === WeaponId.CANNON ? "bullet_cannon" :
        "bullet_pistol"

      const bullet = this.bullets.get(this.player.x, this.player.y, bulletKey) as Phaser.Physics.Arcade.Sprite | null
      if (!bullet) break

      bullet.setActive(true).setVisible(true).setDepth(8)
      bullet.setData("damage", dmg)
      const body = bullet.body as Phaser.Physics.Arcade.Body
      body.setCircle(3, 0, 0)
      body.enable = true
      bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed)
      bullet.setRotation(a)
    }
  }

  private updateEnemyAI() {
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite
      if (!enemy.active) return
      if (enemy.getData("isBoss")) return // handled by updateBossAI
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)
      const body = enemy.body as Phaser.Physics.Arcade.Body
      enemy.setRotation(angle - Math.PI / 2)

      const type = enemy.getData("type") as string | undefined
      if (type === EnemyType.SHOOTER) {
        const def = ENEMY_DEFS[EnemyType.SHOOTER]
        const attackRange = def.attackRange || 150
        let shootTimer = enemy.getData("shootTimer") as number | undefined
        if (shootTimer === undefined) shootTimer = 0  // 立即射击，而不是冷却值
        const cooldown = Math.max(500, (def.shootCooldown || 1500) - this.waveNumber * 20)

        if (dist > attackRange) {
          body.setVelocity(Math.cos(angle) * (def.baseSpeed + this.waveNumber * 2),
            Math.sin(angle) * (def.baseSpeed + this.waveNumber * 2))
        } else {
          body.setVelocity(0, 0)
          shootTimer -= 16.67
          if (shootTimer <= 0) {
            shootTimer = cooldown
            const bullet = this.enemyBullets.get(enemy.x, enemy.y, "bullet_enemy") as Phaser.Physics.Arcade.Sprite | null
            if (bullet) {
              bullet.setActive(true).setVisible(true).setDepth(8)
              const bBody = bullet.body as Phaser.Physics.Arcade.Body
              bBody.setCircle(3, 0, 0)
              bBody.enable = true
              bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200)
              bullet.setData("sourceEnemy", enemy)
            }
            // Muzzle flash: small yellow particle at shooter position
            const flash = this.add.circle(enemy.x, enemy.y, 6, 0xffff00, 1).setDepth(15)
            this.tweens.add({
              targets: flash,
              alpha: 0, scale: 0, duration: 150,
              onComplete: () => flash.destroy(),
            })
          }
        }
        enemy.setData("shootTimer", shootTimer)
      } else if (type === EnemyType.ELITE) {
        // Elite: slow chase
        const eSpeed = 55 + this.waveNumber * 2
        body.setVelocity(Math.cos(angle) * eSpeed, Math.sin(angle) * eSpeed)

        // Elite: summon chargers every 5s (max 8 total)
        let summonTimer = enemy.getData("summonTimer") as number | undefined
        if (summonTimer === undefined) summonTimer = 5000
        summonTimer -= 16.67
        if (summonTimer <= 0) {
          summonTimer = 5000
          let currentSummonCount = enemy.getData("summonCount") as number | undefined
          if (currentSummonCount === undefined) currentSummonCount = 0
          if (currentSummonCount < 8) {
            this.spawnChargerSummon(enemy)
            this.spawnChargerSummon(enemy)
            currentSummonCount += 2
            enemy.setData("summonCount", currentSummonCount)
            this.flashSprite(enemy)
          }
        }
        enemy.setData("summonTimer", summonTimer)
      } else {
        const eSpeed = type === EnemyType.CHARGER
          ? 160 + this.waveNumber * 4
          : 65 + this.waveNumber * 3
        body.setVelocity(Math.cos(angle) * eSpeed, Math.sin(angle) * eSpeed)
      }
    })
  }

  private updateBossAI(_time: number, delta: number) {
    if (!this.boss || !this.boss.active) return
    const boss = this.boss
    const body = boss.body as Phaser.Physics.Arcade.Body
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y)
    boss.setRotation(angle - Math.PI / 2)

    // Determine phase based on HP ratio
    const ratio = this.bossHP / this.bossMaxHP
    let newPhase: number
    if (ratio > 0.7) newPhase = 0
    else if (ratio > 0.4) newPhase = 1
    else newPhase = 2

    // Phase transition visual feedback
    if (newPhase !== this.bossPhase) {
      this.bossPhase = newPhase
      this.soundManager.playSFX(SoundKey.BOSS_PHASE)
      this.flashSprite(boss)
      this.cameras.main.shake(300, 0.01)
      if (newPhase === 1) this.showWaveText("Phase 2!")
      if (newPhase === 2) this.showWaveText("Phase 3!")
      this.updateBossHPBar()
    }

    const phase = BOSS_DEF.phases[newPhase]
    const speed = phase.speed

    // Chase player
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

    // Attack timer
    this.bossAttackTimer -= delta
    if (this.bossAttackTimer <= 0) {
      const attackInterval = this.getAttackInterval(newPhase)
      this.bossAttackTimer = attackInterval

      const patterns = phase.attackPatterns
      for (const pattern of patterns) {
        this.executeBossAttack(boss, angle, pattern)
      }
    }

    // Summon chargers in phase 2
    if (phase.summonInterval && phase.summonInterval > 0) {
      let summonTimer = boss.getData("summonTimer") as number | undefined
      if (summonTimer === undefined) summonTimer = phase.summonInterval
      summonTimer -= delta
      if (summonTimer <= 0) {
        summonTimer = phase.summonInterval
        this.spawnChargerSummon(boss)
        this.spawnChargerSummon(boss)
        this.flashSprite(boss)
      }
      boss.setData("summonTimer", summonTimer)
    }
  }

  private getAttackInterval(phase: number): number {
    switch (phase) {
      case 0: return 1800
      case 1: return 1200
      case 2: return 250
      default: return 1800
    }
  }

  private executeBossAttack(boss: Phaser.Physics.Arcade.Sprite, angle: number, pattern: typeof BOSS_DEF.phases[0]["attackPatterns"][0]) {
    const count = pattern.count || 3
    const spread = pattern.spread || 0.2

    switch (pattern.type) {
      case "fan": {
        for (let i = 0; i < count; i++) {
          const a = angle + (i - (count - 1) / 2) * spread
          this.fireBossBullet(boss.x, boss.y, a)
        }
        break
      }
      case "scatter": {
        for (let i = 0; i < count; i++) {
          const a = angle + (Math.random() - 0.5) * spread * 2
          this.fireBossBullet(boss.x, boss.y, a)
        }
        break
      }
      case "bullet-hell": {
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 / count) * i + angle
          this.fireBossBullet(boss.x, boss.y, a)
        }
        break
      }
      case "rush": {
        const body = boss.body as Phaser.Physics.Arcade.Body
        const rushSpeed = 400
        body.setVelocity(Math.cos(angle) * rushSpeed, Math.sin(angle) * rushSpeed)
        this.time.delayedCall(1000, () => {
          if (this.boss && this.boss.active) {
            const pAngle = Phaser.Math.Angle.Between(this.boss!.x, this.boss!.y, this.player.x, this.player.y)
            const pBody = this.boss!.body as Phaser.Physics.Arcade.Body
            pBody.setVelocity(Math.cos(pAngle) * BOSS_DEF.phases[this.bossPhase].speed,
              Math.sin(pAngle) * BOSS_DEF.phases[this.bossPhase].speed)
          }
        })
        break
      }
      case "homing": {
        for (let i = 0; i < count; i++) {
          const bullet = this.enemyBullets.get(boss.x, boss.y, "bullet_enemy") as Phaser.Physics.Arcade.Sprite | null
          if (!bullet) break
          bullet.setActive(true).setVisible(true).setDepth(8)
          const bBody = bullet.body as Phaser.Physics.Arcade.Body
          bBody.setCircle(4, 0, 0)
          bBody.enable = true
          const a = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y)
          const homingSpeed = 180
          bullet.setVelocity(Math.cos(a) * homingSpeed, Math.sin(a) * homingSpeed)
          bullet.setData("homing", true)
        }
        break
      }
      case "ring-burst": {
        const rings = count || 2
        for (let r = 0; r < rings; r++) {
          const bulletCount = 8 + r * 4
          const direction = r % 2 === 0 ? 1 : -1  // 反向旋转
          const startAngle = spread * r * 0.5
          for (let i = 0; i < bulletCount; i++) {
            const a = startAngle + (Math.PI * 2 / bulletCount) * i * direction
            this.fireBossBullet(boss.x, boss.y, a)
          }
        }
        break
      }
      case "laser-sweep": {
        const laserCount = count || 3
        for (let i = 0; i < laserCount; i++) {
          const targetX = this.player.x + Phaser.Math.Between(-100, 100)
          const targetY = this.player.y + Phaser.Math.Between(-100, 100)
          const warning = this.add.rectangle(targetX, targetY, 80, 12, 0xff0000, 0.3).setDepth(15)
          this.tweens.add({
            targets: warning,
            alpha: { from: 0.3, to: 0.6 },
            duration: 800,
            yoyo: true,
            onComplete: () => {
              warning.destroy()
              const laser = this.add.rectangle(targetX, targetY, 80, 12, 0xff0000, 0.6).setDepth(15)
              this.tweens.add({ targets: laser, alpha: 0, duration: 500, onComplete: () => laser.destroy() })
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY)
              if (dist < 50) {
                this.playerHP -= 15
                this.flashDamageOverlay()
                this.flashSprite(this.player)
                if (this.playerHP <= 0) { this.playerHP = 0; this.gameOver() }
              }
            },
          })
        }
        break
      }
    }
  }

  private fireBossBullet(x: number, y: number, angle: number) {
    const bullet = this.enemyBullets.get(x, y, "bullet_enemy") as Phaser.Physics.Arcade.Sprite | null
    if (!bullet) return
    bullet.setActive(true).setVisible(true).setDepth(8)
    const bBody = bullet.body as Phaser.Physics.Arcade.Body
    bBody.setCircle(4, 0, 0)
    bBody.enable = true
    bullet.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250)
  }

  private onBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
    bullet.setActive(false).setVisible(false)
    const bulletBody = bullet.body as Phaser.Physics.Arcade.Body
    bulletBody.enable = false
    const dmg = bullet.getData("damage") as number || 10
    this.soundManager.playSFX(SoundKey.HIT_ENEMY)

    // Boss hit
    if (enemy.getData("isBoss")) {
      this.bossHP -= dmg
      this.flashSprite(enemy)
      if (this.bossHP <= 0) {
        this.bossDeath()
      }
      return
    }

    const hp = enemy.getData("hp") as number
    enemy.setData("hp", hp - dmg)
    if (hp - dmg <= 0) {
      // Elite death: kill all summons
      const enemyType = enemy.getData("type") as string | undefined
      if (enemyType === EnemyType.ELITE) {
        this.enemies.getChildren().forEach((e) => {
          const other = e as Phaser.Physics.Arcade.Sprite
          if (other === enemy || !other.active) return
          if (other.getData("isSummon") && other.getData("parentEnemy") === enemy) {
            this.spawnDeathEffect(other.x, other.y, EnemyType.CHARGER)
            this.time.delayedCall(0, () => other.destroy())
          }
        })
      }
      this.spawnDeathEffect(enemy.x, enemy.y, enemyType)
      this.onEnemyKilled(enemy.x, enemy.y)
      this.time.delayedCall(0, () => enemy.destroy())
    } else {
      this.flashSprite(enemy)
    }
  }

  private onEnemyKilled(x: number, y: number) {
    this.soundManager.playSFX(SoundKey.KILL_ENEMY)
    this.tryDropItem(x, y)
    this.spawnXPOrb(x, y)
  }

  private onEnemyTouchPlayer(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    if (this.invincible || this.isDodging || this.upgradeActive) return
    this.playerHP -= 10 + Math.floor(this.waveNumber / 2)
    this.soundManager.playSFX(SoundKey.PLAYER_HURT)
    this.flashDamageOverlay()
    this.cameras.main.shake(100, 0.005)
    this.invincible = true
    this.flashSprite(this.player)
    if (this.playerHP <= 0) {
      this.playerHP = 0
      this.gameOver()
      return
    }
    this.time.delayedCall(PLAYER.INVINCIBLE_DURATION, () => {
      this.invincible = false
      this.player.setAlpha(1)
    })
  }

  private onPlayerHitByBullet(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    if (this.invincible || this.isDodging || this.upgradeActive) return
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite
    bullet.setActive(false).setVisible(false)
    const bulletBody = bullet.body as Phaser.Physics.Arcade.Body
    bulletBody.enable = false
    this.playerHP -= 5
    this.soundManager.playSFX(SoundKey.PLAYER_HURT)
    this.flashDamageOverlay()
    this.invincible = true
    this.player.setAlpha(0.5)
    if (this.playerHP <= 0) {
      this.playerHP = 0
      this.gameOver()
      return
    }
    this.time.delayedCall(500, () => {
      this.invincible = false
      this.player.setAlpha(1)
    })
  }

  private onPlayerPickup(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    pickupObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    const pickup = pickupObj as Phaser.Physics.Arcade.Sprite
    if (!pickup.active) return
    const itemId = pickup.getData("itemId") as string
    const item = ITEM_DEFS[itemId]

    if (item) {
      switch (item.type) {
        case ItemType.HEAL:
          this.playerHP = Math.min(this.playerMaxHP, this.playerHP + (item.value || 20))
          break
        case ItemType.GOLD: this.gold += item.value || 1; break
        case ItemType.XP: this.addXP(item.value || 10); break
      }
    }
    this.showFloatingText(pickup.x, pickup.y, pickup.getData("pickupText") || "")
    pickup.destroy()
  }

  private addXP(amount: number) {
    this.xp += amount
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext
      this.level++
      this.xpToNext = XP_BASE + this.level * XP_INCREMENT
      this.showUpgradeUI()
    }
  }

  private spawnXPOrb(x: number, y: number) {
    const count = Phaser.Math.Between(1, 3)
    for (let i = 0; i < count; i++) {
      const ox = x + Phaser.Math.Between(-8, 8)
      const oy = y + Phaser.Math.Between(-8, 8)
      const sprite = this.physics.add.sprite(ox, oy, "item_xp") as Phaser.Physics.Arcade.Sprite
      sprite.setDepth(4)
      sprite.setData("itemId", "xp_orb")
      sprite.setData("pickupText", "+XP")
      const body = sprite.body as Phaser.Physics.Arcade.Body
      body.setImmovable(true); body.setAllowGravity(false)
      this.pickups.add(sprite)
      this.tweens.add({ targets: sprite, y: oy - 3, duration: 600 + i * 100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" })
    }
  }

  private magnetXP(_delta: number) {
    const px = this.player.x; const py = this.player.y
    this.pickups.getChildren().forEach((p) => {
      const sprite = p as Phaser.Physics.Arcade.Sprite
      if (!sprite.active || sprite.getData("itemId") !== "xp_orb") return
      if (Phaser.Math.Distance.Between(sprite.x, sprite.y, px, py) > 80) return
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, px, py)
      const body = sprite.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300)
    })
  }

  private showFloatingText(x: number, y: number, msg: string) {
    const text = this.add.text(x, y - 12, msg, {
      fontSize: "11px", color: "#ffffff", fontFamily: "monospace",
    }).setDepth(30).setOrigin(0.5)
    this.tweens.add({ targets: text, y: text.y - 20, alpha: 0, duration: 600, onComplete: () => text.destroy() })
  }

  private tryDropItem(x: number, y: number) {
    if (Math.random() < 0.35) this.spawnPickup(x, y, ITEM_DEFS.gold_coin)
    else if (Math.random() < 0.12) this.spawnPickup(x, y, ITEM_DEFS.health_small)
  }

  private spawnPickup(x: number, y: number, itemDef: ItemDef) {
    const textureKey = `item_${itemDef.id}`
    if (!this.textures.exists(textureKey)) return
    const sprite = this.physics.add.sprite(x, y, textureKey) as Phaser.Physics.Arcade.Sprite
    sprite.setDepth(4)
    sprite.setData("itemId", itemDef.id)
    sprite.setData("pickupText", itemDef.name)
    const body = sprite.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true); body.setAllowGravity(false)
    this.pickups.add(sprite)
    this.tweens.add({ targets: sprite, y: y - 4, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" })
  }

  private showUpgradeUI() {
    this.soundManager.playSFX(SoundKey.LEVEL_UP)
    this.upgradeActive = true
    this.physics.pause()
    this.upgradeElements = []
    const options = getRandomUpgrades(3)

    const overlay = this.add.graphics().setDepth(200).setScrollFactor(0)
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.upgradeElements.push(overlay)

    const panel = this.add.graphics().setDepth(201).setScrollFactor(0)
    panel.fillStyle(0x1a1a2e, 0.95)
    panel.fillRoundedRect(GAME_WIDTH / 2 - 300, GAME_HEIGHT / 2 - 160, 600, 320, 16)
    panel.lineStyle(2, 0x4fc3f7, 1)
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 300, GAME_HEIGHT / 2 - 160, 600, 320, 16)
    this.upgradeElements.push(panel)

    // Decorative glow corners
    const glowPositions = [
      [GAME_WIDTH / 2 - 300, GAME_HEIGHT / 2 - 160],
      [GAME_WIDTH / 2 + 300, GAME_HEIGHT / 2 - 160],
      [GAME_WIDTH / 2 - 300, GAME_HEIGHT / 2 + 160],
      [GAME_WIDTH / 2 + 300, GAME_HEIGHT / 2 + 160],
    ]
    for (const [gx, gy] of glowPositions) {
      const glow = this.add.circle(gx, gy, 6, 0x4fc3f7, 0.6).setDepth(202).setScrollFactor(0)
      this.tweens.add({
        targets: glow, alpha: { from: 0.6, to: 0.1 }, scale: { from: 1, to: 1.5 },
        duration: 1200 + Math.random() * 400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      })
      this.upgradeElements.push(glow)
    }

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, "升级选择", {
      fontSize: "24px", color: "#4fc3f7", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0)
    this.upgradeElements.push(title)

    options.forEach((opt, i) => {
      const cx = GAME_WIDTH / 2 + (i - 1) * 200; const cy = GAME_HEIGHT / 2 + 20

      const cardBg = this.add.graphics().setDepth(202).setScrollFactor(0)
      this.drawCardBg(cardBg, cx, cy, false)
      this.upgradeElements.push(cardBg)

      const nameText = this.add.text(cx, cy - 30, opt.name, {
        fontSize: "16px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(203).setScrollFactor(0)
      this.upgradeElements.push(nameText)

      const descText = this.add.text(cx, cy + 10, opt.desc, {
        fontSize: "13px", color: "#aaaacc", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(203).setScrollFactor(0)
      this.upgradeElements.push(descText)

      const zone = this.add.zone(cx, cy, 160, 140).setDepth(204).setScrollFactor(0)
      zone.setInteractive({ useHandCursor: true })
      this.upgradeElements.push(zone)

      zone.on("pointerover", () => {
        cardBg.clear()
        this.drawCardBg(cardBg, cx, cy, true)
      })
      zone.on("pointerout", () => {
        cardBg.clear()
        this.drawCardBg(cardBg, cx, cy, false)
      })
      zone.on("pointerdown", () => {
        this.applyUpgrade(opt.id)
        this.destroyUpgradeUI()
      })
    })

    // Keyboard shortcuts: A / S / D for options 0 / 1 / 2
    const keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    const keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    const keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)

    const onKey = (i: number) => {
      if (options[i]) {
        this.applyUpgrade(options[i].id)
        this.destroyUpgradeUI()
      }
    }
    keyA.once("down", () => onKey(0))
    keyS.once("down", () => onKey(1))
    keyD.once("down", () => onKey(2))
    this.upgradeElements.push({ destroy: () => { keyA.removeAllListeners(); keyS.removeAllListeners(); keyD.removeAllListeners() } } as any)
  }

  private drawCardBg(g: Phaser.GameObjects.Graphics, cx: number, cy: number, hover: boolean) {
    if (hover) {
      g.fillStyle(0x3a3a5e, 1)
      g.fillRoundedRect(cx - 80, cy - 70, 160, 140, 8)
      g.lineStyle(2, 0x4fc3f7, 1)
      g.strokeRoundedRect(cx - 80, cy - 70, 160, 140, 8)
    } else {
      g.fillStyle(0x2a2a3e, 1)
      g.fillRoundedRect(cx - 80, cy - 70, 160, 140, 8)
      g.lineStyle(1, 0x4fc3f7, 0.3)
      g.strokeRoundedRect(cx - 80, cy - 70, 160, 140, 8)
    }
  }

  private destroyUpgradeUI() {
    this.upgradeElements.forEach((e) => e.destroy())
    this.upgradeElements = []
    this.upgradeActive = false
    this.physics.resume()
  }

  private applyUpgrade(id: string) {
    switch (id) {
      case "damage": this.damageMult += 0.2; break
      case "fire_rate": this.fireRateMult = Math.max(0.3, this.fireRateMult - 0.15); break
      case "max_hp":
        this.maxHpBonus += 20
        this.playerMaxHP = PLAYER.MAX_HP + this.maxHpBonus
        this.playerHP = Math.min(this.playerHP + 20, this.playerMaxHP)
        break
      case "speed": this.speedMult += 0.1; break
      case "proj_speed": this.projSpeedMult += 0.25; break
      case "pellets": this.extraPellets += 1; break
    }
    this.showFloatingText(this.player.x, this.player.y - 20, this.getUpgradeName(id))
  }

  private getUpgradeName(id: string): string {
    const m: Record<string, string> = {
      damage: "攻击强化!", fire_rate: "速射!", max_hp: "生命强化!",
      speed: "迅捷!", proj_speed: "弹道加速!", pellets: "散射!",
    }
    return m[id] || ""
  }

  private updateHPBar() {
    this.hpBar.clear()
    // Player HP bar
    const bw = 48, bh = 6
    const x = this.player.x - bw / 2, y = this.player.y - 28
    this.hpBar.fillStyle(COLORS.HP_BG, 0.8)
    this.hpBar.fillRect(x, y, bw, bh)
    const r = Math.max(0, this.playerHP / this.playerMaxHP)
    this.hpBar.fillStyle(r > 0.3 ? COLORS.HP_BAR : 0xff5252, 1)
    this.hpBar.fillRect(x, y, bw * r, bh)

    // Elite enemy HP bars (wider bar)
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Physics.Arcade.Sprite
      if (!enemy.active || enemy.getData("type") !== EnemyType.ELITE) return
      const eBw = 64, eBh = 6
      const eX = enemy.x - eBw / 2
      const eY = enemy.y - 24
      const eHp = enemy.getData("hp") as number
      const eMaxHp = ENEMY_DEFS[EnemyType.ELITE].baseHp + this.waveNumber * 2
      const eR = Math.max(0, eHp / eMaxHp)
      this.hpBar.fillStyle(COLORS.HP_BG, 0.8)
      this.hpBar.fillRect(eX, eY, eBw, eBh)
      this.hpBar.fillStyle(eR > 0.3 ? 0xff0044 : 0xff5252, 1)
      this.hpBar.fillRect(eX, eY, eBw * eR, eBh)
    })
  }

  private updateHUD() {
    for (let i = 0; i < this.uiWeaponLabels.length; i++) {
      const hasWeapon = !!this.weaponSlots[i]
      if (i === this.weaponIdx) {
        this.uiWeaponLabels[i].setColor("#4fc3f7")
      } else if (hasWeapon) {
        this.uiWeaponLabels[i].setColor("#888888")
      } else {
        this.uiWeaponLabels[i].setColor("#444444")
      }
    }
    this.uiResources.setText(`Lv${this.level} HP:${this.playerHP} G:${this.gold}`)
    this.uiXpBar.clear()
    this.uiXpBar.fillStyle(0x333333, 0.8)
    this.uiXpBar.fillRect(10, GAME_HEIGHT - 34, 200, 8)
    const r = this.xpToNext > 0 ? this.xp / this.xpToNext : 0
    this.uiXpBar.fillStyle(0x00ff88, 1)
    this.uiXpBar.fillRect(10, GAME_HEIGHT - 34, 200 * Math.min(1, r), 8)
    this.uiXpBar.lineStyle(1, 0x555555, 0.5)
    this.uiXpBar.strokeRect(10, GAME_HEIGHT - 34, 200, 8)
  }

  private cleanupBullets() {
    const maxX = MAP_WIDTH * TILE_SIZE + 16
    const maxY = MAP_HEIGHT * TILE_SIZE + 16
    this.bullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (!bullet.active) return
      if (bullet.x < -16 || bullet.x > maxX || bullet.y < -16 || bullet.y > maxY) {
        bullet.setActive(false).setVisible(false)
        const body = bullet.body as Phaser.Physics.Arcade.Body
        body.enable = false
      }
    })
    this.enemyBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (!bullet.active) return
      if (bullet.x < -16 || bullet.x > maxX || bullet.y < -16 || bullet.y > maxY) {
        bullet.setActive(false).setVisible(false)
        const body = bullet.body as Phaser.Physics.Arcade.Body
        body.enable = false
        bullet.setData("sourceEnemy", undefined)
      }
    })
  }

  private updateHomingBullets() {
    this.enemyBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (!bullet.active || !bullet.getData("homing")) return
      const a = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y)
      const body = bullet.body as Phaser.Physics.Arcade.Body
      const vx = body.velocity.x
      const vy = body.velocity.y
      const currentAngle = Math.atan2(vy, vx)
      const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, a, 0.05)
      const speed = Math.sqrt(vx * vx + vy * vy)
      body.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed)
    })
  }

  private bossDeath() {
    if (!this.boss) return
    this.soundManager.playSFX(SoundKey.BOSS_DEATH)
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY

    this.spawnDeathEffect(this.boss.x, this.boss.y, "boss")
    this.boss.destroy()
    this.boss = null
    this.waveActive = false

    // Clean all enemy bullets
    this.enemyBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (bullet.active) {
        bullet.active = false
        bullet.visible = false
      }
    })

    // Hide boss HP bar
    this.bossHPBarBg.setVisible(false)
    this.bossHPBarFill.setVisible(false)
    this.bossHPBarText.setVisible(false)

    // Rewards
    const crystalsReward = this.waveNumber * 10
    const goldReward = this.waveNumber * 5
    this.gold += goldReward

    this.showWaveText("BOSS DEFEATED!")
    this.cameras.main.shake(800, 0.03)

    // Show reward text with fade-out
    const rewardText = this.add.text(centerX, centerY + 40, `+${crystalsReward} Crystals, +${goldReward} Gold`, {
      fontSize: "16px", color: "#ffff00", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0)
    this.tweens.add({ targets: rewardText, alpha: 0, duration: 1000, delay: 1500, onComplete: () => rewardText.destroy() })

    this.time.delayedCall(2500, () => this.startNextWave())
  }

  private flashSprite(sprite: Phaser.Physics.Arcade.Sprite) {
    this.tweens.add({ targets: sprite, alpha: 0.3, duration: 80, yoyo: true, repeat: 2 })
  }

 private spawnDeathEffect(x: number, y: number, type?: string) {
    if (type === EnemyType.CHARGER) {
      // Orange burst: 8 particles with flash
      const flash = this.add.circle(x, y, 10, 0xff8800, 0.6).setDepth(15)
      this.tweens.add({ targets: flash, alpha: 0, scale: 0, duration: 200, onComplete: () => flash.destroy() })
      for (let i = 0; i < 8; i++) {
        const particle = this.add.circle(x, y, 4, 0xff8800, 1).setDepth(15)
        const a = (Math.PI * 2 / 8) * i
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(a) * 40, y: y + Math.sin(a) * 40,
          alpha: 0, scale: 0, duration: 350 + Math.random() * 100,
          onComplete: () => particle.destroy(),
        })
      }
    } else if (type === EnemyType.SHOOTER) {
      // Purple spark: 8 particles with glow
      const flash = this.add.circle(x, y, 8, 0xaa44ff, 0.5).setDepth(15)
      this.tweens.add({ targets: flash, alpha: 0, scale: 0, duration: 250, onComplete: () => flash.destroy() })
      for (let i = 0; i < 8; i++) {
        const particle = this.add.circle(x, y, 3, Math.random() > 0.5 ? 0xaa44ff : 0xcc66ff, 1).setDepth(15)
        const a = (Math.PI * 2 / 8) * i + Math.random() * 0.3
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(a) * 35, y: y + Math.sin(a) * 35,
          alpha: 0, scale: 0, duration: 250 + Math.random() * 80,
          onComplete: () => particle.destroy(),
        })
      }
    } else if (type === EnemyType.ELITE) {
      // Red explosion: bigger ring + more particles + flash
      const flash = this.add.circle(x, y, 16, 0xff0044, 0.7).setDepth(15)
      this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 300, onComplete: () => flash.destroy() })
      const ring = this.add.graphics().setDepth(15)
      ring.lineStyle(3, 0xff0044, 1)
      ring.strokeCircle(x, y, 5)
      this.tweens.add({
        targets: ring,
        scaleX: 5, scaleY: 5, alpha: 0, duration: 500,
        onComplete: () => ring.destroy(),
      })
      for (let i = 0; i < 16; i++) {
        const particle = this.add.circle(x, y, 4 + Math.random() * 3, i % 3 === 0 ? 0xff8844 : 0xff0044, 1).setDepth(15)
        const a = (Math.PI * 2 / 16) * i + Math.random() * 0.2
        this.tweens.add({
            targets: particle,
            x: x + Math.cos(a) * (40 + Math.random() * 20), y: y + Math.sin(a) * (40 + Math.random() * 20),
            alpha: 0, scale: 0, duration: 350 + Math.random() * 150,
            onComplete: () => particle.destroy(),
          })
      }
    } else if (type === "boss") {
      // Massive explosion: flash + expanding rings + 30 particles
      const flash = this.add.circle(x, y, 24, 0x8844cc, 0.8).setDepth(15)
      this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 400, onComplete: () => flash.destroy() })
      for (let ring = 0; ring < 3; ring++) {
        const r = this.add.graphics().setDepth(15)
        r.lineStyle(4 - ring, 0x8844cc, 1)
        r.strokeCircle(x, y, 5 + ring * 5)
        this.tweens.add({
          targets: r,
          scaleX: 4 + ring * 2, scaleY: 4 + ring * 2, alpha: 0,
          duration: 500 + ring * 150, delay: ring * 100,
          onComplete: () => r.destroy(),
        })
      }
      // Golden sparkles mixed in
      for (let i = 0; i < 30; i++) {
        const color = Math.random() > 0.3 ? 0x8844cc : 0xffd700
        const particle = this.add.circle(x, y, 4 + Math.random() * 4, color, 1).setDepth(15)
        const a = (Math.PI * 2 / 30) * i + Math.random() * 0.1
        const dist = 30 + Math.random() * 60
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist,
          alpha: 0, scale: 0, duration: 400 + Math.random() * 300,
          onComplete: () => particle.destroy(),
        })
      }
    } else {
      // Default: generic burst with flash
      const flash = this.add.circle(x, y, 6, COLORS.ENEMY, 0.5).setDepth(15)
      this.tweens.add({ targets: flash, alpha: 0, scale: 0, duration: 200, onComplete: () => flash.destroy() })
      for (let i = 0; i < 6; i++) {
        const particle = this.add.circle(x, y, 3 + Math.random() * 2, COLORS.ENEMY, 1).setDepth(15)
        const a = (Math.PI * 2 / 6) * i + Math.random() * 0.2
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(a) * (25 + Math.random() * 15), y: y + Math.sin(a) * (25 + Math.random() * 15),
          alpha: 0, scale: 0, duration: 200 + Math.random() * 100,
          onComplete: () => particle.destroy(),
        })
      }
    }
  }

  private gameOver() {
    this.soundManager.playSFX(SoundKey.GAME_OVER)
    const crystalsEarned = Math.max(1, this.waveNumber * 3)
    const save = loadSave()
    getActiveSlot(save).crystals += crystalsEarned
    saveSave(save)

    this.soundManager.fadeOutBGM(1000)
    this.physics.pause()
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, "游戏结束", {
      fontSize: "36px", color: "#ff5252", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, `到达波次: ${this.waveNumber}`, {
      fontSize: "18px", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, `获得晶石: +${crystalsEarned}`, {
      fontSize: "18px", color: "#ffd700", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0)

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, "点击继续", {
      fontSize: "16px", color: "#aaaacc", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0)

    this.input.once("pointerdown", () => {
      this.scene.start("MapSelectScene")
    })
  }

  shutdown() {
    this.soundManager?.destroy()
    // Clean up enemy bullets
    this.enemyBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (bullet.active) bullet.destroy()
    })
    // Kill all tweens
    const allTweens = (this.tweens as any).getAll ? (this.tweens as any).getAll() : []
    allTweens.forEach((t: Phaser.Tweens.Tween) => t.pause())
  }
}
