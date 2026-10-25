---
phase: 9
title: "Branch docs, full gates, closing"
status: pending
priority: P1
effort: "4h"
dependencies: [8]
---

# Phase 9: Branch docs, full gates, closing

## Goal

Make the spec and the host-invocation docs say what V5 built and what it left. Pass every gate on a fresh main, one gate at a time. Write the closing report and the journal, and hand off to the controller, who runs the independent review.

## Docs (all on the branch)

1. **`docs/platform/agent-mailbox/spec.md`.**
   - **Header:** set the implementation status to V5 built on the branch. Add `apps/fgos/src/wiring/mailbox_*.rs` and `store/src/{limits.rs,hook/breaker.rs,hook/resolve.rs,adapters/codex_head.rs}` to the source list.
   - **§4.1:** the hook door is built and the split is declared by `native_kinds`. Correct "the store reads no process table" (phase 5). The table row for the verbs.
   - **§6.1:**
     - the per-CLI caller check from the contract (`hookShell`, `headExecutables`), plus the discriminator chosen in phase 2 and its residual;
     - the `CLAUDE_CONFIG_DIR` threat statement of phase 5;
     - the repeating pointer line, and the output-bound margin rule with its per-hook or summed finding;
     - the Codex head's executable check;
     - the runner-head quiet;
     - the size-bounded step claim and the pointer line;
     - `inbox --claim` built.
   - **§6.2:** the untested-version and version-unknown clauses are built; tiers are still `turn`.
   - **§6.4:** replace "It needs a Rust resolver … None exists …" and the "Correction found while planning V1" paragraph with what V5 uses:
     - the start directory (`CLAUDE_PROJECT_DIR`, else cwd) with the phase 2 evidence;
     - `fgos_git::main_checkout_root` (disk-only, no spawn, no write);
     - why `resolve_workspace_root` was not used (phase 2 table (a)).

     Remove the stale sentences instead of adding a third version (L10).
   - **§7.1:** the table exists. Mailbox rows exist for Claude Code and Codex; agy waits for its adapter. `commandIsKind` knows `--cli`/`--event`. The probe runs the mailbox kind and is read-only.
   - **§7.4 or a new §7.5 "Recorded at V5":** the phase 2 facts (hook vs tool shell per mode, the Codex head exe, the two ladders) and the phase 8 numbers (p95 per CLI with N and the strace caveat).
   - **§11:** item 8 (runner workers) is covered for registration and `send`; `list` stays V7. The new owning test files.
   - **§12:** the breaker and p95 keys are in the contract, and the config-merge registration exists (V5). Note that the Config component's "only differences" rule will convert it.
   - **§14:**
     - mark the V5 row as built on the branch, with its proofs and what it does not prove;
     - mark the prerequisites (host routing, resolver, `is_attempt_writer_id`) as met on the branch;
     - add the **V6 precondition** (review H2) to the V6 row's "Waits for";
     - add the shim deviation.
   - **§15.8:** unchanged. **§16:** add owner questions 1–3 from `plan.md`, as asked and unanswered.
   - **§17:** one row for the V5 plan decisions 1–16 (planning lead, inside the signed frame), one for any deviations recorded in phases 2–8, and one per owner answer received.
2. **`docs/platform/git/spec.md`:** one line for the public `main_checkout_root` (disk-only, no subprocess, no state, no lock), in the section that lists the driver's read doors. HARDEN reviews it with the code.
3. **`docs/platform/host-invocation-routing/spec.md`.**
   - §2 gets a row "Native hook kind (`hook` → `native_kinds`)", status `implemented preview` on branch `mailbox/v1-v3`.
   - §6's selector counts are updated to the generated table's real numbers (count them; do not copy).
   - `contracts/command-route-descriptor.md` documents `native_kinds`: an optional array, only on a `legacy-cli` selector, each listed kind served natively before the composition root, every other kind to legacy.
