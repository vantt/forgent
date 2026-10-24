---
title: "Review B: WORK cutover readers, triggers, removals and registrations"
date: 2026-10-22 (Asia/Saigon)
range: c56f1eae3..c8ec81e23 on work/es-cutover
mode: read-only (git, rg, reads). No tests, no cargo.
---

# Review B: readers, triggers, removals, registrations

**Verdict: mergeable for my area once M1 to M4 are fixed or explicitly accepted by the owner. Nothing is Critical or High.**
All three Highs from the p09 review are closed:
- H1: triggers read `store.maintenance`, not `status`.
- H2: the stale tests are retired.
- H3: the door scanner is Git's, not part of this diff.

The p09 Mediums M2, M3 and M4 and the Lows L1, L3, L5, L7 and L8 are closed too. What remains are four Medium gaps: one dropped guarantee, one config edge case, one data exposure and one missing wiring proof.

## Critical
None.

## High
None.

## Medium

**M1. The pre-commit line-count guard was retired, but the files it protects are still read as truth until `fgos events migrate`.**
- Where: `.githooks/pre-commit`. U6 removed `stagedFgosModificationsRegressLineCount` (U6 report line 34). The test retirements say "retired with the guard".
- What still depends on those files:
  - `addedEventPathRefusal` (`.githooks/pre-commit:302-311`) acts only after the fence file exists (line 308).
  - Before migration, the tracked `.fgos/events.jsonl` and `.fgos/events/*.jsonl` (97 tracked files here, and the same in every project that installs this release) are still read as legacy history.
  - `events migrate` imports them from HEAD byte for byte (spec §18 step 3).
- Failure: someone stages an older `events.jsonl` (stash, checkout or reset, the exact incidents tsk-1i3 recorded) and commits it on main. The hook no longer refuses. The lost lines drop out of every view, and later out of the import. The deletion guard (`stagedFgosDeletions`, `:241`) still catches deletions but not truncation.
- Fix (choose one):
  - Keep the line-count refusal until the fence exists, i.e. only while `addedEventPathRefusal` returns null because there is no fence. Retire it in the same change as the repository's migration (U9/U10).
  - Or name the owning successor and the accepted risk in the U6 retirement line and in the CHANGELOG.

**M2. A malformed shared config silently resets `eventStore.remote` and `sync.intervalSec` to their defaults, so the end trigger can push to `origin` against the user's setting.**
- Where: `src/event-store/config.mjs:27` uses `readSharedConfigOrEmpty`. Every trigger reads config through it (`src/event-store/maintenance.mjs:30`).
- Failure: a user sets `sync.intervalSec: 0`, which is the CHANGELOG's own advice for a clone without a remote, or `remote: "fork"`. Later they leave the config half-edited. Every owner command then pushes event refs to `origin` until the file parses again. Doctor reports bad JSON, but only when doctor is run.
- Fix: when the shared file exists but does not parse, the trigger skips `sync` and only seals. One way: a `{ parsed: false }` flag from the reader, or a reader that throws, caught by `maintainEventStore`. Do not use the defaults for a publish decision.

**M3. `fgos events status` prints the raw remote URL, including any userinfo or token.**
- Where: `src/verbs/events/status.mjs:5` returns `remoteUrl: facts.remoteFact.url` and the whole `facts`, which includes `provenance.url`. The URL comes unredacted from `packages/event-store/rust/src/diagnostics.rs:43,55`. By contrast, the Git driver redacts URL userinfo in everything it reports (`packages/git/rust/src/driver.rs:1753`).
- Failure: a clone with `https://user:ghp_xxx@host/repo` prints the token to stdout. Agent transcripts and logs capture it. This verb was unreachable before this branch registered it.
- Fix: redact userinfo and query in `eventStoreFacts`, the one source, before the URL reaches any verb or doctor message. Keep the unredacted URL only inside the comparison against provenance.

**M4. The Land release sweep at command end has no wiring proof.**
- Where: `bin/fgos.mjs:4826` (`landsWork`), `:5231` and `:5298`.
- `releaseRecordedLand` itself is proven in `test/direct/merge-gate.test.mjs:596-613`. No test shows that the sweep:
  - runs at the end of `approve`, `sync-root`, `promote-to-component` and `merge next`;
  - does not run for other verbs;
  - does not run when `FGOS_DISPATCH_DEPTH>0`, which is D13 as the CHANGELOG states it.
