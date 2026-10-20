// characters/titan.js
window.CHARACTERS = window.CHARACTERS || {};

window.CHARACTERS.TITAN = {
  id: "TITAN",
  name: "SPONGEBOB",
  isSpongeBob: true,
  role: "Fry Cook Brawler (Frying Pan Slam / 1.15x Air DMG)",
  color: "#fff200",
  secondary: "#6b3e11",
  hp: 1150,
  walkSpeed: 1.95,
  dashSpeed: 8.8,
  jumpForce: 11.2,
  proportions: {
    torsoW: 54, torsoH: 58,
    upperArmL: 22, lowerArmL: 22,
    upperLegL: 22, lowerLegL: 22
  },
  throwName: "KRUSTY KRAB FLIP SLAM",
  summary: `
    <b>Fireball (Krabby Patty Shot):</b> <code>Down, Left + LP/MP/HP</code> (Slow / Med / Fast)<br>
    <b>Uppercut (Spatula Sky Uppercut):</b> <code>Right, Down, Right + P</code> (1x Air Limit, Locks Air)<br>
    <b>Frying Pan Slam (Bounce Launcher):</b> <code>Down + HP</code> (Pulls out Frying Pan &amp; slams floor!)<br>
    <b>Heavy Sweep (QTE):</b> <code>Down + HK</code> | <b>Jump Crush (1.0s Down):</b> <code>Jump + Down + HK</code>
  `,
  moves: {
    // Standing Normals
    '5LP': { name: 'Sponge Jab (5LP)', anim: 'LEAD_JAB', startup: 6, active: 6, recovery: 11, dmg: 36, hitstun: 24, blockstun: 14, push: 3.0, vx: 2.0, vy: 0, type: 'high', cancel: true, reach: 86, boxY: -84, boxH: 24 },
    '5MP': { name: 'Karate Chop Straight (5MP)', anim: 'STEP_STRAIGHT', startup: 8, active: 7, recovery: 15, dmg: 62, hitstun: 28, blockstun: 16, push: 4.2, vx: 3.2, vy: 0, dashSpeed: 2.8, type: 'mid', cancel: true, reach: 96, boxY: -76, boxH: 28 },
    '5HP': { name: 'Frying Pan Swing (5HP)', anim: 'OVERHAND_HOOK', usesPan: true, startup: 11, active: 8, recovery: 20, dmg: 98, hitstun: 36, blockstun: 19, push: 7.0, vx: 5.5, vy: -3, armor: true, type: 'mid', cancel: true, reach: 112, boxY: -80, boxH: 36 },
    '5LK': { name: 'Black Shoe Tap (5LK)', anim: 'CALF_KICK', startup: 7, active: 6, recovery: 12, dmg: 38, hitstun: 24, blockstun: 13, push: 3.0, vx: 2.0, vy: 0, type: 'low', cancel: true, reach: 86, boxY: -34, boxH: 24 },
    '5MK': { name: 'SquarePants Side Kick (5MK)', anim: 'SIDE_THRUST_KICK', startup: 9, active: 7, recovery: 16, dmg: 66, hitstun: 29, blockstun: 16, push: 4.8, vx: 3.5, vy: 0, type: 'mid', cancel: true, reach: 96, boxY: -60, boxH: 28 },
    '5HK': { name: 'Bikini Bottom Big Boot (5HK)', anim: 'HIGH_HOOK_KICK', startup: 12, active: 8, recovery: 21, dmg: 95, hitstun: 36, blockstun: 19, push: 6.0, vx: 4.5, vy: -3, armor: true, type: 'high', cancel: true, reach: 110, boxY: -80, boxH: 34 },

    // Crouching Normals
    '2LP': { name: 'Crouch Sponge Poke (2LP)', anim: 'CROUCH_JAB', startup: 6, active: 6, recovery: 11, dmg: 32, hitstun: 22, blockstun: 12, push: 2.5, vx: 1.5, vy: 0, type: 'low', cancel: true, reach: 82, boxY: -48, boxH: 22 },
    '2MP': { name: 'Crouch Pan Check (2MP)', anim: 'CROUCH_GUT_PUNCH', usesPan: true, startup: 8, active: 7, recovery: 15, dmg: 58, hitstun: 27, blockstun: 15, push: 3.8, vx: 2.8, vy: 0, type: 'mid', cancel: true, reach: 94, boxY: -54, boxH: 26 },
    '2LK': { name: 'Shoe Toe Poke (2LK)', anim: 'CROUCH_ANKLE_KICK', startup: 6, active: 6, recovery: 12, dmg: 34, hitstun: 22, blockstun: 12, push: 2.5, vx: 1.8, vy: 0, type: 'low', cancel: true, reach: 84, boxY: -24, boxH: 20 },
    '2MK': { name: 'Striped Sock Low Kick (2MK)', anim: 'LOW_SPIN_KICK', startup: 9, active: 7, recovery: 17, dmg: 60, hitstun: 28, blockstun: 15, push: 4.2, vx: 3.2, vy: 0, type: 'low', cancel: true, reach: 100, boxY: -26, boxH: 22 },

    // 1. Frying Pan Floor Slam (Down + HP): SpongeBob pulls out a Frying Pan and slams the floor!
    '2HP': {
      name: 'FRYING PAN FLOOR SLAM! (2HP)',
      anim: 'FLOOR_SLAM',
      usesPan: true,
      startup: 11, active: 9, recovery: 21,
      dmg: 88, hitstun: 44, blockstun: 18, push: 3.5, vx: 1.5, vy: -11.6,
      launcher: true, groundBounce: true, hitsGrounded: true, isFloorSlam: true, armor: true,
      type: 'mid', cancel: true, reach: 112, boxY: -70, boxH: 70
    },

    // 2. Heavy Leg Sweep (Down + HK): Forces QTE wakeup
    '2HK': {
      name: 'Hydro-Dynamic Leg Sweep (2HK)',
      anim: 'DRAGON_SWEEP',
      startup: 11, active: 8, recovery: 22,
      dmg: 90, hitstun: 38, blockstun: 19, push: 5.5, vx: 4.0, vy: -5.0,
      knockdown: true, triggersQTE: true, isHeavySweep: true, hitsGrounded: true, isOtgStrike: true,
      type: 'low', cancel: false, reach: 110, boxY: -26, boxH: 28
    },

    // 3. Fireball (Down, Left + Punch): Speed scales with LP / MP / HP
    '214LP': {
      name: 'Slow Krabby Patty Shot (214LP)',
      anim: 'FIREBALL_CAST',
      startup: 11, active: 14, recovery: 17,
      dmg: 65, hitstun: 28, blockstun: 15, push: 4.5, vx: 3.0, vy: 0,
      projectile: true, projSpeed: 4.8,
      type: 'mid', special: true, cancel: false, reach: 92, boxY: -72, boxH: 32
    },
    '214MP': {
      name: 'Medium Krabby Patty Shot (214MP)',
      anim: 'FIREBALL_CAST',
      startup: 12, active: 14, recovery: 18,
      dmg: 80, hitstun: 30, blockstun: 16, push: 5.0, vx: 3.5, vy: 0,
      projectile: true, projSpeed: 8.0,
      type: 'mid', special: true, cancel: false, reach: 92, boxY: -72, boxH: 32
    },
    '214HP': {
      name: 'Fast Krabby Patty Shot (214HP)',
      anim: 'FIREBALL_CAST',
      startup: 13, active: 14, recovery: 19,
      dmg: 95, hitstun: 34, blockstun: 18, push: 6.0, vx: 4.0, vy: 0,
      projectile: true, projSpeed: 11.5,
      type: 'mid', special: true, cancel: false, reach: 92, boxY: -72, boxH: 32
    },
    '214P': {
      name: 'Krabby Patty Shot (214P)',
      anim: 'FIREBALL_CAST',
      startup: 12, active: 14, recovery: 18,
      dmg: 80, hitstun: 30, blockstun: 16, push: 5.0, vx: 3.5, vy: 0,
      projectile: true, projSpeed: 8.0,
      type: 'mid', special: true, cancel: false, reach: 92, boxY: -72, boxH: 32
    },

    // 4. Uppercut (Right, Down, Right + Punch): Usable once, locks caster until landing
    '623P': {
      name: 'Golden Frying Pan Uppercut (623P)',
      anim: 'RISING_UPPERCUT',
      usesPan: true,
      startup: 7, active: 12, recovery: 25,
      dmg: 130, hitstun: 48, blockstun: 21, push: 5.0, vx: 3.2, vy: -11.5,
      selfLaunchVY: -9.5, selfForwardVX: 3.0,
      isUppercut: true, locksAirActions: true, knockdown: true, armor: true, invuln: true,
      type: 'mid', special: true, cancel: false, reach: 108, boxY: -98, boxH: 60
    },
    '8_623P': {
      name: 'Air Golden Pan Uppercut (j.623P)',
      anim: 'RISING_UPPERCUT',
      usesPan: true,
      airMove: true,
      startup: 6, active: 12, recovery: 25,
      dmg: 125, hitstun: 48, blockstun: 21, push: 5.0, vx: 3.5, vy: -10.5,
      selfLaunchVY: -8.2, selfForwardVX: 2.8,
      isUppercut: true, locksAirActions: true, knockdown: true,
      type: 'overhead', special: true, cancel: false, reach: 108, boxY: -98, boxH: 60
    },

    // 5. Heavy Jump Crush (Jump + Down + HK): 1.0s fixed knockdown on standing/crouching
    '82HK': {
      name: 'Sponge Belly Stomp Crush (j.2HK)',
      anim: 'JUMP_CRUSH_STOMP',
      airMove: true,
      startup: 7, active: 16, recovery: 15,
      dmg: 100, hitstun: 40, blockstun: 20, push: 5.0, vx: 4.5, vy: 10.2,
      isJumpCrush: true, fixedKnockdownSec: 1.0, hitsGrounded: false, isOtgStrike: false,
      type: 'overhead', cancel: false, reach: 104, boxY: -36, boxH: 42
    },

    // Jumping Normals for Air Combo
    '8LP': { name: 'Air Sponge Jab (j.LP)', anim: 'AIR_JAB', airMove: true, startup: 5, active: 8, recovery: 9, dmg: 36, hitstun: 26, blockstun: 15, push: 1.8, vx: 1.8, vy: -4.8, type: 'overhead', cancel: true, reach: 84, boxY: -62, boxH: 28 },
    '8MP': { name: 'Air Karate Chop (j.MP)', anim: 'AIR_CROSS', airMove: true, startup: 6, active: 8, recovery: 11, dmg: 56, hitstun: 30, blockstun: 17, push: 2.2, vx: 2.0, vy: -5.0, type: 'overhead', cancel: true, reach: 94, boxY: -70, boxH: 30 },
    '8HP': { name: 'Air Frying Pan Smash (j.HP)', anim: 'AIR_HAMMER_SMASH', usesPan: true, airMove: true, startup: 8, active: 10, recovery: 13, dmg: 84, hitstun: 38, blockstun: 20, push: 3.5, vx: 2.8, vy: -5.2, type: 'overhead', cancel: true, reach: 108, boxY: -54, boxH: 44 },
    '8LK': { name: 'Air Knee Stamp (j.LK)', anim: 'AIR_KNEE_DROP', airMove: true, startup: 5, active: 8, recovery: 9, dmg: 38, hitstun: 26, blockstun: 14, push: 1.8, vx: 1.8, vy: -4.8, type: 'overhead', cancel: true, reach: 84, boxY: -42, boxH: 30 },
    '8MK': { name: 'Air Shoe Kick (j.MK)', anim: 'AIR_SIDE_BLADE', airMove: true, startup: 7, active: 9, recovery: 11, dmg: 62, hitstun: 31, blockstun: 17, push: 2.5, vx: 2.2, vy: -5.0, type: 'overhead', cancel: true, reach: 100, boxY: -52, boxH: 30 },
    '8HK': { name: 'Air Double Shoe Drop (j.HK)', anim: 'AIR_WHEEL_KICK', airMove: true, startup: 9, active: 10, recovery: 14, dmg: 90, hitstun: 40, blockstun: 20, push: 4.0, vx: 3.2, vy: -5.4, type: 'overhead', cancel: true, reach: 110, boxY: -48, boxH: 40 },

    // Universal Reversal, Throw, and Supers
    'REVERSAL': { name: 'GROUND REVERSAL: FRY COOK ERUPTION', anim: 'RISING_UPPERCUT', usesPan: true, startup: 3, active: 12, recovery: 16, dmg: 115, hitstun: 45, blockstun: 20, push: 12, vx: 11.5, vy: -8.5, knockdown: true, invuln: true, isReversal: true, type: 'mid', reach: 145, boxY: -90, boxH: 60 },
    'GRAB': { name: 'Krusty Krab Flip Slam', anim: 'GRAB_ATTEMPT', usesPan: true, startup: 7, active: 4, recovery: 19, dmg: 120, hitstun: 42, blockstun: 0, push: 11, vx: 9.5, vy: -7, unblockable: true, isThrow: true, reach: 78, boxY: -74, boxH: 38 },

    'SUPER_1': { name: 'LV1: SIZZLING PAN BUSTER', anim: 'SUPER_1', usesPan: true, superLevel: 1, cost: 100, startup: 6, active: 20, recovery: 22, dmg: 180, hitstun: 44, blockstun: 20, push: 13, vx: 12, vy: -7.5, knockdown: true, armor: true, dashSpeed: 8.5, type: 'mid', special: true, reach: 145, boxY: -80, boxH: 48 },
    'SUPER_2': { name: 'LV2: KRUSTY KRAB CATACLYSM', anim: 'SUPER_2', usesPan: true, superLevel: 2, cost: 200, startup: 5, active: 24, recovery: 24, dmg: 260, hitstun: 50, blockstun: 22, push: 14, vx: 9, vy: -12.0, launcher: true, armor: true, invuln: true, dashSpeed: 8, type: 'low', special: true, reach: 152, boxY: -65, boxH: 60 },
    'SUPER_3': { name: 'LV3: GOOFY GOOBER OVERDRIVE', anim: 'SUPER_3', usesPan: true, superLevel: 3, cost: 300, startup: 4, active: 28, recovery: 28, dmg: 380, hitstun: 60, blockstun: 0, push: 17, vx: 14, vy: -13.0, unblockable: true, knockdown: true, invuln: true, dashSpeed: 10, type: 'grab', special: true, reach: 160, boxY: -94, boxH: 68 }
  }
};