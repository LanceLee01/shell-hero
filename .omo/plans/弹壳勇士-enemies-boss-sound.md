# 弹壳勇士 — 敌人类型 / Boss / 音效系统

## TL;DR

> **快速概要**: 为现有 Phaser 3 Roguelite 游戏添加 3 种新敌人类型、每 5 波 Boss 战、以及完整的音效系统（SFX + BGM）。
>
> **交付物**:
> - `src/systems/EnemyDefs.ts` — 3 种敌人配置（冲锋/射击/精英）
> - `src/systems/BossDefs.ts` — Boss 配置 + 多阶段定义
> - `src/systems/SoundManager.ts` — 音效管理器类
> - 修改 `BootScene.ts` — 添加敌人/Boss 纹理 + 音频注册
> - 修改 `GameScene.ts` — 敌人 AI、Boss 阶段、音效触发
> - 音效素材文件（Kenney.cc / CC0 免费素材）
>
> **预估工作量**: 中型（5-8 小时实现）
> **并行执行**: 是 — 5 个波次
> **关键路径**: T1 → T5 → T8 → T13 → 最终验证

---

## Context

### 原始请求
为"弹壳勇士"添加更多敌人类型和 Boss 战，同时实现音效系统。

### 用户决策
| 问题 | 决策 |
|------|------|
| 敌人类型方案 | 经典三类型：冲锋型 / 射击型 / 精英型 |
| Boss 触发机制 | 波次 Boss — 每 5 波出现 |
| 音效方案 | 外部音效素材（CC0 免费资源库） |
| BSP 地图接入 | 暂不接入，Boss 在当前平地上打 |

### 当前代码架构摘要
- **引擎**: Phaser 3.80 + TypeScript 6.0 + Vite 8
- **物理**: Arcade（无重力）
- **敌人管理**: `this.enemies` (Phaser.Physics.Arcade.Group)，单一追踪型
- **子弹管理**: `this.bullets` (Phaser.Physics.Arcade.Group, maxSize 200)
- **纹理**: 全部代码生成（BootScene），无外部图片
- **模式**: 场景继承 `Phaser.Scene`，配置用 `enum + Record` 模式

---

## Work Objectives

### 核心目标
在保持现有代码架构的前提下，纵向扩展游戏内容深度。

### 具体交付物
- 3 种敌人类型各具独特 AI（冲锋 / 远程射击 / 精英技能）
- 每 5 波 Boss 战（含多阶段转换 + 多种攻击模式）
- 完整的音效系统覆盖所有关键游戏事件

### 定义完成
- [ ] `bun test` 或手动 Playwright 验证 — 全部 3 种敌人生成并行为正确
- [ ] Boss 在第 5/10/15... 波出现，有阶段转换和 UI
- [ ] 射击/命中/击杀/升级/Boss 登场均有音效播放
- [ ] 游戏过程中 BGM 循环播放

### Must Have
- 冲锋型: 高速直线冲向玩家，贴身后造成伤害
- 射击型: 保持距离发射弹丸，有攻击冷却
- 精英型: 高 HP + 特殊能力（护盾减伤或召唤小怪）
- Boss: 3 阶段转换（100%→70%→40% HP），每阶段新攻击模式
- Boss: 专属 HP 条（屏幕顶部）
- Boss 专属击杀奖励（大量晶石）
- SoundManager 全局管理音量和播放
- 射击 / 命中 / 击杀 / 受伤 / 翻滚 / 升级 / 波次/Boss 登场 均有音效

### Must NOT Have
- ❌ 不改动 BSP 地图系统
- ❌ 不改动武器定义或武器切换
- ❌ 不添加网络功能
- ❌ 不重构现有子弹系统（仅扩展敌人子弹）
- ❌ 不改动天赋树或局外成长系统

---

## Verification Strategy

### 测试决策
- **测试框架**: 无（项目无测试基础设施）
- **自动化测试**: 无单元测试 — 全部通过 Agent-Executed QA 验证
- **QA 工具**: Playwright（浏览器游戏验证）+ 浏览器截图

### QA 策略
每个 TODO 任务都必须包含 Agent-Executed QA Scenarios。证据文件保存到 `.omo/evidence/task-{N}-{scenario}.{ext}`。

- **前端/游戏**: Playwright 打开 `http://localhost:3000`，交互，截图
- **Boss 验证**: 控制台注入代码触发特定波次
- **音效验证**: 检查浏览器开发者工具 Audio 选项卡 / 控制台日志

---

## Execution Strategy

### 并行波次

