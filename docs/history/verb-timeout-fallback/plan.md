# plan: verb-timeout-fallback (tsk-3vo)

## Status

Mode: **standard**. Ready for `fgos-coding-validating`.

## Mode gate

Flags counted against the item:

| Flag | Applies? |
|---|---|
| auth | no |
| authorization | no |
| data model | no |
| audit/security | no |
| external systems | no |
| public contracts | **yes** — changes observable CLI behavior of `return`/`approve`/`catchup`: omitting `--timeout` used to mean unbounded, now means "use the fallback"; adds a new flag and a new validation error |
| cross-platform | no |
| existing covered behavior | **yes** — these three verbs almost certainly have existing test coverage asserting current flag/timeout behavior, which this item's change will need to update, not just extend |
| weak proof around the area | no |
| multi-domain | no |

2 flags → **standard**. No hard-gate flag (no auth, no data loss, no
audit/security, no external provider, no validation removal) — high-risk
would overstate this; tiny/small would understate a change touching three
call sites plus a shared new behavior plus three error strings.

## Approach

**Chosen path:** give `return`/`approve`/`catchup` a shared fallback-timeout
resolution step, reusing the runner's own existing config-loading
machinery instead of inventing a second one.

- `src/runner/dispatch.mjs` already exports `loadRunnerConfig(configPath)`
  and `ensureRunnerConfig(configPath)` (bootstraps a default file if
  missing) — `bin/fgos.mjs:792` (the `discover` verb) already calls
  `ensureRunnerConfig(path.join(process.cwd(), '.fgos-runner.json'))` to
  get `cfg.timeoutMs` equivalent (well, `cfg` — `timeoutMs` is a top-level
  field per `.fgos-runner.json`'s tracked shape). The runner loop
  (`loop.mjs:689`) reads `config.timeoutMs` from the same loaded config.
  This item reuses `ensureRunnerConfig` at the same three call sites
  instead of writing a new reader (D2: fallback = `.fgos-runner.json`'s
  `timeoutMs`, same value the runner loop already uses).
- Each of the three verbs currently resolves `timeoutMs` from `flags.timeout`
  alone (`bin/fgos.mjs:1428-1432` return, `1680-1684` approve, `2062-2066`
  catchup). Replace that with:
  1. If both `--timeout` and `--no-timeout` are present → validation error,
     reject both (D5).
  2. If `--no-timeout` is present alone → `timeoutMs = undefined` (today's
     unbounded behavior, now opt-in only) (D3).
  3. If `--timeout <ms>` is present alone → parse and validate as today
     (unchanged numeric/positive checks).
  4. If neither is present → `timeoutMs = ensureRunnerConfig(path.join(repoRoot,
     '.fgos-runner.json')).timeoutMs` (D2).
- Update the three identical error strings at `bin/fgos.mjs:1428`, `1680`,
  `2062` from `"... (omit --timeout entirely for no timeout)"` to something
  that states the new contract: omitting `--timeout` uses the configured
  default; `--no-timeout` is how you get unbounded (D4).
- The three call sites are independent (return/approve/catchup are
  separate `case` blocks in the same switch in `bin/fgos.mjs`) — no
  ordering dependency between them; the shared piece is the flag-resolution
  logic itself, which can be written once (a small local helper function in
  `bin/fgos.mjs`, given the pattern repeats identically three times — this
  is a KISS/DRY call the implementer makes at execution time, not a new
  module) and called from all three `case` blocks.

**Rejected alternative:** hardcoding a new default constant independent of
`.fgos-runner.json` (the non-recommended option from the `clarify` round).
Rejected per D2 — it would create a second, silently different timeout
default from the one the runner loop already uses for the identical
`runGoalCheck` call, defeating the point of closing the divergence.

**Risk map:**

| Component | How risky | What would prove it |
|---|---|---|
| Flag resolution (D5 conflict handling) | medium — easy to get precedence wrong instead of erroring | explicit test: `--timeout 100 --no-timeout` together exits non-zero, mentions both flags |
| Fallback wiring (`ensureRunnerConfig` reuse) | low — existing, already-used function | existing `discover`-verb usage is a working precedent; a test asserting omitted `--timeout` on `return` actually times out at the configured value (or a mocked/short config value) rather than hanging |
| Existing test coverage on old behavior | medium — old tests may assert "omit `--timeout` == unbounded" | full `npm test` run; any failing test here is expected to need updating, not a regression signal |
| Error text (D4) | low — string change only | grep for the old string after the change; should return nothing outside a changelog/history reference |

Medium-risk items (flag resolution, existing test coverage) carry their
proof points into `fgos-coding-validating`.

**Files likely touched:**

- `bin/fgos.mjs` — three `case` blocks (`return`, `approve`, `catchup`):
  flag parsing/resolution, error text. Possibly one small shared helper in
  the same file.
- Existing test file(s) covering `return`/`approve`/`catchup` timeout flag
  behavior (to be located at execution time via a grep for `--timeout` in
  the test suite) — updated, not just extended, per the "existing covered
  behavior" flag above.
- No changes needed to `src/runner/goal-check.mjs`, `src/runner/loop.mjs`,
  or `src/runner/dispatch.mjs` — this item only consumes
  `ensureRunnerConfig`, it does not modify it.

**Ordering:** no cross-item dependency — `fgos graph --json` shows tsk-3vo
in a 2-item component with `tsk-6c2` (a separate, already-filed item that
depends on tsk-3vo, adding a `--wait` retry flag to the *lock-acquisition*
side of these same verbs — unrelated mechanism, different flag, listed here
only because completing tsk-3vo unblocks it). No ordering decision needed
within this item's own three call sites — they are independent siblings in
the same switch statement.

## Shape

Single item, not split (per D1 — one root cause, one fix shape, shared
across all three verbs). Concrete cases worth proving at execution/verify
time, matching `standard` depth:

- Omitted `--timeout`, omitted `--no-timeout`, real hung verify → process
  times out at the configured fallback value (do not need to wait the full
  900000ms in a test — a config with a short `timeoutMs` or a short-lived
  hang command proves the mechanism).
- Omitted `--timeout`, omitted `--no-timeout`, verify actually passes
  quickly → unaffected, passes as before (regression check).
- `--no-timeout` alone → verify allowed to run unbounded (today's current
  behavior, now gated behind the flag).
- `--timeout <ms>` alone → unchanged explicit-timeout behavior.
- `--timeout <ms>` and `--no-timeout` together → validation error, neither
  flag applied, non-zero exit.
- Same four cases repeated across `return`, `approve`, and `catchup` — the
  fix must land identically in all three, not just one.
- Error text no longer promises "omit for no timeout" anywhere in the
  three affected `case` blocks.

## Split

No split. One item, all three verbs, per D1.

## Execution note

Per the locked precedent (D2/D3), Execute's own verify path
(`goal-check`/`return`'s re-verify) is unchanged — this item does not touch
that mechanism, only the flag-resolution logic feeding `timeoutMs` into it
at the three CLI call sites. Verify command for this item: `npm test`
(already the item's own `verify` field).
