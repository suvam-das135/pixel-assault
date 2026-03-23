// ============================================================
// ENEMY — base class and all enemy types
// ============================================================

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;

    this.health = 30;
    this.maxHealth = 30;
    this.speed = 80;
    this.radius = 12;
    this.score = 10;
    this.contactDamage = 10;
    this.type = 'walker';

    this.state = 'alive'; // 'alive', 'dying', 'dead'
    this.deathTimer = 0;
    this.hitFlashTimer = 0;
  }

  update(dt, playerX, playerY) {
    if (this.state === 'dying') {
      this.deathTimer -= dt;
      // Emit death sparks while dying
      if (Math.random() < 0.4) {
        ParticleSystem.burst(
          this.x + randomRange(-8, 8),
          this.y + randomRange(-8, 8),
          'death_sparks', 2
        );
      }
      if (this.deathTimer <= 0) {
        this.state = 'dead';
      }
      return;
    }

    if (this.state !== 'alive') return;

    this.angle = Math.atan2(playerY - this.y, playerX - this.x);
    this.moveToward(dt, playerX, playerY);

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    }
  }

  moveToward(dt, playerX, playerY) {
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.x += this.vx * (dt / 1000);
    this.y += this.vy * (dt / 1000);
  }

  takeDamage(dmg) {
    if (this.state !== 'alive') return;
    this.health -= dmg;
    this.hitFlashTimer = ENEMY_HIT_FLASH_MS;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.state = 'dying';
    this.deathTimer = ENEMY_DEATH_DURATION;
    this.spawnDeathParticles();
  }

  spawnDeathParticles() {
    // Override per type
    ParticleSystem.burst(this.x, this.y, 'blood', 12);
  }

  isDead() {
    return this.state === 'dead';
  }

  draw(ctx) {
    Renderer.drawEnemy(ctx, this);
  }
}

// ---- WALKER — basic straight-line pursuer ----
class WalkerEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.speed = WALKER_SPEED;
    this.health = WALKER_HEALTH;
    this.maxHealth = WALKER_HEALTH;
    this.radius = WALKER_RADIUS;
    this.score = WALKER_SCORE;
    this.contactDamage = WALKER_CONTACT_DAMAGE;
    this.type = 'walker';
  }

  spawnDeathParticles() {
    ParticleSystem.burst(this.x, this.y, 'walker_blood', 12);
  }
}

// ---- RUNNER — fast zigzagger ----
class RunnerEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.speed = RUNNER_SPEED;
    this.health = RUNNER_HEALTH;
    this.maxHealth = RUNNER_HEALTH;
    this.radius = RUNNER_RADIUS;
    this.score = RUNNER_SCORE;
    this.contactDamage = RUNNER_CONTACT_DAMAGE;
    this.type = 'runner';
    this.zigzagPhase = randomRange(0, Math.PI * 2);
  }

  moveToward(dt, playerX, playerY) {
    this.zigzagPhase += dt * 0.005;
    const lateral = Math.sin(this.zigzagPhase) * 80;
    // Perpendicular to angle
    const perpX = -Math.sin(this.angle) * lateral;
    const perpY = Math.cos(this.angle) * lateral;

    this.vx = Math.cos(this.angle) * this.speed + perpX;
    this.vy = Math.sin(this.angle) * this.speed + perpY;
    this.x += this.vx * (dt / 1000);
    this.y += this.vy * (dt / 1000);
  }

  spawnDeathParticles() {
    ParticleSystem.burst(this.x, this.y, 'runner_blood', 10);
  }
}

