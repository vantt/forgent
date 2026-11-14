// src/report/knowledge-lints.mjs
// Lints over the knowledge registry (the Work view's topics, docs and outcomes) and the docs tree. They read
// history-derived state, so they run on the knowledge verbs (`fgos knowledge status`), not as repo checks.
// Each finding keeps the id its doctor row had, so a search for the old row id finds the lint.

import fs from 'node:fs';
import path from 'node:path';
import { commitAt, pathExistsAt } from '../git/inspect.mjs';
import { resolveDocPath } from './knowledge-resolver.mjs';
import { isLiveDocLifecycle } from '../state/knowledge-registry.mjs';
import { findDuplicateAuthoritativeClaims } from './authoritative-match.mjs';
import { describeYamlError, readFrontmatter, YamlParseError } from '../util/yaml.mjs';

const PROVISIONAL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_TOPIC_MAX_DOCS = 10;

// An alias is a doc's OLD path, kept as a historical lookup key (never a live location), so a file missing at
// the alias path is the expected state after a migration. Broken means ambiguous: two or more non-retired docs
// claiming the identical alias, or an alias that is a DIFFERENT doc's own currentPath.
function aliasBroken(view) {
  const docs = Object.values(view.docs || {}).filter((d) => d.docLifecycle !== 'retired');
  const aliasOwners = new Map();
  for (const doc of docs) {
    for (const alias of doc.aliases || []) {
      if (!aliasOwners.has(alias)) aliasOwners.set(alias, []);
      aliasOwners.get(alias).push(doc.docId);
    }
  }
  const currentPaths = new Map(docs.map((d) => [d.currentPath, d.docId]));
  const broken = [];
  for (const [alias, owners] of aliasOwners) {
    if (owners.length > 1) {
      broken.push(`${alias}: claimed by ${owners.length} docs (${owners.join(', ')})`);
    } else if (currentPaths.has(alias) && currentPaths.get(alias) !== owners[0]) {
      broken.push(`${alias}: alias of ${owners[0]} but also the currentPath of ${currentPaths.get(alias)}`);
    }
  }
  return broken;
}

