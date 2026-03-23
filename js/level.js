// ============================================================
// LEVEL MANAGER — wave definitions and spawning
// ============================================================

// Level data: array of levels, each with array of waves
// Each wave: array of spawn groups {type, count, formation, delay}
const LEVEL_DATA = [
  // ---- LEVEL 1: Tutorial ----
  {
    name: 'SECTOR 1',
    waves: [
      { groups: [{ type: 'walker', count: 5, formation: 'edge_random', delay: 0 }] },
      { groups: [{ type: 'walker', count: 8, formation: 'edge_spread', delay: 0 }] },
      { groups: [
        { type: 'walker', count: 6, formation: 'edge_random', delay: 0 },
        { type: 'runner', count: 3, formation: 'edge_random', delay: 2000 }
      ]},
    ]
  },
  // ---- LEVEL 2: Runners Arrive ----
  {
    name: 'SECTOR 2',
    waves: [
      { groups: [
        { type: 'walker', count: 6, formation: 'edge_spread', delay: 0 },
        { type: 'runner', count: 4, formation: 'funnel_top', delay: 1500 }
      ]},
      { groups: [
        { type: 'runner', count: 8, formation: 'edge_spread', delay: 0 }
      ]},
      { groups: [
        { type: 'walker', count: 5, formation: 'corners', delay: 0 },
        { type: 'runner', count: 5, formation: 'edge_random', delay: 1000 },
        { type: 'exploder', count: 2, formation: 'funnel_top', delay: 3000 }
      ]},
    ]
  },
  // ---- LEVEL 3: Tanks and Exploders ----
  {
    name: 'SECTOR 3',
    waves: [
      { groups: [
        { type: 'tank', count: 1, formation: 'funnel_top', delay: 0 },
        { type: 'walker', count: 8, formation: 'edge_spread', delay: 2000 }
      ]},
      { groups: [
        { type: 'exploder', count: 5, formation: 'edge_spread', delay: 0 },
        { type: 'runner', count: 6, formation: 'edge_random', delay: 1500 }
      ]},
      { groups: [
        { type: 'tank', count: 2, formation: 'edge_spread', delay: 0 },
        { type: 'runner', count: 4, formation: 'corners', delay: 1000 },
        { type: 'exploder', count: 3, formation: 'edge_random', delay: 2500 }
      ]},
    ]
  },
  // ---- LEVEL 4: Chaos ----
  {
    name: 'SECTOR 4',
    waves: [
      { groups: [
        { type: 'walker', count: 8, formation: 'edge_spread', delay: 0 },
        { type: 'runner', count: 6, formation: 'corners', delay: 800 },
        { type: 'exploder', count: 4, formation: 'funnel_top', delay: 2000 }
      ]},
      { groups: [
        { type: 'tank', count: 3, formation: 'edge_spread', delay: 0 },
        { type: 'runner', count: 8, formation: 'edge_random', delay: 1500 }
      ]},
      { groups: [
        { type: 'walker', count: 10, formation: 'edge_spread', delay: 0 },
        { type: 'tank', count: 2, formation: 'corners', delay: 2000 },
        { type: 'exploder', count: 5, formation: 'edge_random', delay: 3000 },
        { type: 'runner', count: 5, formation: 'funnel_top', delay: 1000 }
      ]},
    ]
  },
  // ---- LEVEL 5: Boss ----
  {
    name: 'FINAL SECTOR',
    waves: [
      { groups: [
        { type: 'walker', count: 8, formation: 'edge_spread', delay: 0 },
        { type: 'runner', count: 6, formation: 'edge_random', delay: 1000 },
        { type: 'tank', count: 2, formation: 'corners', delay: 2000 }
      ]},
      { groups: [
        { type: 'exploder', count: 6, formation: 'edge_spread', delay: 0 },
        { type: 'tank', count: 3, formation: 'edge_random', delay: 1500 },
        { type: 'runner', count: 8, formation: 'funnel_top', delay: 2000 }
      ]},
      { groups: [
        { type: 'boss', count: 1, formation: 'funnel_top', delay: 0 },
        { type: 'walker', count: 6, formation: 'edge_spread', delay: 5000 },
        { type: 'runner', count: 4, formation: 'edge_random', delay: 8000 }
      ]},
    ]
  },
];

