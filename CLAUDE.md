# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in a browser — no build step, no server required.

```bash
open index.html   # macOS
```

There are no tests, linters, or build tools. All JS is plain ES5-compatible globals.

## Git Workflow

After every meaningful change: commit with a descriptive message and push to GitHub.

```bash
git add <specific files>
git commit -m "Short summary of what and why"
git push
```

Never use `git add -A` or `git add .` — stage files explicitly.

## Architecture

### Script Load Order (index.html)

Scripts are loaded as globals in dependency order — this order must be preserved:

```
constants.js → utils.js → input.js → renderer.js →
particles.js → bullet.js → player.js → enemy.js →
level.js → hud.js → game.js
```

### Game Loop & State Machine (`js/game.js`)

`Game` is the central orchestrator. The `requestAnimationFrame` loop calls `_update(dt)` then `_draw()` each frame. Delta-time is capped at 50ms. All velocities are in **pixels/second** — update positions as `pos += vel * (dt / 1000)`.

States: `MENU → PLAYING ↔ PAUSED`, `PLAYING → GAMEOVER | LEVELCOMPLETE | WIN`.

**Critical timing fix:** `Input.update()` (which clears one-shot key flags) is called at the **end** of `_update()`, not the beginning. This is intentional — state handlers must read `wasPressed`/`mouseClicked` before they're cleared.

### Rendering (`js/renderer.js`)

All sprites are 2D arrays of hex color strings (`null` = transparent), drawn with `fillRect` at integer coordinates — never `drawImage`. The `drawSprite(ctx, sprite, x, y, scale)` function is the core primitive.

Player and enemies are drawn with `ctx.save()` / `ctx.translate()` / `ctx.rotate()` / `ctx.restore()` — the sprite is always oriented facing "up" and rotated to the entity's `angle`.

Draw order within `_drawPlaying()`:
1. Background tiles
2. Particles (layer `'below'`)
3. Bullets
4. Enemies
5. Player shadow + player
6. Particles (layer `'above'`)
7. HUD + minimap + crosshair
8. Wave announcement text

### Input (`js/input.js`)

`Input` is a singleton. It tracks:
- `keys` — currently held (use `isDown('ArrowUp')`)
- `keysPressed` — pressed this frame only (use `wasPressed('Enter')`)
- `mouseDown` / `mouseClicked` — held vs. one-shot click

Mouse coordinates are scaled to canvas coordinates to handle CSS scaling.

### Enemy System (`js/enemy.js`)

Base `Enemy` class → subclasses `WalkerEnemy`, `RunnerEnemy`, `TankEnemy`, `ExploderEnemy`, `BossEnemy`. Use `createEnemy(type, x, y)` factory.

Enemy `state` transitions: `'alive'` → `'dying'` (plays death animation for `ENEMY_DEATH_DURATION` ms) → `'dead'` (removed from array). Collision checks should guard `e.state === 'alive'`.

**Exploder special case:** When an exploder dies (shot or contact), `e._blastDone = true` must be set to prevent double-triggering area damage. Both paths (shot and contact) set this flag before calling `die()`.

### Level & Wave System (`js/level.js`)

`LEVEL_DATA` is a plain array of level objects. `LevelManager.update(dt, aliveEnemyCount)` returns an array of `{type, x, y}` spawn entries each frame. The game loop calls `createEnemy()` for each entry and pushes to `this.enemies`.

Wave completion: `spawnQueue.length === 0 && activeEnemyCount === 0`. After the last wave of a level, `isLevelComplete()` returns true.

### All Tunable Values (`js/constants.js`)

Every magic number (speeds, health, radii, timers, colors) lives in `constants.js`. Adjust balance here first before touching game logic. The `C` object holds all color hex strings.

### Particle System (`js/particles.js`)

`ParticleSystem` is a singleton with a `burst(x, y, type, count)` method. Particle types are preset configurations (e.g. `'muzzle_flash'`, `'explosion'`, `'walker_blood'`). Particles have a `layer` property (`'below'` or `'above'`) that controls draw order relative to characters. Total particle count is capped at `PARTICLE_MAX` (500).
