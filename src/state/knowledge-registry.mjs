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

// docs/architect/knowledge-registry-redesign.md §5.5/§14.1: only 'diataxis'
// is a registered framework today, and its 4 modes are a closed set --
// growing either list is a real product decision (a new writing framework,
// or a new Diataxis mode), never a typo a reducer should silently accept.
export const VALID_FRAMEWORKS = Object.freeze(['diataxis']);
export const DIATAXIS_MODES = Object.freeze(['tutorial', 'how-to', 'reference', 'explanation']);

/**
 * A doc is "live" (still the authoritative slot occupant) when it is
 * neither 'retired' nor 'superseded' -- doc.supersede already moved
 * "current" to supersededBy, so a superseded doc is excluded the same way
 * a retired one is, even though it isn't retired itself. This is the ONE
 * definition every reader of docLifecycle liveness shares: resolveDocId
 * below, src/report/knowledge-resolver.mjs's own resolution logic, and the
 * knowledge doctor checks in src/setup/registrations.mjs -- previously
 * re-implemented independently in each of those three places, free to
 * silently drift apart on a future lifecycle change.
 */
export function isLiveDocLifecycle(docLifecycle) {
  return docLifecycle !== 'retired' && docLifecycle !== 'superseded';
}

// A single safe path SEGMENT: no '/' or '\', can't start with '.' (rules
// out '.', '..', and hidden-file-style segments in one regex), non-empty.
// topicId/purposeSlug/role all become filesystem path segments downstream
// (scripts/knowledge-migration.mjs builds `docs/${purposeSlug}/${role}.md`
// directly from registry-accepted values) -- nothing before this validated
// that, so `purposeSlug: '../../evil'` or `role: '../escape'` reached the
// reducer, and from there the filesystem, unchecked.
const SAFE_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function assertSafeSlug(value, label) {
  if (typeof value !== 'string' || !SAFE_SLUG_RE.test(value)) {
    throw new KnowledgeValidationError(
      `${label} must be a safe single path segment (letters/digits, then letters/digits/./-/_, never '/', '\\', or starting with '.'): got ${JSON.stringify(value)}`
    );
  }
}

// A repo-relative doc path that must stay under docs/ -- rejects an
// absolute path, a backslash, and any '.'/'..'/empty path segment (the
// literal path-traversal shape: 'docs/../evil/guide.md',
// 'docs/ok/../escape.md'). Deliberately string-only (no `node:path`
// import) to keep this module's own "pure domain model" contract --
// normalizing '..' segments manually is enough to prove the path can never
// climb out of docs/, without adding a filesystem-adjacent dependency to a
// module that has none today.
function assertSafeDocPath(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new KnowledgeValidationError(`${label} must be a non-empty string`);
  }
  if (value.includes('\\')) {
    throw new KnowledgeValidationError(`${label} must not contain backslashes: got ${JSON.stringify(value)}`);
  }
  if (value.startsWith('/') || /^[A-Za-z]:/.test(value)) {
    throw new KnowledgeValidationError(`${label} must be repo-relative, never absolute: got ${JSON.stringify(value)}`);
  }
  if (!value.startsWith('docs/')) {
    throw new KnowledgeValidationError(`${label} must live under 'docs/': got ${JSON.stringify(value)}`);
  }
  const segments = value.split('/');
  if (segments.some((seg) => seg === '.' || seg === '..' || seg === '')) {
    throw new KnowledgeValidationError(`${label} must not contain '.', '..', or empty path segments: got ${JSON.stringify(value)}`);
  }
}

/**
 * Enforces the narrow, mechanical slice of the closed role/framework/mode
 * vocabulary that docs/architect/knowledge-registry-redesign.md §7.2 rule 1
 * already states unconditionally: framework must be a registered one, mode
 * must be one of that framework's own modes, and role must never equal a
 * mode name ("a role name must not equal any framework mode name"). This
 * does NOT enforce a closed set of *role* values -- that needs a registered
 * per-role vocabulary (meaning/defaultFramework/defaultMode/lifecyclePolicy
 * per §7.2) seeded from a real reclassification of the corpus, a product
 * decision beyond this mechanical guard's scope.
 */
