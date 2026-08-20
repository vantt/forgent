# Plan — dispatch.mjs execute --prompt-file flag (tsk-3ps)

Mode: tiny

Flag count: 0 (auth: no; authorization: no; data model: no;
audit/security: no; external systems: no; public contracts: no —
purely additive optional flag, no existing behavior changes; cross-
platform: no; existing covered behavior: no — new behavior added
alongside, not modifying a tested path; weak proof: no — concrete
file:line evidence gathered at discovery; multi-domain: no). Per
`fgos-routing`'s Mode gate, 0–1 flags with a couple of files and one
direct task → tiny.

## Approach

Add `--prompt-file <path>` to `case 'execute':` in
`src/runner/dispatch/cli.mjs` (`runDispatchCli`, lines 826-861,
RESEARCH.md round 1). When present, read the file synchronously
(`fs.readFileSync(path, 'utf8')`) and use it as the `prompt` value passed
to `executeExecutorCli` — `--prompt-file` takes precedence over `--prompt`
when both are given (simplest, unambiguous precedence rule; no
contradictory-flags error path needed for a tiny item). No change to
`executeExecutorCli`'s signature: its `prompt` option is already a plain
string (line 339, RESEARCH.md round 1), so the file read happens entirely
in the CLI layer before the call.

Alternative rejected: changing `executeExecutorCli` itself to accept a
`promptFile` option and do the read internally. Rejected because every
other caller of `executeExecutorCli` (`fanoutBatchExecutorCli`, any
future in-process caller) would gain an unused parameter for a concern
that is purely about how the CLI's own argv gets turned into a string —
keeping the read in `runDispatchCli` keeps the primitive unchanged and
the surface area of the change to one function.

Stdin support (the item description's parenthetical "(or stdin)") is
deliberately left out of this piece: no existing stdin-reading convention
exists in this codebase to mirror (RESEARCH.md round 1), and the file
flag alone resolves every concrete incident cited in the item's own
description (a real file already exists on disk in each case). Left as a
possible follow-up, not part of this plan.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` reports GitNexus as the sole provider
and `present`. Querying `impact` on both `runDispatchCli` and
`executeExecutorCli` (upstream) returned "Target not found" for each,
despite both being confirmed present by direct read in
`src/runner/dispatch/cli.mjs` during discovery (RESEARCH.md round 1) — a
stale/incomplete index for this file, not a real zero-callers result.
Cross-checked instead via direct grep: `case 'execute':`
(`src/runner/dispatch/cli.mjs:826`) is reached only through
`runDispatchCli`'s own `switch (subcommand)`, itself only invoked by
`dispatch.mjs`'s script guard (`import.meta.url === ...`) — no other
in-repo caller constructs argv for this subcommand programmatically, so
the blast radius of adding a new optional flag here is: zero existing
call sites break (additive-only), and the only consumers are external
shell invocations (skills' own `node .../dispatch.mjs execute ...`
commands), none of which pass `--prompt-file` today.

Risk map:

| Component | Risk | What proves it |
|---|---|---|
| `runDispatchCli`'s `execute` case flag parsing | light | existing `spawnSync`-based CLI test pattern (`test/runner/dispatch.test.mjs:3411,3441`) extended with a `--prompt-file` case |
| `executeExecutorCli` | none — unchanged | signature untouched, no new test needed there |

Files touched, in order:
1. `src/runner/dispatch/cli.mjs` — add the `--prompt-file` read in
   `case 'execute':`.
2. `test/runner/dispatch.test.mjs` — add one CLI-level test mirroring the
   existing `execute` `spawnSync` tests, asserting a prompt read from a
   temp file reaches the executor the same way an inline `--prompt` value
   does.

No `fgos graph --json` critical-path ordering needed — a single
self-contained file pair with no dependency ordering question.

## Shape

Direct note (tiny mode, per SKILL.md Step 3): implement the flag read in
`runDispatchCli`'s `execute` case, mirroring the existing `flagValue`
helper already used for `--prompt`/`--model`/`--tier`/etc.
(`src/runner/dispatch/cli.mjs:821-824`). Concrete cases worth proving:
`--prompt-file` alone (reads file, passes content), `--prompt-file` +
`--prompt` together (file wins), `--prompt-file` pointing at a
nonexistent path (surfaces `fs.readFileSync`'s own `ENOENT`, no special
handling needed — the existing `case 'execute':` block already funnels a
thrown error from `executeExecutorCli`'s promise rejection into the
structured `{error, errorClass}` stdout write; a synchronous throw before
that call needs the same treatment, i.e. the read happens inside the same
try-shaped flow, not before it unguarded).

## Outstanding questions

None
