# plan.md — tsk-5jl: generalize herdr-spawn (config-driven live visibility + correct result)

Mode: high-risk

Lane derivation (mechanical, `fgos-routing`'s Mode gate, no CONTEXT.md
exists — discovery verdict was `clear`, which skips `exploring`): counted
flags — external systems (real CLIs: herdr, agy, claude, pi, codex),
public contracts (`herdrSpawnAdapter`'s `{status, stdout, paneId}` return
shape, consumed by `executeExecutorCli`/`cli.mjs`'s `[DONE]`/`[BLOCKED]`
ladder, must be preserved), existing covered behavior (`test/runner/
herdr-spawn-adapter.test.mjs` already exercises this adapter against both
mocks and the real installed `herdr` binary — must not regress), weak
proof around the area (`codex exec`'s live-streaming default is
explicitly unverified by this item's own scope) = 4 flags → high-risk per
"4+ flags → high-risk". No hard-gate flag (auth/data-loss/audit-security/
external-provider/validation-removal) actually fires — the env-secret-into-
argv pattern this item extends to more executors is an ALREADY-accepted
risk (transport.mjs's own comment, "ACCEPTED RISK, decided by the person,
2026-08-25"), not a new security decision.

## Approach

**`fgos graph --json`**: this item is not on the critical path (`depth
10` path: tsk-4vo→...→tsk-19y-1, none of which is tsk-5jl) and
`topUnblock` is empty for it — it has no `deps`, blocks nothing else, and
nothing blocks it. File-touch order below is therefore a pure
implementation-sequencing choice, not something the deps graph dictates.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` returns `gitnexus` as `present`, but
`mcp__gitnexus__list_repos` shows the indexed `forgent`/`forgentX` entry
is **2084 commits behind HEAD** (and this session's own worktree path is
not indexed at all) — too stale to trust for blast-radius evidence on
recently-touched code. Per CLAUDE.md's gate, this is "present but
flagged stale" → degraded: ran a manual `grep`/`rg` cross-check instead
(below), and the resulting proof is marked weak rather than treated as a
full GitNexus-confirmed blast radius.

**Manual blast-radius cross-check (real, cited):**
- `herdrSpawnAdapter` (`src/runner/dispatch/transport.mjs:536`) is
  referenced ONLY by its own module's `EXECUTOR_ADAPTERS` map
  (`transport.mjs:1049`) and by `test/runner/herdr-spawn-adapter.test.mjs`
  (mock + live-binary tests) plus one assertion in
  `test/runner/dispatch.test.mjs:1039` checking
  `Object.keys(EXECUTOR_ADAPTERS)` — no other module imports the function
  directly. Selection happens purely through the string
  `executor.adapter === 'herdr-spawn'`. Contained blast radius.
- Every other repo hit for the literal string `"agy"` is either (a) a
  `docs/history/**` narrative snapshot (untouched — historical record, not
  live config, per `docs/specs`'s own doc-management convention) or (b) a
  test file (`test/runner/dispatch.test.mjs`, `test/cli/fgos-tool.test.mjs`,
  `test/state/tool-registry.test.mjs`) building its OWN synthetic,
  self-contained `cfg` fixture with `agy` as an arbitrary example
  executor id/command string — none of them read the real
  `.fgos/config.json`. Renaming the real config's `executors.agy` →
  `executors.agy-cli` therefore has ZERO test blast radius. `src/runner/
  dispatch/resolve.mjs`'s only hit is a comment (`// ... "agy") -- every
  error ...`), not a hardcoded default.
- `src/runner/dispatch/config.mjs`'s `validateExecutorShape`/
  `validateExecutorEntryShape`/`validateInvocationShape` (config.mjs:314,
  564, 503) validate a fixed, named-field list with `if (field !==
  undefined)` checks — never an `Object.keys()` allowlist — confirmed by
  direct read (RESEARCH.md Round 1). Adding an optional `liveOutput` field
  is additive, zero blast radius on entries that omit it.

**Chosen path** (five ordered pieces, sequential — each depends on the
previous existing, not on graph ordering):

1. **Fix the pane-close gap** in `herdrSpawnAdapter`'s success path
   (`transport.mjs`, near the existing `waitChild.on('close', ...)`
   success branch, mirroring the SAME best-effort `herdr pane close
   <paneId>` call the timeout branch already makes at line ~841) — smallest,
   independently valuable, zero new config surface, do first.
2. **Add `liveOutput` config plumbing**: `config.mjs`'s
   `validateLiveOutputShape` (new, small, same per-field style as every
   other validator in that file) called from `validateInvocationShape`;
   thread the resolved `liveOutput` through to `herdrSpawnAdapter`'s
   `opts` the same way `command`/`args`/`env` already flow (via
   `resolveExecutorConfig`/the invocation object itself — read the exact
   current threading path before wiring, do not assume a new opts field
   without confirming how `opts.herdrBin` etc. already arrive).
3. **Adapter behavior for `liveOutput`**: when present, append
   `streamFlags` to args, change the disposable script's shebang from
   `sh` to `bash` (required for `${PIPESTATUS[0]}`), pipe through `tee
   <raw-jsonl> | node <renderer>`, capture the real exit code via
   `${PIPESTATUS[0]}` before the sentinel echo. When absent: today's exact
   `sh` behavior, byte-identical (regression guard: every EXISTING test in
   `herdr-spawn-adapter.test.mjs` must still pass unmodified for the
   no-`liveOutput` path).
4. **Write the two renderers** under new `src/runner/dispatch/
   live-renderers/`: `claude-stream-json.mjs` (Claude Code
   `--output-format stream-json --verbose --include-partial-messages`
   JSONL → readable text: print `text_delta`'s incremental text, a
   one-line `→ <tool>(...)` per `tool_use`, skip raw thinking/tool-input
   deltas) and `pi-agent-session.mjs` (pi's real `AgentSessionEvent`
   schema, confirmed in RESEARCH.md Round 1 from the actual fixture
   `docs/history/pi-executor-runtime-capacity/evidence/round4-d4-attempt-
   gpt55-stdout.jsonl`: print `message_update.assistantMessageEvent.type
   === 'text_delta'`'s `delta` incrementally, a one-line summary on
   `tool_execution_start`/`tool_execution_end`, skip `thinking_*`/raw
   `toolcall_delta`). Each independently testable against a small fixture
   JSONL — no dependency on the adapter or on each other.
5. **Config wiring in `.fgos/config.json`** (last, since it depends on
   1-4 existing): rename `executors.agy` → `executors.agy-cli` (verified
   zero test/live-code blast radius above); add `executors.agy-herdr`
   (adapter `herdr-spawn`, no `liveOutput` — agy already streams live
   natively, RESEARCH carried in from before this item existed); rewire
   `capabilities.fgos-coding-implement.prefer` from `claude-herdr` to
   `agy-herdr` (this is the ACTIVE one, replacing the prior temporary
   demo) and update that capability's description; add `liveOutput` to
   the existing `executors.claude-herdr` entry but leave it dormant
   (unreferenced by any capability's `prefer` — the "flip on later"
   convention, since JSON has no comment syntax and nothing dispatches to
   an executor id no capability names); add new dormant
   `executors.pi-herdr` (liveOutput → `pi-agent-session.mjs`) and
   `executors.codex-herdr` (no `liveOutput`, description states plainly
   that codex's streaming default is unverified/TODO) — each dormant
   entry's `description` states it is not wired to any capability yet and
   names the exact activation step (`add {prefer: "<id>"} to a
   capability`).

**Alternatives rejected:**
- *Fire-and-forget redesign* (mirror `herdr-plugin`'s own `open_pick_pane`
  exactly — type a raw interactive command, never wait, close nothing,
  let fgOS state transitions signal completion): rejected per the
  person's own explicit direction earlier in this same design
  conversation — it would break `herdrSpawnAdapter`'s synchronous
  `{status, stdout}` return contract that `executeExecutorCli` and every
  existing test in `herdr-spawn-adapter.test.mjs` depend on, for no
  benefit once the `-p`/`stream-json` + `PIPESTATUS` + pane-close design
  below achieves both goals (live visibility AND a correct synchronous
  result) without that architecture fork.
- *One combined renderer for both claude and pi*: rejected — the two
  JSONL schemas are genuinely different shapes (`assistantMessageEvent`
  nested one level deeper for pi, different event-type vocabularies) at
  the wire level; a shared abstraction here would be premature (YAGNI) for
  two consumers with real structural differences.

**Risk map:**

| Component | Risk | Proof point (validating/live) |
|---|---|---|
| `agy` → `agy-cli` rename | standard (real config rename, but zero test/code blast radius confirmed above) | `npm test` green + real dispatch to `agy-cli` still resolves (existing `cli-spawn` path, unchanged behavior) |
| pane-close-on-success fix | light | new mocked test asserting `herdr pane close` is called on the success path (mirroring the existing timeout-path test) |
| `liveOutput`/PIPESTATUS pipeline | standard (new shell-composition path: bash shebang + tee + PIPESTATUS) | new mocked test proving the REAL command's exit code (not tee's/renderer's) surfaces correctly through a piped script, plus the two renderers' own fixture-based unit tests |
| `agy-herdr` real live dispatch | standard (external binary behavior, not fully controllable) | REQUIRED real proof: dispatch one real fgOS work item through `agy-herdr` against the actually-installed `herdr`+`agy` binaries — live pane visibility, auto-close, correct status/stdout, item state actually advances |
| `codex exec` streaming default | unverified (deliberately deferred) | none required this item — `codex-herdr` ships with no `liveOutput` and a plain TODO description; a follow-up item covers verifying and wiring it if/when needed |

## Shape

Phased (high-risk lane, fuller map — matches the five-piece Approach
above 1:1, each phase independently testable before the next starts):

- **Phase 1** — pane-close-on-success fix + its regression test. Smallest
  safe first step; already valuable on its own even if nothing else
  landed.
- **Phase 2** — `liveOutput` config shape (validator + threading) with a
  config-load unit test (accepts the field, rejects a malformed one),
  no adapter behavior change yet.
- **Phase 3** — adapter's `liveOutput` branch (bash/tee/PIPESTATUS) with
  mocked tests proving: (a) absent `liveOutput` → byte-identical to
  today (regression guard on every existing test), (b) present → real
  exit code surfaces correctly through the pipe, sentinel still detected.
- **Phase 4** — the two renderer scripts, each with its own small fixture
  test (feed a captured/synthetic JSONL, assert the expected rendered
  text lines) — no adapter dependency.
- **Phase 5** — `.fgos/config.json` wiring (rename + new entries +
  capability rewire) + the REQUIRED real live proof (dispatch a real
  fgOS work item through `agy-herdr` against real `herdr`+`agy` binaries).

Cases worth proving (high-risk depth): empty/boundary — a `liveOutput`
renderer receiving zero bytes on stdin (agent exits before printing
anything); existing behavior that must not regress — every current
`herdr-spawn-adapter.test.mjs` test, unmodified, still green; partial
failure — the piped renderer process itself crashes/exits nonzero (must
not swallow or mis-attribute the real command's own exit code, since
`${PIPESTATUS[0]}` is captured from the FIRST pipeline stage regardless
of what happens downstream); concurrent access — not applicable (each
dispatch gets its own fresh pane and its own disposable script file, no
shared mutable state between concurrent dispatches, matching the existing
hard constraint C1 already proven in this file).

## Assumptions

- `bash` is available wherever `herdr-spawn` actually dispatches (already
  implied — the existing disposable script already assumes a POSIX-ish
  shell is present via `sh`; `bash` is a strictly narrower, still-standard
  assumption on any Linux/macOS dev machine this repo already targets).
  Not re-confirmed live in this plan since `sh`'s own presence was already
  an accepted precondition of the code being modified — not a NEW
  assumption this change introduces beyond swapping which POSIX-ish
  shell.

## Split decision

**No split.** One coherent, sequential piece of work — the five
Approach steps are ordered by real dependency (each phase's tests must
pass before the next lands), not independently workable in parallel, and
splitting into separate work items would just add coordination overhead
for a lane that is intrinsically one connected change (adapter + config +
renderers all serve the same two goals together). Verify stays this
item's own single command below; no per-child spec is written.

## Outstanding questions

None
