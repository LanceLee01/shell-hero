# Boss 强化 + 专属武器掉落 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 提升 Boss 难度（新攻击模式 + 更高属性）、添加 5 种 Boss 专属武器、实现数字键 1/2/3 武器切换、Boss 死亡掉落武器拾取

**架构：** 扩展现有 WeaponDefs/BossDefs，在 GameScene 中添加多武器槽位和 Boss 新 AI 模式，在 BootScene 中生成新子弹纹理

**技术栈：** Phaser 3 + TypeScript + Vite

---

### 任务 1：Boss 属性增强 + 新攻击模式

**文件：**
- 修改：`src/systems/BossDefs.ts` — 提高 HP/速度，新增攻击模式类型，添加追踪弹/环形爆发/激光配置
- 修改：`src/scenes/GameScene.ts` — 实现新攻击模式的执行逻辑（updateBossAI、executeBossAttack）

- [ ] **步骤 1.1：更新 BossDefs.ts — 提高属性 + 新增攻击模式类型**

```typescript
// src/systems/BossDefs.ts — 完整替换文件内容

export interface AttackPattern {
  type: "fan" | "scatter" | "bullet-hell" | "rush" | "homing" | "ring-burst" | "laser-sweep"
  count?: number
  spread?: number
  interval?: number
}

export interface BossPhase {
  phaseName: string
  hpThreshold: number
  speed: number
  attackPatterns: AttackPattern[]
  summonInterval?: number
}

export interface BossConfig {
  name: string
  baseHp: number
  hpScalePerWave: number
  size: number
  color: number
  phases: BossPhase[]
  rewardCrystalsPerWave: number
  rewardGoldPerWave: number
}

export const BOSS_DEF: BossConfig = {
  name: "Boss",
  baseHp: 300,
  hpScalePerWave: 75,
  size: 40,
  color: 0xff0000,
  phases: [
    {
      phaseName: "Phase 1",
      hpThreshold: 0.7,
      speed: 100,
      attackPatterns: [
        { type: "fan", count: 3, spread: 0.2 },
        { type: "homing", count: 1 },
      ],
    },
    {
      phaseName: "Phase 2",
      hpThreshold: 0.4,
      speed: 150,
      attackPatterns: [
        { type: "scatter", count: 5, spread: 0.15 },
        { type: "ring-burst", count: 2, spread: 0.3 },
      ],
      summonInterval: 8000,
    },
    {
      phaseName: "Phase 3",
      hpThreshold: 0,
      speed: 220,
      attackPatterns: [
        { type: "bullet-hell", count: 12, spread: Math.PI * 2 },
        { type: "laser-sweep", count: 3 },
        { type: "rush" },
      ],
    },
  ],
  rewardCrystalsPerWave: 10,
  rewardGoldPerWave: 5,
}
```

- [ ] **步骤 1.2：在 GameScene.ts 中实现执行新攻击模式**

在 `executeBossAttack` 方法中添加三个新 case：

```typescript
case "homing": {
  for (let i = 0; i < count; i++) {
    const bullet = this.enemyBullets.get(boss.x, boss.y, "bullet_enemy") as Phaser.Physics.Arcade.Sprite | null
    if (!bullet) break
    bullet.setActive(true).setVisible(true).setDepth(8)
    const bBody = bullet.body as Phaser.Physics.Arcade.Body
    bBody.setCircle(4, 0, 0)
    bBody.enable = true
    // Initial velocity toward player
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
    const startAngle = (Math.PI * 2 / bulletCount) * r * 0.5
    for (let i = 0; i < bulletCount; i++) {
      const a = startAngle + (Math.PI * 2 / bulletCount) * i
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
    // Warning line
    const warning = this.add.rectangle(targetX, targetY, 80, 12, 0xff0000, 0.3).setDepth(15)
    warning.setScrollFactor(0)
    this.tweens.add({
      targets: warning,
      alpha: { from: 0.3, to: 0.6 },
      duration: 800,
      yoyo: true,
      onComplete: () => {
        warning.destroy()
        // Damage zone
        const laser = this.add.rectangle(targetX, targetY, 80, 12, 0xff0000, 0.6).setDepth(15)
        this.tweens.add({ targets: laser, alpha: 0, duration: 500, onComplete: () => laser.destroy() })
        // Check if player is in zone
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
```

