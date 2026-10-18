// characters/titan.js
window.CHARACTERS = window.CHARACTERS || {};

window.CHARACTERS.TITAN = {
  id: "TITAN",
  name: "TITAN",
  role: "Iron Brawler (Power & Armor)",
  color: "#ff8800",
  secondary: "#ff2200",
  hp: 1150,
  walkSpeed: 1.75,
  dashSpeed: 8.4,
  jumpForce: 10.6,
  proportions: {
    torsoW: 42, torsoH: 48,
    upperArmL: 25, lowerArmL: 25,
    upperLegL: 25, lowerLegL: 25
  },
  throwName: "ATLAS BACKBREAKER",
  summary: `
    <b>Specials:</b> <code>236+P</code> Gladius Charge | <code>214+P</code> Command Swing | <code>214+K</code> Quake Stomp<br>
    <b>Jumping Attacks:</b> <code>Air LP/MP/HP</code> &amp; <code>Air LK/MK/HK</code> (Heavy Overhead Smashes)<br>
    <b>Unique Throw (LP+LK):</b> Atlas Backbreaker Slam (120 DMG)<br>
    <b>Perfect Block (LT / Key H):</b> Requires 1+ Super Bar | <b>Drive Impact (LB / Key P):</b> 2-Hit Armor
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Heavy Jab (5LP)', anim: 'JAB', limb: 'FRONT_ARM', startup: 6, active: 6, recovery: 11, dmg: 40, hitstun: 24, blockstun: 14, push: 3, vx: 2, vy: 0, type: 'high', cancel: true, reach: 86, boxY: -84, boxH: 24 },
    '5MP': { name: 'Spartan Hook (5MP)', anim: 'STRAIGHT', limb: 'BACK_ARM', startup: 9, active: 7, recovery: 15, dmg: 65, hitstun: 28, blockstun: 16, push: 4.5, vx: 3.5, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -76, boxH: 28 },
    '5HP': { name: 'Giga Lariat (5HP)', anim: 'HOOK', limb: 'BACK_ARM', startup: 12, active: 8, recovery: 21, dmg: 105, hitstun: 36, blockstun: 19, push: 8, vx: 6.5, vy: -4, armor: true, type: 'mid', cancel: true, reach: 108, boxY: -80, boxH: 34 },
    '5LK': { name: 'Low Stomp (5LK)', anim: 'LOW_KICK', limb: 'FRONT_LEG', startup: 7, active: 6, recovery: 12, dmg: 42, hitstun: 24, blockstun: 13, push: 3, vx: 2, vy: 0, type: 'low', cancel: true, reach: 86, boxY: -34, boxH: 24 },
    '5MK': { name: 'Iron Knee (5MK)', anim: 'MID_KICK', limb: 'FRONT_LEG', startup: 9, active: 7, recovery: 16, dmg: 70, hitstun: 29, blockstun: 16, push: 5, vx: 3.5, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -60, boxH: 28 },
    '5HK': { name: 'Spartan Boot (5HK)', anim: 'HIGH_KICK', limb: 'BACK_LEG', startup: 13, active: 8, recovery: 22, dmg: 105, hitstun: 38, blockstun: 19, push: 9, vx: 9, vy: -7, knockdown: true, armor: true, type: 'mid', cancel: true, reach: 110, boxY: -74, boxH: 34 },

    // Crouching Normals
    '2LP': { name: 'Crouch Fist (2LP)', anim: 'CROUCH_JAB', limb: 'FRONT_ARM', startup: 6, active: 6, recovery: 11, dmg: 35, hitstun: 22, blockstun: 12, push: 2.5, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 82, boxY: -48, boxH: 22 },
    '2MP': { name: 'Gut Hammer (2MP)', anim: 'CROUCH_STRAIGHT', limb: 'BACK_ARM', startup: 8, active: 7, recovery: 15, dmg: 62, hitstun: 27, blockstun: 15, push: 4, vx: 3, vy: 0, type: 'mid', cancel: true, reach: 92, boxY: -54, boxH: 26 },
    '2HP': { name: 'Volcano Upper (2HP)', anim: 'UPPERCUT', limb: 'BACK_ARM', startup: 12, active: 8, recovery: 22, dmg: 95, hitstun: 40, blockstun: 18, push: 4, vx: 3, vy: -10.8, launcher: true, armor: true, type: 'mid', cancel: true, reach: 96, boxY: -94, boxH: 48 },
    '2LK': { name: 'Ankle Crusher (2LK)', anim: 'CROUCH_KICK', limb: 'FRONT_LEG', startup: 6, active: 6, recovery: 12, dmg: 38, hitstun: 22, blockstun: 12, push: 2.5, vx: 2, vy: 0, type: 'low', cancel: true, reach: 84, boxY: -24, boxH: 20 },
    '2MK': { name: 'Heavy Low Kick (2MK)', anim: 'CROUCH_KICK', limb: 'FRONT_LEG', startup: 9, active: 7, recovery: 17, dmg: 65, hitstun: 28, blockstun: 15, push: 4.5, vx: 3.5, vy: 0, type: 'low', cancel: true, reach: 100, boxY: -26, boxH: 22 },
    '2HK': { name: 'Bulldozer Sweep (2HK)', anim: 'SWEEP', limb: 'BACK_LEG', startup: 13, active: 8, recovery: 23, dmg: 98, hitstun: 38, blockstun: 19, push: 7, vx: 5, vy: -7, knockdown: true, type: 'low', cancel: false, reach: 108, boxY: -26, boxH: 26 },

    // Jumping Normals (8LP, 8MP, 8HP, 8LK, 8MK, 8HK)
    '8LP': { name: 'Air Iron Knuckle (j.LP)', anim: 'AIR_JAB', limb: 'FRONT_ARM', airMove: true, startup: 5, active: 8, recovery: 10, dmg: 42, hitstun: 25, blockstun: 15, push: 3, vx: 2.5, vy: -2, type: 'overhead', cancel: true, reach: 84, boxY: -62, boxH: 28 },
    '8MP': { name: 'Air Cross Smash (j.MP)', anim: 'AIR_STRAIGHT', limb: 'BACK_ARM', airMove: true, startup: 7, active: 8, recovery: 12, dmg: 68, hitstun: 30, blockstun: 17, push: 4, vx: 3.5, vy: -3.5, type: 'overhead', cancel: true, reach: 94, boxY: -70, boxH: 30 },
    '8HP': { name: 'Air Hammer Drop (j.HP)', anim: 'AIR_HEAVY_PUNCH', limb: 'BACK_ARM', airMove: true, startup: 9, active: 10, recovery: 15, dmg: 102, hitstun: 38, blockstun: 20, push: 6, vx: 5.5, vy: -5, type: 'overhead', cancel: false, reach: 104, boxY: -54, boxH: 42 },
    '8LK': { name: 'Air Knee Stamp (j.LK)', anim: 'AIR_LOW_KICK', limb: 'FRONT_LEG', airMove: true, startup: 6, active: 8, recovery: 10, dmg: 44, hitstun: 25, blockstun: 14, push: 3, vx: 2.5, vy: -2, type: 'overhead', cancel: true, reach: 84, boxY: -42, boxH: 30 },
    '8MK': { name: 'Air Spartan Kick (j.MK)', anim: 'AIR_MID_KICK', limb: 'FRONT_LEG', airMove: true, startup: 8, active: 9, recovery: 13, dmg: 72, hitstun: 31, blockstun: 17, push: 4.5, vx: 4, vy: -3.5, type: 'overhead', cancel: false, reach: 100, boxY: -52, boxH: 30 },
    '8HK': { name: 'Air Goliath Boot (j.HK)', anim: 'AIR_HEAVY_KICK', limb: 'BACK_LEG', airMove: true, startup: 10, active: 10, recovery: 16, dmg: 105, hitstun: 40, blockstun: 20, push: 6.5, vx: 6, vy: -6, type: 'overhead', cancel: false, reach: 110, boxY: -48, boxH: 40 },

    // Ground & Air Target Combos
    '8MP_HP': { name: 'Air Meteor Double (j.MP->j.HP)', anim: 'AIR_HEAVY_PUNCH', limb: 'BACK_ARM', airMove: true, startup: 7, active: 9, recovery: 14, dmg: 90, hitstun: 38, blockstun: 19, push: 6, vx: 6, vy: -6, knockdown: true, type: 'overhead', cancel: false, reach: 104, boxY: -54, boxH: 42 },
    '5MP_HP': { name: 'Atlas Sky Launcher (MP->HP)', anim: 'UPPERCUT', limb: 'BACK_ARM', startup: 9, active: 8, recovery: 22, dmg: 98, hitstun: 42, blockstun: 18, push: 4, vx: 3.5, vy: -11.0, launcher: true, armor: true, type: 'mid', cancel: true, reach: 102, boxY: -90, boxH: 46 },

    // Specials
    '236P': { name: 'Gladius Charge (236P)', anim: 'HOOK', limb: 'BACK_ARM', startup: 11, active: 10, recovery: 20, dmg: 125, hitstun: 40, blockstun: 19, push: 11, vx: 11, vy: -6.5, knockdown: true, armor: true, dashSpeed: 7.5, type: 'mid', special: true, reach: 112, boxY: -78, boxH: 38 },
    '214P': { name: 'Giant Command Swing (214P)', anim: 'HOOK', limb: 'BOTH_ARMS', startup: 8, active: 7, recovery: 22, dmg: 155, hitstun: 44, blockstun: 0, push: 13, vx: 12, vy: -8.5, unblockable: true, knockdown: true, dashSpeed: 4, type: 'grab', special: true, reach: 96, boxY: -78, boxH: 40 },
    '214K': { name: 'Tectonic Stomp (214K)', anim: 'AXE_KICK', limb: 'FRONT_LEG', startup: 12, active: 9, recovery: 21, dmg: 110, hitstun: 38, blockstun: 17, push: 6, vx: 5, vy: -9.5, launcher: true, dashSpeed: 4.5, type: 'low', special: true, reach: 106, boxY: -36, boxH: 34 },

    'DRIVE_IMPACT': { name: 'DRIVE IMPACT', anim: 'DRIVE_IMPACT', limb: 'BACK_ARM', startup: 18, active: 8, recovery: 22, dmg: 95, hitstun: 48, blockstun: 22, push: 11, vx: 9, vy: -6, dashSpeed: 4.5, type: 'mid', isDriveImpact: true, reach: 112, boxY: -80, boxH: 52 },
    'GRAB': { name: 'Atlas Backbreaker', anim: 'GRAB_ATTEMPT', limb: 'BOTH_ARMS', startup: 7, active: 4, recovery: 19, dmg: 120, hitstun: 42, blockstun: 0, push: 11, vx: 9.5, vy: -7, unblockable: true, isThrow: true, reach: 78, boxY: -74, boxH: 38 },

    // Supers
    'SUPER_1': { name: 'LV1: GIGA KNUCKLE BUSTER', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 22, dmg: 180, hitstun: 44, blockstun: 20, push: 13, vx: 12, vy: -7.5, knockdown: true, armor: true, dashSpeed: 8.5, type: 'mid', special: true, reach: 145, boxY: -80, boxH: 48 },
    'SUPER_2': { name: 'LV2: TECTONIC CATACLYSM', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 24, dmg: 260, hitstun: 50, blockstun: 22, push: 14, vx: 9, vy: -12.0, launcher: true, armor: true, invuln: true, dashSpeed: 8, type: 'low', special: true, reach: 152, boxY: -65, boxH: 60 },
    'SUPER_3': { name: 'LV3: CALAMITY KINGDRIVER', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 28, dmg: 380, hitstun: 60, blockstun: 0, push: 17, vx: 14, vy: -13.0, unblockable: true, knockdown: true, invuln: true, dashSpeed: 10, type: 'grab', special: true, reach: 160, boxY: -94, boxH: 68 }
  }
};