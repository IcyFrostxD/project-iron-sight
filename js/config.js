// js/config.js
window.CHARACTERS = window.CHARACTERS || {};

window.GameConfig = {
  // 1. Stage & Camera Dimensions
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 540,
  FLOOR_Y: 465,
  STAGE_LEFT: 55,
  STAGE_RIGHT: 945,
  CAMERA_ZOOM_LERP: 0.16,
  FIGHTER_PUSHBOX_WIDTH: 48,

  // 2. Global Physics
  GRAVITY: 0.44,
  AIR_COMBO_GRAVITY: 0.24,        // Reduced gravity during active Air Combo window
  FRICTION: 0.78,
  CROUCH_FRICTION: 0.60,
  JUMP_FORWARD_SPEED_MULT: 1.65,
  JUMP_BACKWARD_SPEED_MULT: 1.45,
  PROJECTILE_SPEED: 8.5,

  // 3. Walk Speed Multipliers
  WALK: {
    GLOBAL_SPEED_MULT: 1.0,
    FORWARD_SPEED_MULT: 1.0,
    BACKWARD_SPEED_MULT: 0.82
  },

  // 4. Character Base Stats & Air Combo Scaling (Max 6.0 Seconds)
  // Longer air combo duration = lower air damage multiplier
  CHARACTER_STATS: {
    REN: {
      hp: 1000,
      walkForwardSpeed: 2.15,
      walkBackwardSpeed: 1.80,
      dashForwardSpeed: 9.6,
      dashBackwardSpeed: 8.2,
      jumpForce: 11.4,
      maxAirComboSeconds: 4.5,    // 4.5s max air combo window
      airDamageMultiplier: 0.75   // Balanced air damage
    },
    KIRA: {
      hp: 950,
      walkForwardSpeed: 2.45,
      walkBackwardSpeed: 2.05,
      dashForwardSpeed: 10.8,
      dashBackwardSpeed: 9.2,
      jumpForce: 11.8,
      maxAirComboSeconds: 6.0,    // Maximum 6.0s air combo window
      airDamageMultiplier: 0.50   // Lightest air damage due to longest 6.0s duration
    },
    TITAN: {
      hp: 1150,
      walkForwardSpeed: 1.75,
      walkBackwardSpeed: 1.45,
      dashForwardSpeed: 8.5,
      dashBackwardSpeed: 7.2,
      jumpForce: 11.0,
      maxAirComboSeconds: 3.0,    // 3.0s air combo window
      airDamageMultiplier: 1.15   // Heaviest air damage due to short duration
    }
  },

  // 5. Air Combo Physics & Suspension Settings
  AIR_COMBO: {
    MAX_CAP_SECONDS: 6.0,         // Hard cap of 6.0 seconds
    ATTACKER_AIR_BOUNCE_VY: -4.8, // Upward boost given to attacker on air hit to stay airborne
    VICTIM_AIR_FLOAT_VY: -5.4,    // Upward float given to victim on air hit while timer remains
    VICTIM_AIR_PUSH_VX: 2.2       // Horizontal drift during air combo
  },

  // 6. Dash Settings (Double-Tap & Button Dash)
  DASH: {
    FORWARD_DURATION_FRAMES: 14,
    BACKWARD_DURATION_FRAMES: 13,
    END_VELOCITY_DAMPING: 0.50,
    AFTERIMAGE_INTERVAL_FRAMES: 3,
    AFTERIMAGE_FADE_SPEED: 0.08,
    DOUBLE_TAP_PRESS_WINDOW: 20,
    DOUBLE_TAP_RELEASE_WINDOW: 12
  },

  // 7. Input & Analog Stick Sensitivity
  INPUT: {
    CHORD_WINDOW: 3,
    MOTION_BUFFER_WINDOW: 32,
    SUPER_BUFFER_WINDOW: 50,
    ANALOG_DEADZONE_Y: 0.48,
    ANALOG_ENGAGE_X: 0.45,
    ANALOG_RELEASE_X: 0.28,
    TRIGGER_THRESHOLD: 0.35
  },

  // 8. Match & Round Rules (Best of 3)
  MATCH: {
    ROUNDS_TO_WIN: 2,
    MAX_ROUNDS: 3,
    ROUND_TIME_SECONDS: 99,
    ROUND_INTRO_FRAMES: 84,
    ROUND_OVER_FRAMES: 100,
    CARRY_OVER_SUPER: true
  },

  // 9. Knockdown QTE, Penalty & 0.5s Wake-up Settings
  KNOCKDOWN: {
    QTE_WINDOW_SECONDS: 2.0,      // 2.0 seconds (120 frames) to input the 3-button sequence
    PENALTY_ADD_SECONDS: 2.0,     // +2.0 seconds penalty if QTE is missed (Total = 4.0 seconds)
    WAKEUP_DURATION_SECONDS: 0.5, // Exact 0.5 seconds (30 frames) wake-up animation
    QTE_SEQUENCE_LENGTH: 3,       // Number of buttons in the wake-up prompt
    QTE_POOL: ['LP', 'MP', 'HP', 'LK', 'MK', 'HK']
  },

  // 10. Ground Reversal Settings (Counter while Knocked Down - Costs 2 Super Bars)
  REVERSAL: {
    SUPER_COST: 200,              // Uses 2 full bars (200 points) from the 3-bar Super Meter
    DAMAGE: 115,
    STARTUP: 3,
    ACTIVE: 12,
    RECOVERY: 16,
    REACH: 145,
    KNOCKBACK_VX: 11.5,
    LAUNCH_VY: -8.5
  },

  // 11. Normal Block & Perfect Block Settings
  BLOCK: {
    CHIP_DAMAGE_MAX_HP_PERCENT: 0.15,
    PUSHBACK_MULT: 0.80
  },

  PERFECT_BLOCK: {
    MIN_SUPER_REQ: 100,             // Requires >= 1 Super Bar (100 points) to activate
    DRAIN_PER_FRAME: 0.546,         // Updated energy drain rate: 0.546 per frame
    CHIP_DAMAGE_MAX_HP_PERCENT: 0.15,
    PUSHBACK_MULT: 0.40,
    BLOCKS_SUPERS: true,
    BLOCKS_UNBLOCKABLES: true
  },

  // 12. Throw & Throw Escape (Throw Tech) Settings
  THROW: {
    DAMAGE: 120,
    STARTUP: 6,
    ACTIVE: 4,
    RECOVERY: 18,
    REACH: 76,
    EXEC_DURATION_FRAMES: 42,
    TECH_WINDOW_FRAMES: 12,
    TECH_STATE_FRAMES: 24,
    TECH_PUSHBACK_VX: 9.5
  },

  // 13. Wall Splat & Gauges
  WALL_SPLAT: {
    MIN_VELOCITY_X: 6.0,
    STUN_FRAMES: 48,
    BOUNCE_VX: 1.5,
    BOUNCE_VY: -4.2
  },

  GAUGES: {
    MAX_DRIVE: 600,
    DRIVE_REGEN_PER_FRAME: 0.35,
    MAX_SUPER: 300,
    INITIAL_SUPER: 300,
    SUPER_GAIN_ON_HIT: 26,
    SUPER_GAIN_ON_HURT: 16,
    SUPER_GAIN_ON_BLOCK: 10,
    SUPER_FREEZE_FRAMES: 42,
    SUPER_ZOOM: 1.38,
    SUPER_LV1_COST: 100,
    SUPER_LV2_COST: 200,
    SUPER_LV3_COST: 300
  }
};