- [ ] **步骤 1.3：在 updateBossAI 中添加追踪弹逻辑**

在 `updateBossAI` 方法的 `this.enemyBullets.getChildren()` 循环（或在 `updateEnemyAI` 中）添加追踪弹转向：

```typescript
// 在 update() 中或 cleanupBullets 之前添加
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
```

在 `update()` 方法中调用：`this.updateHomingBullets()`

- [ ] **步骤 1.4：将 bossHP 缩放更新到 bossDeath 中**

```typescript
// 在 spawnBoss() 中
this.bossMaxHP = BOSS_DEF.baseHp + this.waveNumber * BOSS_DEF.hpScalePerWave

// 在 bossDeath() 中 — 保持奖励不变，但使用 BossDefs 常量
const crystalsReward = this.waveNumber * (BOSS_DEF.rewardCrystalsPerWave || 10)
const goldReward = this.waveNumber * (BOSS_DEF.rewardGoldPerWave || 5)
```

---

### 任务 2：添加 5 种 Boss 专属武器

**文件：**
- 修改：`src/systems/WeaponDefs.ts` — 添加 5 种新武器定义 + `isBossWeapon` 字段

- [ ] **步骤 2.1：更新 WeaponDefs — 添加 Boss 武器**

```typescript
// src/systems/WeaponDefs.ts — 新增 WeaponId 枚举成员
export enum WeaponId {
  PISTOL = "pistol",
  SHOTGUN = "shotgun",
  SMG = "smg",
  LASER = "laser",
  GRENADE = "grenade",
  FREEZE = "freeze",
  MINIGUN = "minigun",
  CANNON = "cannon",
}

// 改动 WeaponDef 接口 — 添加可选字段
export interface WeaponDef {
  id: WeaponId
  name: string
  damage: number
  fireRate: number
  projSpeed?: number
  pellets?: number
  spread?: number
  isBossWeapon?: boolean
  special?: "laser" | "grenade" | "freeze" | "minigun" | "cannon"
}

// 在 WEAPON_DEFS 中添加 5 条新记录
[WeaponId.LASER]: {
  id: WeaponId.LASER, name: "激光枪", damage: 8, fireRate: 50,
  projSpeed: 800, pellets: 1, isBossWeapon: true, special: "laser",
},
[WeaponId.GRENADE]: {
  id: WeaponId.GRENADE, name: "榴弹炮", damage: 40, fireRate: 800,
  projSpeed: 400, pellets: 1, isBossWeapon: true, special: "grenade",
},
[WeaponId.FREEZE]: {
  id: WeaponId.FREEZE, name: "冰冻枪", damage: 10, fireRate: 300,
  projSpeed: 500, pellets: 1, isBossWeapon: true, special: "freeze",
},
[WeaponId.MINIGUN]: {
  id: WeaponId.MINIGUN, name: "机枪", damage: 5, fireRate: 40,
  projSpeed: 600, pellets: 1, isBossWeapon: true, special: "minigun",
},
[WeaponId.CANNON]: {
  id: WeaponId.CANNON, name: "能量炮", damage: 100, fireRate: 1500,
  projSpeed: 700, pellets: 1, isBossWeapon: true, special: "cannon",
},
```

注意更新 `WEAPON_LIST` 数组包含所有武器（Boss 和非 Boss），或创建一个 `WEAPON_LIST`（全部）+ `BASE_WEAPON_LIST`（仅基础）。

```typescript
export const WEAPON_LIST: WeaponDef[] = Object.values(WEAPON_DEFS)
export const BASE_WEAPON_LIST: WeaponDef[] = Object.values(WEAPON_DEFS).filter(w => !w.isBossWeapon)
```

