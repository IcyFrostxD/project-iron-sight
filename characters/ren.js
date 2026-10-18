// characters/ren.js
window.CHARACTERS = window.CHARACTERS || {};

window.CHARACTERS.REN = {
  id: "REN",
  name: "REN",
  role: "Cyber-Mishima (Balanced)",
  color: "#00f0ff",
  secondary: "#0055ff",
  hp: 1000,
  walkSpeed: 2.1,
  dashSpeed: 9.5,
  jumpForce: 11.2,
  proportions: {
    torsoW: 34, torsoH: 44,
    upperArmL: 22, lowerArmL: 22,
    upperLegL: 24, lowerLegL: 24
  },
  throwName: "CYBER IZUNA DROP",
  summary: `
    <b>Specials:</b> <code>236+P</code> Plasma Wave | <code>623+P</code> Electric Upper | <code>214+K</code> Spin Kick<br>
    <b>Jumping Attacks:</b> <code>Air LP/MP/HP</code> &amp; <code>Air LK/MK/HK</code> (Overhead / Air Combo <code>LP->MP</code>)<br>
    <b>Unique Throw (LP+LK):</b> Cyber Izuna Drop (120 DMG)<br>
    <b>Perfect Block (LT / Key H):</b> Requires 1+ Super Bar | <b>Drive Impact (LB / Key P):</b> 2-Hit Armor
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Light Jab (5LP)', anim: 'JAB', limb: 'FRONT_ARM', startup: 5, active: 5, recovery: 10, dmg: 30, hitstun: 22, blockstun: 12, push: 2.5, vx: 1.5, vy: 0, type: 'high', cancel: true, reach: 82, boxY: -82, boxH: 22 },
    '5MP': { name: 'Body Straight (5MP)', anim: 'STRAIGHT', limb: 'BACK_ARM', startup: 7, active: 6, recovery: 14, dmg: 55, hitstun: 26, blockstun: 15, push: 4, vx: 3, vy: 0, type: 'mid', cancel: true, reach: 92, boxY: -74, boxH: 26 },
    '5HP': { name: 'Heavy Hook (5HP)', anim: 'HOOK', limb: 'BACK_ARM', startup: 10, active: 7, recovery: 19, dmg: 85, hitstun: 32, blockstun: 18, push: 6, vx: 4.5, vy: -3, type: 'mid', cancel: true, reach: 102, boxY: -78, boxH: 30 },
    '5LK': { name: 'Low Shin Kick (5LK)', anim: 'LOW_KICK', limb: 'FRONT_LEG', startup: 6, active: 5, recovery: 11, dmg: 35, hitstun: 22, blockstun: 12, push: 3, vx: 2, vy: 0, type: 'low', cancel: true, reach: 86, boxY: -34, boxH: 22 },
    '5MK': { name: 'Side Thrust Kick (5MK)', anim: 'MID_KICK', limb: 'FRONT_LEG', startup: 8, active: 6, recovery: 15, dmg: 60, hitstun: 27, blockstun: 15, push: 4.5, vx: 3.5, vy: 0, type: 'mid', cancel: true, reach: 98, boxY: -58, boxH: 26 },
    '5HK': { name: 'High Roundhouse (5HK)', anim: 'HIGH_KICK', limb: 'BACK_LEG', startup: 12, active: 7, recovery: 21, dmg: 90, hitstun: 36, blockstun: 18, push: 5, vx: 3.5, vy: -9.8, launcher: true, type: 'mid', cancel: true, reach: 106, boxY: -80, boxH: 32 },

    // Crouching Normals
    '2LP': { name: 'Crouch Jab (2LP)', anim: 'CROUCH_JAB', limb: 'FRONT_ARM', startup: 5, active: 5, recovery: 10, dmg: 25, hitstun: 20, blockstun: 11, push: 2, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 78, boxY: -48, boxH: 20 },
    '2MP': { name: 'Crouch Straight (2MP)', anim: 'CROUCH_STRAIGHT', limb: 'BACK_ARM', startup: 7, active: 6, recovery: 14, dmg: 50, hitstun: 25, blockstun: 14, push: 3.5, vx: 2.5, vy: 0, type: 'mid', cancel: true, reach: 88, boxY: -52, boxH: 24 },
    '2HP': { name: 'Rising Launcher (2HP)', anim: 'UPPERCUT', limb: 'BACK_ARM', startup: 11, active: 8, recovery: 21, dmg: 80, hitstun: 38, blockstun: 16, push: 3.5, vx: 2.5, vy: -10.5, launcher: true, type: 'mid', cancel: true, reach: 90, boxY: -92, boxH: 46 },
    '2LK': { name: 'Crouch Poke Kick (2LK)', anim: 'CROUCH_KICK', limb: 'FRONT_LEG', startup: 5, active: 5, recovery: 11, dmg: 30, hitstun: 21, blockstun: 12, push: 2.5, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 82, boxY: -22, boxH: 18 },
    '2MK': { name: 'Low Forward Kick (2MK)', anim: 'CROUCH_KICK', limb: 'FRONT_LEG', startup: 8, active: 6, recovery: 15, dmg: 52, hitstun: 26, blockstun: 14, push: 4, vx: 3, vy: 0, type: 'low', cancel: true, reach: 98, boxY: -24, boxH: 20 },
    '2HK': { name: 'Sweep Kick (2HK)', anim: 'SWEEP', limb: 'BACK_LEG', startup: 11, active: 7, recovery: 22, dmg: 85, hitstun: 36, blockstun: 18, push: 6, vx: 4, vy: -6.5, knockdown: true, type: 'low', cancel: false, reach: 106, boxY: -24, boxH: 24 },

    // Jumping Normals (8LP, 8MP, 8HP, 8LK, 8MK, 8HK)
    '8LP': { name: 'Air Cyber Jab (j.LP)', anim: 'AIR_JAB', limb: 'FRONT_ARM', airMove: true, startup: 4, active: 8, recovery: 10, dmg: 35, hitstun: 24, blockstun: 14, push: 2.5, vx: 2, vy: -2, type: 'overhead', cancel: true, reach: 78, boxY: -58, boxH: 26 },
    '8MP': { name: 'Air Straight (j.MP)', anim: 'AIR_STRAIGHT', limb: 'BACK_ARM', airMove: true, startup: 6, active: 8, recovery: 12, dmg: 60, hitstun: 28, blockstun: 16, push: 3.5, vx: 3.5, vy: -3.5, type: 'overhead', cancel: true, reach: 90, boxY: -66, boxH: 28 },
    '8HP': { name: 'Air Meteor Hook (j.HP)', anim: 'AIR_HEAVY_PUNCH', limb: 'BACK_ARM', airMove: true, startup: 8, active: 9, recovery: 14, dmg: 85, hitstun: 34, blockstun: 18, push: 4.5, vx: 4.5, vy: -4, type: 'overhead', cancel: false, reach: 96, boxY: -52, boxH: 36 },
    '8LK': { name: 'Air Knee Drop (j.LK)', anim: 'AIR_LOW_KICK', limb: 'FRONT_LEG', airMove: true, startup: 5, active: 9, recovery: 10, dmg: 38, hitstun: 24, blockstun: 14, push: 2.5, vx: 2, vy: -2, type: 'overhead', cancel: true, reach: 80, boxY: -40, boxH: 28 },
    '8MK': { name: 'Air Flying Thrust (j.MK)', anim: 'AIR_MID_KICK', limb: 'FRONT_LEG', airMove: true, startup: 7, active: 9, recovery: 12, dmg: 62, hitstun: 29, blockstun: 16, push: 4, vx: 3.5, vy: -3, type: 'overhead', cancel: false, reach: 98, boxY: -50, boxH: 28 },
    '8HK': { name: 'Air Raijin Dive Kick (j.HK)', anim: 'AIR_HEAVY_KICK', limb: 'BACK_LEG', airMove: true, startup: 9, active: 10, recovery: 15, dmg: 90, hitstun: 36, blockstun: 19, push: 5, vx: 5, vy: -5, type: 'overhead', cancel: false, reach: 106, boxY: -46, boxH: 38 },

    // Ground & Air Target Combos
    '8LP_MP': { name: 'Air Twin Fist (j.LP->j.MP)', anim: 'AIR_STRAIGHT', limb: 'BACK_ARM', airMove: true, startup: 5, active: 8, recovery: 12, dmg: 55, hitstun: 30, blockstun: 16, push: 4, vx: 4, vy: -5, type: 'overhead', cancel: false, reach: 92, boxY: -64, boxH: 30 },
    '5LP_MP': { name: 'Twin Strike (LP->MP)', anim: 'STRAIGHT', limb: 'BACK_ARM', startup: 6, active: 6, recovery: 14, dmg: 45, hitstun: 26, blockstun: 14, push: 3, vx: 2.5, vy: 0, type: 'mid', cancel: true, reach: 90, boxY: -72, boxH: 26 },
    '5LP_MP_HP': { name: 'Flash Finisher (LP->MP->HP)', anim: 'HOOK', limb: 'FRONT_ARM', startup: 9, active: 8, recovery: 20, dmg: 85, hitstun: 36, blockstun: 17, push: 9, vx: 8.5, vy: -7, knockdown: true, type: 'mid', cancel: true, reach: 104, boxY: -76, boxH: 32 },

    // Specials
    '236P': { name: 'Plasma Wave (236P)', anim: 'PROJECTILE', limb: 'BOTH_ARMS', startup: 11, active: 20, recovery: 18, dmg: 70, hitstun: 30, blockstun: 15, push: 5, vx: 3.5, vy: -3, projectile: true, type: 'mid', special: true, reach: 90, boxY: -68, boxH: 28 },
    '623P': { name: 'Electric God Fist (623P)', anim: 'UPPERCUT', limb: 'BACK_ARM', startup: 8, active: 9, recovery: 22, dmg: 110, hitstun: 44, blockstun: 18, push: 5, vx: 4, vy: -11.2, launcher: true, invuln: true, dashSpeed: 5.5, type: 'mid', special: true, reach: 100, boxY: -94, boxH: 48 },
    '214K': { name: 'Demon Hurricane (214K)', anim: 'SPIN_KICK', limb: 'BACK_LEG', startup: 10, active: 11, recovery: 20, dmg: 95, hitstun: 36, blockstun: 16, push: 8, vx: 9, vy: -6, knockdown: true, dashSpeed: 6.5, type: 'mid', special: true, reach: 104, boxY: -68, boxH: 32 },

    'DRIVE_IMPACT': { name: 'DRIVE IMPACT', anim: 'DRIVE_IMPACT', limb: 'BACK_ARM', startup: 18, active: 8, recovery: 22, dmg: 95, hitstun: 48, blockstun: 22, push: 11, vx: 9, vy: -6, dashSpeed: 4.5, type: 'mid', isDriveImpact: true, reach: 108, boxY: -78, boxH: 48 },
    'GRAB': { name: 'Cyber Izuna Drop', anim: 'GRAB_ATTEMPT', limb: 'BOTH_ARMS', startup: 6, active: 4, recovery: 18, dmg: 120, hitstun: 40, blockstun: 0, push: 10, vx: 8, vy: -6, unblockable: true, isThrow: true, reach: 74, boxY: -72, boxH: 36 },

    // Supers
    'SUPER_1': { name: 'LV1: MEGA PLASMA CANNON', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 22, dmg: 170, hitstun: 44, blockstun: 18, push: 12, vx: 10, vy: -7.5, knockdown: true, dashSpeed: 7.5, type: 'mid', special: true, reach: 145, boxY: -78, boxH: 48 },
    'SUPER_2': { name: 'LV2: THUNDER GOD SPIRAL', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 24, dmg: 250, hitstun: 50, blockstun: 20, push: 14, vx: 10.5, vy: -11.8, launcher: true, invuln: true, dashSpeed: 9.5, type: 'mid', special: true, reach: 150, boxY: -92, boxH: 58 },
    'SUPER_3': { name: 'LV3: SHIN RAIJIN JUDGEMENT', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 28, dmg: 360, hitstun: 60, blockstun: 24, push: 16, vx: 13.5, vy: -13.0, knockdown: true, invuln: true, dashSpeed: 12, type: 'mid', special: true, reach: 165, boxY: -96, boxH: 66 }
  }
};