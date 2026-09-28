# Unit I35 — Before/After Comparison Report (Phase 7 closeout)

Both measurements use the checked-in `coordination-baseline.v1` harness
(`scripts/measure-coordination-baseline.mjs`) with the identical
reproducible command shape recorded by Phase 0's own artifact:

```sh
node scripts/measure-coordination-baseline.mjs \
  --corpus test/fixtures/coordination-baseline/sessions \
  --output <output.json>
```

## Before (real, checked-in — not reconstructed)

- Source: `plans/260919-coordination-skill-harness-simplification/reports/phase-00-unit-0c-baseline-replay-measurement.json`
- Source commit: `7853e4d7d6881665fb57e2a5d730428ae4e96486`
- Committed at: `ca854f443` (2026-09-21)
- Contract version: `coordination-baseline.v1`

| Skill | Bytes | Words | Lines |
|---|---:|---:|---:|
| `core/skills/fgos-plan-loop/SKILL.md` | 42,631 | 5,160 | 760 |
| `domains/coding/skills/fgos-code-panel/SKILL.md` | 53,835 | 7,049 | 915 |
| **combined (plan-loop + code-panel)** | **96,466** | **12,209** | **1,675** |
| `core/skills/fgos-architecture-panel/SKILL.md` | 63,985 | 9,006 | 971 |

Replay corpus (`test/fixtures/coordination-baseline/sessions`, 3 sessions,
schemas 1/2/3): `sessionCount: 3`, `bySchema: {"1":1,"2":1,"3":1}`,
`semanticDigest: sha256:19cec57f20b09491d0654e1bd5183db46f3b63412ad4ee2084779486e4e5bc7a`,
`failures: []`.

## After (fresh, this unit — main HEAD)

- Command run: `node scripts/measure-coordination-baseline.mjs --corpus test/fixtures/coordination-baseline/sessions --output /tmp/i35-after-measurement.json --report /tmp/i35-after-report.md`, executed from worktree `.claude/worktrees/coordination-skill-harness-i35-track-closeout` (branch `unit/I35`, based on `main`).
- Measured commit (`source.commit` reported by the harness): `ab7fe598d9f6e763b8b9d50d88995d2206b8220a` — this is `main` HEAD at the moment this unit's worktree was created (`ab7fe598d`, "docs(plan): close out Unit I34 ...").
- Contract version: `coordination-baseline.v1`

| Skill | Bytes | Words | Lines |
|---|---:|---:|---:|
| `domains/coding/skills/fgos-code-change/SKILL.md` | 18,191 | 2,314 | 186 |
| `core/skills/fgos-architecture-panel/SKILL.md` | 59,537 | 7,969 | 783 |

Replay corpus (same fixture directory, unchanged since Phase 0):
`sessionCount: 3`, `bySchema: {"1":1,"2":1,"3":1}`,
`semanticDigest: sha256:19cec57f20b09491d0654e1bd5183db46f3b63412ad4ee2084779486e4e5bc7a`,
`failures: []` — **identical digest to the Phase 0 measurement**, confirming
the replay-corpus behavior itself is unaffected by the Phase 4-7 skill
rewrites (expected: the corpus and the replay/normalization code it
exercises were not in scope for those phases).

## Delta: `fgos-plan-loop` + `fgos-code-panel` -> `fgos-code-change`

Old->new skill mapping per this unit's decision (`plan.md`, unit I35): both
predecessor skills are now deprecated stubs (Unit I29) whose real content
was absorbed into the single `fgos-code-change` facade (Unit I28).

| Metric | Before (combined) | After | Delta | % change |
|---|---:|---:|---:|---:|
| Words | 12,209 | 2,314 | -9,895 | -81.05% |
| Bytes | 96,466 | 18,191 | -78,275 | -81.14% |
| Lines | 1,675 | 186 | -1,489 | -88.90% |

## Delta: `fgos-architecture-panel` (own before/after, Unit I26 driver-discipline extraction)

| Metric | Before | After | Delta | % change |
|---|---:|---:|---:|---:|
| Words | 9,006 | 7,969 | -1,037 | -11.51% |
| Bytes | 63,985 | 59,537 | -4,448 | -6.95% |
| Lines | 971 | 783 | -188 | -19.36% |

## Token-count limitation (stated plainly, per this unit's stop condition)

Both the Phase 0 artifact and this unit's fresh measurement report
`inputTokens: null` / `outputTokens: null` on every scenario — the harness's
scenario fixtures are declared benchmark expectations, not a live
provider call, so no token usage is ever recorded by this contract. **No
token-count reduction claim is made anywhere in this report.** Only word,
byte, and line counts (both measured directly from the real `SKILL.md`
files on disk) are reported as evidence of instruction-footprint reduction.

## Replay-corpus comparison (explicit run, item 4)

`node --test test/runner/coordination-baseline-measurement.test.mjs`, run
from the same worktree at the same `main` HEAD (`ab7fe598d`):

```
✔ baseline harness contract and output shape
✔ baseline harness produces deterministic semanticDigest across multiple runs
✔ portable fixtures cover schema 1, 2, and 3 cleanly
✔ mutation-sensitive negative test: modifying a semantic field alters the semantic digest
✔ read-only corpus proof: corpus input is never mutated
✔ missing corpus is reported clearly without silent pass
✔ unsupported schema and corrupt event log are reported in failures and fail CLI with non-zero exit
✔ negative test: missing assignment record causes replay failure without synthesizing fake assignment
✔ F-03: replayCorpusFromDirectory returns measuredSessions and formatMarkdownReport distinguishes measured vs declared fixtures
✔ F-02: mutation test for run-retried event counting and semantic digest sensitivity
tests 10, pass 10, fail 0
```

All 10 tests pass, including the deterministic-digest and mutation-sensitivity
tests that exercise `src/runner/coordination/replay.mjs` directly against the
real, committed `test/fixtures/coordination-baseline/sessions` corpus (the
same corpus Phase 0's own baseline artifact was measured against).

## Doctor-check confirmation (item 3)

`distinctProviderFrom` (the `PolicyPatch` field added by Unit I21,
`src/runner/definitions/schema.mjs`) has **no dedicated `fgos doctor`
check**. Confirmed by grepping every `registerDoctorCheck(...)` call site
and every registered check `id:` in `src/setup/registrations.mjs` (28
registered checks total) for any mention of `distinctProviderFrom`,
`binding`, `coordination-protocol`, or the sibling field `capability` (which
*does* have one — `operation-capability-resolves`, added alongside
`distinctProviderFrom` in the same I21 unit): zero matches for
`distinctProviderFrom` specifically. `src/verbs/coordination/binding.mjs`'s
own source comments (`resolveDistinctProviderFrom`, lines ~54-61) already
document the one real limitation this field carries (a role wired only into
a later graph node than the operation naming it in `distinctProviderFrom`
is a documented, accepted limitation, not silently miscomputed) — i.e. the
gap is already named in the code, not silently unhandled.

**Disposition: accepted as a documented known gap**, not fixed in this
unit. `operation-capability-resolves` already gives `fgos doctor` visibility
into whether an operation's `policy.capability` resolves; a parallel check
for `distinctProviderFrom` (verifying every named role is reachable and
resolvable to a distinct provider at declaration time) is real, additive
scope beyond this closeout unit's charter (docs/CHANGELOG/report sweep) and
is left as a candidate for a future unit rather than invented here.
