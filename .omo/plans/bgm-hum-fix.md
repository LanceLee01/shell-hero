# BGM 嗡鸣声修复计划

## 问题
游戏启动后持续有嗡鸣声，是因为 BGM 声音对象没有被正确销毁。

## 原因
SoundManager.ts 的 stopBGM() 方法只调用了 stop()，没有调用 destroy() 释放资源。

## 修复

### 任务：修复 BGM 声音销毁
**文件**：src/systems/SoundManager.ts

**修改 stopBGM() 方法**（第 86-99 行）：

`	ypescript
// 修改前
stopBGM() {
  try {
    if (this.bgmTween) {
      this.bgmTween.stop()
      this.bgmTween = undefined
    }
    if (this.currentBGM) {
      this.currentBGM.stop()
      this.currentBGM = undefined
    }
  } catch { ... }
}

// 修改后
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
  } catch { ... }
}
`

## 验证
1. 运行游戏测试嗡鸣声是否消失
2. 测试 BGM 正常播放
3. 测试场景切换时 BGM 正确停止
