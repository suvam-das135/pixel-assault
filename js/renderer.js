// ============================================================
// RENDERER — sprite definitions and drawing primitives
// ============================================================

// Draw a single "pixel" square
function px(ctx, x, y, color, size) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

// Draw a sprite from a 2D array of color strings (null = transparent)
function drawSprite(ctx, sprite, x, y, scale) {
  scale = scale || 1;
  for (let ry = 0; ry < sprite.length; ry++) {
    const row = sprite[ry];
    for (let rx = 0; rx < row.length; rx++) {
      const color = row[rx];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(x + rx * scale),
          Math.floor(y + ry * scale),
          scale, scale
        );
      }
    }
  }
}

// ---- SPRITE DEFINITIONS (each pixel = 3px in-game) ----
// Player body (facing up, 9x11 pixels wide, oriented so top = forward)
const SPRITE_PLAYER = [
  //0      1      2      3      4      5      6      7      8
  [null,  null,  C.PLAYER_SKIN, C.PLAYER_SKIN, C.PLAYER_SKIN, null, null, null, null],  // head
  [null,  C.PLAYER_SKIN, C.PLAYER_SKIN, '#f5cba7', C.PLAYER_SKIN, C.PLAYER_SKIN, null, null, null],
  [null,  C.PLAYER_SKIN, '#f5cba7', '#f5cba7', '#f5cba7', C.PLAYER_SKIN, null, null, null],
  [null,  null,  C.PLAYER_DARK, C.PLAYER_DARK, C.PLAYER_DARK, null, null, null, null],  // neck
  [C.PLAYER_GUN_DARK, C.PLAYER_BODY, C.PLAYER_CHEST, C.PLAYER_CHEST, C.PLAYER_CHEST, C.PLAYER_BODY, C.PLAYER_GUN, C.PLAYER_GUN, null], // shoulders+gun
  [null, C.PLAYER_BODY, C.PLAYER_CHEST, '#aed6f1', C.PLAYER_CHEST, C.PLAYER_BODY, C.PLAYER_GUN_DARK, null, null], // torso
  [null, C.PLAYER_BODY, C.PLAYER_CHEST, C.PLAYER_CHEST, C.PLAYER_CHEST, C.PLAYER_BODY, null, null, null], // torso lower
  [null, C.PLAYER_DARK, C.PLAYER_DARK, null, C.PLAYER_DARK, C.PLAYER_DARK, null, null, null], // hips
];

// Walk leg frames — 4 frames, each is a 2-row leg section
const PLAYER_LEGS = [
  // frame 0: neutral
  [[null, C.PLAYER_DARK, null, C.PLAYER_DARK, null],
   [null, C.PLAYER_DARK, null, C.PLAYER_DARK, null]],
  // frame 1: left fwd, right back
  [[null, C.PLAYER_DARK, null, C.PLAYER_DARK, null],
   [C.PLAYER_DARK, null, null, null, C.PLAYER_DARK]],
  // frame 2: neutral
  [[null, C.PLAYER_DARK, null, C.PLAYER_DARK, null],
   [null, C.PLAYER_DARK, null, C.PLAYER_DARK, null]],
  // frame 3: left back, right fwd
  [[null, C.PLAYER_DARK, null, C.PLAYER_DARK, null],
   [C.PLAYER_DARK, null, null, null, C.PLAYER_DARK]],
];

// Walker enemy (8x8 pixels, humanoid shape)
const SPRITE_WALKER = [
  [null,  C.WALKER_DARK, C.WALKER_DARK, C.WALKER_DARK, null],
  [C.WALKER_DARK, C.WALKER, '#f1948a', C.WALKER, C.WALKER_DARK],
  [C.WALKER_DARK, C.WALKER, C.WALKER, C.WALKER, C.WALKER_DARK],
  [null, C.WALKER, C.WALKER_DARK, C.WALKER, null],
  [C.WALKER_DARK, C.WALKER, null, C.WALKER, C.WALKER_DARK],
  [C.WALKER_DARK, null, null, null, C.WALKER_DARK],
];

