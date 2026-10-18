// js/renderer.js
class GameRenderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  // Critical: Renders the entire match frame including camera transform, arena, fighters, effects, and HUD
  render(engine) {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = '#090d18';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    ctx.save();
    if (engine.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * engine.screenShake * 1.6,
        (Math.random() - 0.5) * engine.screenShake * 1.6
      );
      engine.screenShake = Math.max(0, engine.screenShake - 1);
    }

    // Vertical Camera Tracking & Zoom
    ctx.translate(0, engine.cameraOffsetY);

    if (engine.cameraZoom > 1.005) {
      ctx.translate(GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2);
      ctx.scale(engine.cameraZoom, engine.cameraZoom);
      ctx.translate(-engine.cameraFocusX, -engine.cameraFocusY);
    }

    this.drawArena(ctx, engine);
    this.drawProjectiles(ctx, engine);

    engine.p1.draw(ctx);
    engine.p2.draw(ctx);

    this.drawEffects(ctx, engine);
    ctx.restore();

    this.drawSuperFreezeBanner(ctx, engine);
    this.drawHUD(ctx, engine);
    ctx.restore();
  }

  drawArena(ctx, engine) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1000; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, -150); ctx.lineTo(x, GameConfig.FLOOR_Y); ctx.stroke();
    }
    for (let y = -150; y <= GameConfig.FLOOR_Y; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1000, y); ctx.stroke();
    }

    if (engine.superFreezeTimer > 0 && engine.superCaster) {
      ctx.fillStyle = 'rgba(4, 6, 14, 0.78)';
      ctx.fillRect(0, -150, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT + 150);

      const radius = (GameConfig.GAUGES.SUPER_FREEZE_FRAMES - engine.superFreezeTimer) * 9;
      ctx.strokeStyle = engine.superCaster.data.color;
      ctx.lineWidth = 3 + engine.superLevelActive * 2;
      ctx.beginPath();
      ctx.arc(engine.superCaster.x, engine.superCaster.y - 60, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GameConfig.FLOOR_Y);
    ctx.lineTo(GameConfig.CANVAS_WIDTH, GameConfig.FLOOR_Y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 0, 102, 0.14)';
    ctx.fillRect(0, 60, GameConfig.STAGE_LEFT, GameConfig.FLOOR_Y - 60);
    ctx.fillRect(GameConfig.STAGE_RIGHT, 60, 55, GameConfig.FLOOR_Y - 60);
  }

  drawProjectiles(ctx, engine) {
    for (const pr of engine.projectiles) {
      const dir = pr.vx >= 0 ? 1 : -1;
      const tailW = (pr.speedTier || 8) * 3.2;
      ctx.fillStyle = pr.color;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(pr.x - dir * tailW, pr.y - 12, dir * tailW, 24);
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(255, 0, 68, 0.75)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(pr.x - 16, pr.y - 16, 32, 32);
      ctx.strokeRect(pr.x - 16, pr.y - 16, 32, 32);
    }
  }

  drawEffects(ctx, engine) {
    for (let i = engine.shockwaves.length - 1; i >= 0; i--) {
      const sw = engine.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.22;
      sw.life--;
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = Math.max(0, sw.life / sw.maxLife);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (sw.life <= 0) engine.shockwaves.splice(i, 1);
    }

    for (let i = engine.particles.length - 1; i >= 0; i--) {
      const pt = engine.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      if (pt.life <= 0) engine.particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
      const ft = engine.floatingTexts[i];
      ft.y -= 1.0;
      ft.life--;
      ctx.font = `900 ${ft.size}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      if (ft.life <= 0) engine.floatingTexts.splice(i, 1);
    }
  }

  drawSuperFreezeBanner(ctx, engine) {
    if (engine.superFreezeTimer > 0 && engine.superCaster) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.fillRect(0, 210, 1000, 90);
      ctx.strokeStyle = engine.superCaster.data.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 210, 1000, 90);

      ctx.textAlign = 'center';
      ctx.font = "900 36px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SUPER ART LEVEL ${engine.superLevelActive}: ${engine.superTitle}`, 500, 266);
    }
  }

  drawSuperBars(ctx, x, y, meter, isRightAligned = false) {
    const barW = 115;
    const barH = 16;
    const gap = 8;
    const colors = ['#00e5ff', '#00ff88', '#ff0066'];

    for (let i = 0; i < 3; i++) {
      const boxX = isRightAligned ? (x - (i + 1) * barW - i * gap) : (x + i * (barW + gap));
      ctx.fillStyle = '#121829';
      ctx.fillRect(boxX, y, barW, barH);

      const segValue = Math.max(0, Math.min(100, meter - i * 100));
      const fillW = (segValue / 100) * barW;

      ctx.fillStyle = (segValue >= 100) ? colors[i] : '#3a5078';
      ctx.fillRect(boxX, y, fillW, barH);

      ctx.strokeStyle = (segValue >= 100) ? '#ffffff' : '#2c3b59';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, y, barW, barH);

      ctx.font = "800 10px monospace";
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`LV ${i + 1}`, boxX + barW / 2, y + 12);
    }
  }

  drawRoundWinPips(ctx, engine) {
    const req = GameConfig.MATCH.ROUNDS_TO_WIN;
    for (let i = 0; i < req; i++) {
      const p1X = 452 - i * 20;
      ctx.fillStyle = (engine.p1Rounds > i) ? '#ffcf33' : '#1b2234';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillRect(p1X, 55, 13, 13);
      ctx.strokeRect(p1X, 55, 13, 13);

      const p2X = 535 + i * 20;
      ctx.fillStyle = (engine.p2Rounds > i) ? '#ffcf33' : '#1b2234';
      ctx.fillRect(p2X, 55, 13, 13);
      ctx.strokeRect(p2X, 55, 13, 13);
    }
  }

  drawHUD(ctx, engine) {
    const barW = 400;
    const barH = 22;

    ctx.fillStyle = '#1a2133';
    ctx.fillRect(40, 20, barW, barH);
    ctx.fillRect(560, 20, barW, barH);

    const p1Ratio = Math.max(0, engine.p1.hp / engine.p1.maxHp);
    ctx.fillStyle = p1Ratio > 0.3 ? '#00f0ff' : '#ff2a55';
    ctx.fillRect(40 + barW * (1 - p1Ratio), 20, barW * p1Ratio, barH);

    const p2Ratio = Math.max(0, engine.p2.hp / engine.p2.maxHp);
    ctx.fillStyle = p2Ratio > 0.3 ? '#ff0066' : '#ffae00';
    ctx.fillRect(560, 20, barW * p2Ratio, barH);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 20, barW, barH);
    ctx.strokeRect(560, 20, barW, barH);

    this.drawSuperBars(ctx, 40, 50, engine.p1.superMeter, false);
    this.drawSuperBars(ctx, 960, 50, engine.p2.superMeter, true);
    this.drawRoundWinPips(ctx, engine);

    ctx.font = "800 12px 'Segoe UI', sans-serif";
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    const p1CanPB = (engine.p1.superMeter >= GameConfig.PERFECT_BLOCK.MIN_SUPER_REQ || engine.p1.state === 'PERFECT_BLOCK')
      ? 'READY'
      : 'LOCKED (NEED 1 BAR)';
    ctx.fillText(`P1: ${engine.p1.data.name} | GUARD(H/LT): ${p1CanPB} | AIR DASH: ${1 - engine.p1.airDashCount}/1`, 40, 84);

    ctx.textAlign = 'right';
    const p2MaxAir = (engine.p2.maxAirComboFrames / 60).toFixed(1);
    ctx.fillText(`P2: ${engine.p2.data.name} | AIR: ${p2MaxAir}s | LAUNCHED: ${engine.p2.launchCount}/2`, 960, 84);

    ctx.textAlign = 'center';
    ctx.font = "900 32px 'Segoe UI', sans-serif";
    ctx.fillStyle = '#ffcf33';
    ctx.fillText(engine.currentMode === 'TRAINING' ? 'INF' : Math.ceil(engine.matchTimer / 60), 500, 45);

    ctx.fillStyle = 'rgba(10, 15, 28, 0.82)';
    ctx.fillRect(14, 115, 140, 215);
    ctx.strokeStyle = '#263554';
    ctx.strokeRect(14, 115, 140, 215);

    ctx.textAlign = 'left';
    ctx.font = "700 11px monospace";
    ctx.fillStyle = '#8aa2c9';
    ctx.fillText("INPUT HISTORY", 22, 132);

    engine.p1.motionBuffer.visualHistory.forEach((item, idx) => {
      ctx.font = "900 12px monospace";
      ctx.fillStyle = item.color;
      ctx.fillText(item.symbol, 22, 154 + idx * 19);
    });

    if (engine.p1.bannerTimer > 0 && engine.p1.lastMoveBanner) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.fillRect(162, 92, 340, 28);
      ctx.font = "800 14px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`> ${engine.p1.lastMoveBanner}`, 172, 111);
    }

    if (engine.p1.comboCount > 1) {
      ctx.textAlign = 'left';
      ctx.font = "900 30px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`${engine.p1.comboCount} HITS!`, 165, 155);
      ctx.font = "700 16px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#fff';
      ctx.fillText(`DAMAGE: ${engine.p1.comboDamage}`, 165, 178);
    }

    if (engine.roundState === 'ROUND_INTRO') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 205, 1000, 110);
      ctx.textAlign = 'center';
      ctx.font = "900 44px 'Segoe UI', sans-serif";
      const isFinal = (engine.currentRound >= GameConfig.MATCH.MAX_ROUNDS);
      if (engine.roundPhaseTimer > 30) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(isFinal ? "FINAL ROUND" : `ROUND ${engine.currentRound}`, 500, 274);
      } else {
        ctx.fillStyle = '#ffcf33';
        ctx.fillText("FIGHT!!", 500, 274);
      }
    }

    if (engine.roundState === 'ROUND_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
      ctx.fillRect(0, 205, 1000, 110);
      ctx.textAlign = 'center';
      ctx.font = "900 34px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#ffcf33';
      ctx.fillText(engine.roundBannerText, 500, 270);
    }

    if (engine.roundState === 'MATCH_OVER' && engine.roundWinner) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 195, 1000, 130);
      ctx.textAlign = 'center';
      ctx.font = "900 38px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(engine.roundWinner, 500, 255);
      ctx.font = "600 18px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#fff';
      ctx.fillText("Click 'RESET MATCH' on the top bar to play again", 500, 295);
    }
  }
}

window.GameRenderer = GameRenderer;