// ---- Spawn position calculators ----
function getSpawnPosition(formation, index, total) {
  const W = CANVAS_W, H = CANVAS_H, M = 35;
  switch (formation) {
    case 'edge_random': {
      const edge = randomInt(0, 3);
      return edgePoint(edge, W, H, M);
    }
    case 'edge_spread': {
      const pos = index / Math.max(total - 1, 1);
      const perim = total;
      const slot = index / perim;
      if (slot < 0.25)      return { x: lerp(M, W - M, slot * 4),       y: -M };
      else if (slot < 0.5)  return { x: W + M,                           y: lerp(M, H - M, (slot - 0.25) * 4) };
      else if (slot < 0.75) return { x: lerp(W - M, M, (slot - 0.5) * 4), y: H + M };
      else                  return { x: -M,                               y: lerp(H - M, M, (slot - 0.75) * 4) };
    }
    case 'corners': {
      const corners = [
        { x: -M, y: -M },
        { x: W + M, y: -M },
        { x: -M, y: H + M },
        { x: W + M, y: H + M }
      ];
      return corners[index % 4];
    }
    case 'funnel_top': {
      const t = total <= 1 ? 0.5 : index / (total - 1);
      return { x: lerp(M, W - M, t), y: -M };
    }
    default: {
      return edgePoint(randomInt(0, 3), W, H, M);
    }
  }
}

function edgePoint(edge, W, H, M) {
  switch (edge) {
    case 0: return { x: randomRange(M, W - M), y: -M };
    case 1: return { x: W + M, y: randomRange(M, H - M) };
    case 2: return { x: randomRange(M, W - M), y: H + M };
    case 3: return { x: -M, y: randomRange(M, H - M) };
  }
}

// ---- Level Manager ----
class LevelManager {
  constructor() {
    this.currentLevel = 0; // index into LEVEL_DATA
    this.currentWave  = 0; // index into level.waves
    this.spawnQueue   = []; // [{type, x, y, spawnAt}]
    this.spawnTimer   = 0;  // ms elapsed in current wave
    this.betweenWaveTimer = 0;
    this.waiting      = false; // waiting between waves
    this.levelDone    = false;
    this.totalEnemiesThisWave = 0;
  }

  get levelData() { return LEVEL_DATA[this.currentLevel]; }
  get waveData()  { return this.levelData.waves[this.currentWave]; }
  get levelName() { return this.levelData.name; }
  get totalWaves(){ return this.levelData.waves.length; }
  get waveNumber(){ return this.currentWave + 1; }
  get totalLevels(){ return LEVEL_DATA.length; }
  get levelNumber(){ return this.currentLevel + 1; }

  // Call this when starting a new level (resets wave index)
  startLevel(levelIndex) {
    this.currentLevel = clamp(levelIndex, 0, LEVEL_DATA.length - 1);
    this.currentWave = 0;
    this.levelDone = false;
    this.waiting = false;
    this._buildSpawnQueue();
  }

  _buildSpawnQueue() {
    this.spawnQueue = [];
    this.spawnTimer = 0;
    const wave = this.waveData;
    let globalIndex = 0;
    let globalTotal = wave.groups.reduce((acc, g) => acc + g.count, 0);
    this.totalEnemiesThisWave = globalTotal;

    wave.groups.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        const pos = getSpawnPosition(group.formation, i, group.count);
        this.spawnQueue.push({
          type: group.type,
          x: pos.x,
          y: pos.y,
          spawnAt: group.delay + i * SPAWN_STAGGER_MS,
        });
      }
    });

    // Sort by spawn time
    this.spawnQueue.sort((a, b) => a.spawnAt - b.spawnAt);
  }

  // Returns array of enemies to spawn this frame
  update(dt, activeEnemyCount) {
    const toSpawn = [];

    if (this.levelDone) return toSpawn;

    if (this.waiting) {
      this.betweenWaveTimer -= dt;
      if (this.betweenWaveTimer <= 0) {
        this.waiting = false;
        this._buildSpawnQueue();
      }
      return toSpawn;
    }

    this.spawnTimer += dt;

    // Pop all enemies whose spawnAt has passed
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnAt <= this.spawnTimer) {
      const entry = this.spawnQueue.shift();
      toSpawn.push(entry);
    }

    // Check if wave is complete
    if (this.spawnQueue.length === 0 && activeEnemyCount === 0) {
      if (this.currentWave + 1 < this.totalWaves) {
        this.currentWave++;
        this.waiting = true;
        this.betweenWaveTimer = BETWEEN_WAVE_DELAY;
      } else {
        this.levelDone = true;
      }
    }

    return toSpawn;
  }

  isLevelComplete() {
    return this.levelDone;
  }

  isLastLevel() {
    return this.currentLevel >= LEVEL_DATA.length - 1;
  }
}
