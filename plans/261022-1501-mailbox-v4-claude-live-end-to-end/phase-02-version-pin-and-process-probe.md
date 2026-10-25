---
phase: 2
title: "Version pin and process probe"
status: done
depends_on: [1]
live_calls: "5 expected (Claude 4, Codex 1); at most 7; at least 2"
---

# Phase 2: Version pin and process probe

## Why

- **Version pin (spec §11 item 7).** The live suite must fail when the installed CLI version is not in `testedAgainst`. On 2026-10-22 the installed Claude Code is 2.1.308 and the contract lists 2.1.307, so the suite cannot pass until 2.1.308 is recorded the same way V3 recorded 2.1.307. Listing a version without recording it would break the contract's own rule ("listed only when its Stop and PostToolUse payloads and the output shapes the CLI injected were recorded on it").
- **Process probe.** Phase 5's head finder and caller check, and the example's Codex head finder (decision 8), depend on facts nobody recorded: which process is the hook's parent under `claude -p` and `codex exec`, whether Claude's session file `procStart` is the same start time process facts read, and what the session file holds in print mode (`kind`, `name`, `nameSource`). The research of 2026-10-20 walked the process tree to find the `claude` ancestor but did not say whether it was the direct parent.

The same recorder runs give both, so the probe costs no extra call.

## Files

- Create `scripts/lib/mailbox-live-cli.mjs`: the recorder's run guards, moved out unchanged so phase 8's live harness imports the same code (design principle 1; RUL104: a move, not new behaviour): `REMOVED_VARS` and `cleanEnv`, the "outside every git checkout" check of `setUp`, `hookPreflight` (managed settings, agy account hook files), `zshValue`, `accountHome`, `cliVersion`, the Claude argv builder (`-p --model haiku --dangerously-skip-permissions --setting-sources project --settings <file>`) and the Codex home builder (`auth.json` symlink, `config.toml` with hooks and the trusted workspace, `hooks.json`, `exec --dangerously-bypass-hook-trust --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -C <ws>`), each taking its paths and account as parameters. The recorder imports them; the recordings below exercise the move, and `node --test test/scripts/codex-auth-guard.test.mjs` stays green.
- Modify `scripts/record-mailbox-hook-fixtures.mjs` (branch): import the moved guards; its `hook` subcommand also writes `<runDir>/calls/<n>-<event>.proc.json`, **raw directory only, never read by `redact`** (assert this in the step below):
  - the hook process's own pid, and its ancestor chain up to 8 levels: `pid`, `ppid`, `comm` (`/proc/<pid>/comm`), the basename of `/proc/<pid>/exe` when readable, `tty_nr` non-zero or not;
  - the **names** (never values) of the environment variables the hook process sees;
  - for each ancestor pid that has `~/.claude/sessions/<pid>.json`: the file's key set, `kind`, `entrypoint`, `nameSource`, whether `name` has the shape `<anything>-<2 hex>`, `version`, whether `sessionId` equals the payload's `session_id` (a boolean, never the id), and `procStart` next to field 22 of `/proc/<pid>/stat` (`starttime`) read at the same moment, as two strings.
- Modify `packages/mailbox/contracts/adapters.v1.json` (only when step 4 passes): add `{ "cli": "claude", "version": "<installed>" }`.
- Rewritten by the recorder: `packages/mailbox/contracts/fixtures/hooks/claude/*` (only when step 4 passes).
- Modify the doc comment of `packages/mailbox/rust/store/src/adapters/claude.rs` (the recorded versions).
- Create the research report at the path of `fgos convention path --kind report --type research --slug mailbox-v4-hook-process-probe --json` (run inside the worktree).

## Steps

1. `free -g` ≥ 8; sync. `claude --version`; `~/.local/bin/codex --version`.
2. **Recorder change, test first.** The recorder has no test file; its committed behaviour is guarded by `cargo test -p fgos-mailbox --test fixtures_contract` over the fixtures it produces. Add the `.proc.json` writer, then prove `redact` ignores it: run `node scripts/record-mailbox-hook-fixtures.mjs redact claude` on the **existing V3 raw runs if they still exist** under `${TMPDIR:-/tmp}/fgos-work/mailbox-v3-record/claude/`, or, if they were cleaned, read `cmdRedact` and confirm it only lists `<n>-<event>.json` names (quote the line in the report). Keep the change minimal: no new subcommand.
3. **Claude re-record** (skip to step 5 if the installed version is already listed; then run only `run claude dump` for the probe). In this order, each once, observable exit, nothing in parallel:
   ```bash
   node scripts/record-mailbox-hook-fixtures.mjs clean claude        # only if V3 raw runs remain
   node scripts/record-mailbox-hook-fixtures.mjs run claude dump
   node scripts/record-mailbox-hook-fixtures.mjs run claude accept
   node scripts/record-mailbox-hook-fixtures.mjs check claude accept
   node scripts/record-mailbox-hook-fixtures.mjs run claude subagent
   node scripts/record-mailbox-hook-fixtures.mjs run claude dump --agent-head
   node scripts/record-mailbox-hook-fixtures.mjs redact claude
   node scripts/record-mailbox-hook-fixtures.mjs redact-agent-head claude
   ```
   The recorder refuses a run whose version changed during the run; if Claude Code updates itself mid-phase, stop and report (no re-run without the controller).
