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
    <b>Air Combo Window:</b> Maximum 6.0s (0.50x Light Air Damage)<br>
    <b>Launchers (Scoops Standing &amp; Downed):</b> <code>2HP</code> (Somersault Heel) | <code>623+P</code> (Spiral Upkick)<br>
    <b>Grounded OTG Attacks:</b> <code>2HK</code> (Neon Sweep) | <code>214+K</code> (Crescent OTG Axe)<br>
    <b>Ground Reversal (While Downed, Costs 2 Bars):</b> Press <code>LB</code> / <kbd>P</kbd>
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Quick Flick (5LP)', anim: 'JAB', startup: 4, active: 5, recovery: 9, dmg: 28, hitstun: 22, blockstun: 12, push: 2, vx: 1.5, vy: 0, type: 'high', cancel: true, reach: 78, boxY: -78, boxH: 20 },
    '5MP': { name: 'Neon Palm (5MP)', anim: 'STRAIGHT', startup: 6, active: 6, recovery: 13, dmg: 50, hitstun: 26, blockstun: 14, push: 3.5, vx: 2.5, vy: 0, type: 'mid', cancel: true, reach: 88, boxY: -70, boxH: 24 },
    '5HP': { name: 'Whip Strike (5HP)', anim: 'HOOK', startup: 9, active: 7, recovery: 17, dmg: 78, hitstun: 31, blockstun: 17, push: 5, vx: 4, vy: -2.5, type: 'mid', cancel: true, reach: 98, boxY: -74, boxH: 28 },
    '5LK': { name: 'Snap Low Kick (5LK)', anim: 'LOW_KICK', startup: 5, active: 5, recovery: 10, dmg: 32, hitstun: 22, blockstun: 12, push: 2.5, vx: 2, vy: 0, type: 'low', cancel: true, reach: 84, boxY: -32, boxH: 20 },
    '5MK': { name: 'Side Snap Kick (5MK)', anim: 'MID_KICK', startup: 7, active: 6, recovery: 14, dmg: 56, hitstun: 27, blockstun: 15, push: 4, vx: 3, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -58, boxH: 24 },
    '5HK': { name: 'Sky Heel Launcher (5HK)', anim: 'HIGH_KICK', startup: 9, active: 7, recovery: 18, dmg: 75, hitstun: 38, blockstun: 17, push: 3.5, vx: 2.5, vy: -11.0, launcher: true, dashSpeed: 4, type: 'mid', cancel: true, reach: 104, boxY: -84, boxH: 38 },

    // Launchers (Scoops Standing & Downed)
    '2HP': { name: 'Somersault Launcher (2HP)', anim: 'UPPERCUT', startup: 9, active: 8, recovery: 19, dmg: 65, hitstun: 40, blockstun: 16, push: 3, vx: 2.2, vy: -11.8, launcher: true, hitsGrounded: true, type: 'mid', cancel: true, reach: 94, boxY: -88, boxH: 50 },
    '623P': { name: 'Spiral Pinwheel Launcher (623P)', anim: 'SPIN_KICK', startup: 7, active: 10, recovery: 20, dmg: 85, hitstun: 44, blockstun: 17, push: 3.5, vx: 2.5, vy: -12.2, launcher: true, hitsGrounded: true, dashSpeed: 6, type: 'mid', special: true, reach: 104, boxY: -88, boxH: 52 },

    // Grounded OTG Attacks
    '2HK': { name: 'OTG Neon Sweep (2HK)', anim: 'SWEEP', startup: 9, active: 7, recovery: 19, dmg: 70, hitstun: 34, blockstun: 17, push: 4.5, vx: 3.5, vy: -5, knockdown: true, hitsGrounded: true, isOtgStrike: true, type: 'low', cancel: false, reach: 104, boxY: -22, boxH: 24 },
    '214K': { name: 'OTG Crescent Axe Drop (214K)', anim: 'AXE_KICK', startup: 11, active: 8, recovery: 17, dmg: 85, hitstun: 36, blockstun: 17, push: 4, vx: 3.0, vy: 0, hitsGrounded: true, isOtgStrike: true, dashSpeed: 5, type: 'overhead', special: true, reach: 98, boxY: -36, boxH: 36 },

    // Jumping Air Combo Attacks
    '8LP': { name: 'Air Flick Jab (j.LP)', anim: 'AIR_JAB', airMove: true, startup: 4, active: 7, recovery: 7, dmg: 26, hitstun: 26, blockstun: 13, push: 1.8, vx: 1.8, vy: -5.2, type: 'overhead', cancel: true, reach: 80, boxY: -56, boxH: 24 },
    '8MP': { name: 'Air Neon Palm (j.MP)', anim: 'AIR_STRAIGHT', airMove: true, startup: 5, active: 8, recovery: 9, dmg: 42, hitstun: 28, blockstun: 15, push: 2.2, vx: 2.0, vy: -5.4, type: 'overhead', cancel: true, reach: 90, boxY: -64, boxH: 26 },
    '8HP': { name: 'Air Whip Smash (j.HP)', anim: 'AIR_HEAVY_PUNCH', airMove: true, startup: 6, active: 9, recovery: 11, dmg: 65, hitstun: 34, blockstun: 17, push: 3, vx: 2.5, vy: -5.6, type: 'overhead', cancel: true, reach: 98, boxY: -50, boxH: 34 },
    '8LK': { name: 'Air Knee Press (j.LK)', anim: 'AIR_LOW_KICK', airMove: true, startup: 4, active: 8, recovery: 7, dmg: 28, hitstun: 26, blockstun: 13, push: 1.8, vx: 1.8, vy: -5.2, type: 'overhead', cancel: true, reach: 82, boxY: -38, boxH: 26 },
    '8MK': { name: 'Air Side Snap (j.MK)', anim: 'AIR_MID_KICK', airMove: true, startup: 5, active: 9, recovery: 9, dmg: 46, hitstun: 29, blockstun: 15, push: 2.4, vx: 2.2, vy: -5.4, type: 'overhead', cancel: true, reach: 96, boxY: -48, boxH: 28 },
    '8HK': { name: 'Air Scissor Heel (j.HK)', anim: 'AIR_HEAVY_KICK', airMove: true, startup: 7, active: 10, recovery: 12, dmg: 70, hitstun: 36, blockstun: 18, push: 3.5, vx: 3.0, vy: -5.8, type: 'overhead', cancel: false, reach: 104, boxY: -44, boxH: 38 },

    // Ground Reversal (Costs 2 Bars)
    'REVERSAL': { name: 'GROUND REVERSAL: NEON NOVA', anim: 'SPIN_KICK', startup: 3, active: 12, recovery: 16, dmg: 115, hitstun: 45, blockstun: 20, push: 12, vx: 11.5, vy: -8.5, knockdown: true, invuln: true, isReversal: true, type: 'mid', reach: 145, boxY: -90, boxH: 60 },
    'GRAB': { name: 'Neon Hurricanrana', anim: 'GRAB_ATTEMPT', startup: 6, active: 4, recovery: 18, dmg: 120, hitstun: 40, blockstun: 0, push: 10, vx: 9, vy: -6.8, unblockable: true, isThrow: true, reach: 76, boxY: -68, boxH: 34 },

    // 3-Level Supers
    'SUPER_1': { name: 'LV1: NEON MIRAGE RUSH', anim: 'SUPER_1', superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 20, dmg: 165, hitstun: 42, blockstun: 18, push: 11, vx: 9.5, vy: -7, knockdown: true, dashSpeed: 10.5, type: 'mid', special: true, reach: 142, boxY: -72, boxH: 44 },
    'SUPER_2': { name: 'LV2: CRIMSON TEMPEST', anim: 'SUPER_2', superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 23, dmg: 245, hitstun: 48, blockstun: 20, push: 13, vx: 10, vy: -11.8, launcher: true, invuln: true, dashSpeed: 10, type: 'mid', special: true, reach: 148, boxY: -88, boxH: 56 },
    'SUPER_3': { name: 'LV3: FENG SHUI OVERDRIVE', anim: 'SUPER_3', superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 26, dmg: 350, hitstun: 60, blockstun: 24, push: 15, vx: 13, vy: -13.0, knockdown: true, invuln: true, dashSpeed: 13, type: 'mid', special: true, reach: 162, boxY: -92, boxH: 64 }
  }
};