# tsk-5hi — `fgos setup` runs registered doctor fixes

**Stage:** clarify (fgos-coding-exploring). **Date:** 2026-08-05.

## Feature boundary

`fgos setup` (`bin/fgos.mjs` `case 'setup'`, line 3491) writes shell-rc
source lines, merges shared-config defaults (`ensureSharedConfigDefaults`),
and wires git hooks (`installGitHooks`) — but never calls `runFixes()`
(`src/setup/registrations.mjs:130`), the same registered-fix runner
`fgos doctor --fix` already uses. A project set up via `fgos setup` alone
can still be missing anything only a registered `fix` repairs (today:
`claude-plugin-marketplace`, tsk-4xg) until someone separately runs
`fgos doctor --fix`. This item makes `fgos setup` also run every
registered fix, closing that gap without a person needing to know a
second command exists.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `fgos setup` runs every registered fix unconditionally via the existing `runFixes(repoRoot)` (`src/setup/registrations.mjs:130`) — the identical call `doctor --fix` already makes, no new mechanism. No confirmation prompt, no subset carve-out. Grounded in RUL10 (`docs/specs/distribution.md:210`): "`fgos setup` never asks for confirmation before writing... it acts and then reports exactly what it changed" — `setup` has never gated any of its other writes (rc lines, config defaults, git hooks) behind a prompt, so gating fixes behind one would be a new, unprecedented behavior for this verb, not a continuation of its existing contract. Safe to run unconditionally because every registered `fix` is already required to be idempotent and fail-soft per entry (`docs/history/doctor-fix-gate-bypass/CONTEXT.md` D3) — confirmed live in both current fixes: `fixGateBypassConfigured` (`src/setup/registrations.mjs:519-532`) is a no-op once the level is already valid, and `fixClaudePluginMarketplace` (`:658-692`) cleanly reports "claude CLI not found on PATH — nothing to fix" rather than erroring when the `claude` binary is absent. |
| D2 | The item's own framing that `gate-bypass-configured` is "also never auto-applied by setup" is true of the `fix` *function* only — `setup` already reaches the same end state today through the independent `ensureSharedConfigDefaults()` path: `registerConfigDefault({id:'gateBypass', key:'gateBypass', shape:{level: DEFAULT_LEVEL}})` (`src/setup/registrations.mjs:534-538`) is already folded into `assembleRegistryDefaults()` and merged by `ensureSharedConfigDefaults(repoRoot)`, which `setup`'s case already calls (`bin/fgos.mjs:3516`) — both paths write `gateBypass.level = "off"` when missing, so `gate-bypass-configured`'s doctor check already passes after a plain `fgos setup` today. `claude-plugin-marketplace` (tsk-4xg) is the only registered fix with no `configDefault` counterpart, and is therefore the one fix this item's D1 closes a real, practical gap for in today's registry — pinned so `fgos-coding-planning` scopes verify/test evidence at the real gap rather than re-proving something `setup` already covers structurally. This does not change D1: D1 still runs *every* registered fix (future fixes may have no config-default counterpart either), it only corrects which of today's two fixes is the actual motivating gap. |

## Pinned terms

- **"registered fix"** — an entry added via `registerFix({id, fix})`
  (`src/setup/registrations.mjs:110`), collected in `FIX_REGISTRATIONS` and
  run by `runFixes(cwd)`. Today: `gate-bypass-configured`,
  `claude-plugin-marketplace`.

## Scout evidence

- `bin/fgos.mjs:3491-3535` (`case 'setup'`) — confirms setup's three
  existing write side effects (rc lines, `ensureSharedConfigDefaults`, git
  hooks) and confirms it never imports or calls `runFixes`.
- `bin/fgos.mjs:3621-3628` (`case 'doctor'`) — `const fixed = flags.fix ?
  runFixes(process.cwd()) : undefined;` is the exact call this item
  proposes `setup` also makes.
- `src/setup/registrations.mjs:130-135` (`runFixes`), `:110-121`
  (`registerFix`), `:559-562` and `:700-703` (today's two registrations).
- `src/setup/registrations.mjs:503-532` (`checkGateBypassConfigured` /
  `fixGateBypassConfigured`) and `:534-538`
  (`registerConfigDefault('gateBypass', ...)`) — confirms D2's "already
  covered by the config-default path" finding.
- `src/setup/registrations.mjs:626-703` (`checkClaudePluginMarketplace` /
  `fixClaudePluginMarketplace`) — confirms this fix has no
  `registerConfigDefault` counterpart and shells out to an external
  `claude` binary, the one genuinely uncovered gap.
- `docs/specs/distribution.md:210-215` (RUL10) — "acts and then reports",
  the precedent D1 is grounded in.
- `docs/history/doctor-fix-gate-bypass/CONTEXT.md` D3 — fixes are pinned
  idempotent by contract, backing D1's "safe to run unconditionally" claim.
- `docs/history/close-distribution-spec-doctor-fix/CONTEXT.md` — confirms
  RUL9/RUL11 already describe `doctor --fix` as real and registry-driven;
  this item does not reopen either rule, it adds `setup` as a second
  caller of the same `runFixes` mechanism.
- Prior `judgeDiscovery` verdicts for `tsk-5hi`: none (`data.discovery` has
  no entry for this id) — nothing to build on or contradict.
- Impact-analysis posture: **full** (`gitnexus` present,
  `fgos tool query --capability impact-analysis --status present`
  returned one `present` provider).

## Outstanding questions deferred to planning

- Exact call-site placement of `runFixes(repoRoot)` inside the `setup`
  case (ordering relative to the rc/config/hooks writes already there) and
  the exact shape of the `fixed` key added to `setup`'s return object —
  implementation detail, `fgos-coding-planning`'s job, not a product decision.

## Canonical references

- `bin/fgos.mjs` `case 'setup'` (:3491), `case 'doctor'` (:3621)
- `src/setup/registrations.mjs` (`registerFix`, `runFixes`,
  `ensureSharedConfigDefaults`, both current fix registrations)
- `docs/specs/distribution.md` RUL9, RUL10, RUL11
- `docs/history/doctor-fix-gate-bypass/CONTEXT.md` (tsk-2qz)
- `docs/history/tsk-4xg-plugin-marketplace-doctor-check/` (tsk-4xg)
