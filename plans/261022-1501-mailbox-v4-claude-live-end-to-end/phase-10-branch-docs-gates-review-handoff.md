---
phase: 10
title: "Branch docs, full gates, review, hand-off"
status: done
depends_on: [9]
live_calls: 0
---

# Phase 10: Branch docs, full gates, review, hand-off

## Docs (branch only)

`docs/platform/agent-mailbox/spec.md`:

- Header "Implementation status" and §4.1: V4 built on the branch (the shell, the Claude head finder, the verbs as crate functions; the example entry, test-only).
- §6.1: the shell duties as built (stdin bound by `mailbox.hook.maxReadBytes`, whole-hook budget, write then finish, panic caught), the caller check as built: a topology and pid-reuse guard, explicitly not a guard against same-user processes (a `bash -c` exec'd tool child passes it; any same-user process can set the writer's environment or write the snapshot); the discriminator search moves to V5 with the probe data of phases 2 and 8.
- §6.2: the V4 delivery-report sentences and why every drained CLI is `turn` (plan decision 5); the untested-version clause waits for V5 (decision 6).
- §7: a short "Recorded at V4" paragraph with the probe facts (hook parent, `procStart`, print-mode session file) and the version now listed.
- §8 item 6 and §14 prerequisites: the hidden root landed on the branch (phase 3).
- §11: owning files of the V4 items (`tests/hook_shell.rs`, `tests/test_hook_entry.rs`, `test/live/mailbox-claude.live.mjs` cases L1, L2, L3a, L3b) and which §11 items V4 leaves (3, 4, 5, 8, 9, with the owners phase 8 names).
- §12: the two new hook keys with their sources.
- §14 V4 row: "Built on branch `mailbox/v1-v3`", the proof commands, the report link, the output-size answer, what it does not prove; the V5 row inherits: the circuit breaker, the untested-version clause, `inbox --claim`, the caller-check discriminator, the Codex writer key from the payload in the product entry, `CLAUDE_CONFIG_DIR` for the session file (with one shared Claude config-directory resolver), and a per-drain output cap if L3 found one is needed.
- §17: plan decisions 1–14 as "planning lead (agent), inside the signed frame"; the owner's answer to the plan's question 1 (or "provisional default applied, owner may reverse").
- `docs/specs/reading-map.md` (branch): `test/live/` and `scripts/lib/mailbox-live-cli.mjs` under the mailbox entry, only if the reading map lists per-area test locations (read it first; follow its existing shape).

No `CHANGELOG.md` line (spec §12: V7). No `fgos setup` or `fgos doctor` registration: nothing is installed (plan decision 2); the new keys register into config-merge at V5 with the rest (spec §12).

## Full gates (fresh main merge first; one at a time; memory rule before each)

```bash
free -g | awk '/Mem:/{print $7}'   # >= 8 before each line below
CARGO_BUILD_JOBS=4 cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos-holder-lock -- --test-threads=4
CARGO_BUILD_JOBS=4 cargo test --locked --workspace -- --test-threads=4
CARGO_BUILD_JOBS=4 cargo clippy --locked --workspace --all-targets -- -D warnings
cargo fmt -p fgos-mailbox -p fgos-mailbox-core -- --check      # `--all` fails on workspace drift outside the branch (item tsk-hls); report it, do not fix it here
npm test -- --test-concurrency=4
node scripts/git-one-door-scan.mjs --check
fgos convention check --dir . -- <every file this rung added or changed under plans/, docs/, test/, scripts/>
```

`npm test` failures: compare by title with a clean `origin/main` worktree run under the same limits (as V2 did, in a sibling directory, not under `/tmp`); list the titles; a title that fails only on the branch blocks the phase.

## Review

An independent `ak-code-review` of the branch diff since the V4 base recorded in phase 1, read-only, at the report path of `fgos convention path --kind report --type review --slug mailbox-v4-review --json`. Ask it to check, besides correctness: the write-then-finish order on every path, that no product file gained a test-only switch, that the example holds no logic the library lacks, the D2 labelling, and that every new test names its behaviour and is not a second copy of an owned proof. Fix every Critical and High before closing; each Medium fixed or listed with a reason.

## Close

- The closing report at `fgos convention path --kind report --type closing --slug mailbox-v4-claude-live-end-to-end --json`: commits per phase, tests per file, gates, live invocation count (expected 13: phase 2's 5, phase 8's 4, phase 9's 4; state the real number, and any re-run the controller authorized), the demo's plain-language account, open items for V5 and V7, the board correction (the hidden root is `{fgosDir}/runtime/mailbox`, not `{fgosDir}/mailbox`).
- The journal at `fgos convention path --kind journal --slug mailbox-v4-claude-live-end-to-end --json`.
- `plan.md` `status: completed`, each phase `status: done` (branch copy); push; report to the controller, who updates board row `MAIL`.

## Done when

Every gate green on fresh main (or its failures shown identical to clean main), the review has no open Critical or High, and the controller has the hand-off.

## Done on the branch (implementation lead, 2026-10-22/23)

- Docs: spec header, §4.1, §6.1 (shell as built, caller check, the discriminator measurement), §6.2 (V4 delivery report), §7.4 (recorded at V4), §11 (owning files, items left), §12 (`mailbox.hook.maxReadBytes`), §14 V4 row (built) and V5 row (inherited items), §17 (plan decisions 1–14, the owner's answer, the live-suite and demo decisions); reading map entry for V4. No CHANGELOG line, no setup or doctor registration (nothing is installed).
- Gates: see the closing report `plans/reports/closing-261022-2306-mailbox-v4-claude-live-end-to-end.md`. Rust crates, clippy and fmt green; the workspace's one failure (`gate_portable`) passed alone on a re-run and touches no V4 file; `npm test` fails the same 21 titles on the branch and on a clean `origin/main` sibling worktree; the census check fails the same 5 sites on both; convention check clean.
- **Review: skipped by the controller's instruction** (the controller runs an independent review).
- Journal: `plans/journals/journal-261022-2306-mailbox-v4-claude-live-end-to-end.md`.
