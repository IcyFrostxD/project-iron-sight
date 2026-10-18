// js/engine.js
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.inputManager = new InputManager();

    this.state = 'MENU';
    this.currentMode = 'AI_NORMAL';
    this.p1SelectedChar = 'REN';
    this.p2SelectedChar = 'KIRA';

    this.p1 = null;
    this.p2 = null;
    this.frameCount = 0;
    this.hitstopFrames = 0;
    this.screenShake = 0;

    this.p1Rounds = 0;
    this.p2Rounds = 0;
    this.currentRound = 1;
    this.roundState = 'ROUND_INTRO';
    this.roundPhaseTimer = 0;
    this.roundBannerText = "";
    this.matchTimer = GameConfig.MATCH.ROUND_TIME_SECONDS * 60;
    this.roundWinner = null;

    this.cameraZoom = 1.0;
    this.targetZoom = 1.0;
    this.cameraFocusX = 500;
    this.cameraFocusY = 320;
    this.timeScale = 1.0;

    this.superFreezeTimer = 0;
    this.superCaster = null;
    this.superLevelActive = 0;
    this.superTitle = "";

    this.shockwaves = [];
    this.particles = [];
    this.projectiles = [];
    this.floatingTexts = [];

    this.renderCharSelectCards();
    requestAnimationFrame(() => this.loop());
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    if (screenId) {
      document.getElementById(screenId).classList.add('active');
    }
  }

  openCharSelect(mode) {
    this.currentMode = mode;
    this.state = 'CHAR_SELECT';
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('top-match-bar').classList.add('hidden');
    document.getElementById('bottom-guide').classList.add('hidden');

    const modeNames = {
      'AI_NORMAL': 'MODE: ARCADE VS AI (BEST OF 3)',
      'TRAINING': 'MODE: TRAINING (AIR COMBO & KNOCKDOWN QTE TEST)',
      'PVP': 'MODE: 2 PLAYERS VERSUS (BEST OF 3)'
    };
    document.getElementById('selectedModeLabel').textContent = modeNames[mode] || mode;
    this.renderCharSelectCards();
    this.showScreen('screen-char-select');
  }

  renderCharSelectCards() {
    const p1Container = document.getElementById('p1CharCards');
    const p2Container = document.getElementById('p2CharCards');
    p1Container.innerHTML = '';
    p2Container.innerHTML = '';

    Object.values(CHARACTERS).forEach(c => {
      const card1 = document.createElement('div');
      card1.className = `char-card ${this.p1SelectedChar === c.id ? 'selected-p1' : ''}`;
      card1.innerHTML = `<div class="char-name" style="color:${c.color}">${c.name}</div><div class="char-role">${c.role}</div>`;
      card1.onclick = () => { this.p1SelectedChar = c.id; this.renderCharSelectCards(); };
      p1Container.appendChild(card1);

      const card2 = document.createElement('div');
      card2.className = `char-card ${this.p2SelectedChar === c.id ? 'selected-p2' : ''}`;
      card2.innerHTML = `<div class="char-name" style="color:${c.color}">${c.name}</div><div class="char-role">${c.role}</div>`;
      card2.onclick = () => { this.p2SelectedChar = c.id; this.renderCharSelectCards(); };
      p2Container.appendChild(card2);
    });

    document.getElementById('p1PreviewInfo').innerHTML = CHARACTERS[this.p1SelectedChar].summary;
    document.getElementById('p2PreviewInfo').innerHTML = CHARACTERS[this.p2SelectedChar].summary;
  }

  startMatch() {
    this.showScreen(null);
    document.getElementById('top-match-bar').classList.remove('hidden');
    document.getElementById('bottom-guide').classList.remove('hidden');
    document.getElementById('pause-modal').classList.add('hidden');
    this.restartMatch();
  }

  restartMatch() {
    this.p1 = new Fighter(1, this.p1SelectedChar, 280, 1);
    this.p2 = new Fighter(2, this.p2SelectedChar, 720, -1);
    this.p1Rounds = 0;
    this.p2Rounds = 0;
    this.currentRound = 1;
    this.roundWinner = null;
    this.state = 'MATCH';
    this.startRoundIntro();
  }

  startRoundIntro() {
    this.p1.resetForNextRound(280, 1, this.currentRound > 1 && GameConfig.MATCH.CARRY_OVER_SUPER);
    this.p2.resetForNextRound(720, -1, this.currentRound > 1 && GameConfig.MATCH.CARRY_OVER_SUPER);
    this.particles = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.matchTimer = GameConfig.MATCH.ROUND_TIME_SECONDS * 60;
    this.cameraZoom = 1.0;
    this.targetZoom = 1.0;
    this.superFreezeTimer = 0;

    if (this.currentMode === 'TRAINING') {
      this.roundState = 'FIGHTING';
      this.roundPhaseTimer = 0;
    } else {
      this.roundState = 'ROUND_INTRO';
      this.roundPhaseTimer = GameConfig.MATCH.ROUND_INTRO_FRAMES;
    }
  }

  togglePause() {
    if (this.state === 'MATCH') {
      this.state = 'PAUSED';
      const c1 = CHARACTERS[this.p1SelectedChar];
      document.getElementById('modalMoveList').innerHTML = `
        <h3 style="color:${c1.color};margin-bottom:6px;">${c1.name} COMMAND LIST</h3>
        ${c1.summary}
        <hr style="border-color:#26314d;margin:10px 0;">
        <b>NEW COMBAT RULES:</b><br>
        - <b>Launchers &amp; Air Combos:</b> Use <code>2HP</code> or <code>623+P</code> to launch enemies (even from the ground!). Jump up and chain air attacks up to your character's Max Air Combo Time (up to 6.0s).<br>
        - <b>Knockdown 3-Button QTE:</b> Input the 3 buttons shown above your fighter within 2.0s to wake up immediately. Failing adds a +2.0s penalty (4.0s total).<br>
        - <b>Grounded OTG Hit Rule:</b> Attacking a downed enemy with <code>2HK</code> or <code>214+K</code> deals OTG damage, and the enemy wakes up immediately (in 0.5s) once the OTG attack finishes.<br>
        - <b>Ground Reversal (2 Super Bars):</b> Press <kbd>LB</kbd> / <kbd>P</kbd> while knocked down to spend 2 bars and blast away an incoming launcher/OTG attack.<br>
        - <b>Perfect Block (<kbd>LT</kbd> / <kbd>H</kbd>):</b> Drains only ${GameConfig.PERFECT_BLOCK.DRAIN_PER_FRAME} energy per frame (requires &gt;= 1 Bar).
      `;
      document.getElementById('pause-modal').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'MATCH';
      document.getElementById('pause-modal').classList.add('hidden');
    }
  }

  returnToMenu() {
    this.state = 'MENU';
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('top-match-bar').classList.add('hidden');
    document.getElementById('bottom-guide').classList.add('hidden');
    this.showScreen('screen-main-menu');
  }

  triggerSuperFreeze(caster, level, moveTitle) {
    this.superFreezeTimer = GameConfig.GAUGES.SUPER_FREEZE_FRAMES;
    this.superCaster = caster;
    this.superLevelActive = level;
    this.superTitle = moveTitle;
    this.cameraFocusX = caster.x;
    this.cameraFocusY = caster.y - 65;
    this.targetZoom = GameConfig.GAUGES.SUPER_ZOOM;
    this.spawnParticles(caster.x, caster.y - 60, caster.data.color, 35, 11);
  }

  triggerReversalEffect(caster) {
    this.triggerHitstop(10, 10);
    this.shockwaves.push({
      x: caster.x,
      y: GameConfig.FLOOR_Y - 45,
      radius: 15,
      maxRadius: 140,
      color: '#ff0066',
      life: 22,
      maxLife: 22
    });
    this.spawnParticles(caster.x, GameConfig.FLOOR_Y - 40, '#ff0066', 32, 10);
    this.addFloatingText("2-BAR GROUND REVERSAL!!", caster.x, caster.y - 120, '#ff0066', 24);
  }

  triggerThrowTechEffect(x, y) {
    this.triggerHitstop(8, 8);
    this.shockwaves.push({ x, y, radius: 10, maxRadius: 95, color: '#00f0ff', life: 18, maxLife: 18 });
    this.spawnParticles(x, y, '#ffdf33', 28, 9);
    this.spawnParticles(x, y, '#00f0ff', 18, 7);
    this.addFloatingText("THROW ESCAPE!", x, y - 55, '#00f0ff', 24);
  }

  triggerHitstop(frames, shake) {
    this.hitstopFrames = Math.max(this.hitstopFrames, frames);
    this.screenShake = Math.max(this.screenShake, shake);
  }

  spawnParticles(x, y, color, count = 12, speed = 6) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1,
        color,
        life: 20 + Math.random() * 12,
        maxLife: 32,
        size: 4 + Math.random() * 4
      });
    }
  }

  spawnProjectile(owner, move) {
    this.projectiles.push({
      owner,
      x: owner.x + owner.facing * 45,
      y: owner.y - 62,
      vx: owner.facing * GameConfig.PROJECTILE_SPEED,
      color: owner.data.color,
      dmg: move.dmg,
      hitstun: move.hitstun,
      blockstun: move.blockstun
    });
  }

  addFloatingText(text, x, y, color = '#fff', size = 20) {
    this.floatingTexts.push({ text, x, y, color, size, life: 48 });
  }

  getAIInput(ai, target) {
    const input = {
      up: false, down: false, left: false, right: false, back: false, forward: false,
      LP: false, MP: false, HP: false, LK: false, MK: false, HK: false,
      anyPunch: false, anyKick: false, grabTriggered: false, reversalTriggered: false, perfectBlockHold: false, dashBtnTriggered: false
    };
    if (this.currentMode === 'TRAINING' || this.roundState !== 'FIGHTING') return input;

    const dist = Math.abs(target.x - ai.x);

    // AI while Knocked Down: Uses 2-Bar Reversal if player approaches to attack, or inputs QTE buttons
    if (ai.state === 'KNOCKDOWN') {
      if (target.state === 'ATTACK' && dist < 130 && ai.superMeter >= GameConfig.REVERSAL.SUPER_COST && Math.random() < 0.08) {
        input.reversalTriggered = true;
        return input;
      }
      if (!ai.qteFailed && Math.random() < 0.04) {
        const nextBtn = ai.qteSequence[ai.qteIndex];
        if (nextBtn) input[nextBtn] = true;
      }
      return input;
    }

    if (ai.state === 'THROWN' && Math.random() < 0.06) {
      input.grabTriggered = true;
      return input;
    }

    if (target.state === 'ATTACK' && dist < 135 && Math.random() < 0.45) {
      input.perfectBlockHold = (ai.superMeter >= GameConfig.PERFECT_BLOCK.MIN_SUPER_REQ && Math.random() < 0.35);
      input.back = true;
      return input;
    }

    if (dist > 95) {
      input.forward = true;
    } else if (Math.random() < 0.045) {
      const r = Math.random();
      if (r < 0.35) { input.down = true; input.HP = true; input.anyPunch = true; } // Launcher 2HP
      else if (r < 0.65) { input.down = true; input.HK = true; input.anyKick = true; } // OTG Sweep 2HK
      else if (r < 0.85) { input.MP = true; input.anyPunch = true; }
      else { input.grabTriggered = true; }
    }
    return input;
  }

  resolveRoundEnd() {
    this.roundState = 'ROUND_OVER';
    this.roundPhaseTimer = GameConfig.MATCH.ROUND_OVER_FRAMES;
    this.triggerHitstop(16, 12);

    const koText = (this.matchTimer <= 0) ? "TIME OVER!" : "K.O.!!";

    if (this.p1.hp > this.p2.hp) {
      this.p1Rounds++;
      this.p1.state = 'VICTORY';
      this.roundBannerText = `${koText} - ${this.p1.data.name} (P1) TAKES ROUND ${this.currentRound}`;
    } else if (this.p2.hp > this.p1.hp) {
      this.p2Rounds++;
      this.p2.state = 'VICTORY';
      this.roundBannerText = `${koText} - ${this.p2.data.name} (P2) TAKES ROUND ${this.currentRound}`;
    } else {
      this.roundBannerText = "DOUBLE K.O. / DRAW ROUND!";
    }
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    this.frameCount++;

    if (this.state !== 'MATCH' || !this.p1 || !this.p2) {
      this.inputManager.clearJustPressed();
      return;
    }

    this.cameraZoom += (this.targetZoom - this.cameraZoom) * GameConfig.CAMERA_ZOOM_LERP;

    if (this.superFreezeTimer > 0) {
      this.superFreezeTimer--;
      if (this.superFreezeTimer === 0) {
        this.targetZoom = 1.0;
      }
      this.render();
      this.inputManager.clearJustPressed();
      return;
    }

    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      this.render();
      this.inputManager.clearJustPressed();
      return;
    }

    if (this.roundState === 'ROUND_INTRO') {
      this.roundPhaseTimer--;
      this.p1.animTick++;
      this.p2.animTick++;
      if (this.roundPhaseTimer <= 0) {
        this.roundState = 'FIGHTING';
      }
      this.inputManager.clearJustPressed();
      this.render();
      return;
    }

    if (this.roundState === 'ROUND_OVER') {
      this.roundPhaseTimer--;
      this.p1.animTick++;
      this.p2.animTick++;
      if (this.roundPhaseTimer <= 0) {
        const req = GameConfig.MATCH.ROUNDS_TO_WIN;
        if (this.p1Rounds >= req || this.p2Rounds >= req) {
          this.roundState = 'MATCH_OVER';
          if (this.p1Rounds > this.p2Rounds) {
            this.roundWinner = `${this.p1.data.name} (P1) WINS THE MATCH (${this.p1Rounds} - ${this.p2Rounds})!`;
          } else {
            this.roundWinner = `${this.p2.data.name} (P2) WINS THE MATCH (${this.p2Rounds} - ${this.p1Rounds})!`;
          }
        } else {
          this.currentRound++;
          this.startRoundIntro();
        }
      }
      this.inputManager.clearJustPressed();
      this.render();
      return;
    }

    const dt = this.timeScale;
    const p1In = this.inputManager.getP1Input(this.p1.facing);
    const p2In = (this.currentMode === 'PVP')
      ? this.inputManager.getP2Input(this.p2.facing)
      : this.getAIInput(this.p2, this.p1);

    if (this.roundState === 'FIGHTING') {
      this.p1.processInput(p1In, this.frameCount, this.p2, this);
      this.p2.processInput(p2In, this.frameCount, this.p1, this);

      this.p1.update(this.p2, dt, p1In, this);
      this.p2.update(this.p1, dt, p2In, this);

      if (this.currentMode === 'TRAINING') {
        if (this.p2.state === 'IDLE') {
          this.p2.hp = this.p2.maxHp;
          this.p2.superMeter = GameConfig.GAUGES.MAX_SUPER;
        }
        if (this.p1.state === 'IDLE' && this.p1.superMeter <= 0 && !p1In.perfectBlockHold) {
          this.p1.superMeter = GameConfig.GAUGES.MAX_SUPER;
        }
      } else {
        if (this.matchTimer > 0) this.matchTimer -= dt;
        if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.matchTimer <= 0) {
          this.resolveRoundEnd();
        }
      }
    }

    this.inputManager.clearJustPressed();
    this.render();
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = '#090d18';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake * 1.6, (Math.random() - 0.5) * this.screenShake * 1.6);
      this.screenShake = Math.max(0, this.screenShake - 1);
    }

    if (this.cameraZoom > 1.005) {
      ctx.translate(GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2);
      ctx.scale(this.cameraZoom, this.cameraZoom);
      ctx.translate(-this.cameraFocusX, -this.cameraFocusY);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1000; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GameConfig.FLOOR_Y); ctx.stroke();
    }
    for (let y = 0; y <= GameConfig.FLOOR_Y; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1000, y); ctx.stroke();
    }

    if (this.superFreezeTimer > 0 && this.superCaster) {
      ctx.fillStyle = 'rgba(4, 6, 14, 0.78)';
      ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

      const radius = (GameConfig.GAUGES.SUPER_FREEZE_FRAMES - this.superFreezeTimer) * 9;
      ctx.strokeStyle = this.superCaster.data.color;
      ctx.lineWidth = 3 + this.superLevelActive * 2;
      ctx.beginPath();
      ctx.arc(this.superCaster.x, this.superCaster.y - 60, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GameConfig.FLOOR_Y);
    ctx.lineTo(GameConfig.CANVAS_WIDTH, GameConfig.FLOOR_Y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 0, 102, 0.14)';
    ctx.fillRect(0, 100, GameConfig.STAGE_LEFT, GameConfig.FLOOR_Y - 100);
    ctx.fillRect(GameConfig.STAGE_RIGHT, 100, 55, GameConfig.FLOOR_Y - 100);

    this.p1.draw(ctx);
    this.p2.draw(ctx);

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
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
      if (sw.life <= 0) this.shockwaves.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.0;
      ft.life--;
      ctx.font = `900 ${ft.size}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    ctx.restore();

    if (this.superFreezeTimer > 0 && this.superCaster) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.fillRect(0, 210, 1000, 90);
      ctx.strokeStyle = this.superCaster.data.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 210, 1000, 90);

      ctx.textAlign = 'center';
      ctx.font = "900 36px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SUPER ART LEVEL ${this.superLevelActive}: ${this.superTitle}`, 500, 266);
    }

    this.drawHUD(ctx);
    ctx.restore();
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

  drawRoundWinPips(ctx) {
    const req = GameConfig.MATCH.ROUNDS_TO_WIN;
    for (let i = 0; i < req; i++) {
      const p1X = 452 - i * 20;
      ctx.fillStyle = (this.p1Rounds > i) ? '#ffcf33' : '#1b2234';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillRect(p1X, 55, 13, 13);
      ctx.strokeRect(p1X, 55, 13, 13);

      const p2X = 535 + i * 20;
      ctx.fillStyle = (this.p2Rounds > i) ? '#ffcf33' : '#1b2234';
      ctx.fillRect(p2X, 55, 13, 13);
      ctx.strokeRect(p2X, 55, 13, 13);
    }
  }

  drawHUD(ctx) {
    const barW = 400;
    const barH = 22;

    ctx.fillStyle = '#1a2133';
    ctx.fillRect(40, 20, barW, barH);
    ctx.fillRect(560, 20, barW, barH);

    const p1Ratio = Math.max(0, this.p1.hp / this.p1.maxHp);
    ctx.fillStyle = p1Ratio > 0.3 ? '#00f0ff' : '#ff2a55';
    ctx.fillRect(40 + barW * (1 - p1Ratio), 20, barW * p1Ratio, barH);

    const p2Ratio = Math.max(0, this.p2.hp / this.p2.maxHp);
    ctx.fillStyle = p2Ratio > 0.3 ? '#ff0066' : '#ffae00';
    ctx.fillRect(560, 20, barW * p2Ratio, barH);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 20, barW, barH);
    ctx.strokeRect(560, 20, barW, barH);

    this.drawSuperBars(ctx, 40, 50, this.p1.superMeter, false);
    this.drawSuperBars(ctx, 960, 50, this.p2.superMeter, true);
    this.drawRoundWinPips(ctx);

    ctx.font = "800 12px 'Segoe UI', sans-serif";
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    const p1MaxAir = (this.p1.maxAirComboFrames / 60).toFixed(1);
    ctx.fillText(`P1: ${this.p1.data.name} | MAX AIR: ${p1MaxAir}s (${this.p1.airDamageMultiplier}x DMG)`, 40, 84);

    ctx.textAlign = 'right';
    const p2MaxAir = (this.p2.maxAirComboFrames / 60).toFixed(1);
    ctx.fillText(`P2: ${this.p2.data.name} | MAX AIR: ${p2MaxAir}s (${this.p2.airDamageMultiplier}x DMG)`, 960, 84);

    ctx.textAlign = 'center';
    ctx.font = "900 32px 'Segoe UI', sans-serif";
    ctx.fillStyle = '#ffcf33';
    ctx.fillText(this.currentMode === 'TRAINING' ? 'INF' : Math.ceil(this.matchTimer / 60), 500, 45);

    ctx.fillStyle = 'rgba(10, 15, 28, 0.82)';
    ctx.fillRect(14, 115, 140, 215);
    ctx.strokeStyle = '#263554';
    ctx.strokeRect(14, 115, 140, 215);

    ctx.textAlign = 'left';
    ctx.font = "700 11px monospace";
    ctx.fillStyle = '#8aa2c9';
    ctx.fillText("INPUT HISTORY", 22, 132);

    this.p1.motionBuffer.visualHistory.forEach((item, idx) => {
      ctx.font = "900 12px monospace";
      ctx.fillStyle = item.color;
      ctx.fillText(item.symbol, 22, 154 + idx * 19);
    });

    if (this.p1.bannerTimer > 0 && this.p1.lastMoveBanner) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.fillRect(162, 92, 310, 28);
      ctx.font = "800 14px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`> ${this.p1.lastMoveBanner}`, 172, 111);
    }

    if (this.p1.comboCount > 1) {
      ctx.textAlign = 'left';
      ctx.font = "900 30px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`${this.p1.comboCount} HITS!`, 165, 155);
      ctx.font = "700 16px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#fff';
      ctx.fillText(`DAMAGE: ${this.p1.comboDamage}`, 165, 178);
    }

    if (this.roundState === 'ROUND_INTRO') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 205, 1000, 110);
      ctx.textAlign = 'center';
      ctx.font = "900 44px 'Segoe UI', sans-serif";
      const isFinal = (this.currentRound >= GameConfig.MATCH.MAX_ROUNDS);
      if (this.roundPhaseTimer > 30) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(isFinal ? "FINAL ROUND" : `ROUND ${this.currentRound}`, 500, 274);
      } else {
        ctx.fillStyle = '#ffcf33';
        ctx.fillText("FIGHT!!", 500, 274);
      }
    }

    if (this.roundState === 'ROUND_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
      ctx.fillRect(0, 205, 1000, 110);
      ctx.textAlign = 'center';
      ctx.font = "900 34px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#ffcf33';
      ctx.fillText(this.roundBannerText, 500, 270);
    }

    if (this.roundState === 'MATCH_OVER' && this.roundWinner) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 195, 1000, 130);
      ctx.textAlign = 'center';
      ctx.font = "900 38px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(this.roundWinner, 500, 255);
      ctx.font = "600 18px 'Segoe UI', sans-serif";
      ctx.fillStyle = '#fff';
      ctx.fillText("Click 'RESET MATCH' on the top bar to play again", 500, 295);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.Engine = new GameEngine();
});