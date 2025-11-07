/**
 * Backend API server for development
 * Runs on port 3000 and provides API endpoints for action configurations
 */

import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order App API',
      version: '1.0.0',
      description: 'API documentation for Order App backend server',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'admin' },
            displayName: { type: 'string', example: 'Administrator' },
            role: { 
              type: 'string', 
              enum: ['admin', 'operator', 'viewer', 'custom'],
              example: 'admin'
            },
            permissionLevel: {
              type: 'string',
              enum: ['power-user', 'basic-user'],
              example: 'power-user',
              description: 'Power User can edit/create/delete, Basic User can only view'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['create-order', 'all-orders', 'capture', 'actions', 'data-maintenance', 'package-record', 'label-preview', 'settings']
              },
              example: ['actions', 'capture']
            }
          }
        },
        ActionConfiguration: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'action-1' },
            name: { type: 'string', example: 'Action 1' },
            productionLine: { type: 'string', example: 'Line 1' },
            brain2Job: { type: 'string', example: 'Job123' },
            order: { type: 'number', example: 1 }
          }
        }
      }
    }
  },
  apis: ['./api-server.mjs']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log('📚 Swagger documentation available at http://localhost:3000/api-docs');


/**
 * Action Configurations Storage
 */
const dataDir = join(__dirname, 'data');
const configFilePath = join(dataDir, 'action-configurations.json');
const usersFilePath = join(dataDir, 'users.json');

/**
 * Password Hashing Utilities
 */
function hashPassword(password) {
  // Using SHA-256 for simplicity. In production, use bcrypt or argon2
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
  console.log('📁 Created data directory:', dataDir);
}

// Initialize config file if it doesn't exist
if (!existsSync(configFilePath)) {
  writeFileSync(configFilePath, JSON.stringify(defaultConfigs, null, 2));
  console.log('✨ Initialized action-configurations.json with defaults');
}

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
  console.log('✨ Initialized users.json with default users');
}

/**
 * API Endpoints
 */

/**
 * @swagger
 * /api/action-configurations:
 *   get:
 *     summary: Get all action configurations
 *     description: Returns a list of all action configurations
 *     tags: [Action Configurations]
 *     responses:
 *       200:
 *         description: List of action configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActionConfiguration'
 *       500:
 *         description: Server error
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

/**
 * @swagger
 * /api/action-configurations:
 *   post:
 *     summary: Update action configurations
 *     description: Saves the entire action configurations array
 *     tags: [Action Configurations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/ActionConfiguration'
 *     responses:
 *       200:
 *         description: Configurations saved successfully
 *       500:
 *         description: Server error
 */
// POST /api/action-configurations - Save action configurations
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
 * User Management Endpoints
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Returns a list of all users (without password hashes)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
// GET /api/users - Get all users (without password hashes)
app.get('/api/users', (req, res) => {
  try {
    const data = readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data);
    // Remove password hashes before sending to client
    const safeUsers = users.map(({ passwordHash, ...user }) => user);
    console.log('✅ GET /api/users - Loaded', safeUsers.length, 'users');
    res.json(safeUsers);
  } catch (error) {
    console.error('❌ Error reading users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

/**
 * @swagger
 * /api/users/validate:
 *   post:
 *     summary: Validate user credentials
 *     description: Authenticates a user with username and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
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
    console.log('✅ POST /api/users/validate - User', username, 'validated');
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('❌ Error validating user:', error);
    res.status(500).json({ error: 'Failed to validate user' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with the provided credentials
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *               - displayName
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, operator, viewer, custom]
 *               displayName:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or username already exists
 */
// POST /api/users - Create new user
app.post('/api/users', (req, res) => {
  try {
    const { username, password, role, displayName, permissions, permissionLevel } = req.body;
    
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
      permissions: permissions || [],
      permissionLevel: permissionLevel || 'basic-user', // Default to basic-user if not specified
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    
    console.log('✅ POST /api/users - Created user', username);
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * @swagger
 * /api/users/{username}:
 *   put:
 *     summary: Update an existing user
 *     description: Updates user information including role, displayName, password, and permissions
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, operator, viewer, custom]
 *               password:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
// PUT /api/users/:username - Update existing user
app.put('/api/users/:username', (req, res) => {
  try {
    const { username } = req.params;
    const { password, role, displayName, permissions, permissionLevel } = req.body;
    
    console.log('🔧 PUT /api/users/:username - Request body:', JSON.stringify(req.body, null, 2));
    
    const data = readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data);
    
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('📝 Before update:', JSON.stringify(users[userIndex], null, 2));
    
    // Update user fields
    if (displayName) users[userIndex].displayName = displayName;
    if (role) users[userIndex].role = role;
    if (password) users[userIndex].passwordHash = hashPassword(password);
    if (permissions !== undefined) users[userIndex].permissions = permissions;
    if (permissionLevel !== undefined) users[userIndex].permissionLevel = permissionLevel;
    users[userIndex].updatedAt = new Date().toISOString();
    
    console.log('📝 After update:', JSON.stringify(users[userIndex], null, 2));
    
    writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    
    console.log('✅ PUT /api/users/:username - Updated user', username);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * @swagger
 * /api/users/{username}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user (cannot delete admin user)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete admin user
 *       404:
 *         description: User not found
 */
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
    
    console.log('✅ DELETE /api/users/:username - Deleted user', username);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
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
