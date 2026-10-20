import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { listLegacyNodeSourceFiles } from '../../scripts/build-rust-distribution.mjs';
import { inspectRepo } from '../../scripts/lib/git-ports.mjs';

test('source payload excludes ignored setup output, includes untracked source and works without Git', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-payload-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.agents/skills/instruction-audit'), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ files: ['.agents'] }));
  fs.writeFileSync(path.join(root, '.gitignore'), '.agents/hooks.json\n.agents/skills/instruction-audit/\n');
  fs.writeFileSync(path.join(root, '.agents/source.mjs'), 'source');
  execFileSync('git', ['init', '-q'], { cwd: root });
  const before = listLegacyNodeSourceFiles(root, () => inspectRepo(root));
  fs.writeFileSync(path.join(root, '.agents/hooks.json'), '{}');
  fs.writeFileSync(path.join(root, '.agents/skills/instruction-audit/SKILL.md'), 'rendered');
  assert.deepEqual(listLegacyNodeSourceFiles(root, () => inspectRepo(root)), before);
  assert.deepEqual(before, ['.agents/source.mjs', 'package.json']);
  fs.rmSync(path.join(root, '.git'), { recursive: true });
  assert.deepEqual(listLegacyNodeSourceFiles(root, () => inspectRepo(root)), [
    '.agents/hooks.json', '.agents/skills/instruction-audit/SKILL.md', '.agents/source.mjs', 'package.json',
  ]);
});
