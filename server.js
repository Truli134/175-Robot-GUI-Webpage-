const express = require('express');
const path = require('path');
const SerialPort = require('serialport');
const cors = require('cors');

const app = express();
const PORT = 3000;

let port = null;
let isConnected = false;
let currentVoltage = 0.0;
let voltageInterval = null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Website_GUI')));

// Protocol constants (from Processing App)
const TRANS_START = 128;
const TRANS_END = 129;
const ORDER_DONE = 23;
const ORDER_START = 21;
const REQUEST_SUPPLY_VOLTAGE = 10;
const SUPPLY_VOLTAGE = 11;

// Movement command byte mappings (blocking orders from Processing App)
const MOVEMENT_COMMANDS = {
  'forward': 80,      // requestCrawlForward
  'backward': 82,     // requestCrawlBackward
  'left': 84,         // requestCrawlLeft
  'right': 86,        // requestCrawlRight
  'turn-left': 88,    // requestTurnLeft
  'turn-right': 90    // requestTurnRight
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
      console.log('Data from robot (bytes):', Array.from(data));
      
      // Parse voltage response - format: [TRANS_START] [SUPPLY_VOLTAGE] [voltage_high] [voltage_low] [TRANS_END]
      for (let i = 0; i < data.length - 3; i++) {
        if (data[i] === TRANS_START && data[i + 1] === SUPPLY_VOLTAGE) {
          const voltageHigh = data[i + 2];
          const voltageLow = data[i + 3];
          currentVoltage = (voltageHigh * 128 + voltageLow) / 100.0;
          console.log('Updated voltage:', currentVoltage, 'V');
          break;
        }
      }
    });

    // Handle errors
    port.on('error', (err) => {
      console.error('Serial port error:', err);
      isConnected = false;
      if (voltageInterval) {
        clearInterval(voltageInterval);
        voltageInterval = null;
      }
    });

    // Start polling voltage every 1.5 seconds
    voltageInterval = setInterval(() => {
      if (isConnected && port && port.isOpen) {
        const voltageCommand = Buffer.from([TRANS_START, REQUEST_SUPPLY_VOLTAGE, TRANS_END]);
        port.write(voltageCommand, (err) => {
          if (err) {
            console.error('Error requesting voltage:', err);
          }
        });
      }
    }, 1500);

    res.json({ status: 'connected', message: 'Successfully connected to robot on COM11' });
  });
});

// Disconnect from robot
app.post('/api/disconnect', (req, res) => {
  if (!isConnected || !port) {
    return res.json({ status: 'not_connected', message: 'Robot not connected' });
  }

  // Stop voltage polling
  if (voltageInterval) {
    clearInterval(voltageInterval);
    voltageInterval = null;
  }

  port.close((err) => {
    isConnected = false;
    currentVoltage = 0.0;
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

  const orderByte = MOVEMENT_COMMANDS[command];
  if (!orderByte) {
    return res.status(400).json({ status: 'error', message: `Unknown command: ${command}` });
  }

  // Send command in proper protocol format: [TRANS_START] [order] [TRANS_END]
  const commandBuffer = Buffer.from([TRANS_START, orderByte, TRANS_END]);
  
  port.write(commandBuffer, (err) => {
    if (err) {
      console.error('Error sending command:', err);
      return res.status(500).json({ status: 'error', message: err.message });
    }

    console.log(`Sent command: ${command} (byte: ${orderByte})`);
    res.json({ status: 'sent', command: command, orderByte: orderByte });
  });
});

app.listen(PORT, () => {
  console.log(`Robot server running on http://localhost:${PORT}`);
});
