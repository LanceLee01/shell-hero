# 弹壳勇士 Bug 修复计划

## TL;DR

> **快速概要**: 修复弹壳勇士游戏中的 4 个 Bug，并移除局内武器切换功能（改为局外选择）。
>
> **交付物**:
> - `GameScene.ts` — 修复射击计时器、精英召唤计时器、Boss 召唤计时器、敌弹回收、移除武器切换
>
> **预估工作量**: 快速（30 分钟）
> **并行执行**: 否 — 单文件修复
> **关键路径**: Bug #2 → Bug #3 → Bug #4 → Bug #6 → 移除武器切换 → 验证

---

## Context

### 原始请求
除了武器切换实现以外，其他全部修复，移除局内武器切换功能，改为局外选择。

### 已识别 Bug
| # | Bug | 严重度 | 位置 |
|---|-----|--------|------|
| 2 | 射击型计时器永不触发 | HIGH | `GameScene.ts:544` - `shootTimer` 初始化为冷却值，从未递减到 0 |
| 3 | 精英召唤计时器永不重置 | MEDIUM | `GameScene.ts:582` - 计时器递减但从未重置 |
| 4 | Boss 召唤计时器永不重置 | MEDIUM | `GameScene.ts:650` - 计时器递减但从未重置 |
| 6 | 敌弹组 maxSize 溢出 | LOW | `GameScene.ts:1065-1073` - 子弹被停用但未回收 |

### 移除功能
| # | 功能 | 位置 |
|---|------|------|
| 1 | 局内武器切换 | `GameScene.ts:444` - `handleWeaponSwitch()` 方法 |
| 2 | 武器切换按键 | `GameScene.ts:188-192` - `this.keyboard` 中 ONE, TWO, THREE |

---

## Work Objectives

### 核心目标
修复所有已识别 Bug，移除局内武器切换功能，确保游戏可正常运行。

### 具体交付物
- `GameScene.ts` — 修复所有 Bug，移除局内武器切换

### 定义完成
- [ ] `npx tsc --noEmit` 编译通过
- [ ] 射击型敌人能正常射击
- [ ] 精英敌人能正常召唤小怪
- [ ] Boss 能正常召唤小怪
- [ ] 敌弹正常回收
- [ ] 局内武器切换功能移除

### Must Have
- 射击型敌人能正常射击
- 精英敌人能正常召唤小怪
- Boss 能正常召唤小怪
- 敌弹正常回收
- 局内武器切换功能移除（改为局外选择）

### Must NOT Have
- ❌ 不修改其他文件
- ❌ 不修改游戏平衡性
- ❌ 不添加新功能

---

## Verification Strategy

### 测试决策
- **测试框架**: 无（项目无测试基础设施）
- **自动化测试**: 无单元测试 — 全部通过 Agent-Executed QA 验证
- **QA 工具**: TypeScript 编译验证 + 浏览器手动测试

### QA 策略
每个 TODO 任务都必须包含 Agent-Executed QA Scenarios。证据文件保存到 `.omo/evidence/task-{N}-{scenario}.{ext}`。

---

## Execution Strategy

### 执行顺序
```
Task 1: 射击型计时器修复 (Bug #2)
Task 2: 精英召唤计时器修复 (Bug #3)
Task 3: Boss 召唤计时器修复 (Bug #4)
Task 4: 敌弹回收修复 (Bug #6)
Task 5: 移除局内武器切换功能
Task 6: TypeScript 编译验证
```

---

## TODOs

