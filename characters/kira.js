// characters/kira.js
window.CHARACTERS = window.CHARACTERS || {};

window.CHARACTERS.KIRA = {
  id: "KIRA",
  name: "KIRA",
  role: "Neon Rushdown (Max 6.0s Air Combo / 0.50x Air DMG)",
  color: "#ff0077",
  secondary: "#9900ff",
  hp: 950,
  walkSpeed: 2.45,
  dashSpeed: 10.8,
  jumpForce: 11.8,
  proportions: {
    torsoW: 30, torsoH: 42,
    upperArmL: 21, lowerArmL: 21,
    upperLegL: 25, lowerLegL: 25
  },
  throwName: "NEON HURRICANRANA",
  summary: `
    <b>Fireball (Speed by Punch):</b> <code>Down, Left + LP/MP/HP</code> (Slow / Med / Fast)<br>
    <b>Uppercut (1x Air Limit, Locks Air Action):</b> <code>Down, Right, Down, Right + P</code><br>
    <b>Floor Slam (Bounce Launcher):</b> <code>Down + HP</code> | <b>Heavy Sweep (QTE):</b> <code>Down + HK</code><br>
    <b>Jump Crush (1.0s Knockdown on Stand/Crouch):</b> <code>Jump + Down + HK</code>
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Quick Flick (5LP)', anim: 'LEAD_JAB', startup: 4, active: 5, recovery: 9, dmg: 24, hitstun: 22, blockstun: 12, push: 2.0, vx: 1.5, vy: 0, type: 'high', cancel: true, reach: 78, boxY: -78, boxH: 20 },
    '5MP': { name: 'Neon Palm Strike (5MP)', anim: 'STEP_STRAIGHT', startup: 6, active: 6, recovery: 13, dmg: 46, hitstun: 26, blockstun: 14, push: 3.2, vx: 2.4, vy: 0, dashSpeed: 3.5, type: 'mid', cancel: true, reach: 88, boxY: -70, boxH: 24 },
    '5HP': { name: 'Whip Backfist (5HP)', anim: 'OVERHAND_HOOK', startup: 9, active: 7, recovery: 17, dmg: 74, hitstun: 31, blockstun: 17, push: 5.0, vx: 3.8, vy: -2, type: 'mid', cancel: true, reach: 98, boxY: -74, boxH: 28 },
    '5LK': { name: 'Snap Low Kick (5LK)', anim: 'CALF_KICK', startup: 5, active: 5, recovery: 10, dmg: 28, hitstun: 22, blockstun: 12, push: 2.5, vx: 1.8, vy: 0, type: 'low', cancel: true, reach: 84, boxY: -32, boxH: 20 },
    '5MK': { name: 'Side Snap Kick (5MK)', anim: 'SIDE_THRUST_KICK', startup: 7, active: 6, recovery: 14, dmg: 52, hitstun: 27, blockstun: 15, push: 3.8, vx: 2.8, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -58, boxH: 24 },
    '5HK': { name: 'Crescent High Kick (5HK)', anim: 'HIGH_HOOK_KICK', startup: 10, active: 7, recovery: 18, dmg: 76, hitstun: 34, blockstun: 17, push: 4.5, vx: 3.2, vy: -3, type: 'high', cancel: true, reach: 104, boxY: -82, boxH: 30 },

    // Crouching Normals
    '2LP': { name: 'Crouch Poke (2LP)', anim: 'CROUCH_JAB', startup: 4, active: 5, recovery: 9, dmg: 20, hitstun: 20, blockstun: 11, push: 1.8, vx: 1.4, vy: 0, type: 'low', cancel: true, reach: 76, boxY: -45, boxH: 18 },
    '2MP': { name: 'Low Elbow Strike (2MP)', anim: 'CROUCH_GUT_PUNCH', startup: 6, active: 6, recovery: 13, dmg: 44, hitstun: 25, blockstun: 14, push: 3.0, vx: 2.2, vy: 0, type: 'mid', cancel: true, reach: 86, boxY: -50, boxH: 22 },
    '2LK': { name: 'Ankle Tap (2LK)', anim: 'CROUCH_ANKLE_KICK', startup: 5, active: 5, recovery: 10, dmg: 24, hitstun: 21, blockstun: 11, push: 2.0, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 82, boxY: -20, boxH: 18 },
    '2MK': { name: 'Neon Slide Kick (2MK)', anim: 'LOW_SPIN_KICK', startup: 7, active: 7, recovery: 15, dmg: 48, hitstun: 26, blockstun: 14, push: 3.5, vx: 3.0, vy: 0, dashSpeed: 4.2, type: 'low', cancel: true, reach: 98, boxY: -22, boxH: 20 },

    // 1. Floor Slam (Down + HP): Bounces enemy up from the floor for Air Combo
    '2HP': {
      name: 'Neon Heel Floor Slam (2HP)',
      anim: 'FLOOR_SLAM',
      startup: 10, active: 8, recovery: 19,
      dmg: 50, hitstun: 42, blockstun: 16, push: 2.8, vx: 1.5, vy: -11.8,
      launcher: true, groundBounce: true, hitsGrounded: true, isFloorSlam: true,
      type: 'mid', cancel: true, reach: 94, boxY: -65, boxH: 65
    },

    // 2. Heavy Leg Sweep (Down + HK): Knocks opponent down and forces QTE wakeup
    '2HK': {
      name: 'Scissor Leg Sweep (2HK)',
      anim: 'DRAGON_SWEEP',
      startup: 9, active: 7, recovery: 19,
      dmg: 50, hitstun: 36, blockstun: 17, push: 4.5, vx: 3.5, vy: -5.0,
      knockdown: true, triggersQTE: true, isHeavySweep: true, hitsGrounded: true, isOtgStrike: true,
      type: 'low', cancel: false, reach: 104, boxY: -22, boxH: 24
    },

    // 3. Fireball (Down, Left + Punch): Speed scales with LP (Slow), MP (Medium), HP (Fast)
    '214LP': {
      name: 'Light Neon Kunai Wave (214LP)',
      anim: 'FIREBALL_CAST',
      startup: 9, active: 14, recovery: 15,
      dmg: 30, hitstun: 28, blockstun: 14, push: 3.5, vx: 2.2, vy: 0,
      projectile: true, projSpeed: 5.8,
      type: 'mid', special: true, cancel: false, reach: 86, boxY: -66, boxH: 26
    },
    '214MP': {
      name: 'Medium Neon Kunai Wave (214MP)',
      anim: 'FIREBALL_CAST',
      startup: 10, active: 14, recovery: 16,
      dmg: 30, hitstun: 30, blockstun: 15, push: 4.0, vx: 2.8, vy: 0,
      projectile: true, projSpeed: 9.2,
      type: 'mid', special: true, cancel: false, reach: 86, boxY: -66, boxH: 26
    },
    '214HP': {
      name: 'Heavy Neon Kunai Wave (214HP)',
      anim: 'FIREBALL_CAST',
      startup: 11, active: 14, recovery: 17,
      dmg: 30, hitstun: 32, blockstun: 16, push: 5.0, vx: 3.2, vy: 0,
      projectile: true, projSpeed: 13.0,
      type: 'mid', special: true, cancel: false, reach: 86, boxY: -66, boxH: 26
    },
    '214P': {
      name: 'Neon Kunai Wave (214P)',
      anim: 'FIREBALL_CAST',
      startup: 10, active: 14, recovery: 16,
      dmg: 30, hitstun: 30, blockstun: 15, push: 4.0, vx: 2.8, vy: 0,
      projectile: true, projSpeed: 9.2,
      type: 'mid', special: true, cancel: false, reach: 86, boxY: -66, boxH: 26
    },

    // 4. Uppercut (Down, Right, Down, Right + Punch): Usable once, locks caster until landing on floor
    '236236P': {
      name: 'Spiral Sky Uppercut (236236P)',
      anim: 'RISING_UPPERCUT',
      startup: 5, active: 12, recovery: 23,
      dmg: 80, hitstun: 46, blockstun: 19, push: 4.0, vx: 3.0, vy: -11.8,
      selfLaunchVY: -10.2, selfForwardVX: 3.5,
      isUppercut: true, locksAirActions: true, knockdown: true, invuln: true,
      type: 'mid', special: true, cancel: false, reach: 100, boxY: -94, boxH: 56
    },
    '8_236236P': {
      name: 'Air Spiral Sky Uppercut (j.236236P)',
      anim: 'RISING_UPPERCUT',
      airMove: true,
      startup: 4, active: 12, recovery: 23,
      dmg: 80, hitstun: 46, blockstun: 19, push: 4.0, vx: 3.2, vy: -10.8,
      selfLaunchVY: -8.8, selfForwardVX: 3.2,
      isUppercut: true, locksAirActions: true, knockdown: true,
      type: 'overhead', special: true, cancel: false, reach: 100, boxY: -94, boxH: 56
    },

    // 5. Heavy Jump Crush (Jump + Down + HK): Causes 1.0s fixed knockdown on standing/crouching hit
    '82HK': {
      name: 'Crimson Drop Crush (j.2HK)',
      anim: 'JUMP_CRUSH_STOMP',
      airMove: true,
      startup: 5, active: 16, recovery: 13,
      dmg: 68, hitstun: 38, blockstun: 17, push: 3.8, vx: 5.0, vy: 10.0,
      isJumpCrush: true, fixedKnockdownSec: 1.0, hitsGrounded: true, isOtgStrike: true,
      type: 'overhead', cancel: false, reach: 94, boxY: -34, boxH: 36
    },

    // Standard Jumping Normals for Air Combo
    '8LP': { name: 'Air Flick Jab (j.LP)', anim: 'AIR_JAB', airMove: true, startup: 4, active: 7, recovery: 7, dmg: 24, hitstun: 26, blockstun: 13, push: 1.5, vx: 1.5, vy: -4.8, type: 'overhead', cancel: true, reach: 80, boxY: -56, boxH: 24 },
    '8MP': { name: 'Air Neon Palm (j.MP)', anim: 'AIR_CROSS', airMove: true, startup: 5, active: 8, recovery: 9, dmg: 40, hitstun: 28, blockstun: 15, push: 1.8, vx: 1.8, vy: -5.0, type: 'overhead', cancel: true, reach: 90, boxY: -64, boxH: 26 },
    '8HP': { name: 'Air Whip Smash (j.HP)', anim: 'AIR_HAMMER_SMASH', airMove: true, startup: 6, active: 9, recovery: 11, dmg: 62, hitstun: 34, blockstun: 17, push: 2.5, vx: 2.2, vy: -5.2, type: 'overhead', cancel: true, reach: 98, boxY: -50, boxH: 34 },
    '8LK': { name: 'Air Knee Press (j.LK)', anim: 'AIR_KNEE_DROP', airMove: true, startup: 4, active: 8, recovery: 7, dmg: 26, hitstun: 26, blockstun: 13, push: 1.5, vx: 1.5, vy: -4.8, type: 'overhead', cancel: true, reach: 82, boxY: -38, boxH: 26 },
    '8MK': { name: 'Air Side Snap (j.MK)', anim: 'AIR_SIDE_BLADE', airMove: true, startup: 5, active: 9, recovery: 9, dmg: 44, hitstun: 29, blockstun: 15, push: 2.0, vx: 2.0, vy: -5.0, type: 'overhead', cancel: true, reach: 96, boxY: -48, boxH: 28 },
    '8HK': { name: 'Air Scissor Heel (j.HK)', anim: 'AIR_WHEEL_KICK', airMove: true, startup: 7, active: 10, recovery: 12, dmg: 68, hitstun: 36, blockstun: 18, push: 3.0, vx: 2.8, vy: -5.4, type: 'overhead', cancel: true, reach: 104, boxY: -44, boxH: 38 },

    // Universal Reversal, Throw, and Supers
    'REVERSAL': { name: 'GROUND REVERSAL: NEON NOVA', anim: 'RISING_UPPERCUT', startup: 3, active: 12, recovery: 16, dmg: 115, hitstun: 45, blockstun: 20, push: 12, vx: 11.5, vy: -8.5, knockdown: true, invuln: true, isReversal: true, type: 'mid', reach: 145, boxY: -90, boxH: 60 },
    'GRAB': { name: 'Neon Hurricanrana', anim: 'GRAB_ATTEMPT', startup: 6, active: 4, recovery: 18, dmg: 120, hitstun: 40, blockstun: 0, push: 10, vx: 9, vy: -6.8, unblockable: true, isThrow: true, reach: 76, boxY: -68, boxH: 34 },

    'SUPER_1': { name: 'LV1: NEON MIRAGE RUSH', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 20, dmg: 165, hitstun: 42, blockstun: 18, push: 11, vx: 9.5, vy: -7, knockdown: true, dashSpeed: 10.5, type: 'mid', special: true, reach: 142, boxY: -72, boxH: 44 },
    'SUPER_2': { name: 'LV2: CRIMSON TEMPEST', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 23, dmg: 245, hitstun: 48, blockstun: 20, push: 13, vx: 10, vy: -11.8, launcher: true, invuln: true, dashSpeed: 10, type: 'mid', special: true, reach: 148, boxY: -88, boxH: 56 },
    'SUPER_3': { name: 'LV3: FENG SHUI OVERDRIVE', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 26, dmg: 350, hitstun: 60, blockstun: 24, push: 15, vx: 13, vy: -13.0, knockdown: true, invuln: true, dashSpeed: 13, type: 'mid', special: true, reach: 162, boxY: -92, boxH: 64 }
  }
};