function assertFrameworkModeRoleValid({ framework, mode, role }) {
  if (!VALID_FRAMEWORKS.includes(framework)) {
    throw new KnowledgeValidationError(
      `Invalid framework: '${framework}' — registered frameworks are: ${VALID_FRAMEWORKS.join(', ')}.`
    );
  }
  if (framework === 'diataxis') {
    if (!DIATAXIS_MODES.includes(mode)) {
      throw new KnowledgeValidationError(
        `Invalid mode: '${mode}' for framework 'diataxis' — valid modes are: ${DIATAXIS_MODES.join(', ')}.`
      );
    }
    if (DIATAXIS_MODES.includes(role)) {
      throw new KnowledgeValidationError(
        `Invalid role: '${role}' — a role name must not equal a Diataxis mode name (${DIATAXIS_MODES.join(', ')}).`
      );
    }
  }
}

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
 * Refuses a NEW docId for (topicId, role) while a different doc already
 * occupies that slot in a still-live state -- otherwise `doc.reserve`/
 * `doc.register` with distinct `--doc-id` values is an escape hatch around
 * `assertActiveDocCardinality` (which only ever looks at 'active' rows):
 * two 'provisional' docs for the same role would sail through unnoticed.
 * 'retired' and 'superseded' free the slot on purpose -- `doc.promote`'s own
 * error message tells callers to supersede the existing active doc before
 * registering its replacement, so a superseded row must not still block.
 * A second doc for the same role is only legitimate after `topic.split`
 * gives it a distinct topicId with real lineage.
 */
function assertDocSlotAvailable(view, id, topicId, role) {
  for (const doc of Object.values(view.docs)) {
    if (
      doc.docId !== id &&
      doc.topicId === topicId &&
      doc.role === role &&
      doc.docLifecycle !== 'retired' &&
      doc.docLifecycle !== 'superseded'
    ) {
      throw new KnowledgeValidationError(
        `doc slot (${topicId}, ${role}) is already occupied by doc '${doc.docId}' (${doc.docLifecycle}) — retire or supersede it first, or use "fgos topic split" to give the new doc its own topicId with lineage.`
      );
    }
  }
}

/**
 * Refuses a doc write targeting a topic whose status is 'retired' -- reserve/
 * register/mark-rendered/promote must never let a doc keep advancing under a
 * topic that was retired directly (`fgos topic retire`) while the doc itself
 * was left in place (unlike `topic.split`/`topic.merge`, which always move a
 * doc's own topicId onto a still-active successor as part of the same event,
 * so a doc can never be stranded under a retired topic through those paths).
 * doc.supersede/doc.retire/doc.path-move are exempt on purpose: those are
 * exit-lifecycle or physical-relocation operations, never new content.
 */
function assertTopicWritable(view, topicId, verb) {
  const topic = view.topics[topicId];
  if (topic && topic.status === 'retired') {
    throw new KnowledgeValidationError(
      `${verb}: topic '${topicId}' is retired — no new doc content may be written into a retired topic; migrate this doc to a live topic (via "fgos topic split"/"fgos topic merge") first.`
    );
  }
}

/**
 * Resolves a doc's identity from an explicit docId, or by searching for the
 * doc whose (topicId, role) match -- never by reconstructing `${topicId}:
 * ${role}` as a string. docId is a durable identity (docs/architect/
 * knowledge-registry-redesign.md §7.3) that topic.split intentionally never
 * rewrites even though it does move the doc's own topicId onto the successor
 * -- so a caller holding only (topicId, role) after a split must look the
 * doc up by field, or it silently misses every doc whose id predates the
 * split. When more than one doc shares (topicId, role) -- a live doc plus a
 * retired/superseded predecessor sharing the slot on purpose -- the live one
 * wins.
 */
