// authoritative-match.mjs — skeleton-match lookup over docs' own
// `authoritative_for` frontmatter (tsk-1lv-6, CONTEXT.md D8/D12): given a
// capture's real topic and a set of candidate docs, find the doc that
// already declares itself authoritative for that topic, so
// fgos-coding-compounding grows the right existing file instead of
// creating a second doc for the same subject under a differently-guessed
// name. Pure: no fs, no imports — candidates are plain `{path,
// authoritativeFor}` records the caller already read off disk (via
// `parseFrontmatter`, `frontmatter.mjs`), matching that module's own
// zero-import purity discipline.
//
// Port/adapter shape (D12), mirroring `src/runner/dispatch.mjs`'s C9 v2
// executor interface: match logic sits behind a named adapter in a
// registry, never inlined at the call site, so a future adapter (e.g. a
// real semantic-similarity match) can be added and selected by name
// without changing `findAuthoritativeMatch`'s own call sites. "Skeleton
// match" is deliberately NOT semantic search (DISCUSSION.md D12) — it
// normalizes case, diacritics, and punctuation, then compares for an
// exact fold, same posture bee's own precedent used.

function normalizeSkeleton(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export const SKELETON_ADAPTERS = {
  'skeleton-v1': {
    // tsk-1lv review-fix F11: `normalize` is exposed on the adapter
    // itself (not just `matches`) so a caller grouping candidates by
    // skeleton (findDuplicateAuthoritativeClaims below) genuinely goes
    // through the selected adapter too -- a future adapter swapped in by
    // name now changes BOTH functions' behavior, not just
    // findAuthoritativeMatch's, which is what "port/adapter, swappable"
    // (D12) actually requires.
    normalize: normalizeSkeleton,
    matches(topic, authoritativeFor) {
      const a = normalizeSkeleton(topic);
      const b = normalizeSkeleton(authoritativeFor);
      return a !== '' && b !== '' && a === b;
    },
  },
};

const DEFAULT_ADAPTER = 'skeleton-v1';

/**
 * Find the candidate whose `authoritativeFor` skeleton-matches `topic`,
 * or `null` when none does. `candidates` is an array of
 * `{path, authoritativeFor}` (extra fields are ignored); a candidate with
 * a non-string/empty `authoritativeFor` never matches. Returns the first
 * match in `candidates` order — the caller is responsible for candidates
 * being unambiguous (one doc per topic is the convention this module
 * assumes, never enforces).
 */
export function findAuthoritativeMatch(topic, candidates, { adapter = DEFAULT_ADAPTER } = {}) {
  const impl = SKELETON_ADAPTERS[adapter];
  if (!impl) {
    throw new Error(`authoritative-match: unknown adapter "${adapter}" (known: ${Object.keys(SKELETON_ADAPTERS).join(', ')})`);
  }
  for (const candidate of candidates ?? []) {
    if (typeof candidate?.authoritativeFor !== 'string' || !candidate.authoritativeFor.trim()) continue;
    if (impl.matches(topic, candidate.authoritativeFor)) return candidate;
  }
  return null;
}

/**
 * Harness backstop (D8: "check mechanical trong verify chain", never a
 * live gate on its own — this function only reports, it does not refuse
 * anything). Mirrors bee's own `duplicate_authoritative_for` bundle-wide
 * check: group `candidates` by skeleton-normalized `authoritativeFor` and
 * return every group with more than one member — two docs that both
 * claim the same subject, the exact anti-fork failure D8's doctrine half
 * (`findAuthoritativeMatch` at compounding time) is meant to prevent but
 * cannot catch retroactively for docs authored before this existed.
 * Returns `[]` when every claimed subject has exactly one owner.
 */
export function findDuplicateAuthoritativeClaims(candidates, { adapter = DEFAULT_ADAPTER } = {}) {
  const impl = SKELETON_ADAPTERS[adapter];
  if (!impl) {
    throw new Error(`authoritative-match: unknown adapter "${adapter}" (known: ${Object.keys(SKELETON_ADAPTERS).join(', ')})`);
  }
  const groups = new Map();
  for (const candidate of candidates ?? []) {
    if (typeof candidate?.authoritativeFor !== 'string' || !candidate.authoritativeFor.trim()) continue;
    const skeleton = impl.normalize(candidate.authoritativeFor);
    if (!groups.has(skeleton)) groups.set(skeleton, []);
    groups.get(skeleton).push(candidate);
  }
  const duplicates = [];
  for (const group of groups.values()) {
    if (group.length > 1) duplicates.push(group);
  }
  return duplicates;
}
