# Draft: 弹壳勇士全量重构

## Requirements (confirmed)
- [全量重构]: 用户要求"先重构代码，全量优化"

## 已发现的代码问题

### 架构问题
1. GameScene.ts 623行（占全代码库44%），上帝类
2. BSPGenerator.ts 被 tsconfig exclude 排除，属于死代码
3. 无测试框架/测试文件
4. 无音频系统
5. `handleWeaponSwitch()` 空方法

### 代码质量
6. 魔法数字遍地（敌人HP公式、速度、波次数量）
7. `getData/setData` 字符串类型不安全
8. 空的 try/catch 块
9. BSP types.ts 缺失 RoomType/BSPNode/DungeonData 类型定义
10. 玩家状态分散在25+个独立属性中

### 设计问题
11. BootScene.preload() 混合加载和程序化生成，无加载指示器
12. 逻辑与渲染未分离
13. 无 ECS/组件模式
14. public/assets/ 的 PNG 部分未使用（地面是程序化生成的）

## Technical Decisions
- 纯内部重构 + 小改进：拆解 God 类、清死代码、消灭魔法数字、类型安全
- BSP：修复并启用（补充缺失类型 + 集成到 GameScene）
- 测试：本次不设测试框架
- 视觉风格：保持程序化纹理，不切换为 PNG 资源

## 重构方案设计

### 模块分解（GameScene 拆分目标）

```
GameScene (623行)
├── src/entities/PlayerController.ts   — 移动、翻滚、瞄准、无敌
├── src/entities/PlayerStats.ts        — HP/XP/等级/加成 (纯数据，可测试)
├── src/entities/EnemyManager.ts       — 敌人AI、波次生成
├── src/entities/BulletManager.ts      — 子弹池、发射、碰撞
├── src/entities/PickupManager.ts      — 拾取物生成、磁吸
├── src/ui/HUD.ts                      — 血条、经验条、武器栏
├── src/ui/UpgradeUI.ts               — 升级选择卡片界面
└── src/ui/LoadingScreen.ts           — 加载进度条
```

### BootScene 拆分
```
BootScene (111行, 混合纹理生成+加载)
├── src/graphics/TextureGenerator.ts   — 所有程序化纹理生成
└── BootScene.ts (精简)                — 仅调用生成器 + 加载进度
```

### BSP 修复
- map/types.ts: 补充 RoomType, BSPNode, DungeonData 等类型
- BSPGenerator.ts: 修复 import 路径
- GameScene: 集成 BSP 地图代替平面地图
- tsconfig.json: 移除 BSP exclude

### 小改进清单
- 实现 handleWeaponSwitch() 武器切换
- 添加加载进度条
- 消灭魔法数字 → config.ts
- 修复空 catch 块

## Scope Boundaries
- INCLUDE: 代码结构重构、类型安全、模块化拆分、BSP修复启用、武器切换、加载进度条、常量提取
- EXCLUDE: 新增游戏机制、音效系统、新敌人类型、新武器、新地图主题、PNG资源替换、UI重设计
- EXCLUDE: 测试框架、CI/CD、发布流程