// ---- TANK — slow, high health, charges ----
class TankEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.speed = TANK_SPEED;
    this.health = TANK_HEALTH;
    this.maxHealth = TANK_HEALTH;
    this.radius = TANK_RADIUS;
    this.score = TANK_SCORE;
    this.contactDamage = TANK_CONTACT_DAMAGE;
    this.type = 'tank';
    this.chargeTimer = TANK_CHARGE_INTERVAL;
    this.chargeDuration = 0;
    this.charging = false;
    this.chargeAngle = 0;
  }

  update(dt, playerX, playerY) {
    if (this.state !== 'alive') {
      super.update(dt, playerX, playerY);
      return;
    }

    this.angle = Math.atan2(playerY - this.y, playerX - this.x);

    if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    if (this.charging) {
      this.chargeDuration -= dt;
      if (this.chargeDuration <= 0) {
        this.charging = false;
        this.chargeTimer = TANK_CHARGE_INTERVAL;
      }
      // Move in charge direction at high speed
      this.x += Math.cos(this.chargeAngle) * TANK_SPEED * TANK_CHARGE_SPEED_MULT * (dt / 1000);
      this.y += Math.sin(this.chargeAngle) * TANK_SPEED * TANK_CHARGE_SPEED_MULT * (dt / 1000);
    } else {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.charging = true;
        this.chargeDuration = TANK_CHARGE_DURATION;
        this.chargeAngle = this.angle;
        // Rumble particles
        ParticleSystem.burst(this.x, this.y, 'impact', 6);
      }
      this.moveToward(dt, playerX, playerY);
    }
  }

  spawnDeathParticles() {
    ParticleSystem.burst(this.x, this.y, 'tank_blood', 18);
    ParticleSystem.burst(this.x, this.y, 'explosion', 12);
  }
}

// ---- EXPLODER — kamikaze, area damage on death ----
class ExploderEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.speed = EXPLODER_SPEED;
    this.health = EXPLODER_HEALTH;
    this.maxHealth = EXPLODER_HEALTH;
    this.radius = EXPLODER_RADIUS;
    this.score = EXPLODER_SCORE;
    this.contactDamage = EXPLODER_CONTACT_DAMAGE;
    this.type = 'exploder';
    this.exploded = false;
    this.pulseTimer = 0;
  }

  update(dt, playerX, playerY) {
    this.pulseTimer += dt;
    super.update(dt, playerX, playerY);
  }

  die() {
    if (!this.exploded) {
      this.exploded = true;
      this.state = 'dying';
      this.deathTimer = ENEMY_DEATH_DURATION;
      this.spawnDeathParticles();
      // The game loop checks this flag to deal area damage
    }
  }

  spawnDeathParticles() {
    ParticleSystem.burst(this.x, this.y, 'explosion', 22);
  }
}

// ---- BOSS — final boss, combines tank behavior with bullet barrage ----
class BossEnemy extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.speed = BOSS_SPEED;
    this.health = BOSS_HEALTH;
    this.maxHealth = BOSS_HEALTH;
    this.radius = BOSS_RADIUS;
    this.score = BOSS_SCORE;
    this.contactDamage = TANK_CONTACT_DAMAGE;
    this.type = 'boss';
    this.chargeTimer = 2500;
    this.chargeDuration = 0;
    this.charging = false;
    this.chargeAngle = 0;
  }

  update(dt, playerX, playerY) {
    if (this.state !== 'alive') {
      super.update(dt, playerX, playerY);
      return;
    }

    this.angle = Math.atan2(playerY - this.y, playerX - this.x);
    if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    if (this.charging) {
      this.chargeDuration -= dt;
      if (this.chargeDuration <= 0) {
        this.charging = false;
        this.chargeTimer = 2500;
      }
      this.x += Math.cos(this.chargeAngle) * BOSS_SPEED * 3.5 * (dt / 1000);
      this.y += Math.sin(this.chargeAngle) * BOSS_SPEED * 3.5 * (dt / 1000);
    } else {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.charging = true;
        this.chargeDuration = 700;
        this.chargeAngle = this.angle;
        ParticleSystem.burst(this.x, this.y, 'impact', 8);
      }
      this.moveToward(dt, playerX, playerY);
    }
  }

  spawnDeathParticles() {
    ParticleSystem.burst(this.x, this.y, 'boss_blood', 25);
    ParticleSystem.burst(this.x, this.y, 'explosion', 20);
    ParticleSystem.burst(this.x, this.y, 'explosion', 20);
  }
}

// ---- FACTORY ----
function createEnemy(type, x, y) {
  switch (type) {
    case 'walker':   return new WalkerEnemy(x, y);
    case 'runner':   return new RunnerEnemy(x, y);
    case 'tank':     return new TankEnemy(x, y);
    case 'exploder': return new ExploderEnemy(x, y);
    case 'boss':     return new BossEnemy(x, y);
    default:         return new WalkerEnemy(x, y);
  }
}
