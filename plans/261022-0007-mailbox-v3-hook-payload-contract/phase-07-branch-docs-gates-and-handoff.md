---
phase: 7
title: "Branch docs, full gates, review, hand-off"
status: pending
priority: P2
effort: "3h"
dependencies: [6]
---

# Phase 7: Branch docs, full gates, review, hand-off

## Goal

A stranger can find, run and trust V3 from the branch alone:

- the spec says what V3 built, what it decided, what it proves, and what it does not prove;
- every repository gate is green on a fresh main merge;
- the branch is pushed;
- the controller has a short hand-off.

Nothing merges to main.

## Steps

1. **Sync** (plan.md).

2. **Docs, on the branch only** (L5 question 6). Never attribute an agent decision to the owner.

   `docs/platform/agent-mailbox/spec.md`:
   - **Header:**
     - `Implementation status:` says V1 and V3 are built on branch `mailbox/v1-v3`.
     - `Source` names `packages/mailbox/rust/store` (crate `fgos-mailbox`: hook drain, adapters, head judgement), `packages/mailbox/contracts/adapters.v1.json`, `contracts/fixtures/hooks/` and `scripts/record-mailbox-hook-fixtures.mjs`.
   - **§4.1:** the `testedAgainst` spelling (decision 11).
   - **§5.1 row 2:** a same-head registration changes nothing, and `last_seen` is set only at registration and replacement. Refused registrations change nothing (decision 5).
   - **§5.5:** the `[message.body-missing]` frame (decision 3).
   - **§6.1, `hook mailbox` row:**
     - the Stop rule, including the first-Stop reset and counting only finished blocks (decision 8);
     - the subordinate marker rule (decision 6);
     - the shell duties: write stdout before `finish`; check that the caller is the head (decision 13);
     - the quiet reasons.
   - **§6.4:** snapshot schema version 2 and `Binding.stop_blocks`.
   - **§7 table:**
     - the injected output shapes and the recorded versions from phase 2;
     - the hook-side id variables, with the parent environment cleared;
     - the hook PID namespace;
     - the deferred subagent fixtures.
   - **§12:** `mailbox.stopBlock.max` now in `limits.v1.json`, and the `reader` field. Change its meaning from "per session" to "per head generation" (a head generation is one process of one session, spec §5.1), and say only finished blocks count.
   - **§14:**
     - **V3 row:** status "built on branch", the proof command, and what V3 does not yet prove (plan.md Outcome).
     - **V4 row:** add two items that V3 hands to V4. First, the exit-status proof: the test entry exits 0 under a panic, a failed write, a timeout and a malformed stdin, proven by running the example binary. Second, the delivery-report sentence of `send` (decision 12).
     - **V4/V5:** the caller check (decision 13), and an output-size measurement at `queue.cap × maxBodyBytes` plus frame text (decision 14).
   - **§16:** owner question Q1, if it was triggered.
   - **§17:** one row: "V3 implementation decisions (agent, inside the signed frame): decisions 1-15 of `plans/261022-0007-mailbox-v3-hook-payload-contract/plan.md`", by "planning lead (agent)".

   Also:
   - In `docs/specs/reading-map.md` and `docs/platform/component-boundary.md`, the mailbox lines name the store crate as built on the branch.
   - Add no `CHANGELOG.md` line (not user visible; spec §12 puts it at V7).
   - Add no doctor check and no config-merge registration (V5/V7).

3. **Census:** `node scripts/git-one-door-scan.mjs --write-census`.

4. **Full gates.** Sync again right before running them. If the merge brought changes, rerun all of them. Each is a long command; run it so its exit is observable.

   ```bash
   cargo fmt --all -- --check
   cargo clippy --locked --workspace --all-targets -- -D warnings
   cargo test --locked --workspace
   npm test
   cargo tree -p fgos-mailbox -e normal --depth 1
   ```

   If a gate fails, check main's checkout with the same command:
   - **Also fails on main:** report it with the exact command and output, and leave it alone (RUL11: a separate item).
   - **Fails only on the branch:** fix it on the branch first.

5. **Review.** Run the `code-reviewer` agent (or `ak:code-review`) on `git diff origin/main...mailbox/v1-v3 -- packages/mailbox scripts/record-mailbox-hook-fixtures.mjs Cargo.toml`, limited to V3's commits. Focus on:
   - no I/O in `hook` or `adapters`, apart from `head.rs`'s judge;
   - no print statements;
   - no `Result` crossing into the shell;
   - every number comes from the contract;
   - one owning test per behaviour; retired or retargeted tests are named in their commits;
   - fixtures are redacted, and nothing synthesized is labelled as recorded;
   - no test-only branch and no test switch.

   Apply the findings you accept.

