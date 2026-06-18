# Boss 强化 + 专属武器掉落系统 设计文档

## 背景

当前游戏 Boss 缺乏挑战性（HP 成长慢、攻击模式单一），武器系统只有 3 种基础武器（手枪/霰弹/冲锋枪），缺少通过战斗获得的强力武器激励。

## 目标

1. **Boss 难度提升** — 增加攻击模式多样性 + 提高属性数值
2. **Boss 专属武器** — 5 种强力武器，由 Boss 掉落
3. **多武器系统** — 数字键 1/2/3 切换武器，单人最多携带 3 把

---

## 1. Boss 难度提升

### 属性调整

| 属性 | 当前值 | 新值 |
|------|--------|------|
| 基础 HP | 200 | 300 |
| HP/波缩放 | +50 | +75 |
| 阶段1 速度 | 80 | 100 |
| 阶段2 速度 | 120 | 150 |
| 阶段3 速度 | 180 | 220 |
| 阶段3 弹幕数量 | 8 | 12 |
| 冲刺速度 | 400 | 500 |

### 新增攻击模式

**追踪弹 (homing)**：
- 追踪玩家（每帧转向玩家方向 0.05 弧度）
- 子弹速度 180（比普通弹慢）
- Phase 1 扇形中夹杂 1 发追踪弹

**环形爆发 (ring burst)**：
- 同时发射 2 圈子弹：半径不同，反向旋转
- Phase 2 新增

**随机激光 (laser sweep)**：
- 在玩家位置周围随机生成 2-3 条延迟激光线
- 1 秒预警（红色半透明线）→ 0.5 秒伤害判定
- Phase 3 新增

### 攻击节奏

| 阶段 | 攻击模式 | 间隔 |
|------|---------|------|
| Phase 1 | 扇形 3 发 + 1 发追踪弹 | 1800ms |
| Phase 2 | 散射 5 发 + 环形爆发 + 召唤 2 冲锋者 | 1200ms |
| Phase 3 | 弹幕 12 发 + 随机激光 + 冲刺 | 250ms |

---

## 2. Boss 专属武器（5 种）

定义在 `WeaponDefs.ts` 中扩展 `WeaponId` 枚举。每种武器都有：

| 字段 | 说明 |
|------|------|
| `isBossWeapon: true` | 标记为 Boss 武器，不出现初始选择 |
| `damage` | 基础伤害 |
| `fireRate` | 射击间隔（ms） |
| `projSpeed` | 弹丸速度 |
| `pellets` | 弹片数 |
| `spread` | 散射角度 |
| `special` | 特殊效果标识 |

### 武器表

| ID | 名称 | 伤害 | 射速 | 弹速 | 特色 |
|----|------|------|------|------|------|
| `laser` | 激光枪 | 8 | 50ms | 800 | 光束追踪最近敌人 |
| `grenade` | 榴弹炮 | 40 | 800ms | 400 | 范围爆炸 (r=40) |
| `freeze` | 冰冻枪 | 10 | 300ms | 500 | 减速敌人 50%, 2s |
| `minigun` | 机枪 | 5 | 40ms | 600 | 最高射速弹幕 |
| `cannon` | 能量炮 | 100 | 1500ms | 700 | 穿透所有敌人 |

### 纹理

- `bullet_laser` — 红色细长光束（程序化生成，8x3 发光圆角线）
- `bullet_grenade` — 橙色大圆（程序化，8x8）
- `bullet_freeze` — 蓝色菱形（程序化，6x6）
- `bullet_minigun` — 亮黄色小点（程序化，4x4）
- `bullet_cannon` — 白色大光球（程序化，10x10）

在 `BootScene.ts` 中生成。

### 特殊效果实现

**激光追踪**：在 `update()` 中每帧重新计算子弹角度，转向最近敌人。每帧转向 max 0.1 弧度。

**榴弹爆炸**：当子弹碰撞敌人或超出距离时，生成圆形范围伤害（`this.add.circle` + overlap 检测）。

**冰冻减速**：击中敌人时，在 enemy 上设置 `"slowTimer": 2000` + 修改速度逻辑。

**机枪**：高射速低伤害，无特殊逻辑。

**能量穿透**：击中敌人后不销毁子弹，继续飞行，直到超出边界。

---

## 3. Boss 掉落系统

### 掉落流程

```
Boss 死亡
  → 在 Boss 位置生成 weapon_pickup 对象（带脉冲光效）
  → 玩家靠近（overlap 触发）
  → 分配武器到空槽位（slot 2 优先，其次是 slot 3）
  → 如果 3 个槽位全满，替换当前武器
  → 显示 "+激光枪!" 浮字提示
```

### 掉落算法

- 第 1 次 Boss → 掉落 `laser`（固定）
- 第 2 次 Boss → 从剩余未获得武器中随机选 1
- 第 3 次及以后 → 从全部 5 种中随机选 1
- 重复武器 → 伤害等级提升（计算: 基础伤害 × 1.5）

### 拾取物视觉

- 使用 `weapon_pickup` 纹理（程序化生成，发光星形 + 旋转动画）
- 添加浮字提示武器名称
- 闪烁光效（alpha 脉冲 tween）

---

## 4. 武器切换系统

### 数据结构

在 `GameScene.ts` 添加：

```typescript
private weaponSlots: (WeaponDef | null)[] = [null, null, null]
// slot 0 = 初始武器（开局选）
// slot 1, 2 = Boss 掉落填充
```

### 切换实现

实现 `handleWeaponSwitch()`：

```typescript
private handleWeaponSwitch() {
  const keys = [this.key1, this.key2, this.key3]
  for (let i = 0; i < 3; i++) {
    if (Phaser.Input.Keyboard.JustDown(keys[i]) && this.weaponSlots[i]) {
      this.weaponIdx = i
      // 更新 UI 高亮
    }
  }
}
```

### UI 更新

- 武器栏显示各槽位的武器名称
- 空槽位显示灰色 "空"
- 当前选中高亮为 `#4fc3f7`（已有逻辑）

### 键盘绑定

在 `createControls()` 中添加：

```typescript
this.key1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
this.key2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
this.key3 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
```

---

## 5. 修改文件清单

| 文件 | 变更说明 |
|------|---------|
| `src/systems/BossDefs.ts` | 新增追踪弹/环形爆发/激光 攻击模式类型，更新 HP/速度 |
| `src/systems/WeaponDefs.ts` | 添加 5 种 Boss 武器定义，新增 `isBossWeapon` 标记 |
| `src/systems/ItemDefs.ts` | （可选）新增武器拾取物品类型 |
| `src/scenes/BootScene.ts` | 生成 5 种新子弹纹理 + 武器拾取物纹理 |
| `src/scenes/GameScene.ts` | 大量修改：Boss AI 新增攻击模式、Boss 掉落逻辑、武器切换实现、3 槽位管理、特殊弹道效果 |
| `src/scenes/WeaponSelectScene.ts` | 过滤 Boss 武器只显示基础 3 种 |

---

## 6. 验证步骤

1. `npm run dev` 启动游戏
2. 选择武器 → 进入游戏 → 打到第 5 波 Boss
3. 观察 Boss 是否变强（新攻击模式、更高数值）
4. Boss 死亡后观察是否掉落武器拾取物
5. 靠近拾取 → 武器出现在槽位 2
6. 按数字键 2 切换武器 → 测试射击效果
7. 再次打到 Boss（第 10 波）→ 掉落到槽位 3
8. `npm run build` 确认无 TypeScript 错误
