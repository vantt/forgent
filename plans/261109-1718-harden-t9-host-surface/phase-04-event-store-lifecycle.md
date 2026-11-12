---
phase: 04
title: "Event Store lifecycle in one wrapper, fault logs below the shell and redacted, detached child below the shell, init as a use case"
status: landed
depends_on: ["03 landed"]
parallel: "T3 layer; alone in its layer"
effort: ~1.25d
net_size: "Node: bin about -110, src about +85; Rust 0; tests about 0 (estimate)"
---

# Phase 04 - Event Store lifecycle, fault logs, init (T9-07, T9-12, T9-18; X2, X5; L-5)

## Context

`maintainEventStore` (`src/event-store/maintenance.mjs:36`) is the one door; `src/runner/session.mjs`, `src/runner/gateway-control.mjs:359` and `src/runner/loop.mjs:1790` call it as a clean writer exit. Only `main()` holds the shell's own policy: the start trigger (drops its `{ error }`, `bin/fgos.mjs:5303-5310`), the end trigger (records it, `:5374-5389`), the seal hand-off, and the Land release keyed on verb names (`landsWork`, `handSealsToChild`, `opensEventStore`, `isEventStoreChild`, `EVENT_STORE_LIFECYCLE_VERBS`, `:4872-4895`), while the real Land owner is `landRunnerItem` (`src/runner/merge.mjs`) (T9-07: asymmetric error handling, verb-keyed Land).

Layer inversions (T9-12): `src/observe/friction-client.mjs:10` imports `../cli/invocation-fault-log.mjs`; `src/verbs/merge/approve.mjs:60` imports `../../cli/approve-fault-log.mjs`; `src/event-store/maintenance.mjs:5` and `src/workflow/case-start.mjs:26` import `../cli/detached-child.mjs`; `src/setup/registrations.mjs:106` imports `../cli/version.mjs` (that last one belongs to P10). `invocation-fault-log.mjs:68-80` writes the full argv, with umask mode and no size cap (red-team F9). `detached-child.mjs:10` assumes the entry sits inside the release payload (T9-18).

Decision L-5 (X5): the detached child keeps `bin/fgos.mjs` as its entry because a child that called the host would hit `FGOS_RUST_HOST_RECURSION_GUARD` (`legacy_exec.rs:35-42,245`); only `spawnDetachedCli` moves down. Routing the child through the host is T3/T6's with the ES reviewer, later.

## Requirements

1. **`runWithEventStoreLifecycle(facts, fn)` in `src/event-store/maintenance.mjs`** (existing file). Facts: `{ trustedMain, dispatched, opensStore, landed }`. The Land release comes in as a **callback** so T3 imports no Work or merge code. Start and end triggers record their error the same way. `trustedMain` is resolved by the function when omitted, so `session.mjs` and `gateway-control.mjs` drop their own `resolveMainCheckoutRoot(x) ?? x`. `main()` makes one wrapper call around `runVerb`; the verb-keyed sets move into the registry's `landsWork` and `store` fields (P01).
2. **Fault logs move to `src/observe/`**: `invocation-fault-log.mjs` and `approve-fault-log.mjs`. Values are redacted to an argv shape (verb, sub-verb, flag names, value lengths); the file is 0600; capped: drop the oldest half past 1 MB.
3. **`spawnDetachedCli` moves to `src/util/spawn-detached-fgos.mjs`**, same contract and same entry. One release-layout assertion in the existing `test/distribution` source-payload test (T9-18).
4. **Manifest guard**: `src/{event-store,workflow,observe,verbs,setup}` import nothing from `src/cli` (`docs/architecture-manifest.json` row, checked by `test/architecture.test.mjs`). `registrations.mjs:106` is handled by P10, so this phase adds the guard with that one file listed as the named exception until P10 removes it.
5. **`initStoreUseCase`** in `src/state/store.mjs`'s neighbourhood: one function composing mint, lock dirs, `initStore`, the coexistence manifest and Git recovery (the `init` arm body `:1005-1044`). The arm keeps flags and print. The `init` guard is P03's `admitStoreAccess`.
6. **Shutdown callers take the root from the door (authority audit AU-05).** The three clean-writer exits that call `maintainEventStore` with their own fallback `resolveMainCheckoutRoot(root) ?? root` (`src/runner/session.mjs`, `src/runner/gateway-control.mjs`, `src/runner/loop.mjs`; re-read by `rg -n "resolveMainCheckoutRoot\(.*\) \?\? " src/runner`) call P02's invocation-root door instead; the fallback lines go. `loop.mjs` is the runner loop: one line, WORK told if its row says Work. Authority moved: when to open, maintain, seal and hand off the Event Store is the T3 use case; it reads verb facts from the registry (P01) and the root from P02.

