// js/input.js
class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.prevPadBtns = {};

    this.p1Buffer = { LP: 0, MP: 0, HP: 0, LK: 0, MK: 0, HK: 0 };
    this.p2Buffer = { LP: 0, MP: 0, HP: 0, LK: 0, MK: 0, HK: 0 };

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Escape' && window.Engine) {
        window.Engine.togglePause();
      }
      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  clearJustPressed() {
    for (const k in this.justPressed) {
      delete this.justPressed[k];
    }
  }

  // Critical: 3-frame Throw (LP+LK) chord detector + Dedicated LB (Drive Impact), LT (Perfect Block), & Dash Button
  resolveButtons(rawJust, rawHold, buffer, shortcutGrab, dedicatedDI, dedicatedPerfectBlock, dedicatedDash) {
    const win = GameConfig.INPUT.CHORD_WINDOW;
    const btns = ['LP', 'MP', 'HP', 'LK', 'MK', 'HK'];

    for (const b of btns) {
      if (rawJust[b]) {
        buffer[b] = win;
      }
    }

    if (shortcutGrab || (buffer.LP > 0 && buffer.LK > 0) || (rawJust.LP && rawHold.LK) || (rawJust.LK && rawHold.LP)) {
      buffer.LP = 0;
      buffer.LK = 0;
      return {
        LP: false, MP: false, HP: false, LK: false, MK: false, HK: false,
        anyPunch: false, anyKick: false,
        grabTriggered: true,
        driveImpactTriggered: false,
        perfectBlockHold: dedicatedPerfectBlock,
        dashBtnTriggered: false
      };
    }

    if (dedicatedDI) {
      return {
        LP: false, MP: false, HP: false, LK: false, MK: false, HK: false,
        anyPunch: false, anyKick: false,
        grabTriggered: false,
        driveImpactTriggered: true,
        perfectBlockHold: dedicatedPerfectBlock,
        dashBtnTriggered: false
      };
    }

    const out = { LP: false, MP: false, HP: false, LK: false, MK: false, HK: false };
    for (const b of btns) {
      if (buffer[b] > 0) {
        if (buffer[b] === 1 || (!rawHold.LP && !rawHold.LK)) {
          out[b] = true;
          buffer[b] = 0;
        } else {
          buffer[b]--;
        }
      }
    }

    return {
      ...out,
      anyPunch: out.LP || out.MP || out.HP,
      anyKick: out.LK || out.MK || out.HK,
      grabTriggered: false,
      driveImpactTriggered: false,
      perfectBlockHold: dedicatedPerfectBlock,
      dashBtnTriggered: dedicatedDash
    };
  }

  getP1Input(facing) {
    let up = !!this.keys['KeyW'];
    let down = !!this.keys['KeyS'];
    let left = !!this.keys['KeyA'];
    let right = !!this.keys['KeyD'];

    const rawJust = {
      LP: !!this.justPressed['KeyU'],
      MP: !!this.justPressed['KeyI'],
      HP: !!this.justPressed['KeyO'],
      LK: !!this.justPressed['KeyJ'],
      MK: !!this.justPressed['KeyK'],
      HK: !!this.justPressed['KeyL']
    };

    const rawHold = {
      LP: !!this.keys['KeyU'],
      MP: !!this.keys['KeyI'],
      HP: !!this.keys['KeyO'],
      LK: !!this.keys['KeyJ'],
      MK: !!this.keys['KeyK'],
      HK: !!this.keys['KeyL']
    };

    const shortcutGrab = !!this.justPressed['KeyG'];
    let dedicatedDI = !!this.justPressed['KeyP'];
    let dedicatedPerfectBlock = !!this.keys['KeyH'];
    // Dedicated Dash button on Keyboard: Left Shift or Key F
    let dedicatedDash = !!(this.justPressed['ShiftLeft'] || this.justPressed['KeyF']);

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads[0];
    if (pad) {
      const axX = pad.axes[0] || 0;
      const axY = pad.axes[1] || 0;
      if (axY < -0.5 || pad.buttons[12]?.pressed) up = true;
      if (axY > 0.5 || pad.buttons[13]?.pressed) down = true;
      if (axX < -0.4 || pad.buttons[14]?.pressed) left = true;
      if (axX > 0.4 || pad.buttons[15]?.pressed) right = true;

      const isPressed = (idx) => !!(pad.buttons[idx]?.pressed || pad.buttons[idx]?.value > 0.35);
      const checkJust = (idx) => {
        const cur = isPressed(idx);
        const was = !!this.prevPadBtns[idx];
        this.prevPadBtns[idx] = cur;
        return cur && !was;
      };

      if (checkJust(2)) rawJust.LP = true;
      if (checkJust(3)) rawJust.MP = true;
      if (checkJust(5)) rawJust.HP = true;
      if (checkJust(0)) rawJust.LK = true;
      if (checkJust(1)) rawJust.MK = true;
      if (checkJust(7)) rawJust.HK = true;

      if (isPressed(2)) rawHold.LP = true;
      if (isPressed(0)) rawHold.LK = true;

      if (checkJust(4)) dedicatedDI = true;             // LB = Drive Impact
      if (isPressed(6)) dedicatedPerfectBlock = true;   // LT = Perfect Block
      if (checkJust(10) || checkJust(8)) dedicatedDash = true; // L3 or View/Select = Dedicated Dash
    }

    const resolved = this.resolveButtons(
      rawJust, rawHold, this.p1Buffer, shortcutGrab, dedicatedDI, dedicatedPerfectBlock, dedicatedDash
    );

    const facingRight = (facing === 1);
    return {
      up, down, left, right,
      forward: facingRight ? right : left,
      back: facingRight ? left : right,
      ...resolved
    };
  }

  getP2Input(facing) {
    const up = !!this.keys['ArrowUp'];
    const down = !!this.keys['ArrowDown'];
    const left = !!this.keys['ArrowLeft'];
    const right = !!this.keys['ArrowRight'];

    const rawJust = {
      LP: !!(this.justPressed['Numpad4'] || this.justPressed['Digit4']),
      MP: !!(this.justPressed['Numpad5'] || this.justPressed['Digit5']),
      HP: !!(this.justPressed['Numpad6'] || this.justPressed['Digit6']),
      LK: !!(this.justPressed['Numpad1'] || this.justPressed['Digit1']),
      MK: !!(this.justPressed['Numpad2'] || this.justPressed['Digit2']),
      HK: !!(this.justPressed['Numpad3'] || this.justPressed['Digit3'])
    };

    const rawHold = {
      LP: !!(this.keys['Numpad4'] || this.keys['Digit4']),
      LK: !!(this.keys['Numpad1'] || this.keys['Digit1'])
    };

    const dedicatedDI = !!(this.justPressed['Numpad7'] || this.justPressed['Digit7']);
    const dedicatedPerfectBlock = !!(this.keys['Numpad8'] || this.keys['Digit8']);
    const dedicatedDash = !!(this.justPressed['Numpad9'] || this.justPressed['Digit9'] || this.justPressed['ShiftRight']);

    const resolved = this.resolveButtons(
      rawJust, rawHold, this.p2Buffer, false, dedicatedDI, dedicatedPerfectBlock, dedicatedDash
    );

    const facingRight = (facing === 1);
    return {
      up, down, left, right,
      forward: facingRight ? right : left,
      back: facingRight ? left : right,
      ...resolved
    };
  }
}

