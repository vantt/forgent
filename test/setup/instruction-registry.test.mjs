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

    // Authorize packaging and coding via authoritative architecture-manifest.json
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'docs', 'architecture-manifest.json'),
      JSON.stringify({
        components: ['packaging'],
        domains: ['coding'],
      }),
      'utf8',
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
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'docs', 'architecture-manifest.json'),
      JSON.stringify({ components: ['auth'] }),
      'utf8',
    );
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
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'docs', 'architecture-manifest.json'),
      JSON.stringify({ domains: ['coding'] }),
      'utf8',
    );
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
// 6. Default-options rejection tests (Requirement 3)
// ---------------------------------------------------------------------------

test('discoverInstructionSources throws UNKNOWN_OWNER under default options when component is not in manifest', () => {
  const tmp = mkTempDir('fgos-inst-unreg-comp-');
  try {
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'docs', 'architecture-manifest.json'),
      JSON.stringify({ components: ['packaging-distribution'] }),
      'utf8',
    );
    writeInstructionFile(
      path.join(tmp, 'components', 'unregistered-comp', 'instructions'),
      'rule.md',
      'id: unreg-comp-rule\nkind: procedure',
    );

    // Call discoverInstructionSources with default options (no knownOwners passed)
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'UNKNOWN_OWNER' &&
          err.message.includes('Unknown component owner "unregistered-comp"')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws UNKNOWN_OWNER under default options when domain is not in manifest', () => {
  const tmp = mkTempDir('fgos-inst-unreg-dom-');
  try {
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'docs', 'architecture-manifest.json'),
      JSON.stringify({ domains: ['coding'] }),
      'utf8',
    );
    writeInstructionFile(
      path.join(tmp, 'domains', 'rogue-domain', 'instructions'),
      'rule.md',
      'id: rogue-domain-rule\nkind: boundary',
    );

    // Call discoverInstructionSources with default options (no knownOwners passed)
    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'UNKNOWN_OWNER' &&
          err.message.includes('Unknown domain owner "rogue-domain"')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources throws UNKNOWN_OWNER under default options when no manifest exists and component is present', () => {
  const tmp = mkTempDir('fgos-inst-nomanifest-comp-');
  try {
    // No docs/architecture-manifest.json in tmp
    writeInstructionFile(
      path.join(tmp, 'components', 'some-component', 'instructions'),
      'rule.md',
      'id: some-rule\nkind: procedure',
    );

    assert.throws(
      () => discoverInstructionSources(tmp),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'UNKNOWN_OWNER' &&
          err.message.includes('Unknown component owner "some-component"')
        );
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 7. InstructionRegistry Array subclass regression tests (Requirement 2)
// ---------------------------------------------------------------------------

test('InstructionRegistry: map returns standard Array and does not throw', () => {
  const tmp = mkTempDir('fgos-inst-reg-map-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule1.md', 'id: rule-1\nkind: law');
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule2.md', 'id: rule-2\nkind: procedure');

    const registry = discoverInstructionSources(tmp);
    assert.equal(registry.length, 2);

    // map should return standard Array, not throw TypeError: Cannot read properties of undefined
    const mappedIds = registry.map((unit) => unit.id);
    assert.ok(Array.isArray(mappedIds));
    assert.ok(!(mappedIds instanceof InstructionRegistry));
    assert.deepEqual(mappedIds.sort(), ['rule-1', 'rule-2']);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('InstructionRegistry: filter returns InstructionRegistry and preserves lookup semantics', () => {
  const tmp = mkTempDir('fgos-inst-reg-filter-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule1.md', 'id: rule-1\nkind: law');
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule2.md', 'id: rule-2\nkind: procedure');

    const registry = discoverInstructionSources(tmp);
    const filtered = registry.filter((unit) => unit.kind === 'law');

    assert.ok(filtered instanceof InstructionRegistry);
    assert.equal(filtered.length, 1);
    assert.ok(filtered.has('rule-1'));
    assert.equal(filtered.get('rule-1')?.id, 'rule-1');
    assert.equal(filtered.has('rule-2'), false);
    assert.equal(filtered.get('rule-2'), undefined);
    assert.equal(filtered.byId.size, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('InstructionRegistry: slice returns InstructionRegistry and preserves lookup semantics', () => {
  const tmp = mkTempDir('fgos-inst-reg-slice-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule1.md', 'id: rule-1\nkind: law');
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule2.md', 'id: rule-2\nkind: procedure');

    const registry = discoverInstructionSources(tmp);
    const sliced = registry.slice(0, 1);

    assert.ok(sliced instanceof InstructionRegistry);
    assert.equal(sliced.length, 1);
    const firstId = registry[0].id;
    assert.ok(sliced.has(firstId));
    assert.equal(sliced.get(firstId)?.id, firstId);
    assert.equal(sliced.byId.size, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('InstructionRegistry: concat returns InstructionRegistry and preserves lookup semantics', () => {
  const tmp = mkTempDir('fgos-inst-reg-concat-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule1.md', 'id: rule-1\nkind: law');
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule2.md', 'id: rule-2\nkind: procedure');

    const registry = discoverInstructionSources(tmp);
    const unit1 = registry.get('rule-1');
    const unit2 = registry.get('rule-2');

    const reg1 = new InstructionRegistry(unit1);
    const reg2 = reg1.concat(unit2);

    assert.ok(reg2 instanceof InstructionRegistry);
    assert.equal(reg2.length, 2);
    assert.ok(reg2.has('rule-1'));
    assert.ok(reg2.has('rule-2'));
    assert.equal(reg2.get('rule-1').id, 'rule-1');
    assert.equal(reg2.get('rule-2').id, 'rule-2');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('InstructionRegistry: query methods return InstructionRegistry and preserve lookup semantics', () => {
  const tmp = mkTempDir('fgos-inst-reg-queries-');
  try {
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'docs', 'architecture-manifest.json'),
      JSON.stringify({ components: ['comp1'], domains: ['dom1'] }),
      'utf8',
    );
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'r1.md', 'id: r1\nkind: law\nscope: repo');
    writeInstructionFile(path.join(tmp, 'components', 'comp1', 'instructions'), 'r2.md', 'id: r2\nkind: procedure\nscope: component');
    writeInstructionFile(path.join(tmp, 'domains', 'dom1', 'instructions'), 'r3.md', 'id: r3\nkind: boundary\nscope: domain');

    const registry = discoverInstructionSources(tmp);

    const byOwner = registry.findByOwner('comp1');
    assert.ok(byOwner instanceof InstructionRegistry);
    assert.equal(byOwner.length, 1);
    assert.ok(byOwner.has('r2'));
    assert.equal(byOwner.get('r2')?.id, 'r2');

    const byKind = registry.findByKind('boundary');
    assert.ok(byKind instanceof InstructionRegistry);
    assert.equal(byKind.length, 1);
    assert.ok(byKind.has('r3'));
    assert.equal(byKind.get('r3')?.id, 'r3');

    const byAuth = registry.findByAuthority('platform');
    assert.ok(byAuth instanceof InstructionRegistry);
    assert.equal(byAuth.length, 1);
    assert.ok(byAuth.has('r1'));
    assert.equal(byAuth.get('r1')?.id, 'r1');

    const byScope = registry.findByScope('domain');
    assert.ok(byScope instanceof InstructionRegistry);
    assert.equal(byScope.length, 1);
    assert.ok(byScope.has('r3'));
    assert.equal(byScope.get('r3')?.id, 'r3');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('InstructionRegistry: post-construction mutation throws on frozen instance', () => {
  const tmp = mkTempDir('fgos-inst-reg-freeze-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule.md', 'id: rule-1\nkind: law');
    const registry = discoverInstructionSources(tmp);

    assert.ok(Object.isFrozen(registry));

    // Mutation methods must throw TypeError
    assert.throws(() => registry.push({ id: 'dummy' }), TypeError);
    assert.throws(() => registry.pop(), TypeError);
    assert.throws(() => registry.shift(), TypeError);
    assert.throws(() => registry.unshift({ id: 'dummy' }), TypeError);
    assert.throws(() => registry.splice(0, 1), TypeError);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('InstructionRegistry: post-construction index assignment throws on frozen instance', () => {
  const tmp = mkTempDir('fgos-inst-reg-index-assign-');
  try {
    writeInstructionFile(path.join(tmp, 'core', 'instructions'), 'rule.md', 'id: rule-1\nkind: law');
    const registry = discoverInstructionSources(tmp);

    assert.throws(() => {
      registry[0] = { id: 'overwritten' };
    }, TypeError);

    assert.throws(() => {
      registry[1] = { id: 'appended' };
    }, TypeError);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 8. Containment, symlink, case policy, and custom roots (Requirement 5)
// ---------------------------------------------------------------------------

test('discoverInstructionSources throws CONTAINMENT_VIOLATION when symlink points outside root', () => {
  const tmpProject = mkTempDir('fgos-inst-contain-proj-');
  const tmpOutside = mkTempDir('fgos-inst-contain-out-');
  try {
    const outsideFile = path.join(tmpOutside, 'outside-rule.md');
    fs.writeFileSync(outsideFile, '---\nid: outside-rule\nkind: law\n---\nOutside content', 'utf8');

    const coreDir = path.join(tmpProject, 'core', 'instructions');
    fs.mkdirSync(coreDir, { recursive: true });
    const symlinkPath = path.join(coreDir, 'symlinked-rule.md');
    fs.symlinkSync(outsideFile, symlinkPath);

    assert.throws(
      () => discoverInstructionSources(tmpProject),
      (err) => {
        return (
          err instanceof InstructionRegistryError &&
          err.code === 'CONTAINMENT_VIOLATION' &&
          err.message.includes('resolves outside containment root')
        );
      },
    );
  } finally {
    fs.rmSync(tmpProject, { recursive: true, force: true });
    fs.rmSync(tmpOutside, { recursive: true, force: true });
  }
});

test('discoverInstructionSources ignores non-.md files and non-lowercase extension files', () => {
  const tmp = mkTempDir('fgos-inst-case-policy-');
  try {
    const coreDir = path.join(tmp, 'core', 'instructions');
    writeInstructionFile(coreDir, 'valid.md', 'id: valid-rule\nkind: law');

    // Write file with uppercase extension
    fs.writeFileSync(
      path.join(coreDir, 'invalid-case.MD'),
      '---\nid: invalid-case\nkind: law\n---\nInvalid case',
      'utf8',
    );
    // Write non-markdown file
    fs.writeFileSync(path.join(coreDir, 'notes.txt'), 'Not markdown', 'utf8');

    const registry = discoverInstructionSources(tmp);
    assert.equal(registry.length, 1);
    assert.ok(registry.has('valid-rule'));
    assert.equal(registry.has('invalid-case'), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('discoverInstructionSources supports custom roots as internal/test-only options', () => {
  const tmpHarness = mkTempDir('fgos-inst-custom-roots-');
  try {
    const customCore = path.join(tmpHarness, 'fixture-core');
    writeInstructionFile(customCore, 'custom-core.md', 'id: custom-core-law\nkind: law');

    const registry = discoverInstructionSources(tmpHarness, {
      coreRoot: customCore,
    });

    assert.equal(registry.length, 1);
    assert.ok(registry.has('custom-core-law'));
  } finally {
    fs.rmSync(tmpHarness, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// 9. Real project root discovery test
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
