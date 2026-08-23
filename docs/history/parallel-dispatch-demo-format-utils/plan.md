---
item: tsk-1sj
stage: decompose
docsRef: docs/history/parallel-dispatch-demo-format-utils/
---

# plan.md — tsk-1sj: two independent format utilities (parallel-dispatch demo)

Mode: small

Lane decided via direct-entry fallback (no `fgos-routing` Orient step ran
this session — item went `submit → discover → decompose` directly). Flags
checked against `fgos-routing`'s Mode-gate table: auth (no), authorization
(no), data model (no), audit/security (no), external systems (no), public
contracts (no — two brand-new files, nothing existing changes shape),
cross-platform (no), existing covered behavior (no — net-new files, no
existing test touched), weak proof around the area (no — `npm test`/
`node --test` is a direct, deterministic proof), multi-domain (no, single
`coding` item). 0 flags → tiny/small band; `small` fits better than `tiny`
since this is genuinely two independent pieces of work, not one.

## Approach

Repo-fit check on file placement (`ls src/ test/`): both directories are
organized strictly by domain subsystem today — `cli/config/evolve/
install/intake/report/runner/setup/state` under `src/`, the same set plus
`e2e/fixtures/scripts/skills/` under `test/` — no `util/` bucket exists in
either, and no loose single-purpose helper file sits at either directory's
top level (`find src -maxdepth 1 -name "*.mjs"` returns nothing). Neither
`format-duration` nor `format-bytes` belongs to any of the 9 existing
domains — they are cross-cutting pure functions, not `cli`/`state`/`runner`
logic. Forcing either into an existing domain dir would misfile it (a
future reader looking for byte-formatting inside `src/runner/` would not
find it, and a reader inside `src/util/` would not expect runner logic).
This plan therefore deliberately introduces `src/util/` and `test/util/`
as the repo's first cross-cutting pure-utility location — a real,
named structural decision (not a silently-assumed precedent), justified
by the absence of any existing domain fit for either function.

`fgos graph --json`: `tsk-1sj` does not appear in `topUnblock` (nothing
else in the backlog depends on it) and contributes nothing to
`criticalPath` — it is a leaf, standalone demo item, not on any existing
critical path. This is expected and not a red flag: the item was
deliberately scoped with zero deps in `CONTEXT.md`'s Feature boundary
specifically so it would not interact with in-flight work.

No `fgos graph --what-if` ordering call was needed for the split below:
the two children share no dependency edge between them (neither blocks
the other), so there is no "which one goes first" question to answer —
this is itself the point of the demo (§ CONTEXT.md Feature boundary).

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`): GitNexus `present`, checked fresh this
session — Full mode. No blast-radius proof point is needed here regardless
of gate status: both target files are new (nothing existing to run
`impact` against), per CONTEXT.md's own scout note.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `format-duration.mjs` | light — pure function, no I/O, no shared state | `node --test test/util/format-duration.test.mjs` covers D2's four-unit behavior |
| `format-bytes.mjs` | light — pure function, no I/O, no shared state | `node --test test/util/format-bytes.test.mjs` covers D1's binary-base behavior |

Neither needs `fgos-coding-validating`-level proof beyond the direct test run —
no external system, no auth, no shared file with any other in-flight item.

## Shape

Two footprint-disjoint children, each independently implementable and
independently verifiable — this is the split itself, not "the plan calls
for a split then separately lists children"; the split IS this item's
whole shape (per `CONTEXT.md`'s Feature boundary: the item exists to
produce exactly this footprint-disjoint pair).

Cases each child's own test should cover (depth matched to `small`):

- `format-duration`: 0ms; sub-second remainder truncation; a value that
  only needs seconds; a value needing minutes+seconds; a value needing
  hours; a value needing days+hours (D2's four-unit ceiling).
- `format-bytes`: 0 bytes; a value under 1024 (stays in `B`); a value
  crossing into `KB`/`MB`/`GB` at the 1024 boundary exactly (D1's binary
  base — this is the boundary case that would silently break if someone
  later "fixed" it to divide by 1000).

## Split

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
fgos add --title "Add format-duration utility (day/hour/minute/second humanizer)" --kind feature --risk light --verify "node --test test/util/format-duration.test.mjs" --parent tsk-1sj --footprint "src/util/format-duration.mjs,test/util/format-duration.test.mjs" --dir "$root"
fgos add --title "Add format-bytes utility (binary-base 1024 humanizer)" --kind feature --risk light --verify "node --test test/util/format-bytes.test.mjs" --parent tsk-1sj --footprint "src/util/format-bytes.mjs,test/util/format-bytes.test.mjs" --dir "$root"
```

No third piece — the two functions above are the item's entire scope per
`CONTEXT.md`'s Feature boundary; nothing else to carve out.

## Assumptions

- Rounding/truncation exact behavior at unit boundaries (deferred to
  implementation in `CONTEXT.md`'s own Outstanding questions) — each
  child's implementer picks a reasonable rule and the test case list
  above locks it in via the boundary-case tests, not via a further
  product decision.
- Zero/negative input formats as `0<smallest-unit>` / is not a case this
  demo needs to define precisely — implementation detail, not gated here.

## Open Questions

None — every claim above traces to `CONTEXT.md` D1/D2 or to the
`fgos graph --json` output quoted in Approach.