- [ ] **步骤 2.2：调整 WeaponSelectScene 只显示基础武器**

在 `WeaponSelectScene.ts` 中，将 `WEAPON_LIST` 引用改为 `BASE_WEAPON_LIST`：

```typescript
import { BASE_WEAPON_LIST, WeaponDef, WeaponId } from "@/systems/WeaponDefs"

// 然后在 create() 中：
BASE_WEAPON_LIST.forEach((w, i) => { ... })
```

---

### 任务 3：生成新子弹和拾取物纹理

**文件：**
- 修改：`src/scenes/BootScene.ts` — 添加 5 种子弹纹理 + 武器拾取物纹理

- [ ] **步骤 3.1：在 BootScene 中添加纹理生成代码**

在 `preload()` 中添加调用 `this.generateBossWeaponTextures()`，在新方法中：

```typescript
private generateBossWeaponTextures() {
  const g = this.add.graphics()

  // bullet_laser — 红色光束
  g.clear()
  g.fillStyle(0xff2222, 1)
  g.fillRect(0, 1, 8, 3)
  g.fillStyle(0xff8888, 0.8)
  g.fillRect(1, 2, 6, 1)
  g.generateTexture("bullet_laser", 8, 5)

  // bullet_grenade — 橙色大弹丸
  g.clear()
  g.fillStyle(0xcc4400, 1)
  g.fillCircle(4, 4, 4)
  g.fillStyle(0xff8800, 0.8)
  g.fillCircle(4, 4, 2.5)
  g.generateTexture("bullet_grenade", 8, 8)

  // bullet_freeze — 蓝色菱形
  g.clear()
  g.fillStyle(0x44aaff, 1)
  g.beginPath()
  g.moveTo(3, 0); g.lineTo(6, 3); g.lineTo(3, 6); g.lineTo(0, 3)
  g.closePath(); g.fillPath()
  g.fillStyle(0x88ccff, 0.6)
  g.fillCircle(3, 3, 1.5)
  g.generateTexture("bullet_freeze", 6, 6)

  // bullet_minigun — 亮黄色小点
  g.clear()
  g.fillStyle(0xffdd00, 1)
  g.fillCircle(2, 2, 2)
  g.fillStyle(0xffffff, 0.8)
  g.fillCircle(2, 2, 1)
  g.generateTexture("bullet_minigun", 4, 4)

  // bullet_cannon — 白色大光球
  g.clear()
  g.fillStyle(0xccccff, 1)
  g.fillCircle(5, 5, 5)
  g.fillStyle(0xffffff, 1)
  g.fillCircle(5, 5, 3)
  g.fillStyle(0xffffff, 0.9)
  g.fillCircle(5, 5, 1.5)
  g.generateTexture("bullet_cannon", 10, 10)

  // weapon_pickup — 发光星形
  g.clear()
  g.fillStyle(0x4fc3f7, 1)
  // 菱形+旋转=星形
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
```

---

### 任务 4：实现 3 槽位武器切换系统

**文件：**
- 修改：`src/scenes/GameScene.ts` — 添加武器槽位、数字键切换、UI 更新

- [ ] **步骤 4.1：添加武器槽位数据结构和键盘绑定**

在类属性区域添加：

```typescript
private weaponSlots: (WeaponDef | null)[] = [null, null, null]
private key1!: Phaser.Input.Keyboard.Key
private key2!: Phaser.Input.Keyboard.Key
private key3!: Phaser.Input.Keyboard.Key
```

在 `createControls()` 中添加：

```typescript
this.key1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
this.key2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
this.key3 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
```

在 `create()` 中初始化 slot 0：

```typescript
// 在设置 weaponIdx 后
const initWeapon = WEAPON_LIST.find(w => w.id === this.initWeaponId)
this.weaponSlots[0] = initWeapon || WEAPON_LIST[0]
```

