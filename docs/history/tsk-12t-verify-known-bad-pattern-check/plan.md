# tsk-12t — plan

## Mode gate

Flags checked: auth (no), authorization (no), data model (no),
audit/security (no — verify-quality guard, not an auth/security boundary),
external systems (no), public contracts (no — internal function, not a
CLI/API surface), cross-platform (no), **existing covered behavior (YES —
`judgeVerifySemanticCorrectness` and `resolveDiscovery`/`resolveDecompose`
already have test coverage in `test/intake/judge-executor.test.mjs` /
`test/intake/discovery.test.mjs` / `test/intake/decompose.test.mjs`)**,
weak proof around the area (no — this item strengthens proof, doesn't rely
on weak proof), multi-domain (no).

**1 flag → mode: small.** A few files touched (one shared function plus two
call sites plus tests), no gray areas left — every open question was
already locked in `CONTEXT.md` (D1-D6).

## Approach

Add the mechanical known-bad-pattern check as the first thing
`judgeVerifySemanticCorrectness` (`src/intake/judge-executor.mjs:347`)
does, before it builds the prompt or spawns the LLM (D1, D4). On a match it
returns the same `{agrees: false, reason}` shape the function already
returns for an LLM disagreement, but with a mechanical marker (D3) — e.g.
`{agrees: false, reason: "...", mechanical: true}` — so `resolveDiscovery`
(`src/intake/discovery.mjs:653`) and `resolveDecompose`
(`src/intake/decompose.mjs:703`) can each add one guard clause: when
`secondPass.mechanical === true`, refuse `--force` regardless of
`callerVerdict?.force` (D6), instead of falling through to their existing
force-override branch.

Alternatives rejected: duplicating the regex check inside each of the two
call sites (rejected — the choke-point pattern this repo already documents,
`docs/explanation/fgos-choke-point-pattern.md`, exists specifically to
avoid re-deriving the same higher-level decision at every caller of a
shared primitive); a new dedicated `judgeVerifyMechanical` sibling function
(rejected — adds a second function every future caller has to remember to
call, when the existing single choke point already covers both callers for
free).

### Risk map

| Component | Risk | Proof point (fgos-validating) |
|---|---|---|
| `judgeVerifySemanticCorrectness` regex (D2) | medium — false positive on a legitimate non-`node --test` TAP verify, or false negative missing a real variant of the trap | unit test with a known-bad `node --test --test-name-pattern` verify string (must trip) AND a control TAP-consuming verify string that does NOT reference `node --test` (must NOT trip) |
| `resolveDiscovery`/`resolveDecompose` `--force` guard (D6) | medium — the two call sites drift out of sync (one honors the mechanical marker, the other forgets) | unit test per call site asserting `--force`/`child.force` cannot move an item/child past a mechanical-marked rejection |
| Short-circuit (D4) | low — a spy/mock on `runJudgeExecutor` confirms it is never invoked when the mechanical check trips | unit test asserting the LLM spawn path is not reached |

**Impact-analysis capability gate**: `full` — GitNexus present, checked
fresh via `fgos tool query --capability impact-analysis --status present`
during `fgos-exploring` (see `CONTEXT.md` scout evidence). GitNexus's own
call-graph confirmed exactly 2 callers of `judgeVerifySemanticCorrectness`
(`resolveDiscovery`, `resolveDecompose`) — both risk-map rows above already
rely on that confirmed blast radius rather than a guess.

### Files touched, in order

1. `src/intake/judge-executor.mjs` — add the mechanical pre-check inside
   `judgeVerifySemanticCorrectness`, before `buildVerifyCheckPrompt`/
   `runJudgeExecutor`.
2. `src/intake/discovery.mjs` — add the mechanical-marker guard before the
   existing `callerVerdict?.force === true` branch in `resolveDiscovery`.
3. `src/intake/decompose.mjs` — the same guard at `resolveDecompose`'s own
   `judgeVerifySemanticCorrectness` call site (line 703).
4. `test/intake/judge-executor.test.mjs` — the 3 named tests this item's
   own locked verify already requires:
   - `rejects known-bad node --test reporter pattern before calling the LLM`
   - `does not call the LLM judge when the mechanical pattern trips`
   - `does not allow --force to bypass a mechanical pattern rejection`
     (this third one belongs at the call-site level — `discovery.test.mjs`/
     `decompose.test.mjs` — if `judge-executor.test.mjs` cannot exercise
     `--force` handling in isolation; whichever file it lands in, the test
     description string must stay byte-identical to what the locked verify
     already greps for).

No split: one cohesive change to one shared function plus its two existing
callers. Not big enough, and not gray enough, to justify separate child
items (mode: small, per the gate above).

## Shape

- **Boundary input**: a verify string that matches the reporter-format
  regex but does NOT reference `node --test`/`--test-name-pattern` (D2) —
  must NOT trip the mechanical check; stays the LLM's job.
- **Existing behavior that must not regress**: an LLM disagreement
  unrelated to this pattern (e.g. today's coverage/content objections) must
  still go through the existing `--force`-able path unchanged — the new
  guard only narrows `--force` for the mechanical-marked case, never for
  every disagreement.
- **No concurrent-access or partial-failure cases apply** — this is a pure
  synchronous string check with no I/O beyond the existing test-runner
  spawn already covered by the existing fail-safe (`judgeVerifySemanticCorrectness`'s
  own `try/catch`, unchanged).

## Assumptions

- The exact field name for D3's mechanical marker (`mechanical: true` vs. a
  reason-string prefix) is an implementation detail `CONTEXT.md` correctly
  left open (D3's own "Outstanding questions" note) — not material to scope
  or acceptance, so no `fgos-exploring` hand-back needed for it.
- The exact regex for D2 (`/\^#\s*(pass|fail)\b/`-shaped, gated on
  `node --test`/`--test-name-pattern` co-occurrence) is likewise an
  implementation detail already scoped by `CONTEXT.md`'s own pinned term
  ("known-bad-pattern trap (this item's scope)").
