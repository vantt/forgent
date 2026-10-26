# Code review: session-lead inline seat removal + red-team pool widening

## Scope

- Worktree `/home/vantt/projects/forgentX/.fgos/runtime/landing-seat-cov/wt`, branch `seat/standard-single-vendor-coverage`.
- Uncommitted diff: 38 files, +108 / -798. HEAD `8d84ee4e8` (red-team pools), reviewed briefly.
- Read-only: grep, git and file reads only. No builds or tests were run.

## Verdict

No critical or high findings. The removal is complete in code: nothing in `src/`, `bin/`, `packages/`, `apps/`, `scripts/`, `core/` or `domains/` still produces or reads `inlineAllowed`, `pendingInline`, `pending-inline`, `recordInlineRun`, `inline-record`, `inlineSeats`, `inlineLead`, `Mechanism::Inline`, `session-lead-inline`, `lead-producer-inline`, `only-inline-candidate-left` or `summary.inline`. Every remaining `inline` hit is the ADR-006 inline Assignment (`provenance.kind === 'inline'`), herdr `promptDelivery`, or unrelated tokens (yaml-doc fixtures, CLI `--flag=value` parsing, CSS). Before landing, fix the user-visible stale help text and the CHANGELOG overclaim (M1, M2).

## Medium

### M1. Help text and specs still describe the removed mechanism

- `src/cli/command-registry.mjs:1485`: the `run` description still ends with `Also "record" for inline producer turns.` This text is what `fgos run --help` prints. Failure: a user reads it, runs `fgos run record --unit-run X ...` and gets `unknown flag "--unit-run"`. Worse, a bare `fgos run record` is now read as the prompt "record" and dispatches a real read-only worker.
- `docs/specs/runner.md:3149`: `Có fgos run record cho producer inline với nonce một lần phát ...`
- `docs/specs/runner.md:1125` (RUL97): `Not done: an inline producer over an open merge (inline rounds have no runner commit)`
- `docs/specs/runner.md:1149`: `the session lead never takes over such a Unit inline`
- `docs/specs/runner.md:1152`: `they never run inline or in-process`
- `docs/specs/runner.md:1531`: `bind() không chọn in-process/inline`

Fix: delete the sentence at 1485. In the spec, drop the 3149 and 1125 clauses, and reduce 1149, 1152 and 1531 to "in-process". Design principle 7 says code and docs agree in one place, and these lines now describe a path that no longer exists.

### M2. The CHANGELOG standard-layer line overclaims

`CHANGELOG.md` (second new bullet) opens in the present tense: "The standard config layer (`core/config-standard/`) now lets a project that configures nothing run on a machine with only Claude or only Codex". The source does not support this:

- Nothing in `src/` or `bin/` reads `core/config-standard`. Its only readers are the Rust config crate (`packages/config/rust/src/{standard,bundle,inspect,lint,snapshot,provider,machine}.rs`), which serves inspect, lint, migrate and snapshot. The Node runner's `loadRunnerConfigFromDir` never sees it. Today the change affects only `fgos config migrate` output and lint, not what `fgos run` binds.
- Even once the runner reads the layer, a reviewed code unit still cannot seat its red-team on a single-vendor machine. `patterns/reviewed.mjs:291` makes each checker `independentOf` the producer seat, and `bind.mjs:289` turns that into a hard family exclusion. On a Claude-only machine the producer is Claude, so `[xai, claude, openai]` leaves nothing for the checker. HEAD's own commit message and its `golden_standard.rs` doc comment both say "a machine holding Claude and Codex", and that is the accurate claim.

Fix: rewrite the bullet to say that the standard lists now end with both families, so that a project configuring nothing will work once the runner reads the layer: a Claude-only or Codex-only machine for solo work, and Claude plus Codex for reviewed code units. Keep the "once the runner reads that layer" wording, which is already in the second sentence, and drop the present-tense "now lets".

The same unread layer is used as a justification in `docs/specs/seat-binding.md:112` ("vì mọi cửa đều headless và lớp chuẩn luôn có `tierFallback`"). Only the first reason (every door is headless) holds today. Drop the `tierFallback` clause or mark it as future.

### M3. Every stored summary becomes "stale" in backfill, and the CHANGELOG does not say so

`scripts/backfill-unit-summaries.mjs:74` treats a summary as unchanged only when `serializeUnitSummary(summary) === stored`, byte for byte. The writer no longer emits `"inline": false`, so every stored summary now differs. In the main checkout, 824 of 824 `unit-summary.json` files contain `"inline": false`. Failure: the next `node scripts/backfill-unit-summaries.mjs` reports `stale: 824, reason: 'differs'`, which reads like derivation drift and hides any real staleness. `--regenerate` would rewrite all 824 files.

