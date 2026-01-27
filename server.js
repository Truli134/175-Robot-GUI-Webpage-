const express = require('express');
const path = require('path');
const SerialPort = require('serialport');
const cors = require('cors');

const app = express();
const PORT = 3000;

let port = null;
let isConnected = false;
let currentVoltage = 0.0;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Website_GUI')));

// Movement command mappings for the robot
// Adjust these based on your robot's actual serial protocol
const MOVEMENT_COMMANDS = {
  'forward': 'F',      // Move forward
  'backward': 'B',     // Move backward
  'left': 'L',         // Move left
  'right': 'R',        // Move right
  'turn-left': 'TL',   // Turn left
  'turn-right': 'TR'   // Turn right
};

// Connect to robot on COM11
app.post('/api/connect', (req, res) => {
  if (isConnected) {
    return res.json({ status: 'already_connected', message: 'Robot already connected' });
  }

  port = new SerialPort.SerialPort({
    path: 'COM11',
    baudRate: 9600,
    autoOpen: false
  });

  port.open((err) => {
    if (err) {
      console.error('Error connecting to COM11:', err);
      isConnected = false;
      return res.status(500).json({ status: 'error', message: err.message });
    }

    isConnected = true;
    console.log('Connected to robot on COM11');

    // Handle incoming data
    port.on('data', (data) => {
      const message = data.toString().trim();
      console.log('Data from robot:', message);
      
      // Parse voltage data - expects format like "V:12.5" or "VOLTAGE:12.5"
      const voltageMatch = message.match(/V[OLTAGE]*:?\s*([\d.]+)/i);
      if (voltageMatch) {
        currentVoltage = parseFloat(voltageMatch[1]);
        console.log('Updated voltage:', currentVoltage);
      }
    });

    // Handle errors
    port.on('error', (err) => {
      console.error('Serial port error:', err);
      isConnected = false;
    });

    res.json({ status: 'connected', message: 'Successfully connected to robot on COM11' });
  });
});

// Disconnect from robot
app.post('/api/disconnect', (req, res) => {
  if (!isConnected || !port) {
    return res.json({ status: 'not_connected', message: 'Robot not connected' });
  }

  port.close((err) => {
    isConnected = false;
    if (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
    res.json({ status: 'disconnected', message: 'Successfully disconnected from robot' });
  });
});

// Get connection status
app.get('/api/status', (req, res) => {
  res.json({ connected: isConnected, voltage: currentVoltage });
});

// Get voltage reading
app.get('/api/voltage', (req, res) => {
  res.json({ voltage: currentVoltage });
});

// Send movement command to robot
app.post('/api/move', (req, res) => {
  const { command } = req.body;

  if (!isConnected || !port) {
    return res.status(400).json({ status: 'error', message: 'Robot not connected' });
  }

  const serialCommand = MOVEMENT_COMMANDS[command];
  if (!serialCommand) {
    return res.status(400).json({ status: 'error', message: `Unknown command: ${command}` });
  }

  // Send command to the robot
  port.write(serialCommand + '\n', (err) => {
    if (err) {
      console.error('Error sending command:', err);
      return res.status(500).json({ status: 'error', message: err.message });
    }

    console.log(`Sent command: ${command} (${serialCommand})`);
    res.json({ status: 'sent', command: command, serialCommand: serialCommand });
  });
});

app.listen(PORT, () => {
  console.log(`Robot server running on http://localhost:${PORT}`);
});
