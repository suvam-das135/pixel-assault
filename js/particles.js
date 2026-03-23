// ============================================================
// PARTICLES — visual effects system
// ============================================================

class Particle {
  constructor(x, y, vx, vy, color, size, life, gravity, layer) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.gravity = gravity || 0;
    this.layer = layer || 'above'; // 'below' or 'above'
    this.alpha = 1;
  }

  update(dt) {
    this.vy += this.gravity * (dt / 1000);
    this.x += this.vx * (dt / 1000);
    this.y += this.vy * (dt / 1000);
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    // Square particles look more retro
    ctx.fillRect(
      Math.floor(this.x - this.size / 2),
      Math.floor(this.y - this.size / 2),
      Math.ceil(this.size),
      Math.ceil(this.size)
    );
    ctx.restore();
  }
}

const ParticleSystem = {
  particles: [],

  burst(x, y, type, count) {
    if (this.particles.length >= PARTICLE_MAX) return;
    count = Math.min(count, PARTICLE_MAX - this.particles.length);

    for (let i = 0; i < count; i++) {
      let p;
      switch (type) {
        case 'muzzle_flash': {
          const angle = randomRange(-0.3, 0.3);
          const spd = randomRange(80, 200);
          p = new Particle(
            x + Math.cos(angle) * 8,
            y + Math.sin(angle) * 8,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            randomChoice(['#ffff00', '#ffffff', '#ffcc00']),
            randomRange(2, 5),
            randomRange(60, 140),
            0,
            'above'
          );
          break;
        }
        case 'impact': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(60, 180);
          p = new Particle(
            x, y,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            randomChoice(['#f9e400', '#ff8800', '#ffffff']),
            randomRange(2, 4),
            randomRange(150, 350),
            40,
            'above'
          );
          break;
        }
        case 'blood': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(40, 160);
          const colors = ['#e74c3c', '#c0392b', '#922b21', '#641e16'];
          p = new Particle(
            x, y,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            randomChoice(colors),
            randomRange(3, 7),
            randomRange(300, 700),
            90,
            'below'
          );
          break;
        }
        case 'walker_blood': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(40, 160);
          const colors = [C.WALKER, C.WALKER_DARK, '#f1948a'];
          p = new Particle(x, y, Math.cos(angle)*spd, Math.sin(angle)*spd,
            randomChoice(colors), randomRange(3,7), randomRange(300,700), 90, 'below');
          break;
        }
        case 'runner_blood': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(60, 200);
          const colors = [C.RUNNER, C.RUNNER_DARK, '#fad7a0'];
          p = new Particle(x, y, Math.cos(angle)*spd, Math.sin(angle)*spd,
            randomChoice(colors), randomRange(2,5), randomRange(200,500), 70, 'below');
          break;
        }
        case 'tank_blood': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(50, 140);
          const colors = [C.TANK, C.TANK_DARK, C.TANK_LIGHT];
          p = new Particle(x, y, Math.cos(angle)*spd, Math.sin(angle)*spd,
            randomChoice(colors), randomRange(4,9), randomRange(400,900), 100, 'below');
          break;
        }
        case 'explosion': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(80, 280);
          const colors = ['#ff8c00', '#e74c3c', '#ffff00', '#ff4500', '#ffffff'];
          p = new Particle(
            x + randomRange(-10, 10),
            y + randomRange(-10, 10),
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            randomChoice(colors),
            randomRange(4, 10),
            randomRange(350, 800),
            60,
            'above'
          );
          break;
        }
        case 'boss_blood': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(60, 220);
          const colors = [C.BOSS, C.BOSS_DARK, '#76d7c4', '#ffffff'];
          p = new Particle(x, y, Math.cos(angle)*spd, Math.sin(angle)*spd,
            randomChoice(colors), randomRange(4,10), randomRange(400,900), 80, 'below');
          break;
        }
        case 'death_sparks': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(30, 80);
          p = new Particle(
            x + randomRange(-8, 8),
            y + randomRange(-8, 8),
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            randomChoice(['#ffffff', '#aaaaaa', '#888888']),
            randomRange(1, 3),
            randomRange(100, 250),
            0,
            'above'
          );
          break;
        }
        case 'hit_player': {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(60, 150);
          p = new Particle(x, y, Math.cos(angle)*spd, Math.sin(angle)*spd,
            randomChoice(['#ff0000', '#ff6600', '#ffffff']),
            randomRange(3, 6), randomRange(200, 400), 50, 'above');
          break;
        }
        default: {
          const angle = randomRange(0, Math.PI * 2);
          const spd = randomRange(50, 150);
          p = new Particle(x, y, Math.cos(angle)*spd, Math.sin(angle)*spd,
            '#ffffff', 3, 300, 0, 'above');
        }
      }
      this.particles.push(p);
    }
  },

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  drawLayer(ctx, layer) {
    for (const p of this.particles) {
      if (p.layer === layer) p.draw(ctx);
    }
  },

  clear() {
    this.particles = [];
  }
};
