# Unit I18 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I18`,
worktree `.claude/worktrees/coordination-skill-harness-i18-plan-lint`, base
`main@05b94eeff`, integrated `main@8ece3bbdc` (merged onto post-I19
`main@e1dab2dfa`).

## Implementer (sonnet, fullstack-developer)

Fixed the five confirmed lint gaps, added Product Gates table parsing and
`--cell` filtering, and added the read-only `fgos plan-lint <path> [--cell]
[--json]` verb. Commit `b8166a2ae`. Flagged two concerns for Lead: (1) a
`test-ownership.mjs` status flip from `shadow` to `live` it wasn't sure was
warranted; (2) live cross-worktree contamination — the shared global
`~/.fgos/config.json` had picked up a `serves` key from the concurrent I19
sibling's work, breaking any command on this machine that loads runner
config without an isolated `HOME`.

## Disposition round 1

Lead investigated concern (1) directly: `scripts/test-select-promote.mjs`
implements a formal mutation-testing evidence gate for any `shadow` ->
`live` promotion, and the implementer's flip was the *only* `live` entry
among 36 manifest rows with no such evidence. Rejected as an unearned
promotion; reverted to `shadow`, keeping the real `directTests`/
`boundaryTests` coverage added (fix commit `8772f3fb5`).

## Independent review + test (round 1, opus)

- Reviewer: H1 (verb violates its own `touchesState: false` — calls
  `ensureRunnerConfigForDir`, which creates/rewrites `.fgos/config.json`),
  H2 (Product Gates row parser silently truncates on a literal `|` inside a
  cell — confirmed on `plans/260910-1700-rust-host-r1-kernel/plan.md`, 6/17
  rows dropped), M1 (backtick-wrapped capability cells false-flagged on 2 of
  4 real Product-Gates plans), M2 (Req 3 deviation — accepted as Lead's
  decision, not a defect), M3/M4/L1-L3 (doc drift, exit-code overload, test
  naming) — see full findings in the conversation record.
- Tester (independent instance): same core findings (H1/H2/H3 mirroring the
  reviewer's M1) plus a new HIGH: adding the `plan-lint` case raised
  `COMMAND_REGISTRY` from 73 to 74 entries, breaking 3 Rust-side node tests
  that embed the routes JSON (`command-routes.test.mjs`, `harness.test.mjs`)
  and a M2: the unit-block/table parser doesn't end at a markdown heading
  or skip fenced code, producing false pins/phantom units (confirmed on
  `docs/how-to/author-a-plan-loop-track.md`).

## Fix round 2 (bundled: reviewer's H1/H2/M1/L1/L2/L3 + tester's registry/
heading/pin findings via addendum)

Commit `daafaa61b`: switched to read-only `loadRunnerConfigFromDir`
(exit 2 on missing config, no create/rewrite); tolerant Product Gates row
splitting (first-3-pipes rule); backtick stripping on Capability/Cell
cells; `--cell` exit code 2; removed "gap N"/"(Unit I18)" labels; anchored
`unresolved` exact-token match.

Commit `2a9510550` (addendum, same round): regenerated
`packages/host-runtime/contracts/command-routes.json` and
`test/rust-host/vectors/envelope/version.json` via their own generator
scripts; updated the two JS test files' hardcoded 73->74 counts; added
markdown-heading/fenced-code boundaries to the unit-block/table parser;
case/whitespace/bullet-tolerant pin-key regex.

## Recheck (opus, tester + reviewer in parallel)

Both confirmed all 9 findings resolved. Reviewer additionally found the new
fence-handling code had 2 CommonMark-incorrect escape hatches (a fence-
closing line that also carries an info string wasn't recognized as closing;
a backtick opener whose info string itself contains a backtick was wrongly
treated as fence-open, swallowing the rest of the file), plus a NEW HIGH:
the 73->74 registry bump also broke 3 **Rust-side** tests
(`packages/distribution/rust/src/lib.rs` x2, `apps/fgos/tests/cli_tests.rs`)
that the JS-side fix in round 2 didn't cover.

