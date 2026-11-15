import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { detectRcFiles } from '../../src/setup/shell-rc.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('detectRcFiles returns only rc files that actually exist', () => {
  const homeDir = mkTempDir('shell-rc-detect-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), '');

  const found = detectRcFiles(homeDir, 'linux');

  assert.deepEqual(found, [path.join(homeDir, '.bashrc')]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('detectRcFiles returns both when bash and zsh rc files exist', () => {
  const homeDir = mkTempDir('shell-rc-detect-both-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), '');
  fs.writeFileSync(path.join(homeDir, '.zshrc'), '');

  const found = detectRcFiles(homeDir, 'linux');

  assert.deepEqual(found, [path.join(homeDir, '.bashrc'), path.join(homeDir, '.zshrc')]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('detectRcFiles returns an empty array when no rc file exists', () => {
  const homeDir = mkTempDir('shell-rc-detect-none-');

  const found = detectRcFiles(homeDir);

  assert.deepEqual(found, []);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('detectRcFiles on win32 detects a PowerShell 7 (pwsh) profile', () => {
  const homeDir = mkTempDir('shell-rc-detect-win-pwsh-');
  const profileDir = path.join(homeDir, 'Documents', 'PowerShell');
  fs.mkdirSync(profileDir, { recursive: true });
  const profilePath = path.join(profileDir, 'Microsoft.PowerShell_profile.ps1');
  fs.writeFileSync(profilePath, '');

  const found = detectRcFiles(homeDir, 'win32');

  assert.deepEqual(found, [profilePath]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('detectRcFiles on win32 detects a Windows PowerShell 5.1 profile', () => {
  const homeDir = mkTempDir('shell-rc-detect-win-legacy-');
  const profileDir = path.join(homeDir, 'Documents', 'WindowsPowerShell');
  fs.mkdirSync(profileDir, { recursive: true });
  const profilePath = path.join(profileDir, 'Microsoft.PowerShell_profile.ps1');
  fs.writeFileSync(profilePath, '');

  const found = detectRcFiles(homeDir, 'win32');

  assert.deepEqual(found, [profilePath]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('detectRcFiles on win32 never returns bash/zsh rc files, even if present', () => {
  const homeDir = mkTempDir('shell-rc-detect-win-ignores-unix-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), '');
  fs.writeFileSync(path.join(homeDir, '.zshrc'), '');

  const found = detectRcFiles(homeDir, 'win32');

  assert.deepEqual(found, []);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('detectRcFiles defaults to the real process.platform when no platform is passed', () => {
  const homeDir = mkTempDir('shell-rc-detect-default-platform-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), '');

  const found = detectRcFiles(homeDir);

  assert.deepEqual(found, process.platform === 'win32' ? [] : [path.join(homeDir, '.bashrc')]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});