- Failure: if someone renames a positional or reorders the `finally`, candidates stay retained forever, or a worker releases them, and the suite stays green.
- Fix: add one CLI wiring proof next to the trigger CLI case in `test/event-store/triggers.test.mjs`: a Land verb sweeps, a dispatched one does not. That follows design principle 8: one wiring proof above the owning proof.

## Low

- **L1. A stale docblock that this branch introduced.** `src/runner/merge.mjs:1121-1123` still says event files "are committed through its declared checkpoint". The checkpoint was deleted in U6. Fix: drop that clause.
- **L2. Shutdown seals use the caller's root as `trustedMain`.**
  - `src/runner/session.mjs:417` passes `repoRoot`, which is raw `process.cwd()` from `bin` session end. `src/runner/gateway-control.mjs:361` does the same with its own root.
  - Neither resolves the main checkout, unlike `bin:5230` (`getMainFgosDir`) and `loop.mjs:1781`. Errors are swallowed by design.
  - Failure: `session end` run from a linked worktree may never seal, and nobody notices. Fix: resolve through `getMainFgosDir` the way the loop does.
- **L3. One failure, nine retries.** `eventStoreDoctor`'s `context ??=` (`src/setup/event-store-checks.mjs:32`) does not remember a thrown setup context. When `eventStoreFacts` fails (no repository, no addon), each of the nine non-addon rows recomputes it. Each row still fails only its own row, which is correct. Fix: memoize the error the way `createDoctorRun.once` does (`registrations.mjs:202-213`).
- **L4. CHANGELOG accuracy.**
  - (a) Line 10, "the pre-commit hook refuses to add one", is true only after migration installs the fence.
  - (b) `checkpoint.fallbackIntervalSec` is retired in two entries (lines 15 and 21). Merge them into one.
  - (c) Not stated: `fgos init` now needs a Git repository. Its store open and the new lock-dir fix both resolve the repository. The comment at `bin/fgos.mjs:1068-1071` still says a non-repo cwd is tolerated.
- **L5. Contract doc out of date.**
  - `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:36` still says the `eventStore` shape is `{ remote: "origin" }`. It now holds seal, sync, rebuild and remote (`src/event-store/config.mjs:5`).
  - The doctor how-to lists 2 of the 10 new rows. Fine if it is meant to be selective, but say so.
- **L6. Two CLI wiring proofs at one boundary.** `test/event-store/triggers.test.mjs:86` and `:108` both prove that a CLI verb runs both triggers on maintenance facts. Only `:108` adds the lifecycle-set and `migrate` exclusion cases. Fix: fold them into one test.
- **L7. A remaining L10 reader outside this diff.** `packages/work-state/rust/src/work_source.rs:86-108` still falls back to the tracked `.fgos/state.json`, which spec §19 lists as a tracked stale view that goes. It is inert today only because the tracked file has an old `viewSchemaVersion`. Fix: delete the fallback when the repository migrates, or now.
- **L8. Stale comments still name retired readers.** Examples: `bin/fgos.mjs:3016` (`rebuildView`), `src/cli/invocation-fault-log.mjs:27-30` ("`events.jsonl` is tracked on purpose"), `src/state/drift-status.mjs:15`, `src/runner/session.mjs:133,314`. These are comment-only, but the next agent will read them as fact.

## Checked and correct

**1. Readers (L10).**
- Product code no longer reads tracked event files directly. `rg` over `src bin scripts apps packages/host-runtime packages/work-state .githooks` found only:
  - `migrate.mjs` and `export.mjs` (the inventory and the legacy layout, both by design);
  - the hook fence;
  - test fixtures;
  - comments.
- `attestation-guard.mjs:25` reads with `requireComplete` and fails closed.
- `claim-port.mjs` uses `tx.view` and `readClaims(dir, tx)` inside the gate.
- `enduser-index-generate.mjs` uses `listWork` and throws before it overwrites anything.
- The three scripts read through `readRawEvents`.
- The Rust `event_reader.rs` refuses deferred or missing history.
- Deleted with no importer left: `events.mjs`, `rebuildView`, `readEvents*`, the checkpoint, compaction, the truncation guard, the legacy adapter and the guard-warnings module.

