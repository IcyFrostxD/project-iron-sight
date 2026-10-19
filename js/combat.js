// js/combat.js
window.FighterCombat = {
  getPostAttackDelayFrames(moveKey, moveObj) {
    const dCfg = GameConfig.ATTACK_DELAY || { LIGHT_SECONDS: 0.115, MEDIUM_SECONDS: 0.200, HEAVY_SECONDS: 0.323 };
    if (!moveKey) return Math.round(dCfg.LIGHT_SECONDS * 60);

    if (moveKey.endsWith('HP') || moveKey.endsWith('HK') || (moveObj && (moveObj.isFloorSlam || moveObj.isHeavySweep || moveObj.isUppercut))) {
      return Math.round(dCfg.HEAVY_SECONDS * 60);
    }
    if (moveKey.endsWith('MP') || moveKey.endsWith('MK')) {
      return Math.round(dCfg.MEDIUM_SECONDS * 60);
    }
    return Math.round(dCfg.LIGHT_SECONDS * 60);
  },

  resolveHit(attacker, opponent, move, engine) {
    attacker.hasDealtHit = true;
    attacker.hitConnected = true;

    const wasTargetDown = (opponent.state === 'KNOCKDOWN' || opponent.state === 'OTG_HIT');
    const wasTargetAirborne = (opponent.y < GameConfig.FLOOR_Y || opponent.state === 'AIR_HIT');

    if (wasTargetDown) {
      const isAllowedGroundedHit = !move.airMove && !move.isJumpCrush && (
        move.isFloorSlam ||
        attacker.currentMoveKey === '2HP' ||
        attacker.currentMoveKey === '2HK' ||
        attacker.currentMoveKey === '5HK'
      );
      if (!isAllowedGroundedHit) {
        return;
      }
    }

    const applyGroundPushback = (basePush, isBlock = false) => {
      attacker.groundPushCount++;
      const progressivePush = basePush + attacker.groundPushCount * 1.35;
      opponent.vx = attacker.facing * progressivePush;
      attacker.vx = -attacker.facing * (progressivePush * (isBlock ? 0.55 : 0.42));
    };

    // 1. Perfect Block (LT / Key H)
    const isOpponentPerfectBlocking = (opponent.state === 'PERFECT_BLOCK' || opponent.holdingPerfectBlock);
    if (isOpponentPerfectBlocking && !move.isThrow) {
      opponent.state = 'PERFECT_BLOCK';
      applyGroundPushback((move.push || 4) * GameConfig.PERFECT_BLOCK.PUSHBACK_MULT, true);
      const chipDmg = opponent.maxHp * (GameConfig.PERFECT_BLOCK.CHIP_DAMAGE_MAX_HP_PERCENT / 100);
      opponent.hp = Math.max(1, Number((opponent.hp - chipDmg).toFixed(2)));

      engine.triggerHitstop(7, 3);
      engine.spawnParticles(opponent.x - attacker.facing * 22, opponent.y - 60, '#00ff88', 20, 7);
      engine.addFloatingText(`PERFECT BLOCK (-${chipDmg.toFixed(2)} HP)`, opponent.x, opponent.y - 105, '#00ff88', 18);
      return;
    }

    // 2. Throw & Throw Tech Check
    if (move.isThrow) {
      if (opponent.y < GameConfig.FLOOR_Y - 10) return;

      const recentGrabDelta = Math.abs(engine.frameCount - opponent.lastGrabPressFrame);
      const opponentGrabbing = (opponent.state === 'ATTACK' && opponent.currentMove && opponent.currentMove.isThrow);
      if (opponentGrabbing || recentGrabDelta <= GameConfig.THROW.TECH_WINDOW_FRAMES) {
        attacker.triggerThrowTech(opponent, engine);
        return;
      }

      attacker.state = 'THROW_EXEC';
      attacker.throwTimer = 0;
      attacker.throwTarget = opponent;
      opponent.state = 'THROWN';
      opponent.currentMove = null;
      opponent.vx = 0;
      opponent.vy = 0;
      engine.triggerHitstop(5, 3);
      engine.addFloatingText("GRAB! (TECH WINDOW)", attacker.x, attacker.y - 105, '#ffcf33', 18);
      return;
    }

    // 3. Normal Directional Guard
    let normalBlocked = false;
    const canGuard = (opponent.state === 'IDLE' || opponent.state === 'WALK' || opponent.state === 'CROUCH' || opponent.state === 'BLOCK');
    if (canGuard && opponent.holdingBack && !move.unblockable && opponent.y >= GameConfig.FLOOR_Y) {
      if (move.type === 'low' && opponent.holdingDown) normalBlocked = true;
      else if (move.type === 'overhead' && !opponent.holdingDown) normalBlocked = true;
      else if (move.type === 'mid' || move.type === 'high') normalBlocked = true;
    }

    if (normalBlocked) {
      opponent.state = 'BLOCK';
      opponent.stateTimer = move.blockstun;
      applyGroundPushback((move.push || 4) * GameConfig.BLOCK.PUSHBACK_MULT, true);

      const chipDmg = opponent.maxHp * (GameConfig.BLOCK.CHIP_DAMAGE_MAX_HP_PERCENT / 100);
      opponent.hp = Math.max(1, Number((opponent.hp - chipDmg).toFixed(2)));

      attacker.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, attacker.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_BLOCK);
      engine.triggerHitstop(5, 3);
      engine.spawnParticles(opponent.x - attacker.facing * 15, opponent.y - 60, '#44aaff', 12, 5);
      engine.addFloatingText(`GUARD (-${chipDmg.toFixed(2)} HP)`, opponent.x, opponent.y - 95, '#66ccff', 16);
      return;
    }

    // 4. Clean Hit Damage & Meter Calculation
    attacker.comboCount++;
    let dmgMult = 1.0;
    if (wasTargetAirborne || move.airMove) {
      dmgMult = attacker.airDamageMultiplier;
    }
    const finalDmg = Math.max(6, Math.round(move.dmg * dmgMult));
    attacker.comboDamage += finalDmg;
    opponent.hp = Math.max(0, Number((opponent.hp - finalDmg).toFixed(2)));

    attacker.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, attacker.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HIT);
    opponent.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, opponent.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HURT);

    engine.triggerHitstop(move.launcher || move.isUppercut || move.isAirFloorSlam || move.superLevel ? 9 : 5, move.launcher || move.isUppercut || move.isAirFloorSlam ? 8 : 3);
    engine.spawnParticles((attacker.x + opponent.x) / 2, opponent.y - 45, attacker.data.color, 18, 7);

    // 4A. Air Down + Heavy Punch (`82HP` / Jump + Down + HP):
    // Slams airborne enemy into floor for immediate 2nd bounce AND pulls attacker down to floor immediately!
    if (move.isAirFloorSlam && wasTargetAirborne) {
      const canBounceAgain = (!opponent.launchImmune && opponent.launchCount < 2);

      attacker.y = GameConfig.FLOOR_Y;
      attacker.vy = 0;
      attacker.vx = attacker.facing * 2.0;
      attacker.state = 'IDLE';
      attacker.currentMove = null;
      attacker.currentMoveKey = null;
      attacker.airDashCount = 0;
      attacker.hasAirAttacked = false;
      attacker.usedAirHeavy = false;
      attacker.airNormalsLocked = false;
      attacker.airLightCount = 0;
      attacker.airMediumCount = 0;

      opponent.y = GameConfig.FLOOR_Y - 10;
      engine.triggerFloorSlamEffect(opponent.x, GameConfig.FLOOR_Y, attacker.data.color);

      if (canBounceAgain) {
        opponent.launchCount++;
        opponent.state = 'AIR_HIT';
        opponent.airComboMaxFrames = attacker.maxAirComboFrames;
        opponent.airComboFramesLeft = attacker.maxAirComboFrames;
        opponent.vy = GameConfig.AIR_COMBO.AIR_SLAM_BOUNCE_VY || -8.2;
        opponent.vx = attacker.facing * 1.2;
        engine.addFloatingText("AIR SLAM BOUNCE! (ROUND 2 COMBO)", opponent.x, opponent.y - 115, '#00ffcc', 21);
      } else {
        opponent.enterKnockdown('QTE');
        engine.addFloatingText("FLOOR SLAM IMMUNE! (MAX 2 LAUNCHES)", opponent.x, opponent.y - 115, '#ffaa00', 20);
      }
      return;
    }

    // 4B. Heavy Jump Crush (`82HK` / Jump + Down + HK) on Standing/Crouching Opponent -> 1.0s Fixed Knockdown
    if (move.isJumpCrush && !wasTargetAirborne && !wasTargetDown) {
      const kdSec = move.fixedKnockdownSec || 1.0;
      opponent.enterKnockdown('FIXED', kdSec);
      opponent.vx = attacker.facing * 3.5;
      engine.addFloatingText(`JUMP CRUSH! (${kdSec.toFixed(1)}s KNOCKDOWN)`, opponent.x, opponent.y - 110, '#ffaa00', 20);
      return;
    }

    // 4C. Heavy Leg Sweep (`2HK` / Down + HK) on Standing/Crouching Opponent -> QTE Knockdown
    if (move.isHeavySweep && !wasTargetAirborne && !wasTargetDown) {
      opponent.enterKnockdown('SWEEP_QTE');
      applyGroundPushback(move.push || 5, false);
      engine.addFloatingText("SWEEP KNOCKDOWN! (INPUT QTE)", opponent.x, opponent.y - 110, '#ff4477', 20);
      return;
    }

    // 4D. Uppercut Finisher (`623P` / `8_623P`)
    if (move.isUppercut) {
      opponent.state = 'AIR_HIT';
      opponent.airComboFramesLeft = 0;
      opponent.vy = -8.5;
      opponent.vx = attacker.facing * 5.5;
      opponent.y = Math.min(opponent.y, GameConfig.FLOOR_Y - 14);
      engine.addFloatingText("UPPERCUT FINISH!!", opponent.x, opponent.y - 115, '#00ffcc', 22);
      return;
    }

    // 4E. Ground Floor Slam (`2HP`) & 3-Step Launcher Nerf Check
    const canLaunchTarget = move.launcher && !opponent.launchImmune && opponent.launchCount < 2;
    if (move.launcher && !canLaunchTarget && !wasTargetAirborne) {
      engine.addFloatingText("FLOOR SLAM IMMUNE! (NORMAL HIT)", opponent.x, opponent.y - 115, '#ffaa00', 18);
      if (wasTargetDown) {
        opponent.state = 'OTG_HIT';
        opponent.wasHitOnGround = true;
        opponent.stateTimer = 20;
        applyGroundPushback(3.5, false);
        return;
      } else {
        opponent.state = 'HIT';
        opponent.stateTimer = move.hitstun || 26;
        applyGroundPushback(move.push || 4, false);
        return;
      }
    }

    // 4F. Grounded Hard Kick OTG Strike (`2HK` / `5HK` on Downed Opponent)
    if (wasTargetDown && !canLaunchTarget) {
      opponent.state = 'OTG_HIT';
      opponent.wasHitOnGround = true;
      opponent.stateTimer = 24;
      applyGroundPushback(3.5, false);
      engine.addFloatingText(`HARD KICK OTG! (-${finalDmg})`, opponent.x, opponent.y - 90, '#ffaa00', 20);
      return;
    }

    // 4G. Ground Floor Slam (`2HP`) Bounce Launch -> Resets Air Hit Counters to 0!
    if (canLaunchTarget && !wasTargetAirborne) {
      opponent.launchCount++;
      opponent.state = 'AIR_HIT';
      opponent.juggleCount = 1;
      opponent.airComboMaxFrames = attacker.maxAirComboFrames;
      opponent.airComboFramesLeft = attacker.maxAirComboFrames;

      attacker.airLightCount = 0;
      attacker.airMediumCount = 0;
      attacker.usedAirHeavy = false;
      attacker.airNormalsLocked = false;

      opponent.vy = -7.2;
      opponent.vx = attacker.facing * 1.2;
      opponent.y = Math.min(opponent.y, GameConfig.FLOOR_Y - 14);

      const bounceTag = attacker.data.isSpongeBob ? "FRYING PAN SLAM!" : (move.groundBounce ? "FLOOR SLAM BOUNCE!" : "LAUNCH!");
      const launchLabel = opponent.launchCount === 1
        ? `${bounceTag} 1/2 (${(attacker.maxAirComboFrames / 60).toFixed(1)}s AIR)`
        : `${bounceTag} 2/2 (FAST WAKEUP NEXT)`;
      engine.addFloatingText(launchLabel, opponent.x, opponent.y - 110, '#00ffcc', 20);
      return;
    }

    // 4H. Critical: Mid-Air Combo Hit Rules
    if (wasTargetAirborne) {
      opponent.juggleCount++;
      const moveKey = attacker.currentMoveKey || '';
      const isAirLight = (moveKey === '8LP' || moveKey === '8LK');
      const isAirMedium = (moveKey === '8MP' || moveKey === '8MK');
      const isAirHeavy = (moveKey === '8HP' || moveKey === '8HK' || move.isAirHeavy);

      const maxLights = (GameConfig.AIR_COMBO && GameConfig.AIR_COMBO.MAX_LIGHT_HITS) || 3;
      const maxMediums = (GameConfig.AIR_COMBO && GameConfig.AIR_COMBO.MAX_MEDIUM_HITS) || 2;

      // Critical: Air Heavy Attack (8HP / 8HK) -> Straight Strike, Does NOT lift, makes opponent fall faster!
      // Locks further normal air attacks, but player can still cancel into Dive Slam (82HP / 82HK)!
      if (isAirHeavy) {
        opponent.state = 'AIR_HIT';
        const fastFallVy = (GameConfig.AIR_COMBO && GameConfig.AIR_COMBO.VICTIM_AIR_HEAVY_FALL_VY) || 4.8;
        opponent.vy = Math.max(opponent.vy, fastFallVy);
        opponent.vx = attacker.facing * 2.2;

        // Attacker does not bounce upward on Air Heavy, falls naturally unless they input 82HP / 82HK
        attacker.vy = Math.max(attacker.vy, 1.2);
        attacker.usedAirHeavy = true;
        attacker.airNormalsLocked = true;
        engine.addFloatingText("AIR HEAVY STRIKE! (FAST FALL)", opponent.x, opponent.y - 110, '#ffaa00', 19);
        return;
      }

      if (move.special && move.resetsAirCombo) {
        attacker.airLightCount = 0;
        attacker.airMediumCount = 0;
        attacker.usedAirHeavy = false;
        attacker.airNormalsLocked = false;
        engine.addFloatingText("AIR SPECIAL RESET!", opponent.x, opponent.y - 115, '#00ff88', 18);
      } else if (isAirLight) {
        attacker.airLightCount++;
        if (attacker.airLightCount > maxLights) {
          opponent.airComboFramesLeft = 0;
          opponent.vy = 8.5;
          opponent.vx = attacker.facing * 4.0;
          engine.addFloatingText(`AIR LIGHT LIMIT (>${maxLights})! DROP!`, opponent.x, opponent.y - 110, '#ff4477', 20);
          return;
        }
      } else if (isAirMedium) {
        attacker.airMediumCount++;
        if (attacker.airMediumCount > maxMediums) {
          opponent.airComboFramesLeft = 0;
          opponent.vy = 8.5;
          opponent.vx = attacker.facing * 4.0;
          engine.addFloatingText(`AIR MEDIUM LIMIT (>${maxMediums})! DROP!`, opponent.x, opponent.y - 110, '#ff4477', 20);
          return;
        }
      }

      if (opponent.airComboFramesLeft > 0) {
        opponent.state = 'AIR_HIT';

        const targetHoverY = 235;
        const heightDiff = opponent.y - targetHoverY;
        const controlledLift = heightDiff > 0 ? -4.2 : -2.4;

        opponent.vy = controlledLift;
        opponent.vx = attacker.facing * 0.5;

        if (attacker.y < GameConfig.FLOOR_Y && !move.isJumpCrush) {
          attacker.vy = controlledLift;
          attacker.vx = attacker.facing * 0.5;
          attacker.hasAirAttacked = false;
        }
      } else {
        opponent.vy = 6.5;
        opponent.vx = attacker.facing * 4.5;
        engine.addFloatingText("AIR TIME LIMIT!", opponent.x, opponent.y - 105, '#ff4477', 20);
      }
      return;
    }

    // 4I. Knockdown Move
    if (move.knockdown) {
      opponent.enterKnockdown('QTE');
      applyGroundPushback(move.push || 5, false);
      return;
    }

    // 4J. Standard Ground Hit
    opponent.state = 'HIT';
    opponent.stateTimer = move.hitstun;
    applyGroundPushback(move.push || 3.2, false);
  }
};