# Mailbox V4: hook process probe and the Claude Code 2.1.308 re-recording

Date: 2026-10-22, Asia/Saigon. Branch `mailbox/v1-v3`. Plan: `plans/261022-1501-mailbox-v4-claude-live-end-to-end/` phase 2.

## Runs (live CLI invocations: 5)

All through `scripts/record-mailbox-hook-fixtures.mjs`, each once, observable exit, nothing in parallel, with the allowlisted environment of `scripts/lib/mailbox-live-cli.mjs` (inherited `HOME`, `USER`, `LANG`, `TERM`, `XDG_RUNTIME_DIR`, `PATH`; `SHELL=/usr/bin/zsh`, empty `ZDOTDIR`, `DISABLE_AUTOUPDATER=1`).

| Run | CLI version before → after | Exit | Hook calls |
|---|---|---|---|
| `run claude dump` | 2.1.308 → 2.1.308 | 0 | 2 |
| `run claude accept` (+ `check claude accept`, no CLI) | 2.1.308 → 2.1.308 | 0 | 3 |
| `run claude subagent` | 2.1.308 → 2.1.308 | 0 | 6 |
| `run claude dump --agent-head` | 2.1.308 → 2.1.308 | 0 | 2 |
| `run codex dump` | 0.161.0 → 0.161.0 | 0 | 2 |

Codex 0.161.0 was already listed, so only `dump` ran and the Codex fixtures were not redacted again. The Codex auth guard passed before and after (`auth.json` still a link to the account file; `codex login status` ok).

Raw files: `<base>/<cli>/<mode>/calls/<n>-<event>.proc.json`; copies kept under `.fgos/runtime/tmp/mailbox-v4/evidence/p2/` (gitignored), then `clean claude` and `clean codex`.

`redact` never reads `.proc.json`: `callsOf` lists only names matching `/^(\d+)-([A-Za-z]+)\.json$/` (the `<n>-<event>.proc.json` name cannot match, since `.` is outside `[A-Za-z]`). There were no V3 raw runs left to replay.

## Claude Code 2.1.308 against the 2.1.307 recording

`check claude accept`: `PostToolUse` nested shape injected as `attachment:hook_additional_context` (raw type `attachment:hook_success` rejected), Stop block accepted by a continued Stop call, the model echoed both canaries; the same result 2.1.307 recorded.

After `redact claude` and `redact-agent-head claude`, `git diff` of `packages/mailbox/contracts/fixtures/hooks/claude/` changed only:

- `duration_ms` in `post-tool-use.json`, `post-tool-use-subagent.json`, `post-tool-use-agent-head.json`;
- `vectors.json` `source`: the version (`2.1.307 (Claude Code)` → `2.1.308`), and the new clause `replaces the recording of 2026-10-22 from claude 2.1.307`.

Unchanged: `stop.json`, `stop-continued.json`, `stop-agent-head.json`, `accepted-*.json`, `env.json` (the hook and tool processes see `CLAUDE_CODE_SESSION_ID` only), the payload key sets, `agent_id` on the subagent's events, `agent_type` alone on the agent head's events, and "the subagent fired no Stop of its own". Plan decision 13 applies: the fixtures hold the 2.1.308 recording and `testedAgainst` lists both versions.

Two recorder fixes were needed to re-record without a test change, both in `scripts/record-mailbox-hook-fixtures.mjs`:

- `redact` keeps naming the recording it replaces in `vectors.json`'s source, because `fixtures_contract` requires every listed version to be named there;
- `redact-agent-head` numbers its placeholders after the fixture payloads only, not after the placeholders `vectors.json` refers to; otherwise a re-recording shifted the agent-head ids by one and `adapters.rs` `every_payload_vector_parses_as_it_says` failed.

## Process facts

### Claude Code 2.1.308, `claude -p`

All 13 hook calls of the four runs (`PostToolUse`, `Stop`, `SubagentStart`, `SubagentStop`, head and subagent events alike):

- The hook process (`node`, `comm` `MainThread`) has as parent an `sh` process (`exe` `dash`), whose parent is the `claude` process. **One shell hop: topology B.** The command Claude Code runs is one simple command, and dash does not exec it. The `claude` process's parent is `timeout`.
- `~/.claude/sessions/<claude pid>.json` exists while the hooks run; its `pid` is that pid; its `sessionId` equals the payload's `session_id` (all 13).
- Keys: `cwd`, `entrypoint`, `kind`, `messagingSocketPath`, `name`, `nameSince`, `nameSource`, `peerFeatures`, `peerProtocol`, `pid`, `pidDomain`, `procStart`, `sessionId`, `startedAt`, `status`, `statusUpdatedAt`, `updatedAt`, `version`.
- Print mode: `kind` is `interactive` (not a print-mode value), `entrypoint` is `sdk-cli`, `nameSource` is `derived`, and `name` ends in `-<2 hex>`.
- `procStart` equals field 22 of `/proc/<claude pid>/stat` (`starttime`) read at the same moment, as text, in all 13 calls.
- Environment variable names the hook process sees: `AI_AGENT`, `CLAUDECODE`, `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_CODE_ENTRYPOINT`, `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN`, `CLAUDE_CODE_SESSION_ATTENDED`, `CLAUDE_CODE_SESSION_ID`, `CLAUDE_EFFORT`, `CLAUDE_PID`, `CLAUDE_PROJECT_DIR`, `COREPACK_ENABLE_AUTO_PIN`, `DISABLE_AUTOUPDATER`, `HOME`, `LANG`, `NoDefaultCurrentDirectoryInExePath`, `PATH`, `PWD`, `SHELL`, `TERM`, `USER`, `XDG_RUNTIME_DIR`, `ZDOTDIR`.
- `CLAUDE_CODE_SESSION_ID` is set in the hook process and equals the payload's `session_id` in every head call checked (dump: both calls); `FGOS_SESSION_ID` and `CODEX_THREAD_ID` are unset.

### Codex 0.161.0, `codex exec`

Both hook calls (`PostToolUse`, `Stop`):

- The hook process's parent is the `codex` process itself (`comm` and `exe` `codex`): **topology A.** The `codex` process's parent is `timeout`.
- No session-identity variable is set in the hook process. Variable names: `CODEX_HOME`, `DISABLE_AUTOUPDATER`, `HOME`, `LANG`, `LOGNAME`, `OLDPWD`, `PATH`, `PWD`, `SHELL`, `SHLVL`, `TERM`, `USER`, `XDG_RUNTIME_DIR`, `ZDOTDIR`, `_`. Codex has no session file.

## Decisions this probe feeds

| Probe fact | Found | Consequence |
|---|---|---|
| Claude hook's parent | an `sh` whose parent is the `claude` process whose session file names the payload's session | Phase 5 topology **B** (one shell hop); the live harness passes `--topology one-shell-hop` for Claude |
| Claude hook sees `CLAUDE_CODE_SESSION_ID` equal to the payload's `session_id` | yes | the Claude writer key comes from session identity (phase 7 as written) |
| `procStart` equals `starttime` | yes, 13 of 13 | the finder compares `procStart` with the head record's start time; phase 5 keeps test 6 |
| Print-mode session file: `nameSource: derived`, `<x>-<2 hex>` name | yes (`kind` is `interactive`, `entrypoint` `sdk-cli`) | `own_suffix` from the name |
| Codex hook's parent | the `codex` process | the example's Codex finder uses topology A |
