# 敌人贴图与音效修复计划

## 目标
1. 修复音效播放问题
2. 为不同敌人添加不同大小的贴图

## 问题分析

### 音效问题
- **原因**：SoundManager.playSFX() 使用文件路径播放音效，但 Phaser 用 key 加载
- **修复**：改用 key 播放

### 敌人外观问题
- **原因**：generateEnemyTextures() 生成简单几何图形（菱形、圆形）
- **修复**：使用 enemy.png 为每种敌人创建不同大小的贴图

## 执行步骤

### 任务 1：修复音效播放
**文件**：src/systems/SoundManager.ts

**修改**：
`	ypescript
// 修改前
playSFX(key: SoundKey) {
  const path = SOUND_KEYS[key]
  try {
    this.scene.sound.play(path, { volume: this.sfxVolume })
  } catch { ... }
}

// 修改后
playSFX(key: SoundKey) {
  try {
    this.scene.sound.play(key, { volume: this.sfxVolume })
  } catch { ... }
}
`

### 任务 2：修改敌人纹理生成
**文件**：src/scenes/BootScene.ts

**修改 generateEnemyTextures() 方法**：
- 加载 enemy.png 作为基础纹理
- 为每种敌人创建不同大小的纹理：
  - Charger: 小型（16x16）
  - Shooter: 中型（14x14）
  - Elite: 大型（24x24）

**实现方式**：
1. 在 preload() 中加载 enemy.png
2. 修改 generateEnemyTextures() 从图片生成纹理

## 验证
1. 运行游戏测试音效是否正常播放
2. 检查敌人显示是否使用贴图
3. 确认不同敌人大小不同
