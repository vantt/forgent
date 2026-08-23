---
item: tsk-34n
---

# plan.md — tsk-34n

Mode: **standard**

Flags: **existing covered behavior** (edits 5 real, tested call sites
inside `src/runner/dispatch.mjs` that `fgos-fanout`/the headless runner/
`test/runner/dispatch.test.mjs` all depend on) — no hard-gate flag hit
(not auth/data-loss/audit-security/external-provider/remove-validation;
`allowCrossProvider`'s own gate is untouched, only *which* capacity gets
resolved changes, never the cross-provider permission check itself). One
flag alone stays below the 2-3-flag `standard` threshold, but the real
edit surface (5 call sites in one CRITICAL-blast-radius file, per
`fgos-coding-validating`'s earlier GitNexus read on this exact
neighborhood) earns the fuller shape a `standard` plan gets rather than
`small`.

## Approach

Every decision (D1-D4) is already locked in `CONTEXT.md`; this plan is
the concrete diff. A full sweep (`rg "cfg.capacities\[capacityId\]"
src/runner/dispatch.mjs`) found the **complete, exact list** of every
direct-lookup call site — no guessing left for Implement:

| Line | Function | Keep or switch |
|---|---|---|
| 1024 | `resolveCapacityIdForPurpose` (its own `for`-array scan) | **Keep unchanged** — D1's fallback engine, still called by the new function below |
| 1032 | `resolveExecutorConfig` | Switch |
| 1188 | `decideCapacityDispatchMechanism` | Switch |
| 1578 | `spawnWorker` (own separate model-resolution lookup, D4's own finding) | Switch |
| 1886 | `decideCapacityCli`'s `--work` branch, `hasExplicitCapacity` | Switch |
| 1913 | `decideCapacityCli`'s main body (`capacity`/`configured`/`agentType` derivation, used by every door: positional/`--for`/`--work`) | Switch |

1. **New function, next to `resolveCapacityIdForPurpose`** (D2's own
   "chỗ cần sửa" explicitly left this as `resolveCapacityIdForPurpose`
   OR a new function — choosing new, to keep `resolveCapacityIdForPurpose`
   and its 5 existing tests byte-identical):

   ```js
   export function resolveCapacityAndOverrides(cfg, capacityIdOrPurpose) {
     const capacities = cfg?.capacities ?? {};
     if (capacities[capacityIdOrPurpose]) {
       // D1: literal key always wins, unchanged behavior
       return { capacityId: capacityIdOrPurpose, capacity: capacities[capacityIdOrPurpose], overrides: undefined, configured: true };
     }
     const preferred = cfg?.capabilities?.[capacityIdOrPurpose]?.prefer;
     if (preferred) {
       const capacity = capacities[preferred];
       if (!capacity || !Array.isArray(capacity.for) || !capacity.for.includes(capacityIdOrPurpose)) {
         throw new RunnerConfigError(
           `runner config capabilities.${capacityIdOrPurpose}.prefer names "${preferred}" but that capacity does not declare for:[...${capacityIdOrPurpose}...] itself (symmetry required, D2).`,
         );
       }
       return { capacityId: preferred, capacity, overrides: cfg.capabilities[capacityIdOrPurpose].overrides, configured: true };
     }
     const found = resolveCapacityIdForPurpose(cfg, capacityIdOrPurpose); // D1: unchanged fallback scan
     if (found) return { capacityId: found, capacity: capacities[found], overrides: undefined, configured: true };
     return { capacityId: null, capacity: undefined, overrides: undefined, configured: false };
   }
   ```

   Symmetry violation throws (`RunnerConfigError`) rather than silently
   falling through — fail-loud matches every other shape-validation gate
   already in this file (D2). `overrides` is returned, never applied here
   — merging is each call site's own job (step 3 below), since only some
   call sites (model resolution) care about `overrides` at all (`command`/
   `args`/`adapter` are never override-able, D2).

2. **`validateCapabilitiesShape` (`dispatch.mjs:787`).** Add `prefer`
   (non-empty string when present) and `overrides` (object when present,
   keys limited to exactly `rigorOverrides`/`providerModel`/`tier`/
   `model` — reject any other key; each present field re-validated with
   the SAME per-field rule a capacity's own matching field already uses,
   no new rule invented). Cross-check `prefer` actually names a real
   `cfg.capacities` id declaring the matching `for` entry **at config-load
   time**, the same place `capacity.for` entries are already cross-checked
   against the `capabilities` catalog (`dispatch.mjs:699-702`) — catches a
   typo'd `prefer` before any dispatch is attempted, not just at first
   resolve (the runtime throw in step 1 is the belt to this load-time
   braces's suspenders, for any caller that builds a `cfg` object by hand
   without going through `ensureRunnerConfigForDir`'s validation, e.g.
   tests).

3. **Switch the 5 call sites** (table above) to call
   `resolveCapacityAndOverrides` instead of their own direct lookup:
   - `resolveExecutorConfig`/`decideCapacityDispatchMechanism` — use the
     returned `capacity`; `configured`-equivalent boolean is the returned
     `configured` field.
   - `spawnWorker` — use the returned `capacity`'s `providerModel`, merged
     with `overrides?.providerModel` (overrides wins when present) and
     same for `rigorOverrides`/`overrides?.rigorOverrides`, before calling
     `modelForTier`.
   - `decideCapacityCli`'s two sites (1886, 1913) — use the returned
     `configured`/`capacity`/`agentType` in place of their own derivation.
   - `resolveExecutorConfig` additionally needs `overrides?.tier`/
     `overrides?.model` threaded to wherever it computes `model` (today
     that happens in `spawnWorker`/`executeCapacityCli`'s own callers, not
     inside `resolveExecutorConfig` itself — confirm during Implement
     whether `overrides.tier`/`overrides.model` need a second thread point
     there too, or whether `spawnWorker`'s own switch already covers every
     real caller; `executeCapacityCli` computes `model` itself before
     calling `resolveExecutorCommand`, so it needs the same merge).

4. **Migrate the live config** (D3): `.fgos/config.json` —
   - delete `runner.capacities.fgos-coding-implement` (the duplicate)
   - add `"for": ["fgos-coding-implement"]` to `runner.capacities.agy`
   - add `runner.capabilities["fgos-coding-implement"] = {"description":
     "code-implement work for the coding domain's executing stage",
     "prefer": "agy"}`
   - no `overrides` needed — `agy`'s current tuning already matches this
     purpose

5. **Prove the externally-observed behavior is unchanged** (the whole
   point — this is a config-modeling refactor, not a behavior change):
   real `decide --work <coding-item>` against the migrated live config
   must return the exact same `{mechanism, configured}` shape as before
   migration, for both `hasLiveTaskAccess:true` and `:false` (the
   `tsk-pdg` behavior this item must not regress).

No split: one honest piece — a shared resolver function, 5 call-site
switches, one config migration. `tsk-34n` proceeds as itself.

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| 5-call-site switch inside a CRITICAL-blast-radius file | Real — `resolveExecutorConfig`/`decideCapacityDispatchMechanism`/`spawnWorker` are exactly the chokepoint GitNexus flagged HIGH risk during `tsk-pdg` (impact-analysis posture: degraded — same stale-index caveat, cross-checked via the exact `rg` sweep above instead of trusting the graph alone) | Full `npm test` must stay 3459+ pass / 0 fail (same baseline `tsk-pdg` left); the exact call-site table above leaves nothing to discover mid-implement |
| Symmetry violation (typo'd `prefer`) | Low — fails loud at both load time and resolve time, never silent | New tests for both throw paths |
| `overrides` merge missed at one of the 2-3 real model-computation sites (`spawnWorker`, `executeCapacityCli`) | Real, the exact class of bug D4 found live | Step 3's own explicit note to confirm `executeCapacityCli` too, not just `spawnWorker` |
| Live config migration breaks the real `agy` dispatch `tsk-1m8` proved end-to-end | Low, purely additive/renaming — same `agy` object, `for` added, no field removed | Re-run the same live `decide --work` check `tsk-pdg`'s own evidence used, against the migrated config |

## Outstanding questions

None

## Self-review addendum (post-return, before human approval)

User asked for a deep self-review before merging. Found and fixed 3 real
bugs, all with new regression tests (full suite stayed green throughout):

1. **`executeCapacityCli`'s `--for` door silently dropped
   `capabilities.<name>.overrides`.** The original implementation called
   `resolveCapacityAndOverrides` a SECOND time on the already-resolved
   `capacityId` — for the `--for` door, that id is already a literal
   `cfg.capacities` key by then (the old `resolveCapacityIdForPurpose`
   scan ran first), so the second call always hit the literal-key branch
   and never saw `overrides` at all. Fixed by resolving ONCE, on whichever
   key the call actually gave (`purpose` or `capacityIdArg`), preserving
   each door's own pre-existing error contract (`--for` throws on
   not-found; a named `capacityIdArg` never throws, falls through to the
   global executor — both proven by existing tests).
2. **`overrides.tier`/`overrides.model` were validated as legal fields
   but never consulted anywhere** — dead config a person could set with
   zero effect, no error. Wired into `executeCapacityCli`'s own tier/model
   precedence (`tierOverride ?? capabilityOverrides?.tier ??
   capacity?.tier ?? DEFAULTS.tier`, same shape for model) — deliberately
   NOT wired into `spawnWorker`: `work.tier` is the work item's own
   classification (a scope/effort judgment made at Discovery), and a
   capability config was never meant to silently override that; this
   scope boundary already existed for a plain `capacity.tier`/
   `capacity.model` before this item and is left undisturbed, now
   documented explicitly in `resolveCapacityAndOverrides`'s own docstring
   instead of being a silent, unstated gap.
3. **The `allowCrossProvider` error message's remediation advice was
   wrong when resolved via `prefer`** — it told the caller to set
   `capacities.<purpose>.allowCrossProvider`, but a purpose name is never
   a real `capacities` key once resolved via `prefer`. Fixed to name the
   real resolved capacity id too when it differs from the requested one.

**Known, not fixed (documented, out of scope):** `resolveCapacityAndOverrides`
and the ~10 pre-existing `cfg.capacities[capacityId]`-shaped lookups
elsewhere in this file all do a plain bracket access on a plain object —
a key like `"constructor"`/`"__proto__"` would resolve through the
prototype chain to a truthy-but-nonsensical value instead of `undefined`.
This is a pre-existing characteristic of the whole file (not introduced
by this item), low real-world exploitability (`capacityId` values come
from config-driven or operator-typed CLI args, not an untrusted network
boundary), and fixing it broadly (every lookup site, not just the new
one) is a separate, unrelated hardening item if ever worth doing.

## Final cleanup round (post-return, before merge)

User asked to fully retire `capacities.<id>.capability` (singular) —
tsk-45f-era back-compat that D3's own `for`-based model made redundant —
rather than keep both fields alive indefinitely.

1. **Removed the `capacity.capability` catalog-validation block** from
   `validateRunnerConfigShape` in `src/runner/dispatch.mjs` (tsk-45f D11):
   the field is no longer read or validated at all, so a config carrying
   it now loads without error (stray key, ignored — same as any other
   unrecognized field this validator already tolerates).
2. **Removed the `capacity?.capability` fallback read** in
   `toolsFromCapacities` (`src/state/tool-registry.mjs`) — `for` is now
   the only field this function ever reads for a capacity's declared
   capability. Single confirmed real caller: `checkToolRegistryConfigured`
   in `src/setup/registrations.mjs:538` (feeds `fgos doctor`/`fgos tool
   check|query`); GitNexus returned "not found" for this symbol (stale/
   incomplete index posture, per this repo's own impact-analysis gate), so
   this was cross-checked with a real grep sweep instead of trusted blind.
3. **Found and fixed a real regression this removal exposed** (not a
   pre-existing bug — a direct consequence of D3's own migration earlier
   in this item): `toolsFromCapacities`'s only prior gate for "is this
   tool-registry-probeable" was "declares `for`" at all. D3 gave `agy`
   (`kind: "agent"`) its own `for` array (so `capabilities.<name>.prefer`
   could resolve it) — the first time an agent-kind capacity ever declared
   `for`. Without an explicit gate, `agy` started incorrectly appearing as
   a tool-registry-probeable entry once the live config picked up D3's
   migration. Fixed with an explicit `if (capacity?.kind !== 'tool')
   continue;` gate before the capability extraction. Real failing-before/
   passing-after transcript in `iron-law-evidence.md`'s "Final cleanup
   round" section.
4. **Test fixtures updated**, no test coverage lost: rewrote
   `test/state/tool-registry.test.mjs`'s `toolsFromCapacities` block
   (fixtures switched from `capability: 'X'` to `for: ['X']`; 2 obsolete
   precedence/fallback tests removed; 2 new tests added — the regression
   above, and confirming the legacy field is fully inert). Fixed the
   `declareCapacity`/`declareGitnexus` fixture helpers and all direct call
   sites in `test/cli/fgos-tool.test.mjs` and `test/setup/checks.test.mjs`
   the same way. Deleted 3 now-obsolete `capacity.capability`-catalog-
   validation tests from `test/runner/dispatch.test.mjs`, replacing them
   with one test confirming a stray `capability` field is silently
   ignored.
5. **Live `.fgos/config.json` migrated**: removed the stray `"capability"`
   field from the `gitnexus` and `herdr` capacity entries (both already
   carried the real `for` array from D3's own migration, so this is a pure
   deletion of dead config, no behavior change). Also added `"prefer":
   "gitnexus"` to the `impact-analysis` capability in the same pass (a
   separate, independent config edit the user requested directly —
   `fgos-coding-implement` already had `"prefer": "agy"`).

Full suite after this round: 3477 pass / 0 fail, 5 skipped — see
`iron-law-evidence.md` for the real red/green transcript.