Note: a coordination slip occurred here — the round-3 fixer was dispatched
into the same worktree before the read-only recheck-tester had gone idle.
No corruption resulted (both recheck agents' findings were internally
consistent and matched each other), but this should not be repeated: confirm
a worktree is free of other active agents before dispatching a writer into
it.

## Fix round 3 (final, 3-round cap reached)

Commit `e2bb17467`: Rust tests now derive expected verb count from
`command-routes.json` at test time instead of a hardcoded literal (renamed
`test_verbs_sorted_and_match_73` -> `test_verbs_sorted_and_match_routes_json`
so the next verb added doesn't repeat this class of break).
Commit `8306c36d1`: CommonMark-correct fence close/opener rules; deleted an
untracked exploratory test file left over from the tester's own adversarial
run (`test/cli/plan-lint-adversarial.test.mjs` — its coverage was already
duplicated by the tests added in `daafaa61b`/`2a9510550`).

Lead independently reverified: `node --test
test/report/capability-plan-lint.test.mjs test/cli/plan-lint.test.mjs`
41/41; `test/rust-host/{command-routes,envelope-contract,harness}.test.mjs`
50/50; `CARGO_TARGET_DIR=<isolated> cargo test -p fgos-distribution --lib`
43/43; `-p fgos --test cli_tests native_version` 2/2; `git status`/`git diff
--check` clean.

Deferred (named, not proof-gaps): fence indentation cap (0-3 spaces) and a
`warn` finding for an unclosed fence; stale "73 selectors" prose outside
this unit's Files; cross-repo capability resolution.

## Merge

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I18` from the main
checkout onto post-I19 `main@e1dab2dfa`, `ort` strategy, only `CHANGELOG.md`
auto-merged (separate sub-headings, no real conflict).
`integratedSha = 8ece3bbdcc3d30b6488e5cc4473628261e70f268`.

## Post-merge false-positive investigation (not a regression)

Lead ran the full suite on the integrated tree and saw 4 failures: 3
`fanoutBatchExecutorCli` tests in `test/runner/dispatch-production-call-
sites.test.mjs` and one rust-host `release-tree.test.mjs` R3 test.

- The `release-tree.test.mjs` R3 failure ("unknown verb plan-lint") was
  real and self-inflicted: the shared `target/release/fgos` binary (used
  read-only via a symlink into every unit worktree for `test/rust-host/**`)
  embeds `command-routes.json` at Rust compile time via `include_str!`
  (`packages/distribution/rust/src/lib.rs:39`, `apps/fgos/src/main.rs:25`)
  and had never been rebuilt after the routes file changed. Fixed by
  running `cargo build --release --workspace` once in the main checkout
  (the shared symlink target); confirmed 3/3 pass after.
- The 3 `fanoutBatchExecutorCli` failures did NOT reproduce in a fresh
  disposable worktree cut from the exact integrated SHA (`8ece3bbdc`),
  run twice, 20/20 both times, and also passed in the full-suite run from
  that same fresh worktree (7813/7813 pass). They reproduced deterministically
  (6 times, across two independent sessions — Lead directly, and a
  dedicated debugging agent's earlier report of a *different* clean result
  was itself from a fresh worktree, consistent with this pattern) only when
  run directly inside the shared main checkout. A stale `.fgos/main-
  checkout.lock` (holder: this Lead session, from an earlier merge) was
  investigated and cleared via `fgos unlock` as a plausible cause; the
  failure persisted after clearing it, ruling that out too. Root mechanism
  undetermined, but conclusively isolated to the main-checkout environment,
  not to any content in the `525a641a1..8ece3bbdc` diff (which contains
  nothing touching `src/runner/dispatch.mjs` or `src/runner/fanout-
  batch.mjs`, the only code that could plausibly affect this test).

No code change was made in response to this; it is recorded here as a
known main-checkout-specific test-environment anomaly for whoever
investigates it next, not as a defect in Unit I18.
