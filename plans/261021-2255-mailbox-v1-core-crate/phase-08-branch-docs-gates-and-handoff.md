---
phase: 8
title: "Branch docs, full gates, hand-off"
status: done
priority: P2
effort: "3h"
dependencies: [7]
---

# Phase 8: Branch docs, full gates, hand-off

## Goal

Leave V1 provable by a stranger on the branch: the spec and the two indexes say where the crate is and what V1 decided, every repository gate is green on top of a fresh main, the branch is pushed, and the controller has a short report. Nothing merges to main.

## Steps

1. **Sync** (plan.md § "Branch sync rule").
2. **Docs on the branch only** (L5 question 6; settled facts go into the area spec):
   - `docs/platform/agent-mailbox/spec.md`: header `Implementation status:` → "V1 (`fgos-mailbox-core`) built on branch `mailbox/v1-v3`, not on main; V2-V7 not started"; header `Source (planned)` keeps the store path planned and names the core as existing on the branch. §5.5: record the chosen escape (plan decision 8) in one paragraph, and correct the reply-command example to the §6.1 verb shape (`send --to <name> --reply-to <id> <body>`, decision 15). §5.3/§12: add the three Q1 keys with "provisional, owner question open", the order of refusal checks (decision 4), the shared `unregistered` sender (decision 12) and the lifetime-cap exemption pending Q3. §16: add owner questions Q1-Q3 as open items. §17: one row "V1 implementation decisions (agent, inside the signed frame): decisions 1-16 of `plans/261021-2255-mailbox-v1-core-crate/plan.md`", by "planning lead (agent)", status "applied on branch; numbers stay unsigned; Q1-Q3 open". Never attribute an agent decision to the owner.
   - `docs/specs/reading-map.md` line 54: replace "chưa có mã … source (dự kiến): `packages/mailbox`" with the core's path and crate name, marked "nhánh `mailbox/v1-v3`, chưa vào main".
   - `docs/platform/component-boundary.md` line 88: "implementation not started" → "V1 core built on branch `mailbox/v1-v3`".
   - Do not touch `CHANGELOG.md`: V1 is not user visible; spec §12 and §14 put the line at V7.
   - Do not add a doctor check: spec §12 and the owner decision of 2026-10-19 put it at V7. Do not add the config-merge registration either; that is this plan's own choice (decision 1: V1 has no runtime reader), and the rung that first reads configuration at runtime (V5) registers `limits.v1.json` through `registerConfigDefault`. Say so in the spec without citing the 2026-10-19 decision for it.
3. **Census**: `node scripts/git-one-door-scan.mjs --write-census` (the spec and index edits do not change hashed product files, but run it to be sure the census matches the branch).
4. **Full gates** (inside `/home/vantt/projects/forgent-mailbox`; run the branch sync again immediately before them, and rerun all of them if the merge brought changes):

   ```bash
   cargo fmt --all -- --check
   cargo clippy --locked --workspace --all-targets -- -D warnings
   cargo test --locked --workspace
   npm test
   cargo tree -p fgos-mailbox-core -e normal --depth 1
   ```

   Compare with phase 1's baseline. A failure that also fails on main is reported with its exact command and output and left alone; a failure that main does not have is fixed on the branch before this phase counts as done.
5. **Review**: run a code review of `git diff origin/main...mailbox/v1-v3 -- packages/mailbox Cargo.toml` (the installed `code-reviewer` agent or `ak:code-review`), focused on: purity (and the lint described as narrowing, not enforcing, rule 3), every number from the contract, every `MailboxState` field covered by `tests/snapshot.rs`, every per-sender map bounded by bindings plus one, one owning test per behaviour, no test-only branch. Apply accepted findings on the branch.
6. **Final sync, commit and push the branch**: branch sync once more; if it brought changes, rerun step 4; one commit `docs(mailbox): record the V1 core on its branch`; `git push -u origin mailbox/v1-v3` (the branch is shared across leads; never push or merge it into main).
7. **Hand-off report** to the controller (path from `fgos convention path --kind report --type closing --slug mailbox-v1-core-crate --json`): commits, test counts per file, gate results against the baseline, the open owner question Q1, and the next rung (V3 on the same branch; V2 once the lock row exists). The controller updates board row `MAIL` on main.

## Acceptance criteria

