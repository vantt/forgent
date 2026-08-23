// normalize-path.mjs -- the one path shape every caller comparing
// git-reported paths against a declared file set needs.
//
// Lives in util/ (kernel tier) rather than next to any one of its callers:
// footprint matching (frozen-judge.mjs), own-file-set matching (merge.mjs)
// and footprint-overlap detection (state/graph-metrics.mjs) all need the
// identical rule, and the last of those sits on the state/ side of the
// state/runner boundary -- importing it from runner/frozen-judge.mjs was
// one of the import edges that made the two folders mutually dependent.
//
// PURE: string in, string out. No fs, no child_process, no imports.

/** Backslash-to-slash, strip a leading `./`, trim surrounding whitespace. */
export function normalizePath(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '').trim();
}
