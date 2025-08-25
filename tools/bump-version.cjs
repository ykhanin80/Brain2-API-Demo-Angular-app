/*
  Auto-bump package.json version (patch) before each build.
  - Updates package.json version a.b.c -> a.b.(c+1)
  - Syncs package-lock.json (top-level and packages[""] if present)
*/
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function bumpPatch(ver) {
  const m = ver.match(/^(\d+)\.(\d+)\.(\d+)(?:[+-].*)?$/);
  if (!m) throw new Error(`Unsupported version format: ${ver}`);
  const [major, minor, patch] = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  return `${major}.${minor}.${patch + 1}`;
}

function bumpMinor(ver) {
  const m = ver.match(/^(\d+)\.(\d+)\.(\d+)(?:[+-].*)?$/);
  if (!m) throw new Error(`Unsupported version format: ${ver}`);
  const [major, minor] = [parseInt(m[1], 10), parseInt(m[2], 10)];
  return `${major}.${minor + 1}.0`;
}

function bumpMajor(ver) {
  const m = ver.match(/^(\d+)\.(\d+)\.(\d+)(?:[+-].*)?$/);
  if (!m) throw new Error(`Unsupported version format: ${ver}`);
  const major = parseInt(m[1], 10);
  return `${major + 1}.0.0`;
}

try {
  const pkg = readJson(pkgPath);
  const oldVer = pkg.version || '0.0.0';
  const mode = String(process.env.BUMP || 'patch').toLowerCase();
  const newVer = mode === 'major' ? bumpMajor(oldVer)
               : mode === 'minor' ? bumpMinor(oldVer)
               : bumpPatch(oldVer);
  pkg.version = newVer;
  writeJson(pkgPath, pkg);

  if (fs.existsSync(lockPath)) {
    try {
      const lock = readJson(lockPath);
      if (lock.version) lock.version = newVer;
      if (lock.packages && lock.packages['']) {
        lock.packages[''].version = newVer;
      }
      writeJson(lockPath, lock);
    } catch (e) {
      // Non-fatal if lock update fails
      console.warn('[bump-version] package-lock.json update skipped:', e.message);
    }
  }

  console.log(`[bump-version] (${mode}) ${oldVer} -> ${newVer}`);
} catch (err) {
  console.warn('[bump-version] Failed to bump version:', err.message);
}
