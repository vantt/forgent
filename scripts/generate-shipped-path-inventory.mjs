#!/usr/bin/env node
// generate-shipped-path-inventory.mjs -- scans shipped surfaces (core/, domains/,
// plugins/fgOS/, .agents/skills/, and generated instructions) and builds a deterministic
// machine-readable inventory of path conventions, explicitly separating repository-local
// contracts from consumer-project contracts (Phase 01 Deliverable 7).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

export const SHIPPED_SURFACE_DIRS = [
  'core',
  'domains',
  'plugins/fgOS',
  '.agents/skills',
  '.fgos/instructions/effective'
];

export const PATH_REGEX = /(?:^|[\s"'`(\[<])((?:core|docs|\.fgos|domains|\.agents|\.claude|plugins|src|bin|scripts|test)\/[a-zA-Z0-9_\.\/-]+)/g;
export const GLUED_TOKEN_REGEX = /(?:\.mjs|\.jsonl|\.yaml|\.yml|\.txt|\.sh|\.lock|\.md|\.json(?!l))[a-zA-Z]/;

export const KNOWN_EXTENSIONS = [
  '.jsonl',
  '.yaml',
  '.lock',
  '.json',
  '.mjs',
  '.cjs',
  '.yml',
  '.txt',
  '.md',
  '.sh',
  '.js',
  '.ts',
];

export const ALLOWED_ROOTS = [
  'core',
  'docs',
  '.fgos',
  'domains',
  '.agents',
  '.claude',
  'plugins',
  'src',
  'bin',
  'scripts',
  'test',
];

export const EXT_JOIN_GUARD = new RegExp(
  '(?:' + KNOWN_EXTENSIONS.map((e) => e.replace('.', '\\.')).join('|') + ')[-\\/]$',
  'i'
);

export function canonicalizeRepoPath(rawPath) {
  let p = normalizePosix(rawPath);
  p = p.replace(/^\.\//, '');
  p = p.replace(/\/+/g, '/');
  let prev;
  do {
    prev = p;
    p = p.replace(/\/\.\//g, '/');
  } while (p !== prev);
  p = p.replace(/\/\.$/, '');
  return p;
}

export function isValidPathGrammar(p) {
  const segments = p.split('/').filter(Boolean);
  if (segments.length < 2) return false;
  if (!ALLOWED_ROOTS.includes(segments[0])) return false;
  if (segments.includes('..') || segments.includes('.')) return false;

  for (let i = 1; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (!/^[a-zA-Z0-9_.-]+$/.test(seg)) return false;
    for (const ext of KNOWN_EXTENSIONS) {
      if (seg.endsWith(ext) || seg.includes(ext)) return false;
    }
  }

  const leaf = segments[segments.length - 1];
  const matchedExt = KNOWN_EXTENSIONS.find((ext) => leaf.endsWith(ext));
  if (matchedExt) {
    const stem = leaf.slice(0, -matchedExt.length);
    if (!stem || !/^[a-zA-Z0-9_.-]+$/.test(stem)) return false;
    for (const ext of KNOWN_EXTENSIONS) {
      if (stem.endsWith(ext)) return false;
    }
    return true;
  }

  for (const ext of KNOWN_EXTENSIONS) {
    if (leaf.includes(ext)) return false;
  }
  if (leaf.includes('.')) return false;

  if (!/^[a-zA-Z0-9_-]+$/.test(leaf)) return false;
  return true;
}

export function normalizePosix(p) {
  return p.split(path.sep).join('/');
}

export function classifyContractScope(refPath) {
  const norm = normalizePosix(refPath);

  // 1. Explicit Mixed repository-local + consumer contracts
  // Dual role: active repository-local doctrine/source and template/convention for consumer workspaces
  if (norm === 'domains/coding/AGENTS.md' || norm.startsWith('domains/coding/')) {
    return {
      scope: 'mixed-repository-local-and-consumer',
      rationale: 'Dual role: active repository-local doctrine for fgOS self-hosting coding domain and template/convention for consumer projects'
    };
  }
  if (norm === 'core/instructions/platform-laws.md' || norm.startsWith('core/instructions/')) {
    return {
      scope: 'mixed-repository-local-and-consumer',
      rationale: 'Platform operating law definitions: authoritative platform source truth projected into consumer workspace instructions'
    };
  }

  // 2. Consumer-project contracts: paths expected/consumed in projects using fgOS (Mission #1/#2)
  if (norm.startsWith('.fgos/') || norm === '.fgos') {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Runtime work-state, configuration, coordination, and session storage in consumer workspaces'
    };
  }
  if (
    norm.startsWith('docs/how-to') ||
    norm.startsWith('docs/tutorials') ||
    norm.startsWith('docs/reference') ||
    norm.startsWith('docs/explanation') ||
    norm === 'docs/enduser-docs-index.json'
  ) {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Diataxis end-user knowledge quadrants and tag index authored in consumer projects'
    };
  }
  if (norm.startsWith('docs/distillery') || norm === 'docs/distillery') {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Project-local reference-learning distillery area'
    };
  }
  if (norm.startsWith('domains/') || norm === 'domains') {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Domain doctrine, stage graphs, and workflow configuration extensible per project'
    };
  }
  if (
    norm.startsWith('.agents/skills/') ||
    norm === '.agents/skills' ||
    norm.startsWith('.claude/skills/') ||
    norm === '.claude/skills'
  ) {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Agent skill definitions and wrappers deployed to consumer workspaces'
    };
  }
  if (norm.startsWith('core/skills/') || norm === 'core/skills') {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Canonical core skill definitions and shared fragments shipped for harness/workspace operation'
    };
  }
  if (
    norm.startsWith('core/coordination-protocols/') ||
    norm === 'core/coordination-protocols' ||
    norm.startsWith('core/protocol-packs/') ||
    norm === 'core/protocol-packs'
  ) {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Core multi-agent coordination protocol definitions and packs shipped with fgOS platform'
    };
  }
  if (norm.startsWith('plugins/') || norm === 'plugins') {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Client plugins providing slash commands in user harnesses'
    };
  }
  if (norm.startsWith('.claude/worktrees/') || norm === '.claude/worktrees') {
    return {
      scope: 'consumer-project-contract',
      rationale: 'Harness worktree isolate directory convention'
    };
  }

  // 3. Repository-local contracts: internal to fgOS platform codebase itself (Mission #3)
  if (
    norm.startsWith('docs/specs/') ||
    norm === 'docs/specs' ||
    norm.startsWith('docs/architect/') ||
    norm === 'docs/architect' ||
    norm.startsWith('docs/platform/') ||
    norm === 'docs/platform' ||
    norm.startsWith('docs/history/') ||
    norm === 'docs/history' ||
    norm.startsWith('docs/decisions/') ||
    norm === 'docs/decisions' ||
    norm.startsWith('docs/journals/') ||
    norm === 'docs/journals' ||
    norm === 'docs/platform-foundations.md' ||
    norm === 'docs/architecture-map.md' ||
    norm === 'docs/backlog.md' ||
    norm === 'docs/io-contract.md' ||
    norm === 'docs/routing-handoff-contract.md' ||
    norm === 'docs/coexistence.md' ||
    norm === 'docs/doc-governance.md' ||
    norm === 'docs/reading-map.md' ||
    norm === 'docs/transitional-switchboard.md' ||
    norm === 'docs/id-systems-audit.md' ||
    norm === 'docs/operator-runbook-herdr-cockpit.md' ||
    norm === 'docs/work-item-lifecycle-vision.md' ||
    norm === 'docs/distribution-vision.md' ||
    norm === 'docs/notes.md' ||
    norm === 'docs/metadata'
  ) {
    return {
      scope: 'repository-local-contract',
      rationale: 'Internal fgOS platform specification, architecture, decision history, or governance'
    };
  }

  if (
    norm.startsWith('src/') ||
    norm === 'src' ||
    norm.startsWith('bin/') ||
    norm === 'bin' ||
    norm.startsWith('scripts/') ||
    norm === 'scripts' ||
    norm.startsWith('test/') ||
    norm === 'test'
  ) {
    return {
      scope: 'repository-local-contract',
      rationale: 'Internal fgOS implementation code, CLI binaries, tests, or scripts'
    };
  }

  return {
    scope: 'mixed-or-unclassified',
    rationale: 'Requires audit during Phase 02 inventory'
  };
}

