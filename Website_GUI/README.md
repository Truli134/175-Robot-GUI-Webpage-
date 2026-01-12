# Website

This folder contains a simple wireframe dashboard for the Hexapod project.

Features added:
- `index.html` — includes a `video` element with a "Connect Camera" button (uses browser camera via `getUserMedia`).
- `styles.css` — layout and styles.
- `scripts.js` — initializes a placeholder gas chart with Chart.js and handles camera connect.

Quick start:

1. Serve this folder (from `Website`) with a local server, for example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

2. To use the camera button, open the page in a secure context (https or localhost) and allow camera permissions when prompted.
