# tsk-592 — Gate predicate fix + mechanism value rename

Mode: **standard** (2 flags: public contracts — the mechanism string is a
breaking-change surface for consumers reading `dispatch.mjs decide`'s JSON
— and existing covered behavior — `test/runner/dispatch.test.mjs` already
asserts the current strings).

Split child of `tsk-5td` (dispatch-vocabulary-rearrange session). No local
`CONTEXT.md` — this item inherited its locked decisions directly from
`tsk-5td`'s own `docs/history/dispatch-concept-boundary/DISCUSSION.md`
(a `fgos-coding-shaping` DISCUSSION doc plays the same "already locked,
cite don't reopen" role a `fgos-coding-exploring` CONTEXT.md would; that item's
worktree carries the only checked-in copy today — `.claude/worktrees/
tsk-5td-pqXr9j/docs/history/dispatch-concept-boundary/DISCUSSION.md`).
Citations below are D-IDs from that doc, per §7.3 (anchor
`#task-gate-predicate-and-rename`), §6.6 (mechanism), §6.9 (gate).

Impact-analysis posture: **degraded** — GitNexus registered and `present`
(`fgos tool query --capability impact-analysis --status present` returned
the `gitnexus` provider), but its index is behind current HEAD (last
indexed `19bc5e4`, several commits stale as of this plan) — blast radius
may be stale. None of this plan's own proof points lean on GitNexus
blast-radius evidence (every risk-map row below cites a real `rg`/`npm
test` command instead), so this posture change does not weaken any of
them; `fgos-coding-implement` still runs `impact()` on each touched symbol
per `CLAUDE.md`'s binding gate, treating its result as weak proof per the
degraded ladder rather than skipping it.

## Approach

Two independent, small edits that both live in `dispatch.mjs` and both
touch the word "mechanism" — kept as one item per DISCUSSION §7.3's own
"one item, one read of the code" framing, not two.

**1. Gate predicate (D13).** `resolveExecutorConfig` (`src/runner/
dispatch.mjs`) gates the tool-registry presence check and the
cross-provider check on `capacity.kind === 'cli'` (lines 608, 635). D13
(DISCUSSION §6.9, finding A4): the predicate should ask "does this
capacity's provider live outside the caller's own process" (`kind !==
'task'`), not "is it specifically the `cli` transport." Today's predicate
silently skips both checks for `kind: mcp/skill/http/binary` — latent
(no capacity of those kinds is registered yet), but `tsk-2ie5` is a live
trigger for the first one.

**2. Mechanism value rename (D16).** `decideDispatchMechanism` (line
672) and its capacity-level wrapper `decideCapacityDispatchMechanism`
return `'native'`/`'cli-spawn'` — DISCUSSION §6.6: these names describe
*how* (native call) and *by what means* (spawning a CLI), never *where*
(same process as the caller, or not) — which D16 locked as what the
value actually means. Rename to `'in-process'`/`'out-of-process'`.
`'inline'` (the fourth row of §6.6's derivation table, "not yet
configured / backend absent") is a separate, currently-unlogged derived
state — out of scope, not renamed.

**Deliberately NOT touched:** `DEFAULT_ADAPTER = 'cli-spawn'`
(`dispatch.mjs:836`) and every `capacity.adapter === 'cli-spawn'`
assertion — the adapter/port *name* (declared config, `EXECUTOR_ADAPTERS`'
one registered key) is a different concept from the mechanism *value*
that happens to share the same string today only because
`EXECUTOR_ADAPTERS` has exactly one entry. DISCUSSION §7.3 names this
collision explicitly as the reason D16 is urgent (`tsk-49o`'s pending
second adapter, `sandboxed-cli-spawn`, will make the two strings diverge
for real) — but resolving it means renaming the *mechanism* value, never
the adapter key. Also not touched: every "blind cli-spawn" / "…-native-
vs-cli-spawn.md" hit in `.claude/skills/fgos-*/SKILL.md` and this file's
own "Valid reasons to dispatch" section — those are either the decision
doc's filename or generic prose for "spawn a subprocess," not the JSON
enum value.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `resolveExecutorConfig` predicate change | medium — widens which capacity kinds get gated; today a no-op (no non-`cli`/`task` capacity registered) but must not accidentally gate `kind:"task"` itself | new test: a `kind:"mcp"`/`"skill"`/`"http"`/`"binary"` capacity now hits the same presence/cross-provider errors a `kind:"cli"` one does; existing `kind:"task"` and `kind:"cli"` tests must stay green unchanged |
| `decideDispatchMechanism`/`decideCapacityDispatchMechanism`/`decideCapacityCli` return value rename | medium — breaking string change; consumers keyed on `'native'`/`'cli-spawn'` literally would silently branch wrong instead of erroring | `rg -n "'native'\|\"native\"\|cli-spawn" src/ bin/ .claude/skills/` narrowed to zero real (non-adapter, non-filename, non-generic-prose) hits; existing unit tests updated to the new strings, not deleted |
| `dispatch.mjs decide` CLI entry point (stdout JSON) | medium — external readers of `{"mechanism": ...}` | updated test at `dispatch.test.mjs:1342` asserting the CLI's own stdout |
| `.claude/skills/_shared/capacity-dispatch-fallback.md` Step B.5/C | low — prose, but a live consumer (`fgos-submit-assist`) branches on the literal `mechanism` value read from `decide`'s JSON | manual re-read after edit: every branch condition and announce-line format string (`native -`/`cli-spawn -`) matches the new strings |

## Files touched

- `src/runner/dispatch.mjs` — predicate at lines 608/635, mechanism
  return values at 673–675, JSDoc mentioning the two strings around
  1119–1135. Not lines 827/836 (adapter name).
- `.claude/skills/_shared/capacity-dispatch-fallback.md` — Step B.5's
  JSON-shape line, its two `mechanism: "..."` bullets, the two
  announce-line format strings (`native - <agentType>` / `cli-spawn -
  <provider>`), the Step C heading's `(cli-spawn mechanism)` parenthetical,
  and the Precedent section's "always `cli-spawn`" line. Not the "blind
  cli-spawn" generic-prose line or the 0026 filename reference.
- `test/runner/dispatch.test.mjs` — every assertion of
  `decideDispatchMechanism`/`decideCapacityDispatchMechanism`/
  `decideCapacityCli`/the `decide` CLI entry returning `'native'` or
  `'cli-spawn'` as a *mechanism* (not the adapter-key assertions at
  ~609–611, 643–648, 923–926, which stay `'cli-spawn'` unchanged), plus
  new tests for: (a) `kind: mcp/skill/http/binary` now gated by presence
  + cross-provider checks the same way `kind: cli` is; (b) `decide`
  prints `in-process`/`out-of-process`.

## No split

One honest piece of work — two edits in the same function neighborhood
of the same file, one coherent review. Proceeds as itself.

## Outstanding questions

None