- `cargo test -p fgos-mailbox-core --locked` green on top of a main merged within this phase; all gates of step 4 green or failing identically on main.
- `git log origin/main..mailbox/v1-v3` shows only mailbox commits and merges from main; `git log origin/mailbox/v1-v3..origin/main` is empty right after the final sync; main has no commit from this plan except the plan files.
- The spec, reading map and component boundary on the branch name the crate and its status.

## Risks

- Merge conflicts on `Cargo.toml`, `Cargo.lock` and the mutation census at each sync: resolve on the branch, regenerate the census and the lock, rerun the proof.
- A gate red on main for reasons outside the mailbox: reported, not fixed here (RUL11: separate item).

## Implementation notes (2026-10-22)

- Docs on the branch: spec header (implementation status, source, last reviewed), §5.1.1 (exact key before key prefix; the `unregistered_…` label; writer-key bound), §5.3 (order of checks 0-10, the shared `unregistered` sender, lifetime caps for heads only, two-tier counters), §5.5 (corrected reply command; the chosen escape), §6.4 (`last_drain_at` and `schema_version` rules; a V5 note that `resolve_workspace_root` exists, leaving the old sentence for V5 to correct as the plan says), §12 (the three Q1 keys, the limits contract, config-merge registration at V5), §17 (owner decisions Q1-Q3 of 2026-10-21; V1 implementation decisions by the planning lead (agent); the review fixes by the controller as plan owner (agent)). `docs/specs/reading-map.md` and `docs/platform/component-boundary.md` name the crate on this branch. No CHANGELOG line, no doctor check (V7).
- Deviations:
  - **Formatting gate scoped to the crate** (controller decision, 2026-10-21): the gate is `cargo fmt -p fgos-mailbox-core -- --check`, not `cargo fmt --all -- --check`. Main already fails the workspace check in 175 files outside `packages/mailbox` (phase 1 baseline); they belong to other lanes and are tracked as item `tsk-hls`.
  - Owner questions Q1-Q3 were answered before this phase, so they go to §17 as owner decisions, not to §16 as open items.
  - The code-review step (step 5) is left to the controller, which runs an independent final review of the whole crate.