**2. Triggers.**
- `maintenance.mjs` calls only `maintenance`, `sealIfDue`/`sealAll` and `sync`. Each step is isolated, and a failure is returned, never thrown.
- Verbs that do not open the store skip `getMainFgosDir` entirely (`bin:5229`).
- `events migrate` is excluded (`:4830`).
- `init` gets only the end trigger. The end trigger runs in `finally`, after the answer is written.
- Only non-dispatched processes push and release Land candidates.
- The runner loop seals on each poll (only what is due) and seals everything on stop. It never pushes.

**2. Land.**
- `sealProjectBeforeLand` (`merge.mjs:1301`) runs before anything is published. A failure throws a `MergeError` with code `event-seal-failed`.
- `promoteAfterLand` (`:1318`) catches everything, including `branchKey`. A failure comes back as `{stream, error, retryable:true}` on `merged`.
- Drift detection stays separately caught.
- `releaseRecordedLand` and `acknowledgeLand` never throw, so the `finally` cannot crash.

**3. Registrations.**
- The `events` verb is routed in the registry, in `command-routes.json` and in the envelope vector. `repair` is removed from all three. The rest of the tree still has `fgctl repair`, a different command, and `docs/specs/work-state.md:26`, which belongs to U9.
- `MUTATING_SUBCOMMAND_PREDICATES` covers `events sync`, `events migrate` and `rebuild`. The proof is `test/cli/fgos-disconnected-worktree-guard.test.mjs:229`.
- At verb level `events` is `touchesState`/`externalEffect`. That follows the registry's "most privileged effect" convention (`command-registry.mjs:15-23`), the same as `session` and `gateway`. Read-only precision lives in the guard predicate.
- `rebuild` prints only `{consumer, counts, revision, cover}`.

**4. Doctor.**
- There is one `eventStoreDoctor` per run, through `run.once` (`registrations.mjs:6160`). `checkEventStore` catches per row.
- There is one `eventStore` config default and three explicit `registerFix` calls.
- `fgos init` calls the same fix functions as setup (one door). Both are idempotent: `install_once` in `fgos_identity::machine::mint`, and an existing directory is only chmodded.
- The clone override `fgos.machineId` is still read first by the Git driver (`driver.rs:2517`).

**5. Test retirements.**
- U6 and U7 name a reason for each retirement or say "behaviour removed (D-ADR0055)".
- The determinism, `ts`, `viewRevision` and `human-advisor` proofs moved to `foldEvents` with the same assertions.
- The p09 M1 rename bypass is fixed (`--no-renames --diff-filter=ACRT`), and so is L5 (exact prefixes).
- The only dropped guarantee that still applies is M1.

**6. CHANGELOG.** Every item in the brief appears exactly once except `checkpoint` (L4b): the `events` verbs, removed `repair`, the doctor rows, `--wait` as a no-op, the `rebuild` output, `seq`, the Windows refusal, the npm channel, `init`, and the Land release.

**7. Install/setup/doctor gate.**
- Each new requirement is registered:
  - the config section, as a config default;
  - the machine id, lock directory and refspecs, as fixes plus rows;
  - the remote push, through the `event-store-sync` row.
- No install level is hardcoded: config is read global then project, through `mergeWithGlobalConfig`.

## Unresolved questions

1. D13 for explicit verbs: a dispatched worker can still run `fgos events sync` itself. Only triggers are gated. Is that intended, since it is an explicit request, or should `syncUseCase` refuse when `FGOS_DISPATCH_DEPTH>0`?
2. The end-of-command push runs in the foreground of owner commands, and the facade `sync` waits for the seal lock (U5 concern 2). Is anyone measuring the latency it adds to the "Ship Faster" path before the release, or is it accepted as it stands?
3. Is the Rust gateway (long-lived) meant to have the per-poll seal that spec §16 lists for "gateway and runner processes"? Only its stop trigger exists.

Status: DONE_WITH_CONCERNS
Summary: Readers, triggers, Land seal and promote, registrations and doctor are correct, and the p09 Highs are closed. Four Mediums remain: a retired pre-commit truncation guard whose files are still truth before migration, a malformed config resetting the push settings, an unredacted remote URL in `events status`, and no wiring proof for the Land release sweep.
Concerns/Blockers: M1 and M2 may need an owner decision (keep the guard until the fence exists; skip sync on an unparsable config).
