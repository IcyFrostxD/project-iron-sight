// characters/kira.js
window.CHARACTERS = window.CHARACTERS || {};

window.CHARACTERS.KIRA = {
  id: "KIRA",
  name: "KIRA",
  role: "Neon Rushdown (Speed)",
  color: "#ff0077",
  secondary: "#9900ff",
  hp: 950,
  walkSpeed: 2.4,
  dashSpeed: 10.8,
  jumpForce: 11.6,
  proportions: {
    torsoW: 30, torsoH: 42,
    upperArmL: 21, lowerArmL: 21,
    upperLegL: 25, lowerLegL: 25
  },
  throwName: "NEON HURRICANRANA",
  summary: `
    <b>Specials:</b> <code>236+P</code> Phantom Blink | <code>236+K</code> Spiral Kick | <code>214+K</code> Overhead Axe<br>
    <b>Jumping Attacks:</b> <code>Air LP/MP/HP</code> &amp; <code>Air LK/MK/HK</code> (Overhead / Air Combo <code>LK->MK</code>)<br>
    <b>Unique Throw (LP+LK):</b> Neon Hurricanrana Flip (120 DMG)<br>
    <b>Perfect Block (LT / Key H):</b> Requires 1+ Super Bar | <b>Drive Impact (LB / Key P):</b> 2-Hit Armor
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Quick Flick (5LP)', anim: 'JAB', limb: 'FRONT_ARM', startup: 4, active: 5, recovery: 9, dmg: 28, hitstun: 22, blockstun: 12, push: 2, vx: 1.5, vy: 0, type: 'high', cancel: true, reach: 78, boxY: -78, boxH: 20 },
    '5MP': { name: 'Neon Palm (5MP)', anim: 'STRAIGHT', limb: 'BACK_ARM', startup: 6, active: 6, recovery: 13, dmg: 50, hitstun: 26, blockstun: 14, push: 3.5, vx: 2.5, vy: 0, type: 'mid', cancel: true, reach: 88, boxY: -70, boxH: 24 },
    '5HP': { name: 'Whip Strike (5HP)', anim: 'HOOK', limb: 'BACK_ARM', startup: 9, active: 7, recovery: 17, dmg: 78, hitstun: 31, blockstun: 17, push: 5, vx: 4, vy: -2.5, type: 'mid', cancel: true, reach: 98, boxY: -74, boxH: 28 },
    '5LK': { name: 'Snap Low Kick (5LK)', anim: 'LOW_KICK', limb: 'FRONT_LEG', startup: 5, active: 5, recovery: 10, dmg: 32, hitstun: 22, blockstun: 12, push: 2.5, vx: 2, vy: 0, type: 'low', cancel: true, reach: 84, boxY: -32, boxH: 20 },
    '5MK': { name: 'Side Snap Kick (5MK)', anim: 'MID_KICK', limb: 'FRONT_LEG', startup: 7, active: 6, recovery: 14, dmg: 56, hitstun: 27, blockstun: 15, push: 4, vx: 3, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -58, boxH: 24 },
    '5HK': { name: 'Sky Heel Launcher (5HK)', anim: 'HIGH_KICK', limb: 'BACK_LEG', startup: 10, active: 7, recovery: 19, dmg: 85, hitstun: 38, blockstun: 17, push: 4, vx: 3.5, vy: -10.5, launcher: true, dashSpeed: 4, type: 'mid', cancel: true, reach: 104, boxY: -84, boxH: 38 },

    // Crouching Normals
    '2LP': { name: 'Crouch Poke (2LP)', anim: 'CROUCH_JAB', limb: 'FRONT_ARM', startup: 4, active: 5, recovery: 9, dmg: 24, hitstun: 20, blockstun: 11, push: 2, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 76, boxY: -45, boxH: 18 },
    '2MP': { name: 'Low Elbow (2MP)', anim: 'CROUCH_STRAIGHT', limb: 'BACK_ARM', startup: 6, active: 6, recovery: 13, dmg: 48, hitstun: 25, blockstun: 14, push: 3, vx: 2.5, vy: 0, type: 'mid', cancel: true, reach: 86, boxY: -50, boxH: 22 },
    '2HP': { name: 'Somersault Heel (2HP)', anim: 'UPPERCUT', limb: 'BACK_LEG', startup: 10, active: 8, recovery: 20, dmg: 76, hitstun: 38, blockstun: 16, push: 3.5, vx: 2.5, vy: -10.5, launcher: true, type: 'mid', cancel: true, reach: 92, boxY: -86, boxH: 44 },
    '2LK': { name: 'Ankle Tap (2LK)', anim: 'CROUCH_KICK', limb: 'FRONT_LEG', startup: 5, active: 5, recovery: 10, dmg: 28, hitstun: 21, blockstun: 11, push: 2, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 82, boxY: -20, boxH: 18 },
    '2MK': { name: 'Neon Slide (2MK)', anim: 'CROUCH_KICK', limb: 'FRONT_LEG', startup: 7, active: 7, recovery: 15, dmg: 52, hitstun: 26, blockstun: 14, push: 4, vx: 3.5, vy: 0, dashSpeed: 4.5, type: 'low', cancel: true, reach: 100, boxY: -22, boxH: 20 },
    '2HK': { name: 'Spinning Sweep (2HK)', anim: 'SWEEP', limb: 'BACK_LEG', startup: 10, active: 7, recovery: 20, dmg: 80, hitstun: 36, blockstun: 17, push: 5, vx: 4, vy: -6.5, knockdown: true, type: 'low', cancel: false, reach: 104, boxY: -22, boxH: 22 },

    // Jumping Normals (8LP, 8MP, 8HP, 8LK, 8MK, 8HK)
    '8LP': { name: 'Air Flick Jab (j.LP)', anim: 'AIR_JAB', limb: 'FRONT_ARM', airMove: true, startup: 4, active: 7, recovery: 9, dmg: 30, hitstun: 22, blockstun: 13, push: 2, vx: 2, vy: -2, type: 'overhead', cancel: true, reach: 76, boxY: -56, boxH: 24 },
    '8MP': { name: 'Air Neon Palm (j.MP)', anim: 'AIR_STRAIGHT', limb: 'BACK_ARM', airMove: true, startup: 5, active: 8, recovery: 11, dmg: 54, hitstun: 27, blockstun: 15, push: 3, vx: 3, vy: -3.5, type: 'overhead', cancel: true, reach: 88, boxY: -64, boxH: 26 },
    '8HP': { name: 'Air Whip Smash (j.HP)', anim: 'AIR_HEAVY_PUNCH', limb: 'BACK_ARM', airMove: true, startup: 7, active: 9, recovery: 13, dmg: 80, hitstun: 33, blockstun: 17, push: 4, vx: 4, vy: -4, type: 'overhead', cancel: false, reach: 96, boxY: -50, boxH: 34 },
    '8LK': { name: 'Air Knee Press (j.LK)', anim: 'AIR_LOW_KICK', limb: 'FRONT_LEG', airMove: true, startup: 4, active: 8, recovery: 9, dmg: 34, hitstun: 23, blockstun: 13, push: 2.5, vx: 2, vy: -2, type: 'overhead', cancel: true, reach: 78, boxY: -38, boxH: 26 },
    '8MK': { name: 'Air Side Snap (j.MK)', anim: 'AIR_MID_KICK', limb: 'FRONT_LEG', airMove: true, startup: 6, active: 9, recovery: 11, dmg: 58, hitstun: 28, blockstun: 15, push: 3.5, vx: 3.5, vy: -3.5, type: 'overhead', cancel: true, reach: 96, boxY: -48, boxH: 28 },
    '8HK': { name: 'Air Scissor Heel (j.HK)', anim: 'AIR_HEAVY_KICK', limb: 'BACK_LEG', airMove: true, startup: 8, active: 10, recovery: 14, dmg: 86, hitstun: 36, blockstun: 18, push: 5, vx: 5, vy: -5, type: 'overhead', cancel: false, reach: 104, boxY: -44, boxH: 38 },

    // Ground & Air Target Combos
    '8LK_MK': { name: 'Air Double Snap (j.LK->j.MK)', anim: 'AIR_MID_KICK', limb: 'FRONT_LEG', airMove: true, startup: 5, active: 8, recovery: 11, dmg: 52, hitstun: 30, blockstun: 16, push: 4, vx: 4, vy: -5, type: 'overhead', cancel: false, reach: 96, boxY: -48, boxH: 28 },
    '5LK_MK': { name: 'Double Kick (LK->MK)', anim: 'MID_KICK', limb: 'FRONT_LEG', startup: 6, active: 6, recovery: 13, dmg: 45, hitstun: 26, blockstun: 14, push: 3, vx: 2.5, vy: 0, dashSpeed: 3.5, type: 'mid', cancel: true, reach: 94, boxY: -56, boxH: 24 },
    '5LK_MK_HK': { name: 'Neon Barrage (LK->MK->HK)', anim: 'HIGH_KICK', limb: 'BACK_LEG', startup: 8, active: 8, recovery: 19, dmg: 82, hitstun: 36, blockstun: 16, push: 8.5, vx: 8.5, vy: -6.8, knockdown: true, type: 'mid', cancel: true, reach: 106, boxY: -70, boxH: 32 },

    // Specials
    '236P': { name: 'Phantom Blink (236P)', anim: 'HOOK', limb: 'BACK_ARM', startup: 8, active: 8, recovery: 16, dmg: 75, hitstun: 30, blockstun: 15, push: 5, vx: 4.5, vy: -4, dashSpeed: 9, type: 'mid', special: true, reach: 100, boxY: -68, boxH: 28 },
    '236K': { name: 'Spiral Pinwheel (236K)', anim: 'SPIN_KICK', limb: 'BACK_LEG', startup: 9, active: 11, recovery: 20, dmg: 105, hitstun: 40, blockstun: 17, push: 7, vx: 6.5, vy: -9.5, launcher: true, dashSpeed: 6.5, type: 'mid', special: true, reach: 106, boxY: -78, boxH: 42 },
    '214K': { name: 'Crescent Axe Kick (214K)', anim: 'AXE_KICK', limb: 'FRONT_LEG', startup: 14, active: 8, recovery: 19, dmg: 95, hitstun: 36, blockstun: 17, push: 6, vx: 6.5, vy: -6, knockdown: true, dashSpeed: 4.5, type: 'overhead', special: true, reach: 98, boxY: -82, boxH: 38 },

    'DRIVE_IMPACT': { name: 'DRIVE IMPACT', anim: 'DRIVE_IMPACT', limb: 'BACK_LEG', startup: 18, active: 8, recovery: 22, dmg: 95, hitstun: 48, blockstun: 22, push: 11, vx: 9, vy: -6, dashSpeed: 5, type: 'mid', isDriveImpact: true, reach: 106, boxY: -74, boxH: 46 },
    'GRAB': { name: 'Neon Hurricanrana', anim: 'GRAB_ATTEMPT', limb: 'BOTH_ARMS', startup: 6, active: 4, recovery: 18, dmg: 120, hitstun: 40, blockstun: 0, push: 10, vx: 9, vy: -6.8, unblockable: true, isThrow: true, reach: 74, boxY: -68, boxH: 34 },

    // Supers
    'SUPER_1': { name: 'LV1: NEON MIRAGE RUSH', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 20, dmg: 165, hitstun: 42, blockstun: 18, push: 11, vx: 9.5, vy: -7, knockdown: true, dashSpeed: 10.5, type: 'mid', special: true, reach: 142, boxY: -72, boxH: 44 },
    'SUPER_2': { name: 'LV2: CRIMSON TEMPEST', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 23, dmg: 245, hitstun: 48, blockstun: 20, push: 13, vx: 10, vy: -11.8, launcher: true, invuln: true, dashSpeed: 10, type: 'mid', special: true, reach: 148, boxY: -88, boxH: 56 },
    'SUPER_3': { name: 'LV3: FENG SHUI OVERDRIVE', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 26, dmg: 350, hitstun: 60, blockstun: 24, push: 15, vx: 13, vy: -13.0, knockdown: true, invuln: true, dashSpeed: 13, type: 'mid', special: true, reach: 162, boxY: -92, boxH: 64 }
  }
};