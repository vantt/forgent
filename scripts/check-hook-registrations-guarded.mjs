#!/usr/bin/env node
// Every hook registration that points at a gitignored `.claude/hooks/*.cjs`
// must check the script exists before running it, and so must every registration that runs the
// project's own `.fgos/installation/bin/fgos` shim (a project whose install was removed by hand or
// by `fgctl uninstall` must not fail every Agent call).
//
// The failure this guards against was measured in a live dispatch: a fresh
// worktree gets `.claude/settings.json` (it is tracked) but none of the hook
// scripts (`.gitignore` excludes `/.claude/*`), so every turn of a dispatched
// agent ended with "Stop hook error: Cannot find module ...". Non-blocking for
// a Stop hook, but four of these registrations are PreToolUse, where a crash
// can deny a tool call outright.
//
// The guard is one shell line per registration:
//   P="${CLAUDE_PROJECT_DIR}/.claude/hooks/<name>.cjs"; [ -f "$P" ] || exit 0; exec node "$P"
//
// and for the shim:
//   S="${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"; [ -x "$S" ] || exit 0; "$S" hook <kind>
//
// Exits non-zero, naming the offenders, when any registration reaches a hooks
// script or the shim without it.

import fs from 'node:fs';
import path from 'node:path';

const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
if (!fs.existsSync(settingsPath)) {
  console.log('no .claude/settings.json here; nothing to check');
  process.exit(0);
}

const raw = fs.readFileSync(settingsPath, 'utf8');
let settings;
try {
  settings = JSON.parse(raw);
} catch (err) {
  console.error(`.claude/settings.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

const offenders = [];
let checked = 0;

// A registration is checked when its command contains `needle`; it passes when `guarded` accepts it.
const KINDS = [
  {
    needle: '.claude/hooks/',
    guarded: (value) => /\|\|\s*exit 0/.test(value) && /\[\s*-f\s*"\$P"\s*\]/.test(value),
  },
  {
    needle: '.fgos/installation/bin/fgos',
    guarded: (value) => /\[\s*-x\s*"\$S"\s*\]\s*\|\|\s*(exit 0|\{)/.test(value),
  },
];

const walk = (node) => {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'command' && typeof value === 'string') {
      const kind = KINDS.find((k) => value.includes(k.needle));
      if (!kind) continue;
      checked += 1;
      if (!kind.guarded(value)) offenders.push(value.slice(0, 120));
    } else {
      walk(value);
    }
  }
};
walk(settings);

if (offenders.length > 0) {
  console.error(`${offenders.length} of ${checked} hook registrations reach .claude/hooks/ or the project shim without checking it exists:`);
  for (const o of offenders) console.error(`  ${o}`);
  console.error('A dispatched agent in a fresh worktree gets settings.json but not the scripts, so each of these fails every turn.');
  process.exit(1);
}

console.log(`all ${checked} hook registrations pointing at .claude/hooks/ or the project shim are guarded`);