Readers are unaffected. Rust `valid_summary` no longer requires the key, and the schema has no `additionalProperties: false`, so the CHANGELOG's "summaries that still carry it read as before" is true for readers. It is not true for backfill.

Fix (pick one):
- (a) Add one clause to the CHANGELOG: "backfill reports existing summaries as stale until `--regenerate`".
- (b) Run `--regenerate` once on each owned workspace after landing.

Do not re-add the field.

## Low

### L1. Inline-only fallbacks left behind in `unit-summary.mjs`

- `src/runner/execution/unit-summary.mjs:92`: `?? result.binding ??`
- `src/runner/execution/unit-summary.mjs:115`: `?? seat.final.runResult?.result`, the stance fallback

Only the removed `recordInlineRun` payload carried a top-level `binding` and `result` in `result.json`. Both fallbacks came in with `0b06824a7`, whose test fixture was the inline record. Nothing in `src/runner/dispatch/run-result.mjs` writes either field, and a grep of the main checkout's nested `result.json` files found neither. These are dead branches. Under RUL104 they should go in this same change, so that this removal is the last step that deletes the inline path. Keep `workflow/seat-providers.mjs:22` `result.binding`: that reads the pattern result shape, not `result.json`.

### L2. Test titles and comments still say "inline"

- `test/runner/execution/bind.test.mjs:370`: "never bound in-process or inline". The comment "The lead's own session is not a way around it either" is also stale.
- `test/runner/execution/bind.test.mjs:870` and `:875`: "debate seats never run inline", "rather than falling back to the lead inline"
- `test/runner/execution/bind.test.mjs:883`: section header "pins, effort, inline lead, continuity"
- `test/runner/execution/run.test.mjs:1`: file header "and inline record (Phase 5)". This header also breaks the no-phase-labels rule.

The assertions still hold; only the words are wrong.

### L3. Forward compatibility of keeping version 2

HEAD's Rust reader required `value["inline"].is_boolean()` (`packages/run-result/rust/src/unit_summary.rs`). An older activated release reading summaries written by this one (after a rollback, or from a checkout pinned to an older release) will count each new summary as `invalid-contract`, not `unsupported-version`. The data stays intact; only the diagnostics bucket is wrong. Under the single-user, no-backward-compatibility policy this is acceptable. Note it in the CHANGELOG line if rollback is a real path.

### L4. The mutation census is stale for 18 changed files

`packages/git/contracts/mutation-census.v1.json` pins digests for `bin/fgos.mjs`, `src/runner/execution/{run,bind,handoff-refs,unit-summary,seat-resolver,legacy-seat-read,account-rotation}.mjs`, `src/runner/{operation-choice,dispatch/assignment-layout}.mjs`, `src/cli/command-registry.mjs`, `packages/seat-binding/rust/src/{model,rank}.rs`, `packages/run-result/rust/src/{lib,unit_summary}.rs`, `packages/run-result/rust/tests/unit_summary.rs`, `packages/observe/rust/src/metrics_cli/discussions.rs` and `apps/fgos/tests/cli_tests.rs`. None of these match the working tree. `.githooks/pre-commit` `censusDriftRefusal` will refuse the commit until `node scripts/git-one-door-scan.mjs --write-census` is run and the census is staged, as HEAD did.

### L5. The headless split in refusals is now cosmetic (informational, not required)

`bind.mjs:343` still renames `no-candidate configured 0` to `headless-no-executor` only when `session.headless` is set. Since the inline path is gone, both session kinds are refused and only the reason string differs. This is a possible RUL104 simplification, but it changes a reason name, so leave it for a separate item.

## Questions checked and found clean