## Files

**Create:** `src/util/spawn-detached-fgos.mjs` (moved), `src/observe/invocation-fault-log.mjs`, `src/observe/approve-fault-log.mjs` (moved; `git mv`).

**Modify:** `src/event-store/maintenance.mjs`, `src/runner/session.mjs`, `src/runner/gateway-control.mjs`, `src/runner/loop.mjs` (one root line), `src/observe/friction-client.mjs`, `src/verbs/merge/approve.mjs` (one import line, WORK told), `src/workflow/case-start.mjs` (one import line), `src/state/store.mjs` (init use case), `bin/fgos.mjs` (`:1005-1044`, `:2953-2985`, `:4865-4895` lifecycle helpers, `main()` `:5301-5310`, `:5351-5389`), `docs/architecture-manifest.json`, `test/architecture.test.mjs`, `test/event-store/triggers.test.mjs`, the fault-log tests (move with the files), the `test/distribution` source-payload test, `packages/git/contracts/mutation-census.v1.json` (regenerated if a hashed file moves: `node scripts/git-one-door-scan.mjs --write-census`), `CHANGELOG.md` (one line: fault log records argv shape only).

**Delete:** the old `src/cli/` copies (moved), the shell's lifecycle helpers and `EVENT_STORE_LIFECYCLE_VERBS` residue, the inline `init` composition.

**Tests to retire:** none outright. Lifecycle cases that spawn the CLI to see the start/end triggers are owned by `test/event-store/triggers.test.mjs` after this phase; one `test/cli` wiring case stays. P01's census names the rest.

## Red tests first

- `test/event-store/triggers.test.mjs`: a start-trigger error is recorded (today dropped, `:5303`); the end-trigger error is recorded the same way; the Land callback fires only when `landed` and not dispatched.
- Fault-log redaction: argv with a secret-looking value records lengths, not values; file mode 0600; over 1 MB drops the oldest half.
- Architecture: an import of `src/cli` from `src/observe` fails (guard red until the moves land).

## Net size

bin about -110 (lifecycle and guards -90, init composition -20); src +85 (wrapper +70, redaction +15; moves ~0; `session`/`gateway-control` fallbacks -?); tests ~0.

## Steps

1. Callers by `rg` of `spawnDetachedCli`, `recordInvocationFault`, `recordApprovePostSuccessFault`, `maintainEventStore` with `file:line`.
2. Red tests; wrapper; moves with `git mv`; callers; manifest; census regenerate.
3. Message lead:ES with the branch, range and a quiet window (spec §16).
4. Smoke: `events seal` runs through the detached child; a forced start-trigger failure appears in the fault log.

## Validation (focused)

FR `test/event-store test/architecture.test.mjs test/cli/fgos-setup.test.mjs` plus the fault-log and `test/distribution` tests; `git-one-door-scan` 0 undeclared; land gate. lead:ES APPROVE before merge.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The wrapper changes the order of seal hand-off and Land release | M x H | golden sequence test of the five effects; ES reviews against spec §16 |
| The moved fault log breaks `faultClass` readers | L x M | `rg` of readers first; one import-path change each |
| Redaction hides a field an operator relied on | L x L | the verb, sub-verb and flag names stay; stated in the CHANGELOG line |

## Rollback

Revert the merge commit; the files return to `src/cli`.

## Done when

Red then green; `rg -n "from '.*\.\./cli" src/event-store src/workflow src/observe src/verbs` nothing; `main()` holds one lifecycle call; ES APPROVE recorded.
