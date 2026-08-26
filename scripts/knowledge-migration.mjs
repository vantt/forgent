// scripts/knowledge-migration.mjs
// Phase 11 migration script: dry-run and apply corpus migration to knowledge registry paths.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { rebuild, moveDocPathStore } from '../src/state/store.mjs';
import { parseFrontmatter, renderFrontmatter } from '../src/report/frontmatter.mjs';

export function runKnowledgeMigration(repoRoot, { dryRun = true } = {}) {
  const fgosDir = path.join(repoRoot, '.fgos');
  const inventoryPath = path.join(repoRoot, 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json');

  let inventory = [];
  if (fs.existsSync(inventoryPath)) {
    inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  }

  const view = rebuild(fgosDir);
  const plannedMoves = [];

  for (const item of inventory) {
    const topic = view.topics[item.topicId];
    const purposeSlug = topic?.purposeSlug || item.topicId;
    const targetPath = `docs/${purposeSlug}/${item.role}.md`;
    const currentPath = item.oldPath;

    if (currentPath !== targetPath) {
      plannedMoves.push({
        docId: `${item.topicId}:${item.role}`,
        topicId: item.topicId,
        role: item.role,
        oldPath: currentPath,
        newPath: targetPath,
        quadrant: item.mode,
      });
    }
  }

  if (dryRun) {
    return {
      dryRun: true,
      moveCount: plannedMoves.length,
      plannedMoves,
    };
  }

  // Apply mode
  let appliedCount = 0;
  for (const move of plannedMoves) {
    const srcAbs = path.join(repoRoot, move.oldPath);
    const destAbs = path.join(repoRoot, move.newPath);

    if (fs.existsSync(srcAbs)) {
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
  };
}

if (process.argv[1] && process.argv[1].endsWith('knowledge-migration.mjs')) {
  const isApply = process.argv.includes('--apply');
  const repoRoot = process.cwd();
  const res = runKnowledgeMigration(repoRoot, { dryRun: !isApply });
  console.log(JSON.stringify(res, null, 2));
}
