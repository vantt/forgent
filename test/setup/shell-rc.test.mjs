import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { detectRcFiles, hasSourceLine, insertSourceLine, deadSourceLines } from '../../src/setup/shell-rc.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('detectRcFiles returns only rc files that actually exist', () => {
  const homeDir = mkTempDir('shell-rc-detect-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), '');

  const found = detectRcFiles(homeDir);

  assert.deepEqual(found, [path.join(homeDir, '.bashrc')]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('detectRcFiles returns both when bash and zsh rc files exist', () => {
  const homeDir = mkTempDir('shell-rc-detect-both-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), '');
  fs.writeFileSync(path.join(homeDir, '.zshrc'), '');

  const found = detectRcFiles(homeDir);

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

test('hasSourceLine is false for a fresh rc file', () => {
  const homeDir = mkTempDir('shell-rc-has-fresh-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, 'echo hello\n');
  const scriptPath = path.join(homeDir, 'fgos-shell-integration.sh');

  assert.equal(hasSourceLine(rcFile, scriptPath), false);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('hasSourceLine is false when the rc file does not exist', () => {
  const homeDir = mkTempDir('shell-rc-has-missing-');
  const rcFile = path.join(homeDir, '.bashrc');
  const scriptPath = path.join(homeDir, 'fgos-shell-integration.sh');

  assert.equal(hasSourceLine(rcFile, scriptPath), false);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('hasSourceLine tolerates double quotes, single quotes, and no quotes', () => {
  const homeDir = mkTempDir('shell-rc-has-quoting-');
  const scriptPath = path.join(homeDir, 'fgos-shell-integration.sh');

  const doubleQuoted = path.join(homeDir, 'double.rc');
  fs.writeFileSync(doubleQuoted, `source "${scriptPath}"\n`);
  assert.equal(hasSourceLine(doubleQuoted, scriptPath), true);

  const singleQuoted = path.join(homeDir, 'single.rc');
  fs.writeFileSync(singleQuoted, `source '${scriptPath}'\n`);
  assert.equal(hasSourceLine(singleQuoted, scriptPath), true);

  const unquoted = path.join(homeDir, 'unquoted.rc');
  fs.writeFileSync(unquoted, `source ${scriptPath}\n`);
  assert.equal(hasSourceLine(unquoted, scriptPath), true);

  const dotForm = path.join(homeDir, 'dot.rc');
  fs.writeFileSync(dotForm, `. "${scriptPath}"\n`);
  assert.equal(hasSourceLine(dotForm, scriptPath), true);

  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('insertSourceLine appends the source line and returns true when not already present', () => {
  const homeDir = mkTempDir('shell-rc-insert-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, 'echo hello\n');
  const scriptPath = path.join(homeDir, 'fgos-shell-integration.sh');

  const inserted = insertSourceLine(rcFile, scriptPath);

  assert.equal(inserted, true);
  assert.equal(hasSourceLine(rcFile, scriptPath), true);
  const content = fs.readFileSync(rcFile, 'utf8');
  assert.match(content, /echo hello/);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('insertSourceLine is idempotent — calling it twice never duplicates the source line', () => {
  const homeDir = mkTempDir('shell-rc-idempotent-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, 'echo hello\n');
  const scriptPath = path.join(homeDir, 'fgos-shell-integration.sh');

  const firstInsert = insertSourceLine(rcFile, scriptPath);
  const secondInsert = insertSourceLine(rcFile, scriptPath);

  assert.equal(firstInsert, true);
  assert.equal(secondInsert, false);
  const content = fs.readFileSync(rcFile, 'utf8');
  const occurrences = content.split(`source "${scriptPath}"`).length - 1;
  assert.equal(occurrences, 1);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('insertSourceLine is a no-op when the source line is already present in a different form', () => {
  const homeDir = mkTempDir('shell-rc-noop-existing-');
  const rcFile = path.join(homeDir, '.bashrc');
  const scriptPath = path.join(homeDir, 'fgos-shell-integration.sh');
  fs.writeFileSync(rcFile, `source ${scriptPath}\n`);

  const inserted = insertSourceLine(rcFile, scriptPath);

  assert.equal(inserted, false);
  const content = fs.readFileSync(rcFile, 'utf8');
  const occurrences = content.split(scriptPath).length - 1;
  assert.equal(occurrences, 1);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('insertSourceLine never creates a new rc file that does not already exist', () => {
  const homeDir = mkTempDir('shell-rc-no-create-');
  const rcFile = path.join(homeDir, '.bashrc');
  const scriptPath = path.join(homeDir, 'fgos-shell-integration.sh');

  assert.throws(() => insertSourceLine(rcFile, scriptPath));
  assert.equal(fs.existsSync(rcFile), false);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('deadSourceLines reports an fgos source line whose target no longer exists', () => {
  const homeDir = mkTempDir('shell-rc-dead-');
  const rcFile = path.join(homeDir, '.bashrc');
  const gone = path.join(homeDir, 'removed-worktree', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(rcFile, `echo hi\nsource "${gone}"\n`);

  assert.deepEqual(deadSourceLines(rcFile), [gone]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('deadSourceLines never reports a line whose target still exists', () => {
  const homeDir = mkTempDir('shell-rc-alive-');
  const rcFile = path.join(homeDir, '.bashrc');
  const live = path.join(homeDir, 'fgos-shell-integration.sh');
  fs.writeFileSync(live, '');
  fs.writeFileSync(rcFile, `source "${live}"\n`);

  assert.deepEqual(deadSourceLines(rcFile), []);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('deadSourceLines reports every dead line, not just the first', () => {
  const homeDir = mkTempDir('shell-rc-dead-many-');
  const rcFile = path.join(homeDir, '.bashrc');
  const first = path.join(homeDir, 'a', 'scripts', 'fgos-shell-integration.sh');
  const second = path.join(homeDir, 'b', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(rcFile, `source "${first}"\nexport X=1\nsource "${second}"\n`);

  assert.deepEqual(deadSourceLines(rcFile), [first, second]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('deadSourceLines matches the unquoted and dot forms the insert pattern accepts', () => {
  const homeDir = mkTempDir('shell-rc-dead-forms-');
  const rcFile = path.join(homeDir, '.bashrc');
  const unquoted = path.join(homeDir, 'a', 'scripts', 'fgos-shell-integration.sh');
  const dotForm = path.join(homeDir, 'b', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(rcFile, `source ${unquoted}\n. "${dotForm}"\n`);

  assert.deepEqual(deadSourceLines(rcFile), [unquoted, dotForm]);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('deadSourceLines ignores source lines the user wrote for their own scripts', () => {
  const homeDir = mkTempDir('shell-rc-dead-foreign-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, `source "${path.join(homeDir, 'gone', 'my-own-thing.sh')}"\n`);

  assert.deepEqual(deadSourceLines(rcFile), []);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('deadSourceLines returns nothing for an rc file that does not exist', () => {
  const homeDir = mkTempDir('shell-rc-dead-absent-');

  assert.deepEqual(deadSourceLines(path.join(homeDir, '.bashrc')), []);
  fs.rmSync(homeDir, { recursive: true, force: true });
});
