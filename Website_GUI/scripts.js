document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle: apply saved theme or system preference
  const themeToggle = document.getElementById('themeToggle');
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      themeToggle.textContent = '☀️';
      themeToggle.setAttribute('aria-pressed', 'true');
    } else {
      document.body.classList.remove('dark');
      themeToggle.textContent = '🌙';
      themeToggle.setAttribute('aria-pressed', 'false');
    }
  };

  const saved = localStorage.getItem('theme');
  if (saved) applyTheme(saved);
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  });

  // Gas chart (placeholder) using Chart.js
  const gasCanvas = document.getElementById('gasChart');
  const ctx = gasCanvas.getContext('2d');

  const initialData = Array.from({ length: 20 }, () => Math.round(Math.random() * 120));
  const data = {
    labels: Array.from({ length: 20 }, () => ''),
    datasets: [{
      label: 'Gas (ppm)',
      data: initialData,
      borderColor: 'rgba(11,102,255,0.95)',
      backgroundColor: 'rgba(11,102,255,0.12)',
      tension: 0.3,
      fill: true,
    }]
  };

  const config = {
    type: 'line',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, suggestedMax: 200 } }
    }
  };

  const gasChart = new Chart(ctx, config);

  // push new random value periodically
  setInterval(() => {
    data.datasets[0].data.shift();
    data.datasets[0].data.push(Math.round(Math.random() * 140));
    gasChart.update();
  }, 1600);

  // Camera connect
  const btn = document.getElementById('btnCamera');
  const video = document.getElementById('camera');
  const status = document.getElementById('camStatus');

  btn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent = 'Camera API not supported';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      status.textContent = 'Connected';
    } catch (err) {
      status.textContent = 'Camera denied or unavailable';
    }
  });

  // Fullscreen toggle for camera
  const fsBtn = document.getElementById('btnFullscreen');
  const cameraWrap = document.querySelector('.camera-wrap');

  const exitFsBtn = document.getElementById('btnExitFullscreen');

  const getFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

  const updateFsButton = () => {
    const isFs = getFullscreenElement() === cameraWrap;
    if (!fsBtn) return;
    fsBtn.setAttribute('aria-pressed', isFs ? 'true' : 'false');
    fsBtn.textContent = isFs ? '⤢' : '⛶';
    if (exitFsBtn) exitFsBtn.style.display = isFs ? 'inline-flex' : 'none';
  };

  if (fsBtn && cameraWrap) {
    fsBtn.addEventListener('click', async () => {
      try {
        if (getFullscreenElement() === cameraWrap) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
          if (cameraWrap.requestFullscreen) await cameraWrap.requestFullscreen();
          else if (cameraWrap.webkitRequestFullscreen) cameraWrap.webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen error', err);
      }
    });

    document.addEventListener('fullscreenchange', updateFsButton);
    document.addEventListener('webkitfullscreenchange', updateFsButton);
    updateFsButton();
  }

  if (exitFsBtn) {
    exitFsBtn.addEventListener('click', async () => {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch (err) {
        console.warn('Exit fullscreen error', err);
      }
    });
  }

  // Movement button handlers (placeholder)
  function handleMovement(cmd, btn){
    if(btn){
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 180);
    }
    console.log('Movement command:', cmd);
    // TODO: send command to robot (e.g., via WebSocket / REST)
  }

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('.movement-btn');
    if (!btn) return;
    handleMovement(btn.dataset.cmd, btn);
  });

  // Keyboard shortcuts: W/A/S/D -> forward/left/backward/right, Q/E -> turn-left/turn-right
  const keyMap = {
    w: 'forward', a: 'left', s: 'backward', d: 'right',
    q: 'turn-left', e: 'turn-right', x: 'stop',
    arrowup: 'forward', arrowleft: 'left', arrowdown: 'backward', arrowright: 'right'
  };
  const activeKeys = new Set();

  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const tag = target && target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
    const k = (e.key || '').toLowerCase();
    const cmd = keyMap[k];
    if (!cmd) return;
    // prevent page scrolling when using arrow keys for movement
    e.preventDefault && e.preventDefault();
    if (activeKeys.has(k)) return; // ignore repeats while held
    activeKeys.add(k);
    const btn = document.querySelector(`.movement-btn[data-cmd="${cmd}"]`);
    handleMovement(cmd, btn);
  });

  document.addEventListener('keyup', (e) => {
    const k = (e.key || '').toLowerCase();
    if (activeKeys.has(k)) activeKeys.delete(k);
  });
});
