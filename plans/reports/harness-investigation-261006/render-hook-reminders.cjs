#!/usr/bin/env node
// Render the UserPromptSubmit "dev-rules-reminder" text produced by BOTH hook
// trees (global ~/.claude/hooks and project .claude/hooks) without running the
// hook entrypoints, so no injection-dedup state is written.
// Usage: node render-hook-reminders.cjs <repoRoot> <outDir>
const path = require('path');
const fs = require('fs');
const os = require('os');

const repo = path.resolve(process.argv[2] || process.cwd());
const out = path.resolve(process.argv[3] || '.');
process.chdir(repo);

const trees = {
  global: path.join(os.homedir(), '.claude/hooks/lib/context-builder.cjs'),
  project: path.join(repo, '.claude/hooks/lib/context-builder.cjs'),
};

for (const [name, lib] of Object.entries(trees)) {
  try {
    const cb = require(lib);
    const args = name === 'global'
      ? { sessionId: null, baseDir: repo }
      : { sessionContext: null, baseDir: repo };
    const { content } = cb.buildReminderContext(args);
    fs.writeFileSync(path.join(out, `hook-reminder-${name}.txt`), content);
    console.log(`${name}: ${Buffer.byteLength(content)} bytes, ${content.split('\n').length} lines, ~${Math.round(Buffer.byteLength(content) / 4)} tok`);
  } catch (e) {
    console.log(`${name}: ERROR ${e.message}`);
  }
}
