/**
 * Simple Express server to serve the Angular app and provide API endpoints
 * for storing action configurations
 */

import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4200;

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
  console.log('Created data directory:', dataDir);
}

// Initialize config file if it doesn't exist
if (!existsSync(configFilePath)) {
  writeFileSync(configFilePath, JSON.stringify(defaultConfigs, null, 2));
  console.log('Initialized action-configurations.json with defaults');
}

/**
 * API Endpoints
 */

// GET /api/action-configurations - Get all action configurations
app.get('/api/action-configurations', (req, res) => {
  try {
    const data = readFileSync(configFilePath, 'utf-8');
    const configs = JSON.parse(data);
    console.log('Loaded', configs.length, 'action configurations');
    res.json(configs);
  } catch (error) {
    console.error('Error reading action configurations:', error);
    res.status(500).json({ error: 'Failed to read configurations' });
  }
});

// POST /api/action-configurations - Save all action configurations
app.post('/api/action-configurations', (req, res) => {
  try {
    const configs = req.body;
    writeFileSync(configFilePath, JSON.stringify(configs, null, 2));
    console.log('Saved', configs.length, 'action configurations');
    res.json({ success: true, message: 'Configurations saved successfully' });
  } catch (error) {
    console.error('Error saving action configurations:', error);
    res.status(500).json({ error: 'Failed to save configurations' });
  }
});

/**
 * Serve static files from dist/order-app/browser
 */
const distPath = join(__dirname, 'dist', 'order-app', 'browser');
app.use(express.static(distPath));

/**
 * Serve index.html for all other routes (Angular routing)
 */
app.use((req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${distPath}`);
  console.log(`💾 Config file: ${configFilePath}\n`);
});