```
Wave 1 (Foundation — 4 任务并行):
├── T1: EnemyDefs.ts — 配置定义
├── T2: BossDefs.ts — Boss 配置
├── T3: SoundManager.ts — 音效管理
├── T4: BootScene 纹理 + 音频加载

Wave 2 (Core Combat — 3 任务并行, 依赖 T1):
├── T5: GameScene 刷怪重构 + 冲锋型 AI
├── T6: GameScene 射击型 AI + 敌弹系统
├── T7: GameScene 精英型 AI

Wave 3 (Boss — 依赖 T2 + Wave 2):
├── T8: Boss 生成 + 阶段 AI + 攻击模式
├── T9: Boss UI + 奖励系统

Wave 4 (Sound — 依赖 T3 + T4):
├── T10: 音效素材获取 + BootScene 加载
├── T11: GameScene SFX 挂接
├── T12: BGM 场景循环

Wave 5 (Polish — 3 任务并行):
├── T13: 平衡性调优
├── T14: 视觉特效（粒子/震屏）
├── T15: 边界修复（音频清理/敌弹清理）

Final Wave (Verification — 4 并行):
├── F1: 计划合规审计 (oracle)
├── F2: 代码质量审查
├── F3: 实机 QA 执行
├── F4: 范围保真检查
```

### 代理调度摘要

- **Wave 1**: 4 任务 → `quick`（独立配置文件）
- **Wave 2**: 3 任务 → `deep`（AI 逻辑较复杂）
- **Wave 3**: 2 任务 → `deep`
- **Wave 4**: 3 任务 → `quick`（文件操作 + 挂接）
- **Wave 5**: 3 任务 → `quick` / `unspecified-high`
- **Final**: 4 任务 → `oracle` / `unspecified-high`

---

## TODOs

### Wave 1 — Foundation (4 任务并行)

- [x] 1. **创建 EnemyDefs.ts — 敌人类型配置**

  **What to do**:
  - 新建 `src/systems/EnemyDefs.ts`
  - 定义 `EnemyType` 枚举：CHARGER / SHOOTER / ELITE
  - 定义 `EnemyConfig` 接口（baseHp, baseSpeed, baseDamage, size, color, behavior, 等）
  - 定义 `ENEMY_DEFS: Record<EnemyType, EnemyConfig>` 和 `ENEMY_LIST: EnemyConfig[]`
  - 按 `WeaponDefs.ts` 的模式编写（enum → Record → flat list）
  - **冲锋型**: HP 10, 速度 180, 伤害 8, size 14, 颜色 0xff8800, 追踪玩家
  - **射击型**: HP 15, 速度 80, 伤害 6, size 14, 颜色 0xaa44ff, 保持距离射击
  - **精英型**: HP 40, 速度 60, 伤害 12, size 20, 颜色 0xff0044, 追踪 + 召唤小怪能力

  **Must NOT do**:
  - 不要在 GameScene 中编写 AI 逻辑，只定义数据
  - 不要修改现有文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: 无
  - **Reason**: 纯配置定义，无复杂逻辑

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4)
  - **Blocks**: T5, T6, T7
  - **Blocked By**: None

  **References**:
  - `src/systems/WeaponDefs.ts:1-38` — 完整模式参考（enum → Record → flat list）
  - `src/systems/ItemDefs.ts:1-19` — 更简单的 ItemDef 模式参考

  **Acceptance Criteria**:
  - [ ] 文件创建，TypeScript 编译无错误
  - [ ] 导出 `ENEMY_LIST` 包含 3 种敌人配置
  - [ ] 每个敌人有合理的初始数值

  **QA Scenarios**:
  ```
  Scenario: 配置完整性验证
    Tool: Bash
    Steps:
      1. 运行 `npx tsc --noEmit src/systems/EnemyDefs.ts` 确认无错误
      2. 编写简短验证脚本导入 ENEMY_LIST 并打印长度
    Expected Result: 编译通过，ENEMY_LIST.length === 3
    Evidence: .omo/evidence/task-1-enemy-defs.txt
  ```

- [x] 2. **创建 BossDefs.ts — Boss 配置**

  **What to do**:
  - 新建 `src/systems/BossDefs.ts`
  - 定义 `BossPhase` 接口（hpThreshold, attackPatterns, attackSpeed, specialMoves）
  - 定义 `BossConfig` 接口（name, baseHp, baseDamage, size, color, phases）
  - 定义 `BOSS_DEF` 包含 3 阶段：
    - Phase 1 (100%-70% HP): 慢速追踪 + 扇形射击（3 发）
    - Phase 2 (70%-40% HP): 中速追踪 + 散射 + 召唤小怪
    - Phase 3 (<40% HP): 快速追踪 + 弹幕 + 冲锋
  - 定义 Boss 奖励（晶石 = waveNumber * 10, 金币 = waveNumber * 5）

  **Must NOT do**:
  - 不在配置中写 AI 逻辑
  - 不要定义多个 Boss（只一个，随波次 scale）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 纯配置定义

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4)
  - **Blocks**: T8, T9
  - **Blocked By**: None

  **References**:
  - `src/systems/UpgradeDefs.ts:1-22` — 配置模式参考
  - `src/config.ts:1-25` — 全局常量风格参考

  **Acceptance Criteria**:
  - [ ] 文件创建，TypeScript 编译无错误
  - [ ] BOSS_DEF 包含 3 个阶段定义
  - [ ] 每个阶段有 distinct 的攻击模式

  **QA Scenarios**:
  ```
  Scenario: Boss 配置验证
    Tool: Bash
    Steps:
      1. `npx tsc --noEmit src/systems/BossDefs.ts`
    Expected Result: 编译通过
    Evidence: .omo/evidence/task-2-boss-defs.txt
  ```

