/**
 * Install Order App API as a Windows Service
 * Run as Administrator: node install-service.js
 */

import { Service } from 'node-windows';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a new service object
const svc = new Service({
  name: 'OrderAppAPI',
  description: 'Order App Backend API Server',
  script: join(__dirname, 'api-server.mjs'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function() {
  console.log('✅ Service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('⚠️  Service is already installed.');
  console.log('To reinstall, run uninstall-service.js first.');
});

svc.on('start', function() {
  console.log('✅ Service started successfully!');
  console.log('Service Name: OrderAppAPI');
  console.log('API URL: http://localhost:3000');
  console.log('Swagger Docs: http://localhost:3000/api-docs');
  console.log('\nTo manage the service:');
  console.log('  - Open Services (services.msc)');
  console.log('  - Look for "OrderAppAPI"');
  console.log('  - Right-click to Stop, Start, or configure');
});

svc.on('error', function(err) {
  console.error('❌ Service installation error:', err);
});

console.log('📦 Installing Order App API as Windows Service...');
console.log('⚠️  Note: This script must be run as Administrator\n');

svc.install();
