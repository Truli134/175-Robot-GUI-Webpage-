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

  // Theme toggle with 'M' key
  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  };

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

  // Camera connect / disconnect toggle
  const btn = document.getElementById('btnCamera');
  const video = document.getElementById('camera');
  const status = document.getElementById('camStatus');
  let currentStream = null;

  const setCameraUI = (connected) => {
    if (status) status.textContent = connected ? 'Connected' : 'Not connected';
    if (btn) btn.textContent = connected ? 'Disconnect Camera' : 'Connect Camera';
  };

  if (btn && video) {
    btn.addEventListener('click', async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (status) status.textContent = 'Camera API not supported';
        return;
      }

      // If already connected, disconnect
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
        currentStream = null;
        setCameraUI(false);
        return;
      }

      // Otherwise, attempt to connect
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        currentStream = stream;
        setCameraUI(true);
      } catch (err) {
        if (status) status.textContent = 'Camera denied or unavailable';
      }
    });
  }

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

  // Robot connection status
  let robotConnected = false;
  const robotStatus = document.createElement('div');
  robotStatus.id = 'robotStatus';
  robotStatus.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px 15px; border-radius: 4px; font-size: 12px; font-weight: bold; z-index: 1000; background: #ffcccc; color: #333; display: none;';
  document.body.appendChild(robotStatus);

  // Check robot connection on page load
  async function checkRobotConnection() {
    try {
      const res = await fetch('http://localhost:3000/api/status');
      const data = await res.json();
      robotConnected = data.connected;
      updateRobotStatusUI();
    } catch (err) {
      console.warn('Could not reach server:', err);
    }
  }

  function updateRobotStatusUI() {
    if (robotConnected) {
      robotStatus.textContent = '✓ Robot Connected';
      robotStatus.style.background = '#ccffcc';
      robotStatus.style.color = '#333';
    } else {
      robotStatus.textContent = '✗ Robot Disconnected';
      robotStatus.style.background = '#ffcccc';
      robotStatus.style.color = '#333';
    }
    robotStatus.style.display = 'block';
  }

  // Connect to robot button
  const connectRobotBtn = document.createElement('button');
  connectRobotBtn.textContent = 'Connect Robot';
  connectRobotBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px 15px; background: #0b66ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; z-index: 999;';
  document.body.appendChild(connectRobotBtn);

  connectRobotBtn.addEventListener('click', async () => {
    try {
      const endpoint = robotConnected ? '/api/disconnect' : '/api/connect';
      const res = await fetch(`http://localhost:3000${endpoint}`, { method: 'POST' });
      const data = await res.json();
      console.log('Robot response:', data);
      robotConnected = data.status === 'connected';
      updateRobotStatusUI();
      connectRobotBtn.textContent = robotConnected ? 'Disconnect Robot' : 'Connect Robot';
    } catch (err) {
      console.error('Error connecting to robot:', err);
      alert('Error: Could not reach server. Make sure server is running on localhost:3000');
    }
  });

  checkRobotConnection();

  // Update voltage reading periodically
  const voltageDisplay = document.getElementById('voltageValue');
  const powerStatus = document.getElementById('powerStatus');
  
  async function updateVoltage() {
    try {
      const res = await fetch('http://localhost:3000/api/voltage');
      const data = await res.json();
      const voltage = data.voltage;
      
      if (voltageDisplay) {
        voltageDisplay.textContent = voltage.toFixed(1) + ' V';
      }
      
      // Update power status based on voltage
      if (powerStatus) {
        if (voltage >= 7.0) {
          // Robot is ON (7V to 8+V)
          powerStatus.textContent = '● ON';
          powerStatus.style.background = '#4CAF50';
          powerStatus.style.color = 'white';
        } else if (voltage >= 1.0 && voltage <= 1.8) {
          // Robot is OFF (1V to 1.8V)
          powerStatus.textContent = '⚫ OFF';
          powerStatus.style.background = '#666';
          powerStatus.style.color = 'white';
        } else {
          // Intermediate/Unknown state
          powerStatus.textContent = '◐ STANDBY';
          powerStatus.style.background = '#FF9800';
          powerStatus.style.color = 'white';
        }
      }
    } catch (err) {
      console.warn('Could not fetch voltage:', err);
    }
  }

  // Update voltage every 1 second
  setInterval(updateVoltage, 1000);
  updateVoltage(); // Initial update

  // Movement button handlers
  async function handleMovement(cmd, btn){
    if(btn){
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 180);
    }
    console.log('Movement command:', cmd);
    
    if (!robotConnected) {
      console.warn('Robot not connected');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      console.log('Robot response:', data);
    } catch (err) {
      console.error('Error sending command:', err);
    }
  }

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('.movement-btn');
    if (!btn) return;
    handleMovement(btn.dataset.cmd, btn);
  });

  // Keyboard shortcuts: W/A/S/D -> forward/left/backward/right, Q/E -> turn-left/turn-right
  const keyMap = {
    w: 'forward', a: 'left', s: 'backward', d: 'right',
    q: 'turn-left', e: 'turn-right',
    arrowup: 'forward', arrowleft: 'left', arrowdown: 'backward', arrowright: 'right'
  };
  const activeKeys = new Set();
  let isInTwistMode = false;

  // Mode switching
  const switchModeBtn = document.getElementById('switchModeBtn');
  const switchModeBackBtn = document.getElementById('switchModeBackBtn');
  const movementControls = document.getElementById('movementControls');
  const twistBodyControl = document.getElementById('twistBodyControl');

  const switchMode = (toTwist) => {
    isInTwistMode = toTwist;
    const sectionTitle = document.querySelector('.sensors strong');
    const controlsDisplay = document.getElementById('controlsDisplay');
    if (toTwist) {
      movementControls.style.display = 'none';
      twistBodyControl.style.display = 'flex';
      if (sectionTitle) sectionTitle.textContent = 'Twist Body';
      if (controlsDisplay) controlsDisplay.textContent = 'Twist Body';
    } else {
      movementControls.style.display = 'flex';
      twistBodyControl.style.display = 'none';
      if (sectionTitle) sectionTitle.textContent = 'Movements';
      if (controlsDisplay) controlsDisplay.textContent = 'Movement';
    }
  };

  if (switchModeBtn) {
    switchModeBtn.addEventListener('click', () => {
      switchMode(true);
    });
  }

  if (switchModeBackBtn) {
    switchModeBackBtn.addEventListener('click', () => {
      switchMode(false);
    });
  }

  // Twist corner handlers
  const twistPad = document.getElementById('twistPad');
  const twistCursor = document.getElementById('twistCursor');
  const twistValue = document.getElementById('twistValue');
  const rotatePad = document.getElementById('rotatePad');
  const rotateCursor = document.getElementById('rotateCursor');
  const rotateValue = document.getElementById('rotateValue');
  let isDraggingTwist = false;
  let isDraggingRotate = false;

  const updateTwistPosition = (e) => {
    if (!twistPad) return;
    
    const rect = twistPad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp to pad boundaries
    const clampedX = Math.max(0, Math.min(x, rect.width));
    const clampedY = Math.max(0, Math.min(y, rect.height));
    
    // Convert pixel coordinates to -10 to 10 range
    // Left edge (0px) = -10, Right edge (120px) = 10
    // Top edge (0px) = 10, Bottom edge (120px) = -10
    const normX = (clampedX / rect.width) * 20 - 10;
    const normY = 10 - (clampedY / rect.height) * 20;
    
    // Update cursor position
    twistCursor.style.left = clampedX + 'px';
    twistCursor.style.top = clampedY + 'px';
    
    // Display value
    twistValue.textContent = `(${normX.toFixed(1)}, ${normY.toFixed(1)})`;
    
    console.log('Twist Body Control:', `${normX.toFixed(1)}, ${normY.toFixed(1)}`);
  };

  const updateRotatePosition = (e) => {
    if (!rotatePad) return;
    
    const rect = rotatePad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp to pad boundaries
    const clampedX = Math.max(0, Math.min(x, rect.width));
    const clampedY = Math.max(0, Math.min(y, rect.height));
    
    // Convert pixel coordinates to -10 to 10 range
    const normX = (clampedX / rect.width) * 20 - 10;
    const normY = 10 - (clampedY / rect.height) * 20;
    
    // Update cursor position
    rotateCursor.style.left = clampedX + 'px';
    rotateCursor.style.top = clampedY + 'px';
    
    // Display value
    rotateValue.textContent = `(${normX.toFixed(1)}, ${normY.toFixed(1)})`;
    
    console.log('Rotate Control:', `${normX.toFixed(1)}, ${normY.toFixed(1)}`);
  };

  if (twistPad) {
    twistPad.addEventListener('mousedown', (e) => {
      isDraggingTwist = true;
      twistCursor.classList.add('active');
      updateTwistPosition(e);
    });

    twistPad.addEventListener('click', (e) => {
      if (e.target === twistPad || e.target.closest('.twist-crosshair')) {
        updateTwistPosition(e);
        setTimeout(() => {
          twistCursor.classList.remove('active');
          twistValue.textContent = 'Ready';
        }, 100);
      }
    });

    // Touch support
    twistPad.addEventListener('touchstart', (e) => {
      isDraggingTwist = true;
      twistCursor.classList.add('active');
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      updateTwistPosition(mouseEvent);
    });
  }

  if (rotatePad) {
    rotatePad.addEventListener('mousedown', (e) => {
      isDraggingRotate = true;
      rotateCursor.classList.add('active');
      updateRotatePosition(e);
    });

    rotatePad.addEventListener('click', (e) => {
      if (e.target === rotatePad || e.target.closest('.twist-crosshair')) {
        updateRotatePosition(e);
        setTimeout(() => {
          rotateCursor.classList.remove('active');
          rotateValue.textContent = 'Ready';
        }, 100);
      }
    });

    // Touch support
    rotatePad.addEventListener('touchstart', (e) => {
      isDraggingRotate = true;
      rotateCursor.classList.add('active');
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      updateRotatePosition(mouseEvent);
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (isDraggingTwist) {
      updateTwistPosition(e);
    }
    if (isDraggingRotate) {
      updateRotatePosition(e);
    }
  });

  document.addEventListener('mouseup', () => {
    isDraggingTwist = false;
    isDraggingRotate = false;
    twistCursor.classList.remove('active');
    rotateCursor.classList.remove('active');
    twistValue.textContent = 'Ready';
    rotateValue.textContent = 'Ready';
  });

  document.addEventListener('touchmove', (e) => {
    if (isDraggingTwist) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      updateTwistPosition(mouseEvent);
    }
    if (isDraggingRotate) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      updateRotatePosition(mouseEvent);
    }
  });

  document.addEventListener('touchend', () => {
    isDraggingTwist = false;
    isDraggingRotate = false;
    twistCursor.classList.remove('active');
    rotateCursor.classList.remove('active');
    twistValue.textContent = 'Ready';
    rotateValue.textContent = 'Ready';
  });

  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const tag = target && target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
    const k = (e.key || '').toLowerCase();
    
    // Check for theme toggle key (M)
    if (k === 'm') {
      e.preventDefault && e.preventDefault();
      toggleTheme();
      return;
    }

    // Check for mode switch key (X)
    if (k === 'x') {
      e.preventDefault && e.preventDefault();
      switchMode(!isInTwistMode);
      return;
    }

    // Check for all graphs page key (G)
    if (k === 'g') {
      e.preventDefault && e.preventDefault();
      window.location.href = 'graphs.html';
      return;
    }

    // If in twist mode, ignore movement commands
    if (isInTwistMode) return;

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
