// js/fighter.js
class Fighter {
  constructor(playerNum, charKey, x, facing) {
    this.playerNum = playerNum;
    this.charKey = charKey;
    this.data = CHARACTERS[charKey];
    this.x = x;
    this.y = GameConfig.FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;

    this.maxHp = this.data.hp;
    this.hp = this.maxHp;
    this.syncLiveConfig();
    this.hp = this.maxHp;

    this.drive = GameConfig.GAUGES.MAX_DRIVE;
    this.superMeter = GameConfig.GAUGES.INITIAL_SUPER;

    // States: IDLE, WALK, CROUCH, JUMP, DASH, ATTACK, THROW_EXEC, THROWN, THROW_TECH,
    // HIT, BLOCK, PERFECT_BLOCK, AIR_HIT, KNOCKDOWN, OTG_HIT, WAKEUP, VICTORY
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.dashTimer = 0;
    this.dashDir = 1;
    this.afterimages = [];

    this.currentMoveKey = null;
    this.currentMove = null;
    this.moveTimer = 0;
    this.hitConnected = false;
    this.hasDealtHit = false;
    this.hasAirAttacked = false;

    // Air Combo Window Tracking (Controlled by Attacker's maxAirComboFrames)
    this.airComboFramesLeft = 0;
    this.airComboMaxFrames = 0;

    // Knockdown QTE & OTG Tracking
    this.knockdownElapsed = 0;
    this.qteSequence = [];
    this.qteIndex = 0;
    this.qteFailed = false;
    this.wasHitOnGround = false;

    this.throwTimer = 0;
    this.throwTarget = null;
    this.lastGrabPressFrame = -99;

    this.comboCount = 0;
    this.comboDamage = 0;
    this.juggleCount = 0;
    this.wallSplatted = false;

    this.holdingBack = false;
    this.holdingDown = false;
    this.holdingPerfectBlock = false;
    this.motionBuffer = new MotionBuffer();
    this.lastMoveBanner = "";
    this.bannerTimer = 0;
    this.animTick = 0;
  }

  syncLiveConfig() {
    const cfgStats = GameConfig.CHARACTER_STATS[this.charKey] || {};
    const prevMax = this.maxHp || this.data.hp;
    this.maxHp = cfgStats.hp || this.data.hp;
    if (this.hp > this.maxHp || this.hp === prevMax) {
      this.hp = this.maxHp;
    }

    this.walkForwardSpeed = (cfgStats.walkForwardSpeed || this.data.walkSpeed) *
                            GameConfig.WALK.GLOBAL_SPEED_MULT * GameConfig.WALK.FORWARD_SPEED_MULT;
    this.walkBackwardSpeed = (cfgStats.walkBackwardSpeed || (this.data.walkSpeed * 0.85)) *
                             GameConfig.WALK.GLOBAL_SPEED_MULT * GameConfig.WALK.BACKWARD_SPEED_MULT;
    this.dashForwardSpeed = cfgStats.dashForwardSpeed || this.data.dashSpeed;
    this.dashBackwardSpeed = cfgStats.dashBackwardSpeed || (this.data.dashSpeed * 0.85);
    this.jumpForce = cfgStats.jumpForce || this.data.jumpForce;

    // Character-specific Air Combo duration (capped at 6.0s) and air damage multiplier
    const maxSec = Math.min(GameConfig.AIR_COMBO.MAX_CAP_SECONDS, cfgStats.maxAirComboSeconds || 4.0);
    this.maxAirComboFrames = Math.round(maxSec * 60);
    this.airDamageMultiplier = cfgStats.airDamageMultiplier || 0.75;

    if (this.data.moves['GRAB']) {
      Object.assign(this.data.moves['GRAB'], {
        startup: GameConfig.THROW.STARTUP,
        active: GameConfig.THROW.ACTIVE,
        recovery: GameConfig.THROW.RECOVERY,
        dmg: GameConfig.THROW.DAMAGE,
        reach: GameConfig.THROW.REACH
      });
    }
    if (this.data.moves['REVERSAL']) {
      Object.assign(this.data.moves['REVERSAL'], {
        startup: GameConfig.REVERSAL.STARTUP,
        active: GameConfig.REVERSAL.ACTIVE,
        recovery: GameConfig.REVERSAL.RECOVERY,
        dmg: GameConfig.REVERSAL.DAMAGE,
        reach: GameConfig.REVERSAL.REACH,
        vx: GameConfig.REVERSAL.KNOCKBACK_VX,
        vy: GameConfig.REVERSAL.LAUNCH_VY
      });
    }
  }

  resetForNextRound(x, facing, keepSuper) {
    this.syncLiveConfig();
    this.x = x;
    this.y = GameConfig.FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.maxHp;
    this.drive = GameConfig.GAUGES.MAX_DRIVE;
    if (!keepSuper) {
      this.superMeter = GameConfig.GAUGES.INITIAL_SUPER;
    }
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.currentMove = null;
    this.currentMoveKey = null;
    this.throwTarget = null;
    this.airComboFramesLeft = 0;
    this.comboCount = 0;
    this.comboDamage = 0;
    this.juggleCount = 0;
    this.wallSplatted = false;
    this.afterimages = [];
  }

  // Critical: Enters Knockdown and generates a random 3-button QTE sequence (e.g., LP -> HK -> LK)
  enterKnockdown() {
    this.state = 'KNOCKDOWN';
    this.y = GameConfig.FLOOR_Y;
    this.vy = 0;
    this.currentMove = null;
    this.currentMoveKey = null;
    this.airComboFramesLeft = 0;
    this.knockdownElapsed = 0;
    this.qteIndex = 0;
    this.qteFailed = false;
    this.wasHitOnGround = false;

    const pool = GameConfig.KNOCKDOWN.QTE_POOL;
    const len = GameConfig.KNOCKDOWN.QTE_SEQUENCE_LENGTH;
    this.qteSequence = [];
    for (let i = 0; i < len; i++) {
      const randBtn = pool[Math.floor(Math.random() * pool.length)];
      this.qteSequence.push(randBtn);
    }
  }

  // Critical: Transitions into the 0.5-second (30 frames) Wake-up Animation
  enterWakeup(engine, labelText) {
    this.state = 'WAKEUP';
    this.stateTimer = Math.round(GameConfig.KNOCKDOWN.WAKEUP_DURATION_SECONDS * 60);
    this.y = GameConfig.FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.wasHitOnGround = false;
    if (engine && labelText) {
      engine.addFloatingText(labelText, this.x, this.y - 105, '#00ff88', 18);
    }
  }

