// js/ui.js
class UIManager {
  constructor(engine) {
    this.engine = engine;
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    if (screenId) {
      document.getElementById(screenId).classList.add('active');
    }
  }

  openCharSelect(mode) {
    this.engine.currentMode = mode;
    this.engine.state = 'CHAR_SELECT';
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('top-match-bar').classList.add('hidden');
    document.getElementById('bottom-guide').classList.add('hidden');

    const modeNames = {
      'AI_NORMAL': 'MODE: ARCADE VS AI (BEST OF 3)',
      'TRAINING': 'MODE: TRAINING (SKILLS, AIR COMBO & QTE TEST)',
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
      card1.className = `char-card ${this.engine.p1SelectedChar === c.id ? 'selected-p1' : ''}`;
      card1.innerHTML = `<div class="char-name" style="color:${c.color}">${c.name}</div><div class="char-role">${c.role}</div>`;
      card1.onclick = () => {
        this.engine.p1SelectedChar = c.id;
        this.renderCharSelectCards();
      };
      p1Container.appendChild(card1);

      const card2 = document.createElement('div');
      card2.className = `char-card ${this.engine.p2SelectedChar === c.id ? 'selected-p2' : ''}`;
      card2.innerHTML = `<div class="char-name" style="color:${c.color}">${c.name}</div><div class="char-role">${c.role}</div>`;
      card2.onclick = () => {
        this.engine.p2SelectedChar = c.id;
        this.renderCharSelectCards();
      };
      p2Container.appendChild(card2);
    });

    document.getElementById('p1PreviewInfo').innerHTML = CHARACTERS[this.engine.p1SelectedChar].summary;
    document.getElementById('p2PreviewInfo').innerHTML = CHARACTERS[this.engine.p2SelectedChar].summary;
  }

  prepareMatchUI() {
    this.showScreen(null);
    document.getElementById('top-match-bar').classList.remove('hidden');
    document.getElementById('bottom-guide').classList.remove('hidden');
    document.getElementById('pause-modal').classList.add('hidden');
  }

  togglePause() {
    if (this.engine.state === 'MATCH') {
      this.engine.state = 'PAUSED';
      const c1 = CHARACTERS[this.engine.p1SelectedChar];
      document.getElementById('modalMoveList').innerHTML = `
        <h3 style="color:${c1.color};margin-bottom:6px;">${c1.name} SKILL &amp; COMMAND LIST</h3>
        <b>Fireball (Speed by Punch):</b> <code>Down, Left + LP / MP / HP</code> (Slow / Med / Fast)<br>
        <b>Uppercut (Ground &amp; 1x Air):</b> <code>Right, Down, Right + P</code> (Locks air actions until landing)<br>
        <b>Floor Slam (Bounce Launcher):</b> <code>Down + HP</code> (SpongeBob uses Frying Pan)<br>
        <b>Air Bounce Slam (Follow-Down):</b> <code>Jump + Down + HP</code> (Bounces enemy off floor &amp; pulls you down for Round 2 combo!)<br>
        <b>Heavy Jump Crush:</b> <code>Jump + Down + HK</code> (1.0s knockdown on standing/crouching)<br>
        <b>Heavy Leg Sweep:</b> <code>Down + HK</code> (Forces QTE knockdown)<br>
        <hr style="border-color:#26314d;margin:10px 0;">
        <b>AIR COMBO &amp; ATTACK DELAY RULES:</b><br>
        - <b>Air Combo Limits:</b> Max 3 Light hits and Max 1 Medium hit per air sequence (prevents infinite loops).<br>
        - <b>Post-Attack Delay:</b> Heavy attacks have a 0.323s cooldown, Medium 0.200s, Light 0.115s.
      `;
      document.getElementById('pause-modal').classList.remove('hidden');
    } else if (this.engine.state === 'PAUSED') {
      this.engine.state = 'MATCH';
      document.getElementById('pause-modal').classList.add('hidden');
    }
  }

  returnToMenu() {
    this.engine.state = 'MENU';
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('top-match-bar').classList.add('hidden');
    document.getElementById('bottom-guide').classList.add('hidden');
    this.showScreen('screen-main-menu');
  }
}

window.UIManager = UIManager;