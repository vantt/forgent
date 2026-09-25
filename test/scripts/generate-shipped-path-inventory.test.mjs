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
  normalizeContent,
  GLUED_TOKEN_REGEX,
  PATH_REGEX,
  canonicalizeRepoPath,
  isValidPathGrammar,
  KNOWN_EXTENSIONS,
  ALLOWED_ROOTS,
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

test('extractPathReferences: handles fenced prose and multiline commands without gluing fake tokens (R1)', () => {
  const tmp = mkTmpDir();
  try {
    const fileA = path.join(tmp, 'fenced-and-commands.md');
    fs.writeFileSync(
      fileA,
      [
        '# Fenced prose fixture',
        '```text',
        '- unit: apply the fix to src/foo.mjs',
        '  capability: code:implement',
        '- unit: independent review of the fix',
        '  capability: code:review',
        '```',
        '',
        '# Inline command wrapped across lines without backslash',
        'Run via `node src/runner/dispatch.mjs',
        '  execute <executorId> --prompt "..."`',
        '',
        '# Command wrapped with backslash',
        'Or run `node src/runner/dispatch.mjs \\',
        '  execute <executorId>`',
        '',
        '# Fenced bash block with backslash',
        '```bash',
        'node src/runner/dispatch.mjs \\',
        '  execute <executorId>',
        '```',
        '',
        '# Path wrapped with slash',
        'See `docs/history/merge-standardization/',
        'CONTEXT.md` for context.',
        '',
        '# Malicious/glued token should be rejected',
        'Invalid glued token: `src/foo.mjscapability` must be rejected.',
        'Another glued token: `src/runner/dispatch.mjsexecute` must be rejected.',
      ].join('\n')
    );

    const items = extractPathReferences(tmp, ['fenced-and-commands.md']);
    const paths = items.map((i) => i.path);

    // Assert clean paths are extracted
    assert.ok(paths.includes('src/foo.mjs'), 'Must extract clean src/foo.mjs from fenced block');
    assert.ok(paths.includes('src/runner/dispatch.mjs'), 'Must extract clean src/runner/dispatch.mjs');
    assert.ok(
      paths.includes('docs/history/merge-standardization/CONTEXT.md'),
      'Must extract slash-wrapped docs/history/merge-standardization/CONTEXT.md'
    );

    // Negative assertions: glued tokens must NEVER be extracted
    assert.ok(!paths.includes('src/foo.mjscapability'), 'Must NOT extract src/foo.mjscapability');
    assert.ok(!paths.includes('src/runner/dispatch.mjsexecute'), 'Must NOT extract src/runner/dispatch.mjsexecute');
    assert.ok(
      !paths.some((p) => GLUED_TOKEN_REGEX.test(p)),
      'Extracted paths must not contain glued characters after known extensions'
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('table-driven path grammar, negative glued tokens, and positive counterexamples (R1 residual)', () => {
  const tmp = mkTmpDir('shipped-table-test-');
  try {
    const negativeCases = [
      // Op_009 red-team letter glue after extensions
      { input: 'Invalid: `src/foo.mjscapability`', fakeToken: 'src/foo.mjscapability', reason: 'letter glue after .mjs' },
      { input: 'Invalid: `src/runner/dispatch.mjsexecute`', fakeToken: 'src/runner/dispatch.mjsexecute', reason: 'letter glue after .mjs' },
      { input: 'Invalid: `src/foo.cjsability`', fakeToken: 'src/foo.cjsability', reason: 'letter glue after .cjs' },
      { input: 'Invalid: `src/foo.tsbar`', fakeToken: 'src/foo.tsbar', reason: 'letter glue after .ts' },
      { input: 'Invalid: `src/foo.jsbar`', fakeToken: 'src/foo.jsbar', reason: 'letter glue after .js' },
      { input: 'Invalid: `src/foo.jsonx`', fakeToken: 'src/foo.jsonx', reason: 'letter glue after .json' },

      // Op_009 red-team digit glue after extensions
      { input: 'Invalid: `src/foo.mjs2`', fakeToken: 'src/foo.mjs2', reason: 'digit glue after .mjs' },
      { input: 'Invalid: `src/foo.json5`', fakeToken: 'src/foo.json5', reason: 'digit glue after .json' },

      // Op_009 red-team underscore glue after extensions
      { input: 'Invalid: `src/foo.mjs_execute`', fakeToken: 'src/foo.mjs_execute', reason: 'underscore glue after .mjs' },

      // Op_009 red-team hyphen glue after extensions
      { input: 'Invalid: `src/foo.mjs-execute`', fakeToken: 'src/foo.mjs-execute', reason: 'hyphen glue after .mjs' },
      { input: 'Invalid: `src/foo.mjs-capability`', fakeToken: 'src/foo.mjs-capability', reason: 'hyphen glue after .mjs' },

      // Op_009 red-team backup suffixes after extensions
      { input: 'Invalid: `src/foo.mjs.bak`', fakeToken: 'src/foo.mjs.bak', reason: 'backup suffix .bak after .mjs' },
      { input: 'Invalid: `src/foo.mjs.old`', fakeToken: 'src/foo.mjs.old', reason: 'backup suffix .old after .mjs' },
      { input: 'Invalid: `src/foo.mjs.tmp`', fakeToken: 'src/foo.mjs.tmp', reason: 'backup suffix .tmp after .mjs' },
      { input: 'Invalid: `src/foo.mjs.orig`', fakeToken: 'src/foo.mjs.orig', reason: 'backup suffix .orig after .mjs' },
      { input: 'Invalid: `src/foo.mjs~`', fakeToken: 'src/foo.mjs~', reason: 'backup suffix ~ after .mjs' },

      // Op_009 red-team slash glue after extensions
      { input: 'Invalid: `src/foo.mjs/execute`', fakeToken: 'src/foo.mjs/execute', reason: 'slash/subpath after .mjs' },

      // Traversal and unknown extension attempts
      { input: 'Invalid: `docs/specs/../../escape.md`', fakeToken: 'escape.md', reason: 'directory traversal' },
      { input: 'Invalid: `src/foo.bak`', fakeToken: 'src/foo.bak', reason: 'unknown extension/backup suffix' },
      { input: 'Invalid: `src/foo.tmp`', fakeToken: 'src/foo.tmp', reason: 'unknown extension/temp suffix' },
    ];

    for (const { input, fakeToken, reason } of negativeCases) {
      const fileName = `neg-${Math.random().toString(36).slice(2)}.md`;
      fs.writeFileSync(path.join(tmp, fileName), input);
      const extracted = extractPathReferences(tmp, [fileName]).map((i) => i.path);
      assert.ok(
        !extracted.includes(fakeToken),
        `Must NOT extract fake glued token "${fakeToken}" (${reason})`
      );
    }

    // Direct grammar checks on individual fake tokens
    for (const { fakeToken, reason } of negativeCases) {
      assert.equal(
        isValidPathGrammar(canonicalizeRepoPath(fakeToken)),
        false,
        `isValidPathGrammar must reject "${fakeToken}" (${reason})`
      );
    }

    // Line wrap after extension tests (prose and inline code)
    const wrapTests = [
      {
        content: 'Check `src/foo.mjs-\n  capability` for details.',
        fakeToken: 'src/foo.mjs-capability',
        expectedClean: 'src/foo.mjs',
        desc: 'inline code hyphen wrap after .mjs',
      },
      {
        content: 'Check src/foo.mjs-\ncapability for details.',
        fakeToken: 'src/foo.mjs-capability',
        expectedClean: 'src/foo.mjs',
        desc: 'prose hyphen wrap after .mjs',
      },
      {
        content: 'Run `src/foo.mjs/\n  execute` command.',
        fakeToken: 'src/foo.mjs/execute',
        expectedClean: 'src/foo.mjs',
        desc: 'inline code slash wrap after .mjs',
      },
      {
        content: 'Run src/runner/dispatch.mjs/\nexecute command.',
        fakeToken: 'src/runner/dispatch.mjs/execute',
        expectedClean: 'src/runner/dispatch.mjs',
        desc: 'prose slash wrap after .mjs',
      },
    ];

    for (const { content, fakeToken, expectedClean, desc } of wrapTests) {
      const fileName = `wrap-${Math.random().toString(36).slice(2)}.md`;
      fs.writeFileSync(path.join(tmp, fileName), content);
      const extracted = extractPathReferences(tmp, [fileName]).map((i) => i.path);
      assert.ok(!extracted.includes(fakeToken), `Must NOT extract fake token "${fakeToken}" from ${desc}`);
      assert.ok(extracted.includes(expectedClean), `Must extract clean path "${expectedClean}" from ${desc}`);
    }

    // Positive counterexamples
    const positiveCases = [
      { input: 'Inline `src/foo.mjs`', expected: 'src/foo.mjs', reason: 'clean JS/ESM module' },
      { input: 'Inline `src/runner/dispatch.mjs`', expected: 'src/runner/dispatch.mjs', reason: 'nested module' },
      { input: 'Redundant ./ `src/./foo.mjs`', expected: 'src/foo.mjs', reason: 'canonicalized ./ segment' },
      { input: 'Repeated slashes `src//foo.mjs`', expected: 'src/foo.mjs', reason: 'canonicalized repeated slashes' },
      { input: 'Nested ./ `src/runner/./dispatch.mjs`', expected: 'src/runner/dispatch.mjs', reason: 'canonicalized intermediate ./' },
      { input: 'Extensionless executable: `.fgos/installation/bin/fgos`', expected: '.fgos/installation/bin/fgos', reason: 'extensionless executable' },
      { input: 'Directory path: `docs/specs`', expected: 'docs/specs', reason: 'valid directory convention' },
      { input: 'Multi-dot basename: `scripts/check-decision-citation-drift.baseline.json`', expected: 'scripts/check-decision-citation-drift.baseline.json', reason: 'valid multi-dot stem with recognized extension' },
      { input: 'Core skill: `core/skills/fgos-group-thinking/SKILL.md`', expected: 'core/skills/fgos-group-thinking/SKILL.md', reason: 'core skill convention' },
      { input: 'Wrapped journal: `docs/journals/260803-1612-\n  main-checkout-direct-branch-checkout-tsk-4hk.md`', expected: 'docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md', reason: 'valid wrapped hyphen in filename stem' },
      { input: 'Wrapped directory: `docs/history/merge-standardization/\nCONTEXT.md`', expected: 'docs/history/merge-standardization/CONTEXT.md', reason: 'valid wrapped directory slash' },
    ];

    for (const { input, expected, reason } of positiveCases) {
      const fileName = `pos-${Math.random().toString(36).slice(2)}.md`;
      fs.writeFileSync(path.join(tmp, fileName), input);
      const extracted = extractPathReferences(tmp, [fileName]).map((i) => i.path);
      assert.ok(
        extracted.includes(expected),
        `Must extract positive counterexample "${expected}" (${reason}); got [${extracted.join(', ')}]`
      );
    }
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

  // Negative tests against repository inventory: exact and generalized glued token checks (R1)
  const paths = inv1.items.map((i) => i.path);
  assert.ok(!paths.includes('src/foo.mjscapability'), 'Repository inventory must NOT contain src/foo.mjscapability');
  assert.ok(
    !paths.includes('src/runner/dispatch.mjsexecute'),
    'Repository inventory must NOT contain src/runner/dispatch.mjsexecute'
  );
  assert.ok(paths.includes('src/foo.mjs'), 'Repository inventory MUST contain clean src/foo.mjs');
  assert.ok(paths.includes('src/runner/dispatch.mjs'), 'Repository inventory MUST contain clean src/runner/dispatch.mjs');

  const gluedPaths = inv1.items.filter((i) => GLUED_TOKEN_REGEX.test(i.path));
  assert.deepEqual(gluedPaths, [], 'Repository inventory must have 0 glued-token paths matching GLUED_TOKEN_REGEX');

  const mjsGlued = inv1.items.filter((i) => /\.mjs[a-zA-Z]/.test(i.path));
  assert.deepEqual(mjsGlued, [], 'Repository inventory must have 0 paths matching /mjs[a-z]/');
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