export function resolveDocId(view, { docId, topicId, role }) {
  if (docId) return docId;
  if (!topicId || !role) return null;
  const matches = Object.values(view.docs).filter((d) => d.topicId === topicId && d.role === role);
  if (matches.length === 0) return null;
  const live = matches.find((d) => isLiveDocLifecycle(d.docLifecycle));
  return (live ?? matches[0]).docId;
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
      assertSafeSlug(topicId, 'topic.register: topicId');
      assertSafeSlug(purposeSlug, 'topic.register: purposeSlug');
      if (view.topics[topicId]) {
        throw new KnowledgeValidationError(
          `topic.register: topic '${topicId}' already exists (${view.topics[topicId].status}) — register is create-only; use "fgos topic rename"/"fgos topic split"/"fgos topic merge" to change an existing topic.`
        );
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
      if (newPurposeSlug) {
        assertSafeSlug(newPurposeSlug, 'topic.rename: newPurposeSlug');
        topic.purposeSlug = newPurposeSlug;
      }
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
      if (oldTopic.status !== 'active') {
        throw new KnowledgeValidationError(`topic.split: source topic '${topicId}' is '${oldTopic.status}', must be 'active'`);
      }
      if (!Array.isArray(newTopics) || newTopics.length < 2) {
        throw new KnowledgeValidationError('topic.split requires at least 2 successor topics -- a single-successor split is a rename ("fgos topic rename"), not a split');
      }

      // Validate the WHOLE newTopics array before mutating anything: a
      // successor id equal to the source would un-retire the source topic
      // right after this case retires it (and its lineage.splitFrom would
      // point at itself); a successor id repeated within one split call
      // means only the last one's metadata survives, silently discarding
      // the others'; a successor id that already names an existing topic
      // (active or retired) would silently overwrite that topic's own
      // history/status.
      const seenSuccessors = new Set();
      for (const nt of newTopics) {
        const newTopicId = nt?.topicId;
        if (!newTopicId || !nt?.purposeSlug) {
          throw new KnowledgeValidationError('topic.split new topic requires topicId and purposeSlug');
        }
        assertSafeSlug(newTopicId, 'topic.split: successor topicId');
        assertSafeSlug(nt.purposeSlug, 'topic.split: successor purposeSlug');
        if (newTopicId === topicId) {
          throw new KnowledgeValidationError(`topic.split: successor topicId '${newTopicId}' cannot equal the source topicId`);
        }
        if (seenSuccessors.has(newTopicId)) {
          throw new KnowledgeValidationError(`topic.split: successor topicId '${newTopicId}' listed more than once in newTopics`);
        }
        seenSuccessors.add(newTopicId);
        if (view.topics[newTopicId]) {
          throw new KnowledgeValidationError(`topic.split: successor topicId '${newTopicId}' already exists (${view.topics[newTopicId].status}) -- topic ids are create-only`);
        }
      }

      // Every LIVE doc under the source topic must land under exactly one
      // successor via rolesToMove -- checked BEFORE any mutation, same
      // fail-nothing-mutates discipline as the successor checks above.
      // Without this: a role missing from every successor's rolesToMove
      // stays on the OLD topicId, which this case is about to retire --
      // stranding a live doc under a retired topic, the exact invariant
      // this whole item's other fixes (doc.demote's assertTopicWritable,
      // migration's topic-liveness preflight) already treat as a real
      // problem. A role listed in MORE than one successor's rolesToMove
      // would silently land the doc under whichever successor processes
      // last, discarding the caller's real intent with no error.
      const liveDocsUnderSource = Object.values(view.docs).filter(
        (d) => d.topicId === topicId && isLiveDocLifecycle(d.docLifecycle)
      );
      const roleAssignedTo = new Map();
      for (const nt of newTopics) {
        if (!Array.isArray(nt.rolesToMove)) continue;
        for (const role of nt.rolesToMove) {
          if (roleAssignedTo.has(role)) {
            throw new KnowledgeValidationError(
              `topic.split: role '${role}' is listed in more than one successor's rolesToMove (both '${roleAssignedTo.get(role)}' and '${nt.topicId}') -- a role can only move to exactly one successor`
            );
          }
          roleAssignedTo.set(role, nt.topicId);
        }
      }
      const strandedDocs = liveDocsUnderSource.filter((d) => !roleAssignedTo.has(d.role));
      if (strandedDocs.length > 0) {
        throw new KnowledgeValidationError(
          `topic.split: ${strandedDocs.length} live doc(s) under source topic '${topicId}' are not assigned to any successor's rolesToMove (${strandedDocs.map((d) => `${d.docId} (role '${d.role}')`).join(', ')}) -- every live doc must move to a successor, or be explicitly retired/superseded first`
        );
      }

      // Mark old topic as retired
      oldTopic.status = 'retired';
      oldTopic.updatedAt = event.ts ?? Date.now();

      const oldDocs = Object.values(view.docs).filter((d) => d.topicId === topicId);

      for (const nt of newTopics) {
        const { topicId: newTopicId, purposeSlug, purposeTitle, entities, rolesToMove } = nt;
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
      if (targetTopic.status !== 'active') {
        throw new KnowledgeValidationError(`topic.merge: target topic '${targetTopicId}' is '${targetTopic.status}', must be 'active'`);
      }

      // Fail-closed on the source list itself before the role-collision check
      // or any mutation: a source equal to targetTopicId means srcTopic and
      // targetTopic are the SAME object below, so the mutation loop would
      // retire the target right after giving it a lineage.mergedFrom entry
      // pointing at itself; a source that doesn't exist would otherwise be
      // silently recorded into lineage.mergedFrom by the spread below without
      // ever being retired or moving any docs; a non-active source (already
      // retired, or mid-merge as some other merge's own target) means its
      // docs were already supposed to have moved elsewhere.
      const seenSources = new Set();
      for (const sId of sourceTopicIds) {
        if (sId === targetTopicId) {
          throw new KnowledgeValidationError(`topic.merge: source '${sId}' cannot equal targetTopicId`);
        }
        if (seenSources.has(sId)) {
          throw new KnowledgeValidationError(`topic.merge: source '${sId}' listed more than once in sourceTopicIds`);
        }
        seenSources.add(sId);
        const srcTopic = view.topics[sId];
        if (!srcTopic) {
          throw new KnowledgeValidationError(`topic.merge: source topic '${sId}' not found`);
        }
        if (srcTopic.status !== 'active') {
          throw new KnowledgeValidationError(`topic.merge: source topic '${sId}' is '${srcTopic.status}', must be 'active'`);
        }
      }

      // Validate BEFORE mutating anything: merge moves doc.topicId directly,
      // never through doc.register's own assertDocSlotAvailable check, so
      // this is the only place a merge's own (targetTopicId, role) collision
      // gets caught. A whole-merge failure here (nothing mutated yet) beats
      // silently landing two live docs on the same role.
      const roleOccupants = new Map();
      for (const doc of Object.values(view.docs)) {
        if (doc.docLifecycle === 'retired' || doc.docLifecycle === 'superseded') continue;
        if (doc.topicId !== targetTopicId && !sourceTopicIds.includes(doc.topicId)) continue;
        const priorDocId = roleOccupants.get(doc.role);
        if (priorDocId && priorDocId !== doc.docId) {
          throw new KnowledgeValidationError(
            `topic.merge: role '${doc.role}' would have two live docs under target '${targetTopicId}' after merge ('${priorDocId}' and '${doc.docId}') — supersede or retire one first.`
          );
        }
        roleOccupants.set(doc.role, doc.docId);
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
      if (!topic) {
        throw new KnowledgeValidationError(`topic.retire: topic '${topicId}' not found`);
      }
      topic.status = 'retired';
      topic.updatedAt = event.ts ?? Date.now();
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
      assertSafeSlug(role, 'doc.reserve: role');
      assertSafeDocPath(currentPath, 'doc.reserve: currentPath');
      assertTopicWritable(view, topicId, 'doc.reserve');
      const resolvedFramework = framework ?? 'diataxis';
      const resolvedMode = mode ?? 'explanation';
      assertFrameworkModeRoleValid({ framework: resolvedFramework, mode: resolvedMode, role });
      const id = docId ?? `${topicId}:${role}`;
      if (view.docs[id]) {
        throw new KnowledgeValidationError(
          `doc.reserve: doc '${id}' already exists (${view.docs[id].docLifecycle}) — reserve is create-only; use "fgos doc register" for an explicit update.`
        );
      }
      assertDocSlotAvailable(view, id, topicId, role);
      assertCurrentPathUnique(view, id, currentPath);
      view.docs[id] = {
        docId: id,
        topicId,
        role,
        framework: resolvedFramework,
        mode: resolvedMode,
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
      assertSafeSlug(role, 'doc.register: role');
      assertSafeDocPath(currentPath, 'doc.register: currentPath');
      assertTopicWritable(view, topicId, 'doc.register');
      const id = docId ?? `${topicId}:${role}`;
      const existing = view.docs[id];
      if (existing && (existing.topicId !== topicId || existing.role !== role || existing.currentPath !== currentPath)) {
        throw new KnowledgeValidationError(
          `doc.register: doc '${id}' already exists with topicId='${existing.topicId}', role='${existing.role}', currentPath='${existing.currentPath}' — register cannot change a doc's identity or path. Use "fgos topic split"/"fgos topic merge" to change topicId/role (with lineage), or "fgos doc move-path" to change currentPath (preserves the old path as an alias).`
        );
      }
      // docs/architect/knowledge-registry-redesign.md §7.3: doc.promote is
      // the sole provisional->active gate, doc.supersede/doc.retire are the
      // sole way out of 'active'. Re-registering an EXISTING docId must
      // never itself move the lifecycle beyond one narrow, already-tested
      // bridge: defaulting to 'provisional' on a bare re-register (no
      // --lifecycle given) would silently demote an already-'active' doc,
      // and accepting an arbitrary explicit docLifecycle would resurrect a
      // 'retired'/'superseded' doc back to 'active' through this side door.
      // The one legitimate register-driven transition is 'reserved' ->
      // 'provisional': "doc reserve" creates the empty slot, "doc register"
      // with real content is how that slot gets its first draft, and that
      // flow is exercised end-to-end by knowledge-verbs/knowledge-attest-
      // gate tests. Anything else -- an explicit lifecycle that disagrees
      // with the current one, outside that one bridge -- is refused.
      let lifecycle;
      if (existing) {
        if (docLifecycle === undefined || docLifecycle === existing.docLifecycle) {
          lifecycle = existing.docLifecycle;
        } else if (existing.docLifecycle === 'reserved' && docLifecycle === 'provisional') {
          lifecycle = 'provisional';
        } else {
          throw new KnowledgeValidationError(
            `doc.register: doc '${id}' already exists with docLifecycle='${existing.docLifecycle}' — register cannot change lifecycle to '${docLifecycle}'; use "fgos doc promote"/"fgos doc supersede"/"fgos doc retire" instead.`
          );
        }
      } else {
        lifecycle = docLifecycle ?? 'provisional';
        if (lifecycle === 'draft' || !VALID_DOC_LIFECYCLE.includes(lifecycle)) {
          throw new KnowledgeValidationError(`Invalid docLifecycle: '${lifecycle}'`);
        }
      }
      const resolvedFramework = framework ?? existing?.framework ?? 'diataxis';
      const resolvedMode = mode ?? existing?.mode ?? 'explanation';
      assertFrameworkModeRoleValid({ framework: resolvedFramework, mode: resolvedMode, role });
      if (lifecycle === 'active') {
        const activeDocs = getActiveDocs(view, topicId, role);
        if (activeDocs.length > 0 && activeDocs[0].docId !== id) {
          throw new KnowledgeValidationError(
            `activeDoc(${topicId}, ${role}) already exists: '${activeDocs[0].currentPath}'`
          );
        }
      }
      assertDocSlotAvailable(view, id, topicId, role);
      assertCurrentPathUnique(view, id, currentPath);
      view.docs[id] = {
        docId: id,
        topicId,
        role,
        framework: resolvedFramework,
        mode: resolvedMode,
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
      const id = resolveDocId(view, { docId, topicId, role });
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.mark-rendered: doc '${id}' not found`);
      }
      assertTopicWritable(view, doc.topicId, 'doc.mark-rendered');
      if (doc.docLifecycle !== 'reserved') {
        throw new KnowledgeValidationError(
          `doc.mark-rendered: doc '${id}' is '${doc.docLifecycle}', must be 'reserved'`
        );
      }
      doc.docLifecycle = 'provisional';
      doc.updatedAt = event.ts ?? Date.now();
      break;
    }

    case 'doc.promote': {
      const { docId, topicId, role } = payload;
      const id = resolveDocId(view, { docId, topicId, role });
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.promote: doc '${id}' not found`);
      }
      assertTopicWritable(view, doc.topicId, 'doc.promote');
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

    // docs/architect/knowledge-registry-redesign.md §13.5 rule 6: migration
    // "leaves every migrated document provisional unless explicitly
    // promoted" -- an active doc whose content moved out from under it
    // needs re-verification before it counts as authoritative again, but
    // nothing in the reducer could legitimately move active -> provisional
    // before this event existed (doc.register's own lifecycle guard
    // deliberately refuses that exact transition as a silent-demote
    // vector). doc.demote is the explicit, auditable door for it -- the
    // mirror image of doc.promote, never inferred from any other event.
    case 'doc.demote': {
      const { docId, topicId, role } = payload;
      const id = resolveDocId(view, { docId, topicId, role });
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.demote: doc '${id}' not found`);
      }
      assertTopicWritable(view, doc.topicId, 'doc.demote');
      if (doc.docLifecycle !== 'active') {
        throw new KnowledgeValidationError(
          `doc.demote: doc '${id}' is '${doc.docLifecycle}', must be 'active'`
        );
      }
      doc.docLifecycle = 'provisional';
      doc.updatedAt = event.ts ?? Date.now();
      break;
    }

    case 'doc.supersede': {
      const { docId, topicId, role, supersededBy } = payload;
      const id = resolveDocId(view, { docId, topicId, role });
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.supersede: doc '${id}' not found`);
      }
      // supersededBy is a lineage pointer other readers (the resolver's
      // fallback, doctors, end-user doc indexing) can follow forward from a
      // dead doc to its replacement -- an unvalidated value (a docId that
      // doesn't exist, points back at itself, or points at another already-
      // dead doc) would corrupt that lineage silently instead of failing at
      // write time where the mistake is still cheap to catch.
      if (supersededBy) {
        if (supersededBy === id) {
          throw new KnowledgeValidationError(`doc.supersede: doc '${id}' cannot be supersededBy itself`);
        }
        const successor = view.docs[supersededBy];
        if (!successor) {
          throw new KnowledgeValidationError(`doc.supersede: supersededBy doc '${supersededBy}' not found`);
        }
        if (successor.docLifecycle === 'retired' || successor.docLifecycle === 'superseded') {
          throw new KnowledgeValidationError(
            `doc.supersede: supersededBy doc '${supersededBy}' is '${successor.docLifecycle}' — must be a live doc, not another dead one`
          );
        }
        doc.supersededBy = supersededBy;
      }
      doc.docLifecycle = 'superseded';
      doc.updatedAt = event.ts ?? Date.now();
      break;
    }

    case 'doc.retire': {
      const { docId, topicId, role } = payload;
      const id = resolveDocId(view, { docId, topicId, role });
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.retire: doc '${id}' not found`);
      }
      doc.docLifecycle = 'retired';
      doc.updatedAt = event.ts ?? Date.now();
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
      const id = resolveDocId(view, { docId, topicId, role });
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.attest: doc '${id}' not found`);
      }
      // docs/architect/knowledge-registry-redesign.md §14.3: "attestation
      // rejects retired topics and retired documents". This must live here,
      // in the reducer, not only in the CLI's resolveDocPath-based
      // pre-check -- any caller using the write facade directly (attest-
      // DocStore) would otherwise bypass that check entirely. 'superseded'
      // is rejected the same way retired is: a superseded doc is no longer
      // the authoritative slot occupant (doc.supersede already moved that
      // role to supersededBy), so a capture attested here would silently
      // attach to a doc nothing points at as current anymore.
      if (doc.docLifecycle === 'retired' || doc.docLifecycle === 'superseded') {
        throw new KnowledgeValidationError(`doc.attest: doc '${id}' is ${doc.docLifecycle}`);
      }
      assertTopicWritable(view, doc.topicId, 'doc.attest');
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
      const id = resolveDocId(view, { docId, topicId, role });
      const doc = view.docs[id];
      if (!doc) {
        throw new KnowledgeValidationError(`doc.path-move: doc '${id}' not found`);
      }
      if (!newPath) {
        throw new KnowledgeValidationError('doc.path-move requires newPath');
      }
      assertSafeDocPath(newPath, 'doc.path-move: newPath');
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
