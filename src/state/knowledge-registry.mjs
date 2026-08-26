// src/state/knowledge-registry.mjs
// Pure domain model, reducer, and invariants for the Knowledge Registry.

export class KnowledgeValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KnowledgeValidationError';
    this.category = 'validation';
  }
}

export const VALID_DOC_LIFECYCLE = Object.freeze([
  'reserved',
  'provisional',
  'active',
  'superseded',
  'retired',
]);

/**
 * Return all active docs matching (topicId, role) in view.
 */
export function getActiveDocs(view, topicId, role) {
  if (!view || !view.docs) return [];
  return Object.values(view.docs).filter(
    (doc) => doc.topicId === topicId && doc.role === role && doc.docLifecycle === 'active'
  );
}

/**
 * Assert that activeDoc(topicId, role) <= 1 for the given topicId and role.
 * Throws KnowledgeValidationError if violation exists.
 */
export function assertActiveDocCardinality(view, topicId, role) {
  const activeDocs = getActiveDocs(view, topicId, role);
  if (activeDocs.length > 1) {
    throw new KnowledgeValidationError(
      `Invariant violation: activeDoc(${topicId}, ${role}) count is ${activeDocs.length}, max allowed is 1.`
    );
  }
}

/**
 * Refuses `currentPath` when a DIFFERENT non-retired doc already claims it
 * as its own currentPath -- resolveDocPath's "direct match on currentPath"
 * step (src/report/knowledge-resolver.mjs) can only ever return one doc for
 * a given path; two docs silently sharing one currentPath means a caller
 * (knowledge attest, the legacy compound gate) resolves an ambiguous
 * `[doc, otherDoc]` array and picks `[0]` without knowing it -- exactly the
 * "capture attaches to the wrong doc" shape a fail-closed check must catch
 * at write time instead.
 */
function assertCurrentPathUnique(view, id, currentPath) {
  for (const doc of Object.values(view.docs)) {
    if (doc.docId !== id && doc.currentPath === currentPath && doc.docLifecycle !== 'retired') {
      throw new KnowledgeValidationError(
        `currentPath "${currentPath}" is already claimed by doc '${doc.docId}' — currentPath must be unique among non-retired docs.`
      );
    }
  }
}

/**
 * Apply a single knowledge event (topic.* or doc.*) onto view.
 * view = { topics: {...}, docs: {...}, ... }
 */
