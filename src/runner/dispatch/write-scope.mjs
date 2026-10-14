// src/runner/dispatch/write-scope.mjs — the one reader of a declared write scope.
// Every consumer that asks "may this run touch that path?" (staging a commit, attribution coverage,
// out-of-scope reporting) answers through matchesWriteScope here; git never interprets a scope.
// Leaf module (kernel layer, like rigor.mjs): knows nothing about Units or Work and imports nothing,
// so workflow definitions, the unit contract and dispatch can all share it.

/** A scope entry or generated-path mapping that cannot be read one way only. */
export class WriteScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WriteScopeError';
  }
}

/** The run-state store is never inside any declared scope, even a bare `**`. */
const STORE_DIR = '.fgos';

const hasGlob = (segment) => segment.includes('*');

/**
 * Canonical spelling of one write entry: `./docs`, `docs/`, `docs//` and `docs` are one entry.
 * Only `*` (within one segment) and `**` (a whole segment: zero or more segments) are glob;
 * every other character, `[ ] { } ! ? ( )` included, is literal.
 */
export function canonicalizeWriteEntry(raw) {
  if (typeof raw !== 'string') {
    throw new WriteScopeError(`write entry must be a string, got: ${JSON.stringify(raw)}.`);
  }
  const trimmed = raw.trim();
  const show = JSON.stringify(raw);
  if (trimmed.startsWith('/')) throw new WriteScopeError(`write entry must be repo-relative, got absolute path ${show}.`);
  if (trimmed.includes('\\') || trimmed.includes('\0')) {
    throw new WriteScopeError(`write entry must not contain a backslash or NUL byte, got: ${show}.`);
  }
  const segments = trimmed.split('/').filter((segment) => segment !== '' && segment !== '.')
    // Consecutive ** say nothing more than one, and each extra one multiplies matching work.
    .filter((segment, i, all) => !(segment === '**' && all[i - 1] === '**'));
  if (segments.length === 0) throw new WriteScopeError(`write entry must name a path inside the repo, got: ${show}.`);
  if (segments.includes('..')) throw new WriteScopeError(`write entry must not contain a ".." segment, got: ${show}.`);
  if (segments[0].startsWith(':')) {
    throw new WriteScopeError(`write entry must not start with ":" (git pathspec magic), got: ${show}.`);
  }
  const looseDoubleStar = segments.find((segment) => segment.includes('**') && segment !== '**');
  if (looseDoubleStar) {
    throw new WriteScopeError(`"**" must be a whole path segment, got segment ${JSON.stringify(looseDoubleStar)} in ${show}.`);
  }
  const joined = segments.join('/');
  // `docs /` joins to `docs `; read it again so the canonical form is a fixed point.
  return joined === joined.trim() ? joined : canonicalizeWriteEntry(joined);
}

/** Canonicalizes every entry, drops duplicates, keeps first-seen order. */
export function canonicalizeWrites(list) {
  if (!Array.isArray(list)) throw new WriteScopeError('writes must be an array of repo-relative paths.');
  const seen = new Set();
  const out = [];
  list.forEach((raw, index) => {
    let entry;
    try {
      entry = canonicalizeWriteEntry(raw);
    } catch (err) {
      throw new WriteScopeError(`writes[${index}]: ${err.message}`);
    }
    if (!seen.has(entry)) {
      seen.add(entry);
      out.push(entry);
    }
  });
  return out;
}

/** Leading segments before the first one carrying a glob; '' when the entry starts with one. */
function literalPrefix(entry) {
  const segments = entry.split('/');
  const firstGlob = segments.findIndex(hasGlob);
  return (firstGlob === -1 ? segments : segments.slice(0, firstGlob)).join('/');
}

/** True when one literal path encloses the other (either way), by whole segments. */
function literalsOverlap(a, b) {
  if (a === '' || b === '' || a === b) return true;
  return a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

/**
 * Widens a scope with the render targets of generated sources it touches: an entry whose literal
 * part lies inside a mapping's `from` literal (or encloses it) gains that mapping's `also` entries.
 * Coarse on purpose: a skill source edit pulls in every render tree, not the one rendered file.
 */
export function expandGenerated(writes, generatedPaths = []) {
  const scope = canonicalizeWrites(writes);
  const added = [];
  for (const mapping of generatedPaths) {
    const fromLiteral = literalPrefix(canonicalizeWriteEntry(mapping.from));
    if (scope.some((entry) => literalsOverlap(literalPrefix(entry), fromLiteral))) {
      added.push(...mapping.also);
    }
  }
  return canonicalizeWrites([...scope, ...added]);
}

function segmentRegex(segment) {
  const body = segment.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*');
  return new RegExp(`^${body}$`, 'u');
}

/** Whole-path glob match; memoized by position so stacked ** stay polynomial. */
function globMatches(patternSegments, pathSegments) {
  const regexes = patternSegments.map((segment) => (segment === '**' ? null : segmentRegex(segment)));
  const memo = new Map();
  const at = (p, s) => {
    const key = p * (pathSegments.length + 1) + s;
    if (memo.has(key)) return memo.get(key);
    let result;
    if (p === patternSegments.length) result = s === pathSegments.length;
    else if (regexes[p] === null) result = at(p + 1, s) || (s < pathSegments.length && at(p, s + 1));
    else result = s < pathSegments.length && regexes[p].test(pathSegments[s]) && at(p + 1, s + 1);
    memo.set(key, result);
    return result;
  };
  return at(0, 0);
}

/**
 * Whether a repo-relative path lies in a scope. Scope entries are read canonically (an entry that
 * cannot be read throws). A plain entry covers the path itself and everything beneath it; a glob
 * entry must match the whole path. A queried path that is absolute, escapes with `..`, or carries
 * a backslash or NUL never matches; nothing under `.fgos` ever matches.
 */
export function matchesWriteScope(relPath, scope) {
  if (typeof relPath !== 'string' || relPath.startsWith('/') || relPath.includes('\\') || relPath.includes('\0')) {
    return false;
  }
  const pathSegments = relPath.split('/').filter((segment) => segment !== '' && segment !== '.');
  if (pathSegments.length === 0 || pathSegments.includes('..') || pathSegments[0] === STORE_DIR) return false;
  const normalized = pathSegments.join('/');
  return scope.some((raw) => {
    const entry = canonicalizeWriteEntry(raw);
    if (!hasGlob(entry)) return normalized === entry || normalized.startsWith(`${entry}/`);
    return globMatches(entry.split('/'), pathSegments);
  });
}

export function partitionPaths(paths, scope) {
  const inScope = [];
  const outOfScope = [];
  for (const relPath of paths) (matchesWriteScope(relPath, scope) ? inScope : outOfScope).push(relPath);
  return { inScope, outOfScope };
}
