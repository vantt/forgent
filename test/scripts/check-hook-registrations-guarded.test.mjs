// The hook-registration guard check: a Claude Code registration that runs the project's own shim must
// test that the shim exists, like one that runs a gitignored hooks script. No other test runs the script.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts/check-hook-registrations-guarded.mjs');
const SHIM = '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"';

function check(commands) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-guard-check-'));
  try {
    fs.mkdirSync(path.join(cwd, '.claude'));
    const hooks = { PreToolUse: commands.map((command) => ({ matcher: 'Agent', hooks: [{ type: 'command', command }] })) };
    fs.writeFileSync(path.join(cwd, '.claude', 'settings.json'), JSON.stringify({ hooks }));
    return spawnSync(process.execPath, [SCRIPT], { cwd, encoding: 'utf8' });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

test('a shim registration without the existence test is named and fails the check', () => {
  const result = check([`${SHIM} hook dispatch-decide`]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /hook dispatch-decide/);
});

test('a shim registration that tests the shim first passes', () => {
  const result = check([`S=${SHIM}; [ -x "$S" ] || exit 0; "$S" hook dispatch-decide`]);
  assert.equal(result.status, 0, result.stderr);
});