- [x] 3. **创建 SoundManager.ts — 音效管理器**

  **What to do**:
  - 新建 `src/systems/SoundManager.ts`
  - 定义 `SoundKey` 枚举：SHOOT, HIT_ENEMY, KILL_ENEMY, PLAYER_HURT, PLAYER_DODGE, LEVEL_UP, WAVE_START, WAVE_CLEAR, BOSS_APPEAR, BOSS_PHASE, BOSS_DEATH, GAME_OVER, UI_CLICK
  - `SoundManager` 类：
    - `constructor(scene: Phaser.Scene)` — 接收场景引用
    - `setMusicVolume(v: number)` / `setSFXVolume(v: number)`
    - `playSFX(key: SoundKey, config?: SoundConfig)` — 火抛音效
    - `playBGM(key: string)` / `stopBGM()` — BGM 控制
    - `preload(scene: Phaser.Scene)` — 注册所有音频到加载队列
    - `destroy()` — 停止所有音效，清理资源
  - 支持音量渐变（tween volume）
  - `SoundConfig` 默认值：SFX volume 0.6, BGM volume 0.4

  **Must NOT do**:
  - 不要实际创建音频文件（那是 T10 的任务）
  - 不要修改 Scene 文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 单文件类实现

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4)
  - **Blocks**: T10, T11, T12
  - **Blocked By**: None

  **References**:
  - Phaser 3 Sound API: `this.sound.add(key, config)`, `.play()`, `.stop()`, `.volume`
  - Phaser 3: `this.load.audio(key, urls)` 用于预加载

  **Acceptance Criteria**:
  - [ ] 文件创建且 TypeScript 编译通过
  - [ ] SoundManager 可以实例化、播放、停止、渐入渐出
  - [ ] SFX 和 BGM 音量独立控制

  **QA Scenarios**:
  ```
  Scenario: SoundManager 接口可用
    Tool: Bash
    Steps:
      1. `npx tsc --noEmit src/systems/SoundManager.ts`
    Expected Result: 编译通过
    Evidence: .omo/evidence/task-3-sound-manager.txt
  ```

- [x] 4. **BootScene — 添加敌人/Boss 纹理和音频预加载**

  **What to do**:
  - 修改 `src/scenes/BootScene.ts`
  - `generateEnemyTextures()` — 为 3 种敌人生成纹贴图
    - 冲锋型: 橙色菱形 (16×16)
    - 射击型: 紫色圆形 (14×14) 带炮管
    - 精英型: 深红色大圆 (22×22) 带光环
  - `generateBossTextures()` — 生成 Boss 纹理
    - 大型深紫色六边形 (40×40) 带发光边框
  - `generateBulletTextures()` — 添加敌人子弹纹理（红色小圆 5x5）
  - 注册所有音频 key（不加载文件，只声明 key 用于后续 T10 绑定）

  **Must NOT do**:
  - 不要删除现有玩家/武器纹理
  - 图片尺寸保持和现有程序化纹理一致

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 程序化图形生成（已有示例代码）

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3)
  - **Blocks**: T5, T6, T7, T8（这些任务需要纹理存在）
  - **Blocked By**: None

  **References**:
  - `src/scenes/BootScene.ts:25-48` — `generateTileset()` 模式
  - `src/scenes/BootScene.ts:50-68` — `generateBullets()` 模式
  - `src/scenes/BootScene.ts:70-102` — `generateItems()` 模式

  **Acceptance Criteria**:
  - [ ] BootScene 生成所有新纹理且不报错
  - [ ] `npx tsc --noEmit` 编译通过
  - [ ] 游戏启动后纹理名称 `textures.exists(key)` 返回 true

  **QA Scenarios**:
  ```
  Scenario: BootScene 启动后纹理存在
    Tool: Bash + Playwright
    Steps:
      1. `npm run dev` 启动游戏
      2. Playwright 打开 `http://localhost:3000`
      3. 在控制台执行:
         `game = document.querySelector('canvas').__phaser`
         `scene = game.scene.getScene('BootScene')`
         `console.log(scene.textures.exists('enemy_charger'))`
    Expected Result: 所有纹理 key 返回 true
    Evidence: .omo/evidence/task-4-textures.txt
  ```

### Wave 2 — Core Combat (3 任务并行, 依赖 T1 + T4)

- [x] 5. **GameScene — 刷怪重构 + 冲锋型 AI**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - 重构 `spawnWave()`: 从 `ENEMY_LIST` 随机选择敌人类型，按权重分布：
    - 冲锋型 50%, 射击型 30%, 精英型 20%
  - 敌人数量的权重调整：普通波次 `5 + wave * 3` 不变
  - 添加 `spawnEnemy(type: EnemyType, x, y)` 方法从配置创建敌人
  - 实现冲锋型 AI（在 `updateEnemyAI()` 中）：

  **冲锋型行为**:
  - 直线追踪玩家（同现有 AI 但速度更快）
  - 速度和伤害随波次缩放（冲锋型基础速度 180 + wave*3）
  - 颜色/纹理由 EnemyDefs 决定
  - 死亡时小范围爆炸效果（已有粒子效果可以重用）

  **Must NOT do**:
  - 不要删除现有的敌人生成路径（兼容性）
  - 不要修改子弹系统

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: 无
  - **Reason**: 核心 AI 逻辑，需要理解现有 GameScene 架构

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T6, T7) — GameScene 同一文件注意 merge
  - **Blocks**: T8
  - **Blocked By**: T1, T4

  **References**:
  - `src/scenes/GameScene.ts:199-217` — `spawnWave()` 现有模式
  - `src/scenes/GameScene.ts:376-385` — `updateEnemyAI()` 现有模式
  - `src/scenes/GameScene.ts:388-412` — `onBulletHitEnemy()` / `onEnemyKilled()`
  - `src/systems/EnemyDefs.ts` — T1 创建

  **Acceptance Criteria**:
  - [ ] 刷怪默认使用新配置系统（随机分布）
  - [ ] 冲锋型生成且行为正确（追踪+碰撞伤害）
  - [ ] 旧敌人不再生成（完全替换为新配置）
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: 冲锋型生成和追踪
    Tool: Playwright
    Steps:
      1. 打开游戏并快速进入战斗
      2. 观察第一批敌人：确认有橙色菱形（冲锋型）
      3. 停在原地让冲锋型靠近：速度明显快
      4. 被冲锋型碰到：HP 减少，无敌帧触发
    Expected Result: 冲锋型正常追踪并造成伤害
    Evidence: .omo/evidence/task-5-charger-behavior.png
  ```