- Gates (run twice: on main `57cb8ca68`, then again after the final merge of main `9670da5ff`, same results):
  - crate: fmt clean, clippy clean, `cargo test -p fgos-mailbox-core --locked` 78 passed, 0 failed; `cargo tree` shows serde only.
  - `cargo clippy --locked --workspace --all-targets -- -D warnings`: exit 0.
  - `cargo test --workspace --locked`: exit 0; 1321 passed, 0 failed, 11 ignored.
  - `npm test`: exit 1; 8709 tests, 8595 passed, 18 failed, 31 skipped, 65 todo; plus two suite-level errors (a leaked `fgos-direct-repo-*` temp dir from `test/run-supervisor/support/direct-harness.mjs`, and `.fgos/runtime/git-addon/<id>/manifest.json` modified).
    - 17 failures (`test/rust-host/fgctl-upgrade.test.mjs` 15, `test/rust-host/fgctl-init-download-sources.test.mjs` 2) also fail on main: the same files run in the main checkout at `180ed62fd` failed 23 of 48, a superset of the branch's 17.
    - The 18th, `test/scripts/run-test-canary.test.mjs` "wrapper overhead … median under 250ms", is a timing bound (265 ms measured under the full suite's load); it passes on the branch when run alone.
    - The two suite-level leaks come from run-supervisor and git-addon tests; the branch changes no Node, JavaScript or test file outside the Rust crate, so they are not caused by it. They were not reproduced on main (that needs a full suite run in the owner's main checkout).
- Final gate run, after the last merge of main `30053b8a3` (merge `4772a01f6`; `Cargo.toml` kept both new members, `packages/mailbox/rust/core` and `packages/seat-binding/rust`; `Cargo.lock` and the census regenerated):
  - crate: fmt clean, clippy clean, 78 passed, 0 failed; `cargo tree` serde only. Workspace clippy exit 0.
  - `cargo test --workspace --locked`: exit 0; 1335 passed, 0 failed, 11 ignored.
  - `npm test`: exit 1; 8848 tests, 8731 passed, 21 failed, 31 skipped, 65 todo; one suite-level error (a leaked `fgos-direct-repo-*` temp dir).
    - 19 failures also fail on main `30053b8a3` (a detached scratch worktree at that commit, outside the repository, removed afterwards): the 17 fgctl ones, `test/runner/assignment-dispatch.test.mjs` "decideExecutorCli resolves dispatch plan for an assignment" and `test/runner/dispatch.test.mjs` "codex's cli-bypass invocation …"; main fails 114 of 424 in those six files.
    - Two fail only under the full suite's load and pass alone on the branch and on main: the canary "wrapper overhead … under 250ms" (265 ms measured) and `test/seat-binding/route-doctor-check.test.mjs` "the row fails on a host that has no seat-binding route" (`spawnSync … EPIPE` from its fake host).
    - The branch changes no Node, JavaScript or test file; none of these failures is caused by it.

## Final-review fixes (2026-10-22, `reports/code-review-final-v1.md`)

Decisions by the controller as plan owner (agent), recorded in spec §17 on the branch. Each fix is test-first; the reviewer's mutation census (reused, adapted to the new code) went from 24 killed, 1 hung and 7 survived out of 32 to 39 killed out of 39 (the 31 that still apply plus 8 new ones for these fixes; the `Header.kind` mutant no longer exists). The reviewer's probes now fail where they reproduced a defect (r1, r2, r3, r4, r5, r10, r12) and still pass for the two items left open (r7 one binding per head, r11 age bound).

- **M1**: the derived reply link and the `--reply-to` hint require mail offered to the sender's *current* generation; a taken-over process inherits no chain, depth or hint. Proofs: `tests/policies.rs` *a new sender generation inherits no reply link and cannot hint at mail offered to the old one*, *a depth-capped chain does not block a new process of its sender*.
- **M3**: a `Dead` takeover drops the old generation's `lifetime` and `wake_lifetime` counts and the key's `exchanges` and `budget` entries. `MailboxState::forget_key(&key) -> bool` removes every record of a key (binding, headers and notices naming it, keyed counts, notice marks, per-party counters; totals stay); it decides nothing about when, V2 calls it under Q2. Proofs: `tests/registry.rs` *takeovers drop the dead generation's records so fifty restarts leave no growth*, *forgetting a key removes every record of it and a later registration starts clean at generation 1*.
- **M5**: `tests/policies.rs` *every adjacent pair in the send check order reports the earlier check*: one table, pairs 0-1 to 9-10, each condition ordinary input or a limit set through configuration. Every swap mutant is killed.
- **M6**: `ClaimedItem { id, attempt, what: ClaimedWhat::{Mail(MailFrom), Notice(NoticeFacts)} }` and one `render(item, body, limits)`; a message item cannot reach the notice renderer. Non-test `panic!`/`unwrap()`/`expect(` and indexing on public paths: none left. The frame contract's section lookup falls back to an empty text instead of `expect`, a fallback never taken because the contract is compiled in and its test proves every section; the two `messages[i]` index uses became `get`/`get_mut`.
- **Lows**:
  - `Header.kind` retired with its three dead filters and the notice case of the hint test that proved nothing; `Kind` stays on the views. The schema stays at 1: no version-1 snapshot was ever persisted (V2 is not built), and V3 bumps it to 2.
  - The body escape removes all of Unicode Cf, every Default_Ignorable_Code_Point (both blocks of variation selectors, the Hangul fillers, U+034F, the reserved ignorables) and U+2800; proven in `tests/frame.rs`. Look-alike brackets stay, measured at V6.
  - `WriterKey` accepts only `[A-Za-z0-9._-]`, so the `|`/`@`-joined composite keys are unambiguous; the shared accounts are `~unregistered` and `~unresolved`, which no key can take, so a head keyed `unregistered` keeps its own account (proofs in `tests/registry.rs` and `tests/policies.rs`). The unregistered-label test now uses keys inside the alphabet.
  - New proofs: the `-` case of the unregistered label (`unregistered_co-de-xx`) and the `&` escape (a pre-encoded closing tag).
  - The A→B→C→A loop and the scripted replay are bounded by values derived from the limits, so a broken cap fails instead of hanging (the lifetime-removal mutant is now killed, not hung).
  - The snapshot version is checked inside deserialization (`deserialize_with`); `SnapshotVersion::check` stays as the cheap pre-read.
  - The frame contract is parsed once (`OnceLock`); the loop and share checks compare accounts without allocating; the exchange-gap meaning in `limits.v1.json` now says "at least this long".
- Not done, as decided: M2 (owner question), M4 (V3 decision), a head sending to itself (owner question). Not done either: sweeping idle `exchanges` and emptied `budget` entries by time (the reviewer's optional half of M3); the takeover and `forget_key` already bound them by bindings.
