/**
 * Uninstall Order App API Windows Service
 * Run as Administrator: node uninstall-service.js
 */

import { Service } from 'node-windows';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a new service object
const svc = new Service({
  name: 'OrderAppAPI',
  script: join(__dirname, 'api-server.mjs')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('✅ Service uninstalled successfully!');
  console.log('The OrderAppAPI service has been removed.');
});

svc.on('alreadyuninstalled', function() {
  console.log('⚠️  Service is not installed.');
});

svc.on('error', function(err) {
  console.error('❌ Service uninstallation error:', err);
});

console.log('📦 Uninstalling Order App API Windows Service...');
console.log('⚠️  Note: This script must be run as Administrator\n');

svc.uninstall();
