// scripts/knowledge-migration.mjs
// Phase 11 migration script: dry-run and apply corpus migration to knowledge registry paths.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rebuild, moveDocPathStore, demoteDocStore } from '../src/state/store.mjs';
import { parseFrontmatter, renderFrontmatter } from '../src/report/frontmatter.mjs';
import { computeKnowledgeProjection } from '../src/report/knowledge-projection.mjs';

// docs/architect/knowledge-registry-redesign.md §13.4 (Conservation): "every
// old file must appear exactly once ... missing files, duplicate source
// assignments, and target documents with no source all fail." Computed once
// from the planned-move list, before any file or store mutation happens --
// dry-run surfaces these as `conservationErrors` in its report, apply throws
// on them (nothing partially applied).
//
// Also preflights the registry event apply itself would need to write, not
// just the filesystem move: a doc that isn't registered yet (or whose
// registry identity no longer matches what was planned) would previously
// only be discovered by actually running `git mv` first and having
// moveDocPathStore throw AFTER the file already moved -- a real partial
// apply (file relocated, registry never updated). Checking it here, before
// any mutation, is what makes apply's "nothing partially applied" promise
// true instead of aspirational.
function computeConservationErrors(repoRoot, view, plannedMoves) {
  const errors = [];

  const sourceCounts = new Map();
  const targetCounts = new Map();
  for (const move of plannedMoves) {
    sourceCounts.set(move.oldPath, (sourceCounts.get(move.oldPath) ?? 0) + 1);
    targetCounts.set(move.newPath, (targetCounts.get(move.newPath) ?? 0) + 1);
  }

  for (const [oldPath, count] of sourceCounts) {
    if (count > 1) {
      errors.push(`duplicate source assignment: '${oldPath}' is claimed by ${count} planned moves`);
    }
  }
  for (const [newPath, count] of targetCounts) {
    if (count > 1) {
      errors.push(`target '${newPath}' has ${count} sources -- folding multiple sources into one target document is not supported by this script`);
    }
  }
  for (const move of plannedMoves) {
    if (!fs.existsSync(path.join(repoRoot, move.oldPath))) {
      errors.push(`missing source file: '${move.oldPath}' (planned move to '${move.newPath}') does not exist on disk`);
    }
    if (fs.existsSync(path.join(repoRoot, move.newPath))) {
      errors.push(`target '${move.newPath}' already exists on disk -- refusing to overwrite it`);
    }

    // The registry event apply will need to write (doc.path-move, and
    // doc.demote when applicable) must be known-valid BEFORE any file
    // touches disk -- a doc not yet registered, or one whose registry
    // identity has drifted from what was planned, must fail here.
    const doc = view.docs?.[move.docId];
    if (!doc) {
      errors.push(`doc '${move.docId}' is not registered in the knowledge registry -- run "fgos doc register" (or bootstrap) before migrating it`);
    } else if (doc.topicId !== move.topicId || doc.role !== move.role || doc.currentPath !== move.oldPath) {
      errors.push(
        `doc '${move.docId}' registry identity (topicId='${doc.topicId}', role='${doc.role}', currentPath='${doc.currentPath}') no longer matches the planned move (topicId='${move.topicId}', role='${move.role}', oldPath='${move.oldPath}') -- the registry changed since planning; re-run migration to re-plan`
      );
    }
  }

  return errors;
}