export function applyKnowledgeEvent(view, event) {
  if (!view.topics) view.topics = {};
  if (!view.docs) view.docs = {};

  const payload = event.payload ?? {};

  switch (event.type) {
    case 'topic.register': {
      const { topicId, purposeSlug, purposeTitle, entities } = payload;
      if (!topicId || !purposeSlug) {
        throw new KnowledgeValidationError('topic.register requires topicId and purposeSlug');
      }
      view.topics[topicId] = {
        topicId,
        purposeSlug,
        purposeTitle: purposeTitle ?? purposeSlug,
        entities: Array.isArray(entities) ? [...entities] : [],
        status: 'active',
        lineage: null,
        createdAt: event.ts ?? Date.now(),
        updatedAt: event.ts ?? Date.now(),
      };
      break;
    }

    case 'topic.rename': {
      const { topicId, newPurposeSlug, newPurposeTitle } = payload;
      const topic = view.topics[topicId];
      if (!topic) {
        throw new KnowledgeValidationError(`topic.rename: topic '${topicId}' not found`);
      }
      topic.lineage = {
        ...(topic.lineage ?? {}),
        renamedFrom: topic.purposeSlug,
      };
      if (newPurposeSlug) topic.purposeSlug = newPurposeSlug;
      if (newPurposeTitle) topic.purposeTitle = newPurposeTitle;
      topic.updatedAt = event.ts ?? Date.now();
      break;
    }

    case 'topic.split': {
      const { topicId, newTopics } = payload;
      const oldTopic = view.topics[topicId];
      if (!oldTopic) {
        throw new KnowledgeValidationError(`topic.split: old topic '${topicId}' not found`);
      }
      if (!Array.isArray(newTopics) || newTopics.length === 0) {
        throw new KnowledgeValidationError('topic.split requires non-empty newTopics array');
      }

      // Mark old topic as retired
      oldTopic.status = 'retired';
      oldTopic.updatedAt = event.ts ?? Date.now();

      const oldDocs = Object.values(view.docs).filter((d) => d.topicId === topicId);

      for (const nt of newTopics) {
        const { topicId: newTopicId, purposeSlug, purposeTitle, entities, rolesToMove } = nt;
        if (!newTopicId || !purposeSlug) {
          throw new KnowledgeValidationError('topic.split new topic requires topicId and purposeSlug');
        }
        view.topics[newTopicId] = {
          topicId: newTopicId,
          purposeSlug,
          purposeTitle: purposeTitle ?? purposeSlug,
          entities: Array.isArray(entities) ? [...entities] : (oldTopic.entities ?? []),
          status: 'active',
          lineage: { splitFrom: topicId },
          createdAt: event.ts ?? Date.now(),
          updatedAt: event.ts ?? Date.now(),
        };

        if (Array.isArray(rolesToMove)) {
          for (const doc of oldDocs) {
            if (rolesToMove.includes(doc.role)) {
              doc.topicId = newTopicId;
              doc.updatedAt = event.ts ?? Date.now();
            }
          }
        }
      }
      break;
    }

    case 'topic.merge': {
      const { sourceTopicIds, targetTopicId } = payload;
      if (!Array.isArray(sourceTopicIds) || !targetTopicId) {
        throw new KnowledgeValidationError('topic.merge requires sourceTopicIds and targetTopicId');
      }
      const targetTopic = view.topics[targetTopicId];
      if (!targetTopic) {
        throw new KnowledgeValidationError(`topic.merge: target topic '${targetTopicId}' not found`);
      }
      targetTopic.lineage = {
        ...(targetTopic.lineage ?? {}),
        mergedFrom: Array.isArray(targetTopic.lineage?.mergedFrom)
          ? [...targetTopic.lineage.mergedFrom, ...sourceTopicIds]
          : [...sourceTopicIds],
      };
      targetTopic.updatedAt = event.ts ?? Date.now();

      for (const sId of sourceTopicIds) {
        const srcTopic = view.topics[sId];
        if (srcTopic) {
          srcTopic.status = 'retired';
          srcTopic.updatedAt = event.ts ?? Date.now();
        }
        for (const doc of Object.values(view.docs)) {
          if (doc.topicId === sId) {
            doc.topicId = targetTopicId;
            doc.updatedAt = event.ts ?? Date.now();
          }
        }
      }
      break;
    }

    case 'topic.retire': {
      const { topicId } = payload;
      const topic = view.topics[topicId];
      if (topic) {
        topic.status = 'retired';
        topic.updatedAt = event.ts ?? Date.now();
      }
      break;
    }

    case 'doc.reserve': {
      const { topicId, role, currentPath, framework, mode, docId } = payload;
      if (!topicId || !role || !currentPath) {
        throw new KnowledgeValidationError('doc.reserve requires topicId, role, and currentPath');
      }
      if (!view.topics[topicId]) {
        throw new KnowledgeValidationError(`doc.reserve: topicId "${topicId}" is not registered — run "fgos topic register" first`);
      }
      const id = docId ?? `${topicId}:${role}`;
      assertCurrentPathUnique(view, id, currentPath);
      view.docs[id] = {
        docId: id,
        topicId,
        role,
        framework: framework ?? 'diataxis',
        mode: mode ?? 'explanation',
        docLifecycle: 'reserved',
        currentPath,
        aliases: [],
        sourceCaptureIds: [],
        createdAt: event.ts ?? Date.now(),
        updatedAt: event.ts ?? Date.now(),
      };
      break;
    }

    case 'doc.register': {
      const { topicId, role, currentPath, framework, mode, docLifecycle, aliases, sourceCaptureIds, docId } = payload;
      if (!topicId || !role || !currentPath) {
        throw new KnowledgeValidationError('doc.register requires topicId, role, and currentPath');
      }
      if (!view.topics[topicId]) {
        throw new KnowledgeValidationError(`doc.register: topicId "${topicId}" is not registered — run "fgos topic register" first`);
      }
      const lifecycle = docLifecycle ?? 'provisional';
      if (lifecycle === 'draft' || !VALID_DOC_LIFECYCLE.includes(lifecycle)) {
        throw new KnowledgeValidationError(`Invalid docLifecycle: '${lifecycle}'`);
      }
      const id = docId ?? `${topicId}:${role}`;
      if (lifecycle === 'active') {
        const activeDocs = getActiveDocs(view, topicId, role);
        if (activeDocs.length > 0 && activeDocs[0].docId !== id) {
          throw new KnowledgeValidationError(
            `activeDoc(${topicId}, ${role}) already exists: '${activeDocs[0].currentPath}'`
          );
        }
      }
      assertCurrentPathUnique(view, id, currentPath);
      const existing = view.docs[id];
      view.docs[id] = {
        docId: id,
        topicId,
        role,
        framework: framework ?? existing?.framework ?? 'diataxis',
        mode: mode ?? existing?.mode ?? 'explanation',
        docLifecycle: lifecycle,
        currentPath,
        aliases: Array.isArray(aliases) ? [...aliases] : (existing?.aliases ?? []),
        sourceCaptureIds: Array.isArray(sourceCaptureIds) ? [...sourceCaptureIds] : (existing?.sourceCaptureIds ?? []),
        createdAt: existing?.createdAt ?? event.ts ?? Date.now(),
        updatedAt: event.ts ?? Date.now(),
      };
      assertActiveDocCardinality(view, topicId, role);
      break;
    }

    case 'doc.mark-rendered': {
      const { docId, topicId, role } = payload;
      const id = docId ?? (topicId && role ? `${topicId}:${role}` : null);
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.mark-rendered: doc '${id}' not found`);
      }
      if (doc.docLifecycle === 'reserved') {
        doc.docLifecycle = 'provisional';
        doc.updatedAt = event.ts ?? Date.now();
      }
      break;
    }

    case 'doc.promote': {
      const { docId, topicId, role } = payload;
      const id = docId ?? (topicId && role ? `${topicId}:${role}` : null);
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.promote: doc '${id}' not found`);
      }
      if (doc.docLifecycle === 'reserved') {
        throw new KnowledgeValidationError(
          `doc.promote: cannot promote doc '${id}' from 'reserved' state (must mark-rendered/provisional first)`
        );
      }
      if (doc.docLifecycle !== 'provisional') {
        throw new KnowledgeValidationError(
          `doc.promote: doc '${id}' is in '${doc.docLifecycle}' state, must be 'provisional'`
        );
      }
      const activeDocs = getActiveDocs(view, doc.topicId, doc.role);
      if (activeDocs.length > 0 && activeDocs[0].docId !== id) {
        throw new KnowledgeValidationError(
          `doc.promote: activeDoc(${doc.topicId}, ${doc.role}) already exists: '${activeDocs[0].currentPath}'`
        );
      }
      doc.docLifecycle = 'active';
      doc.updatedAt = event.ts ?? Date.now();
      assertActiveDocCardinality(view, doc.topicId, doc.role);
      break;
    }

    case 'doc.supersede': {
      const { docId, topicId, role, supersededBy } = payload;
      const id = docId ?? (topicId && role ? `${topicId}:${role}` : null);
      const doc = view.docs[id];
      if (doc) {
        doc.docLifecycle = 'superseded';
        if (supersededBy) doc.supersededBy = supersededBy;
        doc.updatedAt = event.ts ?? Date.now();
      }
      break;
    }

    case 'doc.retire': {
      const { docId, topicId, role } = payload;
      const id = docId ?? (topicId && role ? `${topicId}:${role}` : null);
      const doc = view.docs[id];
      if (doc) {
        doc.docLifecycle = 'retired';
        doc.updatedAt = event.ts ?? Date.now();
      }
      break;
    }

    // docs/architect/knowledge-registry-redesign.md §7.4: "Attestation
    // links a capture to a document slot ... the precise replacement for
    // the old 'compound stores docType/docPath' meaning." Modeled as
    // accumulating into the SAME `sourceCaptureIds` field `doc.register`
    // already seeds from bootstrap (docs/architect/...md §7.2's own
    // example schema) -- one array of every capture that has ever
    // justified this doc's content, never overwritten, mirroring
    // `work.friction`'s own accumulate-never-replace fold rule.
    case 'doc.attest': {
      const { docId, topicId, role, captureId } = payload;
      const id = docId ?? (topicId && role ? `${topicId}:${role}` : null);
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.attest: doc '${id}' not found`);
      }
      if (!captureId || typeof captureId !== 'string' || !captureId.trim()) {
        throw new KnowledgeValidationError('doc.attest requires captureId');
      }
      if (!Array.isArray(doc.sourceCaptureIds)) doc.sourceCaptureIds = [];
      if (!doc.sourceCaptureIds.includes(captureId)) {
        doc.sourceCaptureIds.push(captureId);
      }
      doc.updatedAt = event.ts ?? Date.now();
      break;
    }

    case 'doc.path-move': {
      const { docId, topicId, role, newPath } = payload;
      const id = docId ?? (topicId && role ? `${topicId}:${role}` : null);
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.path-move: doc '${id}' not found`);
      }
      if (!newPath) {
        throw new KnowledgeValidationError('doc.path-move requires newPath');
      }
      assertCurrentPathUnique(view, id, newPath);
      if (doc.currentPath && doc.currentPath !== newPath && !doc.aliases.includes(doc.currentPath)) {
        doc.aliases.push(doc.currentPath);
      }
      doc.currentPath = newPath;
      doc.updatedAt = event.ts ?? Date.now();
      break;
    }

    default:
      break;
  }
}

/**
 * Fold knowledge events into a view object.
 */
export function foldKnowledgeEvents(events, seedView) {
  const view = seedView ? { ...seedView } : { topics: {}, docs: {} };
  if (!view.topics) view.topics = {};
  if (!view.docs) view.docs = {};

  for (const event of events) {
    if (event.type.startsWith('topic.') || event.type.startsWith('doc.')) {
      applyKnowledgeEvent(view, event);
    }
  }

  return { topics: view.topics, docs: view.docs };
}
