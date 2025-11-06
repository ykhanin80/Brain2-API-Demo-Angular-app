/**
 * Simple Express server to serve the Angular app and provide API endpoints
 * for storing action configurations and managing users
 */

import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

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
const usersFilePath = join(dataDir, 'users.json');

/**
 * Password hashing utilities
 */
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

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
 * User Management Storage
 */

// Default users with hashed passwords
const defaultUsers = [
  {
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    displayName: 'Administrator',
    createdAt: new Date().toISOString()
  },
  {
    username: 'operator',
    passwordHash: hashPassword('operator123'),
    role: 'operator',
    displayName: 'Actions Operator',
    createdAt: new Date().toISOString()
  },
  {
    username: 'viewer',
    passwordHash: hashPassword('viewer123'),
    role: 'viewer',
    displayName: 'Viewer',
    createdAt: new Date().toISOString()
  }
];

// Initialize users file if it doesn't exist
if (!existsSync(usersFilePath)) {
  writeFileSync(usersFilePath, JSON.stringify(defaultUsers, null, 2));
  console.log('Initialized users.json with default users');
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
 * User Management Endpoints
 */

// GET /api/users - Get all users (without password hashes)
app.get('/api/users', (req, res) => {
  try {
    const data = readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data);
    // Remove password hashes before sending to client
    const safeUsers = users.map(({ passwordHash, ...user }) => user);
    console.log('Loaded', safeUsers.length, 'users');
    res.json(safeUsers);
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// POST /api/users/validate - Validate user credentials
app.post('/api/users/validate', (req, res) => {
  try {
    const { username, password } = req.body;
    const data = readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data);
    
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Return user without password hash
    const { passwordHash, ...safeUser } = user;
    console.log('User', username, 'validated');
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Error validating user:', error);
    res.status(500).json({ error: 'Failed to validate user' });
  }
});

// POST /api/users - Create new user
app.post('/api/users', (req, res) => {
  try {
    const { username, password, role, displayName } = req.body;
    
    // Validation
    if (!username || !password || !role || !displayName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const data = readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data);
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    // Create new user with hashed password
    const newUser = {
      username,
      passwordHash: hashPassword(password),
      role,
      displayName,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    
    console.log('Created user', username);
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:username - Update existing user
app.put('/api/users/:username', (req, res) => {
  try {
    const { username } = req.params;
    const { password, role, displayName } = req.body;
    
    const data = readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data);
    
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update user fields
    if (displayName) users[userIndex].displayName = displayName;
    if (role) users[userIndex].role = role;
    if (password) users[userIndex].passwordHash = hashPassword(password);
    users[userIndex].updatedAt = new Date().toISOString();
    
    writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    
    console.log('Updated user', username);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:username - Delete user
app.delete('/api/users/:username', (req, res) => {
  try {
    const { username } = req.params;
    
    // Prevent deleting admin user
    if (username === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin user' });
    }
    
    const data = readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data);
    
    const filteredUsers = users.filter(u => u.username !== username);
    
    if (filteredUsers.length === users.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    writeFileSync(usersFilePath, JSON.stringify(filteredUsers, null, 2));
    
    console.log('Deleted user', username);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
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
