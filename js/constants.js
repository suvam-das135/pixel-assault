// ============================================================
// CONSTANTS — all tunable values in one place
// ============================================================

const CANVAS_W = 800;
const CANVAS_H = 600;
const MAX_DT = 50; // ms cap to prevent spiral-of-death

// Player
const PLAYER_SPEED = 200;
const PLAYER_MAX_HEALTH = 100;
const PLAYER_SHOOT_COOLDOWN = 150;  // ms between shots
const PLAYER_RELOAD_TIME = 1500;    // ms to reload
const PLAYER_MAX_AMMO = 30;
const PLAYER_RADIUS = 14;
const PLAYER_INVINCIBLE_MS = 600;
const PLAYER_MUZZLE_FLASH_MS = 80;
const PLAYER_WALK_FRAME_MS = 90;    // ms per walk frame

// Bullet
const BULLET_SPEED = 650;
const BULLET_DAMAGE = 20;
const BULLET_LIFETIME = 2000; // ms
const BULLET_RADIUS = 4;
const BULLET_TRAIL_LENGTH = 6;

// Enemies
const ENEMY_DEATH_DURATION = 400; // ms for death animation
const ENEMY_HIT_FLASH_MS = 100;

const WALKER_SPEED = 80;
const WALKER_HEALTH = 30;
const WALKER_RADIUS = 12;
const WALKER_SCORE = 10;
const WALKER_CONTACT_DAMAGE = 10;

const RUNNER_SPEED = 160;
const RUNNER_HEALTH = 15;
const RUNNER_RADIUS = 10;
const RUNNER_SCORE = 20;
const RUNNER_CONTACT_DAMAGE = 8;

const TANK_SPEED = 45;
const TANK_HEALTH = 150;
const TANK_RADIUS = 22;
const TANK_SCORE = 50;
const TANK_CONTACT_DAMAGE = 20;
const TANK_CHARGE_INTERVAL = 3500; // ms between charges
const TANK_CHARGE_DURATION = 600;  // ms charge lasts
const TANK_CHARGE_SPEED_MULT = 3.5;

const EXPLODER_SPEED = 120;
const EXPLODER_HEALTH = 20;
const EXPLODER_RADIUS = 13;
const EXPLODER_SCORE = 30;
const EXPLODER_CONTACT_DAMAGE = 0; // explodes instead
const EXPLODER_BLAST_RADIUS = 65;
const EXPLODER_BLAST_DAMAGE = 30;

// Boss (level 5)
const BOSS_HEALTH = 500;
const BOSS_RADIUS = 32;
const BOSS_SPEED = 55;
const BOSS_SCORE = 500;

// Particles
const PARTICLE_MAX = 500;

// Wave system
const WAVE_ANNOUNCE_DURATION = 1800; // ms
const BETWEEN_WAVE_DELAY = 3000;     // ms
const SPAWN_STAGGER_MS = 280;        // ms between each enemy spawn in a wave
const LEVEL_COMPLETE_DELAY = 2000;   // ms after last enemy dies before showing screen

// Colors
const C = {
  BG_DARK:        '#1a1a2e',
  BG_TILE:        '#1e2044',
  BG_TILE_ALT:    '#16162a',
  PLAYER_BODY:    '#5dade2',
  PLAYER_CHEST:   '#2e86c1',
  PLAYER_DARK:    '#1a5276',
  PLAYER_SKIN:    '#f0c27f',
  PLAYER_GUN:     '#aab7b8',
  PLAYER_GUN_DARK:'#717d7e',
  WALKER:         '#e74c3c',
  WALKER_DARK:    '#922b21',
  RUNNER:         '#f39c12',
  RUNNER_DARK:    '#b7770d',
  TANK:           '#8e44ad',
  TANK_DARK:      '#6c3483',
  TANK_LIGHT:     '#bb8fce',
  EXPLODER:       '#e67e22',
  EXPLODER_DARK:  '#a04000',
  BOSS:           '#1abc9c',
  BOSS_DARK:      '#148f77',
  BULLET:         '#f9e400',
  BULLET_CORE:    '#ffffff',
  HUD_HEALTH_HI:  '#2ecc71',
  HUD_HEALTH_MED: '#f39c12',
  HUD_HEALTH_LOW: '#e74c3c',
  HUD_TEXT:       '#ecf0f1',
  HUD_BG:         'rgba(0,0,0,0.55)',
  WHITE:          '#ffffff',
  BLACK:          '#000000',
};

const STATES = {
  MENU:          'menu',
  PLAYING:       'playing',
  PAUSED:        'paused',
  GAMEOVER:      'gameover',
  LEVELCOMPLETE: 'levelcomplete',
  WIN:           'win',
};
