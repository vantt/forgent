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
import { applyKnowledgeEvent } from '../src/state/knowledge-registry.mjs';

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
  const view = rebuild(dir);

  // Preflight pass: check EVERY row's existing topic/doc for drift against
  // the registry, against the SAME pre-mutation view, before any row gets
  // to mutate anything. Interleaving drift checks with registerTopicStore/
  // registerDocStore calls (the previous shape) meant an early row could
  // durably create real topics/docs before a LATER row's drift throw --
  // bootstrap reported "refused" while the registry had already been
  // written to. Batches every drift issue into one error, same pattern the
  // duplicate-pairs check above already uses.
  const driftErrors = [];
  for (const item of inventory) {
    const existingTopic = view.topics?.[item.topicId];
    if (existingTopic) {
      if (existingTopic.status !== 'active') {
        // A topic the inventory still references as a live source, but the
        // registry has retired -- same drift shape as the checks below:
        // the classifier's corpus view and the registry have diverged, and
        // bootstrap has no authority to decide which one is right.
        driftErrors.push(
          `topic '${item.topicId}' already exists but is '${existingTopic.status}' (not active) -- the inventory still names it as a live source`
        );
      }
      if (item.purposeSlug && existingTopic.purposeSlug !== item.purposeSlug) {
        // A topic that already exists but disagrees with the classifier's
        // current output on its own purposeSlug is real drift, not a no-op --
        // silently skipping it would report "idempotent" while the registry
        // and the classifier corpus have actually diverged. Bootstrap has no
        // authority to decide which one is right (same reasoning as the
        // duplicate-pairs refusal above); it fails loud and names both values
        // so a person can reconcile with "fgos topic rename" or a corrected
        // inventory row.
        driftErrors.push(
          `topic '${item.topicId}' already exists with purposeSlug '${existingTopic.purposeSlug}', but the inventory row wants '${item.purposeSlug}'`
        );
      }
    }

    const docId = `${item.topicId}:${item.role}`;
    const existingDoc = view.docs?.[docId];
    if (existingDoc) {
      if (existingDoc.docLifecycle === 'retired' || existingDoc.docLifecycle === 'superseded') {
        // A doc the inventory still names as a live corpus source, but the
        // registry has already retired/superseded, is drift -- treating it
        // as "already there, skip" would report idempotent success while
        // there is in fact no LIVE doc for enforcement (attest, resolver,
        // doctor) to use for this (topicId, role). Bootstrap cannot decide
        // on its own whether the classifier is stale or the registry's
        // retirement/supersession was a mistake; it fails loud.
        driftErrors.push(
          `doc '${docId}' already exists but is '${existingDoc.docLifecycle}' (not live) -- the inventory still names '${item.oldPath}' as a live source`
        );
      } else {
        if (existingDoc.currentPath !== item.oldPath) {
          // Same reasoning as the topic drift check above, for the doc's own
          // currentPath -- an existing doc whose path no longer matches the
          // classifier's inventory is drift bootstrap must name, not skip past.
          driftErrors.push(
            `doc '${docId}' already exists with currentPath '${existingDoc.currentPath}', but the inventory row wants '${item.oldPath}'`
          );
        }
        const wantFramework = item.framework || 'diataxis';
        const wantMode = item.mode || 'explanation';
        if (existingDoc.framework !== wantFramework) {
          driftErrors.push(
            `doc '${docId}' already exists with framework '${existingDoc.framework}', but the inventory row wants '${wantFramework}'`
          );
        }
        if (existingDoc.mode !== wantMode) {
          driftErrors.push(
            `doc '${docId}' already exists with mode '${existingDoc.mode}', but the inventory row wants '${wantMode}'`
          );
        }
      }
    }
  }
  if (driftErrors.length > 0) {
    throw new Error(
      `Bootstrap refused: ${driftErrors.length} drift issue(s) between the registry and the classifier inventory -- registry and classifier output have drifted. Reconcile with "fgos topic rename"/"fgos doc move-path" or fix the inventory rows before bootstrapping: ${driftErrors.join('; ')}`
    );
  }

  // Simulated-apply preflight: replay every row's topic.register/
  // doc.register event against an in-memory CLONE of the view, through the
  // real reducer (applyKnowledgeEvent) -- never a re-implementation of its
  // rules. This is what actually catches an invalid purposeSlug/framework/
  // mode, a role/mode collision, a currentPath already claimed by another
  // doc, or an occupied (topicId, role) slot BEFORE the mutation pass
  // below durably writes anything. The drift check above only compares
  // against ALREADY-registered rows; this simulation is what proves the
  // NEW writes this run is about to make are valid at all -- without it, a
  // later row's reducer error (e.g. "Invalid mode") would only surface
  // after the mutation pass had already durably created earlier rows'
  // topics/docs, the exact partial-write shape the drift preflight alone
  // does not prevent.
  // Only topics/docs are cloned (never the whole app-wide `view` rebuild()
  // returns) -- applyKnowledgeEvent reads/writes nothing else, and the rest
  // of that view can carry data structuredClone has no business touching.
  const simulatedView = { topics: structuredClone(view.topics ?? {}), docs: structuredClone(view.docs ?? {}) };
  for (const item of inventory) {
    if (!simulatedView.topics[item.topicId]) {
      applyKnowledgeEvent(simulatedView, {
        type: 'topic.register',
        payload: { topicId: item.topicId, purposeSlug: item.purposeSlug, purposeTitle: item.purposeTitle, entities: item.entities },
      });
    }
    const docId = `${item.topicId}:${item.role}`;
    if (!simulatedView.docs[docId]) {
      applyKnowledgeEvent(simulatedView, {
        type: 'doc.register',
        payload: {
          docId,
          topicId: item.topicId,
          role: item.role,
          currentPath: item.oldPath,
          framework: item.framework || 'diataxis',
          mode: item.mode || 'explanation',
          docLifecycle: 'active',
          aliases: [],
          sourceCaptureIds: [item.oldPath],
        },
      });
    }
  }

  // Mutation pass: the registry is now known drift-free against this whole
  // inventory, AND the whole batch of new writes has already been proven
  // valid by the simulation above -- every remaining unregistered row can
  // be created for real, with no risk of a later row aborting mid-write.
  let mutableView = view;
  let topicsCreated = 0;
  let docsCreated = 0;

  for (const item of inventory) {
    if (!mutableView.topics || !mutableView.topics[item.topicId]) {
      registerTopicStore(dir, {
        topicId: item.topicId,
        purposeSlug: item.purposeSlug,
        purposeTitle: item.purposeTitle,
        entities: item.entities,
      });
      mutableView = rebuild(dir);
      topicsCreated++;
    }

    const docId = `${item.topicId}:${item.role}`;
    if (!mutableView.docs || !mutableView.docs[docId]) {
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
      mutableView = rebuild(dir);
      docsCreated++;
    }
  }

  return { topicsCreated, docsCreated, totalDocs: Object.keys(mutableView.docs || {}).length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const fgosDir = path.join(repoRoot, '.fgos');
  const dataPath = path.join(repoRoot, 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json');

  const res = bootstrapRegistry(fgosDir, dataPath);
  console.log(`Bootstrap complete: ${res.topicsCreated} topics created, ${res.docsCreated} docs created. Total docs: ${res.totalDocs}`);
}
