# Code review B: Event Store phase 09 (readers, removals, triggers, registrations, hook, proofs)

Range reviewed: `83ad16aca..dbb5305a1` in `.claude/worktrees/es-p09-revb`. I changed nothing in the workspace. I read the phase file, plan D7/D8/D9/D12/D13/D15/D16/D18, the seven lead reports, spec §12, §13, §15, §16, §17, §19 and §21, and the diff for my area. I ran three read-only probes (described under each finding) and the door test. I could not run the runner and CLI suites: the sandbox cannot build the native addon (`cargo build` hits a read-only target).

**Verdict: not ready to merge for my area.** Three High findings must be fixed first:
- an unmeasured full-history walk on every command;
- tests of deleted mechanisms that are still live and will fail;
- a V-DOOR-01 scanner that passes literal event-ref pushes.

The readers, removals, registrations and Land ordering are otherwise sound.

## Critical

None.

## High

**H1. Each command trigger walks the whole history twice, and so does each runner poll.**
- Where: `src/event-store/maintenance.mjs:7`, called from `bin/fgos.mjs:5181` (start) and `bin/fgos.mjs:5238` (end), `src/runner/loop.mjs:1786` (every watch iteration, about 5 s apart), `endSession` and `stopGateway`. `promoteLandedStreams` at `src/runner/merge.mjs:1750` also calls it on every Land, while holding the merge slot.
- What happens: `maintainEventStore` calls `store.status()`. The native `status()` (`packages/event-store/rust/src/diagnostics.rs:70-170`) does three expensive things:
  - runs `walk_verified` over every `refs/fgos/*/events/*` ref from an empty cursor;
  - runs a full `read::read` with the default cursor, which re-parses every legacy file (`read.rs:358`; this repo's legacy log is over 10 MB);
  - lists worktrees.
- Spec §16 needs only the oldest unsealed age per local stream and the last push. Every `list`, `show`, `take` or `move` now pays two full walks plus the legacy parse, and nobody has measured it. Part (b) of the budget ("end to end not worse than the V-SPAWN-01 baseline") and product priority 1 (Ship Faster) are both at risk.
- Fix:
  - Add a narrow native maintenance fact: local open streams, oldest unsealed age and the last push receipt, with no ref walk and no legacy read.
  - Make `maintainEventStore` and `promoteLandedStreams` use that fact.
  - Run V-SPAWN part (b) on ext4 before landing.

**H2. Tests of deleted mechanisms are still live and now fail.**
These files are not in the diff, and the lead reports did not run `test/runner` or `test/cli` broadly. `npm test` will not be green, which fails L5 question 5.
- `test/runner/claim-port.test.mjs:702`: "claimWork invokes runOpportunisticMainCheckoutChecks … warning file must be created". `claimWork` no longer calls the guard (its call was removed from `src/runner/claim-port.mjs`), so the assertion fails in every environment.
- `test/cli/fgos-return.test.mjs:288`: expects `.fgos/events-jsonl.truncation-guard.json` to be exempt from `footprintDiffHits`. `FGOS_NOISE_ONLY_PATHS` (`bin/fgos.mjs:276`) dropped that alternative, so the path is now flagged.
- `test/runner/land-vs-manual-commit.test.mjs:62`: expects a "fallback events checkpoint" commit from `checkpointMainFgos`, which now returns `{changed:false}`. It is skipped here by `HOOK_TEST_SKIP` but runs on the host.
- Fix: retire each test, labelled with its D-ADR0055 family as the phase requires, and run the full `npm test` with a host build.

**H3. V-DOOR-01 passes literal event-ref invocations.**
- Where: `test/event-store/door.test.mjs:331-342` and `:357-366`.
- Probe: I imported `invocationViolations` from a scratch script and checked each case. Each of these returned `[]` (no violation):
  - `spawnSync('git push origin refs/fgos/events/x',{shell:true})`
  - `execFileSync('sh',['-c','git push origin refs/fgos/events/x'])`
  - `execFileSync('/usr/bin/git',['push','origin','refs/fgos/events/x'])`
  - Rust `Command::new("/usr/bin/git").args(["push","origin","refs/fgos/events/x"])`
  - a wrapper `function git(args){return execFileSync('git',args)}` called as `git(['push','origin'].concat(refs))`
  - a literal glob refspec `['push','origin','refs/*:refs/*']`
- Causes:
  - (a) A binary that is not exactly `git` or UNKNOWN is never checked, and shell strings are only parsed for `exec`/`execSync`.
  - (b) The top-level loop inspects a non-primitive call only when an argument's abstract value already matches `dangerous`, so a computed argv hides the verb.
  - (c) Glob refspecs count as bounded.
- No production code uses these shapes today: the phase's `rg "refs/fgos/"` quick check finds only constants, plumbing and E3. But the gate is meant to stop future regressions, and spec §23.2 item 11 says "any … invocation whose ref arguments can name `refs/fgos/*`".
- Fixes:
  - Treat any binary whose basename is `git`, any shell (`sh`/`bash` `-c`, `shell:true`), and any `env`/`xargs`-style launcher as a git sink, and scan their string for the verb and ref.
  - Inspect every call into a sink function, with UNKNOWN argv failing closed when the sink's verb is unresolved.
  - Refuse `*` in a ref operand unless its source prefix is a non-event namespace.
  - Add these cases as synthetic counterexamples.

## Medium

**M1. A staged rename bypasses the hook's added-path refusal.**
- Where: `.githooks/pre-commit:272`.
- Probe: in a scratch repo, `git mv x.jsonl .fgos/events.jsonl` stages `R100 x.jsonl .fgos/events.jsonl`, and `git diff --cached --name-only --diff-filter=A` prints nothing. Copies (with copy detection) and type changes slip through the same way.
- Fix: use `--no-renames --diff-filter=ACRT`. Add a hook test for the rename.

**M2. Doctor recomputes Event Store facts row by row and rebuilds the Work view eight times.**
- Where: `src/setup/registrations.mjs:6496`; doc checks at `registrations.mjs:3746` and their call sites.
- The ten rows call `checkEventStore(cwd, id)` directly, bypassing `eventStoreDoctor`, the shared lazy snapshot built for this purpose (`event-store-checks.mjs:28-31`; only tests use it). Each row recomputes `eventStoreFacts`, and five rows each run their own full `status()`.
- The eight doc checks each run `workStoreOpen` (a full `read`) and then `rebuild(fgosDir)`. That `rebuild` is a full refold plus a cache install under the `state` gate, so doctor also writes the cache eight times.
- Fix: create one `eventStoreDoctor` per doctor run and register the rows through it. Doc checks should share one view read (`listWork`/`currentView`), not `rebuild`.

**M3. The Land promote path names streams differently from the crate and can turn a landed merge into an error.**
- Naming (`merge.mjs:1749`): Land promotes `branch:${item.id}`. The crate's orphan detection keys worktree branches with `branch_key('fgw/<id>')`, which gives `branch:fgw-<id>` (`layout.rs:122`, `diagnostics.rs` status). So a stream following the crate convention would never be promoted, and a `branch:<id>` stream is reported orphan while its worktree is live. Unusual item ids may not even parse as stream ids. The phase 09 test registers a `branch:<work-id>` type, so it agrees with itself and does not catch this.
- Error handling: `promoteLandedStreams` runs after `mergeRunnerItemLocked` returns `merged` (`merge.mjs:787`) but inside the `try` that rethrows as `MergeError`. Any `status`/`read`/`promote` failure, for example a foreign integrity error surfaced by the full read, reports a landed merge as failed. The CAS path has the same shape at `:1659`.
- Fix:
  - Derive the branch stream key in one place, the crate's `branch_key`, exposed through the facade.
  - Make a post-Land promote failure a recorded, retryable result attached to `merged`, not a throw.

**M4. The `fgos rebuild` output contract changed without a CHANGELOG line.**
- Where: `bin/fgos.mjs:2964`, `src/verbs/events/rebuild.mjs:15`.
- Output went from `{workCount, decisionCount}` to `{rebuilt:[{consumer, result:<entire view>}]}`, which prints whole Work and porting views to stdout.
- Fix: return a per-consumer summary (counts, revision, cursor coverage) and add a CHANGELOG line.

## Low

- **L1 (L10 leftovers with no consumer):**
  - `FGOS_FILE.GUARD_MARK` in `src/state/fgos-file-registry.mjs:25,37`.
  - The `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` switch, still set by `scripts/run-tests.mjs:176`, `scripts/stress-test-files.mjs:77` and asserted in `test/scripts/run-tests.test.mjs`.
  - `checkpointMainFgos` (`src/runner/main-fgos-checkpoint.mjs`) now has no production caller. Spec §19 keeps a null adapter; either delete it with the test, or state why it stays.
  - Projects that still carry `checkpoint.fallbackIntervalSec` get no notice that it was retired.
- **L2 (stale or garbled comments, import placement):**
  - `bin/fgos.mjs:240-275` describes regex alternatives that were removed.
  - `bin/fgos.mjs:5090-5093` is a garbled sentence ("instead of silently allowing a mutation to create a second store / create a fresh, empty one").
  - `src/runner/claim-port.mjs:103-105`, and the headers of `scripts/{verify-fanout-overlap,measure-verify-cost,probe-storytelling-material}.mjs`, still say these files read `.fgos/events.jsonl`.
  - New imports sit above the header comment in `bin/fgos.mjs:2-3`, `loop.mjs:1`, `session.mjs:1`, `gateway-control.mjs:1` and `merge.mjs:1-2`.
- **L3:** `bin/fgos.mjs:5178` computes `getMainFgosDir(dir)`, which spawns git, for every verb, including verbs that do not open the store. Compute it only when `opensEvents` is true.
- **L4 (CHANGELOG):**
  - Entries are fragmented and duplicated: the `seq` meaning and the Linux-only rule each appear twice, and internal proof-harness lines are included.
  - Missing: the removal of doctor rows `events-jsonl-not-truncated` and `events-compaction-verified`, the retired `checkpoint` config default, and the `rebuild` output change (M4).
- **L5:** The hook prefix test `p.startsWith('.fgos/events') && p !== '.fgos/events'` also refuses unrelated `.fgos/events-*` names. Match `.fgos/events.jsonl*` and `.fgos/events/` only.
- **L6 (E3 exemption):**
  - `e3Fixture` runs before the bounded-ref check and does not prove that the push's remote operand is a fixture.
  - Sites `:154` and `:582` push `refs/seed/*` and would pass as bounded anyway. Only `:497` (raw `update-ref refs/fgos/events/raw`) needs the exemption.
  - Fix: limit the exemption to invocations that name an event ref, and require the remote operand to resolve to a `bareRepo` fixture.
- **L7 (command registry):**
  - `events` is marked `touchesState`/`externalEffect` for read-only `status`/`export`.
  - `events sync`/`events migrate` (and `rebuild`) are absent from `MUTATING_SUBCOMMAND_PREDICATES`, so the disconnected-worktree guard does not classify them.
- **L8 (D13 narrowed):** D13 says sync runs "only in sessions of the main checkout's own user (never dispatched workers)". The code checks only `FGOS_DISPATCH_DEPTH`, and spec §21 now says only "dispatched sessions". Either enforce the owner-user condition (euid against the owner of the main checkout's git dir) or record the narrowing as a decision.

## Verified sound (no finding)

- **Readers:**
  - `attestation-guard.mjs` reads the facade with `requireComplete` and fails closed.
  - `enduser-index-generate.mjs` uses `listWork` and refuses before overwriting the manifest.
  - `claim-port.mjs` reads `tx.view` and `readClaims(dir, tx)` inside the gate.
  - The doc sentinels and the friction migration in registrations read through the facade, and the friction migration keeps legacy provenance.
  - The Rust `event_reader.rs` refuses deferred or missing history and strips `.fgos/` as doctor does.
  - `rg` finds no `resolveWriterLogPath`, `appendEventCore`, `repairTruncatedLastLine`, `readAllEventsFromDir`, `readEventsFromByte`, `rebuildViewFromDir`, truncation-guard or compaction import left in `src`, `bin` or `scripts`.
- **Removals:** the deleted migration scripts only rewrote retired files, matching the coordinator decision.
- **Registrations:**
  - Routes, envelope vector and registry agree: `events` added, `repair` removed in all three.
  - There is one `eventStore` default, and the old `{remote}` row is gone.
  - Ten checks and three fixes match spec §21.
  - Per-row and per-fix failure isolation is in place.
- **Land ordering:** `project` is sealed before both the merge/commit path and the CAS Land, and promote runs only on `merged`. The tsk-3tp sweep is gone, and event paths now fall through to `fgos-write-rejected` in both restore paths.
- **Triggers:**
  - The start trigger runs before `runVerb` and outside any gate; the end trigger runs in `finally`.
  - `events migrate` is excluded, and `init` gets the end trigger only.
  - `endSession` and `stopGateway` trigger after `lock.release()`; the runner loop triggers per iteration and on shutdown.
  - The post-append seal is opportunistic and wrapped in `try`.
  - Only the dispatch-depth check gates the push; see L8.
- **Host proof harnesses fail loudly:**
  - `settle-host-proof.mjs` requires `--host`.
  - `settle-fault.py` exits non-zero off Linux x86_64 and raises when no settle write was intercepted.
  - `v-spawn-bench --store-increment` refuses without ext4, without strace, with other session sets, and on incomplete trace windows, barrier timeout or the 60 s bound.
- **Door repository scan:** green, with four enumerated E3 sites, about 8 s. That green does not prove soundness; see H3.

## Unresolved questions

- Does the native incremental read with a cursor skip the legacy parse? I saw `read_legacy` called on the full-read path; the write path belongs to review A. If it does not skip, every Work mutation pays the legacy parse too.
- Should `checkpointMainFgos` survive as a null adapter (spec §19 wording), or be deleted with its last test?

Status: DONE_WITH_CONCERNS
Summary: Not ready to merge for review B's area. Three Highs must be fixed first: a full-history `status()` walk on every command, runner poll and Land; three live tests of deleted mechanisms that now fail; and a V-DOOR-01 scanner that passes literal event-ref pushes through shells and absolute git paths. Readers, removals, registrations and Land ordering are otherwise sound.