class MotionBuffer {
  constructor() {
    this.dirHistory = [];
    this.absHistory = [];
    this.lastDir = 5;
    this.visualHistory = [];
    this.lastTapDir = 0;
    this.lastTapReleaseFrame = -99;
  }

  toNumpad(up, down, negH, posH) {
    const v = up ? 1 : (down ? -1 : 0);
    const h = posH ? 1 : (negH ? -1 : 0);
    if (v === -1 && h === -1) return 1;
    if (v === -1 && h === 0)  return 2;
    if (v === -1 && h === 1)  return 3;
    if (v === 0  && h === -1) return 4;
    if (v === 0  && h === 0)  return 5;
    if (v === 0  && h === 1)  return 6;
    if (v === 1  && h === -1) return 7;
    if (v === 1  && h === 0)  return 8;
    if (v === 1  && h === 1)  return 9;
    return 5;
  }

  dirToText(absDir) {
    const map = { 1: 'DB', 2: 'D', 3: 'DF', 4: 'L', 5: 'N', 6: 'R', 7: 'UB', 8: 'U', 9: 'UF' };
    return map[absDir] || 'N';
  }

  record(input, frameCount) {
    const relDir = this.toNumpad(input.up, input.down, input.back, input.forward);
    const absDir = this.toNumpad(input.up, input.down, input.left, input.right);
    let dashTriggered = 0;

