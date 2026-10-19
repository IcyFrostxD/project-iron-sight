// js/pose.js
window.FighterPose = {
  computePose(f) {
    const breath = Math.sin(f.animTick * 0.1) * 0.06;
    const pose = {
      hipY: -48,
      torsoTilt: 0,
      headTilt: 0,
      fShoulder: -0.45 + breath, fElbow: -1.1,
      bShoulder: 0.25 - breath,  bElbow: -1.0,
      fHip: -0.18,               fKnee: 0.22,
      bHip: 0.22,                bKnee: 0.18
    };

    if (f.state === 'WALK') {
      const cycle = Math.sin(f.animTick * 0.22);
      pose.hipY = -48 + Math.abs(cycle) * 3;
      pose.fHip = cycle * 0.55;
      pose.fKnee = cycle > 0 ? 0.45 : 0.15;
      pose.bHip = -cycle * 0.55;
      pose.bKnee = cycle < 0 ? 0.45 : 0.15;
      pose.fShoulder = -0.35 - cycle * 0.35;
      pose.bShoulder = 0.2 + cycle * 0.35;
    } else if (f.state === 'DASH' || f.state === 'AIR_DASH') {
      const forwardDash = (f.dashDir === f.facing);
      pose.torsoTilt = forwardDash ? 0.42 : -0.35;
      pose.hipY = f.state === 'AIR_DASH' ? -52 : -44;
      pose.fHip = forwardDash ? -0.8 : 0.55;
      pose.fKnee = 0.7;
      pose.bHip = forwardDash ? 0.85 : -0.65;
      pose.bKnee = 0.55;
      pose.fShoulder = 0.45;
      pose.bShoulder = 0.65;
    } else if (f.state === 'THROW_TECH') {
      const ratio = f.stateTimer / GameConfig.THROW.TECH_STATE_FRAMES;
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
    } else if (f.state === 'VICTORY') {
      pose.hipY = -48;
      pose.torsoTilt = -0.12;
      pose.fShoulder = -Math.PI * 0.88; pose.fElbow = -0.15;
      pose.bShoulder = 0.35;            pose.bElbow = -1.1;
      pose.fHip = -0.22;                pose.fKnee = 0.15;
      pose.bHip = 0.25;                 pose.bKnee = 0.15;
    } else if (f.state === 'CROUCH') {
      pose.hipY = -30;
      pose.torsoTilt = 0.18;
      pose.fHip = -0.95; pose.fKnee = 1.45;
      pose.bHip = -0.75; pose.bKnee = 1.35;
      pose.fShoulder = -0.55; pose.fElbow = -1.25;
    } else if (f.state === 'JUMP') {
      pose.hipY = -52;
      pose.fHip = -0.85; pose.fKnee = 1.25;
      pose.bHip = -0.45; pose.bKnee = 1.1;
      pose.fShoulder = -0.7; pose.fElbow = -0.9;
      pose.bShoulder = 0.4;  pose.bElbow = -0.8;
    } else if (f.state === 'BLOCK' || f.state === 'PERFECT_BLOCK') {
      pose.hipY = -45;
      pose.torsoTilt = -0.12;
      pose.fShoulder = -0.95; pose.fElbow = -1.35;
      pose.bShoulder = -0.75; pose.bElbow = -1.25;
      pose.fHip = -0.3; pose.fKnee = 0.35;
      pose.bHip = 0.35; pose.bKnee = 0.3;
    } else if (f.state === 'HIT' || f.state === 'AIR_HIT') {
      pose.torsoTilt = -0.42;
      pose.headTilt = -0.3;
      pose.fShoulder = -1.1; pose.fElbow = -0.3;
      pose.bShoulder = -0.8; pose.bElbow = -0.2;
      pose.fHip = -0.4; pose.bHip = 0.3;
    } else if (f.state === 'KNOCKDOWN' || f.state === 'OTG_HIT') {
      const otgBounce = (f.state === 'OTG_HIT') ? Math.sin(f.animTick * 0.8) * 6 : 0;
      pose.hipY = -12 - Math.abs(otgBounce);
      pose.torsoTilt = -Math.PI / 2 + (f.state === 'OTG_HIT' ? 0.18 : 0);
      pose.fShoulder = -0.4; pose.fElbow = -0.4;
      pose.bShoulder = 0.2;  pose.bElbow = -0.2;
      pose.fHip = 0.1;       pose.fKnee = 0.25;
      pose.bHip = -0.15;     pose.bKnee = 0.35;
    } else if (f.state === 'WAKEUP') {
      const totalWake = Math.round(GameConfig.KNOCKDOWN.WAKEUP_DURATION_SECONDS * 60);
      const progress = Math.max(0, Math.min(1, 1 - (f.stateTimer / totalWake)));

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
    } else if (f.state === 'ATTACK' && f.currentMove) {
      const m = f.currentMove;
      const isStartup = f.moveTimer < m.startup;
      const isActive = f.moveTimer >= m.startup && f.moveTimer < m.startup + m.active;
      const phase = isStartup ? (f.moveTimer / m.startup) * 0.35 : (isActive ? 1.0 : 0.45);

      if (m.anim === 'LEAD_JAB' || m.anim === 'JAB') {
        pose.torsoTilt = 0.12 * phase;
        if (f.altLimb) {
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
      } else if (m.anim === 'FLOOR_SLAM' || m.anim === 'AIR_FLOOR_SLAM') {
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
  },

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

  drawSpongeBobLeg(ctx, rootX, rootY, upperLen, lowerLen, upperAngle, lowerAngle) {
    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate(upperAngle);

    ctx.fillStyle = '#5c330a';
    ctx.strokeStyle = '#1e1205';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-8, -2, 16, 8, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff200';
    ctx.strokeStyle = '#8f8400';
    ctx.fillRect(-4, 6, 8, upperLen - 4);
    ctx.strokeRect(-4, 6, 8, upperLen - 4);

    ctx.translate(0, upperLen);
    ctx.rotate(lowerAngle);

    ctx.fillStyle = '#fff200';
    ctx.fillRect(-4, 0, 8, lowerLen * 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-4.5, lowerLen * 0.35, 9, lowerLen * 0.65);
    ctx.strokeRect(-4.5, lowerLen * 0.35, 9, lowerLen * 0.65);

    ctx.fillStyle = '#0088ff';
    ctx.fillRect(-4, lowerLen * 0.45, 8, 2.5);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(-4, lowerLen * 0.65, 8, 2.5);

    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-7, lowerLen - 3, 20, 11, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, lowerLen + 1, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  drawSpongeBobArm(ctx, rootX, rootY, upperLen, lowerLen, upperAngle, lowerAngle, withFryingPan = false, isSlamActive = false) {
    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate(upperAngle);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-7, -3, 14, 11, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff200';
    ctx.strokeStyle = '#8f8400';
    ctx.fillRect(-3.5, 8, 7, upperLen - 6);
    ctx.strokeRect(-3.5, 8, 7, upperLen - 6);

    ctx.translate(0, upperLen);
    ctx.rotate(lowerAngle);

    ctx.fillStyle = '#fff200';
    ctx.fillRect(-3.5, 0, 7, lowerLen);
    ctx.strokeRect(-3.5, 0, 7, lowerLen);

    ctx.beginPath();
    ctx.arc(0, lowerLen + 3, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (withFryingPan) {
      ctx.save();
      ctx.translate(0, lowerLen + 4);
      ctx.rotate(isSlamActive ? Math.PI * 0.35 : 0.15);

      ctx.fillStyle = '#1b1f26';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(-3, 0, 6, 26);
      ctx.strokeRect(-3, 0, 6, 26);

      ctx.fillStyle = '#232933';
      ctx.strokeStyle = '#d1d9e6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-22, 24, 44, 15, 5);
      ctx.fill();
      ctx.stroke();

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
  },

  drawSpongeBobBody(ctx, f, p, pose) {
    const isHit = (f.state === 'HIT' || f.state === 'AIR_HIT' || f.state === 'OTG_HIT');
    const isUsingPan = !!(f.state === 'ATTACK' && f.currentMove && (f.currentMove.isFloorSlam || f.currentMove.isAirFloorSlam || f.currentMove.usesPan || f.currentMoveKey === '2HP' || f.currentMoveKey === '82HP'));
    const isSlamActive = !!(f.state === 'ATTACK' && f.currentMove && f.moveTimer >= f.currentMove.startup);

    this.drawSpongeBobLeg(ctx, -11, pose.hipY, p.upperLegL, p.lowerLegL, pose.bHip, pose.bKnee);
    this.drawSpongeBobLeg(ctx, 11, pose.hipY, p.upperLegL, p.lowerLegL, pose.fHip, pose.fKnee);

    ctx.save();
    ctx.translate(0, pose.hipY);
    ctx.rotate(pose.torsoTilt);

    this.drawSpongeBobArm(ctx, -22, -32, p.upperArmL, p.lowerArmL, pose.bShoulder, pose.bElbow, isUsingPan, isSlamActive);

    const w = 52;
    const spongeH = 52;
    const shirtH = 10;
    const pantsH = 13;

    ctx.fillStyle = '#6b3e11';
    ctx.strokeStyle = '#1a0f04';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-w / 2, -pantsH + 2, w, pantsH);
    ctx.strokeRect(-w / 2, -pantsH + 2, w, pantsH);

    ctx.fillStyle = '#111111';
    ctx.fillRect(-w / 2 + 4, -pantsH + 4, 9, 3.5);
    ctx.fillRect(-5, -pantsH + 4, 10, 3.5);
    ctx.fillRect(w / 2 - 13, -pantsH + 4, 9, 3.5);

    const shirtTopY = -pantsH - shirtH + 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.fillRect(-w / 2, shirtTopY, w, shirtH);
    ctx.strokeRect(-w / 2, shirtTopY, w, shirtH);

    ctx.beginPath();
    ctx.moveTo(-14, shirtTopY);
    ctx.lineTo(-5, shirtTopY + 7);
    ctx.lineTo(0, shirtTopY);
    ctx.moveTo(0, shirtTopY);
    ctx.lineTo(5, shirtTopY + 7);
    ctx.lineTo(14, shirtTopY);
    ctx.stroke();

    const spongeTopY = shirtTopY - spongeH;
    ctx.fillStyle = isHit ? '#ff6677' : '#fff200';
    ctx.strokeStyle = '#998a00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 2, spongeTopY, w + 4, spongeH + 2, 6);
    ctx.fill();
    ctx.stroke();

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

    const eyeY = spongeTopY + 19;
    const drawEye = (ex) => {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      for (const ang of [-0.35, 0, 0.35]) {
        ctx.beginPath();
        ctx.moveTo(ex + Math.sin(ang) * 8, eyeY - 9);
        ctx.lineTo(ex + Math.sin(ang) * 12, eyeY - 14);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex, eyeY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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

    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.arc(0, mouthY + 13, 6, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-5, mouthY + 1, 5.5, 7);
    ctx.strokeRect(-5, mouthY + 1, 5.5, 7);
    ctx.fillRect(2, mouthY + 1, 5.5, 7);
    ctx.strokeRect(2, mouthY + 1, 5.5, 7);

    this.drawSpongeBobArm(ctx, 22, -32, p.upperArmL, p.lowerArmL, pose.fShoulder, pose.fElbow, isUsingPan, isSlamActive);
    ctx.restore();
  },

  drawKnockdownQTE(ctx, f) {
    if (f.state !== 'KNOCKDOWN') return;

    ctx.save();
    const boxY = f.y - 102;

    if (f.autoWakeupActive) {
      const barW = 148;
      const ratio = Math.max(0, f.autoWakeupFramesLeft / 30);
      ctx.fillStyle = '#111624';
      ctx.fillRect(f.x - barW / 2, boxY - 8, barW, 8);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(f.x - barW / 2, boxY - 8, barW * ratio, 8);

      ctx.font = "900 11px monospace";
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'center';
      ctx.fillText(f.autoWakeupLabel || "AUTO WAKEUP (1.0s)", f.x, boxY - 14);
      ctx.restore();
      return;
    }

    const qteWinFrames = Math.round(GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS * 60);
    const totalPenaltyFrames = Math.round((GameConfig.KNOCKDOWN.QTE_WINDOW_SECONDS + GameConfig.KNOCKDOWN.PENALTY_ADD_SECONDS) * 60);

    const spacing = 44;
    const startX = f.x - spacing;
    for (let i = 0; i < f.qteSequence.length; i++) {
      const bx = startX + i * spacing;
      const done = i < f.qteIndex;
      const active = i === f.qteIndex && !f.qteFailed;

      ctx.fillStyle = done ? '#00ff88' : (f.qteFailed ? '#3d1522' : (active ? '#ffcf33' : '#161f33'));
      ctx.strokeStyle = done ? '#ffffff' : (active ? '#ffffff' : '#3a4b78');
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.fillRect(bx - 18, boxY - 22, 36, 22);
      ctx.strokeRect(bx - 18, boxY - 22, 36, 22);

      ctx.font = "900 11px monospace";
      ctx.fillStyle = (done || active) ? '#050811' : '#9cb1d4';
      ctx.textAlign = 'center';
      ctx.fillText(f.qteSequence[i], bx, boxY - 7);
    }

    const barW = 128;
    ctx.fillStyle = '#111624';
    ctx.fillRect(f.x - barW / 2, boxY + 5, barW, 7);

    if (!f.qteFailed) {
      const ratio = Math.max(0, 1 - (f.knockdownElapsed / qteWinFrames));
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(f.x - barW / 2, boxY + 5, barW * ratio, 7);
    } else {
      const remSec = Math.max(0, (totalPenaltyFrames - f.knockdownElapsed) / 60).toFixed(1);
      const ratio = Math.max(0, 1 - (f.knockdownElapsed / totalPenaltyFrames));
      ctx.fillStyle = '#ff2255';
      ctx.fillRect(f.x - barW / 2, boxY + 5, barW * ratio, 7);

      ctx.font = "800 11px monospace";
      ctx.fillStyle = '#ff4477';
      ctx.textAlign = 'center';
      ctx.fillText(`PENALTY WAIT: ${remSec}s`, f.x, boxY - 28);
    }

    const revCost = (GameConfig.REVERSAL && GameConfig.REVERSAL.SUPER_COST) || 200;
    if (f.superMeter >= revCost) {
      ctx.font = "800 10px monospace";
      ctx.fillStyle = '#ff0066';
      ctx.textAlign = 'center';
      ctx.fillText("PRESS LB / [P] FOR 2-BAR REVERSAL!", f.x, boxY + 24);
    }

    ctx.restore();
  },

  drawFighter(ctx, f) {
    for (const img of f.afterimages) {
      ctx.save();
      ctx.translate(img.x, img.y);
      ctx.scale(img.facing, 1);
      ctx.fillStyle = f.data.color;
      ctx.globalAlpha = img.alpha * 0.35;
      ctx.fillRect(-20, -90, 40, 90);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(f.x, f.y);

    const groundOffset = GameConfig.FLOOR_Y - f.y;
    const shadowScale = Math.max(0.35, 1 - groundOffset / 260);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-30 * shadowScale, groundOffset - 4, 60 * shadowScale, 8);

    ctx.scale(f.facing, 1);

    const p = f.data.proportions || { torsoW: 34, torsoH: 44, upperArmL: 22, lowerArmL: 22, upperLegL: 24, lowerLegL: 24 };
    const pose = this.computePose(f);

    if (f.charKey === 'TITAN' || f.data.isSpongeBob) {
      this.drawSpongeBobBody(ctx, f, p, pose);
    } else {
      let frontStroke = f.data.color;
      let frontFill = '#1b263e';
      const backStroke = '#3b4f78';
      const backFill = '#101726';

      if (f.state === 'HIT' || f.state === 'AIR_HIT' || f.state === 'OTG_HIT') {
        frontStroke = '#ff2255';
        frontFill = '#4a1528';
      } else if (f.state === 'PERFECT_BLOCK' || f.state === 'WAKEUP') {
        frontStroke = '#00ff88';
        frontFill = '#113828';
      } else if (f.state === 'THROW_TECH') {
        frontStroke = '#ffdf33';
        frontFill = '#3b3212';
      } else if (f.state === 'BLOCK') {
        frontStroke = '#44aaff';
      }

      this.drawTwoSegmentLimb(ctx, -6, pose.hipY, p.upperLegL, p.lowerLegL, pose.bHip, pose.bKnee, 13, backFill, backStroke, 16, 7);
      this.drawTwoSegmentLimb(ctx, 6, pose.hipY, p.upperLegL, p.lowerLegL, pose.fHip, pose.fKnee, 14, frontFill, frontStroke, 17, 8);

      ctx.save();
      ctx.translate(0, pose.hipY);
      ctx.rotate(pose.torsoTilt);

      this.drawTwoSegmentLimb(ctx, -8, -p.torsoH + 6, p.upperArmL, p.lowerArmL, pose.bShoulder, pose.bElbow, 11, backFill, backStroke, 13, 11);

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

      this.drawTwoSegmentLimb(ctx, 8, -p.torsoH + 6, p.upperArmL, p.lowerArmL, pose.fShoulder, pose.fElbow, 12, frontFill, frontStroke, 14, 12);
      ctx.restore();
    }

    if (f.state === 'PERFECT_BLOCK') {
      ctx.strokeStyle = '#00ff88';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.16)';
      ctx.lineWidth = 3;
      ctx.fillRect(-38, -110, 76, 110);
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-38, -110, 76, 110);
      ctx.setLineDash([]);
    }

    if (f.state === 'ATTACK' && f.currentMove) {
      const m = f.currentMove;
      const isStartup = f.moveTimer < m.startup;
      const isActive = f.moveTimer >= m.startup && f.moveTimer < m.startup + m.active;

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
          ctx.fillStyle = f.data.color;
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

    if (f.state === 'KNOCKDOWN') {
      this.drawKnockdownQTE(ctx, f);
    } else {
      ctx.save();
      ctx.font = "700 11px monospace";
      ctx.fillStyle = f.state === 'WAKEUP' ? '#00ff88' : '#cbd5e1';
      ctx.textAlign = 'center';
      if (f.airActionsLocked && f.y < GameConfig.FLOOR_Y) {
        ctx.fillStyle = '#ff4477';
        ctx.fillText(`[UPPERCUT LOCK - FALLING]`, f.x, f.y - 118);
      } else if (f.state === 'AIR_HIT' && f.airComboFramesLeft > 0) {
        const airSec = (f.airComboFramesLeft / 60).toFixed(1);
        ctx.fillStyle = '#00ffcc';
        ctx.fillText(`[AIR: ${airSec}s | LAUNCH ${f.launchCount}/2]`, f.x, f.y - 118);
      } else if (f.launchImmune) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(`[${f.state} | FLOOR SLAM IMMUNE]`, f.x, f.y - 118);
      } else {
        ctx.fillText(`[${f.state}]`, f.x, f.y - 118);
      }
      ctx.restore();
    }
  }
};