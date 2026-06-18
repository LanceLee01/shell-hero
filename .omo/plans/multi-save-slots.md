# 多存档槽位系统计划

## 目标
支持 3 个独立存档槽位，玩家可以切换存档。

## 修改内容

### 1. 修改 SaveData 接口
**文件**：src/systems/TalentDefs.ts

`	ypescript
// 修改前
export interface SaveData {
  crystals: number
  talents: Record<string, number>
}

// 修改后
export interface SaveSlot {
  id: number
  name: string
  crystals: number
  talents: Record<string, number>
  lastSave: string
}

export interface SaveData {
  activeSlot: number
  slots: SaveSlot[]
}
`

### 2. 修改 loadSave() 和 saveSave()
**文件**：src/systems/TalentDefs.ts

- loadSave()：加载所有存档槽位
- saveSave()：保存指定槽位
- switchSlot()：切换当前槽位
- deleteSlot()：删除存档槽位

### 3. 修改 MapSelectScene
**文件**：src/scenes/MapSelectScene.ts

- 显示存档槽位选择界面
- 显示每个槽位的晶石数量和天赋等级
- 支持切换存档

### 4. 修改 TalentScene
**文件**：src/scenes/TalentScene.ts

- 保存时保存到当前槽位

## 验证
1. 创建多个存档
2. 切换存档
3. 验证数据隔离
