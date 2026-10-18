// js/temp_config_panel.js
// TEMPORARY MODULE: Delete this file and its <script> tag in index.html anytime without breaking the engine.
(function () {
  const style = document.createElement('style');
  style.textContent = `
    #temp-cfg-toggle {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 9999;
      background: #ff0066;
      color: #fff;
      border: 2px solid #fff;
      padding: 8px 14px;
      font-family: monospace;
      font-weight: 900;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.6);
    }
    #temp-cfg-drawer {
      position: fixed;
      top: 52px;
      right: 12px;
      width: 340px;
      max-height: calc(100vh - 68px);
      overflow-y: auto;
      z-index: 9998;
      background: rgba(11, 15, 27, 0.96);
      border: 2px solid #00f0ff;
      border-radius: 8px;
      padding: 12px;
      font-family: 'Segoe UI', monospace;
      font-size: 12px;
      color: #eef3f9;
      box-shadow: 0 10px 35px rgba(0,0,0,0.85);
    }
    #temp-cfg-drawer.closed {
      display: none;
    }
    .tcfg-header {
      font-weight: 900;
      color: #ffcf33;
      border-bottom: 1px solid #26314d;
      padding-bottom: 6px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tcfg-sec {
      margin-bottom: 12px;
      background: #131b2e;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #233050;
    }
    .tcfg-sec h4 {
      color: #00f0ff;
      margin-bottom: 6px;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .tcfg-row {
      display: grid;
      grid-template-columns: 1fr 90px 48px;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
    }
    .tcfg-row label {
      font-size: 11px;
      color: #cbd5e1;
    }
    .tcfg-row input[type="range"] {
      width: 100%;
      cursor: pointer;
    }
    .tcfg-val {
      font-family: monospace;
      color: #00ff88;
      text-align: right;
      font-weight: 700;
    }
    .tcfg-btn {
      width: 100%;
      background: #1e2942;
      color: #fff;
      border: 1px solid #00f0ff;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 700;
      font-size: 11px;
      margin-top: 4px;
    }
    .tcfg-btn:hover {
      background: #00f0ff;
      color: #000;
    }
  `;
  document.head.appendChild(style);

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'temp-cfg-toggle';
  toggleBtn.textContent = 'TEMP LIVE CONFIG [HIDE/SHOW]';
  document.body.appendChild(toggleBtn);

  const drawer = document.createElement('div');
  drawer.id = 'temp-cfg-drawer';
  document.body.appendChild(drawer);

  toggleBtn.onclick = () => drawer.classList.toggle('closed');

  const controlsSpec = [
    {
      section: 'DASH & INPUT WINDOWS',
      items: [
        { label: 'Double-Tap Dash (f)', path: ['INPUT', 'DASH_INPUT_WINDOW'], min: 2, max: 20, step: 1 },
        { label: 'Throw Chord Win (f)', path: ['INPUT', 'CHORD_WINDOW'], min: 1, max: 10, step: 1 },
        { label: 'Dash Duration (f)', path: ['DASH', 'DURATION_FRAMES'], min: 6, max: 30, step: 1 },
        { label: 'Backdash Speed Mult', path: ['DASH', 'BACKDASH_SPEED_MULT'], min: 0.4, max: 1.2, step: 0.05 }
      ]
    },
    {
      section: 'CHARACTER HP & MOVEMENT',
      items: [
        { label: 'REN Max HP', path: ['CHARACTER_STATS', 'REN', 'hp'], min: 500, max: 2000, step: 50 },
        { label: 'REN Walk Speed', path: ['CHARACTER_STATS', 'REN', 'walkSpeed'], min: 1.0, max: 6.0, step: 0.1 },
        { label: 'REN Dash Speed', path: ['CHARACTER_STATS', 'REN', 'dashSpeed'], min: 5.0, max: 16.0, step: 0.5 },
        { label: 'KIRA Max HP', path: ['CHARACTER_STATS', 'KIRA', 'hp'], min: 500, max: 2000, step: 50 },
        { label: 'KIRA Walk Speed', path: ['CHARACTER_STATS', 'KIRA', 'walkSpeed'], min: 1.0, max: 6.0, step: 0.1 },
        { label: 'KIRA Dash Speed', path: ['CHARACTER_STATS', 'KIRA', 'dashSpeed'], min: 5.0, max: 16.0, step: 0.5 },
        { label: 'TITAN Max HP', path: ['CHARACTER_STATS', 'TITAN', 'hp'], min: 500, max: 2000, step: 50 },
        { label: 'TITAN Walk Speed', path: ['CHARACTER_STATS', 'TITAN', 'walkSpeed'], min: 1.0, max: 6.0, step: 0.1 },
        { label: 'TITAN Dash Speed', path: ['CHARACTER_STATS', 'TITAN', 'dashSpeed'], min: 5.0, max: 16.0, step: 0.5 }
      ]
    },
    {
      section: 'KNOCKDOWN & THROW TECH',
      items: [
        { label: 'Knockdown (78f=1.3s)', path: ['KNOCKDOWN', 'DURATION_FRAMES'], min: 30, max: 150, step: 2 },
        { label: 'Wakeup Anim (f)', path: ['KNOCKDOWN', 'WAKEUP_ANIM_FRAMES'], min: 10, max: 45, step: 1 },
        { label: 'Throw Damage', path: ['THROW', 'DAMAGE'], min: 50, max: 300, step: 10 },
        { label: 'Throw Tech Win (f)', path: ['THROW', 'TECH_WINDOW_FRAMES'], min: 4, max: 30, step: 1 },
        { label: 'Tech Pushback VX', path: ['THROW', 'TECH_PUSHBACK_VX'], min: 4.0, max: 18.0, step: 0.5 }
      ]
    },
    {
      section: 'DRIVE IMPACT & PERFECT BLOCK',
      items: [
        { label: 'DI Startup (f)', path: ['DRIVE_IMPACT', 'STARTUP'], min: 8, max: 35, step: 1 },
        { label: 'DI Damage', path: ['DRIVE_IMPACT', 'DAMAGE'], min: 40, max: 250, step: 5 },
        { label: 'DI Armor Hits', path: ['DRIVE_IMPACT', 'ARMOR_MAX_HITS'], min: 1, max: 5, step: 1 },
        { label: 'DI Crumple (f)', path: ['DRIVE_IMPACT', 'CRUMPLE_FRAMES'], min: 20, max: 100, step: 5 },
        { label: 'DI SlowMo (f)', path: ['DRIVE_IMPACT', 'CLASH_SLOWMO_FRAMES'], min: 15, max: 120, step: 5 },
        { label: 'Perfect Block Drain', path: ['PERFECT_BLOCK', 'DRAIN_PER_FRAME'], min: 0.2, max: 5.0, step: 0.2 }
      ]
    },
    {
      section: 'GLOBAL PHYSICS',
      items: [
        { label: 'Gravity', path: ['GRAVITY'], min: 0.2, max: 1.0, step: 0.02 }
      ]
    }
  ];

  function getNested(obj, path) {
    return path.reduce((acc, key) => acc[key], obj);
  }

  function setNested(obj, path, val) {
    let cur = obj;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur[path[i]];
    }
    cur[path[path.length - 1]] = val;
  }

  function syncActiveFighters() {
    if (window.Engine && window.Engine.p1 && window.Engine.p2) {
      if (window.Engine.p1.syncLiveConfig) window.Engine.p1.syncLiveConfig();
      if (window.Engine.p2.syncLiveConfig) window.Engine.p2.syncLiveConfig();
    }
  }

  function buildPanel() {
    drawer.innerHTML = `<div class="tcfg-header"><span>TEMPORARY CONFIG TUNER</span><span style="color:#ff0066">[REALTIME]</span></div>`;

    controlsSpec.forEach(group => {
      const sec = document.createElement('div');
      sec.className = 'tcfg-sec';
      sec.innerHTML = `<h4>${group.section}</h4>`;

      group.items.forEach(item => {
        const curVal = getNested(window.GameConfig, item.path);
        const row = document.createElement('div');
        row.className = 'tcfg-row';

        const lbl = document.createElement('label');
        lbl.textContent = item.label;

        const input = document.createElement('input');
        input.type = 'range';
        input.min = item.min;
        input.max = item.max;
        input.step = item.step;
        input.value = curVal;

        const valSpan = document.createElement('span');
        valSpan.className = 'tcfg-val';
        valSpan.textContent = curVal;

        input.oninput = (e) => {
          const num = parseFloat(e.target.value);
          setNested(window.GameConfig, item.path, num);
          valSpan.textContent = num;
          syncActiveFighters();
        };

        row.appendChild(lbl);
        row.appendChild(input);
        row.appendChild(valSpan);
        sec.appendChild(row);
      });

      drawer.appendChild(sec);
    });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'tcfg-btn';
    copyBtn.textContent = 'COPY CONFIG JSON TO CLIPBOARD';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText('window.GameConfig = ' + JSON.stringify(window.GameConfig, null, 2) + ';');
      copyBtn.textContent = 'COPIED TO CLIPBOARD!';
      setTimeout(() => { copyBtn.textContent = 'COPY CONFIG JSON TO CLIPBOARD'; }, 1500);
    };
    drawer.appendChild(copyBtn);
  }

  window.addEventListener('DOMContentLoaded', buildPanel);
})();