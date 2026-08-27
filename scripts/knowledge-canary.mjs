// scripts/knowledge-canary.mjs
// Phase 10 canary runner to verify single-doc writer flow end-to-end.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, execFileSync } from 'node:child_process';
import { rebuild } from '../src/state/store.mjs';

export function runKnowledgeCanary(repoRoot) {
  // The canary exercises a DISPOSABLE sandbox repo passed as `repoRoot`
  // (see the test: a throwaway tmpdir with no fgOS install of its own) by
  // driving it with the REAL project's `bin/fgos.mjs` -- the binary and
  // the target repo are deliberately different things here, unlike
  // knowledge-migration.mjs/knowledge-bootstrap.mjs, which always operate
  // on their own containing project. `path.resolve('bin/fgos.mjs')`
  // (the previous shape) got this right only by accident, by depending on
  // the CALLING process's cwd already being this project's root -- true
  // for `node --test`, but not guaranteed for any other caller. Resolving
  // from this script's own location (fileURLToPath(import.meta.url))
  // finds the real binary unconditionally, independent of both the
  // caller's cwd and the sandbox repoRoot.
  const fgosBin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'fgos.mjs');

  // 1. Topic register
  execSync(`node "${fgosBin}" topic register t1 --purpose-slug worktree-reclaim --purpose-title "Worktree Reclaim"`, { cwd: repoRoot });

  // 2. Reserve doc slot
  const docPath = 'docs/worktree-reclaim/guide.md';
  execSync(`node "${fgosBin}" doc reserve t1 guide ${docPath}`, { cwd: repoRoot });

  // 3. Write file and commit
  const fullPath = path.join(repoRoot, docPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `---\nframework: diataxis\nmode: how-to\n---\n# Worktree Reclaim Guide\n`, 'utf8');
  // execFileSync (argv array, no shell) -- docPath is a fixed literal here,
  // but this is the same shell-interpolation shape flagged in
  // knowledge-migration.mjs's own git mv/git add, kept consistent.
  execFileSync('git', ['add', docPath], { cwd: repoRoot, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'docs(canary): write guide'], { cwd: repoRoot, stdio: 'ignore' });

  // 4. Attest
  const attestOut = execSync(`node "${fgosBin}" knowledge attest --doc-path ${docPath} --capture-id canary-capture`, { cwd: repoRoot, encoding: 'utf8' });
  // `attestOut.includes('attested')` used to match the literal field NAME
  // regardless of its value -- a `{"attested":false,"reason":...}` soft-fail
  // response (the docRegistry.enforce-off path) contains that same
  // substring, so the canary -- whose whole purpose is to catch exactly
  // this kind of end-to-end regression -- would have proceeded as if
  // attestation succeeded. Parse the real JSON and check the actual value.
  let attestResult;
  try {
    attestResult = JSON.parse(attestOut).data;
  } catch (err) {
    throw new Error(`Canary failed: knowledge attest output was not valid JSON: ${err.message}`);
  }
  if (!attestResult || attestResult.attested !== true) {
    throw new Error(`Canary failed: knowledge attest did not return attested: true (got: ${attestOut.trim()})`);
  }

  // 5. Mark rendered
  execSync(`node "${fgosBin}" doc mark-rendered --topic-id t1 --role guide`, { cwd: repoRoot });

  // 6. Promote
  execSync(`node "${fgosBin}" doc promote t1 guide`, { cwd: repoRoot });

  // 7. Generate projections
  execSync(`node "${fgosBin}" doc-registry`, { cwd: repoRoot });

  const view = rebuild(path.join(repoRoot, '.fgos'));
  const activeDoc = view.docs['t1:guide'];
  if (!activeDoc || activeDoc.docLifecycle !== 'active') {
    throw new Error('Canary failed: doc t1:guide is not active');
  }

  return { success: true, docId: activeDoc.docId, currentPath: activeDoc.currentPath };
}
