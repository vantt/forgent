// src/runner/dispatch/write-scope.mjs — the one reader of a declared write scope.
// Every consumer that asks "may this run touch that path?" (staging a commit, attribution coverage,
// out-of-scope reporting) answers through matchesWriteScope here; git never interprets a scope.
// Leaf module: knows nothing about Units or Work, imports nothing from the runner.

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
  const segments = trimmed.split('/').filter((segment) => segment !== '' && segment !== '.');
  if (segments.length === 0) throw new WriteScopeError(`write entry must name a path inside the repo, got: ${show}.`);
  if (segments.includes('..')) throw new WriteScopeError(`write entry must not contain a ".." segment, got: ${show}.`);
  if (segments[0].startsWith(':')) {
    throw new WriteScopeError(`write entry must not start with ":" (git pathspec magic), got: ${show}.`);
  }
  const looseDoubleStar = segments.find((segment) => segment.includes('**') && segment !== '**');
  if (looseDoubleStar) {
    throw new WriteScopeError(`"**" must be a whole path segment, got segment ${JSON.stringify(looseDoubleStar)} in ${show}.`);
  }
  return segments.join('/');
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

function globMatches(patternSegments, pathSegments) {
  const [head, ...rest] = patternSegments;
  if (head === undefined) return pathSegments.length === 0;
  if (head === '**') {
    for (let skip = 0; skip <= pathSegments.length; skip += 1) {
      if (globMatches(rest, pathSegments.slice(skip))) return true;
    }
    return false;
  }
  if (pathSegments.length === 0) return false;
  return segmentRegex(head).test(pathSegments[0]) && globMatches(rest, pathSegments.slice(1));
}

/**
 * Whether a repo-relative path lies in a canonical scope (output of canonicalizeWrites).
 * A plain entry covers the path itself and everything beneath it; a glob entry must match the
 * whole path. Nothing under `.fgos` ever matches.
 */
export function matchesWriteScope(relPath, scope) {
  const pathSegments = String(relPath).split('/').filter((segment) => segment !== '' && segment !== '.');
  if (pathSegments.length === 0 || pathSegments[0] === STORE_DIR) return false;
  const normalized = pathSegments.join('/');
  return scope.some((entry) => {
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
