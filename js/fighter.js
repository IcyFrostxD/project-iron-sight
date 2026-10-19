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

    this.normalizeCharacterMoves();

    this.maxHp = this.data.hp;
    this.hp = this.maxHp;
    this.syncLiveConfig();
    this.hp = this.maxHp;

    this.drive = GameConfig.GAUGES.MAX_DRIVE;
    this.superMeter = GameConfig.GAUGES.INITIAL_SUPER;

    this.state = 'IDLE';
    this.stateTimer = 0;
    this.dashTimer = 0;
    this.dashDir = 1;
    this.afterimages = [];

    this.airDashCount = 0;
    this.maxAirDashes = 1;
    this.usedAirUppercut = false;
    this.airActionsLocked = false;

    this.currentMoveKey = null;
    this.currentMove = null;
    this.moveTimer = 0;
    this.hitConnected = false;
    this.hasDealtHit = false;
    this.hasAirAttacked = false;

    this.groundChainList = [];
    this.groundPushCount = 0;
    this.altLimb = false;

    this.airComboFramesLeft = 0;
    this.airComboMaxFrames = 0;

    this.launchCount = 0;
    this.autoWakeupActive = false;
    this.autoWakeupFramesLeft = 0;
    this.autoWakeupLabel = "";
    this.launchImmune = false;
    this.launchImmuneTimer = 0;

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

  normalizeCharacterMoves() {
    const m = this.data.moves;

    if (m['236236P'] && (!m['623P'] || !m['623P'].isUppercut)) {
      m['623P'] = Object.assign({}, m['236236P'], {
        name: m['236236P'].name.replace('236236P', '623P')
      });
      delete m['236236P'];
    } else if (m['623P']) {
      m['623P'].isUppercut = true;
      m['623P'].locksAirActions = true;
      m['623P'].selfLaunchVY = m['623P'].selfLaunchVY || -9.8;
      m['623P'].selfForwardVX = m['623P'].selfForwardVX || 3.2;
    }

    if (m['8_236236P'] && !m['8_623P']) {
      m['8_623P'] = Object.assign({}, m['8_236236P'], {
        name: m['8_236236P'].name.replace('236236P', '623P')
      });
      delete m['8_236236P'];
    } else if (!m['8_623P'] && m['623P']) {
      m['8_623P'] = Object.assign({}, m['623P'], {
        name: 'Air ' + m['623P'].name,
        airMove: true,
        isUppercut: true,
        locksAirActions: true,
        selfLaunchVY: -8.5,
        selfForwardVX: 3.0,
        type: 'overhead'
      });
    }

    if (m['82HK']) {
      m['82HK'].hitsGrounded = false;
      m['82HK'].isOtgStrike = false;
    }

    Object.keys(m).forEach(key => {
      const move = m[key];
      const isFloorSlam = (key === '2HP' || move.isFloorSlam);
      const isGroundHardKick = (!move.airMove && (key === '2HK' || key === '5HK'));
      if (isFloorSlam) {
        move.hitsGrounded = true;
        move.isFloorSlam = true;
        move.launcher = true;
        move.groundBounce = true;
      } else if (isGroundHardKick) {
        move.hitsGrounded = true;
        move.isOtgStrike = true;
      } else {
        move.hitsGrounded = false;
        move.isOtgStrike = false;
      }
    });
  }

  syncLiveConfig() {
    const cfgStats = (GameConfig.CHARACTER_STATS && GameConfig.CHARACTER_STATS[this.charKey]) || {};
    const prevMax = this.maxHp || this.data.hp;
    this.maxHp = cfgStats.hp || this.data.hp;
    if (this.hp > this.maxHp || this.hp === prevMax) {
      this.hp = this.maxHp;
    }

    const walkGlobal = (GameConfig.WALK && GameConfig.WALK.GLOBAL_SPEED_MULT) || 1.0;
    const walkFwdMult = (GameConfig.WALK && GameConfig.WALK.FORWARD_SPEED_MULT) || 1.0;
    const walkBwdMult = (GameConfig.WALK && GameConfig.WALK.BACKWARD_SPEED_MULT) || 0.82;

    this.walkForwardSpeed = (cfgStats.walkForwardSpeed || this.data.walkSpeed) * walkGlobal * walkFwdMult;
    this.walkBackwardSpeed = (cfgStats.walkBackwardSpeed || (this.data.walkSpeed * 0.85)) * walkGlobal * walkBwdMult;
    this.dashForwardSpeed = cfgStats.dashForwardSpeed || this.data.dashSpeed;
    this.dashBackwardSpeed = cfgStats.dashBackwardSpeed || (this.data.dashSpeed * 0.85);
    this.jumpForce = cfgStats.jumpForce || this.data.jumpForce;

    const maxCapSec = (GameConfig.AIR_COMBO && GameConfig.AIR_COMBO.MAX_CAP_SECONDS) || 6.0;
    const maxSec = Math.min(maxCapSec, cfgStats.maxAirComboSeconds || 4.0);
    this.maxAirComboFrames = Math.round(maxSec * 60);
    this.airDamageMultiplier = cfgStats.airDamageMultiplier || 0.75;
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
    this.airDashCount = 0;
    this.usedAirUppercut = false;
    this.airActionsLocked = false;
    this.currentMove = null;
    this.currentMoveKey = null;
    this.groundChainList = [];
    this.groundPushCount = 0;
    this.throwTarget = null;
    this.airComboFramesLeft = 0;
    this.launchCount = 0;
    this.autoWakeupActive = false;
    this.autoWakeupFramesLeft = 0;
    this.launchImmune = false;
    this.launchImmuneTimer = 0;
    this.comboCount = 0;
    this.comboDamage = 0;
    this.juggleCount = 0;
    this.wallSplatted = false;
    this.afterimages = [];
  }

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
  }

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
  }

  canCancel() {
    return this.state === 'ATTACK' && this.currentMove && this.hitConnected && this.currentMove.cancel;
  }

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
  }

  startMove(moveKey, btnTag = null) {
    const moveObj = this.data.moves[moveKey];
    if (!moveObj) return false;

    if (this.currentMoveKey === moveKey) {
      this.altLimb = !this.altLimb;
    } else {
      this.altLimb = false;
    }

    this.currentMoveKey = moveKey;
    this.currentMove = moveObj;
    this.state = 'ATTACK';
    this.moveTimer = 0;
    this.hitConnected = false;
    this.hasDealtHit = false;

    if (moveObj.airMove) {
      this.hasAirAttacked = true;
    }

    if (moveObj.isUppercut) {
      this.usedAirUppercut = true;
      this.airActionsLocked = true;
      this.y = Math.min(this.y, GameConfig.FLOOR_Y - 6);
      this.vy = moveObj.selfLaunchVY || -9.5;
      this.vx = this.facing * (moveObj.selfForwardVX || 3.0);
    }

    if (moveObj.isJumpCrush) {
      this.vy = moveObj.vy || 9.5;
      this.vx = this.facing * (moveObj.vx || 4.5);
    }

    if (btnTag) {
      this.groundChainList.push(btnTag);
      this.lastMoveBanner = this.groundChainList.length > 1
        ? `CHAIN: ${this.groundChainList.join(' > ')}`
        : moveObj.name;
    } else {
      this.lastMoveBanner = moveObj.name;
    }

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

  isUppercutMotion(frameCount) {
    const win = GameConfig.INPUT.MOTION_BUFFER_WINDOW;
    return (
      this.motionBuffer.checkHistorySequence(this.motionBuffer.dirHistory, [6, 2, 6], frameCount, win) ||
      this.motionBuffer.checkHistorySequence(this.motionBuffer.absHistory, [6, 2, 6], frameCount, win)
    );
  }

  processInput(input, frameCount, opponent, engine) {
    const { dashTriggered } = this.motionBuffer.record(input, frameCount);
    const isAirborne = (this.y < GameConfig.FLOOR_Y);

    if (input.grabTriggered) {
      this.lastGrabPressFrame = frameCount;
    }

    if (isAirborne && this.airActionsLocked) {
      return;
    }

    if (this.state === 'THROWN' && opponent.state === 'THROW_EXEC') {
      if (input.grabTriggered && opponent.throwTimer <= GameConfig.THROW.TECH_WINDOW_FRAMES) {
        this.triggerThrowTech(opponent, engine);
        return;
      }
      return;
    }

    if (this.state === 'KNOCKDOWN' || this.state === 'OTG_HIT') {
      const revCost = (GameConfig.REVERSAL && GameConfig.REVERSAL.SUPER_COST) || 200;
      if (input.reversalTriggered && this.superMeter >= revCost) {
        this.superMeter -= revCost;
        this.wasHitOnGround = false;
        this.autoWakeupActive = false;
        this.startMove('REVERSAL');
        engine.triggerReversalEffect(this);
        return;
      }

      if (this.state === 'KNOCKDOWN' && !this.autoWakeupActive && !this.qteFailed) {
        const pressedBtn = input.LP ? 'LP' : input.MP ? 'MP' : input.HP ? 'HP'
                         : input.LK ? 'LK' : input.MK ? 'MK' : input.HK ? 'HK' : null;
        if (pressedBtn) {
          const expectedBtn = this.qteSequence[this.qteIndex];
          if (pressedBtn === expectedBtn) {
            this.qteIndex++;
            engine.spawnParticles(this.x, this.y - 40, '#00ff88', 6, 4);
            if (this.qteIndex >= this.qteSequence.length) {
              this.enterWakeup(engine, "QUICK WAKEUP (0.5s)!");
              return;
            }
          } else {
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

    const canEnterPerfectBlock = !isAirborne && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH' || this.state === 'DASH');
    if (input.perfectBlockHold) {
      if (this.state === 'PERFECT_BLOCK') {
        if (this.superMeter > 0) {
          this.holdingPerfectBlock = true;
          this.vx *= 0.5;
          return;
        } else {
          this.superMeter = 0;
          this.holdingPerfectBlock = false;
          this.state = 'IDLE';
          engine.addFloatingText("SUPER GAUGE DEPLETED!", this.x, this.y - 110, '#ff4477', 16);
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
    const isAirNeutral = isAirborne && ((this.state === 'JUMP' || this.state === 'AIR_DASH') && !this.hasAirAttacked);
    const canCancelNow = this.canCancel();

    // Super Arts
    if (!isAirborne && (isGroundNeutral || (this.state === 'ATTACK' && this.hitConnected)) && (input.anyPunch || input.anyKick)) {
      const doubleMotion = this.motionBuffer.detectSuperMotion(frameCount);
      const gCfg = GameConfig.GAUGES;

      if (doubleMotion === '214214' && input.anyPunch && this.superMeter >= gCfg.SUPER_LV3_COST) {
        this.superMeter -= gCfg.SUPER_LV3_COST;
        this.motionBuffer.clearMotions();
        this.groundChainList = [];
        this.startMove('SUPER_3');
        engine.triggerSuperFreeze(this, 3, this.currentMove.name);
        return;
      }
      if (doubleMotion === '236236' && input.anyKick && this.superMeter >= gCfg.SUPER_LV2_COST) {
        this.superMeter -= gCfg.SUPER_LV2_COST;
        this.motionBuffer.clearMotions();
        this.groundChainList = [];
        this.startMove('SUPER_2');
        engine.triggerSuperFreeze(this, 2, this.currentMove.name);
        return;
      }
      if (doubleMotion === '236236' && input.anyPunch && this.superMeter >= gCfg.SUPER_LV1_COST) {
        this.superMeter -= gCfg.SUPER_LV1_COST;
        this.motionBuffer.clearMotions();
        this.groundChainList = [];
        this.startMove('SUPER_1');
        engine.triggerSuperFreeze(this, 1, this.currentMove.name);
        return;
      }
    }

    // Uppercut Skill: Right, Down, Right + Punch (623P)
    if (input.anyPunch && this.isUppercutMotion(frameCount)) {
      if (isAirborne) {
        if (!this.usedAirUppercut && (isAirNeutral || canCancelNow) && this.data.moves['8_623P']) {
          this.motionBuffer.clearMotions();
          this.startMove('8_623P');
          engine.addFloatingText("AIR UPPERCUT! (AIR LOCKED)", this.x, this.y - 115, '#00ffcc', 20);
          return;
        }
      } else if ((isGroundNeutral || canCancelNow) && this.data.moves['623P']) {
        this.motionBuffer.clearMotions();
        this.groundChainList = [];
        this.startMove('623P');
        engine.addFloatingText("UPPERCUT! (AIR LOCKED)", this.x, this.y - 115, '#00ffcc', 20);
        return;
      }
    }

    if (input.grabTriggered) {
      if (isGroundNeutral) {
        this.groundChainList = [];
        this.startMove('GRAB');
      }
      return;
    }

    if (dashTriggered) {
      const isForwardDash = (dashTriggered === 6);
      if (isAirborne) {
        if ((this.state === 'JUMP' || canCancelNow) && this.airDashCount < this.maxAirDashes) {
          this.airDashCount++;
          this.state = 'AIR_DASH';
          this.dashTimer = 12;
          this.dashDir = isForwardDash ? this.facing : -this.facing;
          this.vx = this.dashDir * (isForwardDash ? this.dashForwardSpeed * 1.05 : this.dashBackwardSpeed * 0.95);
          this.vy = 0;
          this.currentMove = null;
          this.currentMoveKey = null;
          this.hasAirAttacked = false;
          engine.spawnParticles(this.x, this.y - 45, this.data.color, 14, 6);
          engine.addFloatingText(isForwardDash ? "AIR DASH!" : "AIR BACKDASH!", this.x, this.y - 110, '#00ffcc', 17);
          return;
        }
      } else if (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH') {
        this.state = 'DASH';
        this.dashTimer = isForwardDash ? GameConfig.DASH.FORWARD_DURATION_FRAMES : GameConfig.DASH.BACKWARD_DURATION_FRAMES;
        this.dashDir = isForwardDash ? this.facing : -this.facing;
        this.vx = this.dashDir * (isForwardDash ? this.dashForwardSpeed : this.dashBackwardSpeed);
        engine.spawnParticles(this.x, this.y - 15, this.data.color, 10, 5);
        engine.addFloatingText(isForwardDash ? "DASH" : "BACKDASH", this.x, this.y - 105, this.data.color, 16);
        return;
      }
    }

    const btn = input.HP ? 'HP' : input.MP ? 'MP' : input.LP ? 'LP'
              : input.HK ? 'HK' : input.MK ? 'MK' : input.LK ? 'LK' : null;

    if (btn) {
      if (isAirborne && (isAirNeutral || canCancelNow)) {
        if (input.down && btn === 'HK' && this.data.moves['82HK']) {
          this.startMove('82HK');
          engine.addFloatingText("HEAVY JUMP CRUSH!", this.x, this.y - 110, '#ffaa00', 19);
          return;
        }
        if (this.data.moves['8' + btn]) {
          this.startMove('8' + btn);
          return;
        }
      }

      if (!isAirborne && (isGroundNeutral || canCancelNow)) {
        const specialMotion = this.motionBuffer.detectSpecialMotion(frameCount);
        if (specialMotion) {
          const exactMoveKey = specialMotion + btn;
          const genericMoveKey = specialMotion + (btn.endsWith('P') ? 'P' : 'K');
          const resolvedKey = this.data.moves[exactMoveKey] ? exactMoveKey : (this.data.moves[genericMoveKey] ? genericMoveKey : null);

          if (resolvedKey) {
            this.motionBuffer.clearMotions();
            this.groundChainList = [];
            this.startMove(resolvedKey);
            engine.addFloatingText(this.currentMove.name, this.x, this.y - 115, '#00f0ff', 18);
            return;
          }
        }

        if (canCancelNow && this.canChainGroundNormal(btn)) {
          const prefix = input.down ? '2' : '5';
          const moveKey = this.data.moves[prefix + btn] ? (prefix + btn) : ('5' + btn);
          if (this.data.moves[moveKey]) {
            this.startMove(moveKey, btn);
            return;
          }
        }

        if (isGroundNeutral) {
          this.groundChainList = [];
          this.groundPushCount = 0;
          const prefix = input.down ? '2' : '5';
          const moveKey = this.data.moves[prefix + btn] ? (prefix + btn) : ('5' + btn);
          if (this.data.moves[moveKey]) {
            this.startMove(moveKey, btn);
            return;
          }
        }
      }
    }

    const canJumpCancelLauncher = (this.state === 'ATTACK' && this.currentMove && this.currentMove.launcher && this.hitConnected && !this.airActionsLocked);
    if (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH' || canJumpCancelLauncher) {
      if (input.up && this.y >= GameConfig.FLOOR_Y) {
        this.vy = -this.jumpForce;
        this.state = 'JUMP';
        this.airDashCount = 0;
        this.usedAirUppercut = false;
        this.airActionsLocked = false;
        this.currentMove = null;
        this.currentMoveKey = null;
        this.groundChainList = [];
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

    if (this.launchImmune && (this.state === 'IDLE' || this.state === 'WALK')) {
      this.launchImmuneTimer -= dt;
      if (this.launchImmuneTimer <= 0) {
        this.launchImmune = false;
        this.launchCount = 0;
      }
    }

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= GameConfig.DASH.AFTERIMAGE_FADE_SPEED * dt;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
    }

    if (this.state === 'PERFECT_BLOCK') {
      this.superMeter = Math.max(0, this.superMeter - GameConfig.PERFECT_BLOCK.DRAIN_PER_FRAME * dt);
      if (this.superMeter <= 0) {
        this.superMeter = 0;
        this.holdingPerfectBlock = false;
        this.state = 'IDLE';
        engine.addFloatingText("SUPER GAUGE DEPLETED!", this.x, this.y - 110, '#ff4477', 16);
      }
    }

    for (let i = this.motionBuffer.visualHistory.length - 1; i >= 0; i--) {
      this.motionBuffer.visualHistory[i].life -= dt;
      if (this.motionBuffer.visualHistory[i].life <= 0) {
        this.motionBuffer.visualHistory.splice(i, 1);
      }
    }

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

    if (this.state === 'KNOCKDOWN') {
      this.knockdownElapsed += dt;
      this.vx *= 0.85;

      if (this.autoWakeupActive) {
        this.autoWakeupFramesLeft -= dt;
        if (this.autoWakeupFramesLeft <= 0) {
          this.enterWakeup(engine, "WAKEUP (0.5s)!");
        }
        return;
      }

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

    if (this.state === 'OTG_HIT') {
      this.stateTimer -= dt;
      this.vx *= 0.82;
      const attackerFinishedOtg = (opponent.state !== 'ATTACK');
      if (attackerFinishedOtg || this.stateTimer <= 0) {
        this.enterWakeup(engine, "OTG RECOVERY (0.5s)!");
      }
      return;
    }

    if (this.state === 'DASH' || this.state === 'AIR_DASH') {
      this.dashTimer -= dt;
      if (Math.floor(this.dashTimer) % GameConfig.DASH.AFTERIMAGE_INTERVAL_FRAMES === 0) {
        this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.45 });
      }
      if (this.state === 'AIR_DASH') {
        this.vy = 0;
      }
      if (this.dashTimer <= 0) {
        this.state = (this.y < GameConfig.FLOOR_Y) ? 'JUMP' : 'IDLE';
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
      return;
    }

    if (this.state === 'THROWN') {
      return;
    }

    if (this.y >= GameConfig.FLOOR_Y && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH' || this.state === 'PERFECT_BLOCK')) {
      this.facing = (opponent.x >= this.x) ? 1 : -1;
    }

    if (this.state === 'ATTACK' && this.currentMove) {
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
        engine.triggerFloorSlamEffect(this.x + this.facing * 52, GameConfig.FLOOR_Y, this.data.color);
      }

      if (!m.projectile && !this.hasDealtHit && this.moveTimer >= m.startup && this.moveTimer < m.startup + m.active) {
        const dist = Math.abs(opponent.x - this.x);
        const vDist = Math.abs(opponent.y - this.y);
        const inFront = (opponent.x - this.x) * this.facing >= -20;

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
    }

    if (this.state === 'HIT' || this.state === 'BLOCK') {
      this.stateTimer -= dt;
      this.vx *= 0.84;
      if (this.stateTimer <= 0) {
        this.state = 'IDLE';
        this.juggleCount = 0;
        this.wallSplatted = false;
        opponent.comboCount = 0;
        opponent.comboDamage = 0;
        opponent.groundPushCount = 0;
      }
    }

    if (this.state === 'AIR_HIT' && this.airComboFramesLeft > 0) {
      this.airComboFramesLeft = Math.max(0, this.airComboFramesLeft - dt);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const AIR_CEILING_Y = 210;
    if (this.y < AIR_CEILING_Y) {
      this.y = AIR_CEILING_Y;
      if (this.vy < 0) this.vy = 0;
    }

    if (this.y < GameConfig.FLOOR_Y) {
      if (this.state !== 'AIR_DASH') {
        const inAirCombo = !this.airActionsLocked &&
                           ((this.state === 'AIR_HIT' && this.airComboFramesLeft > 0) ||
                            (opponent.state === 'AIR_HIT' && opponent.airComboFramesLeft > 0));
        const grav = inAirCombo ? GameConfig.AIR_COMBO_GRAVITY : GameConfig.GRAVITY;
        this.vy += grav * dt;
      }
    } else {
      this.y = GameConfig.FLOOR_Y;
      this.vy = 0;
      this.airDashCount = 0;
      this.usedAirUppercut = false;
      this.airActionsLocked = false;
      this.hasAirAttacked = false;

      if (this.state === 'AIR_HIT') {
        this.enterKnockdown('QTE');
        engine.triggerHitstop(0, 6);
        engine.spawnParticles(this.x, GameConfig.FLOOR_Y, '#ffffff', 12, 5);
      } else if (this.state === 'JUMP' || this.state === 'AIR_DASH') {
        this.state = 'IDLE';
      } else if (this.state === 'ATTACK' && this.currentMove && (this.currentMove.airMove || this.currentMove.isUppercut)) {
        this.state = 'IDLE';
        this.currentMove = null;
        this.currentMoveKey = null;
        if (opponent.state === 'OTG_HIT') {
          opponent.enterWakeup(engine, "OTG RECOVERY (0.5s)!");
        }
      }
    }

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

    const wasTargetDown = (opponent.state === 'KNOCKDOWN' || opponent.state === 'OTG_HIT');
    const wasTargetAirborne = (opponent.y < GameConfig.FLOOR_Y || opponent.state === 'AIR_HIT');

    if (wasTargetDown) {
      const isAllowedGroundedHit = !move.airMove && !move.isJumpCrush && (
        move.isFloorSlam ||
        this.currentMoveKey === '2HP' ||
        this.currentMoveKey === '2HK' ||
        this.currentMoveKey === '5HK'
      );
      if (!isAllowedGroundedHit) {
        return;
      }
    }

    const applyGroundPushback = (basePush, isBlock = false) => {
      this.groundPushCount++;
      const progressivePush = basePush + this.groundPushCount * 1.35;
      opponent.vx = this.facing * progressivePush;
      this.vx = -this.facing * (progressivePush * (isBlock ? 0.55 : 0.42));
    };

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

    if (move.isJumpCrush && !wasTargetAirborne && !wasTargetDown) {
      const kdSec = move.fixedKnockdownSec || 1.0;
      opponent.enterKnockdown('FIXED', kdSec);
      opponent.vx = this.facing * 3.5;
      engine.addFloatingText(`JUMP CRUSH! (${kdSec.toFixed(1)}s KNOCKDOWN)`, opponent.x, opponent.y - 110, '#ffaa00', 20);
      return;
    }

    if (move.isHeavySweep && !wasTargetAirborne && !wasTargetDown) {
      opponent.enterKnockdown('SWEEP_QTE');
      applyGroundPushback(move.push || 5, false);
      engine.addFloatingText("SWEEP KNOCKDOWN! (INPUT QTE)", opponent.x, opponent.y - 110, '#ff4477', 20);
      return;
    }

    if (move.isUppercut) {
      opponent.state = 'AIR_HIT';
      opponent.airComboFramesLeft = 0;
      opponent.vy = -8.5;
      opponent.vx = this.facing * 5.5;
      opponent.y = Math.min(opponent.y, GameConfig.FLOOR_Y - 14);
      engine.addFloatingText("UPPERCUT FINISH!!", opponent.x, opponent.y - 115, '#00ffcc', 22);
      return;
    }

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

    if (wasTargetDown && !canLaunchTarget) {
      opponent.state = 'OTG_HIT';
      opponent.wasHitOnGround = true;
      opponent.stateTimer = 24;
      applyGroundPushback(3.5, false);
      engine.addFloatingText(`HARD KICK OTG! (-${finalDmg})`, opponent.x, opponent.y - 90, '#ffaa00', 20);
      return;
    }

    if (canLaunchTarget && !wasTargetAirborne) {
      opponent.launchCount++;
      opponent.state = 'AIR_HIT';
      opponent.juggleCount = 1;
      opponent.airComboMaxFrames = this.maxAirComboFrames;
      opponent.airComboFramesLeft = this.maxAirComboFrames;

      opponent.vy = -7.2;
      opponent.vx = this.facing * 1.2;
      opponent.y = Math.min(opponent.y, GameConfig.FLOOR_Y - 14);

      const bounceTag = this.data.isSpongeBob ? "FRYING PAN SLAM!" : (move.groundBounce ? "FLOOR SLAM BOUNCE!" : "LAUNCH!");
      const launchLabel = opponent.launchCount === 1
        ? `${bounceTag} 1/2 (${(this.maxAirComboFrames / 60).toFixed(1)}s AIR)`
        : `${bounceTag} 2/2 (FAST WAKEUP NEXT)`;
      engine.addFloatingText(launchLabel, opponent.x, opponent.y - 110, '#00ffcc', 20);
      return;
    }

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

    if (move.knockdown) {
      opponent.enterKnockdown('QTE');
      applyGroundPushback(move.push || 5, false);
      return;
    }

    opponent.state = 'HIT';
    opponent.stateTimer = move.hitstun;
    applyGroundPushback(move.push || 3.2, false);
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

  // Critical: Custom SpongeBob Limb & Frying Pan Weapon Renderer
  drawSpongeBobLeg(ctx, rootX, rootY, upperLen, lowerLen, upperAngle, lowerAngle) {
    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate(upperAngle);

    // Brown Pant Cuff at top of thigh
    ctx.fillStyle = '#5c330a';
    ctx.strokeStyle = '#1e1205';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-8, -2, 16, 8, 4);
    ctx.fill();
    ctx.stroke();

    // Yellow Sponge Upper Leg
    ctx.fillStyle = '#fff200';
    ctx.strokeStyle = '#8f8400';
    ctx.fillRect(-4, 6, 8, upperLen - 4);
    ctx.strokeRect(-4, 6, 8, upperLen - 4);

    // Knee Pivot
    ctx.translate(0, upperLen);
    ctx.rotate(lowerAngle);

    // Yellow Lower Shin + White Striped Sock
    ctx.fillStyle = '#fff200';
    ctx.fillRect(-4, 0, 8, lowerLen * 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-4.5, lowerLen * 0.35, 9, lowerLen * 0.65);
    ctx.strokeRect(-4.5, lowerLen * 0.35, 9, lowerLen * 0.65);

    // Blue & Red Sock Stripes
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(-4, lowerLen * 0.45, 8, 2.5);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(-4, lowerLen * 0.65, 8, 2.5);

    // Glossy Black SpongeBob Shoe
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-7, lowerLen - 3, 20, 11, 5);
    ctx.fill();
    ctx.stroke();
    // White Shoe Shine Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, lowerLen + 1, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSpongeBobArm(ctx, rootX, rootY, upperLen, lowerLen, upperAngle, lowerAngle, withFryingPan = false, isSlamActive = false) {
    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate(upperAngle);

    // White Shirt Sleeve Puff
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-7, -3, 14, 11, 5);
    ctx.fill();
    ctx.stroke();

    // Yellow Upper Arm
    ctx.fillStyle = '#fff200';
    ctx.strokeStyle = '#8f8400';
    ctx.fillRect(-3.5, 8, 7, upperLen - 6);
    ctx.strokeRect(-3.5, 8, 7, upperLen - 6);

    // Elbow Pivot & Forearm
    ctx.translate(0, upperLen);
    ctx.rotate(lowerAngle);

    ctx.fillStyle = '#fff200';
    ctx.fillRect(-3.5, 0, 7, lowerLen);
    ctx.strokeRect(-3.5, 0, 7, lowerLen);

    // Yellow Hand
    ctx.beginPath();
    ctx.arc(0, lowerLen + 3, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Critical: Draw Cast-Iron Frying Pan when SpongeBob uses Floor Slam (2HP) or Pan Moves!
    if (withFryingPan) {
      ctx.save();
      ctx.translate(0, lowerLen + 4);
      // Orient pan so it slams flat onto the floor during active slam frames
      ctx.rotate(isSlamActive ? Math.PI * 0.35 : 0.15);

      // Pan Handle
      ctx.fillStyle = '#1b1f26';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(-3, 0, 6, 26);
      ctx.strokeRect(-3, 0, 6, 26);

      // Heavy Cast-Iron Frying Pan Head
      ctx.fillStyle = '#232933';
      ctx.strokeStyle = '#d1d9e6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-22, 24, 44, 15, 5);
      ctx.fill();
      ctx.stroke();

      // Sizzling Golden Krabby Patty / Hot Oil Glow inside Pan
      ctx.fillStyle = isSlamActive ? '#ff5500' : '#d97724';
      ctx.beginPath();
      ctx.roundRect(-14, 20, 28, 6, 3);
      ctx.fill();

      if (isSlamActive) {
        ctx.strokeStyle = '#ffdf33';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 34, 28, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Draws SpongeBob's Iconic Yellow Wavy Body, Eyes, Nose, Buck Teeth, White Shirt, Red Tie & Brown SquarePants
  drawSpongeBobBody(ctx, p, pose) {
    const isHit = (this.state === 'HIT' || this.state === 'AIR_HIT' || this.state === 'OTG_HIT');
    const isUsingPan = !!(this.state === 'ATTACK' && this.currentMove && (this.currentMove.isFloorSlam || this.currentMove.usesPan || this.currentMoveKey === '2HP'));
    const isSlamActive = !!(this.state === 'ATTACK' && this.currentMove && this.moveTimer >= this.currentMove.startup);

    // 1. Back Leg & Front Leg
    this.drawSpongeBobLeg(ctx, -11, pose.hipY, p.upperLegL, p.lowerLegL, pose.bHip, pose.bKnee);
    this.drawSpongeBobLeg(ctx, 11, pose.hipY, p.upperLegL, p.lowerLegL, pose.fHip, pose.fKnee);

    ctx.save();
    ctx.translate(0, pose.hipY);
    ctx.rotate(pose.torsoTilt);

    // 2. Back Arm
    this.drawSpongeBobArm(ctx, -22, -32, p.upperArmL, p.lowerArmL, pose.bShoulder, pose.bElbow, isUsingPan, isSlamActive);

    const w = 52;
    const spongeH = 52;
    const shirtH = 10;
    const pantsH = 13;

    // 3. Brown SquarePants Base + Black Belt Dashes
    ctx.fillStyle = '#6b3e11';
    ctx.strokeStyle = '#1a0f04';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-w / 2, -pantsH + 2, w, pantsH);
    ctx.strokeRect(-w / 2, -pantsH + 2, w, pantsH);

    ctx.fillStyle = '#111111';
    ctx.fillRect(-w / 2 + 4, -pantsH + 4, 9, 3.5);
    ctx.fillRect(-5, -pantsH + 4, 10, 3.5);
    ctx.fillRect(w / 2 - 13, -pantsH + 4, 9, 3.5);

    // 4. White Shirt Strip & Collar
    const shirtTopY = -pantsH - shirtH + 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.fillRect(-w / 2, shirtTopY, w, shirtH);
    ctx.strokeRect(-w / 2, shirtTopY, w, shirtH);

    // Shirt Collar Triangles
    ctx.beginPath();
    ctx.moveTo(-14, shirtTopY);
    ctx.lineTo(-5, shirtTopY + 7);
    ctx.lineTo(0, shirtTopY);
    ctx.moveTo(0, shirtTopY);
    ctx.lineTo(5, shirtTopY + 7);
    ctx.lineTo(14, shirtTopY);
    ctx.stroke();

    // 5. Yellow Wavy Sponge Upper Body
    const spongeTopY = shirtTopY - spongeH;
    ctx.fillStyle = isHit ? '#ff6677' : '#fff200';
    ctx.strokeStyle = '#998a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 2, spongeTopY, w + 4, spongeH + 2, 6);
    ctx.fill();
    ctx.stroke();

    // Olive-Green Sponge Pores
    ctx.fillStyle = '#a39c1d';
    const pores = [
      [-19, spongeTopY + 10, 4.5],
      [-20, spongeTopY + 28, 3.5],
      [-17, spongeTopY + 42, 3.0],
      [19, spongeTopY + 11, 4.0],
      [18, spongeTopY + 38, 4.2]
    ];
    for (const [px, py, pr] of pores) {
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Red Necktie hanging over Shirt & Pants
    ctx.fillStyle = '#e61919';
    ctx.strokeStyle = '#4a0404';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, shirtTopY + 1);
    ctx.lineTo(4, shirtTopY + 1);
    ctx.lineTo(6, shirtTopY + 12);
    ctx.lineTo(0, shirtTopY + 18);
    ctx.lineTo(-6, shirtTopY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. Expressive Eyes (Two large touching white circles with blue irises & 3 eyelashes)
    const eyeY = spongeTopY + 19;
    const drawEye = (ex) => {
      // Eyelashes
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      for (const ang of [-0.35, 0, 0.35]) {
        ctx.beginPath();
        ctx.moveTo(ex + Math.sin(ang) * 8, eyeY - 9);
        ctx.lineTo(ex + Math.sin(ang) * 12, eyeY - 14);
        ctx.stroke();
      }
      // White Sclera
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex, eyeY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Blue Iris & Black Pupil
      ctx.fillStyle = '#1ca3ec';
      ctx.beginPath();
      ctx.arc(ex + 2, eyeY, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(ex + 2.5, eyeY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    };
    drawEye(-5);
    drawEye(11);

    // 7. Rosy Cheek & Long Yellow Nose
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-11, eyeY + 8, 4.5, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();

    ctx.fillStyle = '#fff200';
    ctx.strokeStyle = '#665c00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(16, eyeY + 6, 11, 4.2, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 8. Wide Laughing Mouth & Two White Buck Teeth
    const mouthY = spongeTopY + 31;
    ctx.fillStyle = '#7a0916';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, mouthY);
    ctx.quadraticCurveTo(3, mouthY + 4, 15, mouthY + 1);
    ctx.quadraticCurveTo(12, mouthY + 17, 0, mouthY + 17);
    ctx.quadraticCurveTo(-12, mouthY + 16, -11, mouthY);
    ctx.fill();
    ctx.stroke();

    // Pink Tongue
    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.arc(0, mouthY + 13, 6, Math.PI, 0);
    ctx.fill();

    // Two White Buck Teeth
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-5, mouthY + 1, 5.5, 7);
    ctx.strokeRect(-5, mouthY + 1, 5.5, 7);
    ctx.fillRect(2, mouthY + 1, 5.5, 7);
    ctx.strokeRect(2, mouthY + 1, 5.5, 7);

    // 9. Front Arm (Holds Frying Pan during Floor Slam / Pan Attacks)
    this.drawSpongeBobArm(ctx, 22, -32, p.upperArmL, p.lowerArmL, pose.fShoulder, pose.fElbow, isUsingPan, isSlamActive);

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
    } else if (this.state === 'DASH' || this.state === 'AIR_DASH') {
      const forwardDash = (this.dashDir === this.facing);
      pose.torsoTilt = forwardDash ? 0.42 : -0.35;
      pose.hipY = this.state === 'AIR_DASH' ? -52 : -44;
      pose.fHip = forwardDash ? -0.8 : 0.55;
      pose.fKnee = 0.7;
      pose.bHip = forwardDash ? 0.85 : -0.65;
      pose.bKnee = 0.55;
      pose.fShoulder = 0.45;
      pose.bShoulder = 0.65;
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
      const otgBounce = (this.state === 'OTG_HIT') ? Math.sin(this.animTick * 0.8) * 6 : 0;
      pose.hipY = -12 - Math.abs(otgBounce);
      pose.torsoTilt = -Math.PI / 2 + (this.state === 'OTG_HIT' ? 0.18 : 0);
      pose.fShoulder = -0.4; pose.fElbow = -0.4;
      pose.bShoulder = 0.2;  pose.bElbow = -0.2;
      pose.fHip = 0.1;       pose.fKnee = 0.25;
      pose.bHip = -0.15;     pose.bKnee = 0.35;
    } else if (this.state === 'WAKEUP') {
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

      if (m.anim === 'LEAD_JAB' || m.anim === 'JAB') {
        pose.torsoTilt = 0.12 * phase;
        if (this.altLimb) {
          pose.bShoulder = -Math.PI / 2 * phase;
          pose.bElbow = -0.05 * phase;
        } else {
          pose.fShoulder = -Math.PI / 2 * phase - 0.3 * (1 - phase);
          pose.fElbow = -0.08 * phase - 1.1 * (1 - phase);
        }
      } else if (m.anim === 'STEP_STRAIGHT' || m.anim === 'STRAIGHT') {
        pose.torsoTilt = 0.24 * phase;
        pose.bShoulder = -Math.PI / 2 * phase + 0.2 * (1 - phase);
        pose.bElbow = -0.05 * phase - 1.0 * (1 - phase);
        pose.fShoulder = 0.4 * phase;
        pose.fHip = -0.35 * phase;
      } else if (m.anim === 'OVERHAND_HOOK' || m.anim === 'HOOK') {
        pose.torsoTilt = isStartup ? -0.2 : 0.34 * phase;
        pose.bShoulder = isStartup ? -2.1 : (-Math.PI * 0.45) * phase;
        pose.bElbow = -0.15 * phase;
        pose.fShoulder = 0.5 * phase;
      } else if (m.anim === 'CALF_KICK' || m.anim === 'LOW_KICK') {
        pose.torsoTilt = -0.15 * phase;
        pose.fHip = -Math.PI * 0.38 * phase;
        pose.fKnee = 0.05 * phase;
      } else if (m.anim === 'SIDE_THRUST_KICK' || m.anim === 'MID_KICK') {
        pose.torsoTilt = -0.28 * phase;
        pose.fHip = -Math.PI * 0.52 * phase;
        pose.fKnee = 0.04 * phase;
      } else if (m.anim === 'HIGH_HOOK_KICK' || m.anim === 'HIGH_KICK') {
        pose.torsoTilt = -0.40 * phase;
        pose.bHip = -Math.PI * 0.70 * phase;
        pose.bKnee = 0.04 * phase;
      } else if (m.anim === 'CROUCH_JAB') {
        pose.hipY = -30;
        pose.fHip = -0.95; pose.fKnee = 1.45;
        pose.bHip = -0.75; pose.bKnee = 1.35;
        pose.fShoulder = -Math.PI / 2 * phase;
        pose.fElbow = -0.08 * phase;
      } else if (m.anim === 'CROUCH_GUT_PUNCH') {
        pose.hipY = -30;
        pose.torsoTilt = 0.22 * phase;
        pose.fHip = -0.95; pose.fKnee = 1.45;
        pose.bHip = -0.75; pose.bKnee = 1.35;
        pose.bShoulder = -Math.PI * 0.46 * phase;
        pose.bElbow = -0.05 * phase;
      } else if (m.anim === 'CROUCH_ANKLE_KICK' || m.anim === 'LOW_SPIN_KICK') {
        pose.hipY = -26;
        pose.torsoTilt = -0.2;
        pose.bHip = -0.9; pose.bKnee = 1.4;
        pose.fHip = -Math.PI * 0.42 * phase;
        pose.fKnee = 0.05;
      } else if (m.anim === 'FLOOR_SLAM') {
        if (isStartup) {
          pose.hipY = -50;
          pose.torsoTilt = -0.28;
          pose.fShoulder = -2.6; pose.fElbow = -0.35;
          pose.bShoulder = -2.5; pose.bElbow = -0.35;
        } else {
          pose.hipY = -24;
          pose.torsoTilt = 0.65;
          pose.fHip = -1.05; pose.fKnee = 1.5;
          pose.bHip = -0.65; pose.bKnee = 1.3;
          pose.fShoulder = -0.32; pose.fElbow = 0.05;
          pose.bShoulder = -0.28; pose.bElbow = 0.05;
        }
      } else if (m.anim === 'DRAGON_SWEEP' || m.anim === 'SWEEP') {
        pose.hipY = -20;
        pose.torsoTilt = -0.38;
        pose.fHip = -1.1; pose.fKnee = 1.55;
        pose.bHip = -Math.PI * 0.46 * phase;
        pose.bKnee = 0.02;
        pose.fShoulder = 0.4; pose.bShoulder = -0.5;
      } else if (m.anim === 'FIREBALL_CAST' || m.anim === 'PROJECTILE') {
        pose.torsoTilt = isStartup ? -0.22 : 0.28 * phase;
        pose.fShoulder = isStartup ? 0.6 : -Math.PI / 2 * phase;
        pose.fElbow = 0;
        pose.bShoulder = isStartup ? 0.7 : -Math.PI / 2 * phase;
        pose.bElbow = 0;
        pose.fHip = -0.42; pose.fKnee = 0.45;
      } else if (m.anim === 'RISING_UPPERCUT' || m.anim === 'UPPERCUT') {
        pose.hipY = -52;
        pose.torsoTilt = -0.24 * phase;
        pose.bShoulder = -Math.PI * 0.88 * phase;
        pose.bElbow = -0.10 * phase;
        pose.fShoulder = 0.55; pose.fElbow = -1.2;
        pose.fHip = -0.95; pose.fKnee = 1.4;
        pose.bHip = 0.25;  pose.bKnee = 0.15;
      } else if (m.anim === 'JUMP_CRUSH_STOMP') {
        pose.hipY = -44;
        pose.torsoTilt = 0.32;
        pose.fHip = -0.35; pose.fKnee = 0.15;
        pose.bHip = -0.25; pose.bKnee = 0.15;
        pose.fShoulder = -2.1; pose.fElbow = -0.5;
        pose.bShoulder = -2.0; pose.bElbow = -0.5;
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
      } else if (m.anim === 'AIR_CROSS' || m.anim === 'AIR_STRAIGHT') {
        pose.hipY = -52;
        pose.torsoTilt = 0.28 * phase;
        pose.fHip = -0.75; pose.fKnee = 1.25;
        pose.bHip = -0.65; pose.bKnee = 1.25;
        pose.bShoulder = (-Math.PI * 0.48) * phase;
        pose.bElbow = -0.05 * phase;
      } else if (m.anim === 'AIR_HAMMER_SMASH' || m.anim === 'AIR_HEAVY_PUNCH') {
        pose.hipY = -50;
        pose.torsoTilt = isStartup ? -0.25 : 0.42 * phase;
        pose.fHip = -0.95; pose.fKnee = 1.4;
        pose.bHip = -0.4;  pose.bKnee = 1.1;
        pose.bShoulder = isStartup ? -2.2 : (-Math.PI * 0.30) * phase;
        pose.bElbow = isStartup ? -0.8 : -0.05;
      } else if (m.anim === 'AIR_KNEE_DROP' || m.anim === 'AIR_LOW_KICK') {
        pose.hipY = -50;
        pose.torsoTilt = 0.15;
        pose.fHip = (-Math.PI * 0.34) * phase - 0.8 * (1 - phase);
        pose.fKnee = 0.45 * phase + 1.2 * (1 - phase);
        pose.bHip = -0.45; pose.bKnee = 1.25;
        pose.fShoulder = -0.6; pose.fElbow = -1.1;
      } else if (m.anim === 'AIR_SIDE_BLADE' || m.anim === 'AIR_MID_KICK') {
        pose.hipY = -52;
        pose.torsoTilt = -0.28 * phase;
        pose.fHip = (-Math.PI * 0.46) * phase - 0.7 * (1 - phase);
        pose.fKnee = 0.04 * phase + 1.1 * (1 - phase);
        pose.bHip = -0.85; pose.bKnee = 1.45;
      } else if (m.anim === 'AIR_WHEEL_KICK' || m.anim === 'AIR_HEAVY_KICK') {
        pose.hipY = -50;
        pose.torsoTilt = 0.26 * phase;
        pose.fHip = -0.95; pose.fKnee = 1.45;
        pose.bHip = (-Math.PI * 0.35) * phase - 0.5 * (1 - phase);
        pose.bKnee = 0.02 * phase + 1.1 * (1 - phase);
      }
    }

    return pose;
  }

  drawKnockdownQTE(ctx) {
    if (this.state !== 'KNOCKDOWN') return;

    ctx.save();
    const boxY = this.y - 102;

    if (this.autoWakeupActive) {
      const barW = 148;
      const ratio = Math.max(0, this.autoWakeupFramesLeft / 30);
      ctx.fillStyle = '#111624';
      ctx.fillRect(this.x - barW / 2, boxY - 8, barW, 8);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(this.x - barW / 2, boxY - 8, barW * ratio, 8);

      ctx.font = "900 11px monospace";
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'center';
      ctx.fillText(this.autoWakeupLabel || "AUTO WAKEUP (1.0s)", this.x, boxY - 14);
      ctx.restore();
      return;
    }

    const qteWinFrames = Math.round(GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS * 60);
    const totalPenaltyFrames = Math.round((GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS + GameConfig.KNOCKDOWN.PENALTY_ADD_SECONDS) * 60);

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

    const revCost = (GameConfig.REVERSAL && GameConfig.REVERSAL.SUPER_COST) || 200;
    if (this.superMeter >= revCost) {
      ctx.font = "800 10px monospace";
      ctx.fillStyle = '#ff0066';
      ctx.textAlign = 'center';
      ctx.fillText("PRESS LB / [P] FOR 2-BAR REVERSAL!", this.x, boxY + 24);
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

    // Critical: Render SpongeBob SquarePants if character is TITAN / isSpongeBob!
    if (this.charKey === 'TITAN' || this.data.isSpongeBob) {
      this.drawSpongeBobBody(ctx, p, pose);
    } else {
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
    }

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

    if (this.state === 'KNOCKDOWN') {
      this.drawKnockdownQTE(ctx);
    } else {
      ctx.save();
      ctx.font = "700 11px monospace";
      ctx.fillStyle = this.state === 'WAKEUP' ? '#00ff88' : '#cbd5e1';
      ctx.textAlign = 'center';
      if (this.airActionsLocked && this.y < GameConfig.FLOOR_Y) {
        ctx.fillStyle = '#ff4477';
        ctx.fillText(`[UPPERCUT LOCK - FALLING]`, this.x, this.y - 118);
      } else if (this.state === 'AIR_HIT' && this.airComboFramesLeft > 0) {
        const airSec = (this.airComboFramesLeft / 60).toFixed(1);
        ctx.fillStyle = '#00ffcc';
        ctx.fillText(`[AIR COMBO: ${airSec}s | LAUNCH ${this.launchCount}/2]`, this.x, this.y - 118);
      } else if (this.launchImmune) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(`[${this.state} | LAUNCH IMMUNE]`, this.x, this.y - 118);
      } else {
        ctx.fillText(`[${this.state}]`, this.x, this.y - 118);
      }
      ctx.restore();
    }
  }
}

window.Fighter = Fighter;