- [x] 6. **GameScene — 射击型 AI + 敌弹系统**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - 新建 `this.enemyBullets` Group（maxSize 100），与 `this.bullets` 分离
  - 实现射击型 AI：
    - 与玩家保持距离（`attackRange` = 150px）
    - 超过距离则接近，进入射程则停下射击
    - 射击间隔 `shootCooldown = 1500ms`（随波次减少）
    - 发射红色敌弹，速度 200
  - 添加敌弹碰撞检测：
    - `this.physics.add.overlap(this.player, this.enemyBullets, onPlayerHitByBullet)`
  - 添加 `onPlayerHitByBullet()` 回调：扣血 + 无敌帧 + 音效（占位）
  - 添加敌弹清理（超出世界边界时回收）

  **Must NOT do**:
  - 不要修改玩家子弹逻辑
  - 不要在新 `enemyBullets` 之外创建额外 group

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Reason**: 新增物理 Group + 全新 AI 模式

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T7)
  - **Blocks**: T8
  - **Blocked By**: T1, T4

  **References**:
  - `src/scenes/GameScene.ts:169-171` — 现有子弹 Group 创建模式
  - `src/scenes/GameScene.ts:261-268` — 现有碰撞注册模式
  - `src/scenes/GameScene.ts:414-431` — `onEnemyTouchPlayer()` 受击模式

  **Acceptance Criteria**:
  - [ ] 射击型生成并从距离外发射敌弹
  - [ ] 敌弹击中玩家造成伤害+无敌帧
  - [ ] 敌弹超出边界自动回收
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: 射击型攻击
    Tool: Playwright
    Steps:
      1. 进入游戏，等待射击型（紫色圆形）生成
      2. 不靠近观察：射击型停留在约 150px 距离处
      3. 观察敌弹从射击型飞向玩家
      4. 被敌弹击中：HP 减少，角色闪烁
    Expected Result: 射击型保持距离发射敌弹
    Evidence: .omo/evidence/task-6-shooter-attack.png
  ```

- [x] 7. **GameScene — 精英型 AI**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - 实现精英型 AI：
    - 高 HP、慢速追踪玩家
    - 特殊能力：**召唤** — 每 5 秒召唤 2 个冲锋型小怪
    - 召唤时视觉提示（闪烁 + scale pulse）
    - 精英型被击杀后：所有召唤的小怪也死亡（或给予额外奖励补偿）
  - 精英型专属视觉效果：脉动光环（用 tween 控制 scale）
  - 精英型有独立高亮血条（比普通敌人血条更宽）

  **Must NOT do**:
  - 召唤的小怪不要无限增长（限制最大召唤数量 8）
  - 不要影响其他敌人的波次刷新

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Reason**: 召唤逻辑+时间事件管理

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T6)
  - **Blocks**: T8
  - **Blocked By**: T1, T4

  **References**:
  - `src/scenes/GameScene.ts:199-217` — `spawnWave()` 同组参考
  - `src/scenes/GameScene.ts:124` — `this.time.delayedCall()` 延迟事件模式
  - `src/scenes/GameScene.ts:666-677` — `spawnDeathEffect()` 粒子效果

  **Acceptance Criteria**:
  - [ ] 精英型生成（深红大圆）
  - [ ] 精英型每 5 秒召唤 2 个小怪
  - [ ] 被召唤的小怪正常追踪和攻击
  - [ ] 击杀精英型后正常掉落
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: 精英型召唤
    Tool: Playwright
    Steps:
      1. 进入游戏直到精英型生成（深红色大圆 20px）
      2. 观察精英型脉动效果
      3. 等待 5 秒：看到 2 个橙色冲锋型在精英型旁生成
      4. 击杀精英型：所有小怪消失或正常处理
    Expected Result: 精英型按时间间隔召唤且受控
    Evidence: .omo/evidence/task-7-elite-summon.png
  ```

