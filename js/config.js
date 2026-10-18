// js/config.js
window.CHARACTERS = window.CHARACTERS || {};

window.GameConfig = {
  // Stage & World Dimensions
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 540,
  FLOOR_Y: 465,
  STAGE_LEFT: 55,
  STAGE_RIGHT: 945,

  // Global Physics
  GRAVITY: 0.44,
  FRICTION: 0.78,

  // Best of 3 Match & Round Settings
  MATCH: {
    ROUNDS_TO_WIN: 2,         // Best of 3 (First to 2 wins)
    MAX_ROUNDS: 3,
    ROUND_TIME_SECONDS: 99,
    ROUND_INTRO_FRAMES: 84,   // Pre-round "ROUND X -> FIGHT!" duration
    ROUND_OVER_FRAMES: 100,   // Post-KO celebration duration before next round
    CARRY_OVER_SUPER: true    // Keep remaining Super Meter between rounds
  },

  // Input Buffer Windows (in frames at 60 FPS)
  INPUT: {
    DASH_INPUT_WINDOW: 3,     // 3-frame window for double-tap dash
    CHORD_WINDOW: 3,          // 3-frame simultaneous press window for LP+LK Throw
    MOTION_BUFFER_WINDOW: 32,
    SUPER_BUFFER_WINDOW: 50
  },

  // Character Base Stats Overrides (Centralized HP & Movement)
  CHARACTER_STATS: {
    REN:   { hp: 1000, walkSpeed: 2.10, dashSpeed: 9.5,  jumpForce: 11.2 },
    KIRA:  { hp: 950,  walkSpeed: 2.40, dashSpeed: 10.8, jumpForce: 11.6 },
    TITAN: { hp: 1150, walkSpeed: 1.75, dashSpeed: 8.4,  jumpForce: 10.6 }
  },

  // Dash Settings
  DASH: {
    DURATION_FRAMES: 14,
    BACKDASH_SPEED_MULT: 0.85
  },

  // Knockdown & Wake-up Settings
  KNOCKDOWN: {
    DURATION_FRAMES: 78,      // 1.3 seconds (78 frames at 60 FPS)
    WAKEUP_ANIM_FRAMES: 22    // Frames spent in push-up recovery animation
  },

  // Wall Splat Settings
  WALL_SPLAT: {
    MIN_VELOCITY_X: 6.0,
    STUN_FRAMES: 48
  },

  // Throw & Throw Escape (Throw Tech) Settings
  THROW: {
    DAMAGE: 120,
    STARTUP: 6,
    ACTIVE: 4,
    RECOVERY: 18,
    REACH: 76,
    EXEC_DURATION_FRAMES: 42,
    TECH_WINDOW_FRAMES: 12,   // Window to press LP+LK to escape a grab
    TECH_STATE_FRAMES: 24,    // Duration of the mutual pushback animation
    TECH_PUSHBACK_VX: 9.5     // Backward velocity applied to both fighters on Throw Tech
  },

  // Drive Impact Settings (LB / Key P)
  DRIVE_IMPACT: {
    COST: 100,
    DAMAGE: 95,
    STARTUP: 18,
    ACTIVE: 8,
    RECOVERY: 22,
    DASH_SPEED: 4.8,
    REACH: 110,
    ARMOR_MAX_HITS: 2,        // Hit 1: absorbed, Hit 2: breaks shield, Hit 3: shatters & stops move
    CRUMPLE_FRAMES: 55,
    HITSTUN: 48,
    BLOCKSTUN: 22,
    PUSHBACK: 11,
    CLASH_SLOWMO_FRAMES: 55,
    CLASH_SLOWMO_SCALE: 0.25,
    CLASH_ZOOM: 1.34
  },

  // Perfect Block Settings (LT / Key H)
  PERFECT_BLOCK: {
    MIN_SUPER_REQ: 100,       // Requires >= 1 Super Bar (100 points) to activate
    DRAIN_PER_FRAME: 0.897,     // Drains Super Meter continuously down to 0
    PUSHBACK_MULT: 0.45
  },

  // Gauges & Super Art Settings
  GAUGES: {
    MAX_DRIVE: 600,
    DRIVE_REGEN_PER_FRAME: 0.35,
    MAX_SUPER: 300,
    INITIAL_SUPER: 300,
    SUPER_GAIN_ON_HIT: 26,
    SUPER_GAIN_ON_HURT: 14,
    SUPER_GAIN_ON_BLOCK: 10,
    SUPER_FREEZE_FRAMES: 42,
    SUPER_ZOOM: 1.38,
    SUPER_LV1_COST: 100,
    SUPER_LV2_COST: 200,
    SUPER_LV3_COST: 300
  }
};