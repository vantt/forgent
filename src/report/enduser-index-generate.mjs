// enduser-index-generate.mjs — I/O generation layer for the read-by-tag
// end-user doc index (docs/specs/enduser-docs-index.md). Unlike
// enduser-index.mjs (the pure transform, zero imports, no I/O by design),
// this module does real fs I/O: it enumerates docs/<quadrant>/ (+
// QUADRANT_DIR_ALIASES) on disk and folds the event log via `listWork`.
// This is the ONE generation path both `fgos docs-index`
// (bin/fgos.mjs) and the enduser-docs-index-stale doctor check/fix
// (src/setup/registrations.mjs) call — extracted here (tsk-1m0) so the
// doctor check can read the same computation without duplicating it, and
// so the doctor fix can regenerate the manifest via the same write path
// `docs-index` already proved correct, rather than reimplementing either.

import fs from 'node:fs';
import path from 'node:path';
import { buildEnduserIndex, QUADRANTS, QUADRANT_DIR_ALIASES } from './enduser-index.mjs';
import { parseFrontmatter } from './frontmatter.mjs';
import { listWork } from '../state/store.mjs';

// Scans one on-disk dir for `.md` files and pushes each as a docEntry
// tagged with `quadrant` — the quadrant this dir counts as, which for an
// alias dir (docs/specs/enduser-docs-index.md R10) differs from the dir's
// own on-disk name. A missing dir is skipped cleanly (ENOENT), never a
// crash: not every quadrant dir, nor every alias dir, is guaranteed to
// exist yet (R6).
function scanDirAsQuadrant(repoRoot, quadrantDir, quadrant, docEntries) {
  let dirEntries;
  try {
    dirEntries = fs.readdirSync(quadrantDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return; // dir absent — skip cleanly, never a crash
    throw err;
  }
  for (const dirEntry of dirEntries) {
    if (!dirEntry.isFile() || !dirEntry.name.endsWith('.md')) continue;
    const absPath = path.join(quadrantDir, dirEntry.name);
    const docPath = path.relative(repoRoot, absPath).split(path.sep).join('/');
    const content = fs.readFileSync(absPath, 'utf8');
    const h1 = content.match(/^#\s+(.+)$/m);
    docEntries.push({ quadrant, docPath, title: h1 ? h1[1].trim() : null });
  }
}

// Scans docs/knowledge subdirectories for `.md` files and pushes
// each as a docEntry tagged with `quadrant` determined from the file's own
// frontmatter `mode` field (mapping singular `tutorial` -> `tutorials`).
// Missing directories or invalid mode fields are skipped cleanly (ENOENT),
// never a crash.
function scanKnowledgeDirsAsQuadrant(repoRoot, docEntries) {
  const knowledgeDir = path.join(repoRoot, 'docs', 'knowledge');
  let purposeEntries;
  try {
    purposeEntries = fs.readdirSync(knowledgeDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const purposeEntry of purposeEntries) {
    if (!purposeEntry.isDirectory()) continue;
    const purposeDir = path.join(knowledgeDir, purposeEntry.name);
    let files;
    try {
      files = fs.readdirSync(purposeDir, { withFileTypes: true });
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.md')) continue;
      const absPath = path.join(purposeDir, file.name);
      const content = fs.readFileSync(absPath, 'utf8');
      const { meta } = parseFrontmatter(content);
      let quadrant = meta.mode;
      if (quadrant === 'tutorial') quadrant = 'tutorials';
      if (typeof quadrant !== 'string' || !QUADRANTS.includes(quadrant)) continue;

      const docPath = path.relative(repoRoot, absPath).split(path.sep).join('/');
      const h1 = content.match(/^#\s+(.+)$/m);
      docEntries.push({ quadrant, docPath, title: h1 ? h1[1].trim() : null });
    }
  }
}

/**
 * Enumerate every real end-user doc on disk under `repoRoot`, across every
 * Diataxis quadrant plus its declared aliases (R10) and docs/knowledge/ subdirs.
 * Deterministically sorted (quadrant, then docPath) so repeated runs over
 * unchanged docs produce byte-identical output.
 */
export function enumerateDocEntries(repoRoot) {
  const docEntries = [];
  for (const quadrant of QUADRANTS) {
    scanDirAsQuadrant(repoRoot, path.join(repoRoot, 'docs', quadrant), quadrant, docEntries);
    for (const alias of QUADRANT_DIR_ALIASES[quadrant] ?? []) {
      scanDirAsQuadrant(repoRoot, path.join(repoRoot, 'docs', alias), quadrant, docEntries);
    }
  }
  scanKnowledgeDirsAsQuadrant(repoRoot, docEntries);
  docEntries.sort((a, b) => (a.quadrant === b.quadrant ? (a.docPath < b.docPath ? -1 : 1) : (a.quadrant < b.quadrant ? -1 : 1)));
  return docEntries;
}

export function manifestPathFor(repoRoot) {
  return path.join(repoRoot, 'docs', 'enduser-docs-index.json');
}

/**
 * Compute the current end-user doc index in memory, without writing
 * anything — the read-only half shared by `fgos docs-index`'s write path
 * and the enduser-docs-index-stale doctor check. `fgosDir` is the `.fgos`
 * directory to fold the event log from (tsk-f31: absent `events.jsonl`,
 * e.g. a linked worktree per ADR0020, is "unreachable", not "empty" —
 * an existing on-disk `sourceCaptureId` is preserved rather than
 * regressed to `null` in that case).
 */
export function computeEnduserDocsIndex(repoRoot, fgosDir) {
  const docEntries = enumerateDocEntries(repoRoot);
  const manifestPath = manifestPathFor(repoRoot);
  let previousContent;
  try {
    previousContent = fs.readFileSync(manifestPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const storeReachable = fs.existsSync(path.join(fgosDir, 'events.jsonl'));
  const previousById = new Map();
  if (previousContent) {
    for (const e of JSON.parse(previousContent)) previousById.set(e.docPath, e.sourceCaptureId);
  }
  const view = listWork(fgosDir);
  const rawEntries = buildEnduserIndex(docEntries, view.outcomes ?? {}, view);
  const entries = rawEntries.map((e) => {
    if (!storeReachable && e.sourceCaptureId === null && previousById.get(e.docPath)) {
      return { ...e, sourceCaptureId: previousById.get(e.docPath) };
    }
    return e;
  });
  const nextContent = `${JSON.stringify(entries, null, 2)}\n`;
  return { manifestPath, entries, previousContent, nextContent };
}

/**
 * Regenerate and, if the content actually changed, overwrite
 * docs/enduser-docs-index.json — the one write this module performs.
 * Idempotent (R7): a second call with nothing changed on disk or in the
 * event log reports `changed: false` and never touches the file.
 */
export function generateEnduserDocsIndex(repoRoot, fgosDir) {
  const { manifestPath, entries, previousContent, nextContent } = computeEnduserDocsIndex(repoRoot, fgosDir);
  let changed = false;
  if (previousContent !== nextContent) {
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, nextContent, 'utf8');
    changed = true;
  }
  return {
    path: path.relative(repoRoot, manifestPath).split(path.sep).join('/'),
    count: entries.length,
    entries,
    changed,
  };
}
