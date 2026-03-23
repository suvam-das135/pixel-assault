// ============================================================
// PLAYER — the hero
// ============================================================

class Player {
  constructor() {
    this.x = CANVAS_W / 2;
    this.y = CANVAS_H / 2;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;       // rotation in radians (toward mouse)
    this.speed = PLAYER_SPEED;
    this.radius = PLAYER_RADIUS;

    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;

    this.ammo = PLAYER_MAX_AMMO;
    this.maxAmmo = PLAYER_MAX_AMMO;
    this.reloading = false;
    this.reloadTimer = 0;

    this.shootTimer = 0;           // ms until next shot allowed
    this.muzzleFlash = 0;          // ms remaining for muzzle flash
    this.invincibleTimer = 0;      // ms remaining for invincibility

    this.walkFrame = 0;
    this.walkTimer = 0;

    // Display score (kept in sync by game.js)
    this.score = 0;

    // Stats
    this.bulletsFired = 0;
    this.bulletsHit = 0;
    this.damageTaken = 0;
  }

  update(dt) {
    // ---- Movement ----
    let dx = 0, dy = 0;
    if (Input.isDown('ArrowUp')    || Input.isDown('KeyW')) dy -= 1;
    if (Input.isDown('ArrowDown')  || Input.isDown('KeyS')) dy += 1;
    if (Input.isDown('ArrowLeft')  || Input.isDown('KeyA')) dx -= 1;
    if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) dx += 1;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    this.vx = dx * this.speed;
    this.vy = dy * this.speed;

    this.x = clamp(this.x + this.vx * (dt / 1000), this.radius + 2, CANVAS_W - this.radius - 2);
    this.y = clamp(this.y + this.vy * (dt / 1000), this.radius + 2, CANVAS_H - this.radius - 2);

    // ---- Mouse aim ----
    this.angle = Math.atan2(Input.mouseY - this.y, Input.mouseX - this.x);

    // ---- Walk animation ----
    if (moving) {
      this.walkTimer += dt;
      if (this.walkTimer >= PLAYER_WALK_FRAME_MS) {
        this.walkTimer -= PLAYER_WALK_FRAME_MS;
        this.walkFrame = (this.walkFrame + 1) % 4;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    // ---- Timers ----
    if (this.shootTimer > 0)      this.shootTimer      = Math.max(0, this.shootTimer - dt);
    if (this.muzzleFlash > 0)     this.muzzleFlash     = Math.max(0, this.muzzleFlash - dt);
    if (this.invincibleTimer > 0) this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);

    // ---- Reload ----
    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.ammo = this.maxAmmo;
        this.reloading = false;
      }
    }

    // Auto-reload when empty
    if (this.ammo <= 0 && !this.reloading) {
      this.startReload();
    }

    // Manual reload (R key)
    if (Input.wasPressed('KeyR') && !this.reloading && this.ammo < this.maxAmmo) {
      this.startReload();
    }
  }

  startReload() {
    this.reloading = true;
    this.reloadTimer = PLAYER_RELOAD_TIME;
  }

  // Returns a new Bullet if shot is fired, or null
  tryShoot() {
    if (this.shootTimer > 0) return null;
    if (this.reloading) return null;
    if (this.ammo <= 0) return null;
    if (!Input.mouseDown) return null;

    this.ammo--;
    this.shootTimer = PLAYER_SHOOT_COOLDOWN;
    this.muzzleFlash = PLAYER_MUZZLE_FLASH_MS;
    this.bulletsFired++;

    // Muzzle tip position (in front of player, offset by gun length)
    const gunLen = 22;
    const muzzleX = this.x + Math.cos(this.angle) * gunLen;
    const muzzleY = this.y + Math.sin(this.angle) * gunLen;

    // Spawn muzzle flash particles
    ParticleSystem.burst(muzzleX, muzzleY, 'muzzle_flash', 4);

    return new Bullet(muzzleX, muzzleY, this.angle);
  }

  takeDamage(amount) {
    if (this.invincibleTimer > 0) return;
    this.health -= amount;
    this.invincibleTimer = PLAYER_INVINCIBLE_MS;
    this.damageTaken += amount;
    ParticleSystem.burst(this.x, this.y, 'hit_player', 8);
    if (this.health <= 0) this.health = 0;
  }

  isDead() {
    return this.health <= 0;
  }

  draw(ctx) {
    Renderer.drawPlayerShadow(ctx, this);
    Renderer.drawPlayer(ctx, this);
  }
}
