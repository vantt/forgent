#!/usr/bin/env node
// fgos-session-start-hook.mjs — injects the canonical fgOS paths (tsk-63j
// D1's second resolver entry point) as session context at SessionStart.
//
// NEVER THROWS, ALWAYS EXITS 0 (same discipline as worker-log.mjs's F-P1-1
// and the global session-init.cjs hook this mirrors): path injection is
// pure convenience, never load-bearing on whether a session can start. A
// resolution failure (not a git repo, no HEAD yet) degrades to silence
// rather than blocking or noising up every session opened in this repo.

import { resolveMainCheckoutRoot, resolveLogsDir, resolveSkillRoot } from '../src/runner/paths.mjs';
import { fgosDirFromRoot } from '../src/util/fgos-file-registry.mjs';

function main() {
  const repoRoot = resolveMainCheckoutRoot();
  const fgosDir = fgosDirFromRoot(repoRoot);
  const logsDir = resolveLogsDir(fgosDir);
  const skillRoot = resolveSkillRoot();

  const lines = [
    'fgOS canonical paths:',
    `- storage: ${fgosDir}`,
    `- logs: ${logsDir}`,
  ];
  if (skillRoot) lines.push(`- skill root: ${skillRoot}`);

  console.log(lines.join('\n'));
}

try {
  main();
} catch {
  // Silent degrade — see file header. A session must still start even when
  // this repo's cwd is not (yet) a usable git checkout.
}
process.exit(0);
