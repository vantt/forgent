// Immutable, schema-3 DAG declaration.  This deliberately contains no
// scheduler state: it is the durable request identity from which replay can
// derive facts using the pre-existing Assignment/Run/session evidence.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CoordinationError } from './schema.mjs';

export const DAG_DECLARATION_VERSION = '1';

function fail(reason) {
  const error = new Error(`invalid DAG declaration: ${reason}`);
  error.code = 'invalid-dag-declaration';
  throw error;
}

function plain(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`);
  return value;
}

// JSON has no semantic object-key ordering.  Canonicalizing it here makes the
// fingerprint stable for equivalent requests while retaining node/dependency
// order, which is an explicit part of immutable DAG identity.
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (plain(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  if (typeof value === 'number' && !Number.isFinite(value)) fail('semantics must contain only finite JSON numbers');
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  fail('semantics must be JSON data');
}

function digest(value) {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

export function normalizeDagDeclaration(input) {
  if (!plain(input)) fail('must be an object');
  if (input.version !== undefined && input.version !== DAG_DECLARATION_VERSION) fail(`version must be "${DAG_DECLARATION_VERSION}"`);
  if (!Array.isArray(input.nodes) || input.nodes.length === 0) fail('nodes must be a non-empty array');
  const continuationPolicy = input.continuationPolicy ?? { mode: 'explicit-contract-required' };
  if (!plain(continuationPolicy) || continuationPolicy.mode !== 'explicit-contract-required' || Object.keys(continuationPolicy).length !== 1) {
    fail('continuationPolicy must be exactly { mode: "explicit-contract-required" }');
  }
  const ids = new Set();
  const nodes = input.nodes.map((node, index) => {
    if (!plain(node) || Object.keys(node).some((key) => !['id', 'displayLabel', 'semantics', 'dependsOn'].includes(key))) fail(`nodes[${index}] has unknown fields`);
    const id = text(node.id, `nodes[${index}].id`);
    const displayLabel = text(node.displayLabel, `nodes[${index}].displayLabel`);
    if (id === displayLabel) fail(`nodes[${index}] identity must be distinct from its displayLabel`);
    if (ids.has(id)) fail(`duplicate node identity "${id}"`);
    ids.add(id);
    if (!plain(node.semantics)) fail(`nodes[${index}].semantics must be an object`);
    if (!Array.isArray(node.dependsOn) || !node.dependsOn.every((dependency) => typeof dependency === 'string' && dependency.trim() !== '')) {
      fail(`nodes[${index}].dependsOn must be an array of non-empty strings`);
    }
    return { id, displayLabel, semantics: canonicalize(node.semantics), dependsOn: [...node.dependsOn] };
  });
  for (const node of nodes) {
    for (const dependency of node.dependsOn) {
      if (!ids.has(dependency) || dependency === node.id) fail(`node "${node.id}" has an unknown or self dependency "${dependency}"`);
    }
  }
  // A declaration is a DAG, not merely a graph with dependency-shaped
  // edges.  Reject the whole cycle before writing immutable identity.
  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visit = (id) => {
    if (visiting.has(id)) fail(`dependency cycle includes node "${id}"`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).dependsOn) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const node of nodes) visit(node.id);
  const normalized = { version: DAG_DECLARATION_VERSION, nodes, continuationPolicy: { mode: continuationPolicy.mode } };
  return Object.freeze({ ...normalized, requestFingerprint: digest(normalized) });
}

/**
 * Derives the authoritative settled assignment IDs from the session's event stream.
 * Invariant §8.2: An assignment is only settled if its latest result-linked event
 * is authoritative (i.e. not superseded by a subsequent run-retried event).
 *
 * @param {Iterable<{type: string, payload?: object}>} events
 * @returns {Set<string>}
 */
export function getAuthoritativeSettledAssignmentIds(events) {
  const settled = new Set();
  if (!events) return settled;
  for (const event of events) {
    if (event.type === 'result-linked' && event.payload?.assignmentId) {
      settled.add(event.payload.assignmentId);
    } else if (event.type === 'run-retried' && event.payload?.assignmentId) {
      settled.delete(event.payload.assignmentId);
    }
  }
  return settled;
}

/**
 * Computes whether two nodes in declaredNodes are concurrent (neither is an ancestor of the other).
 */
export function areNodesConcurrent(nodeA, nodeB, declaredNodes) {
  const reachableFrom = (startId) => {
    const visited = new Set();
    const queue = [startId];
    while (queue.length > 0) {
      const currId = queue.shift();
      const currNode = declaredNodes.find((n) => n.id === currId);
      if (currNode && Array.isArray(currNode.dependsOn)) {
        for (const depId of currNode.dependsOn) {
          if (!visited.has(depId)) {
            visited.add(depId);
            queue.push(depId);
          }
        }
      }
    }
    return visited;
  };

  const aDeps = reachableFrom(nodeA.id);
  if (aDeps.has(nodeB.id)) return false;

  const bDeps = reachableFrom(nodeB.id);
  if (bDeps.has(nodeA.id)) return false;

  return true;
}

/**
 * Computes shared-cwd attribution caveats for read-only concurrent DAG nodes.
 *
 * @param {object} params
 * @param {Array<object>} params.declaredNodes
 * @param {Map<string, string>|Function} params.getNodeCwd
 * @returns {Map<string, object>}
 */
export function computeDagSharedCwdCaveats({ declaredNodes, getNodeCwd }) {
  const caveats = new Map();
  const getCwd = typeof getNodeCwd === 'function' ? getNodeCwd : (id) => getNodeCwd?.get(id);

  for (const node of declaredNodes) {
    const isReadOnly = (node.semantics?.mutation ?? 'read-only') === 'read-only';
    if (!isReadOnly) continue;
    const canonicalCwd = getCwd(node.id);
    if (!canonicalCwd) continue;

    const peerNodeIds = declaredNodes
      .filter(
        (other) =>
          other.id !== node.id &&
          (other.semantics?.mutation ?? 'read-only') === 'read-only' &&
          getCwd(other.id) === canonicalCwd &&
          areNodesConcurrent(node, other, declaredNodes),
      )
      .map((other) => other.id);

    const explicitPeers = Array.isArray(node.semantics?.peerNodeIds) ? node.semantics.peerNodeIds : [];
    const implicitPeers = declaredNodes
      .filter((o) => o.id !== node.id && Array.isArray(o.semantics?.peerNodeIds) && o.semantics.peerNodeIds.includes(node.id))
      .map((o) => o.id);

    const allPeerNodeIds = Array.from(new Set([...peerNodeIds, ...explicitPeers, ...implicitPeers]));

    const hasExplicitCaveat = Boolean(
      node.semantics?.sharedCwdVerdictCaveat ||
      node.semantics?.sharedCwdCaveat ||
      node.semantics?.caveat ||
      node.semantics?.hasCaveat,
    );

    if (allPeerNodeIds.length > 0 || hasExplicitCaveat) {
      caveats.set(node.id, {
        canonicalCwd,
        peerNodeIds: allPeerNodeIds,
        recheckRequired: true,
        status: 'recheck-required',
        verdict: 'non-attributable',
        reason: 'concurrent read-only nodes sharing cwd carry non-attributable-verdict caveats',
      });
    }
  }
  return caveats;
}

/**
 * Resolves the canonical working directory for a DAG node.
 * Checks node semantics (canonicalCwd / cwd), existing assignment runs on disk
 * (prioritizing the authoritative result-linked run, then numerically latest attempt),
 * and falls back to defaultCwd or null.
 *
 * @param {object} node
 * @param {Array<object|string>|object} [arg2=[]] - nodeAssignments or options object
 * @param {string} [arg3=null] - fgosDir
 * @param {string} [arg4=null] - defaultCwd
 * @param {object} [arg5={}] - extra options: { events, results, linkedRunMap }
 * @returns {string|null}
 */
export function resolveNodeCwd(node, arg2 = [], arg3 = null, arg4 = null, arg5 = {}) {
  let nodeAssignments = [];
  let fgosDir = null;
  let defaultCwd = null;
  let events = null;
  let results = null;
  let linkedRunMap = null;

  if (Array.isArray(arg2)) {
    nodeAssignments = arg2;
    fgosDir = arg3;
    defaultCwd = arg4;
    if (arg5 && typeof arg5 === 'object') {
      events = arg5.events ?? null;
      results = arg5.results ?? null;
      linkedRunMap = arg5.linkedRunMap ?? null;
    }
  } else if (arg2 && typeof arg2 === 'object') {
    nodeAssignments = arg2.nodeAssignments ?? [];
    fgosDir = arg2.fgosDir ?? null;
    defaultCwd = arg2.defaultCwd ?? null;
    events = arg2.events ?? null;
    results = arg2.results ?? null;
    linkedRunMap = arg2.linkedRunMap ?? null;
  }

  if (typeof node?.semantics?.canonicalCwd === 'string' && node.semantics.canonicalCwd.trim() !== '') {
    return path.resolve(node.semantics.canonicalCwd);
  }
  if (typeof node?.semantics?.cwd === 'string' && node.semantics.cwd.trim() !== '') {
    return path.resolve(node.semantics.cwd);
  }

  const asgnIds = (Array.isArray(nodeAssignments) ? nodeAssignments : [])
    .map((a) => (typeof a === 'string' ? a : a?.assignmentId || a?.id))
    .filter(Boolean);

  if (fgosDir && asgnIds.length > 0) {
    for (const asgnId of [...asgnIds].reverse()) {
      let linkedRunId = null;
      if (linkedRunMap && typeof linkedRunMap.get === 'function') {
        linkedRunId = linkedRunMap.get(asgnId);
      }
      if (!linkedRunId && Array.isArray(results)) {
        for (let i = results.length - 1; i >= 0; i--) {
          if (results[i].assignmentId === asgnId && results[i].runId) {
            linkedRunId = results[i].runId;
            break;
          }
        }
      }
      if (!linkedRunId && Array.isArray(events)) {
        for (let i = events.length - 1; i >= 0; i--) {
          const ev = events[i];
          if (ev.type === 'result-linked' && ev.payload?.assignmentId === asgnId && ev.payload?.runId) {
            linkedRunId = ev.payload.runId;
            break;
          }
        }
      }

      if (linkedRunId) {
        const prefix = `run_${asgnId}_`;
        const attempt = linkedRunId.startsWith(prefix) ? linkedRunId.slice(prefix.length) : linkedRunId;
        const runJsonPath = path.join(fgosDir, 'assignments', asgnId, 'runs', attempt, 'run.json');
        if (fs.existsSync(runJsonPath)) {
          let run;
          try {
            run = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
          } catch (err) {
            throw new CoordinationError(
              'corrupt-log',
              `corrupt run.json for assignment "${asgnId}" attempt "${attempt}": ${err.message}`,
            );
          }
          if (typeof run?.cwd === 'string' && run.cwd.trim() !== '') {
            return path.resolve(run.cwd);
          }
        }
      } else {
        const runsDir = path.join(fgosDir, 'assignments', asgnId, 'runs');
        if (fs.existsSync(runsDir)) {
          let attempts;
          try {
            attempts = fs.readdirSync(runsDir);
          } catch (err) {
            throw new CoordinationError(
              'corrupt-log',
              `failed to read runs directory for assignment "${asgnId}": ${err.message}`,
            );
          }
          attempts.sort((a, b) => {
            const numA = Number(a);
            const numB = Number(b);
            if (Number.isFinite(numA) && Number.isFinite(numB)) {
              return numA - numB;
            }
            return String(a).localeCompare(String(b));
          });
          for (const attempt of attempts.reverse()) {
            const runJsonPath = path.join(runsDir, attempt, 'run.json');
            if (fs.existsSync(runJsonPath)) {
              let run;
              try {
                run = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
              } catch (err) {
                throw new CoordinationError(
                  'corrupt-log',
                  `corrupt run.json for assignment "${asgnId}" attempt "${attempt}": ${err.message}`,
                );
              }
              if (typeof run?.cwd === 'string' && run.cwd.trim() !== '') {
                return path.resolve(run.cwd);
              }
            }
          }
        }
      }
    }
  }

  if (defaultCwd) {
    return path.resolve(defaultCwd);
  }
  return null;
}
