import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  classifyContractScope,
  scanSurfaceFiles,
  extractPathReferences,
  generateInventory,
  generateMarkdownReport,
} from '../../scripts/generate-shipped-path-inventory.mjs';

const SCRIPT_PATH = fileURLToPath(
  new URL('../../scripts/generate-shipped-path-inventory.mjs', import.meta.url)
);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function mkTmpDir(prefix = 'shipped-inv-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('classifyContractScope: distinguishes consumer, repo-local, and mixed contracts', () => {
  // Mixed contracts (dual role: active platform doctrine + template/convention for consumers)
  assert.equal(classifyContractScope('domains/coding/AGENTS.md').scope, 'mixed-repository-local-and-consumer');
  assert.equal(classifyContractScope('core/instructions/platform-laws.md').scope, 'mixed-repository-local-and-consumer');

  // Consumer contracts (including shipped core skills and coordination protocols)
  assert.equal(classifyContractScope('.fgos/config.json').scope, 'consumer-project-contract');
  assert.equal(classifyContractScope('docs/how-to/run.md').scope, 'consumer-project-contract');
  assert.equal(classifyContractScope('docs/explanation/why.md').scope, 'consumer-project-contract');
  assert.equal(classifyContractScope('domains/triage/README.md').scope, 'consumer-project-contract');
  assert.equal(classifyContractScope('.agents/skills/distill/SKILL.md').scope, 'consumer-project-contract');
  assert.equal(classifyContractScope('core/skills/fgos-panel/SKILL.md').scope, 'consumer-project-contract');
  assert.equal(
    classifyContractScope('core/coordination-protocols/architecture-advisory-panel-v1.yaml').scope,
    'consumer-project-contract'
  );

  // Repo-local contracts
  assert.equal(classifyContractScope('docs/specs/runner.md').scope, 'repository-local-contract');
  assert.equal(
    classifyContractScope('docs/architect/agent-coordination/contracts/session.md').scope,
    'repository-local-contract'
  );
  assert.equal(classifyContractScope('docs/platform-foundations.md').scope, 'repository-local-contract');
  assert.equal(classifyContractScope('docs/architecture-map.md').scope, 'repository-local-contract');
  assert.equal(
    classifyContractScope('docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md').scope,
    'repository-local-contract'
  );
  assert.equal(classifyContractScope('src/runner/loop.mjs').scope, 'repository-local-contract');
});

test('extractPathReferences: extracts core/ conventions and avoids truncated junk', () => {
  const tmp = mkTmpDir();
  try {
    const fileA = path.join(tmp, 'sample.md');
    // Sample with core/ path, wrapped backtick path, and path traversal attempt
    fs.writeFileSync(
      fileA,
      [
        'Use core skill: `core/skills/fgos-group-thinking/SKILL.md` for coordination.',
        'See journal: `docs/journals/260803-1612-',
        '  main-checkout-direct-branch-checkout-tsk-4hk.md` for context.',
        'Invalid escape attempt: `docs/specs/../../escape.md` should be ignored.',
        'Trailing junk: `docs/notes.md-` should strip trailing hyphen.',
      ].join('\n')
    );

    const items = extractPathReferences(tmp, ['sample.md']);
    const paths = items.map((i) => i.path);

    assert.ok(paths.includes('core/skills/fgos-group-thinking/SKILL.md'), 'Must extract core/ skill');
    assert.ok(
      paths.includes('docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md'),
      'Must extract multiline rejoined journal path without truncation'
    );
    assert.ok(paths.includes('docs/notes.md'), 'Must strip trailing hyphen from path');
    assert.ok(!paths.some((p) => p.includes('..')), 'Must not extract paths containing ..');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('deterministic generation: generating inventory twice produces identical results', () => {
  const inv1 = generateInventory(REPO_ROOT);
  const inv2 = generateInventory(REPO_ROOT);

  assert.equal(
    JSON.stringify(inv1, null, 2),
    JSON.stringify(inv2, null, 2),
    'Consecutive inventory generation must be byte-identical'
  );

  // Assert inventory contains core/ references and mixed contracts
  const corePaths = inv1.items.filter((i) => i.path.startsWith('core/'));
  assert.ok(corePaths.length >= 10, 'Inventory must extract core/ conventions');
  assert.ok(inv1.summary.mixedRepositoryLocalAndConsumerCount > 0, 'Must model mixed contracts explicitly');
  assert.equal(inv1.summary.unclassifiedCount, 0, 'Zero unclassified paths should remain');
});

test('CLI: outputs JSON and Markdown files correctly', () => {
  const tmp = mkTmpDir();
  try {
    const jsonOut = path.join(tmp, 'inventory.json');
    const mdOut = path.join(tmp, 'inventory.md');

    const res = spawnSync(
      process.execPath,
      [SCRIPT_PATH, '--json-out', jsonOut, '--md-out', mdOut],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );

    assert.equal(res.status, 0, `CLI failed: ${res.stderr}`);
    assert.ok(fs.existsSync(jsonOut), 'JSON output must exist');
    assert.ok(fs.existsSync(mdOut), 'Markdown output must exist');

    const parsed = JSON.parse(fs.readFileSync(jsonOut, 'utf8'));
    assert.equal(parsed.phase, '01');
    assert.ok(parsed.totalUniquePathsCount > 100);
    assert.ok(parsed.summary.consumerProjectContractsCount > 0);
    assert.ok(parsed.summary.repositoryLocalContractsCount > 0);
    assert.ok(parsed.summary.mixedRepositoryLocalAndConsumerCount > 0);

    const md = fs.readFileSync(mdOut, 'utf8');
    assert.match(md, /# Shipped Path Conventions Inventory/);
    assert.match(md, /Locked Program Decision 11/);
    assert.match(md, /Mixed Repository-Local and Consumer Contracts/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
