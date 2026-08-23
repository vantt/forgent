# tsk-5hi — plan: `fgos setup` runs registered doctor fixes

**Stage:** decompose (fgos-coding-planning). **Date:** 2026-08-05.
**Decisions:** `docs/history/setup-runs-registered-fixes/CONTEXT.md` (D1, D2).

## Mode gate

Flags counted against the item:

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | no persisted-state shape change; the new `fixed` key is ephemeral CLI output, not a stored schema |
| audit/security | **yes** | `setup` gains an unconditional, unflagged side effect that mutates state outside this repo (a person's Claude Code plugin marketplace/install list) — today that side effect only ever ran behind an explicit opt-in flag (`doctor --fix`) |
| external systems | **yes** — hard gate | `runFixes()` shells out to the `claude` binary (`fixClaudePluginMarketplace`, `src/setup/registrations.mjs:658-692`) to add a marketplace and install a plugin; this item makes that run on every plain `fgos setup`, not just an explicit `--fix` |
| cross-platform | no | — |
| existing covered behavior | **yes** | `bin/fgos.mjs`'s `setup` case is exercised by `test/cli/fgos.test.mjs:517` and its own return shape is documented in RUL9/RUL10/RUL11 (`docs/specs/distribution.md`) — both need to keep passing/stay accurate |
| public contracts | **yes** | `setup`'s JSON `data` shape gains a `fixed` key (mirroring `doctor --fix`'s own); `docs/specs/distribution.md` describes `setup`'s contract explicitly today and does not mention this |
| weak proof around the area | no | area is well covered (`test/setup/*.test.mjs`, `test/cli/fgos.test.mjs`) |
| multi-domain | no | — |

**4 flags, including a hard-gate flag (external systems) → mode: high-risk.**

