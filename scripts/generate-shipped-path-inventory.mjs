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

export const PATH_REGEX = /(?:^|[\s"'`(\[<])((?:core|docs|\.fgos|domains|\.agents|\.claude|plugins|src|bin|scripts|test)\/[a-zA-Z0-9_\.\/-]+(?:\.md|\.json|\.mjs|\.yaml|\.txt|\.sh|\.lock|\.jsonl)?)/g;
export const GLUED_TOKEN_REGEX = /(?:\.mjs|\.jsonl|\.yaml|\.yml|\.txt|\.sh|\.lock|\.md|\.json(?!l))[a-zA-Z]/;

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
        let clean = code.replace(/([-\/])\r?\n\s*/g, '$1');
        // Backslash line continuation
        clean = clean.replace(/\\\r?\n\s*/g, ' ');
        // All other line breaks inside inline code become spaces (CommonMark spec)
        clean = clean.replace(/\r?\n\s*/g, ' ');
        return fence + clean + fence;
      });
      // In prose text outside inline backticks, also rejoin lines that wrap with a hyphen or slash in a path:
      prose = prose.replace(
        /((?:core|docs|\.fgos|domains|\.agents|\.claude|plugins|src|bin|scripts|test)\/[a-zA-Z0-9_\.\/-]*[-\/])\r?\n\s*([a-zA-Z0-9_\.\/-]+)/g,
        '$1$2'
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

      // Reject glued tokens (e.g. .mjscapability, .mjsexecute, .mdfoo)
      if (GLUED_TOKEN_REGEX.test(candidate)) continue;

      // Skip invalid single-segment roots or truncated fragments (must contain at least root/item)
      const norm = normalizePosix(candidate);
      const segments = norm.split('/').filter(Boolean);
      if (segments.length < 2) continue;

      // Tree escape guard: ignore any candidate containing '..'
      if (segments.includes('..')) continue;

      if (!pathMap.has(norm)) {
        pathMap.set(norm, new Set());
      }
      pathMap.get(norm).add(fileRel);
    }
  }

  const sortedPaths = [...pathMap.keys()].sort();
  const entries = sortedPaths.map((p) => {
    const files = [...pathMap.get(p)].sort();
    const { scope, rationale } = classifyContractScope(p);
    return {
      path: p,
      occurrencesCount: files.length,
      referencedIn: files,
      contractScope: scope,
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

  for (const item of items) {
    if (item.contractScope === 'consumer-project-contract') consumerCount++;
    else if (item.contractScope === 'repository-local-contract') repoLocalCount++;
    else if (item.contractScope === 'mixed-repository-local-and-consumer') mixedContractCount++;
    else unclassifiedCount++;
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
  lines.push('');
  lines.push('## 3. Consumer-Project Contracts');
  lines.push('');
  lines.push('These paths represent conventions expected to exist or be created in user/consumer repositories:');
  lines.push('');
  lines.push('| Path | Occurrences | Referenced In (Sample) | Scope & Rationale |');
  lines.push('|---|:---:|---|---|');

  const consumerItems = inventory.items.filter((i) => i.contractScope === 'consumer-project-contract');
  for (const item of consumerItems) {
    const sampleFiles = item.referencedIn.slice(0, 2).join(', ') + (item.referencedIn.length > 2 ? ` (+${item.referencedIn.length - 2} more)` : '');
    lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | ${sampleFiles} | ${item.rationale} |`);
  }

  lines.push('');
  lines.push('## 4. Repository-Local Contracts');
  lines.push('');
  lines.push('These paths are internal to fgOS itself and will be safely transformed during unification without altering consumer contracts:');
  lines.push('');
  lines.push('| Path | Occurrences | Referenced In (Sample) | Scope & Rationale |');
  lines.push('|---|:---:|---|---|');

  const repoItems = inventory.items.filter((i) => i.contractScope === 'repository-local-contract');
  for (const item of repoItems) {
    const sampleFiles = item.referencedIn.slice(0, 2).join(', ') + (item.referencedIn.length > 2 ? ` (+${item.referencedIn.length - 2} more)` : '');
    lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | ${sampleFiles} | ${item.rationale} |`);
  }

  if (inventory.summary.mixedRepositoryLocalAndConsumerCount > 0) {
    lines.push('');
    lines.push('## 5. Mixed Repository-Local and Consumer Contracts');
    lines.push('');
    lines.push('These paths serve dual roles: active repository-local doctrine or platform truth for fgOS, and templates or shared conventions for consumer workspaces:');
    lines.push('');
    lines.push('| Path | Occurrences | Referenced In | Scope & Rationale |');
    lines.push('|---|:---:|---|---|');
    const mixedItems = inventory.items.filter((i) => i.contractScope === 'mixed-repository-local-and-consumer');
    for (const item of mixedItems) {
      lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | ${item.referencedIn.join(', ')} | ${item.rationale} |`);
    }
  }

  if (inventory.summary.unclassifiedCount > 0) {
    lines.push('');
    lines.push('## 6. Unclassified Paths');
    lines.push('');
    lines.push('| Path | Occurrences | Referenced In | Audit Note |');
    lines.push('|---|:---:|---|---|');
    const unclassItems = inventory.items.filter((i) => i.contractScope === 'mixed-or-unclassified');
    for (const item of unclassItems) {
      lines.push(`| \`${item.path}\` | ${item.occurrencesCount} | ${item.referencedIn.join(', ')} | ${item.rationale} |`);
    }
  }

  lines.push('');
  lines.push('## 7. Migration Safeguards');
  lines.push('');
  lines.push('1. Phase 07 consumer preparation must only rewrite entries classified as `repository-local-contract`.');
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