export const KNOWN_NONEXISTENT_EXAMPLES = new Set([
  'scripts/distill.mjs',
  'src/auth.mjs',
  'src/foo.mjs',
  'src/parser.mjs',
  'src/runner/retry.mjs',
  'src/x.mjs',
  'test/parser.test.mjs',
  'docs/metadata',
  'docs/notes.md',
]);

export const KNOWN_STALE_OR_DEAD = new Set([
  'docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md',
  'docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md',
]);

export const KNOWN_CONSUMER_PATTERNS = new Set([
  '.claude/worktrees',
  '.fgos/assignments',
  '.fgos/coordination/sessions',
  '.fgos/coordination/sessions/code-panel',
  '.fgos/events.lock',
  '.fgos/installation/bin/fgos',
  '.fgos/logs',
  '.fgos/main-checkout.lock',
]);

/**
 * Classifies secondary attributes of a referenced path:
 * referenceKind, existenceStatus, sourceRole, resolutionStatus, and isSafeRewriteTarget.
 */
export function classifyPathAttributes(relPath, { repoRoot = process.cwd(), scope = 'repository-local-contract' } = {}) {
  const norm = normalizePosix(relPath);
  const exists = fs.existsSync(path.resolve(repoRoot, norm));
  const isConsumerPattern = KNOWN_CONSUMER_PATTERNS.has(norm);
  const existenceStatus = (exists && !isConsumerPattern) ? 'exists' : 'nonexistent';

  let referenceKind;
  let sourceRole;
  let resolutionStatus;

  if (KNOWN_STALE_OR_DEAD.has(norm)) {
    referenceKind = 'stale-or-dead';
    sourceRole = 'retired-decision-citation';
    resolutionStatus = 'stale-retired';
  } else if (KNOWN_NONEXISTENT_EXAMPLES.has(norm)) {
    referenceKind = 'example-or-placeholder';
    sourceRole = 'illustrative-example';
    resolutionStatus = 'example-not-target';
  } else if (isConsumerPattern) {
    referenceKind = 'example-or-placeholder';
    sourceRole = 'consumer-workspace-pattern';
    resolutionStatus = 'pattern-placeholder';
  } else if (!exists) {
    if (
      norm.startsWith('.fgos/') ||
      norm === '.fgos' ||
      norm.startsWith('.claude/worktrees') ||
      norm.startsWith('docs/how-to/') ||
      norm.startsWith('docs/explanation/') ||
      norm === 'docs/reference-learning-system.md' ||
      norm === 'plugins/packages/open'
    ) {
      referenceKind = 'example-or-placeholder';
      sourceRole = norm.startsWith('.fgos') || norm.startsWith('.claude')
        ? 'consumer-workspace-pattern'
        : 'consumer-knowledge-quadrant';
      resolutionStatus = 'pattern-placeholder';
    } else {
      referenceKind = 'unresolved-dynamic';
      sourceRole = 'unresolved-path';
      resolutionStatus = 'unresolved';
    }
  } else {
    // Exists on disk
    if (norm === 'docs/specs/platform-foundations.md') {
      // Explicit generated projection of platform operating laws; non-authority mirror (F3)
      referenceKind = 'generated-mirror';
      sourceRole = 'generated-projection-non-authority';
      resolutionStatus = 'resolved';
    } else if (norm.startsWith('plugins/fgOS/skills/') || norm.startsWith('.fgos/instructions/effective/')) {
      referenceKind = 'generated-mirror';
      sourceRole = 'generated-mirror-entry';
      resolutionStatus = 'resolved';
    } else if (norm.startsWith('test/') || norm.includes('/proof.') || norm.includes('/fixture')) {
      referenceKind = 'test-evidence-reference';
      sourceRole = 'test-suite-or-fixture';
      resolutionStatus = 'resolved';
    } else {
      referenceKind = 'literal-current-path';
      if (scope === 'repository-local-contract') {
        sourceRole = (norm.startsWith('src/') || norm.startsWith('bin/') || norm.startsWith('scripts/'))
          ? 'internal-implementation'
          : 'platform-specification-or-doctrine';
      } else if (scope === 'consumer-project-contract') {
        sourceRole = 'shipped-surface-contract';
      } else {
        sourceRole = 'mixed-platform-and-consumer-doctrine';
      }
      resolutionStatus = 'resolved';
    }
  }

  // Never label nonexistent examples as safe rewrite targets merely because contractScope is repository-local
  const isSafeRewriteTarget = Boolean(
    scope === 'repository-local-contract' &&
    exists &&
    referenceKind === 'literal-current-path'
  );

  return {
    referenceKind,
    existenceStatus,
    sourceRole,
    resolutionStatus,
    isSafeRewriteTarget,
  };
}