- **Consumers of the removed summary key and coverage reason:** no finding. The gateway (`apps/fgos-gateway`), web UI, `src/setup` doctor checks and `scripts/` read neither `inline`, `inlineSeats`, `inline-record` nor `no-run-id`. `fgos metrics discussions` dropped `inline` from its copied unit keys and the `inlineSeats` total. Node `projectRunEligibility` and Rust `scan_assignment_runs` changed in lockstep, and the shared fixture `test/fixtures/run-layout/expected.json` keeps `runDirsSeen: 19` and the sum invariant. No on-disk inline runs exist: the main checkout has 858 unit runs and none has `pending-inline.json`, `execution.status: "pending-inline"` or `"inline": true`.
- **bind.mjs leftovers:** no finding. `transportOf`, `mechanismSource`, `bindingInput`, `familySpread`, `fallbackFrom` and the `explainSeat` chain now apply to every candidate without exception. The crate can no longer emit `mechanism: "inline"`: the enum variant is gone, and `rank.rs:207-208` only distinguishes OutOfProcess from the facts mechanism. `getProviderFamily` and `session` are still used. The seat-binding serde structs have no `deny_unknown_fields`, so an older Node payload that still sends `inlineLead` would be ignored, not refused.
- **Unused imports in run.mjs after the cut:** no finding. `crypto`, `assertSeatId`, `outcomeOfRunResult`, `publishUnitSummary` and `writeJsonAtomic` all still have live uses.
- **Repointed tests:** they still prove their behaviour, and neither passes vacuously.
  - "summary I/O failure cannot replace the original execution error": the failure is thrown from `run.mjs:885` `fs.mkdirSync(assignmentDir)` inside `dispatchBound`, after a real crate bind of `alpha` (`reviewedConfig` plus `docs:write`). The test asserts error identity, `settlement.outcome === 'execution-failure'` and exactly one summary-write warning, with `unit-summary.json` pre-created as a directory. The mock takes effect because `run.mjs` calls `fs.mkdirSync` through its default `fs` import. If the error were swallowed or turned into an outcome, `assert.rejects` would fail.
  - "a reviewed execution error publishes its summary only after the dispatched sibling result exists": the reviewer now binds fresh (no recorded reviewer binding) and fails at its attempt directory. The test asserts that the published summary holds a red-team final with a `runId`, `outcome: 'pass'` and `kind: 'checker'`. If the error propagated before the peer drained, the summary would have no red-team final.
- **Retired tests (design principle 8):** each one's behaviour is either gone or owned elsewhere.

| Retired test | Status |
|---|---|
| golden: seat with no candidate run inline / blind never inline / skill never inline | behaviour gone; the refusal is owned by golden "nothing configured for the seat is no-candidate with zero configured" (`seat-binding.golden.v1.json:2210`) |
| golden: configured candidates all filtered refused | still owned by the remaining `unknown-executor` golden case |
| golden: configured candidate binds and leaves lead aside | default bind goldens |
| bind: lead falls back inline / force-out-of-process never inline / lead never takes skill unit / lead present and all refused | behaviour gone; the refusal side is owned by the crate goldens above and `bind.test.mjs:370` (non-headless lead session refused) |
| handoff-refs: inline record hands over evidence refs | behaviour removed (`evidenceRefs` fallback and `worktree` param) |
| seat-id: inline result cannot be recorded under a path seat id | behaviour gone (`recordInlineRun`); hand-off path guard still owned by `seat-id.test.mjs` "a hand-off ref cannot reach outside the run directory" |
| run.test: recordInlineRun nonce / refusal / pending / multi-role / no early publish | behaviour gone |
| run.test: summary I/O failure after inline solo completion | owned by "summary I/O failure leaves a successful resumed execution successful and authoritative" |
| run.test: inline reviewed producer pending then resume through checkers | resume behaviour owned by `patterns/reviewed.test.mjs:275` and `:410` |
| unit-summary: inline record is a real final seat without runId | the null-runId seat case is now owned by Rust `consumer_separates_all_attempts_final_seats_groups_and_refusals` (the `unit-run-unlinked` seat) |
| cli: `fgos run record` completes pending inline turn | behaviour gone |

- **HEAD commit:** no finding on the pool change itself. On a Claude plus Codex machine, the producer is Claude, the red-team walks xai (absent), then claude (excluded by hard family independence), then openai. The repo's own lists are recorded as differences with reasons. `golden_standard.rs` now walks `roles.*.prefer`, and its doc comment correctly limits the claim to "a machine holding Claude and Codex". The census was regenerated for the touched files. The only issue is that the CHANGELOG wording runs ahead of this (M2).

## Recommended actions

1. M1: remove the `record` sentence from `command-registry.mjs:1485` and clean up the five spec lines.
2. M2: reword the CHANGELOG standard-layer bullet and the seat-binding.md:112 justification.
3. M3: add the backfill-stale note to the CHANGELOG, or run a one-time `--regenerate`.
4. L1 and L2: delete the two dead fallbacks in `unit-summary.mjs` and fix the test titles and header.
5. L4: regenerate the mutation census before committing.

## Unresolved questions

- Is rolling back to a pre-removal release a supported path on any machine? If so, mention L3 in the CHANGELOG.
