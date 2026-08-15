// setup-checks-harness.mjs -- bộ đồ nghề dùng chung của các file test dựng
// môi trường thật cho `fgos setup`/`fgos doctor`, tách nguyên văn ra khỏi
// test/setup/checks.test.mjs khi file đó được chẻ nhỏ (tsk-67g).
//
// Hai thứ đổi, vì module này nằm sâu hơn file gốc một thư mục:
//   - specifier của các dòng import lùi thêm một cấp (ESM giải theo vị trí file);
//   - __dirname được định nghĩa lùi ngược một cấp để vẫn trỏ vào test/setup/,
//     nên mọi path.resolve(__dirname, ...) -- trong helper lẫn trong test đã
//     chuyển đi -- giữ nguyên nghĩa.
// checks.test.mjs — fgos doctor's check registry (str87-fgos-setup-doctor
// D2) plus CLI-level proof that `fgos setup`/`fgos doctor` (with/without
// --pretty) actually behave as CTR001/D7 require. Mirrors
// test/cli/fgos-manifest.test.mjs's/test/install-packaging.test.mjs's real
// spawnSync harness — no mocking the CLI process itself.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

import { DOCTOR_CHECKS, FIX_REGISTRATIONS, integrationScriptPath, mainCheckoutHookWired, resolveMainCheckout } from '../../../src/setup/checks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../../src/runner/dispatch.mjs';
import { DEFAULT_LEVEL } from '../../../src/state/gate-bypass.mjs';
import {
  DEFAULT_CLEANUP_TTL_DAYS,
  DEFAULT_CLEANUP_LEAF_TTL_DAYS,
  DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
  DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
} from '../../../src/setup/registrations.mjs';
import { DEFAULT_INVARIANT_CHECK_COMMANDS } from '../../../src/config/shared-config-file.mjs';
import { initStore, addWork } from '../../../src/state/store.mjs';
import { appendEvent } from '../../../src/state/events.mjs';

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

// tsk-4xg: `doctor --fix` now runs the real `claude-plugin-marketplace` fix
// too, which shells out to a real, mutating external CLI (`claude plugin
// marketplace add`/`install`) when the `claude` binary is present --
// FGOS_CLAUDE_COMMAND (registrations.mjs's own test-only seam, mirroring
// bin/fgos.mjs's FGOS_GH_COMMAND for `gh`) points it at a path that never
// exists, so every `doctor --fix` spawned below sees "claude CLI not
// found" and no-ops that fix, never touching this machine's real Claude
// Code config as a side effect of running the test suite.
const NO_CLAUDE_ENV = { ...process.env, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' };

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function checkById(id) {
  const entry = DOCTOR_CHECKS.find((c) => c.id === id);
  assert.ok(entry, `DOCTOR_CHECKS is missing "${id}"`);
  return entry;
}

function fixById(id) {
  const entry = FIX_REGISTRATIONS.find((f) => f.id === id);
  assert.ok(entry, `FIX_REGISTRATIONS is missing "${id}"`);
  return entry;
}

// ─── enduser-docs-index-stale (tsk-1m0, docs/history/doctor-check-enduser- ──
// docs-index-stale/CONTEXT.md): D1 count-only message, D2 one-directional
// (missing-from-index only), D3 read-only check sharing the same
// generation path as the fix, D5 missing-manifest is normal, D6
// QUADRANT_DIR_ALIASES (docs/decisions -> explanation) honored.

function writeEnduserDoc(tmp, quadrantDir, filename, h1) {
  const dirPath = path.join(tmp, 'docs', quadrantDir);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, filename), `# ${h1}\n\nbody\n`);
}

function writeEnduserManifest(tmp, entries) {
  fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs', 'enduser-docs-index.json'), `${JSON.stringify(entries, null, 2)}\n`);
}

// ─── config-awareness (docs/history/global-project-config-awareness/ ──────
// CONTEXT.md D1): always passes (informational, read-only, same contract as
// tool-registry-configured) -- only the message and `active` distinguish
// which level is in play. Every case overrides HOME (same pattern the
// shell-integration-sourced tests above already use) so this never touches
// the real ~/.fgos/config.json; project config is checked at the temp cwd's
// own .fgos/config.json, matching describeConfigAwareness's real defaults.

function withHome(homeDir, fn) {
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    return fn();
  } finally {
    process.env.HOME = prevHome;
  }
}

// ─── D2/D3: the shell-integration path is canonicalized to the main checkout ─

function initRepo(prefix) {
  const dir = mkTemp(prefix);
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: dir });
  execFileSync('git', ['commit', '-qm', 'seed'], { cwd: dir });
  return dir;
}
export {
  DEFAULT_CLEANUP_LEAF_TTL_DAYS,
  DEFAULT_CLEANUP_TTL_DAYS,
  DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
  DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
  DEFAULT_INVARIANT_CHECK_COMMANDS,
  DEFAULT_LEVEL,
  DEFAULT_RUNNER_CONFIG,
  DOCTOR_CHECKS,
  FGOS,
  FIX_REGISTRATIONS,
  NO_CLAUDE_ENV,
  __dirname,
  addWork,
  appendEvent,
  assert,
  checkById,
  execFileSync,
  fileURLToPath,
  fixById,
  fs,
  initRepo,
  initStore,
  integrationScriptPath,
  mainCheckoutHookWired,
  mkTemp,
  os,
  path,
  resolveMainCheckout,
  spawnSync,
  withHome,
  writeEnduserDoc,
  writeEnduserManifest,
};
