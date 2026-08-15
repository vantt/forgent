# plan: tsk-2jn — footprintOverlapAmong normalizes both sides through normalizePath

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior —
`test/state/graph-metrics.test.mjs` carries a real `footprintOverlap`/
`computeSchedule` suite). No hard-gate flag — item's own `tier`/`risk`
(`standard`/`standard`, severity "medium-low" per the report) confirm
standard lane.

Direct-entry fallback: entered `planning` straight from a `clear` discovery
verdict — no `CONTEXT.md`/exploring round exists. `RESEARCH.md` round 1
stands in for it.

## Impact-analysis posture

Same as every sibling item this session: gitnexus `present` but 172 commits
behind HEAD — **degraded**. Not leaned on for this item: the fix's only
new dependency (`normalizePath` from `frozen-judge.mjs`) was confirmed
safe by direct read (zero-dependency module, no circular-import risk) and
by rerunning the full existing test suite, not blast-radius tooling.

## Approach

**The report's suggested direction is directly correct this time** (unlike
tsk-ikd's — RESEARCH.md round 1 confirms no scope conflict with
tsk-11v/tsk-4so, both explicitly out of bounds and untouched). One change,
`src/state/graph-metrics.mjs`'s `footprintOverlapAmong`:

- Import `normalizePath` from `../runner/frozen-judge.mjs` (already the
  single choke-point `buildOwnFileSet`/`frozenJudgeHits` both use for this
  exact purpose — no second normalization implementation).
- Normalize `footprintB` (the `Set` built for membership testing) through
  `.map(normalizePath)`, and normalize each `footprintA` path with
  `normalizePath(path)` at the point of the `.has()` check.
- `shared` still reports item A's own AS-DECLARED path string (never the
  normalized form) — a detector, not a rewriter; matches the existing
  test suite's own expectation (`shared` keeps "the first item's order"
  and — confirmed by reading the FIFO-order test — its own original
  spelling).

**Why this is provably safe:** `normalizePath` is already the exact
choke-point two OTHER real consumers of the same `footprint` field already
route through (`buildOwnFileSet`, merge.mjs; `frozenJudgeHits`,
frozen-judge.mjs itself) — this fix makes `footprintOverlapAmong` the third
consumer of the same, already-proven normalization, not a new one.
`frozenJudgeHits`'s own doc comment already CLAIMED parity with
`footprintOverlap`'s semantics before this fix — that claim was false
until now; it becomes literally true after this change, closing a
documentation/behavior mismatch as a side effect, not just the detection
gap itself.

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| The new normalization inside `footprintOverlapAmong` | Low-medium — must catch the real failure scenario (differently-spelled equivalent paths) without over-matching (two genuinely different paths that happen to normalize the same way is not a new risk `normalizePath` introduces beyond what `frozenJudgeHits` already accepts) | Two new tests reproducing Finding 6's exact scenario: a `./`-prefixed path vs. plain, and a backslash-spelled path vs. forward-slash — both now correctly flagged, `shared` still reporting item A's own raw spelling |
| Every other existing `footprintOverlap`/`computeSchedule` test (disjoint footprints, non-ready items, FIFO determinism) | Low — must stay byte-identical | Full existing `test/state/graph-metrics.test.mjs` suite (71 tests total, 69 pre-existing + 2 new) reruns unchanged |

## Shape

Single piece, no split — one normalization added at one choke-point,
already implemented and verified.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/state/graph-metrics.test.mjs
```

## Outstanding questions

None
