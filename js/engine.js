// js/engine.js
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.inputManager = new InputManager();
    this.ui = new UIManager(this);
    this.ai = new AIController();
    this.renderer = new GameRenderer(this.canvas, this.ctx);

    this.state = 'MENU';
    this.currentMode = 'AI_NORMAL';
    this.p1SelectedChar = 'TITAN';
    this.p2SelectedChar = 'REN';

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

    // Vertical-Only Camera Offset (No Zoom)
    this.cameraOffsetY = 0;
    this.timeScale = GameConfig.GAME_SPEED || 0.65;

    this.superFreezeTimer = 0;
    this.superCaster = null;
    this.superLevelActive = 0;
    this.superTitle = "";

    this.shockwaves = [];
    this.particles = [];
    this.projectiles = [];
    this.floatingTexts = [];

    this.ui.renderCharSelectCards();
    requestAnimationFrame(() => this.loop());
  }

  showScreen(screenId) { this.ui.showScreen(screenId); }
  openCharSelect(mode) { this.ui.openCharSelect(mode); }
  togglePause() { this.ui.togglePause(); }
  returnToMenu() { this.ui.returnToMenu(); }

  startMatch() {
    this.ui.prepareMatchUI();
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
    this.cameraOffsetY = 0;
    this.timeScale = GameConfig.GAME_SPEED || 0.65;
    this.superFreezeTimer = 0;

    if (this.currentMode === 'TRAINING') {
      this.roundState = 'FIGHTING';
      this.roundPhaseTimer = 0;
    } else {
      this.roundState = 'ROUND_INTRO';
      this.roundPhaseTimer = GameConfig.MATCH.ROUND_INTRO_FRAMES;
    }
  }

  triggerSuperFreeze(caster, level, moveTitle) {
    this.superFreezeTimer = GameConfig.GAUGES.SUPER_FREEZE_FRAMES;
    this.superCaster = caster;
    this.superLevelActive = level;
    this.superTitle = moveTitle;
    this.spawnParticles(caster.x, caster.y - 60, caster.data.color, 35, 11);
  }

  triggerFloorSlamEffect(x, y, color) {
    this.triggerHitstop(6, 9);
    this.shockwaves.push({ x, y: y - 6, radius: 12, maxRadius: 95, color, life: 18, maxLife: 18 });
    this.spawnParticles(x, y - 8, color, 24, 8);
  }

  triggerReversalEffect(caster) {
    this.triggerHitstop(10, 10);
    this.shockwaves.push({ x: caster.x, y: GameConfig.FLOOR_Y - 45, radius: 15, maxRadius: 140, color: '#ff0066', life: 22, maxLife: 22 });
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
    const spd = move.projSpeed || GameConfig.PROJECTILE_SPEED;
    this.projectiles.push({
      owner,
      x: owner.x + owner.facing * 48,
      y: owner.y - 62,
      vx: owner.facing * spd,
      speedTier: spd,
      color: owner.data.color,
      dmg: move.dmg,
      hitstun: move.hitstun,
      blockstun: move.blockstun,
      push: move.push || 4.5
    });
  }

  addFloatingText(text, x, y, color = '#fff', size = 20) {
    this.floatingTexts.push({ text, x, y, color, size, life: 48 });
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

  // Critical: Only pans camera UP/DOWN if a fighter rises above the initial screen bound (No Zoom!)
  updateCameraTracking() {
    const camCfg = GameConfig.CAMERA || { UPPER_BOUND_Y: 220, MAX_OFFSET_Y: 110, PAN_LERP: 0.16 };
    const highestY = Math.min(this.p1.y, this.p2.y);

    let targetOffsetY = 0;
    if (highestY < camCfg.UPPER_BOUND_Y) {
      targetOffsetY = Math.min(camCfg.MAX_OFFSET_Y, (camCfg.UPPER_BOUND_Y - highestY) * 0.85);
    }

    this.cameraOffsetY += (targetOffsetY - this.cameraOffsetY) * camCfg.PAN_LERP;
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    this.frameCount++;

    if (this.state !== 'MATCH' || !this.p1 || !this.p2) {
      this.inputManager.clearJustPressed();
      return;
    }

    this.updateCameraTracking();

    if (this.superFreezeTimer > 0) {
      this.superFreezeTimer--;
      this.renderer.render(this);
      this.inputManager.clearJustPressed();
      return;
    }

    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      this.renderer.render(this);
      this.inputManager.clearJustPressed();
      return;
    }

    const dt = GameConfig.GAME_SPEED || 0.65;

    if (this.roundState === 'ROUND_INTRO') {
      this.roundPhaseTimer -= dt;
      this.p1.animTick += dt;
      this.p2.animTick += dt;
      if (this.roundPhaseTimer <= 0) {
        this.roundState = 'FIGHTING';
      }
      this.inputManager.clearJustPressed();
      this.renderer.render(this);
      return;
    }

    if (this.roundState === 'ROUND_OVER') {
      this.roundPhaseTimer -= dt;
      this.p1.animTick += dt;
      this.p2.animTick += dt;
      if (this.roundPhaseTimer <= 0) {
        const req = GameConfig.MATCH.ROUNDS_TO_WIN;
        if (this.p1Rounds >= req || this.p2Rounds >= req) {
          this.roundState = 'MATCH_OVER';
          this.roundWinner = (this.p1Rounds > this.p2Rounds)
            ? `${this.p1.data.name} (P1) WINS THE MATCH (${this.p1Rounds} - ${this.p2Rounds})!`
            : `${this.p2.data.name} (P2) WINS THE MATCH (${this.p2Rounds} - ${this.p1Rounds})!`;
        } else {
          this.currentRound++;
          this.startRoundIntro();
        }
      }
      this.inputManager.clearJustPressed();
      this.renderer.render(this);
      return;
    }

    const p1In = this.inputManager.getP1Input(this.p1.facing);
    const p2In = (this.currentMode === 'PVP')
      ? this.inputManager.getP2Input(this.p2.facing)
      : this.ai.getInput(this.p2, this.p1, this.currentMode, this.roundState);

    if (this.roundState === 'FIGHTING') {
      this.p1.processInput(p1In, this.frameCount, this.p2, this);
      this.p2.processInput(p2In, this.frameCount, this.p1, this);

      this.p1.update(this.p2, dt, p1In, this);
      this.p2.update(this.p1, dt, p2In, this);

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.x += pr.vx * dt;
        const target = (pr.owner === this.p1) ? this.p2 : this.p1;
        const targetGrounded = (target.state === 'KNOCKDOWN' || target.state === 'OTG_HIT' || target.state === 'WAKEUP');
        if (!targetGrounded && Math.abs(pr.x - target.x) < 38 && Math.abs(pr.y - (target.y - 55)) < 55) {
          pr.owner.resolveHit(target, { dmg: pr.dmg, hitstun: pr.hitstun, blockstun: pr.blockstun, push: pr.push, vx: 3.5, vy: -3.5, type: 'mid' }, this);
          this.projectiles.splice(i, 1);
          continue;
        }
        if (pr.x < 0 || pr.x > GameConfig.CANVAS_WIDTH) this.projectiles.splice(i, 1);
      }

      if (this.currentMode === 'TRAINING') {
        if (this.p2.state === 'IDLE') {
          this.p2.hp = this.p2.maxHp;
          this.p2.superMeter = GameConfig.GAUGES.MAX_SUPER;
        }
      } else {
        if (this.matchTimer > 0) this.matchTimer -= dt;
        if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.matchTimer <= 0) {
          this.resolveRoundEnd();
        }
      }
    }

    this.inputManager.clearJustPressed();
    this.renderer.render(this);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.Engine = new GameEngine();
});