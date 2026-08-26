// scripts/knowledge-migration.mjs
// Phase 11 migration script: dry-run and apply corpus migration to knowledge registry paths.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { rebuild, moveDocPathStore, demoteDocStore } from '../src/state/store.mjs';
import { parseFrontmatter, renderFrontmatter } from '../src/report/frontmatter.mjs';

// docs/architect/knowledge-registry-redesign.md §13.4 (Conservation): "every
// old file must appear exactly once ... missing files, duplicate source
// assignments, and target documents with no source all fail." Computed once
// from the planned-move list, before any file or store mutation happens --
// dry-run surfaces these as `conservationErrors` in its report, apply throws
// on them (nothing partially applied).
function computeConservationErrors(repoRoot, plannedMoves) {
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

  const conservationErrors = computeConservationErrors(repoRoot, plannedMoves);

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

  // Apply mode
  let appliedCount = 0;
  for (const move of plannedMoves) {
    const srcAbs = path.join(repoRoot, move.oldPath);
    const destAbs = path.join(repoRoot, move.newPath);

    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    try {
      execSync(`git mv "${move.oldPath}" "${move.newPath}"`, { cwd: repoRoot, stdio: 'ignore' });
    } catch {
      fs.renameSync(srcAbs, destAbs);
      try {
        execSync(`git add "${move.newPath}" "${move.oldPath}"`, { cwd: repoRoot, stdio: 'ignore' });
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

  // Generate projections
  const fgosBin = path.resolve('bin/fgos.mjs');
  try {
    execSync(`node "${fgosBin}" doc-registry`, { cwd: repoRoot });
  } catch {}

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
