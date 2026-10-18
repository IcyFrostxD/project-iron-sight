// characters/ren.js
window.CHARACTERS = window.CHARACTERS || {};

window.CHARACTERS.REN = {
  id: "REN",
  name: "REN",
  role: "Cyber-Mishima (4.5s Air Combo / 0.75x Air DMG)",
  color: "#00f0ff",
  secondary: "#0055ff",
  hp: 1000,
  walkSpeed: 2.15,
  dashSpeed: 9.6,
  jumpForce: 11.4,
  proportions: {
    torsoW: 34, torsoH: 44,
    upperArmL: 22, lowerArmL: 22,
    upperLegL: 24, lowerLegL: 24
  },
  throwName: "CYBER IZUNA DROP",
  summary: `
    <b>Fireball (Speed by Punch):</b> <code>Down, Left + LP/MP/HP</code> (Slow / Med / Fast)<br>
    <b>Uppercut (1x Air Limit, Locks Air Action):</b> <code>Down, Right, Down, Right + P</code><br>
    <b>Floor Slam (Bounce Launcher):</b> <code>Down + HP</code> | <b>Heavy Sweep (QTE):</b> <code>Down + HK</code><br>
    <b>Jump Crush (1.0s Knockdown on Stand/Crouch):</b> <code>Jump + Down + HK</code>
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Lead Snap Jab (5LP)', anim: 'LEAD_JAB', startup: 5, active: 5, recovery: 10, dmg: 26, hitstun: 22, blockstun: 12, push: 2.5, vx: 1.5, vy: 0, type: 'high', cancel: true, reach: 80, boxY: -82, boxH: 20 },
    '5MP': { name: 'Step-In Body Cross (5MP)', anim: 'STEP_STRAIGHT', startup: 7, active: 6, recovery: 14, dmg: 50, hitstun: 26, blockstun: 15, push: 3.5, vx: 2.5, vy: 0, dashSpeed: 3.0, type: 'mid', cancel: true, reach: 92, boxY: -72, boxH: 24 },
    '5HP': { name: 'Overhand Crusher (5HP)', anim: 'OVERHAND_HOOK', startup: 10, active: 7, recovery: 19, dmg: 80, hitstun: 32, blockstun: 18, push: 5.5, vx: 4.0, vy: -2, type: 'mid', cancel: true, reach: 100, boxY: -78, boxH: 30 },
    '5LK': { name: 'Inside Calf Kick (5LK)', anim: 'CALF_KICK', startup: 6, active: 5, recovery: 11, dmg: 30, hitstun: 22, blockstun: 12, push: 2.8, vx: 1.8, vy: 0, type: 'low', cancel: true, reach: 84, boxY: -32, boxH: 20 },
    '5MK': { name: 'Ribcage Side Kick (5MK)', anim: 'SIDE_THRUST_KICK', startup: 8, active: 6, recovery: 15, dmg: 55, hitstun: 27, blockstun: 15, push: 4.0, vx: 3.0, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -58, boxH: 26 },
    '5HK': { name: 'Spinning High Hook Kick (5HK)', anim: 'HIGH_HOOK_KICK', startup: 11, active: 7, recovery: 20, dmg: 82, hitstun: 34, blockstun: 18, push: 5.0, vx: 3.5, vy: -3, type: 'high', cancel: true, reach: 106, boxY: -82, boxH: 30 },

    // Crouching Normals
    '2LP': { name: 'Crouch Knuckle Tap (2LP)', anim: 'CROUCH_JAB', startup: 5, active: 5, recovery: 10, dmg: 22, hitstun: 20, blockstun: 11, push: 2.0, vx: 1.4, vy: 0, type: 'low', cancel: true, reach: 78, boxY: -46, boxH: 18 },
    '2MP': { name: 'Crouch Solar Plexus Blow (2MP)', anim: 'CROUCH_GUT_PUNCH', startup: 7, active: 6, recovery: 14, dmg: 48, hitstun: 26, blockstun: 14, push: 3.2, vx: 2.2, vy: 0, type: 'mid', cancel: true, reach: 88, boxY: -50, boxH: 24 },
    '2LK': { name: 'Low Ankle Poke (2LK)', anim: 'CROUCH_ANKLE_KICK', startup: 5, active: 5, recovery: 11, dmg: 26, hitstun: 21, blockstun: 12, push: 2.2, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 82, boxY: -20, boxH: 18 },
    '2MK': { name: 'Low Shin Slash (2MK)', anim: 'LOW_SPIN_KICK', startup: 8, active: 6, recovery: 15, dmg: 50, hitstun: 26, blockstun: 14, push: 3.5, vx: 2.5, vy: 0, dashSpeed: 3.0, type: 'low', cancel: true, reach: 96, boxY: -24, boxH: 20 },

    // 1. Floor Slam (Down + HP): Bounces enemy up from the floor for Air Combo
    '2HP': {
      name: 'Cyber Floor Slam (2HP)',
      anim: 'FLOOR_SLAM',
      startup: 11, active: 8, recovery: 20,
      dmg: 72, hitstun: 42, blockstun: 16, push: 3.0, vx: 1.5, vy: -11.5,
      launcher: true, groundBounce: true, hitsGrounded: true, isFloorSlam: true,
      type: 'mid', cancel: true, reach: 96, boxY: -65, boxH: 65
    },

    // 2. Heavy Leg Sweep (Down + HK): Knocks opponent down and forces QTE wakeup
    '2HK': {
      name: 'Heavy Leg Sweep (2HK)',
      anim: 'DRAGON_SWEEP',
      startup: 10, active: 8, recovery: 21,
      dmg: 78, hitstun: 36, blockstun: 18, push: 5.0, vx: 3.5, vy: -5.0,
      knockdown: true, triggersQTE: true, isHeavySweep: true, hitsGrounded: true, isOtgStrike: true,
      type: 'low', cancel: false, reach: 108, boxY: -24, boxH: 26
    },

    // 3. Fireball (Down, Left + Punch): Speed scales with LP (Slow), MP (Medium), HP (Fast)
    '214LP': {
      name: 'Light Plasma Fireball (214LP)',
      anim: 'FIREBALL_CAST',
      startup: 10, active: 14, recovery: 16,
      dmg: 55, hitstun: 28, blockstun: 14, push: 4.0, vx: 2.5, vy: 0,
      projectile: true, projSpeed: 5.2,
      type: 'mid', special: true, cancel: false, reach: 88, boxY: -68, boxH: 28
    },
    '214MP': {
      name: 'Medium Plasma Fireball (214MP)',
      anim: 'FIREBALL_CAST',
      startup: 11, active: 14, recovery: 17,
      dmg: 68, hitstun: 30, blockstun: 15, push: 4.5, vx: 3.0, vy: 0,
      projectile: true, projSpeed: 8.5,
      type: 'mid', special: true, cancel: false, reach: 88, boxY: -68, boxH: 28
    },
    '214HP': {
      name: 'Heavy Plasma Fireball (214HP)',
      anim: 'FIREBALL_CAST',
      startup: 12, active: 14, recovery: 18,
      dmg: 82, hitstun: 32, blockstun: 16, push: 5.5, vx: 3.5, vy: 0,
      projectile: true, projSpeed: 12.2,
      type: 'mid', special: true, cancel: false, reach: 88, boxY: -68, boxH: 28
    },
    '214P': {
      name: 'Plasma Fireball (214P)',
      anim: 'FIREBALL_CAST',
      startup: 11, active: 14, recovery: 17,
      dmg: 68, hitstun: 30, blockstun: 15, push: 4.5, vx: 3.0, vy: 0,
      projectile: true, projSpeed: 8.5,
      type: 'mid', special: true, cancel: false, reach: 88, boxY: -68, boxH: 28
    },

    // 4. Uppercut (Down, Right, Down, Right + Punch): Usable once, locks caster until landing on floor
    '236236P': {
      name: 'Rising Dragon Uppercut (236236P)',
      anim: 'RISING_UPPERCUT',
      startup: 6, active: 12, recovery: 24,
      dmg: 115, hitstun: 46, blockstun: 20, push: 4.5, vx: 3.0, vy: -11.5,
      selfLaunchVY: -9.8, selfForwardVX: 3.2,
      isUppercut: true, locksAirActions: true, knockdown: true, invuln: true,
      type: 'mid', special: true, cancel: false, reach: 102, boxY: -96, boxH: 58
    },
    '8_236236P': {
      name: 'Air Rising Dragon Uppercut (j.236236P)',
      anim: 'RISING_UPPERCUT',
      airMove: true,
      startup: 5, active: 12, recovery: 24,
      dmg: 110, hitstun: 46, blockstun: 20, push: 4.5, vx: 3.5, vy: -10.5,
      selfLaunchVY: -8.5, selfForwardVX: 3.0,
      isUppercut: true, locksAirActions: true, knockdown: true,
      type: 'overhead', special: true, cancel: false, reach: 102, boxY: -96, boxH: 58
    },

    // 5. Heavy Jump Crush (Jump + Down + HK): Causes 1.0s fixed knockdown on standing/crouching hit
    '82HK': {
      name: 'Meteor Dive Crush (j.2HK)',
      anim: 'JUMP_CRUSH_STOMP',
      airMove: true,
      startup: 6, active: 16, recovery: 14,
      dmg: 85, hitstun: 38, blockstun: 18, push: 4.0, vx: 4.5, vy: 9.5,
      isJumpCrush: true, fixedKnockdownSec: 1.0, hitsGrounded: true, isOtgStrike: true,
      type: 'overhead', cancel: false, reach: 96, boxY: -34, boxH: 38
    },

    // Standard Jumping Normals for Air Combo
    '8LP': { name: 'Air Knuckle Jab (j.LP)', anim: 'AIR_JAB', airMove: true, startup: 4, active: 7, recovery: 8, dmg: 26, hitstun: 26, blockstun: 14, push: 1.5, vx: 1.5, vy: -4.8, type: 'overhead', cancel: true, reach: 82, boxY: -58, boxH: 24 },
    '8MP': { name: 'Air Hook Cross (j.MP)', anim: 'AIR_CROSS', airMove: true, startup: 5, active: 8, recovery: 10, dmg: 44, hitstun: 28, blockstun: 16, push: 2.0, vx: 1.8, vy: -5.0, type: 'overhead', cancel: true, reach: 92, boxY: -66, boxH: 28 },
    '8HP': { name: 'Air Double Hammer (j.HP)', anim: 'AIR_HAMMER_SMASH', airMove: true, startup: 7, active: 9, recovery: 12, dmg: 68, hitstun: 34, blockstun: 18, push: 3.0, vx: 2.5, vy: -5.2, type: 'overhead', cancel: true, reach: 98, boxY: -52, boxH: 36 },
    '8LK': { name: 'Air Knee Check (j.LK)', anim: 'AIR_KNEE_DROP', airMove: true, startup: 4, active: 8, recovery: 8, dmg: 28, hitstun: 26, blockstun: 14, push: 1.5, vx: 1.5, vy: -4.8, type: 'overhead', cancel: true, reach: 84, boxY: -40, boxH: 26 },
    '8MK': { name: 'Air Side Blade Kick (j.MK)', anim: 'AIR_SIDE_BLADE', airMove: true, startup: 6, active: 8, recovery: 10, dmg: 48, hitstun: 29, blockstun: 16, push: 2.2, vx: 2.0, vy: -5.0, type: 'overhead', cancel: true, reach: 98, boxY: -50, boxH: 28 },
    '8HK': { name: 'Air Spinning Wheel Kick (j.HK)', anim: 'AIR_WHEEL_KICK', airMove: true, startup: 8, active: 9, recovery: 13, dmg: 74, hitstun: 36, blockstun: 19, push: 3.5, vx: 3.0, vy: -5.4, type: 'overhead', cancel: true, reach: 106, boxY: -46, boxH: 38 },

    // Universal Reversal, Throw, and Supers
    'REVERSAL': { name: 'GROUND REVERSAL: RAIJIN BURST', anim: 'RISING_UPPERCUT', startup: 3, active: 12, recovery: 16, dmg: 115, hitstun: 45, blockstun: 20, push: 12, vx: 11.5, vy: -8.5, knockdown: true, invuln: true, isReversal: true, type: 'mid', reach: 145, boxY: -90, boxH: 60 },
    'GRAB': { name: 'Cyber Izuna Drop', anim: 'GRAB_ATTEMPT', startup: 6, active: 4, recovery: 18, dmg: 120, hitstun: 40, blockstun: 0, push: 10, vx: 8, vy: -6, unblockable: true, isThrow: true, reach: 76, boxY: -72, boxH: 36 },

    'SUPER_1': { name: 'LV1: MEGA PLASMA CANNON', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 22, dmg: 170, hitstun: 44, blockstun: 18, push: 12, vx: 10, vy: -7.5, knockdown: true, dashSpeed: 7.5, type: 'mid', special: true, reach: 145, boxY: -78, boxH: 48 },
    'SUPER_2': { name: 'LV2: THUNDER GOD SPIRAL', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 24, dmg: 250, hitstun: 50, blockstun: 20, push: 14, vx: 10.5, vy: -11.8, launcher: true, invuln: true, dashSpeed: 9.5, type: 'mid', special: true, reach: 150, boxY: -92, boxH: 58 },
    'SUPER_3': { name: 'LV3: SHIN RAIJIN JUDGEMENT', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 28, dmg: 360, hitstun: 60, blockstun: 24, push: 16, vx: 13.5, vy: -13.0, knockdown: true, invuln: true, dashSpeed: 12, type: 'mid', special: true, reach: 165, boxY: -96, boxH: 66 }
  }
};