A smaller mode would not honestly cover this: the code diff itself is one
call site (`bin/fgos.mjs`'s `setup` case gains `runFixes(repoRoot)`), but
the *behavioral* blast radius is every future `fgos setup` invocation —
including unattended ones (fresh-clone bootstrap, CI, onboarding scripts)
— now silently reaching outside this repo to mutate a different tool's
config. That is exactly the class of change RUL9/RUL10/RUL11's own
"no side effects setup doesn't already declare" framing exists to gate,
so it gets the high-risk shape (explicit risk map + proof points), not a
`small`/`standard` pass-through.

## Approach

**Chosen path:** call the existing `runFixes(repoRoot)`
(`src/setup/registrations.mjs:130`) from `bin/fgos.mjs`'s `case 'setup'`
(line 3491), the same call `case 'doctor'` already makes under `--fix`
(line 3622), and fold the result into `setup`'s returned object under a
`fixed` key — byte-identical shape to `doctor --fix`'s own `fixed` array
(`{id, changed, message}` per entry). No new mechanism; `runFixes` is
already generic over `FIX_REGISTRATIONS` (D1, CONTEXT.md).

**Rejected alternatives:**
- *Prompt/confirm before running fixes* — rejected by CONTEXT.md D1: would
  be new, unprecedented behavior for `setup`, which RUL10 already commits
  to "acts and then reports," never asks.
- *Run only a safe subset (e.g. skip `claude-plugin-marketplace`)* —
  rejected by CONTEXT.md D1: every registered fix is already contractually
  required to be idempotent and fail-soft; carving out a subset would need
  a per-fix risk tier that does not exist in the registry today and adds a
  YAGNI mechanism for a problem the existing contract already covers.
- *Add a new `--fix` flag to `setup` itself, opt-in like `doctor`* —
  rejected: this is exactly the status quo the item exists to close (a
  person has to already know to pass an extra flag); CONTEXT.md D1 locks
  "unconditionally."

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `runFixes()` call added to `setup` | Unconditional shell-out to `claude` plugin CLI on every setup run, including environments with no `claude` binary or where marketplace mutation is unwanted | Run `fgos setup` in a scratch dir with `FGOS_CLAUDE_COMMAND` unset/pointed at a missing binary (existing test seam, `src/setup/registrations.mjs:594-596`) — confirm `setup` still exits 0 and `fixed` reports `claude-plugin-marketplace` as `changed:false, message: "claude CLI not found on PATH — nothing to fix"`, no crash, no partial-write |
| `gate-bypass-configured` fix now double-covered (D2) | Running both `ensureSharedConfigDefaults` (already in `setup`) and `runFixes()` against the same `gateBypass.level` key on one `setup` call — check for a conflicting/duplicate write | Trace `mergeConfigDefaults` + `fixGateBypassConfigured`: the config-default fill already writes a valid `level` before `runFixes` runs (order in the `setup` case), so the fix sees an already-valid level and reports `changed:false` — proof point is a real `setup` run against an empty config confirming exactly one effective write and no error |
| `setup`'s JSON envelope contract | Adding a `fixed` key changes `setup`'s documented output shape (RUL9/RUL10/RUL11) | `test/cli/fgos.test.mjs:517`'s existing setup assertions must still pass unmodified (additive-only field, no existing key removed/renamed) — extend the same test to assert the new `fixed` array's presence/shape |
| `claude-plugin-marketplace` fix's real external calls | Using `FGOS_CLAUDE_COMMAND` test seam (`src/setup/registrations.mjs:594-596`) — never invoke the real `claude` CLI from a test | Confirm the seam is honored the same way `test/setup/plugin-marketplace-doctor-check.test.mjs` already proves it for `doctor --fix` |

Impact-analysis posture: **full** (`gitnexus` present, confirmed via
`fgos tool query --capability impact-analysis --status present` at
`fgos-coding-exploring` time — CONTEXT.md scout evidence). `fgos-coding-implement`
runs `impact({target: "setup", direction: "upstream"})` (or the actual
symbol name the switch-case resolves to) before editing, per
`AGENTS.md`'s Always-Do rule — this plan does not substitute for that.

## Files likely touched

1. `bin/fgos.mjs` — `case 'setup'`: add the `runFixes(repoRoot)` call and
   `fixed` key on the returned object.
2. `test/cli/fgos.test.mjs` — extend the existing setup test (`:517`) to
   assert the `fixed` array, using `FGOS_CLAUDE_COMMAND` to avoid a real
   `claude` shell-out.
3. `docs/specs/distribution.md` — RUL9/RUL10/RUL11 currently describe
   `setup` and `doctor --fix` as separate write paths; RUL10 (or a new
   rule) needs one sentence stating `setup` also runs every registered fix
   unconditionally, same registry `doctor --fix` reads. Settled-spec-fact
   update per `AGENTS.md`'s "a settled spec fact goes into
   docs/specs/<area>.md."

No split: `fgos graph --json` shows `tsk-5hi` as its own isolated
size-1 component (no other item depends on or blocks it) — one honest
piece of work, not several independently workable ones. Proceeds as
itself.

## Order

Single piece, no cross-item sequencing needed (confirmed via `fgos graph
--json`'s component listing above). Within the piece: implement the
`bin/fgos.mjs` call site first (the only functional change), then the
test extension (proves it), then the spec-doc sentence (records it) —
each step's own verify command below is a strict superset check on the
one before it.

## Shape (high-risk — full map)

Concrete cases to prove:
- **Empty/fresh config, no prior `gateBypass`/`claude-plugin-marketplace`
  state** — `setup` on a brand-new scratch dir fixes both from scratch,
  `fixed` reports both entries.
- **Already-fixed state (idempotency)** — running `setup` twice reports
  `changed:false` for both fixes the second time, same as `doctor --fix`
  already proves for itself.
- **`claude` binary absent** — `fixed` reports the plugin-marketplace
  entry as a clean no-op, `setup` still exits 0 (existing behavior for
  every other `setup` write is already fail-soft/fill-only; this fix must
  match that, not introduce a hard failure).
- **Existing regression surface** — every other `test/cli/fgos.test.mjs`
  assertion for `setup` (rc lines, config defaults, git hooks) still
  passes unchanged.

## Assumptions

- The `claude` binary's own `plugin marketplace add`/`install` commands
  remain safe to call repeatedly (idempotent) — already an existing
  assumption `doctor --fix` relies on today (`docs/history/
  tsk-4xg-plugin-marketplace-doctor-check/`), not a new one introduced by
  this item. Not re-proven here; flagged so `fgos-coding-validating` can decide
  whether it needs fresh evidence.

## Verify (for the item as a whole)

```
npm test -- test/cli/fgos.test.mjs test/setup/registrations.test.mjs
```

Same command locked in `CONTEXT.md`/`discover`'s verify field — both
files directly exercise the call site (`fgos.test.mjs`) and the fix
registry it calls into (`registrations.test.mjs`).
