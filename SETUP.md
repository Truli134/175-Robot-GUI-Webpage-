# Robot GUI Server Setup

## Overview
This project provides a web-based GUI to control a hexapod robot via USB/COM11 connection.

### Architecture
- **Frontend**: HTML/CSS/JavaScript web interface (in `Website_GUI/` folder)
- **Backend**: Node.js Express server that handles serial communication with the robot

## Installation & Setup

### Prerequisites
- Node.js installed
- Robot connected to your laptop via USB on **COM11**

### Installation Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000`

3. **Open the GUI**:
   - Navigate to `http://localhost:3000` in your browser

4. **Connect to the robot**:
   - Click the "Connect Robot" button (bottom-right corner)
   - The button will show "Disconnect Robot" when connected
   - Status indicator (top-right) will show connection state

## Movement Commands

Currently implemented basic movements:
- **Forward** (W / ▲)
- **Backward** (S / ▼)
- **Left** (A / ◀)
- **Right** (D / ▶)
- **Turn Left** (Q / ↺)
- **Turn Right** (E / ↻)

## Serial Protocol

The server sends single-character commands to the robot via COM11 at 9600 baud:

| Command | Character | Action |
|---------|-----------|--------|
| Forward | `F` | Move forward |
| Backward | `B` | Move backward |
| Left | `L` | Move left |
| Right | `R` | Move right |
| Turn Left | `TL` | Turn left |
| Turn Right | `TR` | Turn right |

**Note**: Adjust these characters in `server.js` (`MOVEMENT_COMMANDS` object) based on your robot's actual serial protocol.

## API Endpoints

- `POST /api/connect` - Connect to robot on COM11
- `POST /api/disconnect` - Disconnect from robot
- `GET /api/status` - Get current connection status
- `POST /api/move` - Send movement command (requires `{ command: 'forward|backward|left|right|turn-left|turn-right' }`)

## Customization

To match your robot's actual serial commands:

1. Open `server.js`
2. Modify the `MOVEMENT_COMMANDS` object:
   ```javascript
   const MOVEMENT_COMMANDS = {
     'forward': 'F',      // Change 'F' to your robot's forward command
     'backward': 'B',     // Change 'B' to your robot's backward command
     // ... etc
   };
   ```

3. Restart the server

## Future Enhancements

- Advanced movement controls (speed, acceleration)
- Sensor feedback integration
- Motion tracking
- Video stream integration with movement coordination
