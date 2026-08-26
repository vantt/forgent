# RESEARCH — tsk-5jl: generalize herdr-spawn (config-driven live visibility + correct result)

## Round 1 (2026-08-26, discovery) — config.mjs permissiveness to a new `liveOutput` field

**Asked:** Does `src/runner/dispatch/config.mjs`'s executor/invocation shape
validation reject an unrecognized extra key on an invocation entry (e.g. a
new `liveOutput` field), or is it safe to add without changing the
validator's strictness model?

**Checked:** `src/runner/dispatch/config.mjs` directly —
`validateExecutorShape` (lines 314-336), `validateExecutorEntryShape`
(lines 564-646), `validateInvocationShape` (lines 503-555),
`validateRunnerConfigShape` (lines 767+).

**Found:**
- `validateExecutorShape` only checks `command` (string), `args` (string
  array), `adapter` (must be a key of `EXECUTOR_ADAPTERS` when present),
  `env` (via `validateExecutorEnvShape`) — no exhaustive-key allowlist, no
  rejection of an extra unrecognized property on the object.
- `validateExecutorEntryShape` (the per-`executors.<id>` validator) checks
  a fixed named-field list (`kind`, `command`/`args`, `env`, `model`,
  `allowCrossProvider`, `agentType`, `forceCliSpawn`, `for`, `carries`,
  `invocations`, `providerModel`, `rigorOverrides`) — every check is
  `if (field !== undefined) validate(...)`, never `Object.keys(executor)`
  against an allowlist. Same pattern in `validateInvocationShape`.
- Confirmed empirically (not just by reading): this is the SAME style used
  everywhere else in the file (e.g. `rigorOverrides`, `providerModel` were
  added as later, purely additive fields with zero impact on entries that
  don't declare them).

**Verdict for this point:** clear. Adding `liveOutput: { streamFlags?,
renderer? }` as a new optional field, validated by its own small
`validateLiveOutputShape` function (consistent with this file's existing
per-field style), is safe and requires no change to the strictness model.
An entry omitting `liveOutput` is unaffected.

## Round 1 (2026-08-26, discovery) — pi's real `AgentSessionEvent` JSONL schema

**Asked:** What is the real, concrete JSON-lines event schema `pi --mode
json` emits, so `pi-agent-session.mjs`'s renderer can be built against
real structure instead of a guessed shape?

**Checked:** Real captured stdout fixtures already in this repo —
`docs/history/pi-executor-runtime-capacity/evidence/round4-d4-attempt-gpt55-stdout.jsonl`
(191 real lines from an actual `pi --mode json` run, confirmed via direct
`node`/`JSON.parse` inspection, not assumed from docs alone).

**Found (real, from the fixture, not from `docs/distillery/sources/pi.md`
alone):**
- Top-level line shapes seen, by `type`: `session` (once, header:
  `version`/`id`/`timestamp`/`cwd`), `agent_start` (once), `turn_start` (N),
  `message_start`/`message_end` (message envelopes, `message.role`/
  `message.content[]`), `message_update` (the LIVE streaming carrier — 133
  of 191 lines in this fixture), `tool_execution_start` (`toolCallId`,
  `toolName`, `args`), `tool_execution_end` (`toolCallId`, `toolName`,
  `result.content[]`), `turn_end`, `agent_start`/`agent_end`/`agent_settled`.
- `message_update`'s own nested `assistantMessageEvent.type` (the actual
  streaming granularity, real values enumerated from the fixture):
  `thinking_start`/`thinking_delta` (`delta`: incremental reasoning
  text)/`thinking_end` (`content`: full accumulated text), `text_start`/
  `text_delta` (`delta`: incremental assistant-visible text)/`text_end`
  (`content`: full accumulated text), `toolcall_start`/`toolcall_delta`
  (`delta`: incremental JSON-arg text)/`toolcall_end` (`toolCall.name`,
  `toolCall.arguments`, already-parsed).
- This confirms `pi`'s live stream is genuinely incremental (real `_delta`
  events accumulate character-by-character, same shape class as Claude
  Code's own `stream-json --include-partial-messages`), not a
  buffer-then-dump like Claude's default text mode — a renderer can print
  `text_delta.delta` as it arrives for a live "watching it work" feel, a
  one-line `→ <toolName>(...)` on `tool_execution_start`, and `✓
  <toolName>` on `tool_execution_end`, while skipping `thinking_*`/raw
  `toolcall_delta` fragments (internal reasoning / not-yet-parsed args) to
  keep the rendered pane readable.

**Verdict for this point:** clear. Real schema confirmed via direct
fixture inspection (not guessed, not from prose docs alone) — sufficient
to write `pi-agent-session.mjs` against a real, cited event shape.

## Overall verdict

**clear** — both real ambiguities this item depended on (config.mjs's
tolerance for the new field, and pi's actual streaming event schema) are
resolved from real, cited evidence. `agy`'s native-streaming behavior and
Claude Code's `-p`/`stream-json` behavior were already confirmed via
official docs + this repo's own prior RESEARCH.md files (`docs/history/
executor-dispatch-fallback-live-monitor/`, `docs/history/dispatch-cli-
execute-progress-visibility/`, `docs/history/pi-executor-runtime-capacity/
RESEARCH.md`) before this item was even submitted — carried forward, not
re-derived. `codex exec`'s streaming default stays explicitly unverified
by this item's own design (ship `codex-herdr` with no `liveOutput`,
documented as TODO) — not a blocking ambiguity, a deliberately deferred
scope boundary.

Verify: `npm test` (existing suite green + the new/extended
`test/runner/herdr-spawn-adapter.test.mjs` cases this item adds, plus the
one required real-binary live proof against `agy-herdr`).
