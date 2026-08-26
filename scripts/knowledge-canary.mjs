// scripts/knowledge-canary.mjs
// Phase 10 canary runner to verify single-doc writer flow end-to-end.

import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';
import { rebuild } from '../src/state/store.mjs';

export function runKnowledgeCanary(repoRoot) {
  const fgosBin = path.resolve('bin/fgos.mjs');

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
  if (!attestOut.includes('attested')) {
    throw new Error('Canary failed: knowledge attest did not return attested: true');
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