- [ ] **步骤 4.2：实现 handleWeaponSwitch**

```typescript
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
```

- [ ] **步骤 4.3：更新 `createHUD` 显示 3 个武器槽位**

武器标签文字改为显示槽位武器名称或"空"：

```typescript
for (let i = 0; i < 3; i++) {
  const w = this.weaponSlots[i]
  const label = w ? `${i + 1} ${w.name}` : `${i + 1} 空`
  this.uiWeaponLabels.push(
    this.add.text(26 + i * 73, GAME_HEIGHT - 27, label, {
      fontSize: "13px", color: "#888888", fontFamily: "monospace",
    }).setDepth(101).setScrollFactor(0),
  )
}
```

在 `updateHUD` 中更新颜色高亮逻辑：

```typescript
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
```

- [ ] **步骤 4.4：更新 `fireProjectile` 使用武器槽位**

```typescript
private updatePlayerAim(delta: number) {
  // ... 检查 weaponIdx 对应的 weaponSlots 是否有效
  const weapon = this.weaponSlots[this.weaponIdx]
  if (!weapon) return
  // ... 其余逻辑不变
}
```

---

### 任务 5：实现 Boss 武器掉落

**文件：**
- 修改：`src/scenes/GameScene.ts` — Boss 死亡生成武器拾取物、拾取逻辑

- [ ] **步骤 5.1：在 bossDeath 中添加武器掉落**

在 `bossDeath()` 中，在奖励发放后添加：

```typescript
// Boss 武器掉落
this.spawnBossWeaponDrop(this.boss ? this.boss.x : centerX, this.boss ? this.boss.y : centerY + 40)
```

实现 `spawnBossWeaponDrop` 方法：

```typescript
private spawnBossWeaponDrop(x: number, y: number) {
  const bossWeapons = WEAPON_LIST.filter(w => w.isBossWeapon)
  // 选择掉落的武器
  let dropWeapon: WeaponDef
  const existingBossWeapons = this.weaponSlots.filter(s => s && s.isBossWeapon).map(s => s!.id)
  
  if (existingBossWeapons.length === 0) {
    // 第一次必定掉落激光枪
    dropWeapon = bossWeapons.find(w => w.id === WeaponId.LASER) || bossWeapons[0]
  } else {
    // 后续从所有 Boss 武器中随机
    dropWeapon = bossWeapons[Phaser.Math.Between(0, bossWeapons.length - 1)]
  }

  // 创建拾取物
  const pickup = this.physics.add.sprite(x, y, "weapon_pickup") as Phaser.Physics.Arcade.Sprite
  pickup.setDepth(15)
  pickup.setData("weaponDrop", dropWeapon.id)
  pickup.setData("pickupText", dropWeapon.name)
  const body = pickup.body as Phaser.Physics.Arcade.Body
  body.setImmovable(true)
  body.setAllowGravity(false)

  // 脉冲动画
  this.tweens.add({
    targets: pickup,
    scaleX: 1.3, scaleY: 1.3,
    duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
  })
  // 旋转
  this.tweens.add({
    targets: pickup,
    angle: 360, duration: 2000, repeat: -1,
  })

  // 加入拾取组
  this.pickups.add(pickup)
}
```

- [ ] **步骤 5.2：在 onPlayerPickup 中添加武器拾取处理**

在 `onPlayerPickup` 的 switch 中添加 new case：

```typescript
case ItemType.WEAPON: {
  const weaponId = pickup.getData("weaponDrop") as WeaponId
  const weapon = WEAPON_LIST.find(w => w.id === weaponId)
  if (weapon) {
    // 找空槽位
    let slot = -1
    for (let i = 1; i < 3; i++) {
      if (!this.weaponSlots[i]) { slot = i; break }
    }
    if (slot === -1) slot = this.weaponIdx // 全满则替换当前
    this.weaponSlots[slot] = weapon
    this.showFloatingText(pickup.x, pickup.y, `+${weapon.name}!`)
    this.updateHUD()
  }
  break
}
```