### Wave 3 — Boss (依赖 T2 + Wave 2)

- [x] 8. **GameScene — Boss 生成 + 阶段 AI + 攻击模式**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - 在 `startNextWave()` 中检测：若 `waveNumber % 5 === 0` → 触发 Boss 战
  - Boss 战逻辑：
    - 清空所有当前敌人
    - 在场景中央生成 Boss
    - 暂停常规波次刷新
    - Boss 死亡后恢复常规波次
  - 实现 Boss AI (`updateBossAI()`)：
    - 根据当前 HP 比例切换阶段
    - **Phase 1** (100%-70% HP): 缓慢追踪 + 扇形射击（3 发敌弹，角度间隔 0.2 rad）
    - **Phase 2** (70%-40% HP): 中速追踪 + 散射（5 发 + 小角度随机偏移）+ 每 8 秒召唤 2 小怪
    - **Phase 3** (<40% HP): 快速追踪 + 旋转弹幕（每 0.3s 发射 8 发全方向）+ 冲锋（突然加速冲向玩家）
  - Boss 数值随波次缩放：`baseHp * (1 + (waveNumber - 5) * 0.2)`
  - 启用世界边界碰撞（Boss 不超出边界）

  **Must NOT do**:
  - Boss 不出现在非 5 倍数的波次
  - Boss 不干扰下次游戏的数据

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Reason**: 复杂状态机 + 多种攻击模式

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (depends on T5, T6, T7)
  - **Blocks**: T9
  - **Blocked By**: T2, T5, T6, T7

  **References**:
  - `src/scenes/GameScene.ts:188-197` — `startNextWave()` 波次触发
  - `src/scenes/GameScene.ts:376-385` — `updateEnemyAI()` AI 框架
  - `src/scenes/GameScene.ts:349-374` — `fireProjectile()` 射击模式参考
  - `src/systems/BossDefs.ts` — T2 创建

  **Acceptance Criteria**:
  - [ ] 第 5 波 Boss 生成（之前波次正常）
  - [ ] Boss 3 阶段可观察（不同攻击模式）
  - [ ] Boss HP 条在屏幕顶部显示
  - [ ] 击杀 Boss 后波次继续正常刷新
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: Boss 生成和 Phase 1
    Tool: Playwright
    Steps:
      1. 进入游戏，快速通过前 4 波
      2. 第 5 波：Boss 大深紫色六边形在中央生成
      3. 观察 Phase 1：Boss 缓慢移动并扇形射击（3 发）
      4. 打掉 30% HP：Boss 进入 Phase 2（速度变快）
    Expected Result: Boss 3 阶段可观察过渡
    Evidence: .omo/evidence/task-8-boss-phases.png
  ```

- [x] 9. **GameScene — Boss UI + 奖励系统**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - Boss HP 条（屏幕顶部中央）：
    - 宽 300px, 高 20px
    - 深色背景 + 红色填充
    - Boss 名称文字上方
    - 仅在 Boss 活跃时显示
  - Boss 登场 UI：
    - `"BOSS!"` 大文字 + 屏幕震动效果
    - Boss 名称 + HP 显示
  - Boss 阶段转换提示：
    - `"Phase 2!"` 浮动文字 + 颜色闪烁
  - Boss 击杀奖励：
    - 大量晶石：`waveNumber * 10`
    - 大量金币：`waveNumber * 5`
    - 大量经验：`XP_BASE * 3`
    - 大爆炸粒子效果
    - `"BOSS DEFEATED!"` 文字提示
  - 保存晶石到 localStorage（同现有 `gameOver()` 中的逻辑）

  **Must NOT do**:
  - 不要改变现有 gameOver 逻辑
  - 奖励不要溢出整数

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: UI + 奖励逻辑

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (depends on T8)
  - **Blocks**: T13
  - **Blocked By**: T8

  **References**:
  - `src/scenes/GameScene.ts:622-646` — `updateHPBar()` / `updateHUD()` HUD 模式
  - `src/scenes/GameScene.ts:679-705` — `gameOver()` 奖励+存档模式
  - `src/scenes/GameScene.ts:219-224` — `showWaveText()` 波次文字动画

  **Acceptance Criteria**:
  - [ ] Boss HP 条屏幕顶部显示
  - [ ] Boss 击杀后正确发放晶石奖励
  - [ ] localStorage 中晶石增加

  **QA Scenarios**:
  ```
  Scenario: Boss 击杀奖励
    Tool: Playwright
    Steps:
      1. 击杀 Boss
      2. 观察：Boss 击杀提示 + 爆炸粒子 + 奖励文字
      3. 游戏结束后检查 localStorage('roguelike_save') 晶石增加
    Expected Result: Boss 击杀奖励正常
    Evidence: .omo/evidence/task-9-boss-reward.png
  ```

### Wave 4 — Sound (依赖 T3 + T4)

- [x] 10. **音效素材获取 + BootScene 加载**

  **What to do**:
  - 从 Kenney.cc (CC0 免费) 下载以下音效：
    - 射击: `weapon_shoot.wav`
    - 命中: `impact_damage.wav`
    - 击杀: `explosion_enemy.wav`
    - 受伤: `player_hurt.wav`
    - 翻滚: `dodge.wav`
    - 升级: `level_up.wav`
    - 波次开始: `wave_start.wav`
    - Boss 登场: `boss_appear.wav`
    - Boss 击杀: `boss_death.wav`
    - UI 点击: `ui_click.wav`
  - 或使用 jsfxr 生成 retro 风格 SFX（推荐，免版权问题）
  - 下载 BGM: 从 Free Music Archive 或 OpenGameArt 找循环 BGM
  - 保存到 `public/assets/audio/`
  - 修改 `src/scenes/BootScene.ts`：
    - 在 `preload()` 中添加 `this.load.audio(key, path)` 注册所有音效
    - 确保使用相对路径（`assets/audio/xxx.wav`）

  **Must NOT do**:
  - 不要使用有版权限制的音效
  - 文件不要过大（每个 SFX < 200KB, BGM < 5MB）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 文件操作 + BootScene 修改

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T11, T12)
  - **Blocks**: T11, T12
  - **Blocked By**: T3, T4

  **References**:
  - `src/scenes/BootScene.ts:11-23` — `preload()` 现有模式
  - `https://kenney.nl/assets/category:audio` — Kenney 免费音效
  - `https://sfxr.me/` — jsfxr 程序化音效生成器

  **Acceptance Criteria**:
  - [ ] `public/assets/audio/` 下包含所需音效和 BGM 文件
  - [ ] BootScene preload 加载无 404
  - [ ] `this.cache.audio.exists(key)` 返回 true

  **QA Scenarios**:
  ```
  Scenario: 音频文件加载
    Tool: Playwright
    Steps:
      1. 启动游戏
      2. 控制台执行 `scene.sound.decodeAudio('shoot')`
      3. 检查无文件加载错误
    Expected Result: 无 404，音频可解码
    Evidence: .omo/evidence/task-10-audio-loaded.txt
  ```