4. **`docs/routing-handoff-contract.md`.** Add the pointer that spec §13 promised "in the same change". It is **missing** (checked at planning, `grep -i mailbox docs/routing-handoff-contract.md` finds nothing): one short paragraph naming the `peer` class and the frame (spec §5.5, §8) as a second agent-to-agent channel and pointing at `docs/platform/agent-mailbox/spec.md`. This file is shared with every lane: merge main first and keep the edit to that paragraph.
5. **`docs/specs/confinement-authority.md`.** No change expected; V5 adds no root.
6. **No `CHANGELOG.md` line** (plan decision 16).
7. **The test-only entry** was retired in phase 6. Check that `rg -n "mailbox-test-hook" docs plans/reports test scripts` names it only in history (reports and the V4 plan), and that spec §14's V4 row says it was retired at V5.

## Gates (fresh `origin/main` merged; one at a time; `free -g` ≥ 8 before each)

```bash
cd /home/vantt/projects/forgent-mailbox || exit 1
git fetch origin && git merge --no-edit origin/main
CARGO_BUILD_JOBS=4 timeout 2400 cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos -p fgos-identity -p fgos-observe -p fgos-host-runtime -p fgos-git -- --test-threads=4
echo "exit=$?"
CARGO_BUILD_JOBS=4 timeout 5400 cargo test --locked --workspace --no-fail-fast -- --test-threads=4 2>&1 | tee .fgos/runtime/tmp/mailbox-v5/p9-workspace.log
echo "exit=$?"
cargo clippy --locked --workspace --all-targets -- -D warnings
echo "exit=$?"
cargo fmt -p fgos-mailbox -p fgos-mailbox-core -p fgos -- --check
echo "exit=$?"
timeout 5400 npm test -- --test-concurrency=4 2>&1 | tee .fgos/runtime/tmp/mailbox-v5/p9-npm.log
echo "exit=$?"
node scripts/git-one-door-scan.mjs --check
echo "exit=$?"
node scripts/export-command-selectors.mjs --check
echo "exit=$?"
```

- **For every failing title:** run the same gate on a clean `origin/main` in a sibling worktree, as V4 did. Report the failures that are only on the branch, only on main, and on both.
  - A failure only on the branch blocks the close and goes back to the phase that owns it.
  - Failures on both are listed, not fixed here.
- **Convention:** run, from the main checkout's host,

  ```bash
  fgos convention check --dir . -- <every file the rung added or renamed under plans/, docs/, test/, scripts/>
  ```

  It must report 0 violations.

## Closing

1. **Closing report.** Path: `fgos convention path --kind report --type closing --slug mailbox-v5-native-hook-door`. Contents:
   - what V5 delivers;
   - the commits per phase;
   - the tests per file, new and retired, with their owners;
   - the gate table;
   - the live invocations (expected 10);
   - in plain words, what happened;
   - the p95 numbers and the status against 50 ms;
   - the shim deviation;
   - the V6 precondition;
   - the open items for V6 and V7;
   - the owner questions still open.
2. **Journal.** Path: `fgos convention path --kind journal --slug mailbox-v5-native-hook-door`.
3. **Hand-off.** Commit, sync, push. Report to the controller in the `Status: … / Summary: … / Concerns/Blockers: …` form. The controller runs the independent review; the board update is the controller's job, never this phase's.

## Verification

- Every gate line shows `exit=0`, or a failure that also fails on clean main, listed by title.
- `fgos convention check` reports 0 violations.
- The spec's §14 V5 row names the proofs, and each one runs.

## Risks

- **Main moves during the gates.** Merge once at the start of this phase. If the final push finds main moved, merge again and rerun the narrow gate (the first `cargo test` line plus `node --test test/rust-host/command-routes.test.mjs test/setup/agent-hooks.test.mjs`), not the whole set, unless the merge touched a shared file of this rung. In that case rerun the full set.

## Notes

- Docs `30c247443`; gate fixes `4d01de59d`, `17359341b`, `ced3cf78e`; closing report `plans/reports/closing-261023-0353-mailbox-v5-native-hook-door.md` holds the gate table, the branch-only failures and their fixes, and the failures shared with clean main `a7d508e8a`.
- Review step skipped, as the controller ruled; the controller runs the independent review.
