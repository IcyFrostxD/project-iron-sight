// js/fighter_render.js
Object.assign(Fighter.prototype, {
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
  },

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
          pose.torsoTilt = -0.25;
          pose.fShoulder = -2.5; pose.fElbow = -0.4;
          pose.bShoulder = -2.4; pose.bElbow = -0.4;
        } else {
          pose.hipY = -26;
          pose.torsoTilt = 0.68;
          pose.fHip = -1.05; pose.fKnee = 1.5;
          pose.bHip = -0.65; pose.bKnee = 1.3;
          pose.fShoulder = -0.22; pose.fElbow = 0.05;
          pose.bShoulder = -0.18; pose.bElbow = 0.05;
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
  },

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
  },

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
});