- [x] 11. **GameScene — SFX 挂接所有游戏事件**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - 在 `create()` 中实例化 SoundManager：`this.soundManager = new SoundManager(this)`
  - 在所有关键事件添加 SFX 触发：
    - `weaponTimer` 重置时（射击）→ `playSFX('shoot')`
    - `onBulletHitEnemy()` → `playSFX('hit_enemy')`
    - `onEnemyKilled()` → `playSFX('kill_enemy')`
    - `onEnemyTouchPlayer()` → `playSFX('player_hurt')`
    - `handleDodge()` 翻滚时 → `playSFX('dodge')`
    - `showUpgradeUI()` → `playSFX('level_up')`
    - `showWaveText()` 波次开始 → `playSFX('wave_start')`
    - Boss 登场 → `playSFX('boss_appear')`
    - Boss 击杀 → `playSFX('boss_death')`
    - `gameOver()` → `playSFX('game_over')`
  - 武器类型不同时射击音效变化（手枪/冲锋枪/霰弹枪不同音调）

  **Must NOT do**:
  - 不要阻塞游戏逻辑（音效失败不应打断游戏）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 事件挂接（查找→插入）

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T10, T12)
  - **Blocks**: None
  - **Blocked By**: T3, T10

  **References**:
  - `src/scenes/GameScene.ts:335-347` — `updatePlayerAim()` 射击点
  - `src/scenes/GameScene.ts:388-412` — 命中/击杀事件点
  - `src/scenes/GameScene.ts:414-431` — 玩家受伤事件点
  - `src/scenes/GameScene.ts:295-321` — 翻滚事件点
  - `src/systems/SoundManager.ts` — T3 创建

  **Acceptance Criteria**:
  - [ ] 每次射击播放对应音效
  - [ ] 每个命中/击杀事件有反馈
  - [ ] Boss 登场/击杀有音效
  - [ ] 无音效播放时的控制台错误

  **QA Scenarios**:
  ```
  Scenario: SFX 触发
    Tool: Playwright
    Steps:
      1. 进入游戏
      2. 连续点击鼠标射击：听到射击音效（手枪/冲锋枪音高不同）
      3. 击杀敌人：听到命中+击杀音效
      4. 被敌人碰到：听到受伤音效
      5. 按空格翻滚：听到翻滚音效
    Expected Result: 所有关键事件有音效
    Evidence: .omo/evidence/task-11-sfx-playback.txt
  ```