在 `ItemType` 枚举中（ItemDefs.ts）添加 `WEAPON` 类型。

- [ ] **步骤 5.3：更新 ItemDefs**

```typescript
export enum ItemType {
  HEAL = "heal",
  GOLD = "gold",
  XP = "xp",
  WEAPON = "weapon",
}
```

在 `ITEM_DEFS` 中添加条目（可选，武器拾取物直接用 data 存储，不通过 ITEM_DEFS）。

---

### 任务 6：实现特殊弹道效果

**文件：**
- 修改：`src/scenes/GameScene.ts` — 追踪弹、榴弹爆炸、冰冻减速、能量穿透

- [ ] **步骤 6.1：在 fireProjectile 中根据 weapon.special 分发**

```typescript
private fireProjectile(angle: number, weapon: typeof WEAPON_LIST[0]) {
  if (weapon.special === "laser") { this.fireLaser(angle, weapon); return }
  if (weapon.special === "grenade") { this.fireGrenade(angle, weapon); return }
  if (weapon.special === "freeze") { this.fireFreeze(angle, weapon); return }
  if (weapon.special === "cannon") { this.fireCannon(angle, weapon); return }
  // 原有逻辑（pistol/shotgun/smg/minigun）
  this.fireStandardBullet(angle, weapon)
}
```

- [ ] **步骤 6.2：实现各特殊武器发射逻辑**

```typescript
private fireLaser(angle: number, weapon: WeaponDef) {
  const dmg = Math.round(weapon.damage * this.damageMult)
  const speed = (weapon.projSpeed || 800) * this.projSpeedMult
  const bullet = this.bullets.get(this.player.x, this.player.y, "bullet_laser") as Phaser.Physics.Arcade.Sprite | null
  if (!bullet) return
  bullet.setActive(true).setVisible(true).setDepth(8)
  bullet.setData("damage", dmg)
  bullet.setData("isLaser", true)
  const body = bullet.body as Phaser.Physics.Arcade.Body
  body.setCircle(3, 0, 0)
  body.enable = true
  // 初速指向鼠标方向
  const pointer = this.input.activePointer
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
  const aimAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y)
  bullet.setVelocity(Math.cos(aimAngle) * speed, Math.sin(aimAngle) * speed)
}

private fireGrenade(angle: number, weapon: WeaponDef) {
  const dmg = Math.round(weapon.damage * this.damageMult)
  const speed = (weapon.projSpeed || 400) * this.projSpeedMult
  const bullet = this.bullets.get(this.player.x, this.player.y, "bullet_grenade") as Phaser.Physics.Arcade.Sprite | null
  if (!bullet) return
  bullet.setActive(true).setVisible(true).setDepth(8)
  bullet.setData("damage", dmg)
  bullet.setData("isGrenade", true)
  const body = bullet.body as Phaser.Physics.Arcade.Body
  body.setCircle(4, 0, 0)
  body.enable = true
  bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
}

private fireFreeze(angle: number, weapon: WeaponDef) {
  const dmg = Math.round(weapon.damage * this.damageMult)
  const speed = (weapon.projSpeed || 500) * this.projSpeedMult
  const bullet = this.bullets.get(this.player.x, this.player.y, "bullet_freeze") as Phaser.Physics.Arcade.Sprite | null
  if (!bullet) return
  bullet.setActive(true).setVisible(true).setDepth(8)
  bullet.setData("damage", dmg)
  bullet.setData("isFreeze", true)
  const body = bullet.body as Phaser.Physics.Arcade.Body
  body.setCircle(3, 0, 0)
  body.enable = true
  bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
}

private fireCannon(angle: number, weapon: WeaponDef) {
  const dmg = Math.round(weapon.damage * this.damageMult)
  const speed = (weapon.projSpeed || 700) * this.projSpeedMult
  const bullet = this.bullets.get(this.player.x, this.player.y, "bullet_cannon") as Phaser.Physics.Arcade.Sprite | null
  if (!bullet) return
  bullet.setActive(true).setVisible(true).setDepth(8)
  bullet.setData("damage", dmg)
  bullet.setData("isCannon", true) // 穿透标志
  const body = bullet.body as Phaser.Physics.Arcade.Body
  body.setCircle(5, 0, 0)
  body.enable = true
  bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
}
```

