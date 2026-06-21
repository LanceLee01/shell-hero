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

The game uses a linear scene pipeline defined in [main.ts](src/main.ts):

```
BootScene → MapSelectScene → WeaponSelectScene → TalentScene → GameScene
```

- **BootScene** — Generates all textures procedurally (tilesets, bullets, items, UI, boss weapon sprites) via `Graphics.generateTexture()`. Preloads assets and audio. No external image files for gameplay elements — everything is drawn at runtime.
- **MapSelectScene** — Map theme selection screen.
- **WeaponSelectScene** — Starting weapon selection.
- **TalentScene** — Talent tree / meta-progression screen (persists via localStorage).
- **GameScene** — Main gameplay. The largest file (~1800 lines) containing player movement, shooting, enemy AI, boss AI, collision, XP/leveling, wave management, and HUD.

### Core Systems (`src/systems/`)

| File | Purpose |
|------|---------|
| [EnemyDefs.ts](src/systems/EnemyDefs.ts) | Enemy type definitions (Charger, Shooter, Elite) with stats |
| [BossDefs.ts](src/systems/BossDefs.ts) | Boss phase definitions, attack patterns, HP scaling |
| [WeaponDefs.ts](src/systems/WeaponDefs.ts) | 3-slot weapon system — standard + boss weapons (laser, grenade, freeze, cannon) |
| [ItemDefs.ts](src/systems/ItemDefs.ts) | Pickup item definitions (gold, health, XP, magnet) |
| [UpgradeDefs.ts](src/systems/UpgradeDefs.ts) | Level-up upgrade options (damage, fire rate, HP, speed, pellets, barrier) |
| [TalentDefs.ts](src/systems/TalentDefs.ts) | Meta-progression talent tree with localStorage persistence |
| [MapThemes.ts](src/systems/MapThemes.ts) | Map theme color palettes (used for procedural tileset generation) |
| [SoundManager.ts](src/systems/SoundManager.ts) | SFX and BGM management with fade-in/out |
| [Debug.ts](src/systems/Debug.ts) | Logger utility for in-game debug output |

### Map (`src/map/`)

- [types.ts](src/map/types.ts) — Tile type enum (WALL, FLOOR, CORRIDOR), map dimensions (MAP_WIDTH, MAP_HEIGHT)

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

- [config.ts](src/config.ts) — Game constants: dimensions (1280×720), tile size (32), player stats, dodge params, color palette, gameplay timing

### Build Setup

- Vite with `@` alias pointing to `src/`
- TypeScript 6, Phaser 3.80+
- Electron packaging via electron-builder (Windows portable only)
- All game textures are generated procedurally in BootScene — no sprite sheets