- [x] 1. **修复射击型计时器 (Bug #2)**

  **What to do**:
  - 修改 `GameScene.ts:544-545`
  - 修复 `shootTimer` 初始化：
    ```typescript
    let shootTimer = enemy.getData("shootTimer") as number | undefined
    if (shootTimer === undefined) shootTimer = 0  // 立即射击，而不是冷却值
    ```
  - 确保射击型敌人能正常射击

  **Must NOT do**:
  - 不要修改其他敌人类型
  - 不要修改射击逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 单行修复

  **References**:
  - `GameScene.ts:544-545` - 当前 `shootTimer` 初始化

  **Acceptance Criteria**:
  - [ ] 射击型敌人能正常射击
  - [ ] 射击间隔正确
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: 射击型敌人射击
    Tool: Playwright
    Steps:
      1. 启动游戏
      2. 等待射击型敌人出现
      3. 观察射击型敌人是否开始射击
      4. 观察射击间隔是否正确
    Expected Result: 射击型敌人能正常射击
    Evidence: .omo/evidence/task-1-shooter-timer.txt
  ```

- [x] 2. **修复精英召唤计时器 (Bug #3)**

  **What to do**:
  - 修改 `GameScene.ts:582-593`
  - 修复 `summonTimer` 重置逻辑：
    ```typescript
    if (summonTimer <= 0) {
      summonTimer = 5000  // 重置计时器
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
    ```

  **Must NOT do**:
  - 不要修改其他敌人类型
  - 不要修改召唤逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 单行修复

  **References**:
  - `GameScene.ts:582-593` - 精英召唤逻辑

  **Acceptance Criteria**:
  - [ ] 精英敌人能正常召唤小怪
  - [ ] 召唤间隔正确（5 秒）
  - [ ] 召唤数量正确（每次 2 个，最多 8 个）
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: 精英敌人召唤
    Tool: Playwright
    Steps:
      1. 启动游戏
      2. 等待精英敌人出现
      3. 观察精英敌人是否开始召唤小怪
      4. 观察召唤间隔是否正确（5 秒）
      5. 观察召唤数量是否正确（每次 2 个，最多 8 个）
    Expected Result: 精英敌人能正常召唤小怪
    Evidence: .omo/evidence/task-2-elite-summon.txt
  ```

- [x] 3. **修复 Boss 召唤计时器 (Bug #4)**

  **What to do**:
  - 修改 `GameScene.ts:650-658`
  - 修复 `summonTimer` 重置逻辑：
    ```typescript
    if (summonTimer <= 0) {
      summonTimer = phase.summonInterval  // 重置计时器
      this.spawnChargerSummon(boss)
      this.spawnChargerSummon(boss)
      this.flashSprite(boss)
    }
    boss.setData("summonTimer", summonTimer)
    ```

  **Must NOT do**:
  - 不要修改其他 Boss 逻辑
  - 不要修改召唤逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 单行修复

  **References**:
  - `GameScene.ts:650-658` - Boss 召唤逻辑

  **Acceptance Criteria**:
  - [ ] Boss 能正常召唤小怪
  - [ ] 召唤间隔正确（8 秒）
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: Boss 召唤
    Tool: Playwright
    Steps:
      1. 启动游戏
      2. 进入第 5 波 Boss 战
      3. 观察 Boss 是否开始召唤小怪
      4. 观察召唤间隔是否正确（8 秒）
    Expected Result: Boss 能正常召唤小怪
    Evidence: .omo/evidence/task-3-boss-summon.txt
  ```

- [x] 4. **修复敌弹回收 (Bug #6)**

  **What to do**:
  - 修改 `GameScene.ts:1065-1073`
  - 修复敌弹回收逻辑：
    ```typescript
    this.enemyBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite
      if (!bullet.active) return
      if (bullet.x < -16 || bullet.x > maxX || bullet.y < -16 || bullet.y > maxY) {
        bullet.setActive(false).setVisible(false)
        const body = bullet.body as Phaser.Physics.Arcade.Body
        body.enable = false
        bullet.setData("sourceEnemy", undefined)  // 清除引用
      }
    })
    ```

  **Must NOT do**:
  - 不要修改其他子弹回收逻辑
  - 不要修改子弹组定义

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 单行修复

  **References**:
  - `GameScene.ts:1065-1073` - 敌弹回收逻辑

  **Acceptance Criteria**:
  - [ ] 敌弹正常回收
  - [ ] 敌弹组不溢出
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: 敌弹回收
    Tool: Playwright
    Steps:
      1. 启动游戏
      2. 等待射击型敌人出现
      3. 观察敌弹是否飞出边界后消失
      4. 观察敌弹组是否溢出
    Expected Result: 敌弹正常回收，不溢出
    Evidence: .omo/evidence/task-4-enemy-bullet-recycle.txt
  ```

- [x] 5. **移除局内武器切换功能**

  **What to do**:
  - 修改 `GameScene.ts:444`
  - 移除 `handleWeaponSwitch()` 方法：
    ```typescript
    private handleWeaponSwitch() {
      // 武器切换已移至局外选择（WeaponSelectScene）
    }
    ```
  - 修改 `GameScene.ts:188-192`
  - 移除 `this.keyboard` 中 ONE, TWO, THREE 按键定义：
    ```typescript
    this.keyboard = {
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    }
    ```

  **Must NOT do**:
  - 不要修改 `WeaponSelectScene`（局外选择已存在）
  - 不要修改武器定义

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: 单方法移除

  **References**:
  - `GameScene.ts:188-192` - `createControls()` 按键定义
  - `GameScene.ts:444` - `handleWeaponSwitch()` 空方法
  - `WeaponSelectScene.ts` - 局外武器选择（已存在）

  **Acceptance Criteria**:
  - [ ] 局内按 1/2/3 键无反应
  - [ ] UI 武器高亮正确更新
  - [ ] `npx tsc --noEmit` 编译通过

  **QA Scenarios**:
  ```
  Scenario: 局内武器切换移除
    Tool: Playwright
    Steps:
      1. 启动游戏
      2. 按 1/2/3 键：武器无切换
      3. 观察 UI 武器高亮是否正确更新
    Expected Result: 局内武器切换功能移除
    Evidence: .omo/evidence/task-5-weapon-switch-removed.txt
  ```

---

## 最终验证波次 (FINAL)

> 4 个审查代理并行运行。全部必须通过才能标记为完成。

- [ ] F1. **计划合规审计** — `oracle`
  逐任务检查实现。对每个 Must Have：验证实现存在。对每个 Must NOT Have：搜索代码库确认无越界修改。检查证据文件在 `.omo/evidence/` 下存在。
  输出: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **代码质量审查** — `unspecified-high`
  运行 `npx tsc --noEmit`。审查修改文件：类型抑制、空 catch、调试日志、注释代码、未使用 import。检查 AI 反模式：过度抽象、泛型命名、过度注释。
  输出: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT: APPROVE/REJECT`

- [ ] F3. **实机 QA 执行** — `unspecified-high` (+ `playwright` skill)
  从干净状态启动游戏。执行所有 Task 中的 QA Scenario，严格按步骤捕获证据。测试跨任务集成（敌兵同屏、Boss 战）。保存到 `.omo/evidence/final-qa/`。
  输出: `Scenarios [N/N pass] | Integration [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F4. **范围保真检查** — `deep`
  对每个任务：对比 diff 与任务描述。确认 1:1（无缺失无蔓延）。检查 Must NOT do 合规。检测跨任务 contamination。
  输出: `Tasks [N/N compliant] | Contamination [CLEAN] | VERDICT: APPROVE/REJECT`

---

## Commit Strategy

| 任务 | 提交信息 |
|------|---------|
| T1 | `fix(shooter): fix shoot timer initialization to fire immediately` |
| T2 | `fix(elite): reset summon timer after summon` |
| T3 | `fix(boss): reset summon timer after summon` |
| T4 | `fix(bullets): clear sourceEnemy reference on bullet recycle` |
| T5 | `refactor(weapons): remove in-game weapon switch (pre-game selection only)` |

---

## Success Criteria

### 验证命令
```bash
cd D:\opencode
npx tsc --noEmit
npm run dev
# 浏览器打开 http://localhost:3000
# Playwright 脚本验证各功能
```

### 最终检查清单
- [ ] 射击型敌人能正常射击
- [ ] 精英敌人能正常召唤小怪
- [ ] Boss 能正常召唤小怪
- [ ] 敌弹正常回收
- [ ] 局内武器切换功能移除（改为局外选择）
- [ ] `npx tsc --noEmit` 编译通过
- [ ] 游戏运行帧率 ≥ 30fps（Boss 战不减帧）