export function scanSurfaceFiles(repoRoot, dirs = SHIPPED_SURFACE_DIRS) {
  const filePaths = [];

  for (const d of dirs) {
    const dirAbs = path.resolve(repoRoot, d);
    if (!fs.existsSync(dirAbs)) continue;

    function walk(curr) {
      const entries = fs.readdirSync(curr, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) {
          // Allow .agents and .fgos if specifically inside target dirs
          if (curr === repoRoot && (entry.name === '.agents' || entry.name === '.fgos')) {
            // descend
          } else if (entry.name !== '.agents' && entry.name !== '.fgos') {
            continue;
          }
        }
        const full = path.join(curr, entry.name);
        if (entry.isDirectory()) {
          if (!entry.isSymbolicLink()) walk(full);
        } else if (entry.isFile()) {
          const rel = normalizePosix(path.relative(repoRoot, full));
          filePaths.push(rel);
        }
      }
    }

    walk(dirAbs);
  }

  filePaths.sort();
  return filePaths;
}

/**
 * Normalizes markdown/source content prior to path extraction:
 * - Distinguishes fenced code blocks (``` or ~~~) from inline code / prose.
 * - Inside fenced code blocks, preserves line breaks so lines of code/prose are never
 *   glued together; handles multiline command backslash continuations (\\\r?\n\s* -> ' ').
 * - Inside inline code spans (`...`), joins wrapped paths that ended with a hyphen or slash,
 *   handles multiline backslash continuations, and converts remaining line breaks to spaces
 *   (per CommonMark spec, line breaks inside inline code represent whitespace, preventing
 *   subcommands from gluing onto filenames).
 * - Inside prose outside code spans, joins lines where a path was wrapped across a line break
 *   with a trailing hyphen or slash.
 */
