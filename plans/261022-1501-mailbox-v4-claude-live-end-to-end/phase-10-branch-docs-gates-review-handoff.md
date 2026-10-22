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

## V4 review fixes (plan owner (agent), 2026-10-23)

After the independent review `reports/code-review-v4.md`. Each item: test first, a mutant shown killed, its own commit; decisions recorded in spec §17 (row 2026-10-23) as plan owner (agent).

| Item | Commit | Owning test | Mutant killed | State |
|---|---|---|---|---|
| H1 usage error exits 0 | `528546c7c`, `27437901d` | `tests/test_hook_entry.rs` `every_kind_of_hook_usage_error_exits_zero_prints_nothing_on_stdout_and_logs_its_cause` (one case per kind: repeated flag, flag without a value, unknown or missing `--cli`, unknown `--topology`, unknown `--event`, missing `--fgos-dir`, missing `--project`, unknown `--fault`) | `usage_error` returns 2: fails at "repeated flag: exit status: 2" | done |
| H2 isolation claim and Safety rule | `d41ac84a9` (with M2), spec §11 in the docs commit | none (prose); the claim is corrected in `scripts/lib/mailbox-live-cli.mjs` and the recorder | n/a | done; confinement of the CLI before adversarial cells stays V6's prerequisite |
| M1 three-state write gate | `1d3eee312` | `tests/hook_shell.rs` `the_shell_moves_the_write_gate_to_writing_before_the_first_byte_of_stdout`, `a_shell_whose_gate_the_watchdog_claimed_writes_nothing_and_leaves_the_claim_unfinished`; the watchdog child test kept | (a) the shell no longer marks writing (the reviewer's surviving M1): both new tests fail; (b) the shell ignores a lost compare-and-swap: the claimed-gate test fails; (c) the watchdog ignores a lost claim: the watchdog test fails | done |
| M2 Codex `auth.json` guard in the live harness | `d41ac84a9` | `test/scripts/codex-auth-guard.test.mjs`: the after-run check, removal refused while a set-aside or plain `auth.json` exists, no walk into a linked directory | (1) removal ignores set-aside files, (2) the walk follows links, (3) the after-run check keeps nothing, (4) removal skips a plain `auth.json`: each fails its test | done; harness wiring shown by dry runs under a scratch `TMPDIR` (D2 dry twice, then refused with exit 3 while `auth.json.rotated` existed) |
| M5 pure lookup, launch-only creation | `abe31e389` | `test/runner/dispatch-confinement-blind.test.mjs`: lookup creates nothing; no-op without or under a read-only `.fgos` (and a `runtime` file), ref check never throws; the argv test masks the created root; real bwrap: a planted mailbox body is `ENOENT` blind, readable unblind | (a) lookup creates, (b) launch does not create, (c) an uncreatable `.fgos` throws, (d) the mailbox root left out of the masks: each fails (d fails the real-bwrap test) | done; real bwrap runs on this machine |
| M6 over-cap drain explicit | `7c176336c` | `tests/hook_shell.rs` `a_payload_one_byte_over_the_read_cap_skips_the_drain_with_its_own_reason_and_leaves_the_snapshot_unwritten`; entry wiring `a_payload_over_the_read_cap_exits_zero_prints_nothing_and_logs_the_skipped_drain` | over-cap reported as `Malformed`: both fail | done; the contract names both 1 MiB sources |
| L1 example built from HEAD | `b5d88bde1` | none automated (live harness); dry runs: no fingerprint, stale commit and changed binary each refused with exit 3, a fresh one runs and lands in `result.json` | n/a | done |
| L2 record errors as contract text | `1c7a95d7e` | `core/tests/report.rs` `a_record_error_reads_as_contract_text_that_names_the_code_and_says_not_to_loop`; `tests/verbs.rs` `a_send_and_an_inbox_whose_record_failed_answer_with_the_record_error_text` | `verbs::send` answers the bare code: the verbs test fails | done |
| L3 frame escaping comment | `1c7a95d7e` | n/a (comment) | n/a | done |
| L4 fixture observations | `b99e70b60` | `fixtures_contract` (prose guard) green | n/a | done: both still hold at 2.1.308 (`env.json`, the recorder's transcripts) |
| L5 dry pane server stopped | `b5d88bde1` | none (needs herdr); pane-mode refusals throw so `finish` runs | n/a | done; not run, to keep herdr untouched |
| L6 real limits loader | none | n/a | n/a | deferred to V5 (spec §14 V5 row) |
| M3 pinned hop-shell set, M4 Codex head identity | none | n/a | n/a | V5 work, not this step: spec §14 V5 row ("Handed over by V4's review") |

Gates of this step, on the branch after merging `origin/main` at `45578a9cf`, one at a time with at least 21 GB available:

- `cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos-holder-lock -- --test-threads=4`: 43 test binaries, 305 passed, 0 failed. Clippy `-D warnings` on the three crates clean. `cargo fmt -p fgos-mailbox -p fgos-mailbox-core -- --check` clean (`fgos-holder-lock` has fmt drift that is byte-identical on `origin/main`, not this branch's).
- `cargo test --locked --workspace --no-fail-fast -- --test-threads=4`: 253 binaries, 1537 passed, 0 failed, 11 ignored.
- `npm test -- --test-concurrency=4`: 8728 tests, 8610 pass, 20 fail, 33 skipped. A clean `origin/main` sibling worktree (`45578a9cf`, outside `/tmp`, removed after) under the same limits: 8721 tests, 8602 pass, 21 fail. 19 titles fail on both (the `fgctl` upgrade, repair, quarantine and init titles, the builder-selection title, the codex cli-bypass title). Branch only: `concurrent createSession from real separate OS processes never loses a registry entry` (a child exited on `git-floor-probe-failed: containment-unproven` under load; `test/runner/session.test.mjs` is untouched by this step and behaves identically on both trees when run alone). Main only: `lock fence escalates to SIGKILL when the holder ignores SIGTERM` and `settleClaim reconciles a same-writer drift …`. No failing title touches a file this step changed.
- `node scripts/git-one-door-scan.mjs`: the same 5 `unresolved-binary` sites as `origin/main`; the census is regenerated for this step's product files.
- `fgos convention check --dir . --` the nine changed files under `plans/`, `docs/`, `test/` and `scripts/` (installed host): 0 violations.