export function runKnowledgeMigration(repoRoot, { dryRun = true } = {}) {
  const fgosDir = path.join(repoRoot, '.fgos');
  const inventoryPath = path.join(repoRoot, 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json');

  let inventory = [];
  if (fs.existsSync(inventoryPath)) {
    inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  }

  const view = rebuild(fgosDir);
  const plannedMoves = [];
  let alreadyMigratedCount = 0;

  for (const item of inventory) {
    const topic = view.topics[item.topicId];
    const purposeSlug = topic?.purposeSlug || item.topicId;
    const targetPath = `docs/${purposeSlug}/${item.role}.md`;

    // Idempotency (docs/architect/knowledge-registry-redesign.md §13.5,
    // "apply does not reduce the number of reachable source captures" on a
    // repeat run): the registry's own `currentPath` for this docId, when
    // the doc is already registered, is the single source of truth for
    // where the file REALLY is -- never the inventory's static `oldPath`,
    // which stays frozen at whatever the classifier saw and never gets
    // updated by a prior migration run. Trusting oldPath blindly is what
    // made a second run re-plan an already-completed move (the file is now
    // AT targetPath, oldPath no longer exists) and then silently skip it
    // at apply time as "missing source" instead of recognizing it as done.
    const docId = `${item.topicId}:${item.role}`;
    const existingDoc = view.docs?.[docId];
    const sourcePath = existingDoc ? existingDoc.currentPath : item.oldPath;

    if (sourcePath === targetPath) {
      // Already at its target -- nothing to plan, not a conservation gap.
      alreadyMigratedCount++;
      continue;
    }

    plannedMoves.push({
      docId,
      topicId: item.topicId,
      role: item.role,
      oldPath: sourcePath,
      newPath: targetPath,
      quadrant: item.mode,
      preLifecycle: existingDoc?.docLifecycle,
    });
  }

  const conservationErrors = computeConservationErrors(repoRoot, view, plannedMoves);

  if (dryRun) {
    return {
      dryRun: true,
      moveCount: plannedMoves.length,
      alreadyMigratedCount,
      plannedMoves,
      conservationErrors,
    };
  }

  if (conservationErrors.length > 0) {
    throw new Error(
      `knowledge-migration: refusing to apply -- ${conservationErrors.length} conservation violation(s):\n` + conservationErrors.map((e) => `  - ${e}`).join('\n')
    );
  }

  // Apply mode. Every plannedMoves entry was already preflighted above
  // (source exists, target is free, the doc is registered with an identity
  // matching the plan) -- the only way a step below can still fail is a
  // genuine race with another writer, in which case this loop stops with
  // whatever it already applied recorded correctly (never a file moved
  // with no matching registry event: moveDocPathStore is the very next
  // call after the file operation, before any other file touches disk).
  let appliedCount = 0;
  for (const move of plannedMoves) {
    const srcAbs = path.join(repoRoot, move.oldPath);
    const destAbs = path.join(repoRoot, move.newPath);

    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    try {
      // execFileSync (argv array, no shell) rather than a shell string --
      // move.oldPath/move.newPath come from the migration inventory file,
      // untrusted input; a path containing a quote or shell metacharacter
      // must never be interpreted by a shell.
      execFileSync('git', ['mv', move.oldPath, move.newPath], { cwd: repoRoot, stdio: 'ignore' });
    } catch {
      fs.renameSync(srcAbs, destAbs);
      try {
        execFileSync('git', ['add', move.newPath, move.oldPath], { cwd: repoRoot, stdio: 'ignore' });
      } catch {}
    }

    // Record moveDocPathStore event
    moveDocPathStore(fgosDir, { docId: move.docId, topicId: move.topicId, role: move.role, newPath: move.newPath });

    // docs/architect/knowledge-registry-redesign.md §13.5 rule 6: "leaves
    // every migrated document provisional unless explicitly promoted."
    // Only an 'active' doc needs demoting -- a 'provisional'/'reserved' doc
    // is already below 'active' and doc.demote itself requires 'active'.
    if (move.preLifecycle === 'active') {
      demoteDocStore(fgosDir, { docId: move.docId });
    }

    // Update frontmatter
    if (fs.existsSync(destAbs)) {
      const raw = fs.readFileSync(destAbs, 'utf8');
      const parsed = parseFrontmatter(raw);
      const newMeta = {
        ...parsed.meta,
        framework: 'diataxis',
        mode: move.quadrant,
      };
      const updated = renderFrontmatter(newMeta, parsed.body);
      fs.writeFileSync(destAbs, updated, 'utf8');
    }

    appliedCount++;
  }

  // Rebuild and write projections (design §13.5 rule 4: "apply ...
  // rebuilds machine and human projections"). Called directly against the
  // real repoRoot (never a bare relative path.resolve, which silently
  // depended on the CALLER's own process.cwd() instead of the repo this
  // migration is actually running against) and never swallowed -- a
  // projection failure here means docs/doc-registry.* is now stale right
  // after a real apply, which the contract requires and callers need to
  // know about, not a quietly-ignored best-effort step.
  const finalView = rebuild(fgosDir);
  const { jsonContent, mdContent } = computeKnowledgeProjection(finalView);
  const mdPath = path.join(repoRoot, 'docs/doc-registry.md');
  const jsonPath = path.join(repoRoot, 'docs/doc-registry.json');
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  fs.writeFileSync(jsonPath, jsonContent, 'utf8');

  return {
    dryRun: false,
    appliedCount,
    totalPlanned: plannedMoves.length,
    alreadyMigratedCount,
  };
}

if (process.argv[1] && process.argv[1].endsWith('knowledge-migration.mjs')) {
  const isApply = process.argv.includes('--apply');
  const repoRoot = process.cwd();
  const res = runKnowledgeMigration(repoRoot, { dryRun: !isApply });
  console.log(JSON.stringify(res, null, 2));
}