- [ ] **步骤 6.3：在 onBulletHitEnemy 中处理特殊弹道效果**

```typescript
// 在 onBulletHitEnemy 中，获取子弹后检查特殊标志：

// 能量炮穿透 — 不销毁子弹
if (bullet.getData("isCannon")) {
  const dmg = bullet.getData("damage") as number
  // 正常扣血逻辑...但不销毁子弹
  // 只在超出边界时才回收
  return
}

// 冰冻弹 — 施加减速
if (bullet.getData("isFreeze")) {
  enemy.setData("slowTimer", 2000)
}

// 榴弹 — 爆炸范围伤害
if (bullet.getData("isGrenade")) {
  const dmg = bullet.getData("damage") as number
  const explosion = this.add.circle(bullet.x, bullet.y, 40, 0xff8800, 0.3).setDepth(15)
  this.tweens.add({ targets: explosion, alpha: 0, scale: 1.5, duration: 300, onComplete: () => explosion.destroy() })
  // 范围内所有敌人受到伤害
  this.enemies.getChildren().forEach((e) => {
    const enemy = e as Phaser.Physics.Arcade.Sprite
    if (!enemy.active || enemy === this.boss && enemy.getData("isBoss")) return
    if (Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) < 40) {
      const hp = enemy.getData("hp") as number
      enemy.setData("hp", hp - dmg)
      if (hp - dmg <= 0) {
        this.spawnDeathEffect(enemy.x, enemy.y, enemy.getData("type"))
        this.onEnemyKilled(enemy.x, enemy.y)
        enemy.destroy()
      }
    }
  })
}
```

- [ ] **步骤 6.4：在 updateEnemyAI 中处理冰冻减速**

在速度计算前添加：

```typescript
// 在 updateEnemyAI 循环开始时
const slowTimer = enemy.getData("slowTimer") as number | undefined
if (slowTimer && slowTimer > 0) {
  enemy.setData("slowTimer", slowTimer - 16.67)
  // 速度减半的效果在后续速度计算中应用
}
// 在速度计算后，如果被冰冻则减半
if (enemy.getData("slowTimer") as number > 0) {
  body.setVelocity(body.velocity.x * 0.5, body.velocity.y * 0.5)
  enemy.setTint(0x88ccff) // 蓝色冰冻效果
} else {
  enemy.clearTint()
}
```

在 `spawnDeathEffect` 之前或 `cleanupBullets` 中，为能量炮子弹添加特殊边界检测——不销毁穿透弹：

```typescript
// 在 cleanupBullets 中
if (bullet.getData("isCannon")) {
  if (bullet.x < -50 || bullet.x > maxX + 50 || bullet.y < -50 || bullet.y > maxY + 50) {
    bullet.setActive(false).setVisible(false)
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.enable = false
  }
  return // 跳过普通销毁
}
```

---

### 任务 7：构建验证

**文件：**
- 运行：`npx --package typescript tsc --noEmit`
- 运行：`npx vite build`

- [ ] **步骤 7.1：TypeScript 类型检查**

运行：`cd D:/claudecode/shell-hero && npx --package typescript tsc --noEmit`
预期：无输出（所有类型正确）

- [ ] **步骤 7.2：Vite 生产构建**

运行：`cd D:/claudecode/shell-hero && npx vite build`
预期：构建成功，输出 dist/ 目录

- [ ] **步骤 7.3：运行 dev server 验证**

运行：`cd D:/claudecode/shell-hero && npm run dev`
预期：打开 http://localhost:3000，测试 Boss 战斗和武器切换