export function normalizeContent(raw) {
  // Split by code fences (``` or ~~~)
  const parts = raw.split(/(^ {0,3}(?:```|~~~)[^\n]*\n[\s\S]*?\n {0,3}(?:```|~~~)\s*$)/m);
  return parts
    .map((part, idx) => {
      // Odd index is a fenced code block
      if (idx % 2 === 1) {
        // In fenced blocks, handle multiline command backslash continuations only; keep newlines intact
        return part.replace(/\\\r?\n\s*/g, ' ');
      }
      // In prose/inline blocks:
      // Process inline code spans: `...`
      let prose = part.replace(/(?<!`)(`{1,2})(?!`)([\s\S]*?)(?<!`)\1(?!`)/g, (_, fence, code) => {
        // Hyphen or slash line wrap inside code span: e.g. "foo-\n  bar" -> "foo-bar"
        // Guard: do NOT join across line breaks if prefix ends with a known extension (e.g. .mjs- or .mjs/)
        let clean = code.replace(/([^\s]+[-\/])\r?\n\s*([^\s]+)/g, (match, prefix, suffix) => {
          if (EXT_JOIN_GUARD.test(prefix)) {
            return prefix + ' ' + suffix;
          }
          return prefix + suffix;
        });
        // Backslash line continuation
        clean = clean.replace(/\\\r?\n\s*/g, ' ');
        // All other line breaks inside inline code become spaces (CommonMark spec)
        clean = clean.replace(/\r?\n\s*/g, ' ');
        return fence + clean + fence;
      });
      // In prose text outside inline backticks, also rejoin lines that wrap with a hyphen or slash in a path:
      prose = prose.replace(
        /((?:core|docs|\.fgos|domains|\.agents|\.claude|plugins|src|bin|scripts|test)\/[a-zA-Z0-9_\.\/-]*[-\/])\r?\n\s*([a-zA-Z0-9_\.\/-]+)/g,
        (match, prefix, suffix) => {
          if (EXT_JOIN_GUARD.test(prefix)) {
            return prefix + '\n' + suffix;
          }
          return prefix + suffix;
        }
      );
      return prose;
    })
    .join('');
}

export function extractPathReferences(repoRoot, surfaceFiles) {
  const pathMap = new Map();

  for (const fileRel of surfaceFiles) {
    const full = path.resolve(repoRoot, fileRel);
    const raw = fs.readFileSync(full, 'utf8');
    const content = normalizeContent(raw);

    for (const match of content.matchAll(PATH_REGEX)) {
      let candidate = match[1].trim();
      // Clean trailing punctuation and brackets/quotes
      candidate = candidate.replace(/[.,:;)>`'"]+$/, '');
      // Strip trailing hyphen or slash from truncation
      candidate = candidate.replace(/[-\/]+$/, '');
      if (candidate.length === 0) continue;

      // Reject glued tokens (denylist fallback)
      if (GLUED_TOKEN_REGEX.test(candidate)) continue;

      // Canonicalize repo path: normalize redundant ./ and repeated slashes
      const canon = canonicalizeRepoPath(candidate);

      // Positive boundary and grammar validation
      if (!isValidPathGrammar(canon)) continue;

      if (!pathMap.has(canon)) {
        pathMap.set(canon, new Set());
      }
      pathMap.get(canon).add(fileRel);
    }
  }

  const sortedPaths = [...pathMap.keys()].sort();
  const entries = sortedPaths.map((p) => {
    const files = [...pathMap.get(p)].sort();
    const { scope, rationale } = classifyContractScope(p);
    const attrs = classifyPathAttributes(p, { repoRoot, scope });
    return {
      path: p,
      occurrencesCount: files.length,
      referencedIn: files,
      contractScope: scope,
      referenceKind: attrs.referenceKind,
      existenceStatus: attrs.existenceStatus,
      sourceRole: attrs.sourceRole,
      resolutionStatus: attrs.resolutionStatus,
      isSafeRewriteTarget: attrs.isSafeRewriteTarget,
      rationale,
    };
  });

  return entries;
}

export function generateInventory(repoRoot = process.cwd(), dirs = SHIPPED_SURFACE_DIRS) {
  const files = scanSurfaceFiles(repoRoot, dirs);
  const items = extractPathReferences(repoRoot, files);

  let consumerCount = 0;
  let repoLocalCount = 0;
  let mixedContractCount = 0;
  let unclassifiedCount = 0;
  let safeRewriteTargetsCount = 0;
  let nonTargetExamplesCount = 0;
  let existsCount = 0;
  let nonexistentCount = 0;

  const referenceKindCounts = {
    literalCurrentPath: 0,
    exampleOrPlaceholder: 0,
    generatedMirror: 0,
    staleOrDead: 0,
    testEvidenceReference: 0,
    unresolvedDynamic: 0,
  };

  for (const item of items) {
    if (item.contractScope === 'consumer-project-contract') consumerCount++;
    else if (item.contractScope === 'repository-local-contract') repoLocalCount++;
    else if (item.contractScope === 'mixed-repository-local-and-consumer') mixedContractCount++;
    else unclassifiedCount++;

    if (item.existenceStatus === 'exists') existsCount++;
    else nonexistentCount++;

    if (item.isSafeRewriteTarget) safeRewriteTargetsCount++;
    else nonTargetExamplesCount++;

    if (item.referenceKind === 'literal-current-path') referenceKindCounts.literalCurrentPath++;
    else if (item.referenceKind === 'example-or-placeholder') referenceKindCounts.exampleOrPlaceholder++;
    else if (item.referenceKind === 'generated-mirror') referenceKindCounts.generatedMirror++;
    else if (item.referenceKind === 'stale-or-dead') referenceKindCounts.staleOrDead++;
    else if (item.referenceKind === 'test-evidence-reference') referenceKindCounts.testEvidenceReference++;
    else if (item.referenceKind === 'unresolved-dynamic') referenceKindCounts.unresolvedDynamic++;
  }

  return {
    $schema: 'https://forgent.dev/schemas/shipped-path-conventions-inventory.v1.json',
    version: 1,
    generatedAt: '2026-09-25T00:00:00.000Z',
    phase: '01',
    description: 'Deterministic inventory of path conventions referenced in shipped surfaces, separating repository-local from consumer-project contracts',
    surfacesScanned: dirs,
    scannedFilesCount: files.length,
    totalUniquePathsCount: items.length,
    summary: {
      consumerProjectContractsCount: consumerCount,
      repositoryLocalContractsCount: repoLocalCount,
      mixedRepositoryLocalAndConsumerCount: mixedContractCount,
      unclassifiedCount,
      mixedCount: mixedContractCount + unclassifiedCount,
      existence: {
        existsCount,
        nonexistentCount,
      },
      rewriteSafety: {
        safeRewriteTargetsCount,
        nonTargetExamplesCount,
      },
      referenceKinds: referenceKindCounts,
    },
    items,
  };
}

export function generateMarkdownReport(inventory) {
  const lines = [];
  lines.push('# Shipped Path Conventions Inventory');
  lines.push('');
  lines.push('```txt');
  lines.push('Document type: Inventory');
  lines.push('Audience: Architect, maintainer, reviewer, agent');
  lines.push('Purpose: Separate repository-local contracts from consumer-project contracts across shipped surfaces');
  lines.push('Design status: Accepted (Phase 01)');
  lines.push('Implementation: Implemented (Phase 01)');
  lines.push('Phase: 01 Deliverable 7');
  lines.push('Last reviewed: 2026-09-25');
  lines.push('Related:');
  lines.push('- `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.json`');
  lines.push('- `plans/260925-documentation-authority-unification/plan.md` §3 Decision 11');
  lines.push('```');
  lines.push('');
  lines.push('## 1. Boundary Principle');
  lines.push('');
  lines.push('> **Locked Program Decision 11 (plan.md §3):** Self-hosted paths and shipped conventions');
  lines.push('> are separate contracts. Rewriting this repository must not silently impose its topology');
  lines.push('> on projects that consume fgOS (Missions #1 and #2).');
  lines.push('');
  lines.push('During documentation unification, changing an internal platform documentation route (such as');
  lines.push('retiring `docs/specs/runner.md` in favor of `docs/platform/runner/spec.md` at Phase 08 cutover)');
  lines.push('must **never** inadvertently alter or break path contracts that consumer projects rely upon.');
  lines.push('');
  lines.push('## 2. Summary Statistics');
  lines.push('');
  lines.push(`- **Surfaces Scanned:** ${inventory.surfacesScanned.join(', ')}`);
  lines.push(`- **Total Shipped Files Scanned:** ${inventory.scannedFilesCount}`);
  lines.push(`- **Total Unique Referenced Paths:** ${inventory.totalUniquePathsCount}`);
  lines.push(`- **Consumer-Project Contracts:** ${inventory.summary.consumerProjectContractsCount}`);
  lines.push(`- **Repository-Local Contracts:** ${inventory.summary.repositoryLocalContractsCount}`);
  lines.push(`- **Mixed Repository-Local and Consumer Contracts:** ${inventory.summary.mixedRepositoryLocalAndConsumerCount}`);
  lines.push(`- **Unclassified Paths:** ${inventory.summary.unclassifiedCount}`);
  if (inventory.summary.existence) {
    lines.push(`- **Path Existence:** ${inventory.summary.existence.existsCount} existing on disk, ${inventory.summary.existence.nonexistentCount} nonexistent (examples, placeholders, patterns, retired citations)`);
  }
  if (inventory.summary.rewriteSafety) {
    lines.push(`- **Safe Rewrite Targets:** ${inventory.summary.rewriteSafety.safeRewriteTargetsCount} verified repo-local files`);
    lines.push(`- **Non-Target Examples & Placeholders:** ${inventory.summary.rewriteSafety.nonTargetExamplesCount} references (must not be rewritten merely because contractScope is repository-local)`);
  }
  lines.push('');
  lines.push('## 3. Consumer-Project Contracts');
  lines.push('');
  lines.push('These paths represent conventions expected to exist or be created in user/consumer repositories:');
  lines.push('');
  lines.push('| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |');
  lines.push('|---|:---:|---|---|---|---|---|');

  const consumerItems = inventory.items.filter((i) => i.contractScope === 'consumer-project-contract');
  for (const item of consumerItems) {
    lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | \`${item.referenceKind}\` | \`${item.existenceStatus}\` | \`${item.sourceRole}\` | \`${item.resolutionStatus}\` | ${item.rationale} |`);
  }

  lines.push('');
  lines.push('## 4. Repository-Local Contracts');
  lines.push('');
  lines.push('These paths are internal to the fgOS platform codebase. They are split into real verified files eligible for rewrite and illustrative non-target examples:');
  lines.push('');
  lines.push('### 4.1 Verified Repository-Local Files (Safe Rewrite Targets)');
  lines.push('');
  lines.push('These paths exist on disk within fgOS and are eligible to be safely transformed during Phase 07 preparation:');
  lines.push('');
  lines.push('| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |');
  lines.push('|---|:---:|---|---|---|---|---|');

  const safeRepoItems = inventory.items.filter((i) => i.contractScope === 'repository-local-contract' && i.isSafeRewriteTarget);
  for (const item of safeRepoItems) {
    lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | \`${item.referenceKind}\` | \`${item.existenceStatus}\` | \`${item.sourceRole}\` | \`${item.resolutionStatus}\` | ${item.rationale} |`);
  }

  lines.push('');
  lines.push('### 4.2 Illustrative Examples and Non-Target References');
  lines.push('');
  lines.push('These paths are illustrative examples, hypothetical modules, placeholders, or retired citations referenced inside shipped skills and documentation (e.g., `src/foo.mjs`, `src/auth.mjs`, `scripts/distill.mjs`, `src/runner/retry.mjs`, `test/parser.test.mjs`). Even though their path syntax is repository-local, they do NOT exist on disk and MUST NEVER be labeled or treated as safe rewrite targets merely because contractScope is repository-local:');
  lines.push('');
  lines.push('| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |');
  lines.push('|---|:---:|---|---|---|---|---|');

  const nonTargetRepoItems = inventory.items.filter((i) => i.contractScope === 'repository-local-contract' && !i.isSafeRewriteTarget);
  for (const item of nonTargetRepoItems) {
    lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | \`${item.referenceKind}\` | \`${item.existenceStatus}\` | \`${item.sourceRole}\` | \`${item.resolutionStatus}\` | ${item.rationale} |`);
  }

  if (inventory.summary.mixedRepositoryLocalAndConsumerCount > 0) {
    lines.push('');
    lines.push('## 5. Mixed Repository-Local and Consumer Contracts');
    lines.push('');
    lines.push('These paths serve dual roles: active repository-local doctrine or platform truth for fgOS, and templates or shared conventions for consumer workspaces:');
    lines.push('');
    lines.push('| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |');
    lines.push('|---|:---:|---|---|---|---|---|');
    const mixedItems = inventory.items.filter((i) => i.contractScope === 'mixed-repository-local-and-consumer');
    for (const item of mixedItems) {
      lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | \`${item.referenceKind}\` | \`${item.existenceStatus}\` | \`${item.sourceRole}\` | \`${item.resolutionStatus}\` | ${item.rationale} |`);
    }
  }

  if (inventory.summary.unclassifiedCount > 0) {
    lines.push('');
    lines.push('## 6. Unclassified Paths');
    lines.push('');
    lines.push('| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Audit Note |');
    lines.push('|---|:---:|---|---|---|---|---|');
    const unclassItems = inventory.items.filter((i) => i.contractScope === 'mixed-or-unclassified');
    for (const item of unclassItems) {
      lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | \`${item.referenceKind}\` | \`${item.existenceStatus}\` | \`${item.sourceRole}\` | \`${item.resolutionStatus}\` | ${item.rationale} |`);
    }
  }

  lines.push('');
  lines.push('## 7. Migration Safeguards');
  lines.push('');
  lines.push('1. Phase 07 consumer preparation must only rewrite verified repository-local files (`isSafeRewriteTarget: true`). Illustrative examples and placeholders (`scripts/distill.mjs`, `src/auth.mjs`, `src/foo.mjs`, `src/runner/retry.mjs`, `test/parser.test.mjs`, `src/parser.mjs`, `src/x.mjs`, `docs/notes.md`, `docs/metadata`) must never be treated as safe rewrite targets merely because contractScope is repository-local.');
  lines.push('2. Shipped skill templates and plugin wrappers that refer to consumer-project contracts (`.fgos/`, `docs/how-to/`, `domains/`, `core/skills/`) must remain stable.');
  lines.push('3. Mixed contracts (`domains/coding/AGENTS.md`, `core/instructions/platform-laws.md`) require explicit separation before modification.');
  lines.push('4. Any skill that cites a repo-local spec as a self-hosting aid must be evaluated for abstraction into a provider or runtime inspection door rather than hardcoding repository paths.');
  return lines.join('\n') + '\n';
}

export function runCli(argv, cwd = process.cwd()) {
  const jsonOutIdx = argv.indexOf('--json-out');
  const mdOutIdx = argv.indexOf('--md-out');

  const jsonOut = jsonOutIdx >= 0 ? path.resolve(cwd, argv[jsonOutIdx + 1]) : null;
  const mdOut = mdOutIdx >= 0 ? path.resolve(cwd, argv[mdOutIdx + 1]) : null;

  const inventory = generateInventory(cwd);

  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify(inventory, null, 2) + '\n');
    console.log(`generate-shipped-path-inventory: wrote JSON inventory to ${path.relative(cwd, jsonOut)}`);
  }

  if (mdOut) {
    const md = generateMarkdownReport(inventory);
    fs.writeFileSync(mdOut, md);
    console.log(`generate-shipped-path-inventory: wrote Markdown report to ${path.relative(cwd, mdOut)}`);
  }

  if (!jsonOut && !mdOut) {
    console.log(JSON.stringify(inventory, null, 2));
  }

  return 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
