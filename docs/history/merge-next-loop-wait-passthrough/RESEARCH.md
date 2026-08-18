# tsk-328 — Research log

## Round 1 (2026-08-11)

**Asked:** Is the technical goal for tsk-328 (per D1, `CONTEXT.md`) clear
enough to plan/build — wiring `--wait`/`--timeout` passthrough into the
`/fgOS:merge-next` and `/fgOS:merge-loop` skill wrappers?

**Checked:**
- `bin/fgos.mjs:1987-2028` — `merge next` recurses into `approve` via
  `runVerb('approve', flags, ...)`, forwarding `flags` as-is.
- `bin/fgos.mjs:255-313` — shared `--timeout`/`--no-timeout` resolution
  (`resolveVerifyTimeoutMs`), and `parseWaitFlags` (line 267) for the
  separate `--wait`/`--no-wait` lock-wait ceiling.
- `bin/fgos.mjs:2727-2728` — `approve` calls `parseWaitFlags` then
  `withLockRetry` (`runMerge`).
- `src/runner/lock-wait.mjs` — `withLockRetry`'s explicit `waitMs` param
  is a true wall-clock ceiling, decoupled from `remainingTtlMs` (tsk-2rf
  D1/D2), already handles a continuously self-refreshing holder.
- `src/cli/command-registry.mjs:494-519` — `merge` verb's own registered
  parameters: `timeout`/`wait`/`no-wait`, each documented as `"next" only:
  forwarded to the underlying approve call`.
- `plugins/fgOS/skills/merge-next/SKILL.md:36` — the skill's own `fgos
  merge next` invocation carries none of these flags — confirmed the gap
  is at the skill layer, not the CLI layer.
- `plugins/fgOS/skills/merge-loop/SKILL.md` — wraps `/fgOS:merge-next`
  via the generic `/loop` skill; inherits the same gap since it never
  adds flags of its own.
- `bin/fgos.mjs:3542-3708` (full `catchup` case body) — no
  `acquireMainCheckoutLock`/`withLockRetry` call anywhere; confirmed
  `catchup` is correctly out of scope (D1).

**Found:** The CLI-side capability (`--wait <ms>` on `merge next`) already
exists and is already documented in the command registry. The only
missing piece is exposing it as an optional flag on the two skill
wrappers, forwarded verbatim to the underlying `fgos merge next` CLI
call — a small, mechanical, low-risk change confined to two `SKILL.md`
files (prose + example invocation shape), no `src/`/`bin/` code changes
needed.

**Still open:** None for this technical question — D1-D3 in `CONTEXT.md`
already lock the product-side scope; nothing here contradicts or narrows
those decisions further.

**Verdict:** `clear` — verify: run the two skill files' own existing
test/lint gate (`docs/how-to/write-verify-for-a-skill-prose-change.md`'s
documented shape for a skill-prose change) plus a manual invocation
proving `--wait`/`--timeout` reach the underlying `fgos merge next` call
unchanged in shape from `approve`'s own existing flags.
