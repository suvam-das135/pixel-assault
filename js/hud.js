// ============================================================
// HUD — heads-up display drawing functions
// ============================================================

const HUD = {
  // Main HUD draw (called every frame during PLAYING)
  draw(ctx, player, levelManager) {
    this._drawHealthBar(ctx, player);
    this._drawAmmo(ctx, player);
    this._drawScoreLevel(ctx, player, levelManager);
    this._drawWaveIndicator(ctx, levelManager);
    if (levelManager.waiting) {
      this._drawWaitingIndicator(ctx, levelManager);
    }
    if (player.reloading) {
      this._drawReloadIndicator(ctx, player);
    }
  },

  _drawHealthBar(ctx, player) {
    const x = 15, y = 15, w = 160, h = 16, r = 4;
    const hp = player.health / player.maxHealth;

    // Label
    ctx.fillStyle = C.HUD_TEXT;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP', x, y - 3);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();

    // Health fill
    const barColor = hp > 0.6 ? C.HUD_HEALTH_HI : (hp > 0.3 ? C.HUD_HEALTH_MED : C.HUD_HEALTH_LOW);
    ctx.fillStyle = barColor;
    if (hp > 0) {
      roundRect(ctx, x + 1, y + 1, Math.max(4, (w - 2) * hp), h - 2, r - 1);
      ctx.fill();
    }

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();

    // HP text
    ctx.fillStyle = C.HUD_TEXT;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(player.health) + ' / ' + player.maxHealth, x + w / 2, y + 11);
  },

  _drawAmmo(ctx, player) {
    const x = 15, y = 46;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = C.HUD_TEXT;
    ctx.fillText('AMMO', x, y);

    if (player.reloading) return; // handled by reload indicator

    const dotSize = 7, dotGap = 3;
    const cols = 10;
    for (let i = 0; i < player.maxAmmo; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const dx = x + col * (dotSize + dotGap);
      const dy = y + 4 + row * (dotSize + dotGap);
      if (i < player.ammo) {
        ctx.fillStyle = '#f9e400';
        ctx.fillRect(dx, dy, dotSize, dotSize);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(dx, dy, dotSize, dotSize);
      }
    }
  },

  _drawReloadIndicator(ctx, player) {
    const x = 15, y = 46;
    const progress = 1 - (player.reloadTimer / PLAYER_RELOAD_TIME);
    const w = 100, h = 10;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y + 3, w, h);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(x, y + 3, w * progress, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y + 3, w, h);

    ctx.fillStyle = C.HUD_TEXT;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    // Blink "RELOADING" text
    if (Math.floor(Date.now() / 300) % 2 === 0) {
      ctx.fillText('RELOADING...', x, y);
    }
  },

  _drawScoreLevel(ctx, player, levelManager) {
    const x = CANVAS_W - 15, y = 15;
    ctx.textAlign = 'right';

    ctx.fillStyle = '#f9e400';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(player.score, x, y + 14);

    ctx.fillStyle = 'rgba(249,228,0,0.6)';
    ctx.font = '11px monospace';
    ctx.fillText('SCORE', x, y);

    ctx.fillStyle = C.HUD_TEXT;
    ctx.font = 'bold 13px monospace';
    ctx.fillText('LEVEL ' + levelManager.levelNumber, x, y + 32);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(levelManager.levelName, x, y + 46);
  },

  _drawWaveIndicator(ctx, levelManager) {
    const x = CANVAS_W / 2, y = CANVAS_H - 18;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px monospace';
    if (!levelManager.waiting) {
      ctx.fillText(
        'WAVE ' + levelManager.waveNumber + ' / ' + levelManager.totalWaves,
        x, y
      );
    }
  },

  _drawWaitingIndicator(ctx, levelManager) {
    const x = CANVAS_W / 2, y = CANVAS_H - 18;
    const t = Math.ceil(levelManager.betweenWaveTimer / 1000);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f9e400';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('NEXT WAVE IN ' + t + '...', x, y);
  },

  // Draw crosshair at mouse position
  drawCrosshair(ctx, x, y) {
    const size = 14, gap = 5;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    // Horizontal lines
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + size, y);
    // Vertical lines
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x - 1, y - 1, 3, 3);

    ctx.restore();
  },

  // Draw wave announcement banner
  drawWaveAnnounce(ctx, text, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';

    // Shadow/outline
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px monospace';
    for (let ox = -3; ox <= 3; ox += 3) {
      for (let oy = -3; oy <= 3; oy += 3) {
        ctx.fillText(text, CANVAS_W / 2 + ox, CANVAS_H / 2 + oy);
      }
    }

    // Main text (chromatic layers for retro effect)
    ctx.fillStyle = '#ff4444';
    ctx.fillText(text, CANVAS_W / 2 - 2, CANVAS_H / 2 - 2);
    ctx.fillStyle = '#4444ff';
    ctx.fillText(text, CANVAS_W / 2 + 2, CANVAS_H / 2 + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);

    ctx.restore();
  },

  // Minimap (bottom-right)
  drawMinimap(ctx, player, enemies) {
    const mx = CANVAS_W - 95, my = CANVAS_H - 75;
    const mw = 80, mh = 60;
    const scaleX = mw / CANVAS_W, scaleY = mh / CANVAS_H;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);

    // Enemies
    for (const e of enemies) {
      if (e.state !== 'alive') continue;
      ctx.fillStyle = e.type === 'boss' ? C.BOSS : (
        e.type === 'tank' ? C.TANK : (
        e.type === 'runner' ? C.RUNNER : (
        e.type === 'exploder' ? C.EXPLODER : C.WALKER)));
      ctx.fillRect(mx + e.x * scaleX - 1.5, my + e.y * scaleY - 1.5, 3, 3);
    }

    // Player
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx + player.x * scaleX - 2, my + player.y * scaleY - 2, 4, 4);

    ctx.restore();
  },
};