- [x] 12. **BGM 场景循环**

  **What to do**:
  - 修改 `src/scenes/MapSelectScene.ts`：
    - 在 `create()` 启动或切换 BGM（循环，音量 0.4）
    - BGM key: `bgm_menu`
  - 修改 `src/scenes/GameScene.ts`：
    - 在 `create()` 中切换为 `bgm_game`（从菜单 BGM 渐变过渡）
    - 在 `gameOver()` 中停止 BGM 或播放淡出
    - Boss 战中 BGM 不变但可以考虑添加额外层（可选）
  - BGM 淡入淡出：
    - 场景切换时 `SoundManager.fadeOutBGM(500)` → `fadeInBGM(500)`
    - 游戏结束时 `fadeOutBGM(1000)`

  **Must NOT do**:
  - BGM 不要在场景间重叠（stop old before start new）
  - 不要每个场景都重新加载音频文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 场景生命周期钩子

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T10, T11)
  - **Blocks**: None
  - **Blocked By**: T3, T10

  **References**:
  - `src/scenes/MapSelectScene.ts:12-48` — menu scene lifecycle
  - `src/scenes/GameScene.ts:69-125` — game scene create lifecycle
  - `src/scenes/GameScene.ts:679-705` — game over

  **Acceptance Criteria**:
  - [ ] 菜单有 BGM 播放
  - [ ] 进入游戏后 BGM 过渡到战斗 BGM
  - [ ] 游戏结束 BGM 停止/淡出
  - [ ] 无重叠播放

  **QA Scenarios**:
  ```
  Scenario: BGM 循环
    Tool: Playwright
    Steps:
      1. 打开游戏：听到菜单 BGM
      2. 选择地图和武器进入游戏：听到战斗 BGM（菜单 BGM 淡出）
      3. 游戏结束：BGM 淡出停止
    Expected Result: BGM 随场景切换流畅过渡
    Evidence: .omo/evidence/task-12-bgm-playback.txt
  ```

### Wave 5 — Polish (3 任务并行)

- [x] 13. **平衡性调优**

  **What to do**:
  - 修改 `src/config.ts`（如有需要）
  - 修改 `src/systems/EnemyDefs.ts` 和 `src/systems/BossDefs.ts`
  - 调整敌人属性使其在波次递进中保持挑战性：
    - 冲锋型: basHP=12+wave*2, speed=160+wave*4, damage=8+wave*1
    - 射击型: baseHP=18+wave*3, speed=75+wave*2, damage=6+wave*1, shootCD=max(500, 1500-wave*20)
    - 精英型: baseHP=50+wave*5, speed=55+wave*2, damage=12+wave*1.5
  - Boss HP 缩放：`BossHP = 200 + waveNumber * 50`
  - 测试确保前 8 波可通关，Boss 战需要玩家至少升 2-3 级
  - 验证冲锋型不会在前期瞬间秒杀玩家
  - 验证射击型弹幕密度在中后期不会超过玩家闪避能力

  **Must NOT do**:
  - 不改动玩家数值

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Reason**: 需要手动 playtesting

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T14, T15)
  - **Blocks**: None
  - **Blocked By**: Wave 2, Wave 3

  **Acceptance Criteria**:
  - [ ] 前 3 波可站撸存活
  - [ ] 第 5 波 Boss 可正常击杀
  - [ ] 第 10 波 Boss 有明显难度提升但不过分

  **QA Scenarios**:
  ```
  Scenario: 第 5 波 Boss 可通关
    Tool: Playwright + 手动检测
    Steps:
      1. 玩家选择冲锋枪（高DPS）进入
      2. 正常游戏到第 5 波
      3. Boss 战中玩家至少可以存活 30 秒以上
      4. 正常操作下可击杀 Boss
    Expected Result: 第 5 波 Boss 可挑战但可击败
    Evidence: .omo/evidence/task-13-balance-boss5.txt
  ```

- [x] 14. **视觉特效增强**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - 增加特有死亡粒子效果：
    - 冲锋型死亡：橙色碎片散开
    - 射击型死亡：紫色火花
    - 精英型死亡：红色爆炸 + 冲击波圈
    - Boss 死亡：大爆炸 + 多个光环扩散
  - 屏幕震动：
    - Boss 登场时 `this.cameras.main.shake(500, 0.02)`
    - Boss Phase 转换时 `this.cameras.main.shake(300, 0.01)`
    - 玩家受伤加重时 `this.cameras.main.shake(100, 0.005)`
  - Boss 脉动效果：用 tween 持续控制 Boss sprite 的 scale（1.0 ↔ 1.05）
  - 射击型射击时枪口闪光粒子

  **Must NOT do**:
  - 不要过度使用粒子（控制数量避免性能问题）
  - 不引入外部图片（全部程序化）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Reason**: 视觉特效

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T13, T15)
  - **Blocks**: None
  - **Blocked By**: Wave 2, Wave 3

  **References**:
  - `src/scenes/GameScene.ts:666-677` — `spawnDeathEffect()` 现有死亡粒子
  - `src/scenes/GameScene.ts:409` — `onEnemyKilled()` 死亡触发点
  - Phaser: `this.cameras.main.shake(duration, intensity)`

  **Acceptance Criteria**:
  - [ ] 每种敌人死亡有不同视觉效果
  - [ ] Boss 死亡有大型爆炸效果
  - [ ] Boss 登场有屏幕震动
  - [ ] 游戏帧率维持在 30fps+

  **QA Scenarios**:
  ```
  Scenario: 视觉特效
    Tool: Playwright
    Steps:
      1. 进入游戏击杀各类型敌人
      2. 对比死亡粒子效果不同
      3. 进入第 5 波 Boss 战：观察屏幕震动
      4. 击杀 Boss：观察大型爆炸效果
    Expected Result: 视觉特效丰富但性能稳定
    Evidence: .omo/evidence/task-14-visual-effects.png
  ```

