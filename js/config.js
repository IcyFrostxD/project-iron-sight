// js/config.js
window.CHARACTERS = window.CHARACTERS || {};

window.GameConfig = {
  // 1. Stage & Camera Tracking Settings
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 540,
  FLOOR_Y: 465,
  STAGE_LEFT: 55,
  STAGE_RIGHT: 945,
  FIGHTER_PUSHBOX_WIDTH: 48,

  CAMERA: {
    ZOOM_LERP: 0.16,
    FOLLOW_LERP_X: 0.14,
    FOLLOW_LERP_Y: 0.18,
    DEFAULT_FOCUS_Y: 270,
    MIN_FOCUS_Y: 175              // Allows camera to pan up smoothly during Air Combos
  },

  // 2. Global Physics
  GRAVITY: 0.44,
  AIR_COMBO_GRAVITY: 0.26,
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

  // 4. Character Base Stats & Air Combo Scaling
  CHARACTER_STATS: {
    REN: {
      hp: 1000,
      walkForwardSpeed: 2.15,
      walkBackwardSpeed: 1.80,
      dashForwardSpeed: 9.6,
      dashBackwardSpeed: 8.2,
      airDashForwardSpeed: 9.2,
      airDashBackwardSpeed: 7.8,
      jumpForce: 11.0,
      maxAirComboSeconds: 4.5,
      airDamageMultiplier: 0.75
    },
    KIRA: {
      hp: 950,
      walkForwardSpeed: 2.45,
      walkBackwardSpeed: 2.05,
      dashForwardSpeed: 10.8,
      dashBackwardSpeed: 9.2,
      airDashForwardSpeed: 10.2,
      airDashBackwardSpeed: 8.6,
      jumpForce: 11.4,
      maxAirComboSeconds: 6.0,
      airDamageMultiplier: 0.50
    },
    TITAN: {
      hp: 1150,
      walkForwardSpeed: 1.75,
      walkBackwardSpeed: 1.45,
      dashForwardSpeed: 8.5,
      dashBackwardSpeed: 7.2,
      airDashForwardSpeed: 8.0,
      airDashBackwardSpeed: 6.8,
      jumpForce: 10.5,
      maxAirComboSeconds: 3.0,
      airDamageMultiplier: 1.15
    }
  },

  // 5. Air Combo Height Cap & Suspension Physics
  AIR_COMBO: {
    MAX_CAP_SECONDS: 6.0,
    CEILING_Y: 165,               // Caps air combo height just above the health bar area
    LAUNCH_INITIAL_VY: -8.8,      // Controlled launch height so enemy stays near HUD level
    ATTACKER_AIR_BOUNCE_VY: -3.6, // Gentle hop to keep attacker aligned with target
    VICTIM_AIR_FLOAT_VY: -4.1,    // Gentle float to prevent sky-high vertical runaway
    VICTIM_AIR_PUSH_VX: 0.8       // Minimal horizontal drift so air combos never push out of range
  },

  // 6. Ground & Air Dash Configuration (1 Air Dash per Jump)
  DASH: {
    MAX_AIR_DASHES: 1,            // 1 Air Dash allowed per jump cycle
    AIR_DASH_DURATION_FRAMES: 12,
    FORWARD_DURATION_FRAMES: 14,
    BACKWARD_DURATION_FRAMES: 13,
    END_VELOCITY_DAMPING: 0.50,
    AFTERIMAGE_INTERVAL_FRAMES: 3,
    AFTERIMAGE_FADE_SPEED: 0.08,
    DOUBLE_TAP_PRESS_WINDOW: 20,
    DOUBLE_TAP_RELEASE_WINDOW: 12
  },

  // 7. Ground Chain Combos & SF6-Style Progressive Pushback
  COMBAT: {
    // Progressive ground pushback (Does NOT apply to Air Combos)
    GROUND_PUSHBACK_BASE_MULT: 1.15,
    GROUND_CHAIN_PUSHBACK_PER_HIT: 1.35,
    CORNER_ATTACKER_PUSHBACK_MULT: 1.0,

    // Allowed Ground Gatling / Chain Routes (Supports LP -> LP -> MP -> LK and more)
    CHAIN_ROUTES: {
      '5LP': ['5LP', '5MP', '5LK', '5MK', '2LP', '2LK'],
      '2LP': ['2LP', '5LP', '5MP', '5LK', '2LK', '2MK'],
      '5MP': ['5LK', '5MK', '5HP', '2LK', '2MK', '2HK'],
      '2MP': ['2LK', '2MK', '2HK', '5LK'],
      '5LK': ['5LK', '5MK', '5HK', '5MP', '2LK', '2MK'],
      '2LK': ['2LK', '2MK', '2HK', '5LK', '5MK'],
      '5MK': ['5LK', '5HK', '2HK'],
      '2MK': ['2HK', '5HK']
    },
    MAX_LIGHT_CHAINS: 3
  },

  // 8. Launcher Nerf & 3-Stage Launch Decay Rules
  LAUNCH_DECAY: {
    MAX_LAUNCHES_BEFORE_IMMUNE: 2,      // 3rd launch attempt is blocked (deals normal hit instead)
    SECOND_LAUNCH_AUTO_WAKE_SECONDS: 1.0, // 2nd launch knockdown wakes up automatically in 1.0s without QTE
    RESET_NEUTRAL_FRAMES: 150           // Frames in neutral required to reset launch counter back to 0
  },

  // 9. Knockdown QTE, Penalty & 0.5s Wake-up Settings
  KNOCKDOWN: {
    QTE_WINDOW_SECONDS: 2.0,
    PENALTY_ADD_SECONDS: 2.0,
    WAKEUP_DURATION_SECONDS: 0.5,
    QTE_SEQUENCE_LENGTH: 3,
    QTE_POOL: ['LP', 'MP', 'HP', 'LK', 'MK', 'HK']
  },

  // 10. Ground Reversal Settings (Costs 2 Super Bars)
  REVERSAL: {
    SUPER_COST: 200,
    DAMAGE: 115,
    STARTUP: 3,
    ACTIVE: 12,
    RECOVERY: 16,
    REACH: 145,
    KNOCKBACK_VX: 11.5,
    LAUNCH_VY: -8.0
  },

  // 11. Block & Perfect Block Settings
  BLOCK: {
    CHIP_DAMAGE_MAX_HP_PERCENT: 0.15,
    PUSHBACK_MULT: 1.10
  },

  PERFECT_BLOCK: {
    MIN_SUPER_REQ: 100,
    DRAIN_PER_FRAME: 0.546,
    CHIP_DAMAGE_MAX_HP_PERCENT: 0.15,
    PUSHBACK_MULT: 0.55
  },

  // 12. Input, Throw & Match Rules
  INPUT: {
    CHORD_WINDOW: 3,
    MOTION_BUFFER_WINDOW: 32,
    SUPER_BUFFER_WINDOW: 50,
    ANALOG_DEADZONE_Y: 0.48,
    ANALOG_ENGAGE_X: 0.45,
    ANALOG_RELEASE_X: 0.28,
    TRIGGER_THRESHOLD: 0.35
  },

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

  MATCH: {
    ROUNDS_TO_WIN: 2,
    MAX_ROUNDS: 3,
    ROUND_TIME_SECONDS: 99,
    ROUND_INTRO_FRAMES: 84,
    ROUND_OVER_FRAMES: 100,
    CARRY_OVER_SUPER: true
  },

  GAUGES: {
    MAX_DRIVE: 600,
    DRIVE_REGEN_PER_FRAME: 0.35,
    MAX_SUPER: 300,
    INITIAL_SUPER: 300,
    SUPER_GAIN_ON_HIT: 24,
    SUPER_GAIN_ON_HURT: 15,
    SUPER_GAIN_ON_BLOCK: 10,
    SUPER_FREEZE_FRAMES: 42,
    SUPER_ZOOM: 1.35,
    SUPER_LV1_COST: 100,
    SUPER_LV2_COST: 200,
    SUPER_LV3_COST: 300
  }
};