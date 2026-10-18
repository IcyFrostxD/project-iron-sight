// characters/titan.js
window.CHARACTERS = window.CHARACTERS || {};

window.CHARACTERS.TITAN = {
  id: "TITAN",
  name: "TITAN",
  role: "Iron Brawler (3.0s Air Combo / 1.15x Heavy Air DMG)",
  color: "#ff8800",
  secondary: "#ff2200",
  hp: 1150,
  walkSpeed: 1.75,
  dashSpeed: 8.5,
  jumpForce: 11.0,
  proportions: {
    torsoW: 42, torsoH: 48,
    upperArmL: 25, lowerArmL: 25,
    upperLegL: 25, lowerLegL: 25
  },
  throwName: "ATLAS BACKBREAKER",
  summary: `
    <b>Air Combo Window:</b> 3.0s (1.15x Massive Air Damage)<br>
    <b>Launchers (Scoops Standing &amp; Downed):</b> <code>2HP</code> (Volcano Upper) | <code>623+P</code> (Atlas Sky Scoop)<br>
    <b>Grounded OTG Attacks:</b> <code>2HK</code> (Bulldozer Sweep) | <code>214+K</code> (Tectonic OTG Quake)<br>
    <b>Ground Reversal (While Downed, Costs 2 Bars):</b> Press <code>LB</code> / <kbd>P</kbd>
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Heavy Jab (5LP)', anim: 'JAB', startup: 6, active: 6, recovery: 11, dmg: 40, hitstun: 24, blockstun: 14, push: 3, vx: 2, vy: 0, type: 'high', cancel: true, reach: 86, boxY: -84, boxH: 24 },
    '5MP': { name: 'Spartan Hook (5MP)', anim: 'STRAIGHT', startup: 8, active: 7, recovery: 15, dmg: 65, hitstun: 28, blockstun: 16, push: 4.5, vx: 3.5, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -76, boxH: 28 },
    '5HP': { name: 'Giga Lariat (5HP)', anim: 'HOOK', startup: 11, active: 8, recovery: 20, dmg: 105, hitstun: 36, blockstun: 19, push: 8, vx: 6.5, vy: -4, armor: true, type: 'mid', cancel: true, reach: 108, boxY: -80, boxH: 34 },
    '5LK': { name: 'Low Stomp (5LK)', anim: 'LOW_KICK', startup: 7, active: 6, recovery: 12, dmg: 42, hitstun: 24, blockstun: 13, push: 3, vx: 2, vy: 0, type: 'low', cancel: true, reach: 86, boxY: -34, boxH: 24 },
    '5MK': { name: 'Iron Knee (5MK)', anim: 'MID_KICK', startup: 9, active: 7, recovery: 16, dmg: 70, hitstun: 29, blockstun: 16, push: 5, vx: 3.5, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -60, boxH: 28 },
    '5HK': { name: 'Spartan Launcher Boot (5HK)', anim: 'HIGH_KICK', startup: 12, active: 8, recovery: 21, dmg: 95, hitstun: 38, blockstun: 19, push: 5, vx: 3.0, vy: -11.2, launcher: true, armor: true, type: 'mid', cancel: true, reach: 110, boxY: -74, boxH: 34 },

    // Launchers (Scoops Standing & Downed)
    '2HP': { name: 'Volcano Upper Launcher (2HP)', anim: 'UPPERCUT', startup: 11, active: 8, recovery: 21, dmg: 85, hitstun: 42, blockstun: 18, push: 3.5, vx: 2.5, vy: -11.8, launcher: true, hitsGrounded: true, armor: true, type: 'mid', cancel: true, reach: 98, boxY: -94, boxH: 54 },
    '623P': { name: 'Atlas Sky Scoop (623P)', anim: 'UPPERCUT', startup: 9, active: 9, recovery: 22, dmg: 110, hitstun: 46, blockstun: 19, push: 4, vx: 2.8, vy: -12.4, launcher: true, hitsGrounded: true, armor: true, dashSpeed: 5, type: 'mid', special: true, reach: 104, boxY: -96, boxH: 56 },

    // Grounded OTG Attacks
    '2HK': { name: 'OTG Bulldozer Sweep (2HK)', anim: 'SWEEP', startup: 12, active: 8, recovery: 22, dmg: 90, hitstun: 36, blockstun: 19, push: 6, vx: 4.5, vy: -5, knockdown: true, hitsGrounded: true, isOtgStrike: true, type: 'low', cancel: false, reach: 108, boxY: -26, boxH: 28 },
    '214K': { name: 'OTG Tectonic Quake Stomp (214K)', anim: 'AXE_KICK', startup: 12, active: 9, recovery: 19, dmg: 105, hitstun: 38, blockstun: 17, push: 5, vx: 3.5, vy: 0, hitsGrounded: true, isOtgStrike: true, dashSpeed: 4.5, type: 'overhead', special: true, reach: 106, boxY: -38, boxH: 38 },

    // Jumping Air Combo Attacks
    '8LP': { name: 'Air Iron Knuckle (j.LP)', anim: 'AIR_JAB', airMove: true, startup: 5, active: 8, recovery: 9, dmg: 38, hitstun: 26, blockstun: 15, push: 2.2, vx: 2.0, vy: -5.2, type: 'overhead', cancel: true, reach: 84, boxY: -62, boxH: 28 },
    '8MP': { name: 'Air Cross Smash (j.MP)', anim: 'AIR_STRAIGHT', airMove: true, startup: 6, active: 8, recovery: 11, dmg: 58, hitstun: 30, blockstun: 17, push: 2.8, vx: 2.4, vy: -5.4, type: 'overhead', cancel: true, reach: 94, boxY: -70, boxH: 30 },
    '8HP': { name: 'Air Hammer Drop (j.HP)', anim: 'AIR_HEAVY_PUNCH', airMove: true, startup: 8, active: 10, recovery: 13, dmg: 88, hitstun: 38, blockstun: 20, push: 4, vx: 3.5, vy: -5.8, type: 'overhead', cancel: true, reach: 104, boxY: -54, boxH: 42 },
    '8LK': { name: 'Air Knee Stamp (j.LK)', anim: 'AIR_LOW_KICK', airMove: true, startup: 5, active: 8, recovery: 9, dmg: 40, hitstun: 26, blockstun: 14, push: 2.2, vx: 2.0, vy: -5.2, type: 'overhead', cancel: true, reach: 84, boxY: -42, boxH: 30 },
    '8MK': { name: 'Air Spartan Kick (j.MK)', anim: 'AIR_MID_KICK', airMove: true, startup: 7, active: 9, recovery: 11, dmg: 64, hitstun: 31, blockstun: 17, push: 3, vx: 2.6, vy: -5.4, type: 'overhead', cancel: true, reach: 100, boxY: -52, boxH: 30 },
    '8HK': { name: 'Air Goliath Boot (j.HK)', anim: 'AIR_HEAVY_KICK', airMove: true, startup: 9, active: 10, recovery: 14, dmg: 92, hitstun: 40, blockstun: 20, push: 4.5, vx: 4.0, vy: -6.0, type: 'overhead', cancel: false, reach: 110, boxY: -48, boxH: 40 },

    // Ground Reversal (Costs 2 Bars)
    'REVERSAL': { name: 'GROUND REVERSAL: TITAN ERUPTION', anim: 'UPPERCUT', startup: 3, active: 12, recovery: 16, dmg: 115, hitstun: 45, blockstun: 20, push: 12, vx: 11.5, vy: -8.5, knockdown: true, invuln: true, isReversal: true, type: 'mid', reach: 145, boxY: -90, boxH: 60 },
    'GRAB': { name: 'Atlas Backbreaker', anim: 'GRAB_ATTEMPT', startup: 7, active: 4, recovery: 19, dmg: 120, hitstun: 42, blockstun: 0, push: 11, vx: 9.5, vy: -7, unblockable: true, isThrow: true, reach: 78, boxY: -74, boxH: 38 },

    // 3-Level Supers
    'SUPER_1': { name: 'LV1: GIGA KNUCKLE BUSTER', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 22, dmg: 180, hitstun: 44, blockstun: 20, push: 13, vx: 12, vy: -7.5, knockdown: true, armor: true, dashSpeed: 8.5, type: 'mid', special: true, reach: 145, boxY: -80, boxH: 48 },
    'SUPER_2': { name: 'LV2: TECTONIC CATACLYSM', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 24, dmg: 260, hitstun: 50, blockstun: 22, push: 14, vx: 9, vy: -12.0, launcher: true, armor: true, invuln: true, dashSpeed: 8, type: 'low', special: true, reach: 152, boxY: -65, boxH: 60 },
    'SUPER_3': { name: 'LV3: CALAMITY KINGDRIVER', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 28, dmg: 380, hitstun: 60, blockstun: 0, push: 17, vx: 14, vy: -13.0, unblockable: true, knockdown: true, invuln: true, dashSpeed: 10, type: 'grab', special: true, reach: 160, boxY: -94, boxH: 68 }
  }
};