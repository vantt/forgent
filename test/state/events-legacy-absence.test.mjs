// test/state/events-legacy-absence.test.mjs — tsk-3tp-2 (D2/D4, docs/
// history/tsk-3tp-worker-write-events-tang-b/CONTEXT.md and plan.md): the
// dedicated seq-contiguity band-aid for `.fgos/events.jsonl` is retired.
// `seq` stopped being cross-writer identity once Tầng A (tsk-3ve) gave
// every writer its own per-writer file under `.fgos/events/` (content-hash
// `h` is the real identity now, `src/state/replay.mjs`'s dedupe-by-hash) --
// a union-merge on a single growing `events.jsonl` (the only failure shape
// this surface ever repaired) can no longer happen the way it used to,
// since baseline-0 is frozen and no longer receives new writer appends.
//
// This file proves the retired surface is genuinely gone -- not just
// unused -- across every file/registration/config site it touched:
// `.gitattributes`'s `merge=union` entry, the standalone check/fix scripts,
// the shipped `src/state/` module they wrapped, the `fgos doctor`
// registration built on top of it, and the `npm run check:events-seq`
// script. A regression here would mean the retirement quietly grew back
// (a re-added import, a re-registered doctor check, a restored script).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const RETIRED_FILES = [
  'src/state/events-jsonl-contiguity.mjs',
  'scripts/events-jsonl-contiguity.mjs',
  'scripts/check-events-seq-contiguity.mjs',
  'test/scripts/events-jsonl-contiguity.test.mjs',
  'test/scripts/check-events-seq-contiguity.test.mjs',
];

for (const relPath of RETIRED_FILES) {
  test(`${relPath} no longer exists`, () => {
    assert.equal(fs.existsSync(path.join(REPO_ROOT, relPath)), false, `${relPath} must be deleted, not merely unreferenced`);
  });
}

test('.gitattributes no longer configures merge=union for .fgos/events.jsonl (file is frozen baseline-0, Tầng A)', () => {
  const raw = fs.readFileSync(path.join(REPO_ROOT, '.gitattributes'), 'utf8');
  assert.doesNotMatch(raw, /\.fgos\/events\.jsonl\s+merge=union/, 'the retired union-merge entry must be gone');
  // Sibling union entries for OTHER shared diagnostic logs are unrelated to
  // this retirement and must survive untouched.
  assert.match(raw, /\.fgos\/approve-post-success-faults\.jsonl merge=union/);
});

test('package.json no longer registers the check:events-seq npm script', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, 'check:events-seq'), false);
});

test('src/setup/registrations.mjs no longer imports from the retired events-jsonl-contiguity module', () => {
  const raw = fs.readFileSync(path.join(REPO_ROOT, 'src/setup/registrations.mjs'), 'utf8');
  assert.doesNotMatch(raw, /events-jsonl-contiguity\.mjs/);
  assert.doesNotMatch(raw, /checkEventsJsonlContiguity|fixEventsJsonlContiguity/);
});

test("fgos doctor's DOCTOR_CHECKS/FIX_REGISTRATIONS no longer register the retired events-jsonl-contiguous id", async () => {
  const { DOCTOR_CHECKS, FIX_REGISTRATIONS } = await import('../../src/setup/registrations.mjs');
  assert.equal(DOCTOR_CHECKS.some((c) => c.id === 'events-jsonl-contiguous'), false);
  assert.equal(FIX_REGISTRATIONS.some((f) => f.id === 'events-jsonl-contiguous'), false);
  // The sibling truncation-detection check (tsk-cgg, a different failure
  // class, out of this retirement's scope) must still be registered.
  assert.equal(DOCTOR_CHECKS.some((c) => c.id === 'events-jsonl-not-truncated'), true);
});

test('no remaining production source (src/, scripts/) imports the retired contiguity modules', () => {
  // Scoped to real import-specifier couplings (a quoted module path after
  // `from`/`import(`), not free-floating prose -- other production files
  // (e.g. src/state/replay.mjs, src/state/events-compaction.mjs) legitimately
  // still cite the retired module BY NAME in a doc-comment as historical
  // design precedent, without importing anything from it; that citation is
  // narrative, not a functional coupling, and is out of this test's scope.
  const PRODUCTION_DIRS = ['src', 'scripts'];
  const BANNED_PATTERNS = [/from\s+['"][^'"]*events-jsonl-contiguity\.mjs['"]/, /from\s+['"][^'"]*check-events-seq-contiguity\.mjs['"]/];

  function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (entry.isFile() && entry.name.endsWith('.mjs')) out.push(full);
    }
  }

  const hits = [];
  for (const dirName of PRODUCTION_DIRS) {
    const files = [];
    walk(path.join(REPO_ROOT, dirName), files);
    for (const file of files) {
      const raw = fs.readFileSync(file, 'utf8');
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(raw)) hits.push(`${path.relative(REPO_ROOT, file)}: ${pattern}`);
      }
    }
  }
  assert.deepEqual(hits, [], 'the retired contiguity surface must have zero remaining production references');
});
