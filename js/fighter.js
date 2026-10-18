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

    this.diArmorHits = 0;
    this.diShieldBroken = false;

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

  // Critical: Syncs live GameConfig changes in real-time to active fighters
  syncLiveConfig() {
    const cfgStats = GameConfig.CHARACTER_STATS[this.charKey] || {};
    const prevMax = this.maxHp || this.data.hp;
    this.maxHp = cfgStats.hp || this.data.hp;
    if (this.hp > this.maxHp || this.hp === prevMax) {
      this.hp = this.maxHp;
    }
    this.walkSpeed = cfgStats.walkSpeed || this.data.walkSpeed;
    this.dashSpeed = cfgStats.dashSpeed || this.data.dashSpeed;
    this.jumpForce = cfgStats.jumpForce || this.data.jumpForce;

    if (this.data.moves['GRAB']) {
      Object.assign(this.data.moves['GRAB'], {
        startup: GameConfig.THROW.STARTUP,
        active: GameConfig.THROW.ACTIVE,
        recovery: GameConfig.THROW.RECOVERY,
        dmg: GameConfig.THROW.DAMAGE,
        reach: GameConfig.THROW.REACH
      });
    }
    if (this.data.moves['DRIVE_IMPACT']) {
      Object.assign(this.data.moves['DRIVE_IMPACT'], {
        startup: GameConfig.DRIVE_IMPACT.STARTUP,
        active: GameConfig.DRIVE_IMPACT.ACTIVE,
        recovery: GameConfig.DRIVE_IMPACT.RECOVERY,
        dmg: GameConfig.DRIVE_IMPACT.DAMAGE,
        hitstun: GameConfig.DRIVE_IMPACT.HITSTUN,
        blockstun: GameConfig.DRIVE_IMPACT.BLOCKSTUN,
        push: GameConfig.DRIVE_IMPACT.PUSHBACK,
        dashSpeed: GameConfig.DRIVE_IMPACT.DASH_SPEED,
        reach: GameConfig.DRIVE_IMPACT.REACH
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
    this.comboCount = 0;
    this.comboDamage = 0;
    this.juggleCount = 0;
    this.wallSplatted = false;
    this.afterimages = [];
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

    if (moveObj.isDriveImpact) {
      this.diArmorHits = 0;
      this.diShieldBroken = false;
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

    if (this.state === 'THROWN' && opponent.state === 'THROW_EXEC') {
      if (input.grabTriggered && opponent.throwTimer <= GameConfig.THROW.TECH_WINDOW_FRAMES) {
        this.triggerThrowTech(opponent, engine);
        return;
      }
      return;
    }

    const canEnterPerfectBlock = !isAirborne && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH');
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

    if (input.grabTriggered) {
      if (isGroundNeutral) {
        this.startMove('GRAB');
      }
      return;
    }

    if (input.driveImpactTriggered) {
      if (!isAirborne && (isGroundNeutral || canCancelNow) && this.drive >= GameConfig.DRIVE_IMPACT.COST) {
        this.drive -= GameConfig.DRIVE_IMPACT.COST;
        this.startMove('DRIVE_IMPACT');
        engine.spawnParticles(this.x, this.y - 60, '#ff0066', 24, 8);
        engine.addFloatingText("DRIVE IMPACT!", this.x, this.y - 115, '#ff0066', 22);

        if (opponent.state === 'ATTACK' && opponent.currentMove && opponent.currentMove.isDriveImpact) {
          engine.triggerDriveImpactClashZoom();
        }
      }
      return;
    }

    // Critical: Trigger Dash from either Double-Tap (66/44) or Dedicated Dash Button (Shift / F / L3)
    if (dashTriggered && !isAirborne && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH')) {
      this.state = 'DASH';
      this.dashTimer = GameConfig.DASH.DURATION_FRAMES;
      this.dashDir = (dashTriggered === 6) ? this.facing : -this.facing;
      this.vx = this.dashDir * (dashTriggered === 6 ? this.dashSpeed : this.dashSpeed * GameConfig.DASH.BACKDASH_SPEED_MULT);
      engine.spawnParticles(this.x, this.y - 15, this.data.color, 10, 5);
      engine.addFloatingText(dashTriggered === 6 ? "DASH" : "BACKDASH", this.x, this.y - 105, this.data.color, 16);
      return;
    }

    const btn = input.HP ? 'HP' : input.MP ? 'MP' : input.LP ? 'LP'
              : input.HK ? 'HK' : input.MK ? 'MK' : input.LK ? 'LK' : null;

    if (btn) {
      if (isAirborne && (isAirNeutral || canCancelNow)) {
        if (canCancelNow && this.currentMoveKey) {
          const airChainKey = this.currentMoveKey + '_' + btn;
          if (this.data.moves[airChainKey]) {
            this.startMove(airChainKey);
            return;
          }
        }
        if (isAirNeutral && this.data.moves['8' + btn]) {
          this.startMove('8' + btn);
          return;
        }
      }

      if (!isAirborne && (isGroundNeutral || canCancelNow)) {
        const specialMotion = this.motionBuffer.detectSpecialMotion(frameCount);
        const pOrK = btn.endsWith('P') ? 'P' : 'K';
        if (specialMotion && this.data.moves[specialMotion + pOrK]) {
          this.motionBuffer.clearMotions();
          this.startMove(specialMotion + pOrK);
          engine.addFloatingText(this.currentMove.name, this.x, this.y - 115, '#00f0ff', 18);
          return;
        }

        if (canCancelNow && this.currentMoveKey) {
          const chainKey = this.currentMoveKey + '_' + btn;
          if (this.data.moves[chainKey]) {
            this.startMove(chainKey);
            return;
          }
        }

        if (isGroundNeutral) {
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
    }

    if (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH') {
      if (input.up && this.y >= GameConfig.FLOOR_Y) {
        this.vy = -this.jumpForce;
        this.state = 'JUMP';
        this.hasAirAttacked = false;
        if (input.forward) this.vx = this.facing * (this.walkSpeed * 1.65);
        else if (input.back) this.vx = -this.facing * (this.walkSpeed * 1.45);
      } else if (input.down) {
        this.state = 'CROUCH';
        this.vx *= 0.6;
      } else if (input.forward) {
        this.state = 'WALK';
        this.vx = this.facing * this.walkSpeed;
      } else if (input.back) {
        this.state = 'WALK';
        this.vx = -this.facing * (this.walkSpeed * 0.85);
      } else {
        this.state = 'IDLE';
        this.vx *= GameConfig.FRICTION;
      }
    }
  }

  update(opponent, dt, input, engine) {
    this.animTick += dt;
    this.holdingBack = input.back;
    this.holdingDown = input.down;

    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= 0.08 * dt;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
    }

    if (this.state === 'PERFECT_BLOCK') {
      this.superMeter = Math.max(0, this.superMeter - GameConfig.PERFECT_BLOCK.DRAIN_PER_FRAME * dt);
      if (this.superMeter <= 0) {
        this.holdingPerfectBlock = false;
        this.state = 'IDLE';
      }
    }

    if (this.drive < GameConfig.GAUGES.MAX_DRIVE && this.state !== 'HIT' && this.state !== 'BLOCK' && this.state !== 'CRUMPLE') {
      this.drive = Math.min(GameConfig.GAUGES.MAX_DRIVE, this.drive + GameConfig.GAUGES.DRIVE_REGEN_PER_FRAME * dt);
    }

    for (let i = this.motionBuffer.visualHistory.length - 1; i >= 0; i--) {
      this.motionBuffer.visualHistory[i].life -= dt;
      if (this.motionBuffer.visualHistory[i].life <= 0) {
        this.motionBuffer.visualHistory.splice(i, 1);
      }
    }

    if (this.state === 'DASH') {
      this.dashTimer -= dt;
      if (Math.floor(this.dashTimer) % 3 === 0) {
        this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.45 });
      }
      if (this.dashTimer <= 0) {
        this.state = 'IDLE';
        this.vx *= 0.5;
      }
    }

    if (this.state === 'THROW_TECH') {
      this.stateTimer -= dt;
      this.vx *= 0.88;
      if (Math.floor(this.stateTimer) % 3 === 0) {
        this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.35 });
      }
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
          engine.spawnParticles(t.x, t.y - 40, '#00f0ff', 2, 4);
        } else {
          this.y = GameConfig.FLOOR_Y;
          t.x = this.x + this.facing * 55;
          t.y = GameConfig.FLOOR_Y;
        }
      } else if (this.charKey === 'KIRA') {
        const ang = progress * Math.PI;
        t.x = this.x + this.facing * Math.cos(ang) * 75;
        t.y = GameConfig.FLOOR_Y - Math.sin(ang) * 130;
        engine.spawnParticles(t.x, t.y - 40, '#ff0077', 2, 4);
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
        t.state = 'KNOCKDOWN';
        t.stateTimer = GameConfig.KNOCKDOWN.DURATION_FRAMES;
        t.vx = this.facing * 8;
        t.vy = 0;
        t.y = GameConfig.FLOOR_Y;

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

      if (m.airMove) {
        // Keep current airborne horizontal velocity
      } else if (m.dashSpeed && this.moveTimer >= m.startup - 2 && this.moveTimer <= m.startup + m.active) {
        this.vx = this.facing * m.dashSpeed;
        if (m.superLevel || m.isDriveImpact) {
          this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.4 });
        }
      } else if (this.y >= GameConfig.FLOOR_Y) {
        this.vx *= 0.78;
      }

      if (m.projectile && prevTimer < m.startup && this.moveTimer >= m.startup) {
        engine.spawnProjectile(this, m);
        this.hitConnected = true;
      }

      if (!m.projectile && !this.hasDealtHit && this.moveTimer >= m.startup && this.moveTimer < m.startup + m.active) {
        const dist = Math.abs(opponent.x - this.x);
        const vDist = Math.abs(opponent.y - this.y);
        const inFront = (opponent.x - this.x) * this.facing >= -18;

        if (inFront && dist <= m.reach && vDist <= 118 && opponent.state !== 'KNOCKDOWN' && opponent.state !== 'THROWN' && opponent.state !== 'THROW_TECH') {
          if (!opponent.currentMove || !opponent.currentMove.invuln) {
            this.resolveHit(opponent, m, engine);
          }
        }
      }

      if (this.moveTimer >= m.startup + m.active + m.recovery) {
        this.state = (this.y < GameConfig.FLOOR_Y) ? 'JUMP' : 'IDLE';
        this.currentMove = null;
        this.currentMoveKey = null;
      }
    }

    if (this.state === 'HIT' || this.state === 'CRUMPLE' || this.state === 'BLOCK' || this.state === 'KNOCKDOWN') {
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

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y < GameConfig.FLOOR_Y) {
      this.vy += GameConfig.GRAVITY * dt;
    } else {
      this.y = GameConfig.FLOOR_Y;
      this.vy = 0;
      this.hasAirAttacked = false;

      if (this.state === 'AIR_HIT') {
        this.state = 'KNOCKDOWN';
        this.stateTimer = GameConfig.KNOCKDOWN.DURATION_FRAMES;
        engine.triggerHitstop(0, 5);
        engine.spawnParticles(this.x, GameConfig.FLOOR_Y, '#ffffff', 10, 4);
      } else if (this.state === 'JUMP') {
        this.state = 'IDLE';
      } else if (this.state === 'ATTACK' && this.currentMove && this.currentMove.airMove) {
        this.state = 'IDLE';
        this.currentMove = null;
        this.currentMoveKey = null;
      }
    }

    if (this.x <= GameConfig.STAGE_LEFT || this.x >= GameConfig.STAGE_RIGHT) {
      const hitWallHard = (this.state === 'AIR_HIT' || this.state === 'HIT' || this.state === 'CRUMPLE') &&
                          Math.abs(this.vx) >= GameConfig.WALL_SPLAT.MIN_VELOCITY_X && !this.wallSplatted;
      this.x = Math.max(GameConfig.STAGE_LEFT, Math.min(GameConfig.STAGE_RIGHT, this.x));

      if (hitWallHard) {
        this.wallSplatted = true;
        this.vx = -this.facing * 1.5;
        this.vy = -4.2;
        this.state = 'HIT';
        this.stateTimer = GameConfig.WALL_SPLAT.STUN_FRAMES;
        engine.triggerHitstop(9, 11);
        engine.spawnParticles(this.x, this.y - 60, '#ffaa00', 26, 8);
        engine.addFloatingText("WALL SPLAT!!", this.x, this.y - 110, '#ffaa00', 26);
      } else {
        this.vx = 0;
      }
    }

    if (this.state !== 'THROW_EXEC' && opponent.state !== 'THROW_EXEC' && Math.abs(this.x - opponent.x) < 48 && Math.abs(this.y - opponent.y) < 65) {
      const pushDir = (this.x < opponent.x) ? -1 : 1;
      this.x += pushDir * 2.5;
      opponent.x -= pushDir * 2.5;
    }
  }

  resolveHit(opponent, move, engine) {
    this.hasDealtHit = true;
    this.hitConnected = true;

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

    if (opponent.state === 'ATTACK' && opponent.currentMove && opponent.currentMove.isDriveImpact) {
      const opponentInArmorWindow = (opponent.moveTimer >= 1 && opponent.moveTimer < opponent.currentMove.startup);
      const maxArmor = GameConfig.DRIVE_IMPACT.ARMOR_MAX_HITS;

      if (move.isDriveImpact && !opponentInArmorWindow) {
        opponent.currentMove = null;
        opponent.state = 'CRUMPLE';
        opponent.stateTimer = GameConfig.DRIVE_IMPACT.CRUMPLE_FRAMES;
        opponent.hp = Math.max(0, opponent.hp - move.dmg);
        opponent.vx = this.facing * 10;
        engine.endSlowMo();
        engine.triggerHitstop(14, 14);
        engine.spawnParticles(opponent.x, opponent.y - 60, '#ff0066', 35, 11);
        engine.addFloatingText("DRIVE IMPACT CRUSH!!", opponent.x, opponent.y - 115, '#ff0066', 26);
        return;
      }

      if (opponentInArmorWindow) {
        opponent.diArmorHits++;

        if (opponent.diArmorHits < maxArmor) {
          opponent.hp = Math.max(1, opponent.hp - Math.floor(move.dmg * 0.3));
          engine.triggerHitstop(7, 5);
          engine.spawnParticles(opponent.x, opponent.y - 60, '#00f0ff', 18, 7);
          engine.addFloatingText(`DI ARMOR (${opponent.diArmorHits}/${maxArmor})`, opponent.x, opponent.y - 105, '#00f0ff', 20);
          return;
        } else if (opponent.diArmorHits === maxArmor) {
          opponent.diShieldBroken = true;
          opponent.hp = Math.max(1, opponent.hp - Math.floor(move.dmg * 0.3));
          engine.triggerHitstop(9, 8);
          engine.spawnParticles(opponent.x, opponent.y - 60, '#ffdf33', 30, 10);
          engine.addFloatingText(`SHIELD BROKEN! (${maxArmor}/${maxArmor})`, opponent.x, opponent.y - 110, '#ffdf33', 22);
          return;
        } else {
          opponent.currentMove = null;
          opponent.state = 'HIT';
          opponent.stateTimer = 42;
          opponent.hp = Math.max(0, opponent.hp - move.dmg);
          opponent.vx = this.facing * 8;
          engine.endSlowMo();
          engine.triggerHitstop(12, 10);
          engine.spawnParticles(opponent.x, opponent.y - 60, '#ff0044', 32, 10);
          engine.addFloatingText("ARMOR SHATTERED!", opponent.x, opponent.y - 115, '#ff0044', 24);
          return;
        }
      }
    }

    if ((opponent.state === 'PERFECT_BLOCK' || opponent.holdingPerfectBlock) && !move.unblockable && !move.isDriveImpact) {
      opponent.state = 'PERFECT_BLOCK';
      opponent.vx = this.facing * (move.push * GameConfig.PERFECT_BLOCK.PUSHBACK_MULT);
      engine.triggerHitstop(6, 2);
      engine.spawnParticles(opponent.x - this.facing * 20, opponent.y - 60, '#00ff88', 16, 6);
      engine.addFloatingText("PERFECT BLOCK (0 DMG)", opponent.x, opponent.y - 100, '#00ff88', 18);
      return;
    }

    let normalBlocked = false;
    const canGuard = (opponent.state === 'IDLE' || opponent.state === 'WALK' || opponent.state === 'CROUCH' || opponent.state === 'BLOCK');
    if (canGuard && opponent.holdingBack && !move.unblockable && opponent.y >= GameConfig.FLOOR_Y) {
      if (move.type === 'low' && opponent.holdingDown) normalBlocked = true;
      else if (move.type === 'overhead' && !opponent.holdingDown) normalBlocked = true;
      else if (move.type === 'mid' || move.type === 'high') normalBlocked = true;
    }

    if (!normalBlocked && opponent.state === 'ATTACK' && opponent.currentMove && opponent.currentMove.armor && !move.unblockable && !move.isDriveImpact) {
      opponent.hp = Math.max(1, opponent.hp - Math.floor(move.dmg * 0.4));
      engine.triggerHitstop(6, 4);
      engine.spawnParticles(opponent.x, opponent.y - 60, '#ff8800', 14, 6);
      engine.addFloatingText("ARMOR!", opponent.x, opponent.y - 100, '#ff9900', 20);
      return;
    }

    if (normalBlocked) {
      opponent.state = 'BLOCK';
      opponent.stateTimer = move.blockstun;
      opponent.vx = this.facing * (move.push * (move.isDriveImpact ? 1.45 : 0.8));
      const chipDmg = Math.max(2, Math.floor(move.dmg * 0.12));
      opponent.hp = Math.max(1, opponent.hp - chipDmg);
      this.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, this.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_BLOCK);
      engine.triggerHitstop(5, 3);
      engine.spawnParticles(opponent.x - this.facing * 15, opponent.y - 60, '#44aaff', 12, 5);
      engine.addFloatingText(`GUARD (-${chipDmg})`, opponent.x, opponent.y - 95, '#66ccff', 16);
    } else {
      this.comboCount++;
      const scaling = Math.max(0.35, 1 - (this.comboCount - 1) * 0.1);
      const finalDmg = Math.max(10, Math.floor(move.dmg * scaling));
      this.comboDamage += finalDmg;
      opponent.hp = Math.max(0, opponent.hp - finalDmg);

      this.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, this.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HIT);
      opponent.superMeter = Math.min(GameConfig.GAUGES.MAX_SUPER, opponent.superMeter + GameConfig.GAUGES.SUPER_GAIN_ON_HURT);

      if (move.isDriveImpact) {
        opponent.state = 'CRUMPLE';
        opponent.stateTimer = GameConfig.DRIVE_IMPACT.CRUMPLE_FRAMES;
        opponent.vx = this.facing * move.vx;
        engine.endSlowMo();
        engine.triggerHitstop(13, 12);
        engine.spawnParticles((this.x + opponent.x) / 2, opponent.y - 60, '#ff0066', 32, 10);
        engine.addFloatingText("PUNISH CRUMPLE!!", opponent.x, opponent.y - 115, '#ff0066', 25);
        return;
      }

      const heavy = (move.dmg >= 85 || move.launcher || move.superLevel);
      engine.triggerHitstop(heavy ? 10 : 6, heavy ? 9 : 4);
      engine.spawnParticles((this.x + opponent.x) / 2, opponent.y - 60, this.data.color, 22, 8);

      const wasAirborne = (opponent.y < GameConfig.FLOOR_Y || opponent.state === 'AIR_HIT');
      if (move.launcher || move.knockdown || wasAirborne) {
        opponent.state = 'AIR_HIT';
        opponent.juggleCount++;
        const decay = Math.min(3.2, opponent.juggleCount * 0.55);
        opponent.vy = (move.vy < -3 ? move.vy : -7.5) + decay;
        opponent.vx = this.facing * (move.vx || 3.8);
        opponent.y -= 4;
        if (move.launcher && opponent.juggleCount === 1) {
          engine.addFloatingText("LAUNCH!!", opponent.x, opponent.y - 105, '#00ffcc', 23);
        }
      } else {
        opponent.state = 'HIT';
        opponent.stateTimer = move.hitstun;
        opponent.vx = this.facing * move.push;
      }
    }
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
    } else if (this.state === 'CRUMPLE') {
      pose.hipY = -34;
      pose.torsoTilt = 0.52;
      pose.headTilt = 0.4;
      pose.fShoulder = 0.1; pose.fElbow = 0.2;
      pose.bShoulder = 0.2; pose.bElbow = 0.2;
      pose.fHip = -0.6; pose.fKnee = 1.1;
      pose.bHip = -0.4; pose.bKnee = 0.9;
    } else if (this.state === 'KNOCKDOWN') {
      const rem = this.stateTimer;
      const wakeFrames = GameConfig.KNOCKDOWN.WAKEUP_ANIM_FRAMES;
      if (rem > wakeFrames) {
        pose.hipY = -12;
        pose.torsoTilt = -Math.PI / 2;
        pose.fShoulder = -0.4; pose.fElbow = -0.4;
        pose.bShoulder = 0.2;  pose.bElbow = -0.2;
        pose.fHip = 0.1;       pose.fKnee = 0.2;
        pose.bHip = -0.1;      pose.bKnee = 0.3;
      } else {
        const wakeRatio = 1 - (rem / wakeFrames);
        pose.hipY = -12 - wakeRatio * 36;
        pose.torsoTilt = (-Math.PI / 2) * (1 - wakeRatio);
        pose.fHip = -0.8 * (1 - wakeRatio);
        pose.fKnee = 1.2 * (1 - wakeRatio);
      }
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
      } else if (m.anim === 'CROUCH_JAB' || m.anim === 'CROUCH_STRAIGHT') {
        pose.hipY = -30;
        pose.fHip = -0.95; pose.fKnee = 1.45;
        pose.bHip = -0.75; pose.bKnee = 1.35;
        pose.fShoulder = -Math.PI / 2 * phase;
        pose.fElbow = -0.08 * phase;
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
        pose.torsoTilt = 0.2 * phase;
        pose.fHip = isStartup ? -Math.PI * 0.75 : -Math.PI * 0.42;
        pose.fKnee = 0.1;
      } else if (m.anim === 'CROUCH_KICK' || m.anim === 'SWEEP') {
        pose.hipY = -26;
        pose.torsoTilt = -0.25;
        pose.bHip = -0.9; pose.bKnee = 1.4;
        pose.fHip = -Math.PI * 0.44 * phase;
        pose.fKnee = 0.02;
      } else if (m.anim === 'PROJECTILE' || m.anim === 'GRAB_ATTEMPT') {
        pose.torsoTilt = 0.22 * phase;
        pose.fShoulder = -Math.PI / 2 * phase; pose.fElbow = 0;
        pose.bShoulder = -Math.PI / 2 * phase; pose.bElbow = 0;
      } else if (m.anim === 'DRIVE_IMPACT') {
        pose.torsoTilt = isActive ? 0.35 : -0.3;
        pose.bShoulder = isActive ? -Math.PI / 2 : 0.65;
        pose.bElbow = isActive ? 0 : -1.2;
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
        pose.bShoulder = 0.45; pose.bElbow = -0.9;
      } else if (m.anim === 'AIR_STRAIGHT') {
        pose.hipY = -52;
        pose.torsoTilt = 0.28 * phase;
        pose.fHip = -0.75; pose.fKnee = 1.25;
        pose.bHip = -0.65; pose.bKnee = 1.25;
        pose.bShoulder = (-Math.PI * 0.48) * phase;
        pose.bElbow = -0.05 * phase;
        pose.fShoulder = 0.35; pose.fElbow = -1.1;
      } else if (m.anim === 'AIR_HEAVY_PUNCH') {
        pose.hipY = -50;
        pose.torsoTilt = isStartup ? -0.25 : 0.42 * phase;
        pose.fHip = -0.95; pose.fKnee = 1.4;
        pose.bHip = -0.4;  pose.bKnee = 1.1;
        pose.bShoulder = isStartup ? -2.2 : (-Math.PI * 0.30) * phase;
        pose.bElbow = isStartup ? -0.8 : -0.05;
        pose.fShoulder = 0.5; pose.fElbow = -1.0;
      } else if (m.anim === 'AIR_LOW_KICK') {
        pose.hipY = -50;
        pose.torsoTilt = 0.15;
        pose.fHip = (-Math.PI * 0.34) * phase - 0.8 * (1 - phase);
        pose.fKnee = 0.45 * phase + 1.2 * (1 - phase);
        pose.bHip = -0.45; pose.bKnee = 1.25;
        pose.fShoulder = -0.6; pose.fElbow = -1.1;
      } else if (m.anim === 'AIR_MID_KICK') {
        pose.hipY = -52;
        pose.torsoTilt = -0.28 * phase;
        pose.fHip = (-Math.PI * 0.46) * phase - 0.7 * (1 - phase);
        pose.fKnee = 0.04 * phase + 1.1 * (1 - phase);
        pose.bHip = -0.85; pose.bKnee = 1.45;
        pose.fShoulder = -0.8; pose.fElbow = -1.0;
        pose.bShoulder = 0.55; pose.bElbow = -0.8;
      } else if (m.anim === 'AIR_HEAVY_KICK') {
        pose.hipY = -50;
        pose.torsoTilt = 0.26 * phase;
        pose.fHip = -0.95; pose.fKnee = 1.45;
        pose.bHip = (-Math.PI * 0.35) * phase - 0.5 * (1 - phase);
        pose.bKnee = 0.02 * phase + 1.1 * (1 - phase);
        pose.fShoulder = 0.45; pose.fElbow = -0.9;
        pose.bShoulder = -0.75; pose.bElbow = -1.0;
      }
    }

    return pose;
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

    if (this.state === 'HIT' || this.state === 'AIR_HIT' || this.state === 'CRUMPLE') {
      frontStroke = '#ff2255';
      frontFill = '#4a1528';
    } else if (this.state === 'PERFECT_BLOCK') {
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

    if (this.state === 'ATTACK' && this.currentMove && this.currentMove.isDriveImpact) {
      ctx.save();
      if (!this.diShieldBroken) {
        ctx.strokeStyle = this.diArmorHits === 0 ? '#ff0066' : '#00f0ff';
        ctx.fillStyle = 'rgba(255, 0, 102, 0.16)';
        ctx.lineWidth = 3;
        ctx.fillRect(-36, -108, 72, 106);
        ctx.strokeRect(-36, -108, 72, 106);
      } else {
        ctx.strokeStyle = '#ffdf33';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 6]);
        ctx.strokeRect(-38, -110, 76, 108);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    if (this.state === 'PERFECT_BLOCK') {
      ctx.strokeStyle = '#00ff88';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.14)';
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
        ctx.fillStyle = m.superLevel ? 'rgba(255, 215, 0, 0.65)' : 'rgba(255, 0, 68, 0.50)';
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

    ctx.save();
    ctx.font = "700 11px monospace";
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    if (this.state === 'KNOCKDOWN') {
      const secLeft = Math.max(0, (this.stateTimer / 60)).toFixed(1);
      ctx.fillStyle = '#ffcf33';
      ctx.fillText(`[KNOCKDOWN ${secLeft}s]`, this.x, this.y - 118);
    } else if (this.state === 'THROWN') {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(`[PRESS LP+LK TO TECH!]`, this.x, this.y - 118);
    } else {
      ctx.fillText(`[${this.state}]`, this.x, this.y - 118);
    }
    ctx.restore();
  }
}

window.Fighter = Fighter;