  canCancel() {
    return this.state === 'ATTACK' && this.currentMove && this.hitConnected && this.currentMove.cancel;
  }

  startMove(moveKey) {
    const moveObj = this.data.moves[moveKey];
    if (!moveObj) return false;

    this.currentMoveKey = moveKey;
    this.currentMove = moveObj;
    this.state = 'ATTACK';
    this.moveTimer = 0;
    this.hitConnected = false;
    this.hasDealtHit = false;

    if (moveObj.airMove) {
      this.hasAirAttacked = true;
    }

    this.lastMoveBanner = moveObj.name;
    this.bannerTimer = 70;
    return true;
  }

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
  }

  processInput(input, frameCount, opponent, engine) {
    const { dashTriggered } = this.motionBuffer.record(input, frameCount);
    const isAirborne = (this.y < GameConfig.FLOOR_Y);

    if (input.grabTriggered) {
      this.lastGrabPressFrame = frameCount;
    }

    // 1. Throw Escape (Throw Tech) while grabbed
    if (this.state === 'THROWN' && opponent.state === 'THROW_EXEC') {
      if (input.grabTriggered && opponent.throwTimer <= GameConfig.THROW.TECH_WINDOW_FRAMES) {
        this.triggerThrowTech(opponent, engine);
        return;
      }
      return;
    }

    // 2. Critical: Knockdown State Handling (2-Bar Ground Reversal OR 3-Button QTE Wake-up)
    if (this.state === 'KNOCKDOWN' || this.state === 'OTG_HIT') {
      // 2A. Ground Reversal (Costs 2 Super Bars = 200 points) to counter incoming Launchers/OTG attacks!
      if (input.reversalTriggered && this.superMeter >= GameConfig.REVERSAL.SUPER_COST) {
        this.superMeter -= GameConfig.REVERSAL.SUPER_COST;
        this.wasHitOnGround = false;
        this.startMove('REVERSAL');
        engine.triggerReversalEffect(this);
        return;
      }

      // 2B. Knockdown 3-Button QTE Sequence Check (Within 2.0s window)
      if (this.state === 'KNOCKDOWN' && !this.qteFailed) {
        const pressedBtn = input.LP ? 'LP' : input.MP ? 'MP' : input.HP ? 'HP'
                         : input.LK ? 'LK' : input.MK ? 'MK' : input.HK ? 'HK' : null;
        if (pressedBtn) {
          const expectedBtn = this.qteSequence[this.qteIndex];
          if (pressedBtn === expectedBtn) {
            this.qteIndex++;
            engine.spawnParticles(this.x, this.y - 40, '#00ff88', 6, 4);
            if (this.qteIndex >= this.qteSequence.length) {
              // Completed all 3 buttons within 2.0s -> Immediate 0.5s Wake-up!
              this.enterWakeup(engine, "QUICK WAKEUP (0.5s)!");
              return;
            }
          } else {
            // Wrong button resets progress back to first button in sequence
            this.qteIndex = 0;
            engine.addFloatingText("QTE RESET!", this.x, this.y - 95, '#ff4477', 15);
          }
        }
      }
      return;
    }

    if (this.state === 'WAKEUP') {
      return;
    }

    // 3. Perfect Block Mode (LT / Key H) - Drains 0.546 per frame, requires >= 100 Super Meter
    const canEnterPerfectBlock = !isAirborne && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH' || this.state === 'DASH');
    if (input.perfectBlockHold) {
      if (this.state === 'PERFECT_BLOCK') {
        if (this.superMeter > 0) {
          this.holdingPerfectBlock = true;
          this.vx *= 0.5;
          return;
        } else {
          this.holdingPerfectBlock = false;
          this.state = 'IDLE';
          engine.addFloatingText("SUPER GAUGE EMPTY!", this.x, this.y - 110, '#ff4477', 16);
        }
      } else if (canEnterPerfectBlock && this.superMeter >= GameConfig.PERFECT_BLOCK.MIN_SUPER_REQ) {
        this.state = 'PERFECT_BLOCK';
        this.holdingPerfectBlock = true;
        this.vx *= 0.5;
        return;
      }
    } else {
      this.holdingPerfectBlock = false;
      if (this.state === 'PERFECT_BLOCK') {
        this.state = 'IDLE';
      }
    }

    const isGroundNeutral = !isAirborne && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH' || this.state === 'DASH');
    const isAirNeutral = isAirborne && (this.state === 'JUMP' && !this.hasAirAttacked);
    const canCancelNow = this.canCancel();

    // 4. Super Arts (Ground only)
    if (!isAirborne && (isGroundNeutral || (this.state === 'ATTACK' && this.hitConnected)) && (input.anyPunch || input.anyKick)) {
      const superMotion = this.motionBuffer.detectSuperMotion(frameCount);
      const gCfg = GameConfig.GAUGES;

      if (superMotion === '214214' && input.anyPunch && this.superMeter >= gCfg.SUPER_LV3_COST) {
        this.superMeter -= gCfg.SUPER_LV3_COST;
        this.motionBuffer.clearMotions();
        this.startMove('SUPER_3');
        engine.triggerSuperFreeze(this, 3, this.currentMove.name);
        return;
      }
      if (superMotion === '236236' && input.anyKick && this.superMeter >= gCfg.SUPER_LV2_COST) {
        this.superMeter -= gCfg.SUPER_LV2_COST;
        this.motionBuffer.clearMotions();
        this.startMove('SUPER_2');
        engine.triggerSuperFreeze(this, 2, this.currentMove.name);
        return;
      }
      if (superMotion === '236236' && input.anyPunch && this.superMeter >= gCfg.SUPER_LV1_COST) {
        this.superMeter -= gCfg.SUPER_LV1_COST;
        this.motionBuffer.clearMotions();
        this.startMove('SUPER_1');
        engine.triggerSuperFreeze(this, 1, this.currentMove.name);
        return;
      }
    }

    // 5. Exclusive Throw Input (LP + LK)
    if (input.grabTriggered) {
      if (isGroundNeutral) {
        this.startMove('GRAB');
      }
      return;
    }

    // 6. Double-Tap (66/44) or Button Dash
    if (dashTriggered && !isAirborne && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH')) {
      const isForwardDash = (dashTriggered === 6);
      this.state = 'DASH';
      this.dashTimer = isForwardDash ? GameConfig.DASH.FORWARD_DURATION_FRAMES : GameConfig.DASH.BACKWARD_DURATION_FRAMES;
      this.dashDir = isForwardDash ? this.facing : -this.facing;
      this.vx = this.dashDir * (isForwardDash ? this.dashForwardSpeed : this.dashBackwardSpeed);
      engine.spawnParticles(this.x, this.y - 15, this.data.color, 10, 5);
      engine.addFloatingText(isForwardDash ? "DASH" : "BACKDASH", this.x, this.y - 105, this.data.color, 16);
      return;
    }

    // 7. Attacks (Launchers, Grounded OTG Attacks, and Jumping Air Combo Attacks)
    const btn = input.HP ? 'HP' : input.MP ? 'MP' : input.LP ? 'LP'
              : input.HK ? 'HK' : input.MK ? 'MK' : input.LK ? 'LK' : null;

    if (btn) {
      // 7A. Airborne Air Combo Attacks (Can chain any air attack during Air Combo window!)
      if (isAirborne && (isAirNeutral || canCancelNow)) {
        if (this.data.moves['8' + btn]) {
          this.startMove('8' + btn);
          return;
        }
      }

      // 7B. Grounded Launchers, OTG Moves, and Normals
      if (!isAirborne && (isGroundNeutral || canCancelNow)) {
        const specialMotion = this.motionBuffer.detectSpecialMotion(frameCount);
        const pOrK = btn.endsWith('P') ? 'P' : 'K';
        if (specialMotion && this.data.moves[specialMotion + pOrK]) {
          this.motionBuffer.clearMotions();
          this.startMove(specialMotion + pOrK);
          engine.addFloatingText(this.currentMove.name, this.x, this.y - 115, '#00f0ff', 18);
          return;
        }

        if (input.down && this.data.moves['2' + btn]) {
          this.startMove('2' + btn);
          return;
        }
        if (this.data.moves['5' + btn]) {
          this.startMove('5' + btn);
          return;
        }
      }
    }

    // 8. Walk, Crouch, Jump Initiation (Can jump-cancel after launching opponent!)
    const canJumpCancelLauncher = (this.state === 'ATTACK' && this.currentMove && this.currentMove.launcher && this.hitConnected);
    if (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH' || canJumpCancelLauncher) {
      if (input.up && this.y >= GameConfig.FLOOR_Y) {
        this.vy = -this.jumpForce;
        this.state = 'JUMP';
        this.currentMove = null;
        this.currentMoveKey = null;
        this.hasAirAttacked = false;
        if (input.forward || canJumpCancelLauncher) this.vx = this.facing * (this.walkForwardSpeed * GameConfig.JUMP_FORWARD_SPEED_MULT);
        else if (input.back) this.vx = -this.facing * (this.walkBackwardSpeed * GameConfig.JUMP_BACKWARD_SPEED_MULT);
      } else if (!canJumpCancelLauncher) {
        if (input.down) {
          this.state = 'CROUCH';
          this.vx *= GameConfig.CROUCH_FRICTION;
        } else if (input.forward) {
          this.state = 'WALK';
          this.vx = this.facing * this.walkForwardSpeed;
        } else if (input.back) {
          this.state = 'WALK';
          this.vx = -this.facing * this.walkBackwardSpeed;
        } else {
          this.state = 'IDLE';
          this.vx *= GameConfig.FRICTION;
        }
      }
    }
  }

  update(opponent, dt, input, engine) {
    this.animTick += dt;
    this.holdingBack = input.back;
    this.holdingDown = input.down;

    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= GameConfig.DASH.AFTERIMAGE_FADE_SPEED * dt;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
    }

    // Drain Super Meter by 0.546 per frame while holding Perfect Block (LT)
    if (this.state === 'PERFECT_BLOCK') {
      this.superMeter = Math.max(0, this.superMeter - GameConfig.PERFECT_BLOCK.DRAIN_PER_FRAME * dt);
      if (this.superMeter <= 0) {
        this.holdingPerfectBlock = false;
        this.state = 'IDLE';
      }
    }

    for (let i = this.motionBuffer.visualHistory.length - 1; i >= 0; i--) {
      this.motionBuffer.visualHistory[i].life -= dt;
      if (this.motionBuffer.visualHistory[i].life <= 0) {
        this.motionBuffer.visualHistory.splice(i, 1);
      }
    }

    // Handle 0.5-Second (30 frames) Wake-up Animation State
    if (this.state === 'WAKEUP') {
      this.stateTimer -= dt;
      this.vx *= 0.8;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.juggleCount = 0;
        this.wallSplatted = false;
        opponent.comboCount = 0;
        opponent.comboDamage = 0;
      }
      return;
    }

    // Handle Knockdown QTE Timer (2.0s window -> +2.0s penalty = 4.0s total)
    if (this.state === 'KNOCKDOWN') {
      this.knockdownElapsed += dt;
      this.vx *= 0.85;
      const qteWinFrames = Math.round(GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS * 60);
      const totalPenaltyFrames = Math.round((GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS + GameConfig.KNOCKDOWN.PENALTY_ADD_SECONDS) * 60);

      if (!this.qteFailed && this.knockdownElapsed >= qteWinFrames) {
        this.qteFailed = true;
        engine.addFloatingText("QTE FAILED! +2.0s PENALTY", this.x, this.y - 105, '#ff2255', 18);
      }

      if (this.knockdownElapsed >= totalPenaltyFrames) {
        this.enterWakeup(engine, "WAKEUP (0.5s)");
      }
      return;
    }

    // Handle Grounded OTG Hit State: Wake up immediately (in 0.5s) as soon as attacker finishes their grounded attack!
    if (this.state === 'OTG_HIT') {
      this.stateTimer -= dt;
      this.vx *= 0.82;
      const attackerFinishedOtg = (opponent.state !== 'ATTACK');
      if (attackerFinishedOtg || this.stateTimer <= 0) {
        this.enterWakeup(engine, "OTG RECOVERY (0.5s)!");
      }
      return;
    }

    if (this.state === 'DASH') {
      this.dashTimer -= dt;
      if (Math.floor(this.dashTimer) % GameConfig.DASH.AFTERIMAGE_INTERVAL_FRAMES === 0) {
        this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.45 });
      }
      if (this.dashTimer <= 0) {
        this.state = 'IDLE';
        this.vx *= GameConfig.DASH.END_VELOCITY_DAMPING;
      }
    }

    if (this.state === 'THROW_TECH') {
      this.stateTimer -= dt;
      this.vx *= 0.88;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.vx = 0;
      }
    }

    // Character-Specific Throw Execution
    if (this.state === 'THROW_EXEC' && this.throwTarget) {
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
        t.enterKnockdown();
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
      return;
    }

    if (this.state === 'THROWN') {
      return;
    }

    if (this.y >= GameConfig.FLOOR_Y && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH' || this.state === 'PERFECT_BLOCK')) {
      this.facing = (opponent.x >= this.x) ? 1 : -1;
    }

    // Attack State Execution
    if (this.state === 'ATTACK' && this.currentMove) {
      this.moveTimer += dt;
      const m = this.currentMove;

      if (m.airMove) {
        // Maintain airborne control
      } else if (m.dashSpeed && this.moveTimer >= m.startup - 2 && this.moveTimer <= m.startup + m.active) {
        this.vx = this.facing * m.dashSpeed;
      } else if (this.y >= GameConfig.FLOOR_Y) {
        this.vx *= 0.78;
      }

      // Active Hitbox Check (Supports hitting standing, airborne, or grounded OTG targets)
      if (!this.hasDealtHit && this.moveTimer >= m.startup && this.moveTimer < m.startup + m.active) {
        const dist = Math.abs(opponent.x - this.x);
        const vDist = Math.abs(opponent.y - this.y);
        const inFront = (opponent.x - this.x) * this.facing >= -20;

        const targetIsDown = (opponent.state === 'KNOCKDOWN' || opponent.state === 'OTG_HIT');
        const canHitTargetState = opponent.state !== 'WAKEUP' && opponent.state !== 'THROWN' && opponent.state !== 'THROW_TECH' &&
                                  (!targetIsDown || m.hitsGrounded);

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

        // If opponent was in OTG_HIT waiting for this grounded attack to end, trigger their 0.5s wake-up now!
        if (opponent.state === 'OTG_HIT') {
          opponent.enterWakeup(engine, "OTG RECOVERY (0.5s)!");
        }
      }
    }

    if (this.state === 'HIT' || this.state === 'BLOCK') {
      this.stateTimer -= dt;
      this.vx *= 0.86;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.juggleCount = 0;
        this.wallSplatted = false;
        opponent.comboCount = 0;
        opponent.comboDamage = 0;
      }
    }

    // Air Combo Window Countdown
    if (this.state === 'AIR_HIT' && this.airComboFramesLeft > 0) {
      this.airComboFramesLeft = Math.max(0, this.airComboFramesLeft - dt);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Apply reduced gravity during active Air Combo window so air combos feel smooth and responsive
    if (this.y < GameConfig.FLOOR_Y) {
      const inAirCombo = (this.state === 'AIR_HIT' && this.airComboFramesLeft > 0) ||
                         (opponent.state === 'AIR_HIT' && opponent.airComboFramesLeft > 0);
      const grav = inAirCombo ? GameConfig.AIR_COMBO_GRAVITY : GameConfig.GRAVITY;
      this.vy += grav * dt;
    } else {
      this.y = GameConfig.FLOOR_Y;
      this.vy = 0;
      this.hasAirAttacked = false;

      if (this.state === 'AIR_HIT') {
        this.enterKnockdown();
        engine.triggerHitstop(0, 6);
        engine.spawnParticles(this.x, GameConfig.FLOOR_Y, '#ffffff', 12, 5);
      } else if (this.state === 'JUMP') {
        this.state = 'IDLE';
      } else if (this.state === 'ATTACK' && this.currentMove && this.currentMove.airMove) {
        this.state = 'IDLE';
        this.currentMove = null;
        this.currentMoveKey = null;
      }
    }

    // Stage Wall Boundaries
    if (this.x <= GameConfig.STAGE_LEFT || this.x >= GameConfig.STAGE_RIGHT) {
      this.x = Math.max(GameConfig.STAGE_LEFT, Math.min(GameConfig.STAGE_RIGHT, this.x));
      this.vx = 0;
    }

    const pushW = GameConfig.FIGHTER_PUSHBOX_WIDTH;
    if (this.state !== 'THROW_EXEC' && opponent.state !== 'THROW_EXEC' && Math.abs(this.x - opponent.x) < pushW && Math.abs(this.y - opponent.y) < 65) {
      const pushDir = (this.x < opponent.x) ? -1 : 1;
      this.x += pushDir * 2.5;
      opponent.x -= pushDir * 2.5;
    }
  }

  resolveHit(opponent, move, engine) {
    this.hasDealtHit = true;
    this.hitConnected = true;

    // 1. Perfect Block (LT / Key H) - Blocks 100% of attacks, reduces HP by only 0.15% of Max HP
    const isOpponentPerfectBlocking = (opponent.state === 'PERFECT_BLOCK' || opponent.holdingPerfectBlock);
    if (isOpponentPerfectBlocking && !move.isThrow) {
      opponent.state = 'PERFECT_BLOCK';
      opponent.vx = this.facing * ((move.push || 6) * GameConfig.PERFECT_BLOCK.PUSHBACK_MULT);
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

    // 3. Normal Directional Guard (Reduces HP by 0.15% of Max HP)
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
      opponent.vx = this.facing * ((move.push || 5) * GameConfig.BLOCK.PUSHBACK_MULT);

      const chipDmg = opponent.maxHp * (GameConfig.BLOCK.CHIP_DAMAGE_MAX_HP_PERCENT / 100);
      opponent.hp = Math.max(1, Number((opponent.hp - chipDmg).toFixed(2)));

      this.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, this.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_BLOCK);
      engine.triggerHitstop(5, 3);
      engine.spawnParticles(opponent.x - this.facing * 15, opponent.y - 60, '#44aaff', 12, 5);
      engine.addFloatingText(`GUARD (-${chipDmg.toFixed(2)} HP)`, opponent.x, opponent.y - 95, '#66ccff', 16);
      return;
    }

    // 4. Clean Hit & Character-Specific Air Combo Damage Scaling
    this.comboCount++;
    const wasTargetDown = (opponent.state === 'KNOCKDOWN' || opponent.state === 'OTG_HIT');
    const wasTargetAirborne = (opponent.y < GameConfig.FLOOR_Y || opponent.state === 'AIR_HIT');

    // Apply character-specific airDamageMultiplier when hitting an airborne opponent
    let dmgMult = 1.0;
    if (wasTargetAirborne || move.airMove) {
      dmgMult = this.airDamageMultiplier;
    }
    const finalDmg = Math.max(6, Math.round(move.dmg * dmgMult));
    this.comboDamage += finalDmg;
    opponent.hp = Math.max(0, Number((opponent.hp - finalDmg).toFixed(2)));

    this.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, this.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HIT);
    opponent.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, opponent.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HURT);

    engine.triggerHitstop(move.launcher || move.superLevel ? 10 : 6, move.launcher ? 9 : 4);
    engine.spawnParticles((this.x + opponent.x) / 2, opponent.y - 45, this.data.color, 20, 8);

    // 4A. Grounded OTG Strike (Target is lying on ground and hit by non-launcher OTG move)
    if (wasTargetDown && !move.launcher) {
      opponent.state = 'OTG_HIT';
      opponent.wasHitOnGround = true;
      opponent.stateTimer = 24;
      opponent.vx = this.facing * 3.5;
      engine.addFloatingText(`OTG HIT! (-${finalDmg})`, opponent.x, opponent.y - 90, '#ffaa00', 20);
      return;
    }

    // 4B. Launcher Hit (Starts the Character's Air Combo Timer up to 6.0s!)
    if (move.launcher) {
      opponent.state = 'AIR_HIT';
      opponent.juggleCount = 1;
      opponent.airComboMaxFrames = this.maxAirComboFrames;
      opponent.airComboFramesLeft = this.maxAirComboFrames;
      opponent.vy = -7.8;
      opponent.vx = this.facing * (move.vx || 2.5);
      opponent.y = Math.min(opponent.y, GameConfig.FLOOR_Y - 12);
      const maxSecText = (this.maxAirComboFrames / 60).toFixed(1);
      engine.addFloatingText(`LAUNCH! (${maxSecText}s AIR COMBO)`, opponent.x, opponent.y - 110, '#00ffcc', 21);
      return;
    }

    // 4C. Mid-Air Combo Follow-up Hit
    if (wasTargetAirborne) {
      opponent.juggleCount++;
      if (opponent.airComboFramesLeft > 0) {
        // Keep both attacker and victim suspended while Air Combo timer remains!
        opponent.state = 'AIR_HIT';
        opponent.vy = GameConfig.AIR_COMBO.VICTIM_AIR_FLOAT_VY;
        opponent.vx = this.facing * GameConfig.AIR_COMBO.VICTIM_AIR_PUSH_VX;
        if (this.y < GameConfig.FLOOR_Y) {
          this.vy = GameConfig.AIR_COMBO.ATTACKER_AIR_BOUNCE_VY;
          this.hasAirAttacked = false; // Allow chaining next air attack before landing!
        }
      } else {
        // Air Combo timer expired -> Knock opponent down to floor
        opponent.vy = 6.0;
        opponent.vx = this.facing * 6.0;
        engine.addFloatingText("AIR TIME LIMIT!", opponent.x, opponent.y - 105, '#ff4477', 20);
      }
      return;
    }

    // 4D. Knockdown Move (e.g., 2HK Sweep or Ground Reversal)
    if (move.knockdown) {
      opponent.enterKnockdown();
      opponent.vx = this.facing * (move.vx || 5);
      return;
    }

    // 4E. Standard Ground Hit
    opponent.state = 'HIT';
    opponent.stateTimer = move.hitstun;
    opponent.vx = this.facing * move.push;
  }

  drawTwoSegmentLimb(ctx, rootX, rootY, upperLen, lowerLen, upperAngle, lowerAngle, w, fill, stroke, endBoxW, endBoxH) {
    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate(upperAngle);

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fillRect(-w / 2, 0, w, upperLen);
    ctx.strokeRect(-w / 2, 0, w, upperLen);

    ctx.translate(0, upperLen);
    ctx.fillStyle = stroke;
    ctx.fillRect(-w * 0.4, -3, w * 0.8, 6);

    ctx.rotate(lowerAngle);
    ctx.fillStyle = fill;
    ctx.fillRect(-w * 0.45, 0, w * 0.9, lowerLen);
    ctx.strokeRect(-w * 0.45, 0, w * 0.9, lowerLen);

    ctx.fillStyle = stroke;
    ctx.fillRect(-endBoxW / 2 + 2, lowerLen - 2, endBoxW, endBoxH);
    ctx.strokeRect(-endBoxW / 2 + 2, lowerLen - 2, endBoxW, endBoxH);

    ctx.restore();
  }

  computePose() {
    const breath = Math.sin(this.animTick * 0.1) * 0.06;
    const pose = {
      hipY: -48,
      torsoTilt: 0,
      headTilt: 0,
      fShoulder: -0.45 + breath, fElbow: -1.1,
      bShoulder: 0.25 - breath,  bElbow: -1.0,
      fHip: -0.18,               fKnee: 0.22,
      bHip: 0.22,                bKnee: 0.18
    };

    if (this.state === 'WALK') {
      const cycle = Math.sin(this.animTick * 0.22);
      pose.hipY = -48 + Math.abs(cycle) * 3;
      pose.fHip = cycle * 0.55;
      pose.fKnee = cycle > 0 ? 0.45 : 0.15;
      pose.bHip = -cycle * 0.55;
      pose.bKnee = cycle < 0 ? 0.45 : 0.15;
      pose.fShoulder = -0.35 - cycle * 0.35;
      pose.bShoulder = 0.2 + cycle * 0.35;
    } else if (this.state === 'DASH') {
      const forwardDash = (this.dashDir === this.facing);
      pose.torsoTilt = forwardDash ? 0.38 : -0.32;
      pose.hipY = -44;
      pose.fHip = forwardDash ? -0.75 : 0.55;
      pose.fKnee = 0.65;
      pose.bHip = forwardDash ? 0.85 : -0.65;
      pose.bKnee = 0.5;
      pose.fShoulder = 0.4;
      pose.bShoulder = 0.6;
    } else if (this.state === 'THROW_TECH') {
      const ratio = this.stateTimer / GameConfig.THROW.TECH_STATE_FRAMES;
      if (ratio > 0.6) {
        pose.torsoTilt = 0.25;
        pose.fShoulder = -Math.PI * 0.48; pose.fElbow = -0.15;
        pose.bShoulder = -Math.PI * 0.45; pose.bElbow = -0.15;
        pose.fHip = -0.35; pose.fKnee = 0.4;
      } else {
        pose.hipY = -42;
        pose.torsoTilt = -0.28;
        pose.fShoulder = -0.25; pose.fElbow = -0.85;
        pose.bShoulder = 0.65;  pose.bElbow = -0.75;
        pose.fHip = -0.55;      pose.fKnee = 0.75;
        pose.bHip = 0.45;       pose.bKnee = 0.55;
      }
    } else if (this.state === 'VICTORY') {
      pose.hipY = -48;
      pose.torsoTilt = -0.12;
      pose.fShoulder = -Math.PI * 0.88; pose.fElbow = -0.15;
      pose.bShoulder = 0.35;            pose.bElbow = -1.1;
      pose.fHip = -0.22;                pose.fKnee = 0.15;
      pose.bHip = 0.25;                 pose.bKnee = 0.15;
    } else if (this.state === 'CROUCH') {
      pose.hipY = -30;
      pose.torsoTilt = 0.18;
      pose.fHip = -0.95; pose.fKnee = 1.45;
      pose.bHip = -0.75; pose.bKnee = 1.35;
      pose.fShoulder = -0.55; pose.fElbow = -1.25;
    } else if (this.state === 'JUMP') {
      pose.hipY = -52;
      pose.fHip = -0.85; pose.fKnee = 1.25;
      pose.bHip = -0.45; pose.bKnee = 1.1;
      pose.fShoulder = -0.7; pose.fElbow = -0.9;
      pose.bShoulder = 0.4;  pose.bElbow = -0.8;
    } else if (this.state === 'BLOCK' || this.state === 'PERFECT_BLOCK') {
      pose.hipY = -45;
      pose.torsoTilt = -0.12;
      pose.fShoulder = -0.95; pose.fElbow = -1.35;
      pose.bShoulder = -0.75; pose.bElbow = -1.25;
      pose.fHip = -0.3; pose.fKnee = 0.35;
      pose.bHip = 0.35; pose.bKnee = 0.3;
    } else if (this.state === 'HIT' || this.state === 'AIR_HIT') {
      pose.torsoTilt = -0.42;
      pose.headTilt = -0.3;
      pose.fShoulder = -1.1; pose.fElbow = -0.3;
      pose.bShoulder = -0.8; pose.bElbow = -0.2;
      pose.fHip = -0.4; pose.bHip = 0.3;
    } else if (this.state === 'KNOCKDOWN' || this.state === 'OTG_HIT') {
      // Lying on the ground (flinches upward slightly when hit by OTG attack)
      const otgBounce = (this.state === 'OTG_HIT') ? Math.sin(this.animTick * 0.8) * 6 : 0;
      pose.hipY = -12 - Math.abs(otgBounce);
      pose.torsoTilt = -Math.PI / 2 + (this.state === 'OTG_HIT' ? 0.18 : 0);
      pose.fShoulder = -0.4; pose.fElbow = -0.4;
      pose.bShoulder = 0.2;  pose.bElbow = -0.2;
      pose.fHip = 0.1;       pose.fKnee = 0.25;
      pose.bHip = -0.15;     pose.bKnee = 0.35;
    } else if (this.state === 'WAKEUP') {
      // Critical: Dedicated 0.5-Second (30 frames) Wake-up Animation
      // Phase 1: Hands push torso off floor -> Phase 2: Knee tuck push -> Phase 3: Stand up
      const totalWake = Math.round(GameConfig.KNOCKDOWN.WAKEUP_DURATION_SECONDS * 60);
      const progress = Math.max(0, Math.min(1, 1 - (this.stateTimer / totalWake)));

      pose.hipY = -12 - progress * 36;
      pose.torsoTilt = (-Math.PI / 2) * (1 - progress) + Math.sin(progress * Math.PI) * 0.35;
      pose.fShoulder = (1 - progress) * 0.8 - progress * 0.45;
      pose.fElbow = -1.1 * progress;
      pose.bShoulder = (1 - progress) * 0.6 + progress * 0.25;
      pose.bElbow = -1.0 * progress;
      pose.fHip = -1.1 * Math.sin(progress * Math.PI) - 0.18 * progress;
      pose.fKnee = 1.5 * Math.sin(progress * Math.PI) + 0.22 * progress;
      pose.bHip = -0.6 * (1 - progress) + 0.22 * progress;
      pose.bKnee = 1.1 * (1 - progress) + 0.18 * progress;
    } else if (this.state === 'ATTACK' && this.currentMove) {
      const m = this.currentMove;
      const isStartup = this.moveTimer < m.startup;
      const isActive = this.moveTimer >= m.startup && this.moveTimer < m.startup + m.active;
      const phase = isStartup ? (this.moveTimer / m.startup) * 0.35 : (isActive ? 1.0 : 0.45);

      if (m.anim === 'JAB') {
        pose.torsoTilt = 0.12 * phase;
        pose.fShoulder = -Math.PI / 2 * phase - 0.3 * (1 - phase);
        pose.fElbow = -0.1 * phase - 1.1 * (1 - phase);
      } else if (m.anim === 'STRAIGHT' || m.anim === 'HOOK') {
        pose.torsoTilt = 0.25 * phase;
        pose.bShoulder = -Math.PI / 2 * phase + 0.2 * (1 - phase);
        pose.bElbow = -0.05 * phase - 1.0 * (1 - phase);
        pose.fShoulder = 0.35 * phase;
      } else if (m.anim === 'UPPERCUT') {
        pose.hipY = -48 - 8 * phase;
        pose.torsoTilt = -0.22 * phase;
        pose.bShoulder = -Math.PI * 0.85 * phase;
        pose.bElbow = -0.15 * phase;
      } else if (m.anim === 'LOW_KICK') {
        pose.torsoTilt = -0.15 * phase;
        pose.fHip = -Math.PI * 0.38 * phase;
        pose.fKnee = 0.05 * phase;
      } else if (m.anim === 'MID_KICK') {
        pose.torsoTilt = -0.25 * phase;
        pose.fHip = -Math.PI * 0.52 * phase;
        pose.fKnee = 0.05 * phase;
      } else if (m.anim === 'HIGH_KICK' || m.anim === 'SPIN_KICK') {
        pose.torsoTilt = -0.38 * phase;
        pose.bHip = -Math.PI * 0.68 * phase;
        pose.bKnee = 0.05 * phase;
      } else if (m.anim === 'AXE_KICK') {
        pose.torsoTilt = 0.25 * phase;
        pose.fHip = isStartup ? -Math.PI * 0.78 : -Math.PI * 0.22;
        pose.fKnee = 0.08;
      } else if (m.anim === 'SWEEP') {
        pose.hipY = -24;
        pose.torsoTilt = -0.25;
        pose.bHip = -0.9; pose.bKnee = 1.4;
        pose.fHip = -Math.PI * 0.44 * phase;
        pose.fKnee = 0.02;
      } else if (m.anim === 'GRAB_ATTEMPT') {
        pose.torsoTilt = 0.22 * phase;
        pose.fShoulder = -Math.PI / 2 * phase; pose.fElbow = 0;
        pose.bShoulder = -Math.PI / 2 * phase; pose.bElbow = 0;
      } else if (m.superLevel) {
        pose.torsoTilt = 0.32;
        pose.fShoulder = -Math.PI / 2; pose.fElbow = 0;
        pose.bShoulder = -Math.PI / 2; pose.bElbow = 0;
        pose.fHip = -0.45; pose.bHip = 0.45;
      } else if (m.anim === 'AIR_JAB') {
        pose.hipY = -52;
        pose.torsoTilt = 0.22 * phase;
        pose.fHip = -0.9; pose.fKnee = 1.35;
        pose.bHip = -0.5; pose.bKnee = 1.15;
        pose.fShoulder = (-Math.PI * 0.35) * phase - 0.5 * (1 - phase);
        pose.fElbow = -0.05 * phase - 0.9 * (1 - phase);
      } else if (m.anim === 'AIR_STRAIGHT') {
        pose.hipY = -52;
        pose.torsoTilt = 0.28 * phase;
        pose.fHip = -0.75; pose.fKnee = 1.25;
        pose.bHip = -0.65; pose.bKnee = 1.25;
        pose.bShoulder = (-Math.PI * 0.48) * phase;
        pose.bElbow = -0.05 * phase;
      } else if (m.anim === 'AIR_HEAVY_PUNCH') {
        pose.hipY = -50;
        pose.torsoTilt = isStartup ? -0.25 : 0.42 * phase;
        pose.fHip = -0.95; pose.fKnee = 1.4;
        pose.bHip = -0.4;  pose.bKnee = 1.1;
        pose.bShoulder = isStartup ? -2.2 : (-Math.PI * 0.30) * phase;
        pose.bElbow = isStartup ? -0.8 : -0.05;
      } else if (m.anim === 'AIR_LOW_KICK') {
        pose.hipY = -50;
        pose.torsoTilt = 0.15;
        pose.fHip = (-Math.PI * 0.34) * phase - 0.8 * (1 - phase);
        pose.fKnee = 0.45 * phase + 1.2 * (1 - phase);
        pose.bHip = -0.45; pose.bKnee = 1.25;
      } else if (m.anim === 'AIR_MID_KICK') {
        pose.hipY = -52;
        pose.torsoTilt = -0.28 * phase;
        pose.fHip = (-Math.PI * 0.46) * phase - 0.7 * (1 - phase);
        pose.fKnee = 0.04 * phase + 1.1 * (1 - phase);
        pose.bHip = -0.85; pose.bKnee = 1.45;
      } else if (m.anim === 'AIR_HEAVY_KICK') {
        pose.hipY = -50;
        pose.torsoTilt = 0.26 * phase;
        pose.fHip = -0.95; pose.fKnee = 1.45;
        pose.bHip = (-Math.PI * 0.35) * phase - 0.5 * (1 - phase);
        pose.bKnee = 0.02 * phase + 1.1 * (1 - phase);
      }
    }

    return pose;
  }

  // Renders the 3-Button QTE Wake-up Prompt & Timer Bar above a Knocked Down Fighter
  drawKnockdownQTE(ctx) {
    if (this.state !== 'KNOCKDOWN') return;

    const qteWinFrames = Math.round(GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS * 60);
    const totalPenaltyFrames = Math.round((GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS + GameConfig.KNOCKDOWN.PENALTY_ADD_SECONDS) * 60);

    ctx.save();
    const boxY = this.y - 102;

    // 1. Draw 3 QTE Button Boxes (Green = Completed, Gold = Current Target, Grey = Pending)
    const spacing = 44;
    const startX = this.x - spacing;
    for (let i = 0; i < this.qteSequence.length; i++) {
      const bx = startX + i * spacing;
      const done = i < this.qteIndex;
      const active = i === this.qteIndex && !this.qteFailed;

      ctx.fillStyle = done ? '#00ff88' : (this.qteFailed ? '#3d1522' : (active ? '#ffcf33' : '#161f33'));
      ctx.strokeStyle = done ? '#ffffff' : (active ? '#ffffff' : '#3a4b78');
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.fillRect(bx - 18, boxY - 22, 36, 22);
      ctx.strokeRect(bx - 18, boxY - 22, 36, 22);

      ctx.font = "900 11px monospace";
      ctx.fillStyle = (done || active) ? '#050811' : '#9cb1d4';
      ctx.textAlign = 'center';
      ctx.fillText(this.qteSequence[i], bx, boxY - 7);
    }

    // 2. Draw QTE Timer / Penalty Progress Bar
    const barW = 128;
    ctx.fillStyle = '#111624';
    ctx.fillRect(this.x - barW / 2, boxY + 5, barW, 7);

    if (!this.qteFailed) {
      const ratio = Math.max(0, 1 - (this.knockdownElapsed / qteWinFrames));
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(this.x - barW / 2, boxY + 5, barW * ratio, 7);
    } else {
      const remSec = Math.max(0, (totalPenaltyFrames - this.knockdownElapsed) / 60).toFixed(1);
      const ratio = Math.max(0, 1 - (this.knockdownElapsed / totalPenaltyFrames));
      ctx.fillStyle = '#ff2255';
      ctx.fillRect(this.x - barW / 2, boxY + 5, barW * ratio, 7);

      ctx.font = "800 11px monospace";
      ctx.fillStyle = '#ff4477';
      ctx.textAlign = 'center';
      ctx.fillText(`PENALTY WAIT: ${remSec}s`, this.x, boxY - 28);
    }

    // 3. Show 2-Bar Reversal Hint if fighter has >= 200 Super Meter
    if (this.superMeter >= GameConfig.REVERSAL.SUPER_COST) {
      ctx.font = "800 10px monospace";
      ctx.fillStyle = '#ff0066';
      ctx.textAlign = 'center';
      ctx.fillText(`PRESS LB / [P] FOR 2-BAR REVERSAL!`, this.x, boxY + 24);
    }

    ctx.restore();
  }

  draw(ctx) {
    for (const img of this.afterimages) {
      ctx.save();
      ctx.translate(img.x, img.y);
      ctx.scale(img.facing, 1);
      ctx.fillStyle = this.data.color;
      ctx.globalAlpha = img.alpha * 0.35;
      ctx.fillRect(-20, -90, 40, 90);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    const groundOffset = GameConfig.FLOOR_Y - this.y;
    const shadowScale = Math.max(0.35, 1 - groundOffset / 260);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-30 * shadowScale, groundOffset - 4, 60 * shadowScale, 8);

    ctx.scale(this.facing, 1);

    const p = this.data.proportions || { torsoW: 34, torsoH: 44, upperArmL: 22, lowerArmL: 22, upperLegL: 24, lowerLegL: 24 };
    const pose = this.computePose();

    let frontStroke = this.data.color;
    let frontFill = '#1b263e';
    const backStroke = '#3b4f78';
    const backFill = '#101726';

    if (this.state === 'HIT' || this.state === 'AIR_HIT' || this.state === 'OTG_HIT') {
      frontStroke = '#ff2255';
      frontFill = '#4a1528';
    } else if (this.state === 'PERFECT_BLOCK' || this.state === 'WAKEUP') {
      frontStroke = '#00ff88';
      frontFill = '#113828';
    } else if (this.state === 'THROW_TECH') {
      frontStroke = '#ffdf33';
      frontFill = '#3b3212';
    } else if (this.state === 'BLOCK') {
      frontStroke = '#44aaff';
    }

    this.drawTwoSegmentLimb(
      ctx, -6, pose.hipY, p.upperLegL, p.lowerLegL,
      pose.bHip, pose.bKnee, 13, backFill, backStroke, 16, 7
    );

    this.drawTwoSegmentLimb(
      ctx, 6, pose.hipY, p.upperLegL, p.lowerLegL,
      pose.fHip, pose.fKnee, 14, frontFill, frontStroke, 17, 8
    );

    ctx.save();
    ctx.translate(0, pose.hipY);
    ctx.rotate(pose.torsoTilt);

    this.drawTwoSegmentLimb(
      ctx, -8, -p.torsoH + 6, p.upperArmL, p.lowerArmL,
      pose.bShoulder, pose.bElbow, 11, backFill, backStroke, 13, 11
    );

    ctx.fillStyle = '#121a2d';
    ctx.strokeStyle = frontStroke;
    ctx.lineWidth = 2;
    ctx.fillRect(-p.torsoW / 2, -8, p.torsoW, 12);
    ctx.strokeRect(-p.torsoW / 2, -8, p.torsoW, 12);

    ctx.fillStyle = frontFill;
    ctx.strokeStyle = frontStroke;
    ctx.lineWidth = 2.5;
    ctx.fillRect(-p.torsoW / 2, -p.torsoH, p.torsoW, p.torsoH - 6);
    ctx.strokeRect(-p.torsoW / 2, -p.torsoH, p.torsoW, p.torsoH - 6);

    ctx.save();
    ctx.translate(0, -p.torsoH - 4);
    ctx.rotate(pose.headTilt);
    const headW = 24;
    const headH = 22;
    ctx.fillStyle = '#182238';
    ctx.strokeStyle = frontStroke;
    ctx.fillRect(-headW / 2, -headH, headW, headH);
    ctx.strokeRect(-headW / 2, -headH, headW, headH);
    ctx.fillStyle = frontStroke;
    ctx.fillRect(2, -headH + 5, 12, 6);
    ctx.restore();

    this.drawTwoSegmentLimb(
      ctx, 8, -p.torsoH + 6, p.upperArmL, p.lowerArmL,
      pose.fShoulder, pose.fElbow, 12, frontFill, frontStroke, 14, 12
    );

    ctx.restore();

    if (this.state === 'PERFECT_BLOCK') {
      ctx.strokeStyle = '#00ff88';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.16)';
      ctx.lineWidth = 3;
      ctx.fillRect(-38, -110, 76, 110);
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-38, -110, 76, 110);
      ctx.setLineDash([]);
    }

    if (this.state === 'ATTACK' && this.currentMove) {
      const m = this.currentMove;
      const isStartup = this.moveTimer < m.startup;
      const isActive = this.moveTimer >= m.startup && this.moveTimer < m.startup + m.active;

      const hitX = 18;
      const hitW = m.reach - 18;
      const hitY = m.boxY || -70;
      const hitH = m.boxH || 28;

      if (isStartup) {
        ctx.strokeStyle = '#ffdf33';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(hitX, hitY, hitW, hitH);
        ctx.setLineDash([]);
      } else if (isActive) {
        ctx.fillStyle = m.isReversal ? 'rgba(255, 0, 102, 0.65)' : (m.superLevel ? 'rgba(255, 215, 0, 0.65)' : 'rgba(255, 0, 68, 0.50)');
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fillRect(hitX, hitY, hitW, hitH);
        ctx.strokeRect(hitX, hitY, hitW, hitH);

        if (m.superLevel === 1) {
          ctx.fillStyle = this.data.color;
          ctx.fillRect(hitX, hitY + 6, hitW + 45, hitH - 12);
        } else if (m.superLevel === 2) {
          ctx.strokeStyle = '#00ffaa';
          ctx.lineWidth = 4;
          ctx.strokeRect(hitX - 10, hitY - 25, hitW + 30, hitH + 50);
        } else if (m.superLevel === 3) {
          ctx.fillStyle = 'rgba(255, 0, 102, 0.45)';
          ctx.fillRect(hitX - 20, -140, hitW + 90, 140);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.strokeRect(hitX - 20, -140, hitW + 90, 140);
        }
      }
    }

    ctx.restore();

    // Render Knockdown QTE UI or State Debug Label
    if (this.state === 'KNOCKDOWN') {
      this.drawKnockdownQTE(ctx);
    } else {
      ctx.save();
      ctx.font = "700 11px monospace";
      ctx.fillStyle = this.state === 'WAKEUP' ? '#00ff88' : '#cbd5e1';
      ctx.textAlign = 'center';
      if (this.state === 'AIR_HIT' && this.airComboFramesLeft > 0) {
        const airSec = (this.airComboFramesLeft / 60).toFixed(1);
        ctx.fillStyle = '#00ffcc';
        ctx.fillText(`[AIR COMBO: ${airSec}s LEFT]`, this.x, this.y - 118);
      } else {
        ctx.fillText(`[${this.state}]`, this.x, this.y - 118);
      }
      ctx.restore();
    }
  }
}

window.Fighter = Fighter;