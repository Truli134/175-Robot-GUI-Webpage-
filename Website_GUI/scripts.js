document.addEventListener('DOMContentLoaded', () => {
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

  // Movement button handlers (placeholder)
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('.movement-btn');
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    // visual feedback: briefly add active state
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 180);
    console.log('Movement command:', cmd);
    // TODO: send command to robot (e.g., via WebSocket / REST)
  });
});
