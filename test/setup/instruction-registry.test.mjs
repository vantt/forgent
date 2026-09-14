// instruction-registry.test.mjs — tests for instruction source registry and discovery (P3)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  discoverInstructionSources,
  extractInstructionFrontmatter,
  compileInstructionUnit,
  discoverKnownOwners,
  InstructionRegistry,
  InstructionRegistryError,
  INSTRUCTION_KINDS,
  INSTRUCTION_MODES,
  INSTRUCTION_SCOPES,
  DEFAULT_SCOPE_SPECIFICITY,
} from '../../src/setup/instruction-registry.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeInstructionFile(dir, fileName, frontmatterStr, bodyStr = '# Header\nSome instruction text') {
  fs.mkdirSync(dir, { recursive: true });
  const content = `---\n${frontmatterStr}\n---\n\n${bodyStr}\n`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// ---------------------------------------------------------------------------
// 1. Frontmatter extraction & parsing tests
// ---------------------------------------------------------------------------

test('extractInstructionFrontmatter extracts valid YAML frontmatter and body', () => {
  const raw = '---\nid: rule-1\nkind: law\n---\n\n# Body\nInstruction content';
  const { meta, body } = extractInstructionFrontmatter(raw, 'test.md');
  assert.equal(meta.id, 'rule-1');
  assert.equal(meta.kind, 'law');
  assert.equal(body.trim(), '# Body\nInstruction content');
});

