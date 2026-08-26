// scripts/knowledge-bootstrap.mjs
// Bootstrap knowledge registry from classifier inventory data.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initStore,
  rebuild,
  registerTopicStore,
  registerDocStore,
} from '../src/state/store.mjs';

/**
 * Bootstrap the knowledge registry in target fgos directory using classifier output JSON.
 */
export function bootstrapRegistry(dir, inventoryDataPath) {
  if (!fs.existsSync(inventoryDataPath)) {
    throw new Error(`Inventory data file missing: ${inventoryDataPath}`);
  }

  const rawData = fs.readFileSync(inventoryDataPath, 'utf8');
  const inventory = JSON.parse(rawData);

  if (!Array.isArray(inventory)) {
    throw new Error('Inventory data must be a JSON array.');
  }

  const seenPairs = new Map();
  for (let i = 0; i < inventory.length; i++) {
    const row = inventory[i];
    if (!row.topicId || typeof row.topicId !== 'string' || !row.topicId.trim()) {
      throw new Error(`Row ${i} missing valid topicId`);
    }
    if (!row.role || typeof row.role !== 'string' || !row.role.trim()) {
      throw new Error(`Row ${i} missing valid role`);
    }
    if (!row.oldPath || typeof row.oldPath !== 'string') {
      throw new Error(`Row ${i} missing valid oldPath`);
    }

    const key = `${row.topicId}:${row.role}`;
    if (!seenPairs.has(key)) {
      seenPairs.set(key, [row.oldPath]);
    } else {
      seenPairs.get(key).push(row.oldPath);
    }
  }

  // A duplicate (topicId, role) pair from the classifier is a real anti-sprawl
  // violation, never something bootstrap should paper over by inventing a new
  // role suffix -- D-tsk28x-14's own invariant #2 requires an explicit
  // `topic.split` with real lineage for two docs to legitimately share a
  // role, and bootstrap has no authority to make that product decision on
  // its own. Fail loudly and name every colliding pair so the classifier's
  // own output (or the underlying legacy docs) can be fixed for real.
  const duplicatePairs = [...seenPairs.entries()].filter(([, paths]) => paths.length > 1);
  if (duplicatePairs.length > 0) {
    const detail = duplicatePairs.map(([key, paths]) => `${key} <- ${paths.join(', ')}`).join('; ');
    throw new Error(`Bootstrap refused: ${duplicatePairs.length} duplicate (topicId, role) pair(s) in the classifier inventory -- these need an explicit topic.split with lineage, not an invented role suffix: ${detail}`);
  }

  initStore(dir);
  let view = rebuild(dir);

  let topicsCreated = 0;
  let docsCreated = 0;

  for (const item of inventory) {
    if (!view.topics || !view.topics[item.topicId]) {
      registerTopicStore(dir, {
        topicId: item.topicId,
        purposeSlug: item.purposeSlug,
        purposeTitle: item.purposeTitle,
        entities: item.entities,
      });
      view = rebuild(dir);
      topicsCreated++;
    }

    const docId = `${item.topicId}:${item.role}`;
    if (!view.docs || !view.docs[docId]) {
      registerDocStore(dir, {
        docId,
        topicId: item.topicId,
        role: item.role,
        currentPath: item.oldPath,
        framework: item.framework || 'diataxis',
        mode: item.mode || 'explanation',
        docLifecycle: 'active',
        aliases: [],
        sourceCaptureIds: [item.oldPath],
      });
      view = rebuild(dir);
      docsCreated++;
    }
  }

  return { topicsCreated, docsCreated, totalDocs: Object.keys(view.docs || {}).length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const fgosDir = path.join(repoRoot, '.fgos');
  const dataPath = path.join(repoRoot, 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json');

  const res = bootstrapRegistry(fgosDir, dataPath);
  console.log(`Bootstrap complete: ${res.topicsCreated} topics created, ${res.docsCreated} docs created. Total docs: ${res.totalDocs}`);
}
