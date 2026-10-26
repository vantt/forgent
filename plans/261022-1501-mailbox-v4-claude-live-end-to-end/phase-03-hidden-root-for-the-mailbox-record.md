---
phase: 3
title: "Mailbox root in the hidden roots"
status: done
depends_on: [1]
live_calls: 0
---

# Phase 3: Mailbox root in the hidden roots

## Why

Spec §8 item 6 and §14 (V4 "Waits for"): a worker under `hostRead: blind` keeps `--ro-bind / /` and has only the listed hidden roots masked, so today it can read every mailbox message and registry entry under `<fgosDir>/runtime/mailbox/`, which exists since V2. The board announced this edit as mailbox's own (`efba97e1f`, 2026-10-22 10:05); no other lane holds the file. The board's line said `'{fgosDir}/mailbox'`; the real root, named only by `packages/mailbox/rust/store/src/record/paths.rs`, is `<fgosDir>/runtime/mailbox`. Use that one; the closing report tells the controller the board line was imprecise.

The whole `runtime/mailbox` directory is hidden, not only `record/`: it also holds the breaker file (spec §4.1), and nothing in it is a worker's input. `.fgos/runtime` itself stays visible.

**A root that does not exist is skipped today** (`resolveBlindHiddenRoots`, `resources.mjs:210-214`: `realPathOrNull` plus `isDirectory`), and the mask is fixed when the worker starts. The mailbox record is created lazily by the first hook, so a blind worker started before any head registered would see every message written later. Peer run-state roots do not have this problem in practice because a dispatch creates its own before workers start; the mailbox root is created by an independent session at any time. So the mailbox root is **created (mode 0700) when missing** at resolve time, before the mask list is built. Creating the empty directory is what `Record::open` would do anyway (`record/mod.rs` `Record::open`: "Creates the record directories (mode 0700) when missing"); the record accepts an existing directory owned by the user. <!-- Updated: red-team - mask must not depend on creation order -->

## Files

- Modify `src/runner/dispatch/confinement/resources.mjs`:
  - add `'{fgosDir}/runtime/mailbox'` to `BLIND_HIDDEN_ROOTS`, after `'{fgosDir}/dispatch-runs'`; a one-line comment names `packages/mailbox/rust/store/src/record/paths.rs` as the owner of the path, since Node cannot import it;
  - in `resolveBlindHiddenRoots`, create that one root (`fs.mkdirSync(path, { recursive: true, mode: 0o700 })`) when it is missing, before the existence filter; keep the filter for every other root (their tests stay as they are). Express "created when missing" as data next to the list (a frozen one-entry list or a field the loop reads), not as a path string inside the loop;
  - update the doc comment above the list ("Only the three run-state directories are listed" becomes peer run state plus the mailbox record of live sessions, still never all of `.fgos`).
- Modify `test/runner/dispatch-confinement-blind.test.mjs`, the two tests that own this behaviour:
  - `the hidden roots are data in the contract…` (list equality; retitle to "the hidden roots are data in the contract: peer run state and the mailbox record, never all of .fgos");
  - `hidden roots resolve to the existing ones of this project…`: expect the mailbox root after `dispatch-runs`, **with `makeProject()` not creating it**, and assert it now exists with mode 0700 after resolving (the "created when missing" behaviour); the existing "a root that does not exist is skipped" assertion stays for `dispatch-runs`.
  No new test: these two own the behaviour (design principle 8).
- Modify `docs/specs/confinement-authority.md` §9.2: the hidden-root sentence and reason (1) name `{fgosDir}/runtime/mailbox` (the record of live agent sessions' messages, created when missing so the mask never depends on which started first), with a pointer to `docs/platform/agent-mailbox/spec.md` §8 item 6.
- Modify the branch spec `docs/platform/agent-mailbox/spec.md` §8 item 6 and §14 prerequisites: met on the branch (path, test names, the create-when-missing rule).

## Steps (TDD)

1. Sync; `free -g` ≥ 8.
2. Red: change the two tests' expectations; `node --test test/runner/dispatch-confinement-blind.test.mjs` fails on exactly those two.
3. Green: edit the list, the create-when-missing step and the comment; the file passes.
4. Other readers: `rg -n "BLIND_HIDDEN_ROOTS|resolveBlindHiddenRoots" src test` (today `resources.mjs` and `src/runner/execution/handoff-refs.mjs:185,247`, which copies hand-off refs inside a hidden root into the worker's `inputs/`; a mailbox file is never a hand-off input). Run `node --test test/runner/execution/handoff-refs.test.mjs`, then each test file that imports `resolveConfinementResources` (`rg -l resolveConfinementResources test`), one file at a time. `handoff-refs.mjs` now also creates the mailbox root when it resolves; confirm that its tests do not assert an exact directory listing of `.fgos`.
5. Docs edits. `fgos convention check --dir . -- docs/specs/confinement-authority.md docs/platform/agent-mailbox/spec.md`.
6. Commit (`feat(confinement): hide the mailbox record from blind workers, even before it exists`), census, end-of-phase sync, rerun step 3's file, push.

## Proof

`node --test test/runner/dispatch-confinement-blind.test.mjs` green on fresh main; the touched sibling test files green.

## Risk

- A worker that legitimately needed to read the mailbox record: none exists (spec §8 item 6). Reversal: remove the entry and the create step.
- The directory is created by the dispatcher's user in the project's `.fgos/runtime`, the place the record itself would create it; no other path is written.

## Done on the branch (implementation lead, 2026-10-22)

- `node --test test/runner/dispatch-confinement-blind.test.mjs`: red on exactly the two owning tests first, then 15 passed.
- Sibling files through `scripts/run-tests.mjs` (which stages the host binary; it ran the whole suite, ignoring the file list): `dispatch-confinement-blind`, `execution/handoff-refs`, `provider-per-cli-credential-sources`, `provider-credential-renewal`, `dispatch-confinement-backend-p03`, `dispatch-confinement-credential-hygiene` all passed. The whole run: 8832 tests, 8694 passed, 42 failed, none in confinement or hand-off files (`rust-host/fgctl-*`, `setup/*`, one `dispatch.test.mjs` codex placeholder case); phase 10 compares them with clean main. Under plain `node --test` those four sibling files fail the same counts with or without this change (no host binary).

### Deviations

- The mailbox root is created only when the `.fgos` directory itself exists: `refIsHiddenFromBlind` (`handoff-refs.mjs`) resolves the roots for any project, and a read-only check must not create a `.fgos` in a project without one. The record requires `.fgos` to exist anyway.
- The board line `'{fgosDir}/mailbox'` was imprecise; the root is `'{fgosDir}/runtime/mailbox'` (`record/paths.rs`).
