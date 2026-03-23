// ============================================================
// GAME — state machine and main loop
// ============================================================

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = STATES.MENU;

    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.levelManager = new LevelManager();

    this.score = 0;
    this.level = 1;
    this.highScore = parseInt(localStorage.getItem('pixelAssault_hs') || '0');

    this.lastTime = 0;
    this.totalTime = 0;       // ms spent in current level
    this.levelStartTime = 0;

    // Announcement
    this.waveAnnounceText = '';
    this.waveAnnounceTimer = 0;

    // Level complete transition
    this.levelCompleteTimer = 0;
    this.levelCompleteShowing = false;

    // Menu decorative enemies
    this.menuEnemies = this._createMenuEnemies();
    this.menuHoverBtn = null; // 'start' | 'hs'

    // Win / gameover flash
    this.flashTimer = 0;
    this.flashColor = '#ffffff';

    // Bind loop
    this._loop = this._loop.bind(this);
  }

  start() {
    Input.init(this.canvas);
    requestAnimationFrame(this._loop);
  }

  _loop(timestamp) {
    const dt = Math.min(timestamp - (this.lastTime || timestamp), MAX_DT);
    this.lastTime = timestamp;
    this._update(dt);
    this._draw();
    requestAnimationFrame(this._loop);
  }

  // ============================================================
  // UPDATE
  // ============================================================
  _update(dt) {
    ParticleSystem.update(dt);
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);
    if (this.waveAnnounceTimer > 0) this.waveAnnounceTimer = Math.max(0, this.waveAnnounceTimer - dt);

    switch (this.state) {
      case STATES.MENU:          this._updateMenu(dt);          break;
      case STATES.PLAYING:       this._updatePlaying(dt);       break;
      case STATES.PAUSED:        this._updatePaused(dt);        break;
      case STATES.GAMEOVER:      this._updateGameOver(dt);      break;
      case STATES.LEVELCOMPLETE: this._updateLevelComplete(dt); break;
      case STATES.WIN:           this._updateWin(dt);           break;
    }

    // Clear one-shot flags AFTER state handlers have read them
    Input.update();
  }

  _updateMenu(dt) {
    // Animate decorative enemies
    for (const e of this.menuEnemies) {
      e.x += e.vx * (dt / 1000);
      e.y += e.vy * (dt / 1000);
      // Wrap around
      if (e.x > CANVAS_W + 50) e.x = -50;
      if (e.x < -50) e.x = CANVAS_W + 50;
      if (e.y > CANVAS_H + 50) e.y = -50;
      if (e.y < -50) e.y = CANVAS_H + 50;
      e.angle = Math.atan2(e.vy, e.vx);
    }

    // Button hover detection
    this.menuHoverBtn = this._menuButtonAt(Input.mouseX, Input.mouseY);

    if (Input.mouseClicked) {
      if (this.menuHoverBtn === 'start') this._startGame();
    }

    if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
      this._startGame();
    }
  }

  _updatePlaying(dt) {
    // Pause
    if (Input.wasPressed('KeyP') || Input.wasPressed('Escape')) {
      this.state = STATES.PAUSED;
      return;
    }

    // Update player
    this.player.update(dt);

    // Player shooting
    const bullet = this.player.tryShoot();
    if (bullet) this.bullets.push(bullet);

    // Update bullets
    for (const b of this.bullets) b.update(dt);

    // Update enemies
    for (const e of this.enemies) {
      e.update(dt, this.player.x, this.player.y);
    }

    // ---- COLLISIONS ----

    // Bullet vs Enemy
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const e of this.enemies) {
        if (e.state !== 'alive') continue;
        if (circleCollide(b, e)) {
          e.takeDamage(b.damage);
          b.active = false;
          this.player.bulletsHit++;
          ParticleSystem.burst(b.x, b.y, 'impact', 5);

          if (e.isDead() || e.state === 'dying') {
            this.score += e.score;
            this.player.score = this.score;
          }
          break;
        }
      }
    }

    // Enemy vs Player contact
    for (const e of this.enemies) {
      if (e.state !== 'alive') continue;
      if (circleCollide(e, this.player)) {
        if (e.type === 'exploder') {
          // Exploder explodes on contact — mark blast done so the loop below doesn't double-trigger
          e._blastDone = true;
          e.die();
          this.player.takeDamage(EXPLODER_BLAST_DAMAGE);
        } else {
          this.player.takeDamage(e.contactDamage);
        }
      }
    }

    // Exploder death blast radius
    for (const e of this.enemies) {
      if (e.type === 'exploder' && e.state === 'dying' && !e._blastDone) {
        e._blastDone = true;
        const d = dist(e.x, e.y, this.player.x, this.player.y);
        if (d <= EXPLODER_BLAST_RADIUS) {
          this.player.takeDamage(EXPLODER_BLAST_DAMAGE);
        }
      }
    }

    // Filter dead bullets and enemies
    this.bullets = this.bullets.filter(b => b.active);
    this.enemies = this.enemies.filter(e => !e.isDead());

    // ---- LEVEL MANAGER ----
    const aliveEnemies = this.enemies.filter(e => e.state === 'alive');

    const toSpawn = this.levelManager.update(dt, aliveEnemies.length);
    for (const entry of toSpawn) {
      this.enemies.push(createEnemy(entry.type, entry.x, entry.y));
    }

    // Wave announcement
    const prevWave = this._lastWave || 0;
    if (this.levelManager.waveNumber !== prevWave && !this.levelManager.waiting) {
      this._lastWave = this.levelManager.waveNumber;
      this.waveAnnounceText = 'WAVE ' + this.levelManager.waveNumber;
      this.waveAnnounceTimer = WAVE_ANNOUNCE_DURATION;
    }

    // Check level complete
    if (this.levelManager.isLevelComplete() && !this.levelCompleteShowing) {
      this.levelCompleteTimer = LEVEL_COMPLETE_DELAY;
      this.levelCompleteShowing = true;
    }

    if (this.levelCompleteShowing) {
      this.levelCompleteTimer -= dt;
      if (this.levelCompleteTimer <= 0) {
        this.levelCompleteShowing = false;
        if (this.levelManager.isLastLevel()) {
          this._winGame();
        } else {
          this.state = STATES.LEVELCOMPLETE;
          this.flashColor = '#00ff88';
          this.flashTimer = 400;
        }
        return;
      }
    }

    // Check player death
    if (this.player.isDead()) {
      this._gameOver();
    }

    this.totalTime += dt;
  }

  _updatePaused(dt) {
    if (Input.wasPressed('KeyP') || Input.wasPressed('Escape')) {
      this.state = STATES.PLAYING;
    }
  }

  _updateGameOver(dt) {
    if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
      this._startGame();
    }
    if (Input.wasPressed('Escape')) {
      this.state = STATES.MENU;
    }
    if (Input.mouseClicked) {
      const btn = this._overlayButtonAt(Input.mouseX, Input.mouseY);
      if (btn === 'restart') this._startGame();
      if (btn === 'menu') this.state = STATES.MENU;
    }
  }

  _updateLevelComplete(dt) {
    if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
      this._nextLevel();
    }
    if (Input.mouseClicked) {
      const btn = this._overlayButtonAt(Input.mouseX, Input.mouseY);
      if (btn === 'next') this._nextLevel();
    }
  }

  _updateWin(dt) {
    if (Input.wasPressed('Enter') || Input.wasPressed('Space') || Input.mouseClicked) {
      this.state = STATES.MENU;
    }
  }

  // ============================================================
  // DRAW
  // ============================================================
  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    switch (this.state) {
      case STATES.MENU:          this._drawMenu(ctx);          break;
      case STATES.PLAYING:       this._drawPlaying(ctx);       break;
      case STATES.PAUSED:        this._drawPaused(ctx);        break;
      case STATES.GAMEOVER:      this._drawGameOver(ctx);      break;
      case STATES.LEVELCOMPLETE: this._drawLevelComplete(ctx); break;
      case STATES.WIN:           this._drawWin(ctx);           break;
    }

    // Screen flash overlay
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = (this.flashTimer / 400) * 0.45;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }
  }

  _drawMenu(ctx) {
    Renderer.drawBackground(ctx, 1);

    // Dark overlay
    ctx.fillStyle = 'rgba(10,10,30,0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Decorative enemies
    for (const e of this.menuEnemies) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      Renderer.drawEnemy(ctx, e);
      ctx.restore();
    }

    // Title "PIXEL ASSAULT"
    const title = 'PIXEL ASSAULT';
    ctx.textAlign = 'center';
    ctx.font = 'bold 62px monospace';
    // Chromatic aberration layers
    ctx.fillStyle = '#ff3333';
    ctx.fillText(title, CANVAS_W / 2 - 3, 130);
    ctx.fillStyle = '#3333ff';
    ctx.fillText(title, CANVAS_W / 2 + 3, 136);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, CANVAS_W / 2, 133);

    // Subtitle
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(200,200,200,0.7)';
    ctx.fillText('TOP-DOWN SHOOTER', CANVAS_W / 2, 165);

    // Controls hint
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(180,180,255,0.6)';
    ctx.fillText('ARROWS / WASD: MOVE   MOUSE: AIM   CLICK: SHOOT   R: RELOAD', CANVAS_W / 2, 205);

    // HIGH SCORE
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#f9e400';
    ctx.fillText('BEST: ' + this.highScore, CANVAS_W / 2, 240);

    // Start button
    const isStartHover = this.menuHoverBtn === 'start';
    this._drawMenuButton(ctx, CANVAS_W / 2, 310, 200, 50, 'START GAME', isStartHover);

    // Arrow key prompt
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('or press ENTER / SPACE', CANVAS_W / 2, 385);

    // Version info
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('v1.0 — 5 LEVELS', CANVAS_W / 2, CANVAS_H - 15);
  }

  _drawMenuButton(ctx, cx, cy, w, h, text, hover) {
    const x = cx - w / 2, y = cy - h / 2;
    ctx.fillStyle = hover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = hover ? '#ffffff' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = hover ? 2 : 1;
    roundRect(ctx, x, y, w, h, 6);
    ctx.stroke();
    ctx.fillStyle = hover ? '#ffffff' : 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(text, cx, cy + 7);
  }

  _drawPlaying(ctx) {
    // 1. Background
    Renderer.drawBackground(ctx, this.levelManager.currentLevel + 1);

    // 2. Particles below
    ParticleSystem.drawLayer(ctx, 'below');

    // 3. Bullets
    for (const b of this.bullets) b.draw(ctx);

    // 4. Enemies
    for (const e of this.enemies) e.draw(ctx);

    // 5. Player
    this.player.draw(ctx);

    // 6. Particles above
    ParticleSystem.drawLayer(ctx, 'above');

    // 7. HUD
    HUD.draw(ctx, this.player, this.levelManager);
    HUD.drawMinimap(ctx, this.player, this.enemies);

    // 8. Crosshair
    HUD.drawCrosshair(ctx, Input.mouseX, Input.mouseY);

    // 9. Wave announcement
    if (this.waveAnnounceTimer > 0) {
      const alpha = Math.min(1, this.waveAnnounceTimer / 400);
      HUD.drawWaveAnnounce(ctx, this.waveAnnounceText, alpha);
    }

    // 10. Level complete countdown pulse
    if (this.levelCompleteShowing) {
      ctx.save();
      ctx.globalAlpha = 0.25 * Math.sin(Date.now() * 0.008);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }
  }

  _drawPaused(ctx) {
    this._drawPlaying(ctx);

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 20);

    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('PRESS P or ESC to resume', CANVAS_W / 2, CANVAS_H / 2 + 30);
  }

  _drawGameOver(ctx) {
    Renderer.drawBackground(ctx, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ParticleSystem.drawLayer(ctx, 'above');

    ctx.textAlign = 'center';

    // Pulsing GAME OVER
    const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.04;
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 120);
    ctx.scale(pulse, pulse);
    ctx.font = 'bold 68px monospace';
    ctx.fillStyle = '#ff3333';
    ctx.fillText('GAME OVER', 0, 0);
    ctx.restore();

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#f9e400';
    ctx.fillText('SCORE: ' + this.score, CANVAS_W / 2, CANVAS_H / 2 - 50);

    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(249,228,0,0.6)';
    ctx.fillText('BEST: ' + this.highScore, CANVAS_W / 2, CANVAS_H / 2 - 25);

    // Accuracy
    const acc = this.player && this.player.bulletsFired > 0
      ? Math.round(this.player.bulletsHit / this.player.bulletsFired * 100) : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px monospace';
    ctx.fillText('ACCURACY: ' + acc + '%', CANVAS_W / 2, CANVAS_H / 2 + 5);

    // Buttons
    const restartHover = this._overlayButtonAt(Input.mouseX, Input.mouseY) === 'restart';
    const menuHover    = this._overlayButtonAt(Input.mouseX, Input.mouseY) === 'menu';
    this._drawMenuButton(ctx, CANVAS_W / 2, CANVAS_H / 2 + 70, 200, 46, 'RESTART', restartHover);
    this._drawMenuButton(ctx, CANVAS_W / 2, CANVAS_H / 2 + 130, 200, 46, 'MAIN MENU', menuHover);

    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('ENTER to restart   ESC for menu', CANVAS_W / 2, CANVAS_H / 2 + 190);
  }

  _drawLevelComplete(ctx) {
    this._drawPlaying(ctx);

    ctx.fillStyle = 'rgba(0,20,10,0.75)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.font = 'bold 50px monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('LEVEL COMPLETE!', CANVAS_W / 2, CANVAS_H / 2 - 100);

    // Bonus breakdown
    const timeBonus = this._calcTimeBonus();
    const accBonus  = this._calcAccuracyBonus();

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#f9e400';
    ctx.fillText('SCORE: ' + this.score, CANVAS_W / 2, CANVAS_H / 2 - 40);

    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('TIME BONUS: +' + timeBonus, CANVAS_W / 2, CANVAS_H / 2 - 5);
    ctx.fillText('ACCURACY BONUS: +' + accBonus, CANVAS_W / 2, CANVAS_H / 2 + 20);

    const nextHover = this._overlayButtonAt(Input.mouseX, Input.mouseY) === 'next';
    this._drawMenuButton(ctx, CANVAS_W / 2, CANVAS_H / 2 + 90, 220, 50, 'NEXT LEVEL →', nextHover);

    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('ENTER to continue', CANVAS_W / 2, CANVAS_H / 2 + 140);
  }

  _drawWin(ctx) {
    Renderer.drawBackground(ctx, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ParticleSystem.drawLayer(ctx, 'above');

    ctx.textAlign = 'center';
    const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.04;
    ctx.save();
    ctx.translate(CANVAS_W / 2, 180);
    ctx.scale(pulse, pulse);
    ctx.font = 'bold 58px monospace';
    ctx.fillStyle = '#f9e400';
    ctx.fillText('YOU WIN!', 0, 0);
    ctx.restore();

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('FINAL SCORE: ' + this.score, CANVAS_W / 2, 260);

    ctx.font = '15px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('HIGH SCORE: ' + this.highScore, CANVAS_W / 2, 295);

    const acc = this.player && this.player.bulletsFired > 0
      ? Math.round(this.player.bulletsHit / this.player.bulletsFired * 100) : 0;
    ctx.fillText('ACCURACY: ' + acc + '%', CANVAS_W / 2, 325);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Thanks for playing!', CANVAS_W / 2, 380);

    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    if (Math.floor(Date.now() / 600) % 2 === 0) {
      ctx.fillText('PRESS ENTER or SPACE to return to menu', CANVAS_W / 2, 440);
    }
  }

  // ============================================================
  // GAME FLOW
  // ============================================================
  _startGame() {
    this.score = 0;
    this.level = 1;
    this.totalTime = 0;
    this.levelCompleteShowing = false;
    this.levelCompleteTimer = 0;
    this._lastWave = 0;

    this.enemies = [];
    this.bullets = [];
    ParticleSystem.clear();

    this.player = new Player();
    this.levelManager = new LevelManager();
    this.levelManager.startLevel(0);

    this.waveAnnounceText = 'WAVE 1';
    this.waveAnnounceTimer = WAVE_ANNOUNCE_DURATION;

    this.state = STATES.PLAYING;
    this.flashColor = '#ffffff';
    this.flashTimer = 300;
  }

  _nextLevel() {
    this.level++;
    const levelIndex = this.levelManager.currentLevel + 1;

    // Apply bonuses
    const timeBonus = this._calcTimeBonus();
    const accBonus  = this._calcAccuracyBonus();
    this.score += timeBonus + accBonus;
    this.player.score = this.score;

    this.totalTime = 0;
    this.levelCompleteShowing = false;
    this.enemies = [];
    this.bullets = [];
    ParticleSystem.clear();

    // Restore some player health
    this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
    this.player.ammo = this.player.maxAmmo;
    this.player.reloading = false;
    this.player.x = CANVAS_W / 2;
    this.player.y = CANVAS_H / 2;

    this.levelManager.startLevel(levelIndex);
    this._lastWave = 0;
    this.waveAnnounceText = 'WAVE 1';
    this.waveAnnounceTimer = WAVE_ANNOUNCE_DURATION;

    this.state = STATES.PLAYING;
    this.flashColor = '#00ff88';
    this.flashTimer = 400;
  }

  _gameOver() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pixelAssault_hs', this.highScore);
    }
    this.flashColor = '#ff0000';
    this.flashTimer = 500;
    this.state = STATES.GAMEOVER;

    // Burst particles at player death
    if (this.player) {
      ParticleSystem.burst(this.player.x, this.player.y, 'explosion', 20);
      ParticleSystem.burst(this.player.x, this.player.y, 'hit_player', 15);
    }
  }

  _winGame() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pixelAssault_hs', this.highScore);
    }
    this.flashColor = '#f9e400';
    this.flashTimer = 600;
    this.state = STATES.WIN;
    // Celebration particles
    for (let i = 0; i < 5; i++) {
      ParticleSystem.burst(
        randomRange(100, CANVAS_W - 100),
        randomRange(100, CANVAS_H - 100),
        'explosion', 12
      );
    }
  }

  // ============================================================
  // BONUS CALCULATIONS
  // ============================================================
  _calcTimeBonus() {
    const seconds = this.totalTime / 1000;
    return Math.max(0, Math.floor(500 - seconds * 4));
  }

  _calcAccuracyBonus() {
    if (!this.player || this.player.bulletsFired === 0) return 0;
    const ratio = this.player.bulletsHit / this.player.bulletsFired;
    return Math.floor(ratio * 250);
  }

  // ============================================================
  // BUTTON HIT TESTS
  // ============================================================
  _menuButtonAt(mx, my) {
    // Start button: centered at (CANVAS_W/2, 310), 200x50
    if (mx >= CANVAS_W/2 - 100 && mx <= CANVAS_W/2 + 100 &&
        my >= 285 && my <= 335) return 'start';
    return null;
  }

  _overlayButtonAt(mx, my) {
    const cy = CANVAS_H / 2;
    // GameOver: restart at cy+70, menu at cy+130
    // LevelComplete: next at cy+90
    if (mx >= CANVAS_W/2 - 110 && mx <= CANVAS_W/2 + 110) {
      if (my >= cy + 47 && my <= cy + 93)  return 'restart';
      if (my >= cy + 107 && my <= cy + 153) return 'menu';
      if (my >= cy + 65 && my <= cy + 115) return 'next';
    }
    return null;
  }

  // ============================================================
  // MENU DECORATIONS
  // ============================================================
  _createMenuEnemies() {
    const types = ['walker', 'runner', 'tank', 'exploder'];
    const enemies = [];
    for (let i = 0; i < 12; i++) {
      const type = types[i % types.length];
      const e = createEnemy(type, randomRange(0, CANVAS_W), randomRange(0, CANVAS_H));
      const angle = randomRange(0, Math.PI * 2);
      const spd = randomRange(30, 70);
      e.vx = Math.cos(angle) * spd;
      e.vy = Math.sin(angle) * spd;
      e.angle = angle;
      enemies.push(e);
    }
    return enemies;
  }
}

// ============================================================
// BOOT
// ============================================================
window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  canvas.width  = CANVAS_W;
  canvas.height = CANVAS_H;
  const game = new Game(canvas);
  game.start();
});
