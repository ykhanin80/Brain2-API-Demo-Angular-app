/**
 * Backend API server for development
 * Runs on port 3000 and provides API endpoints for action configurations
 */

import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON body
app.use(express.json());

/**
 * Action Configurations Storage
 */
const dataDir = join(__dirname, 'data');
const configFilePath = join(dataDir, 'action-configurations.json');

// Default configurations
const defaultConfigs = [
  {
    id: 'default_1',
    buttonLabel: 'Line 1',
    productionLine: 'Line 1',
    jobName: 'SendToLine1',
    order: 0
  },
  {
    id: 'default_2',
    buttonLabel: 'Line 2',
    productionLine: 'Line 2',
    jobName: 'SendToLine2',
    order: 1
  },
  {
    id: 'default_3',
    buttonLabel: 'Whole Birds Line1',
    productionLine: 'Whole Birds Line1',
    jobName: 'SendWholeBirdsLine1',
    order: 2
  }
];

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory:', dataDir);
}

// Initialize config file if it doesn't exist
if (!existsSync(configFilePath)) {
  writeFileSync(configFilePath, JSON.stringify(defaultConfigs, null, 2));
  console.log('✨ Initialized action-configurations.json with defaults');
}

/**
 * API Endpoints
 */

// GET /api/action-configurations - Get all action configurations
app.get('/api/action-configurations', (req, res) => {
  try {
    const data = readFileSync(configFilePath, 'utf-8');
    const configs = JSON.parse(data);
    console.log('✅ GET /api/action-configurations - Loaded', configs.length, 'configurations');
    res.json(configs);
  } catch (error) {
    console.error('❌ Error reading action configurations:', error);
    res.status(500).json({ error: 'Failed to read configurations' });
  }
});

// POST /api/action-configurations - Save all action configurations
app.post('/api/action-configurations', (req, res) => {
  try {
    const configs = req.body;
    writeFileSync(configFilePath, JSON.stringify(configs, null, 2));
    console.log('✅ POST /api/action-configurations - Saved', configs.length, 'configurations');
    res.json({ success: true, message: 'Configurations saved successfully' });
  } catch (error) {
    console.error('❌ Error saving action configurations:', error);
    res.status(500).json({ error: 'Failed to save configurations' });
  }
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n🚀 Backend API server running on http://localhost:${PORT}`);
  console.log(`💾 Config file: ${configFilePath}`);
  console.log(`📡 Ready to accept requests from Angular dev server on port 4200\n`);
});
