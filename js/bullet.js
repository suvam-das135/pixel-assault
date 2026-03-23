// ============================================================
// BULLET — projectile fired by the player
// ============================================================

class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.radius = BULLET_RADIUS;
    this.damage = BULLET_DAMAGE;
    this.lifetime = BULLET_LIFETIME;
    this.age = 0;
    this.active = true;
    this.trail = [];
  }

  update(dt) {
    if (!this.active) return;

    // Record trail position
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > BULLET_TRAIL_LENGTH) {
      this.trail.shift();
    }

    this.x += this.vx * (dt / 1000);
    this.y += this.vy * (dt / 1000);
    this.age += dt;

    // Deactivate if out of bounds or expired
    if (
      this.age > this.lifetime ||
      this.x < -20 || this.x > CANVAS_W + 20 ||
      this.y < -20 || this.y > CANVAS_H + 20
    ) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    Renderer.drawBullet(ctx, this);
  }
}