6. **Final sync, commit and push.** Commit `docs(mailbox): record the V3 hook payload contract on its branch`, then `git push origin mailbox/v1-v3`.

7. **Hand-off report.** Get the path from `fgos convention path --kind report --type closing --slug mailbox-v3-hook-payload-contract --json`. The report covers:
   - commits;
   - test counts per file;
   - gate results;
   - the recorded CLI versions and injected shapes;
   - deferred fixtures and the status of Q1;
   - what the next rungs need:
     - **V2:** snapshot schema version 2; reuse `head::judge_stored`, `head_text` and `is_complete`; an unparseable stored head stays `Deferred` until a breaker or `status` surfaces it.
     - **V4:**
       - the Claude head finder (session file → `HeadFacts`);
       - the shell around `begin`/`render_reply`/`finish`, in the order: write, then `finish`;
       - the exit-status proof;
       - the caller check;
       - the delivery-report sentence;
       - the output-size measurement.
     - **V5:** the `att-` case; the CLI option of the entry (decision 4, backed by the recorded id-variable evidence); the config-merge registration of `stopBlock.max`.

   The controller updates board row `MAIL` and the plan status on main.

## Deviations (implementation lead, 2026-10-22)

- **§6.4** says the schema stays at version 1 (phase 3 deviation), not version 2.
- **§7** gains a subsection 7.3 with the V3 recordings instead of rewriting the measured table of 2026-10-19, which stays the record of that probe.
- **§16** is unchanged: Q1 was resolved by the plan owner (option C for agy), recorded in §17 and §7.3.
- **Review step skipped** at the plan owner's instruction; the plan owner runs an independent review.
- **`npm test`** runs because the branch changed a Node file (`scripts/record-mailbox-hook-fixtures.mjs`).
- **Convention (plan owner, 2026-10-22).** The closing report and the journal take their paths from `fgos convention path`, and `fgos convention check` runs on the added files. The test paths of `fgos-mailbox` were repeated literals in four test files; they now live once in `tests/common/mod.rs` (`contracts_dir`, `hook_fixtures_dir`, `ADAPTERS_CONTRACT`, module `files`), and every test derives from them. Production code names the adapters contract once (`src/adapters/mod.rs`, embedded) and the frame and limits contracts once each in the core. The recorder names its raw base and fixture directory once each. The drain takes no directory and reads no file; `.fgos` resolution stays with the storage-root owner (`resolve_workspace_root`), which the shell calls.

## Plan owner decisions (2026-10-22, after phase 3; plan owner (agent))

1. **M4, one binding per head.** A second key from the same head replaces the old binding like a dead-head takeover: a new generation, its own name, `stop_blocks` 0, and mail queued for the old key is never shown to the new context. Implemented in phase 5 with its owning test.
2. **agy drain deferred in V3, for every event.** An agy subagent carries no marker and fires its own Stop; under decision 1 a subagent's first hook would replace the head's binding and take its mail, which is worse than missing mail. The agy fixtures stay as contract evidence (parse tests only); agy stays under `deferred` in `adapters.v1.json` (no subagent marker; 1.4.4 refuses `additionalContext`). `overwriteResult` is rejected as a delivery channel: it rewrites a tool's real output with peer text and mixes trust levels. Q1 resolves as option C for agy. What would unblock agy: a payload field naming the parent conversation, or a hook scope that fires for the head conversation only.
3. **Codex deferred** until the owner logs the `tetnu` account in again; Codex is not run. Its parse and render are built only where a report already recorded the real shape; everything else stays deferred.
4. **Phases 4 to 7 continue** with Claude Code as the only live-proven adapter. Phase 7 runs the branch docs and the crate and workspace gates; `npm test` only if a Node file changes; no code-review step (the plan owner runs an independent review).

## Acceptance criteria

- `cargo test --locked -p fgos-mailbox` and `cargo test --locked -p fgos-mailbox-core` are green on a main merged within this phase. The step 4 gates are green, or fail in the same way on main.
- Right after the final sync, `git log origin/mailbox/v1-v3..origin/main` is empty. Main holds no commit from this plan except the plan files, which the controller commits.
- On the branch, spec §14 (V3 and V4 rows), §17 and §7 agree with the fixtures and with `adapters.v1.json`.

## Risks

- `npm test` takes a long time; run it in the background with exit notification.
- A gate can be red on main for reasons outside the mailbox. Report it; do not fix it here.
