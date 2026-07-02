# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**弹壳勇士 (Shell Hero)** — a 2D top-down Roguelite action shooter built with Phaser 3 and TypeScript, packaged as an Electron desktop app. The game features wave-based enemy spawning, a multi-phase boss fight, a 3-slot weapon system, talent progression, and procedurally generated tilesets.

## Development Commands

```bash
npm run dev              # Start Vite dev server (port 3000, auto-opens browser)
npm run build            # TypeScript check + Vite production build
npm run preview          # Preview production build locally
npm run generate-audio   # Generate SFX audio files via scripts/generate-audio.mjs
npm run electron:dev     # Build + run Electron dev mode
npm run electron:build   # Build Electron Windows portable package
npm run pack             # Build Electron portable (x64 only)
```

## Architecture

### Scene Flow (Phaser)

The game uses a linear scene pipeline defined in [src/main.ts](src/main.ts). Scene classes live in [src/scenes/](src/scenes/), not under `systems/`.

```
BootScene → MapSelectScene → WeaponSelectScene → TalentScene → GameScene
```

- **BootScene** — [src/scenes/BootScene.ts](src/scenes/BootScene.ts) (~280 lines) generates tilesets, bullets, items, UI, boss weapon sprites, and enemy bullets at runtime via `Graphics.generateTexture()`. Also loads real bitmap assets (`assets/player.png`, `assets/weapon_*.png`, `assets/enemies/*.png`, `assets/audio/*.wav`) and audio via SoundManager. Transition: `this.scene.start("MapSelectScene")`.
- **MapSelectScene** — Map theme selection screen.
- **WeaponSelectScene** — Starting weapon selection.
- **TalentScene** — Meta-progression talent tree; 3-slot save via `localStorage` (key `roguelike_save`) — see [TalentDefs.ts](src/systems/TalentDefs.ts) for `SaveData`/`SaveSlot` shape and the `loadSave`/`saveSave` helpers.
- **GameScene** — [src/scenes/GameScene.ts](src/scenes/GameScene.ts) (~1800 lines, 74 KB) is the largest file. Contains player movement, shooting, enemy AI, boss AI, collision, XP/leveling, wave management, and HUD.

### Core Systems (`src/systems/`)

| File | Purpose |
|------|---------|
| [EnemyDefs.ts](src/systems/EnemyDefs.ts) | Enemy type definitions (Charger, Shooter, Elite) with stats |
| [BossDefs.ts](src/systems/BossDefs.ts) | Boss phase definitions, attack patterns, HP scaling |
| [WeaponDefs.ts](src/systems/WeaponDefs.ts) | Weapon registry (`WEAPON_DEFS`, `WeaponId` enum). Base weapons: pistol/shotgun/smg. Boss weapons: laser/grenade/freeze/minigun/cannon (flagged `isBossWeapon`, with `special` tag). `BASE_WEAPON_LIST` filters out boss weapons for the starting-pool UI. |
| [ItemDefs.ts](src/systems/ItemDefs.ts) | Pickup item definitions (gold, health, XP, magnet) |
| [UpgradeDefs.ts](src/systems/UpgradeDefs.ts) | Level-up upgrade options (damage, fire rate, HP, speed, pellets, barrier) |
| [TalentDefs.ts](src/systems/TalentDefs.ts) | Meta-progression talent tree, save-slot helpers (`loadSave`/`saveSave`/`computeBonuses`), localStorage key `roguelike_save` |
| [MapThemes.ts](src/systems/MapThemes.ts) | Map theme color palettes consumed by BootScene's `generateTileset` |
| [SoundManager.ts](src/systems/SoundManager.ts) | SFX and BGM management with fade-in/out |
| [Debug.ts](src/systems/Debug.ts) | Logger utility for in-game debug output |

### Map (`src/map/`)

- [types.ts](src/map/types.ts) — Tile type enum (WALL, FLOOR, CORRIDOR), map dimensions (MAP_WIDTH, MAP_HEIGHT)

### Persistence

- Single localStorage key `roguelike_save` ([TalentDefs.ts](src/systems/TalentDefs.ts)) holds up to 3 save slots: `{ activeSlot, slots: [{ id, name, crystals, talents, lastSave }] }`. `computeBonuses(slot)` flattens talent levels into `TalentBonuses` consumed by `GameScene`.
- Crystals are awarded on death, proportional to waves survived.

### Electron Wrapper (`electron/`)

[electron/main.cjs](electron/main.cjs) creates a `BrowserWindow` (1280×860, min 640×360, resizable, fullscreenable, autoHideMenuBar, `contextIsolation: true`, `nodeIntegration: false`) loading `dist/index.html`. Pass `--dev` on the command line to auto-open DevTools — wired via `process.argv.includes("--dev")`.

### Other Top-Level Paths

- `adb-gui/` — standalone sibling Electron + Vite + React + Tailwind subproject (own `package.json`, `vite.config.ts`). Built independently; not part of the game's build pipeline. Its `.npm-cache/` is git-ignored.
- `docs/superpowers/{plans,specs}/` — superpowers workflow artifacts (planning/spec scratchpads).
- `.omo/` — omo agent state (boulder.json, drafts, plans, run-continuation).
- `2D肉鸽游戏设计方案.md` — early design notes for the shell-hero game itself (Waves/boss/talent concept).

### Sibling Projects (repo root)

- `封锁区-游戏策划案.md` (repo root) — design doc for **《封锁区 / Blockade》**, a separate Godot 4.x 3D extraction-shooter (PvE / Tarkov-style). Not implemented; lives at repo root to keep it independent of the shell-hero subproject.

### Key Game Mechanics

- **Player**: WASD/Arrow movement, mouse aim + click to shoot, Space to dodge (invincibility frames), 1/2/3 keys to switch weapons
- **Wave system**: Enemies scale with wave number; every 5th wave spawns a boss
- **Boss AI**: 3 phases based on HP ratio, multiple attack patterns (fan, scatter, bullet-hell, rush, homing, ring-burst, laser-sweep)
- **Weapon system**: 3 slots, boss weapons drop as pickups, duplicate boss weapons grant +50% damage instead of replacing
- **Barrier**: Player has an AOE barrier that damages and slows nearby enemies
- **Magnet**: Temporary 10s magnet aura that attracts XP orbs and gold coins
- **XP/Leveling**: Kill enemies → XP orbs → level up → 3-choice upgrade UI (keyboard A/S/D or click)
- **Death**: Earns crystals (permanent currency) proportional to waves survived; saved to localStorage

### Configuration

- [config.ts](src/config.ts) — Game constants: dimensions (1280×720), tile size (32), player stats, dodge params, color palette, gameplay timing (frame ms, grenade radius, boss phase-2 attack interval, enemy shoot cooldown base)

### Build Setup

- Vite with `@` alias pointing to `src/`
- TypeScript 6, Phaser 3.80+, Arcade physics (no gravity), `pixelArt: true`, scale mode `FIT` with `CENTER_BOTH`
- Electron packaging via electron-builder (Windows portable only, x64)
- Most game textures are generated procedurally in BootScene; bitmap assets under `assets/` (player, weapons, enemies) and audio under `assets/audio/` are loaded alongside the procedural pipeline
- **No test runner is configured** — `package.json` has no `test` script. Validation runs are limited to `npm run build` (tsc + vite build)
