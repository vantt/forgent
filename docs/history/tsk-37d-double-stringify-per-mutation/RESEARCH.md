# RESEARCH: double JSON.stringify per fgOS state mutation

## Round 1 (tsk-37d, stage discovery)

**Checked:** `src/state/store.mjs:93-113` (`writeView`), `src/state/replay.mjs:696-712`
(`viewRevision`), plus a fresh in-process benchmark against the real,
current `.fgos/state.json`.

**Confirms the item's own claim, current code, still present:** `writeView`
(`store.mjs:105`) builds `persisted = { ...view, revision: viewRevision(view),
snapshot }`, where `viewRevision(view)` (`replay.mjs:711`) does
`JSON.stringify(view)` (compact, for hashing) and `writeView` itself
(`store.mjs:111`) does a second, separate `JSON.stringify(persisted, null, 2)`
(pretty-printed) to build the bytes actually written to disk. Both calls walk
the full view tree — `persisted`'s content is `view`'s content plus two small
sibling fields (`revision`, `snapshot`), so the two passes are over
largely-overlapping content, exactly as the item describes. This runs inside
`refreshView` (`store.mjs:128`), the shared tail of every mutation
(`store.mjs:115-129`), so it fires once per write, unconditionally.

**Fresh measurement (item's own ~86ms figure is stale — the log has grown
since that old report; current cost is higher, not lower):** current
`.fgos/state.json` is 8.46MB (`stateJsonBytes`). Benchmarking the two
stringify passes in isolation, 20-iteration average, against that real
content:
- `viewRevision(view)` (compact stringify + sha256): ~59.2ms
- `JSON.stringify(persisted, null, 2)` (pretty stringify for the write): ~50.8ms
- **Combined: ~110ms of pure serialization per mutation**, up from the old
  report's ~42.9ms stringify-only figure (25.2ms + 17.7ms) — the repo's
  `.fgos` state has grown roughly proportionally to this cost increase. The
  claim is not just still true, it is currently worse than when originally
  reported.

**Suggested fix direction in the item's own description is not literally
buildable as stated, and this is a real ambiguity for planning, not a blocker
for discovery:** the description suggests "compute the revision hash from the
already-serialized persisted JSON string." That is backwards — `revision` is
itself one of the fields folded INTO `persisted` before `persisted` is
serialized (`store.mjs:105`); hashing `persisted`'s own final string would be
circular (the string already contains the hash of itself). A structurally
sound fix instead has to reuse `view`'s own already-serialized string (the one
`viewRevision` computes) when building `persisted`'s bytes, rather than
re-walking the same tree a second time. Two real fix shapes found by reading
the code, both viable, differing only in format-compat scope (a planning-time
call, not a discovery blocker):
1. Splice `revision`/`snapshot` around the *reused* compact `JSON.stringify(view)`
   string (string concatenation instead of a second tree-walk) — changes
   `state.json`'s on-disk formatting from pretty-printed (2-space indent) to
   compact, since the reused substring carries no indentation.
2. Keep pretty-printing but drop the separate hash-only stringify: derive
   `revision` from a stringify of `persisted` computed WITHOUT the `revision`
   field first (i.e. still two stringify calls total, but the second one
   — hashing — is skipped and folded into a single `JSON.stringify(persisted
   minus revision, null, 2)` pass, reusing that same string both to compute
   the hash and, after splicing `revision` in by string surgery, to write) —
   keeps current formatting, marginally more string-surgery complexity.

No production or test code was found reading `state.json` for its exact
whitespace/formatting (per the file:line survey `tsk-5nj`'s own research
round already did across `src/`+`bin/` — only test files read `state.json`
directly, and none assert on formatting) — same grep the prior report ran,
now specifically re-checked for a formatting dependency, none found — so
option 1's format change looks low-risk, but this repo's own choice between
the two shapes is still an implementation decision, not something this
research round should lock unilaterally.

**Verdict:** `{clear: true, verify: "npm test"}` — the defect is confirmed
present and reproducibly measurable on demand (bench script inline in this
round, re-runnable), the suggested-fix wording is superseded by the two real
options above, and picking between them is an ordinary planning-stage
implementation call (formatting-compat trade-off), not an open product
question that needs a person at `exploring`.
