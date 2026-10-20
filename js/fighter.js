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

    // Air Combo Hit Counters & Air Heavy Lockout
    this.airLightCount = 0;
    this.airMediumCount = 0;
    this.usedAirHeavy = false;
    this.airNormalsLocked = false;

    this.attackDelayTimer = 0;

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

    // Floor Slam / Launch Tracking
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

    // Air Heavy Punch (8HP) as Straight Punch & 1x limit for 8HP/8HK
    if (m['8HP']) {
      m['8HP'].name = 'Air Heavy Straight (j.HP)';
      m['8HP'].anim = 'AIR_STRAIGHT';
      m['8HP'].isAirHeavy = true;
      m['8HP'].vy = 4.8;
      m['8HP'].cancel = true;
    }
    if (m['8HK']) {
      m['8HK'].isAirHeavy = true;
      m['8HK'].vy = 4.8;
      m['8HK'].cancel = true;
    }

    // Air Down + Heavy Punch (82HP): Slams airborne enemy to bounce off floor while caster follows down immediately
    m['82HP'] = {
      name: this.data.isSpongeBob ? 'Air Frying Pan Bounce Slam (j.2HP)' : 'Air Meteor Bounce Slam (j.2HP)',
      anim: 'AIR_FLOOR_SLAM',
      usesPan: !!this.data.isSpongeBob,
      airMove: true,
      isAirFloorSlam: true,
      startup: 6,
      active: 14,
      recovery: 12,
      dmg: 78,
      hitstun: 42,
      blockstun: 18,
      push: 3.5,
      vx: 3.0,
      vy: 10.5,
      type: 'overhead',
      cancel: false,
      reach: 104,
      boxY: -50,
      boxH: 48
    };

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
    this.airLightCount = 0;
    this.airMediumCount = 0;
    this.usedAirHeavy = false;
    this.airNormalsLocked = false;
    this.attackDelayTimer = 0;
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
    this.usedAirHeavy = false;
    this.airNormalsLocked = false;
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

    // Critical: 2nd Launch Fall triggers 1.0s Auto-Wakeup and sets Floor Slam Immune timer to 50 frames
    if (this.launchCount >= 2 && mode !== 'SWEEP_QTE') {
      this.autoWakeupActive = true;
      this.autoWakeupFramesLeft = 30;
      this.autoWakeupLabel = "2ND LAUNCH: AUTO WAKEUP (1.0s)";
      this.launchImmune = true;
      this.launchImmuneTimer = 50; // Updated to 50 frames as requested
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

  // Critical: Always resets launchCount back to 0 when waking up!
  enterWakeup(engine, labelText) {
    this.state = 'WAKEUP';
    const wakeSec = (GameConfig.KNOCKDOWN && GameConfig.KNOCKDOWN.WAKEUP_DURATION_SECONDS) || 0.5;
    this.stateTimer = Math.round(wakeSec * 60);
    this.y = GameConfig.FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.wasHitOnGround = false;
    this.autoWakeupActive = false;
    this.launchCount = 0; // Always reset launch counter to 0 upon waking up
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

    if (moveObj.isAirHeavy || moveKey === '8HP' || moveKey === '8HK') {
      this.usedAirHeavy = true;
      this.airNormalsLocked = true;
    }

    if (moveObj.isUppercut) {
      this.usedAirUppercut = true;
      this.airActionsLocked = true;
      this.y = Math.min(this.y, GameConfig.FLOOR_Y - 6);
      this.vy = moveObj.selfLaunchVY || -9.5;
      this.vx = this.facing * (moveObj.selfForwardVX || 3.0);
    }

    if (moveObj.isJumpCrush || moveObj.isAirFloorSlam) {
      this.vy = moveObj.vy || 9.5;
      this.vx = this.facing * (moveObj.vx || 3.5);
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
        this.launchCount = 0; // Reset launch count on Reversal wakeup
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
    const isAttackReady = (this.attackDelayTimer <= 0 || canCancelNow);

    // Super Arts
    if (isAttackReady && !isAirborne && (isGroundNeutral || (this.state === 'ATTACK' && this.hitConnected)) && (input.anyPunch || input.anyKick)) {
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
    if (isAttackReady && input.anyPunch && this.isUppercutMotion(frameCount)) {
      if (isAirborne) {
        if (!this.usedAirUppercut && !this.airNormalsLocked && (isAirNeutral || canCancelNow) && this.data.moves['8_623P']) {
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

    if (isAttackReady && input.grabTriggered) {
      if (isGroundNeutral) {
        this.groundChainList = [];
        this.startMove('GRAB');
      }
      return;
    }

    if (dashTriggered) {
      const isForwardDash = (dashTriggered === 6);
      if (isAirborne) {
        if (!this.airNormalsLocked && (this.state === 'JUMP' || canCancelNow) && this.airDashCount < this.maxAirDashes) {
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
      if (isAirborne) {
        const canDoDiveSlam = (this.state === 'JUMP' || this.state === 'AIR_DASH' || canCancelNow);

        if (canDoDiveSlam && input.down && btn === 'HP' && this.data.moves['82HP']) {
          this.startMove('82HP');
          engine.addFloatingText("AIR FLOOR BOUNCE SLAM!", this.x, this.y - 110, '#00ffcc', 19);
          return;
        }
        if (canDoDiveSlam && input.down && btn === 'HK' && this.data.moves['82HK']) {
          this.startMove('82HK');
          engine.addFloatingText("HEAVY JUMP CRUSH!", this.x, this.y - 110, '#ffaa00', 19);
          return;
        }

        if (!this.airNormalsLocked && isAttackReady && (isAirNeutral || canCancelNow)) {
          if ((btn === 'HP' || btn === 'HK') && this.usedAirHeavy) {
            return;
          }
          if (this.data.moves['8' + btn]) {
            this.startMove('8' + btn);
            return;
          }
        }
      }

      if (!isAirborne && isAttackReady && (isGroundNeutral || canCancelNow)) {
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
        this.usedAirHeavy = false;
        this.airNormalsLocked = false;
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
    if (this.attackDelayTimer > 0) this.attackDelayTimer = Math.max(0, this.attackDelayTimer - dt);

    // Critical: Count down the 50-frame Floor Slam Immune timer once the fighter has woken up, then reset to 0
    if (this.launchImmune && this.state !== 'KNOCKDOWN' && this.state !== 'AIR_HIT') {
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
        this.launchCount = 0; // Ensure launchCount is always 0 when standing up from Wakeup
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
        engine.addFloatingText("QTE FAILED! PENALTY WAIT", this.x, this.y - 105, '#ff2255', 18);
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

      if (this.currentMove && this.moveTimer >= m.startup + m.active + m.recovery) {
        this.attackDelayTimer = window.FighterCombat.getPostAttackDelayFrames(this.currentMoveKey, m);
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

    const AIR_CEILING_Y = 175;
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
      this.usedAirHeavy = false;
      this.airNormalsLocked = false;
      this.hasAirAttacked = false;

      if (this.state === 'AIR_HIT') {
        this.enterKnockdown('QTE');
        engine.triggerHitstop(0, 6);
        engine.spawnParticles(this.x, GameConfig.FLOOR_Y, '#ffffff', 12, 5);
      } else if (this.state === 'JUMP' || this.state === 'AIR_DASH') {
        this.state = 'IDLE';
      } else if (this.state === 'ATTACK' && this.currentMove && (this.currentMove.airMove || this.currentMove.isUppercut)) {
        this.attackDelayTimer = window.FighterCombat.getPostAttackDelayFrames(this.currentMoveKey, this.currentMove);
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
    window.FighterCombat.resolveHit(this, opponent, move, engine);
  }

  draw(ctx) {
    window.FighterPose.drawFighter(ctx, this);
  }
}

window.Fighter = Fighter;