// Runner enemy (slim, pointed shape)
const SPRITE_RUNNER = [
  [null, C.RUNNER_DARK, C.RUNNER_DARK, null],
  [C.RUNNER_DARK, C.RUNNER, C.RUNNER, C.RUNNER_DARK],
  [C.RUNNER, '#fad7a0', C.RUNNER, C.RUNNER],
  [C.RUNNER, C.RUNNER, C.RUNNER, C.RUNNER],
  [C.RUNNER_DARK, C.RUNNER, C.RUNNER, C.RUNNER_DARK],
  [null, C.RUNNER_DARK, C.RUNNER_DARK, null],
];

// Tank enemy (wide, armored look)
const SPRITE_TANK = [
  [C.TANK_DARK, C.TANK, C.TANK, C.TANK, C.TANK, C.TANK_DARK],
  [C.TANK, C.TANK_LIGHT, C.TANK_LIGHT, C.TANK_LIGHT, C.TANK_LIGHT, C.TANK],
  [C.TANK, C.TANK_LIGHT, '#d2b4de', '#d2b4de', C.TANK_LIGHT, C.TANK],
  [C.TANK, C.TANK, C.TANK_DARK, C.TANK_DARK, C.TANK, C.TANK],
  [C.TANK, C.TANK_LIGHT, C.TANK, C.TANK, C.TANK_LIGHT, C.TANK],
  [C.TANK_DARK, C.TANK, C.TANK, C.TANK, C.TANK, C.TANK_DARK],
  [null, C.TANK_DARK, C.TANK_DARK, C.TANK_DARK, C.TANK_DARK, null],
];

// Exploder enemy (round, X marking)
const SPRITE_EXPLODER = [
  [null, C.EXPLODER_DARK, C.EXPLODER_DARK, C.EXPLODER_DARK, null],
  [C.EXPLODER_DARK, C.EXPLODER, C.EXPLODER, C.EXPLODER, C.EXPLODER_DARK],
  [C.EXPLODER_DARK, C.EXPLODER, '#f0e68c', C.EXPLODER, C.EXPLODER_DARK],
  [C.EXPLODER_DARK, C.EXPLODER_DARK, C.EXPLODER, C.EXPLODER_DARK, C.EXPLODER_DARK],
  [C.EXPLODER_DARK, C.EXPLODER, C.EXPLODER, C.EXPLODER, C.EXPLODER_DARK],
  [null, C.EXPLODER_DARK, C.EXPLODER_DARK, C.EXPLODER_DARK, null],
];

// Boss enemy (large imposing shape)
const SPRITE_BOSS = [
  [null, C.BOSS_DARK, C.BOSS, C.BOSS, C.BOSS, C.BOSS, C.BOSS_DARK, null],
  [C.BOSS_DARK, C.BOSS, C.BOSS, '#76d7c4', '#76d7c4', C.BOSS, C.BOSS, C.BOSS_DARK],
  [C.BOSS, C.BOSS, '#76d7c4', '#a9dfbf', '#a9dfbf', '#76d7c4', C.BOSS, C.BOSS],
  [C.BOSS, '#76d7c4', '#a9dfbf', C.WHITE, C.WHITE, '#a9dfbf', '#76d7c4', C.BOSS],
  [C.BOSS, C.BOSS, C.BOSS_DARK, C.BOSS, C.BOSS, C.BOSS_DARK, C.BOSS, C.BOSS],
  [C.BOSS_DARK, C.BOSS, C.BOSS, C.BOSS, C.BOSS, C.BOSS, C.BOSS, C.BOSS_DARK],
  [null, C.BOSS_DARK, C.BOSS, C.BOSS, C.BOSS, C.BOSS, C.BOSS_DARK, null],
  [null, null, C.BOSS_DARK, C.BOSS_DARK, C.BOSS_DARK, C.BOSS_DARK, null, null],
];

// ---- DRAW FUNCTIONS ----