- [x] 15. **边界修复和清理**

  **What to do**:
  - 修改 `src/scenes/GameScene.ts`
  - 修复：场景切换时 `SoundManager.destroy()` 停止所有音效
  - 修复：敌弹在场景切换时清理（`this.scene.events.on('shutdown', cleanup)`）
  - 修复：精英型死亡后召唤的小怪也清理
  - 修复：Boss 战中玩家死亡 → 停止 Boss AI + 清理敌弹
  - 修复：Boss 战中玩家翻滚躲避敌弹
  - 验证 `update()` 中 `this.upgradeActive` 暂停所有 AI 更新（包括 Boss）

  **Must NOT do**:
  - 不要做超出范围的代码清理

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 边界修复

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T13, T14)
  - **Blocks**: None
  - **Blocked By**: Wave 2, Wave 3, Wave 4

  **References**:
  - `src/scenes/GameScene.ts:278-290` — `update()` 主循环中的 `upgradeActive` 检查
  - `src/scenes/GameScene.ts:414-431` — `onEnemyTouchPlayer()` invincible 检查
  - Phaser: `this.scene.events.on('shutdown', this.cleanup.bind(this))`

  **Acceptance Criteria**:
  - [ ] 场景切换无音效/粒子残留
  - [ ] Boss 战中玩家死亡无错误
  - [ ] 升级界面暂停所有 AI
  - [ ] 无控制台报错

  **QA Scenarios**:
  ```
  Scenario: 场景切换清理
    Tool: Playwright
    Steps:
      1. 进入游戏，打几波
      2. 前进到天赋树场景
      3. 返回地图选择
      4. 再进游戏：检查无残留音效/敌弹
    Expected Result: 场景切换完全清理
    Evidence: .omo/evidence/task-15-scene-cleanup.txt
  ```

---

## 最终验证波次 (FINAL)

> 4 个审查代理并行运行。全部必须通过才能标记为完成。

- [x] F1. **计划合规审计** — `oracle`
  逐任务检查实现。对每个 Must Have：验证实现存在。对每个 Must NOT Have：搜索代码库确认无越界修改。检查证据文件在 `.omo/evidence/` 下存在。
  输出: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **代码质量审查** — `unspecified-high`
  运行 `npx tsc --noEmit`。审查修改文件：类型抑制、空 catch、调试日志、注释代码、未使用 import。检查 AI 反模式：过度抽象、泛型命名、过度注释。
  输出: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **实机 QA 执行** — `unspecified-high` (+ `playwright` skill)
  从干净状态启动游戏。执行所有 Task 中的 QA Scenario，严格按步骤捕获证据。测试跨任务集成（敌兵同屏、Boss 战）。保存到 `.omo/evidence/final-qa/`。
  输出: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **范围保真检查** — `deep`
  对每个任务：对比 diff 与任务描述。确认 1:1（无缺失无蔓延）。检查 Must NOT do 合规。检测跨任务 contamination。
  输出: `Tasks [N/N compliant] | Contamination [CLEAN] | VERDICT`

---

## Commit Strategy

| 任务 | 提交信息 |
|------|---------|
| T1 | `feat(enemies): add EnemyDefs config for 3 enemy types` |
| T2 | `feat(boss): add BossDefs config with phase definitions` |
| T3 | `feat(sound): add SoundManager class` |
| T4 | `feat(graphics): add enemy/boss textures to BootScene` |
| T5-T7 | `feat(game): add charger/shooter/elite enemy AI` |
| T8-T9 | `feat(boss): add boss spawn, phase AI, UI, rewards` |
| T10-T12 | `feat(sound): integrate sound assets, SFX, BGM` |
| T13-T15 | `feat(polish): balance, visuals, edge case fixes` |

---

## Success Criteria

### 验证命令
```bash
cd D:\opencode
npm run dev
# 浏览器打开 http://localhost:3000
# Playwright 脚本验证各功能
```

### 最终检查清单
- [ ] 3 种敌人生成正确，AI 行为可观察
- [ ] Boss 在第 5 波出现，HP 条显示，阶段转换有提示
- [ ] 所有关键事件有音效反馈
- [ ] BGM 在游戏中循环
- [ ] 无控制台报错
- [ ] 游戏运行帧率 ≥ 30fps（Boss 战不减帧）
