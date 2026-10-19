// js/config.js
window.CHARACTERS = window.CHARACTERS || {};

window.GameConfig = {
  // Global Game Pace: Reduced by 35% (0.65)
  GAME_SPEED: 0.65,

  // 1. Stage & Vertical-Only Camera Settings (No Zoom)
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 540,
  FLOOR_Y: 465,
  STAGE_LEFT: 55,
  STAGE_RIGHT: 945,
  FIGHTER_PUSHBOX_WIDTH: 48,

  CAMERA: {
    UPPER_BOUND_Y: 220,           // Camera only pans up when a fighter rises above this Y threshold
    MAX_OFFSET_Y: 110,            // Maximum vertical upward pan distance
    PAN_LERP: 0.16                // Smoothness of vertical up/down panning
  },

  // 2. Post-Attack Recovery Delay (Gives defender time to block on wakeup)
  ATTACK_DELAY: {
    LIGHT_SECONDS: 0.115,         // Fast cooldown after Light Punch / Light Kick
    MEDIUM_SECONDS: 0.200,        // Medium cooldown after Medium Punch / Medium Kick
    HEAVY_SECONDS: 0.323          // Exact 0.323s cooldown after Heavy Punch / Heavy Kick
  },

  // 3. Air Combo Hit Limits & Air Slam Bounce Settings
  AIR_COMBO: {
    MAX_CAP_SECONDS: 6.0,
    MAX_LIGHT_HITS: 3,            // Over 3 light hits -> opponent drops immediately
    MAX_MEDIUM_HITS: 2,           // Over 1 medium hit -> opponent drops immediately
    ATTACKER_AIR_BOUNCE_VY: -4.4,
    VICTIM_AIR_FLOAT_VY: -5.0,
    VICTIM_AIR_PUSH_VX: 0.5,
    AIR_SLAM_BOUNCE_VY: -8.2      // Upward bounce velocity when slammed by Air Down + HP (82HP)
  },

  // 4. Global Physics
  GRAVITY: 0.44,
  AIR_COMBO_GRAVITY: 0.24,
  FRICTION: 0.78,
  CROUCH_FRICTION: 0.60,
  JUMP_FORWARD_SPEED_MULT: 1.65,
  JUMP_BACKWARD_SPEED_MULT: 1.45,
  PROJECTILE_SPEED: 8.5,

  // 5. Walk Speed Multipliers
  WALK: {
    GLOBAL_SPEED_MULT: 1.0,
    FORWARD_SPEED_MULT: 0.8,
    BACKWARD_SPEED_MULT: 0.5
  },

  // 6. Character Base Stats
  CHARACTER_STATS: {
    REN: {
      hp: 1000,
      walkForwardSpeed: 2.15,
      walkBackwardSpeed: 1.80,
      dashForwardSpeed: 9.6,
      dashBackwardSpeed: 8.2,
      jumpForce: 11.4,
      maxAirComboSeconds: 4.5,
      airDamageMultiplier: 0.75
    },
    KIRA: {
      hp: 950,
      walkForwardSpeed: 2.45,
      walkBackwardSpeed: 2.05,
      dashForwardSpeed: 10.8,
      dashBackwardSpeed: 9.2,
      jumpForce: 11.8,
      maxAirComboSeconds: 6.0,
      airDamageMultiplier: 0.50
    },
    TITAN: {
      hp: 1150,
      walkForwardSpeed: 1.95,
      walkBackwardSpeed: 1.60,
      dashForwardSpeed: 8.8,
      dashBackwardSpeed: 7.5,
      jumpForce: 11.2,
      maxAirComboSeconds: 3.5,
      airDamageMultiplier: 1.15
    }
  },

  // 7. Dash Settings
  DASH: {
    FORWARD_DURATION_FRAMES: 14,
    BACKWARD_DURATION_FRAMES: 13,
    END_VELOCITY_DAMPING: 0.50,
    AFTERIMAGE_INTERVAL_FRAMES: 3,
    AFTERIMAGE_FADE_SPEED: 0.08,
    DOUBLE_TAP_PRESS_WINDOW: 24,
    DOUBLE_TAP_RELEASE_WINDOW: 15
  },

  // 8. Input & Controller Sensitivity
  INPUT: {
    CHORD_WINDOW: 4,
    MOTION_BUFFER_WINDOW: 40,
    SUPER_BUFFER_WINDOW: 60,
    ANALOG_DEADZONE_Y: 0.48,
    ANALOG_ENGAGE_X: 0.45,
    ANALOG_RELEASE_X: 0.28,
    TRIGGER_THRESHOLD: 0.35
  },

  // 9. Match & Round Rules (Best of 3)
  MATCH: {
    ROUNDS_TO_WIN: 2,
    MAX_ROUNDS: 3,
    ROUND_TIME_SECONDS: 99,
    ROUND_INTRO_FRAMES: 84,
    ROUND_OVER_FRAMES: 100,
    CARRY_OVER_SUPER: true
  },

  // 10. Knockdown QTE, Penalty & 0.5s Wake-up Settings
  KNOCKDOWN: {
    QTE_WINDOW_SECONDS: 3.0,
    PENALTY_ADD_SECONDS: 1.5,
    WAKEUP_DURATION_SECONDS: 0.5,
    QTE_SEQUENCE_LENGTH: 3,
    QTE_POOL: ['LP', 'MP', 'HP', 'LK', 'MK', 'HK']
  },

  // 11. Ground Reversal Settings (Costs 2 Super Bars)
  REVERSAL: {
    SUPER_COST: 200,
    DAMAGE: 115,
    STARTUP: 3,
    ACTIVE: 12,
    RECOVERY: 16,
    REACH: 145,
    KNOCKBACK_VX: 11.5,
    LAUNCH_VY: -8.5
  },

  // 12. Block & Perfect Block Settings
  BLOCK: {
    CHIP_DAMAGE_MAX_HP_PERCENT: 0.15,
    PUSHBACK_MULT: 0.80
  },

  PERFECT_BLOCK: {
    MIN_SUPER_REQ: 100,
    DRAIN_PER_FRAME: 0.546,
    CHIP_DAMAGE_MAX_HP_PERCENT: 0.15,
    PUSHBACK_MULT: 0.40,
    BLOCKS_SUPERS: true,
    BLOCKS_UNBLOCKABLES: true
  },

  // 13. Throw & Throw Escape (Throw Tech) Settings
  THROW: {
    DAMAGE: 80,
    STARTUP: 6,
    ACTIVE: 4,
    RECOVERY: 18,
    REACH: 76,
    EXEC_DURATION_FRAMES: 42,
    TECH_WINDOW_FRAMES: 14,
    TECH_STATE_FRAMES: 24,
    TECH_PUSHBACK_VX: 9.5
  },

  // 14. Gauges & Super Art Costs
  GAUGES: {
    MAX_DRIVE: 600,
    DRIVE_REGEN_PER_FRAME: 0.35,
    MAX_SUPER: 300,
    INITIAL_SUPER: 300,
    SUPER_GAIN_ON_HIT: 8,
    SUPER_GAIN_ON_HURT: 4,
    SUPER_GAIN_ON_BLOCK: 0,
    SUPER_FREEZE_FRAMES: 42,
    SUPER_LV1_COST: 100,
    SUPER_LV2_COST: 200,
    SUPER_LV3_COST: 300
  }
};