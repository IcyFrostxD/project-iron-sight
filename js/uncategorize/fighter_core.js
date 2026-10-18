// js/fighter_combat.js
Object.assign(Fighter.prototype, {
  enterKnockdown(mode = 'QTE', fixedSeconds = 1.0) {
    this.state = 'KNOCKDOWN';
    this.y = GameConfig.FLOOR_Y;
    this.vy = 0;
    this.currentMove = null;
    this.currentMoveKey = null;
    this.groundChainList = [];
    this.airComboFramesLeft = 0;
    this.usedAirUppercut = false;
    this.airActionsLocked = false;
    this.knockdownElapsed = 0;
    this.qteIndex = 0;
    this.qteFailed = false;
    this.wasHitOnGround = false;

    if (mode === 'FIXED') {
      const wakeSec = (GameConfig.KNOCKDOWN && GameConfig.KNOCKDOWN.WAKEUP_DURATION_SECONDS) || 0.5;
      const lieSec = Math.max(0.2, fixedSeconds - wakeSec);
      this.autoWakeupActive = true;
      this.autoWakeupFramesLeft = Math.round(lieSec * 60);
      this.autoWakeupLabel = `CRUSH KNOCKDOWN (${fixedSeconds.toFixed(1)}s)`;
      this.qteSequence = [];
      return;
    }

    if (this.launchCount >= 2 && mode !== 'SWEEP_QTE') {
      this.autoWakeupActive = true;
      this.autoWakeupFramesLeft = 30;
      this.autoWakeupLabel = "2ND LAUNCH: AUTO WAKEUP (1.0s)";
      this.launchImmune = true;
      this.launchImmuneTimer = 300;
      this.qteSequence = [];
      return;
    }

    this.autoWakeupActive = false;
    const pool = (GameConfig.KNOCKDOWN && GameConfig.KNOCKDOWN.QTE_POOL) || ['LP', 'MP', 'HP', 'LK', 'MK', 'HK'];
    const len = (GameConfig.KNOCKDOWN && GameConfig.KNOCKDOWN.QTE_SEQUENCE_LENGTH) || 3;
    this.qteSequence = [];
    for (let i = 0; i < len; i++) {
      const randBtn = pool[Math.floor(Math.random() * pool.length)];
      this.qteSequence.push(randBtn);
    }
  },

  enterWakeup(engine, labelText) {
    this.state = 'WAKEUP';
    const wakeSec = (GameConfig.KNOCKDOWN && GameConfig.KNOCKDOWN.WAKEUP_DURATION_SECONDS) || 0.5;
    this.stateTimer = Math.round(wakeSec * 60);
    this.y = GameConfig.FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.wasHitOnGround = false;
    this.autoWakeupActive = false;
    if (engine && labelText) {
      engine.addFloatingText(labelText, this.x, this.y - 105, '#00ff88', 18);
    }
  },

  canCancel() {
    return this.state === 'ATTACK' && this.currentMove && this.hitConnected && this.currentMove.cancel;
  },

  canChainGroundNormal(nextBtn) {
    if (!this.canCancel() || !this.currentMoveKey) return false;
    if (this.groundChainList.length >= 6) return false;

    const lastBtn = this.groundChainList[this.groundChainList.length - 1] || '';
    const lpCount = this.groundChainList.filter(b => b === 'LP').length;
    const lkCount = this.groundChainList.filter(b => b === 'LK').length;

    if (lastBtn === 'LP' || lastBtn === 'LK') {
      if (nextBtn === 'LP' && lpCount >= 3) return false;
      if (nextBtn === 'LK' && lkCount >= 3) return false;
      return true;
    }
    if (lastBtn === 'MP') {
      return nextBtn === 'LK' || nextBtn === 'MK' || nextBtn === 'HP' || nextBtn === 'HK';
    }
    if (lastBtn === 'MK') {
      return nextBtn === 'LP' || nextBtn === 'MP' || nextBtn === 'HP' || nextBtn === 'HK';
    }
    return false;
  },

  triggerThrowTech(opponent, engine) {
    const techFrames = GameConfig.THROW.TECH_STATE_FRAMES;
    const pushVx = GameConfig.THROW.TECH_PUSHBACK_VX;

    this.state = 'THROW_TECH';
    this.stateTimer = techFrames;
    this.currentMove = null;
    this.currentMoveKey = null;
    this.throwTarget = null;
    this.y = GameConfig.FLOOR_Y;
    this.vx = -this.facing * pushVx;

    opponent.state = 'THROW_TECH';
    opponent.stateTimer = techFrames;
    opponent.currentMove = null;
    opponent.currentMoveKey = null;
    opponent.throwTarget = null;
    opponent.y = GameConfig.FLOOR_Y;
    opponent.vx = -opponent.facing * pushVx;

    const midX = (this.x + opponent.x) / 2;
    const midY = GameConfig.FLOOR_Y - 68;
    engine.triggerThrowTechEffect(midX, midY);
  },

  updateThrowExecution(dt, engine) {
    this.throwTimer += dt;
    const t = this.throwTarget;
    const execDur = GameConfig.THROW.EXEC_DURATION_FRAMES;
    const techWin = GameConfig.THROW.TECH_WINDOW_FRAMES;

    if (this.throwTimer <= techWin) {
      t.x = this.x + this.facing * 42;
      t.y = GameConfig.FLOOR_Y;
      return;
    }

    const progress = (this.throwTimer - techWin) / (execDur - techWin);

    if (this.charKey === 'REN') {
      if (progress < 0.35) {
        t.x = this.x + this.facing * 36;
        t.y = this.y - progress * 260;
      } else if (progress < 0.75) {
        this.y = GameConfig.FLOOR_Y - 140;
        t.x = this.x + Math.sin(progress * 25) * 35;
        t.y = this.y - 20;
      } else {
        this.y = GameConfig.FLOOR_Y;
        t.x = this.x + this.facing * 55;
        t.y = GameConfig.FLOOR_Y;
      }
    } else if (this.charKey === 'KIRA') {
      const ang = progress * Math.PI;
      t.x = this.x + this.facing * Math.cos(ang) * 75;
      t.y = GameConfig.FLOOR_Y - Math.sin(ang) * 130;
    } else {
      if (progress < 0.6) {
        t.x = this.x + this.facing * 15;
        t.y = this.y - 115 - Math.sin(progress * Math.PI) * 35;
      } else {
        t.x = this.x + this.facing * 48;
        t.y = GameConfig.FLOOR_Y - (1 - progress) * 90;
      }
    }

    if (this.throwTimer >= execDur) {
      const throwDmg = GameConfig.THROW.DAMAGE;
      t.hp = Math.max(0, t.hp - throwDmg);
      t.enterKnockdown('QTE');
      t.vx = this.facing * 6;

      this.comboCount = 1;
      this.comboDamage = throwDmg;
      this.state = 'IDLE';
      this.y = GameConfig.FLOOR_Y;
      this.throwTarget = null;

      engine.triggerHitstop(10, 12);
      engine.spawnParticles(t.x, GameConfig.FLOOR_Y - 20, this.data.color, 30, 10);
      engine.addFloatingText(`${this.data.throwName} (-${throwDmg})`, t.x, t.y - 110, '#ffcf33', 22);
    }
  },

  updateAttackState(opponent, dt, engine) {
    const prevTimer = this.moveTimer;
    this.moveTimer += dt;
    const m = this.currentMove;

    if (m.airMove || m.isUppercut) {
      // Maintain airborne trajectory
    } else if (m.dashSpeed && this.moveTimer >= m.startup - 2 && this.moveTimer <= m.startup + m.active) {
      this.vx = this.facing * m.dashSpeed;
    } else if (this.y >= GameConfig.FLOOR_Y) {
      this.vx *= 0.78;
    }

    if (m.projectile && prevTimer < m.startup && this.moveTimer >= m.startup) {
      engine.spawnProjectile(this, m);
      this.hitConnected = true;
    }

    if (m.isFloorSlam && prevTimer < m.startup && this.moveTimer >= m.startup) {
      engine.triggerFloorSlamEffect(this.x + this.facing * 45, GameConfig.FLOOR_Y, this.data.color);
    }

    if (!m.projectile && !this.hasDealtHit && this.moveTimer >= m.startup && this.moveTimer < m.startup + m.active) {
      const dist = Math.abs(opponent.x - this.x);
      const vDist = Math.abs(opponent.y - this.y);
      const inFront = (opponent.x - this.x) * this.facing >= -20;

      // Critical: Only Floor Slam (2HP) or grounded Hard Kick (2HK / 5HK) can affect a downed opponent
      const targetIsDown = (opponent.state === 'KNOCKDOWN' || opponent.state === 'OTG_HIT');
      const isAllowedGroundedHit = !m.airMove && !m.isJumpCrush && (
        m.isFloorSlam ||
        this.currentMoveKey === '2HP' ||
        this.currentMoveKey === '2HK' ||
        this.currentMoveKey === '5HK'
      );
      const canHitTargetState = opponent.state !== 'WAKEUP' &&
                                opponent.state !== 'THROWN' &&
                                opponent.state !== 'THROW_TECH' &&
                                (!targetIsDown || isAllowedGroundedHit);

      if (inFront && dist <= m.reach && vDist <= 125 && canHitTargetState) {
        if (!opponent.currentMove || !opponent.currentMove.invuln) {
          this.resolveHit(opponent, m, engine);
        }
      }
    }

    if (this.moveTimer >= m.startup + m.active + m.recovery) {
      this.state = (this.y < GameConfig.FLOOR_Y) ? 'JUMP' : 'IDLE';
      this.currentMove = null;
      this.currentMoveKey = null;
      this.groundChainList = [];

      if (opponent.state === 'OTG_HIT') {
        opponent.enterWakeup(engine, "OTG RECOVERY (0.5s)!");
      }
    }
  },

  resolveHit(opponent, move, engine) {
    this.hasDealtHit = true;
    this.hitConnected = true;

    const wasTargetDown = (opponent.state === 'KNOCKDOWN' || opponent.state === 'OTG_HIT');
    const wasTargetAirborne = (opponent.y < GameConfig.FLOOR_Y || opponent.state === 'AIR_HIT');

    if (wasTargetDown) {
      const isAllowedGroundedHit = !move.airMove && !move.isJumpCrush && (
        move.isFloorSlam ||
        this.currentMoveKey === '2HP' ||
        this.currentMoveKey === '2HK' ||
        this.currentMoveKey === '5HK'
      );
      if (!isAllowedGroundedHit) return;
    }

    const applyGroundPushback = (basePush, isBlock = false) => {
      this.groundPushCount++;
      const progressivePush = basePush + this.groundPushCount * 1.35;
      opponent.vx = this.facing * progressivePush;
      this.vx = -this.facing * (progressivePush * (isBlock ? 0.55 : 0.42));
    };

    // 1. Perfect Block (LT / Key H)
    const isOpponentPerfectBlocking = (opponent.state === 'PERFECT_BLOCK' || opponent.holdingPerfectBlock);
    if (isOpponentPerfectBlocking && !move.isThrow) {
      opponent.state = 'PERFECT_BLOCK';
      applyGroundPushback((move.push || 4) * GameConfig.PERFECT_BLOCK.PUSHBACK_MULT, true);
      const chipDmg = opponent.maxHp * (GameConfig.PERFECT_BLOCK.CHIP_DAMAGE_MAX_HP_PERCENT / 100);
      opponent.hp = Math.max(1, Number((opponent.hp - chipDmg).toFixed(2)));

      engine.triggerHitstop(7, 3);
      engine.spawnParticles(opponent.x - this.facing * 22, opponent.y - 60, '#00ff88', 20, 7);
      engine.addFloatingText(`PERFECT BLOCK (-${chipDmg.toFixed(2)} HP)`, opponent.x, opponent.y - 105, '#00ff88', 18);
      return;
    }

    // 2. Throw & Throw Tech Check
    if (move.isThrow) {
      if (opponent.y < GameConfig.FLOOR_Y - 10) return;

      const recentGrabDelta = Math.abs(engine.frameCount - opponent.lastGrabPressFrame);
      const opponentGrabbing = (opponent.state === 'ATTACK' && opponent.currentMove && opponent.currentMove.isThrow);
      if (opponentGrabbing || recentGrabDelta <= GameConfig.THROW.TECH_WINDOW_FRAMES) {
        this.triggerThrowTech(opponent, engine);
        return;
      }

      this.state = 'THROW_EXEC';
      this.throwTimer = 0;
      this.throwTarget = opponent;
      opponent.state = 'THROWN';
      opponent.currentMove = null;
      opponent.vx = 0;
      opponent.vy = 0;
      engine.triggerHitstop(5, 3);
      engine.addFloatingText("GRAB! (TECH WINDOW)", this.x, this.y - 105, '#ffcf33', 18);
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

      this.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, this.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_BLOCK);
      engine.triggerHitstop(5, 3);
      engine.spawnParticles(opponent.x - this.facing * 15, opponent.y - 60, '#44aaff', 12, 5);
      engine.addFloatingText(`GUARD (-${chipDmg.toFixed(2)} HP)`, opponent.x, opponent.y - 95, '#66ccff', 16);
      return;
    }

    // 4. Clean Hit & Air Combo Damage Scaling
    this.comboCount++;
    let dmgMult = 1.0;
    if (wasTargetAirborne || move.airMove) {
      dmgMult = this.airDamageMultiplier;
    }
    const finalDmg = Math.max(6, Math.round(move.dmg * dmgMult));
    this.comboDamage += finalDmg;
    opponent.hp = Math.max(0, Number((opponent.hp - finalDmg).toFixed(2)));

    this.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, this.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HIT);
    opponent.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, opponent.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HURT);

    engine.triggerHitstop(move.launcher || move.isUppercut || move.superLevel ? 9 : 5, move.launcher || move.isUppercut ? 8 : 3);
    engine.spawnParticles((this.x + opponent.x) / 2, opponent.y - 45, this.data.color, 18, 7);

    // 4A. Heavy Jump Crush (82HK) on Standing/Crouching Opponent -> 1.0s Fixed Knockdown
    if (move.isJumpCrush && !wasTargetAirborne && !wasTargetDown) {
      const kdSec = move.fixedKnockdownSec || 1.0;
      opponent.enterKnockdown('FIXED', kdSec);
      opponent.vx = this.facing * 3.5;
      engine.addFloatingText(`JUMP CRUSH! (${kdSec.toFixed(1)}s KNOCKDOWN)`, opponent.x, opponent.y - 110, '#ffaa00', 20);
      return;
    }

    // 4B. Heavy Leg Sweep (2HK) on Standing/Crouching Opponent -> QTE Knockdown
    if (move.isHeavySweep && !wasTargetAirborne && !wasTargetDown) {
      opponent.enterKnockdown('SWEEP_QTE');
      applyGroundPushback(move.push || 5, false);
      engine.addFloatingText("SWEEP KNOCKDOWN! (INPUT QTE)", opponent.x, opponent.y - 110, '#ff4477', 20);
      return;
    }

    // 4C. Uppercut Finisher (623P / 8_623P)
    if (move.isUppercut) {
      opponent.state = 'AIR_HIT';
      opponent.airComboFramesLeft = 0;
      opponent.vy = -8.5;
      opponent.vx = this.facing * 5.5;
      opponent.y = Math.min(opponent.y, GameConfig.FLOOR_Y - 14);
      engine.addFloatingText("UPPERCUT FINISH!!", opponent.x, opponent.y - 115, '#00ffcc', 22);
      return;
    }

    // 4D. Floor Slam (2HP) & 3-Step Launcher Nerf Check
    const canLaunchTarget = move.launcher && !opponent.launchImmune && opponent.launchCount < 2;
    if (move.launcher && !canLaunchTarget && !wasTargetAirborne) {
      engine.addFloatingText("LAUNCH IMMUNE! (NORMAL HIT)", opponent.x, opponent.y - 115, '#ffaa00', 18);
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

    // 4E. Grounded Hard Kick OTG Strike (2HK / 5HK on Downed Opponent)
    if (wasTargetDown && !canLaunchTarget) {
      opponent.state = 'OTG_HIT';
      opponent.wasHitOnGround = true;
      opponent.stateTimer = 24;
      applyGroundPushback(3.5, false);
      engine.addFloatingText(`HARD KICK OTG! (-${finalDmg})`, opponent.x, opponent.y - 90, '#ffaa00', 20);
      return;
    }

    // 4F. Floor Slam (2HP) Bounce Launch
    if (canLaunchTarget && !wasTargetAirborne) {
      opponent.launchCount++;
      opponent.state = 'AIR_HIT';
      opponent.juggleCount = 1;
      opponent.airComboMaxFrames = this.maxAirComboFrames;
      opponent.airComboFramesLeft = this.maxAirComboFrames;

      opponent.vy = -7.2;
      opponent.vx = this.facing * 1.2;
      opponent.y = Math.min(opponent.y, GameConfig.FLOOR_Y - 14);

      const bounceTag = move.groundBounce ? "FLOOR SLAM BOUNCE!" : "LAUNCH!";
      const launchLabel = opponent.launchCount === 1
        ? `${bounceTag} 1/2 (${(this.maxAirComboFrames / 60).toFixed(1)}s AIR)`
        : `${bounceTag} 2/2 (FAST WAKEUP NEXT)`;
      engine.addFloatingText(launchLabel, opponent.x, opponent.y - 110, '#00ffcc', 20);
      return;
    }

    // 4G. Mid-Air Combo Hit
    if (wasTargetAirborne) {
      opponent.juggleCount++;
      if (opponent.airComboFramesLeft > 0) {
        opponent.state = 'AIR_HIT';

        const targetHoverY = 235;
        const heightDiff = opponent.y - targetHoverY;
        const controlledLift = heightDiff > 0 ? -4.2 : -2.4;

        opponent.vy = controlledLift;
        opponent.vx = this.facing * 0.5;

        if (this.y < GameConfig.FLOOR_Y && !move.isJumpCrush) {
          this.vy = controlledLift;
          this.vx = this.facing * 0.5;
          this.hasAirAttacked = false;
        }
      } else {
        opponent.vy = 6.5;
        opponent.vx = this.facing * 4.5;
        engine.addFloatingText("AIR TIME LIMIT!", opponent.x, opponent.y - 105, '#ff4477', 20);
      }
      return;
    }

    // 4H. Knockdown Move
    if (move.knockdown) {
      opponent.enterKnockdown('QTE');
      applyGroundPushback(move.push || 5, false);
      return;
    }

    // 4I. Standard Ground Hit
    opponent.state = 'HIT';
    opponent.stateTimer = move.hitstun;
    applyGroundPushback(move.push || 3.2, false);
  }
});