4. **Structural comparison.** `git diff --stat packages/mailbox/contracts/fixtures/hooks/claude/` and a human read of `git diff`. Pass only when the differences are the version strings, the `source` notes, timestamps and placeholder-only values: same key sets, same injected shapes (`accepted-*.json`), `agent_id` on the subagent's events, `agent_type` alone on the agent head's events, no Stop from the subagent. On pass: add the version to `testedAgainst` (decision 13: both versions stay listed), update the `claude.rs` doc comment, run `CARGO_BUILD_JOBS=4 cargo test --locked -p fgos-mailbox --test fixtures_contract --test hook_payloads --test adapters -- --test-threads=4`. On any other difference: `git checkout -- packages/mailbox/contracts/fixtures/hooks/claude/`, stop with status BLOCKED and report the difference (a V3 contract change, decided by the plan owner).
5. **Codex probe.** `node scripts/record-mailbox-hook-fixtures.mjs run codex dump` once (its auth guard stops the run with exit 3 if `auth.json` is not a symlink or the login fails; then stop and report, never re-log in yourself). If `codex --version` is not in `testedAgainst`, also run `accept`, `check codex accept`, `subagent`, `redact codex` and do step 4 for Codex; otherwise do **not** redact (the committed Codex fixtures stay). Read the `.proc.json` files, then `clean codex`.
6. **Write the probe report** (facts only, each with its file and run): for each CLI and event, the hook's parent `comm`, whether the parent is the CLI head itself or an intermediate shell, the chain length to the head; for Claude, whether `procStart` equals `/proc/<pid>/stat` `starttime`, the session file `kind`, `entrypoint`, `nameSource`, `name` shape in print mode; the env variable names a hook process sees. Then `clean claude`.
7. Commit (`test(mailbox): record Claude Code <version> hook payloads and the hook process facts`), regenerate the census, end-of-phase sync, push.

## Decisions this phase feeds (write the outcome into the report and into phase 5's "Deviations")

Phase 5 specifies both head-finder topologies up front, so the probe only picks one. <!-- Updated: red-team - hop-aware design fixed before the probe -->

| Probe fact | If as expected | Otherwise |
|---|---|---|
| Claude hook's parent is the `claude` process whose session file names the payload's session | phase 5 topology **A** (parent is the head) | parent is a shell (`comm` in `sh`, `dash`, `bash`, `zsh`) whose own parent is that `claude` process: topology **B** (one shell hop). More than one hop, or anything else: **stop with status BLOCKED**; the controller decides before phase 5 |
| The Claude hook process sees `CLAUDE_CODE_SESSION_ID` and its value equals the payload's `session_id` (recorded at 2.1.307, spec §7.3; the probe re-checks it at the new version through the `.ids.json` the recorder already writes) | the Claude writer key comes from session identity, as phase 7 says | stop with status BLOCKED: the writer source changes, which is a decision for the controller |
| `procStart` equals `starttime` | the finder also requires them equal (a pid reused after the session file was written is refused) | the finder ignores `procStart`, and phase 5 drops its test 6 |
| print-mode session file has `nameSource: derived` and a `<x>-<2 hex>` name | `own_suffix` from it | `own_suffix` is `None` and the mailbox draws two characters (spec §5.1.1) |
| Codex hook's parent is the `codex` process | the example's Codex finder uses topology A | the same A/B/stop rule as Claude, in the example only |

## Proof

`fixtures_contract`, `hook_payloads`, `adapters` green with the new version listed; the probe report exists with every fact above sourced to a raw file.

## Risk

- Claude Code updates during the phase: the recorder refuses; stop.
- Codex login expired: the guard stops with exit 3; stop and tell the controller (the owner logs in).
- The `.proc.json` write must not change the hook's exit or stdout (the accept run prints the candidate output): write it after the existing files, inside the same `try`, and never print.

## Done on the branch (implementation lead, 2026-10-22)

- Live CLI runs: **5** (Claude `dump`, `accept`, `subagent`, `dump --agent-head`; Codex `dump`), each once, all exit 0, versions unchanged during each run. Report: `plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md`.
- 2.1.308 against 2.1.307: only `duration_ms` and the `vectors.json` source differ; `testedAgainst` lists both.
- Probe: Claude topology **B** (one `sh` hop, dash), `procStart` equals `starttime` (13 of 13), `nameSource: derived` with a two-hex suffix, `kind: interactive`, `entrypoint: sdk-cli`; `CLAUDE_CODE_SESSION_ID` equals the payload session. Codex topology **A**.
- Proof: `cargo test --locked -p fgos-mailbox --test fixtures_contract --test hook_payloads --test adapters`: 4 + 16 + 5 passed; `node --test test/scripts/codex-auth-guard.test.mjs`: 2 passed.

### Deviations

- **Allowlisted environment for the recorder too** (controller rule for phase 2 and 8 live runs): `cleanEnv` (the caller's environment minus four variables) is replaced by `cliEnv` in `scripts/lib/mailbox-live-cli.mjs` (inherited `HOME`, `USER`, `LANG`, `TERM`, `XDG_RUNTIME_DIR`, `PATH`; `SHELL=/usr/bin/zsh`, an empty `ZDOTDIR`, `DISABLE_AUTOUPDATER=1`). So the guards did not move unchanged: this one became stricter. `run.json` records `inheritedVars`.
- The guards throw `LiveCliError` (with an exit code) instead of exiting; the recorder maps it to its `die`.
- Two recorder fixes found by the re-recording: `redact` keeps naming the replaced recording in the `vectors.json` source (the contract test needs every listed version named there), and `redact-agent-head` no longer counts `vectors.json` when numbering placeholders.
- Step 2: no V3 raw runs remained; `cmdRedact` reads only `callsOf`, whose regex is quoted in the report.