    // 1. Check Dedicated Dash Button (Shift / Key F / Xbox L3)
    if (input.dashBtnTriggered) {
      dashTriggered = input.back ? 4 : 6;
      this.pushVisual(dashTriggered === 6 ? 'DASH (BTN)' : 'BACKDASH (BTN)', '#00ff88');
    }

    if (relDir !== this.lastDir) {
      if (relDir === 5 && (this.lastDir === 6 || this.lastDir === 4)) {
        this.lastTapDir = this.lastDir;
        this.lastTapReleaseFrame = frameCount;
      }

      if (relDir !== 5) {
        this.dirHistory.push({ dir: relDir, frame: frameCount });
        this.absHistory.push({ dir: absDir, frame: frameCount });
        if (this.dirHistory.length > 28) this.dirHistory.shift();
        if (this.absHistory.length > 28) this.absHistory.shift();

        this.pushVisual(this.dirToText(absDir), '#00f0ff');

        // 2. Check Double-Tap Dash (Neutral gap between release of 1st tap and press of 2nd tap <= DASH_INPUT_WINDOW)
        if ((relDir === 6 || relDir === 4) && this.lastDir === 5) {
          const dashWin = GameConfig.INPUT.DASH_INPUT_WINDOW;
          const neutralGap = frameCount - this.lastTapReleaseFrame;
          if (relDir === this.lastTapDir && neutralGap <= dashWin) {
            dashTriggered = relDir;
            this.lastTapDir = 0;
            this.lastTapReleaseFrame = -99;
          }
        }
      }
      this.lastDir = relDir;
    }

    if (input.grabTriggered) {
      this.pushVisual('THROW (LP+LK)', '#ffaa00');
    } else if (input.driveImpactTriggered) {
      this.pushVisual('DRIVE IMPACT (LB)', '#ff0066');
    } else {
      if (input.LP) this.pushVisual('LP', '#66e0ff');
      if (input.MP) this.pushVisual('MP', '#ffdf5d');
      if (input.HP) this.pushVisual('HP', '#ff4477');
      if (input.LK) this.pushVisual('LK', '#77ff99');
      if (input.MK) this.pushVisual('MK', '#00ffaa');
      if (input.HK) this.pushVisual('HK', '#cc66ff');
    }

    return { dashTriggered };
  }

  pushVisual(symbol, color) {
    this.visualHistory.unshift({ symbol, color, life: 120 });
    if (this.visualHistory.length > 9) this.visualHistory.pop();
  }

  checkHistorySequence(historyList, seq, frameCount, windowSize) {
    const recent = historyList.filter(item => (frameCount - item.frame) <= windowSize).map(item => item.dir);
    let idx = 0;
    for (let i = 0; i < recent.length; i++) {
      const d = recent[i];
      const target = seq[idx];
      if (d === target || (target === 2 && (d === 3 || d === 1))) {
        idx++;
        if (idx >= seq.length) return true;
      }
    }
    return false;
  }

  detectSuperMotion(frameCount) {
    const win = GameConfig.INPUT.SUPER_BUFFER_WINDOW;
    if (
      this.checkHistorySequence(this.absHistory, [2, 6, 2, 6], frameCount, win) ||
      this.checkHistorySequence(this.dirHistory, [2, 6, 2, 6], frameCount, win)
    ) {
      return '236236';
    }
    if (
      this.checkHistorySequence(this.absHistory, [2, 4, 2, 4], frameCount, win) ||
      this.checkHistorySequence(this.dirHistory, [2, 4, 2, 4], frameCount, win)
    ) {
      return '214214';
    }
    return null;
  }

  detectSpecialMotion(frameCount) {
    const win = GameConfig.INPUT.MOTION_BUFFER_WINDOW;
    if (this.checkHistorySequence(this.dirHistory, [6, 2, 6], frameCount, win)) return '623';
    if (this.checkHistorySequence(this.dirHistory, [2, 6], frameCount, win) || this.checkHistorySequence(this.absHistory, [2, 6], frameCount, win)) return '236';
    if (this.checkHistorySequence(this.dirHistory, [2, 4], frameCount, win) || this.checkHistorySequence(this.absHistory, [2, 4], frameCount, win)) return '214';
    return null;
  }

  clearMotions() {
    this.dirHistory = [];
    this.absHistory = [];
  }
}

window.InputManager = InputManager;
window.MotionBuffer = MotionBuffer;