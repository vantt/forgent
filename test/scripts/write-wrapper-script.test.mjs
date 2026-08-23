import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeWrapperScript } from '../../scripts/write-wrapper-script.mjs';

const scriptPath = fileURLToPath(new URL('../../scripts/write-wrapper-script.mjs', import.meta.url));

// --- writeWrapperScript unit tests ---------------------------------------

test('writeWrapperScript creates executable file with exact command byte-for-byte', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-test-'));
  try {
    const cmd = 'echo "hello world"';
    const filePath = writeWrapperScript({ command: cmd, dir: tmpDir, name: 'test-script.sh' });

    assert.equal(filePath, path.join(tmpDir, 'test-script.sh'));
    assert.ok(fs.existsSync(filePath));

    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(content, `#!/bin/sh\nset -eu\n${cmd}\n`);

    const stat = fs.statSync(filePath);
    // Check executable bit for user (0o100)
    assert.ok((stat.mode & 0o100) !== 0, 'file should be executable by user');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeWrapperScript appends .sh to name if missing', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-test-'));
  try {
    const filePath = writeWrapperScript({ command: 'ls', dir: tmpDir, name: 'my-script' });
    assert.equal(path.basename(filePath), 'my-script.sh');
    assert.ok(fs.existsSync(filePath));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeWrapperScript handles commands containing quotes and subshells unmodified', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-test-'));
  try {
    const complexCmd = `node "$root/src/runner/dispatch.mjs" execute my-executor --prompt "$(cat /path/to/prompt.txt)" 2>&1 | grep -E --line-buffered '\\[DONE\\]|Error|^\\{'`;
    const filePath = writeWrapperScript({ command: complexCmd, dir: tmpDir });

    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(content, `#!/bin/sh\nset -eu\n${complexCmd}\n`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeWrapperScript generates unique filenames when name is omitted', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-test-'));
  try {
    const path1 = writeWrapperScript({ command: 'echo 1', dir: tmpDir });
    const path2 = writeWrapperScript({ command: 'echo 2', dir: tmpDir });

    assert.notEqual(path1, path2);
    assert.ok(fs.existsSync(path1));
    assert.ok(fs.existsSync(path2));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeWrapperScript throws when command is missing or not a string', () => {
  assert.throws(
    () => writeWrapperScript({ command: '' }),
    /Missing or invalid required argument: --command/
  );
  assert.throws(
    () => writeWrapperScript({ command: null }),
    /Missing or invalid required argument: --command/
  );
});

// --- CLI end-to-end tests ------------------------------------------------

test('CLI creates wrapper script and prints absolute path to stdout', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wrapper-cli-test-'));
  try {
    const cmd = 'npm test';
    const result = spawnSync(process.execPath, [scriptPath, '--command', cmd, '--dir', tmpDir, '--name', 'cli-run'], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 0);
    const printedPath = result.stdout.trim();
    assert.equal(printedPath, path.join(tmpDir, 'cli-run.sh'));
    assert.ok(fs.existsSync(printedPath));

    const content = fs.readFileSync(printedPath, 'utf8');
    assert.equal(content, `#!/bin/sh\nset -eu\n${cmd}\n`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI exits with error when --command is omitted', () => {
  const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing or invalid required argument: --command/);
});
