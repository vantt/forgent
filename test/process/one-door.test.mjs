// The one-door proof for process facts: outside a short, reasoned allowlist, no file under src/ or bin/
// reads /proc or calls process.kill. Whether a pid is alive, which process it is, and signalling it by
// identity belong to the process-facts door (packages/process), reached from Node through one client.
// Modelled on test/git/one-door.test.mjs: a static scan of the product tree, comments skipped so a note
// about /proc does not count, strings kept because a /proc path is one.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Each entry is a file that may keep a site until the work named in its reason lands.
const KILL_ALLOWED = new Map([
  ['src/runner/dispatch/transport.mjs', 'kills the process group of its own spawned child'],
  ['src/runner/dispatch/provider-credential-probe.mjs', 'kills the process group of its own spawned probe child'],
  ['src/holder-lock/index.mjs', 'kills the process group of its own spawned lock-hold child'],
]);
const PROC_ALLOWED = new Map([
  ['src/holder-lock/fences.mjs', 'own parent chain, for self-exclusion only'],
  ['src/setup/run-supervisor-checks.mjs', 'doctor check of the run supervisor'],
  ['src/runner/dispatch/confinement/probes/harness.mjs', 'confinement probe harness'],
  ['src/runner/dispatch/confinement/drivers/bwrap.mjs', 'bwrap confinement driver'],
]);

/** The source with comments blanked, strings and template text kept. */
function withoutComments(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
    } else if (c === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (c === '\'' || c === '"' || c === '`') {
      let j = i + 1;
      while (j < text.length && text[j] !== c) j += text[j] === '\\' ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

function sourceFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, found);
    else if (/\.(mjs|js|cjs)$/.test(entry.name)) found.push(full);
  }
  return found;
}

function sites(pattern, allowed) {
  const hits = [];
  for (const top of ['src', 'bin']) {
    for (const file of sourceFiles(path.join(ROOT, top))) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      if (allowed.has(rel)) continue;
      withoutComments(fs.readFileSync(file, 'utf8')).split('\n').forEach((line, index) => {
        if (pattern.test(line)) hits.push(`${rel}:${index + 1}: ${line.trim()}`);
      });
    }
  }
  return hits;
}

test('no file outside the process-facts door signals a process with process.kill', () => {
  assert.deepEqual(sites(/process\.kill\(/, KILL_ALLOWED), []);
});

test('no file outside the process-facts door reads /proc', () => {
  assert.deepEqual(sites(/\/proc\//, PROC_ALLOWED), []);
});

test('every allowlisted file still holds a site, so a finished migration shrinks the list', () => {
  const held = (rel, pattern) => pattern.test(withoutComments(fs.readFileSync(path.join(ROOT, rel), 'utf8')));
  for (const rel of KILL_ALLOWED.keys()) assert.ok(held(rel, /process\.kill\(/), `${rel} no longer calls process.kill; remove it from the allowlist`);
  for (const rel of PROC_ALLOWED.keys()) assert.ok(held(rel, /\/proc\//), `${rel} no longer reads /proc; remove it from the allowlist`);
});
