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
    <b>Air Combo Window:</b> Max 4.5s (0.75x Air Damage)<br>
    <b>Launchers (Scoops Standing &amp; Downed):</b> <code>2HP</code> (Rising Upper) | <code>623+P</code> (Electric God Fist)<br>
    <b>Grounded OTG Attacks:</b> <code>2HK</code> (Low Sweep) | <code>214+K</code> (Thunder Heel Stomp)<br>
    <b>Ground Reversal (While Downed, Costs 2 Bars):</b> Press <code>LB</code> / <kbd>P</kbd>
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Light Jab (5LP)', anim: 'JAB', startup: 5, active: 5, recovery: 10, dmg: 30, hitstun: 22, blockstun: 12, push: 2.5, vx: 1.5, vy: 0, type: 'high', cancel: true, reach: 82, boxY: -82, boxH: 22 },
    '5MP': { name: 'Body Straight (5MP)', anim: 'STRAIGHT', startup: 7, active: 6, recovery: 14, dmg: 55, hitstun: 26, blockstun: 15, push: 4, vx: 3, vy: 0, type: 'mid', cancel: true, reach: 92, boxY: -74, boxH: 26 },
    '5HP': { name: 'Heavy Hook (5HP)', anim: 'HOOK', startup: 10, active: 7, recovery: 19, dmg: 85, hitstun: 32, blockstun: 18, push: 6, vx: 4.5, vy: -3, type: 'mid', cancel: true, reach: 102, boxY: -78, boxH: 30 },
    '5LK': { name: 'Low Shin Kick (5LK)', anim: 'LOW_KICK', startup: 6, active: 5, recovery: 11, dmg: 35, hitstun: 22, blockstun: 12, push: 3, vx: 2, vy: 0, type: 'low', cancel: true, reach: 86, boxY: -34, boxH: 22 },
    '5MK': { name: 'Side Thrust Kick (5MK)', anim: 'MID_KICK', startup: 8, active: 6, recovery: 15, dmg: 60, hitstun: 27, blockstun: 15, push: 4.5, vx: 3.5, vy: 0, type: 'mid', cancel: true, reach: 98, boxY: -58, boxH: 26 },
    '5HK': { name: 'High Roundhouse Launcher (5HK)', anim: 'HIGH_KICK', startup: 11, active: 7, recovery: 20, dmg: 80, hitstun: 36, blockstun: 18, push: 4, vx: 2.5, vy: -10.8, launcher: true, type: 'mid', cancel: true, reach: 106, boxY: -80, boxH: 32 },

    // Launchers (Can launch both standing and downed opponents!)
    '2HP': { name: 'Rising Upper Launcher (2HP)', anim: 'UPPERCUT', startup: 10, active: 8, recovery: 20, dmg: 70, hitstun: 40, blockstun: 16, push: 3, vx: 2.2, vy: -11.5, launcher: true, hitsGrounded: true, type: 'mid', cancel: true, reach: 94, boxY: -92, boxH: 52 },
    '623P': { name: 'Electric Wind Launcher (623P)', anim: 'UPPERCUT', startup: 8, active: 9, recovery: 21, dmg: 95, hitstun: 44, blockstun: 18, push: 3.5, vx: 2.8, vy: -12.0, launcher: true, hitsGrounded: true, dashSpeed: 5.5, type: 'mid', special: true, reach: 102, boxY: -94, boxH: 54 },

    // Grounded OTG Attacks (Hits downed opponents; triggers 0.5s immediate wake-up when attack finishes)
    '2HK': { name: 'OTG Thunder Sweep (2HK)', anim: 'SWEEP', startup: 10, active: 8, recovery: 20, dmg: 75, hitstun: 34, blockstun: 18, push: 5, vx: 3.5, vy: -5, knockdown: true, hitsGrounded: true, isOtgStrike: true, type: 'low', cancel: false, reach: 106, boxY: -24, boxH: 26 },
    '214K': { name: 'OTG Raijin Heel Stomp (214K)', anim: 'AXE_KICK', startup: 11, active: 9, recovery: 18, dmg: 90, hitstun: 36, blockstun: 16, push: 4, vx: 3.0, vy: 0, hitsGrounded: true, isOtgStrike: true, dashSpeed: 4.5, type: 'overhead', special: true, reach: 100, boxY: -36, boxH: 36 },

    // Jumping Air Combo Attacks (Chained in mid-air during Air Combo window)
    '8LP': { name: 'Air Cyber Jab (j.LP)', anim: 'AIR_JAB', airMove: true, startup: 4, active: 7, recovery: 8, dmg: 28, hitstun: 26, blockstun: 14, push: 2, vx: 2, vy: -5.2, type: 'overhead', cancel: true, reach: 82, boxY: -58, boxH: 26 },
    '8MP': { name: 'Air Straight (j.MP)', anim: 'AIR_STRAIGHT', airMove: true, startup: 5, active: 8, recovery: 10, dmg: 45, hitstun: 28, blockstun: 16, push: 2.5, vx: 2.2, vy: -5.4, type: 'overhead', cancel: true, reach: 92, boxY: -66, boxH: 28 },
    '8HP': { name: 'Air Meteor Hook (j.HP)', anim: 'AIR_HEAVY_PUNCH', airMove: true, startup: 7, active: 9, recovery: 12, dmg: 70, hitstun: 34, blockstun: 18, push: 3.5, vx: 3.0, vy: -5.6, type: 'overhead', cancel: true, reach: 98, boxY: -52, boxH: 36 },
    '8LK': { name: 'Air Knee Drop (j.LK)', anim: 'AIR_LOW_KICK', airMove: true, startup: 4, active: 8, recovery: 8, dmg: 30, hitstun: 26, blockstun: 14, push: 2, vx: 2, vy: -5.2, type: 'overhead', cancel: true, reach: 84, boxY: -40, boxH: 28 },
    '8MK': { name: 'Air Flying Thrust (j.MK)', anim: 'AIR_MID_KICK', airMove: true, startup: 6, active: 8, recovery: 10, dmg: 50, hitstun: 29, blockstun: 16, push: 3, vx: 2.5, vy: -5.4, type: 'overhead', cancel: true, reach: 98, boxY: -50, boxH: 28 },
    '8HK': { name: 'Air Raijin Kick (j.HK)', anim: 'AIR_HEAVY_KICK', airMove: true, startup: 8, active: 9, recovery: 13, dmg: 75, hitstun: 36, blockstun: 19, push: 4, vx: 3.5, vy: -5.8, type: 'overhead', cancel: false, reach: 106, boxY: -46, boxH: 38 },

    // Ground Reversal (Used while Knocked Down - Costs 2 Bars)
    'REVERSAL': { name: 'GROUND REVERSAL: RAIJIN BURST', anim: 'UPPERCUT', startup: 3, active: 12, recovery: 16, dmg: 115, hitstun: 45, blockstun: 20, push: 12, vx: 11.5, vy: -8.5, knockdown: true, invuln: true, isReversal: true, type: 'mid', reach: 145, boxY: -90, boxH: 60 },
    'GRAB': { name: 'Cyber Izuna Drop', anim: 'GRAB_ATTEMPT', startup: 6, active: 4, recovery: 18, dmg: 120, hitstun: 40, blockstun: 0, push: 10, vx: 8, vy: -6, unblockable: true, isThrow: true, reach: 76, boxY: -72, boxH: 36 },

    // 3-Level Supers
    'SUPER_1': { name: 'LV1: MEGA PLASMA CANNON', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 22, dmg: 170, hitstun: 44, blockstun: 18, push: 12, vx: 10, vy: -7.5, knockdown: true, dashSpeed: 7.5, type: 'mid', special: true, reach: 145, boxY: -78, boxH: 48 },
    'SUPER_2': { name: 'LV2: THUNDER GOD SPIRAL', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 24, dmg: 250, hitstun: 50, blockstun: 20, push: 14, vx: 10.5, vy: -11.8, launcher: true, invuln: true, dashSpeed: 9.5, type: 'mid', special: true, reach: 150, boxY: -92, boxH: 58 },
    'SUPER_3': { name: 'LV3: SHIN RAIJIN JUDGEMENT', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 28, dmg: 360, hitstun: 60, blockstun: 24, push: 16, vx: 13.5, vy: -13.0, knockdown: true, invuln: true, dashSpeed: 12, type: 'mid', special: true, reach: 165, boxY: -96, boxH: 66 }
  }
};