const Renderer = {
  // Tiled floor background
  drawBackground(ctx, levelNum) {
    const tileSize = 40;
    const cols = Math.ceil(CANVAS_W / tileSize) + 1;
    const rows = Math.ceil(CANVAS_H / tileSize) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isAlt = (r + c) % 2 === 0;
        ctx.fillStyle = isAlt ? C.BG_TILE_ALT : C.BG_TILE;
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

        // Grid line (very subtle)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(c * tileSize, r * tileSize, 1, tileSize);
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, 1);
      }
    }
  },

  // Draw player at position with rotation
  drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI / 2);

    // Hit flash / invincibility blink
    if (player.invincibleTimer > 0) {
      if (Math.floor(player.invincibleTimer / 80) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }
    }

    const scale = 3;
    const bodyW = SPRITE_PLAYER[0].length * scale;
    const bodyH = (SPRITE_PLAYER.length + 2) * scale; // +2 for legs
    const ox = -Math.floor(bodyW / 2);
    const oy = -Math.floor(bodyH / 2);

    // Draw legs first (below body)
    const legFrame = PLAYER_LEGS[player.walkFrame];
    const legScale = 3;
    const legOx = ox + legScale;
    const legOy = oy + SPRITE_PLAYER.length * scale;
    drawSprite(ctx, legFrame, legOx, legOy, legScale);

    // Draw body
    drawSprite(ctx, SPRITE_PLAYER, ox, oy, scale);

    // Muzzle flash
    if (player.muzzleFlash > 0) {
      const muzzleX = 6 * scale; // gun tip X offset
      const muzzleY = oy + 4 * scale;
      ctx.globalAlpha = Math.min(1, player.muzzleFlash / PLAYER_MUZZLE_FLASH_MS);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(muzzleX - 3, muzzleY - 3, 10, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(muzzleX - 1, muzzleY - 1, 6, 4);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  },

  // Draw player shadow (call before drawPlayer)
  drawPlayerShadow(ctx, player) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(player.x + 3, player.y + 4, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // Draw an enemy based on its type
  drawEnemy(ctx, enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    const alive = enemy.state === 'alive';
    const dying = enemy.state === 'dying';

    if (dying) {
      const t = enemy.deathTimer / ENEMY_DEATH_DURATION;
      ctx.globalAlpha = t;
      const s = 1 + (1 - t) * 0.6;
      ctx.scale(s, s);
    }

    // Face toward player (angle from enemy)
    ctx.rotate(enemy.angle + Math.PI / 2);

    // Hit flash
    if (alive && enemy.hitFlashTimer > 0) {
      ctx.globalAlpha = 0.85;
    }

    let sprite, scale;
    switch (enemy.type) {
      case 'walker':   sprite = SPRITE_WALKER;   scale = 3; break;
      case 'runner':   sprite = SPRITE_RUNNER;   scale = 3; break;
      case 'tank':     sprite = SPRITE_TANK;     scale = 4; break;
      case 'exploder': sprite = SPRITE_EXPLODER; scale = 3; break;
      case 'boss':     sprite = SPRITE_BOSS;     scale = 4; break;
      default:         sprite = SPRITE_WALKER;   scale = 3;
    }

    const w = sprite[0].length * scale;
    const h = sprite.length * scale;
    drawSprite(ctx, sprite, -Math.floor(w / 2), -Math.floor(h / 2), scale);

    // Hit flash overlay (white tint)
    if (alive && enemy.hitFlashTimer > 0) {
      ctx.globalAlpha = enemy.hitFlashTimer / ENEMY_HIT_FLASH_MS * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-Math.floor(w / 2), -Math.floor(h / 2), w, h);
      ctx.globalAlpha = 1;
    }

    // Health bar for tank/boss (always visible)
    if (alive && (enemy.type === 'tank' || enemy.type === 'boss') && enemy.health < enemy.maxHealth) {
      ctx.rotate(-(enemy.angle + Math.PI / 2)); // undo rotation for HUD-style bar
      const bw = enemy.radius * 2 + 8;
      const bh = 5;
      const bx = -bw / 2;
      const by = -enemy.radius - 12;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(bx, by, bw * (enemy.health / enemy.maxHealth), bh);
    }

    ctx.restore();
  },

  // Draw bullet
  drawBullet(ctx, bullet) {
    ctx.save();

    // Draw trail
    for (let i = 0; i < bullet.trail.length; i++) {
      const t = bullet.trail[i];
      const alpha = (i / bullet.trail.length) * 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = C.BULLET;
      const s = 2 + (i / bullet.trail.length) * 3;
      ctx.fillRect(t.x - s / 2, t.y - s / 2, s, s);
    }

    // Draw bullet core
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.BULLET;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.BULLET_CORE;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_RADIUS * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },
};
