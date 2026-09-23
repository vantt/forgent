// Immutable, schema-3 DAG declaration.  This deliberately contains no
// scheduler state: it is the durable request identity from which replay can
// derive facts using the pre-existing Assignment/Run/session evidence.
import { createHash } from 'node:crypto';

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