function activeDuplicates(view) {
  const counts = {};
  for (const doc of Object.values(view.docs || {})) {
    if (doc.docLifecycle === 'active') {
      const key = `${doc.topicId}:${doc.role}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return Object.entries(counts).filter(([, c]) => c > 1).map(([key]) => key);
}

// Walks the whole docs/ tree, reads each file's frontmatter, and hands findDuplicateAuthoritativeClaims the
// `{path, authoritativeFor}` candidate array it expects. A doc whose frontmatter the YAML door refuses is named in
// `refused`, never read as a doc without frontmatter.
function scanDocFrontmatter(root) {
  const docsDir = path.join(root, 'docs');
  if (!fs.existsSync(docsDir)) return { duplicates: [], refused: [] };
  const candidates = [];
  const refused = [];
  for (const relPath of fs.readdirSync(docsDir, { recursive: true })) {
    if (!relPath.endsWith('.md')) continue;
    const absPath = path.join(docsDir, relPath);
    if (!fs.statSync(absPath).isFile()) continue;
    let meta;
    try {
      ({ meta } = readFrontmatter(fs.readFileSync(absPath, 'utf8'), absPath));
    } catch (err) {
      if (!(err instanceof YamlParseError)) throw err;
      refused.push(`${path.join('docs', relPath)}: ${describeYamlError(err)}`);
      continue;
    }
    const authoritativeFor = Array.isArray(meta.authoritative_for) ? meta.authoritative_for[0] : meta.authoritative_for;
    if (typeof authoritativeFor === 'string' && authoritativeFor.trim()) {
      candidates.push({ path: path.join('docs', relPath), authoritativeFor });
    }
  }
  const duplicates = findDuplicateAuthoritativeClaims(candidates).map((group) => group.map((c) => c.path).join(' ~ '));
  return { duplicates, refused };
}

function provisionalAged(view, now) {
  const aged = [];
  for (const doc of Object.values(view.docs || {})) {
    if (doc.docLifecycle === 'provisional' && doc.updatedAt && (now - doc.updatedAt > PROVISIONAL_MAX_AGE_MS)) {
      aged.push(doc.docId);
    }
  }
  return aged;
}

function topicsOversized(view, topicMaxDocs) {
  const oversized = [];
  for (const topic of Object.values(view.topics || {})) {
    const count = Object.values(view.docs || {}).filter((d) => d.topicId === topic.topicId).length;
    if (count > topicMaxDocs) oversized.push(`${topic.topicId} (${count} docs)`);
  }
  return oversized;
}

function rolesUnderused(view) {
  const roleCounts = {};
  for (const doc of Object.values(view.docs || {})) {
    roleCounts[doc.role] = (roleCounts[doc.role] || 0) + 1;
  }
  return Object.entries(roleCounts).filter(([, c]) => c === 1).map(([role]) => role);
}

// A doc's own currentPath is the ground truth every other lint, the resolver and migration trust; if the file
// is not committed there, all of them trust a path that does not exist.
function currentPathMissing(view, root) {
  if (!fs.existsSync(path.join(root, '.git'))) return [];
  const missing = [];
  let head = null;
  try { head = commitAt(root, 'HEAD'); } catch { /* no commit: every live path is missing at HEAD */ }
  for (const doc of Object.values(view.docs || {})) {
    if (!isLiveDocLifecycle(doc.docLifecycle)) continue;
    try {
      if (!head || !pathExistsAt(root, head, doc.currentPath)) throw new Error('current path absent at HEAD');
    } catch {
      missing.push(`${doc.docId} (${doc.currentPath})`);
    }
  }
  return missing;
}

// Only sourceCaptureIds entries that are themselves a repo-relative doc path (the shape the bootstrap seeds:
// the doc's original oldPath, recorded as its first capture) can be unreachable; a captureId that is a work-item
// id (via `doc.attest`) is not a path and has nothing to resolve here.
function looksLikeDocPath(value) {
  return typeof value === 'string' && value.startsWith('docs/') && value.endsWith('.md');
}

function sourceUnreachable(view) {
  const unreachable = [];
  for (const doc of Object.values(view.docs || {})) {
    if (!isLiveDocLifecycle(doc.docLifecycle)) continue;
    for (const captureId of doc.sourceCaptureIds || []) {
      if (!looksLikeDocPath(captureId)) continue;
      const isOwnPath = captureId === doc.currentPath || (doc.aliases || []).includes(captureId);
      if (isOwnPath) continue;
      const resolved = resolveDocPath(view, captureId);
      const resolvesToSameDoc = resolved && !Array.isArray(resolved) && resolved.docId === doc.docId;
      if (!resolvesToSameDoc) {
        unreachable.push(`${doc.docId}: source '${captureId}' not reachable through its own current or alias paths`);
      }
    }
  }
  return unreachable;
}

// Four conservation properties: every outcome source reachable through the live registry; every migration
// inventory source appears exactly once; every live doc has at least one sourceCaptureIds entry; every
// inventory source is still traceable (on disk at its oldPath, or reachable through the registry with an alias).
function sourceConservation(view, root) {
  const problems = [];

  let unreachableOutcomeCount = 0;
  for (const outcome of Object.values(view.outcomes || {})) {
    if (outcome.docPath && !resolveDocPath(view, outcome.docPath)) unreachableOutcomeCount++;
  }
  if (unreachableOutcomeCount > 0) problems.push(`${unreachableOutcomeCount} outcome source capture(s) unresolvable`);

  for (const doc of Object.values(view.docs || {})) {
    if (isLiveDocLifecycle(doc.docLifecycle) && (doc.sourceCaptureIds || []).length === 0) {
      problems.push(`${doc.docId}: target document has no source (empty sourceCaptureIds)`);
    }
  }

  const inventoryPath = path.join(root, 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json');
  if (fs.existsSync(inventoryPath)) {
    let inventory = [];
    try {
      inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    } catch {
      inventory = [];
    }
    // Valid JSON that is not an array (a classifier run writing `{}` or `null`) parses cleanly and would
    // otherwise reach the loop below and throw.
    if (!Array.isArray(inventory)) inventory = [];
    const sourceCounts = new Map();
    for (const row of inventory) {
      if (typeof row.oldPath !== 'string') continue;
      sourceCounts.set(row.oldPath, (sourceCounts.get(row.oldPath) ?? 0) + 1);
    }
    for (const [oldPath, count] of sourceCounts) {
      if (count > 1) problems.push(`inventory source '${oldPath}' appears ${count} times, not exactly once`);
    }
    const lost = [];
    for (const oldPath of sourceCounts.keys()) {
      if (fs.existsSync(path.join(root, oldPath))) continue; // not migrated yet: still where the inventory says
      if (resolveDocPath(view, oldPath)) continue; // migrated, still traceable via alias or currentPath
      lost.push(oldPath);
    }
    if (lost.length > 0) problems.push(`${lost.length} inventory source(s) lost (neither on disk nor reachable through the registry): ${lost.join(', ')}`);
  }
  return problems;
}

/**
 * Every lint that has something to say about `view` (the Work view) and the docs tree under `root`:
 * `[{ lint, level: 'fail' | 'warn', items: string[] }]`, in a fixed order. A lint with nothing to report is
 * absent. `role-underused` is information only (`warn`); the others are `fail`.
 */
export function knowledgeFindings(view, { root, now = Date.now(), topicMaxDocs = DEFAULT_TOPIC_MAX_DOCS }) {
  const frontmatter = scanDocFrontmatter(root);
  const lints = [
    ['doc-alias-broken', 'fail', aliasBroken(view)],
    ['doc-active-duplicate', 'fail', activeDuplicates(view)],
    ['doc-current-path-missing', 'fail', currentPathMissing(view, root)],
    ['doc-source-unreachable', 'fail', sourceUnreachable(view)],
    ['doc-near-duplicate', 'fail', frontmatter.duplicates],
    ['doc-frontmatter-refused', 'fail', frontmatter.refused],
    ['doc-provisional-aged', 'fail', provisionalAged(view, now)],
    ['doc-topic-oversized', 'fail', topicsOversized(view, topicMaxDocs)],
    ['doc-role-underused', 'warn', rolesUnderused(view)],
    ['doc-source-conservation', 'fail', sourceConservation(view, root)],
  ];
  return lints.filter(([, , items]) => items.length > 0).map(([lint, level, items]) => ({ lint, level, items }));
}
