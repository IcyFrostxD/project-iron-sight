// js/ai.js
class AIController {
  getInput(ai, target, currentMode, roundState) {
    const input = {
      up: false, down: false, left: false, right: false, back: false, forward: false,
      LP: false, MP: false, HP: false, LK: false, MK: false, HK: false,
      anyPunch: false, anyKick: false,
      grabTriggered: false, reversalTriggered: false, perfectBlockHold: false, dashBtnTriggered: false
    };

    if (currentMode === 'TRAINING' || roundState !== 'FIGHTING') {
      return input;
    }

    const dist = Math.abs(target.x - ai.x);

    if (ai.state === 'KNOCKDOWN') {
      const revCost = (GameConfig.REVERSAL && GameConfig.REVERSAL.SUPER_COST) || 200;
      if (target.state === 'ATTACK' && dist < 130 && ai.superMeter >= revCost && Math.random() < 0.08) {
        input.reversalTriggered = true;
        return input;
      }
      if (!ai.autoWakeupActive && !ai.qteFailed && Math.random() < 0.04) {
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
    } else if (Math.random() < 0.035) {
      const r = Math.random();
      if (r < 0.35) { input.down = true; input.HP = true; input.anyPunch = true; }
      else if (r < 0.65) { input.down = true; input.HK = true; input.anyKick = true; }
      else if (r < 0.85) { input.LP = true; input.anyPunch = true; }
      else { input.grabTriggered = true; }
    }

    return input;
  }
}

window.AIController = AIController;