test('extractInstructionFrontmatter throws INVALID_METADATA when frontmatter block is missing', () => {
  assert.throws(
    () => extractInstructionFrontmatter('# No frontmatter here', 'test.md'),
    (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA',
  );
});

test('extractInstructionFrontmatter throws INVALID_METADATA on malformed YAML', () => {
  const raw = '---\nid: rule-1\n  invalid: yaml: : [bad\n---\n\nBody';
  assert.throws(
    () => extractInstructionFrontmatter(raw, 'test.md'),
    (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA',
  );
});

test('extractInstructionFrontmatter throws INVALID_METADATA when frontmatter is not an object', () => {
  const raw = '---\n- item1\n- item2\n---\n\nBody';
  assert.throws(
    () => extractInstructionFrontmatter(raw, 'test.md'),
    (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA',
  );
});

// ---------------------------------------------------------------------------
// 2. Discovery tests across core, components, and domains
// ---------------------------------------------------------------------------

test('discoverInstructionSources discovers instruction fragments from core, components, and domains', () => {
  const tmp = mkTempDir('fgos-inst-discovery-');
  try {
    // 1. Core
    writeInstructionFile(
      path.join(tmp, 'core', 'instructions'),
      'l1-core.md',
      'id: core-l1\nkind: law\ntitle: Core L1 Law\ndescription: Platform foundation law',
      'Never break platform law.',
    );

    // 2. Component
    writeInstructionFile(
      path.join(tmp, 'components', 'packaging', 'instructions'),
      'verify.md',
      'id: pkg-verify\nkind: procedure\nmode: refine\nappliesTo: [claude, codex]\nspecificity: 25',
      'Verification procedure for packaging.',
    );

    // 3. Domain
    writeInstructionFile(
      path.join(tmp, 'domains', 'coding', 'instructions'),
      'safety.md',
      'id: coding-safety\nkind: boundary\nmode: append\nappliesTo: "*"',
      'Worktree safety boundaries.',
    );

    const registry = discoverInstructionSources(tmp);

    assert.equal(registry.length, 3);
    assert.ok(registry instanceof InstructionRegistry);
    assert.ok(Array.isArray(registry));

    // Core rule assertions
    const coreRule = registry.get('core-l1');
    assert.ok(coreRule);
    assert.equal(coreRule.id, 'core-l1');
    assert.equal(coreRule.kind, 'law');
    assert.equal(coreRule.owner, 'core');
    assert.equal(coreRule.authority.type, 'platform');
    assert.equal(coreRule.authority.name, 'core');
    assert.equal(coreRule.authority.toString(), 'platform:core');
    assert.equal(coreRule.scope, 'repo');
    assert.equal(coreRule.specificity, DEFAULT_SCOPE_SPECIFICITY.repo);
    assert.deepEqual(coreRule.appliesTo, ['*']);
    assert.equal(coreRule.title, 'Core L1 Law');
    assert.equal(coreRule.description, 'Platform foundation law');
    assert.equal(coreRule.body, 'Never break platform law.');
    assert.equal(coreRule.sourcePath, 'core/instructions/l1-core.md');

    // Component rule assertions
    const compRule = registry.get('pkg-verify');
    assert.ok(compRule);
    assert.equal(compRule.id, 'pkg-verify');
    assert.equal(compRule.kind, 'procedure');
    assert.equal(compRule.owner, 'packaging');
    assert.equal(compRule.authority.type, 'component');
    assert.equal(compRule.authority.name, 'packaging');
    assert.equal(compRule.authority.toString(), 'component:packaging');
    assert.equal(compRule.scope, 'component');
    assert.equal(compRule.mode, 'refine');
    assert.equal(compRule.specificity, 25);
    assert.deepEqual(compRule.appliesTo, ['claude', 'codex']);
    assert.equal(compRule.sourcePath, 'components/packaging/instructions/verify.md');

    // Domain rule assertions
    const domRule = registry.get('coding-safety');
    assert.ok(domRule);
    assert.equal(domRule.id, 'coding-safety');
    assert.equal(domRule.kind, 'boundary');
    assert.equal(domRule.owner, 'coding');
    assert.equal(domRule.authority.type, 'domain');
    assert.equal(domRule.authority.name, 'coding');
    assert.equal(domRule.authority.toString(), 'domain:coding');
    assert.equal(domRule.scope, 'domain');
    assert.equal(domRule.specificity, DEFAULT_SCOPE_SPECIFICITY.domain);
    assert.equal(domRule.sourcePath, 'domains/coding/instructions/safety.md');

    // Registry query helper tests
    assert.equal(registry.findByKind('law').length, 1);
    assert.equal(registry.findByKind('boundary').length, 1);
    assert.equal(registry.findByKind('procedure').length, 1);
    assert.equal(registry.findByOwner('packaging').length, 1);
    assert.equal(registry.findByAuthority('platform').length, 1);
    assert.equal(registry.findByScope('domain').length, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources handles missing or empty directories gracefully', () => {
  const tmp = mkTempDir('fgos-inst-empty-');
  try {
    const registry = discoverInstructionSources(tmp);
    assert.equal(registry.length, 0);
    assert.deepEqual(registry.list(), []);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('classifies all 5 canonical instruction kinds correctly', () => {
  const tmp = mkTempDir('fgos-inst-kinds-');
  try {
    for (const kind of INSTRUCTION_KINDS) {
      writeInstructionFile(
        path.join(tmp, 'core', 'instructions'),
        `${kind}.md`,
        `id: rule-${kind}\nkind: ${kind}`,
        `Content for ${kind}`,
      );
    }
    const registry = discoverInstructionSources(tmp);
    assert.equal(registry.length, 5);
    for (const kind of INSTRUCTION_KINDS) {
      const unit = registry.get(`rule-${kind}`);
      assert.ok(unit);
      assert.equal(unit.kind, kind);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 3. Invalid metadata tests
// ---------------------------------------------------------------------------

test('discoverInstructionSources throws INVALID_METADATA when id is missing', () => {
  const tmp = mkTempDir('fgos-inst-noid-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'bad.md', 'kind: law');
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA' && err.message.includes('missing or invalid "id"'),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws INVALID_METADATA when id contains invalid characters', () => {
  const tmp = mkTempDir('fgos-inst-badid-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'bad.md', 'id: "bad rule with spaces"\nkind: law');
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA' && err.message.includes('invalid characters'),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws INVALID_METADATA when kind is invalid', () => {
  const tmp = mkTempDir('fgos-inst-badkind-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'bad.md', 'id: test-rule\nkind: suggestion');
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA' && err.message.includes('Invalid instruction "kind"'),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws INVALID_METADATA when mode is invalid', () => {
  const tmp = mkTempDir('fgos-inst-badmode-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'bad.md', 'id: test-rule\nkind: law\nmode: unknown-mode');
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA' && err.message.includes('Invalid instruction "mode"'),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws INVALID_METADATA when scope is invalid', () => {
  const tmp = mkTempDir('fgos-inst-badscope-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'bad.md', 'id: test-rule\nkind: law\nscope: galactic');
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA' && err.message.includes('Invalid instruction "scope"'),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws INVALID_METADATA when specificity is not a number', () => {
  const tmp = mkTempDir('fgos-inst-badspec-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'bad.md', 'id: test-rule\nkind: law\nspecificity: "high"');
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA' && err.message.includes('Invalid "specificity"'),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws INVALID_METADATA when appliesTo is invalid', () => {
  const tmp = mkTempDir('fgos-inst-badapp-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'bad.md', 'id: test-rule\nkind: law\nappliesTo: 12345');
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => err instanceof InstructionRegistryError && err.code === 'INVALID_METADATA' && err.message.includes('Invalid "appliesTo"'),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 4. Duplicate IDs tests
// ---------------------------------------------------------------------------

test('discoverInstructionSources throws DUPLICATE_ID when two files share the same id in the same root', () => {
  const tmp = mkTempDir('fgos-inst-dup-same-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule-a.md', 'id: duplicate-id\nkind: law');
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule-b.md', 'id: duplicate-id\nkind: procedure');

    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'DUPLICATE_ID' &&
          err.message.includes('Duplicate instruction id "duplicate-id"') &&
          err.message.includes('core/instructions/rule-a.md') &&
          err.message.includes('core/instructions/rule-b.md')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws DUPLICATE_ID when two files share the same id across different roots', () => {
  const tmp = mkTempDir('fgos-inst-dup-cross-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule-core.md', 'id: shared-rule-id\nkind: law');
    writeInstructionFile(path.join(tmp, 'components', 'auth', 'instructions'), 'rule-comp.md', 'id: shared-rule-id\nkind: procedure');

    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'DUPLICATE_ID' &&
          err.message.includes('Duplicate instruction id "shared-rule-id"') &&
          err.message.includes('core/instructions/rule-core.md') &&
          err.message.includes('components/auth/instructions/rule-comp.md')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 5. Unknown owners & authority mismatch tests
// ---------------------------------------------------------------------------

test('discoverInstructionSources throws UNKNOWN_OWNER when declared owner is not in knownOwners', () => {
  const tmp = mkTempDir('fgos-inst-unknown-owner-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule.md', 'id: rule-1\nkind: law\nowner: external-vendor');

    assert.throws(
      () => discoverInstructionSources(tmp, { knownOwners: ['core', 'platform', 'coding'] }),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'UNKNOWN_OWNER' &&
          err.message.includes('Unknown owner "external-vendor"')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws UNKNOWN_OWNER when component folder is not in knownOwners', () => {
  const tmp = mkTempDir('fgos-inst-unknown-comp-');
  try {
    writeInstructionFile(path.join(tmp, 'components', 'unregistered-module', 'instructions'), 'rule.md', 'id: rule-1\nkind: procedure');

    assert.throws(
      () => discoverInstructionSources(tmp, { knownOwners: ['core', 'platform', 'packaging'] }),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'UNKNOWN_OWNER' &&
          err.message.includes('Unknown component owner "unregistered-module"')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws AUTHORITY_MISMATCH when declared owner does not match root authority owner', () => {
  const tmp = mkTempDir('fgos-inst-owner-mismatch-');
  try {
    // A domain file attempting to declare platform/core owner
    writeInstructionFile(path.join(tmp, 'domains', 'coding', 'instructions'), 'rule.md', 'id: rule-1\nkind: boundary\nowner: core');

    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'AUTHORITY_MISMATCH' &&
          err.message.includes('mismatches authority root owner "coding"')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 6. Real project root discovery test
// ---------------------------------------------------------------------------

test('discoverInstructionSources discovers real canonical instructions in repository', () => {
  const registry = discoverInstructionSources(projectRoot);

  assert.ok(registry.length >= 3, `Expected at least 3 canonical instructions, got ${registry.length}`);

  // Check the platform operating law
  const platformLaws = registry.get('platform-operating-laws');
  assert.ok(platformLaws, 'Expected platform-operating-laws to be discovered');
  assert.equal(platformLaws.kind, 'law');
  assert.equal(platformLaws.owner, 'core');
  assert.equal(platformLaws.authority.type, 'platform');
  assert.equal(platformLaws.scope, 'repo');

  // Check packaging verification
  const pkgVerification = registry.get('docs-only-verification');
  assert.ok(pkgVerification, 'Expected docs-only-verification to be discovered');
  assert.equal(pkgVerification.kind, 'procedure');
  assert.equal(pkgVerification.owner, 'packaging-distribution');
  assert.equal(pkgVerification.authority.type, 'component');
  assert.equal(pkgVerification.scope, 'component');

  // Check coding worktree safety
  const codingSafety = registry.get('coding-worktree-safety');
  assert.ok(codingSafety, 'Expected coding-worktree-safety to be discovered');
  assert.equal(codingSafety.kind, 'boundary');
  assert.equal(codingSafety.owner, 'coding');
  assert.equal(codingSafety.authority.type, 'domain');
  assert.equal(codingSafety.scope, 'domain');
});
