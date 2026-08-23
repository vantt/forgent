# tsk-12t — plan

## Mode gate

Flags checked: auth (no), authorization (no), data model (no),
audit/security (no — verify-quality guard, not an auth/security boundary),
external systems (no), public contracts (no — internal function, not a
CLI/API surface), cross-platform (no), **existing covered behavior (YES —
`judgeVerifySemanticCorrectness` and `resolveDiscovery`/`resolveDecompose`
already have test coverage in `test/intake/judge-executor.test.mjs` /
`test/intake/discovery.test.mjs` / `test/intake/plan.test.mjs`)**,
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
`{agrees: false, reason: "...", mechanical: true}`.

**Reality check (fgos-coding-validating, corrected from an earlier draft of this
plan):** only `resolveDiscovery` (`src/intake/discovery.mjs:653`) actually
needs a new guard clause — its `callerVerdict?.force === true` branch
(`discovery.mjs:661`) is the only existing `--force` override path this
change must narrow: when `secondPass.mechanical === true`, refuse the
override regardless of `callerVerdict?.force` (D6), instead of falling
through to that branch. `resolveDecompose`'s own `judgeVerifySemanticCorrectness`
call (`src/intake/plan.mjs:703`, per child) has **no** `--force`
override path today — reading `decompose.mjs:684-711` confirms a disputed
child's `secondPass.agrees === false` always parks the whole decompose
verdict as `need-human` unconditionally, with no force branch to guard.
D6 is therefore already satisfied there for free, with zero code change —
the choke-point placement (D1) means `resolveDecompose` automatically
inherits the mechanical, non-forceable rejection the moment
`judgeVerifySemanticCorrectness` itself returns it.

Alternatives rejected: duplicating the regex check inside each of the two
call sites (rejected — the choke-point pattern this repo already documents,
`docs/explanation/fgos-choke-point-pattern.md`, exists specifically to
avoid re-deriving the same higher-level decision at every caller of a
shared primitive); a new dedicated `judgeVerifyMechanical` sibling function
(rejected — adds a second function every future caller has to remember to
call, when the existing single choke point already covers both callers for
free).

### Risk map

| Component | Risk | Proof point (fgos-coding-validating) |
|---|---|---|
| `judgeVerifySemanticCorrectness` regex (D2) | medium — false positive on a legitimate non-`node --test` TAP verify, or false negative missing a real variant of the trap | unit test with a known-bad `node --test --test-name-pattern` verify string (must trip) AND a control TAP-consuming verify string that does NOT reference `node --test` (must NOT trip) |
| `resolveDiscovery` `--force` guard (D6) | medium — `discovery.mjs`'s existing `callerVerdict?.force === true` branch could still fall through for a mechanical-marked rejection if the new guard is misplaced | unit test asserting `--force` cannot move an item past a mechanical-marked rejection at `resolveDiscovery` specifically (`resolveDecompose` needs no equivalent test for D6 — it has no force path to guard, confirmed by reading `decompose.mjs:684-711`) |
| Short-circuit (D4) | low — a spy/mock on `runJudgeExecutor` confirms it is never invoked when the mechanical check trips | unit test asserting the LLM spawn path is not reached |

**Impact-analysis capability gate**: `full` — GitNexus present, checked
fresh via `fgos tool query --capability impact-analysis --status present`
during `fgos-coding-exploring` (see `CONTEXT.md` scout evidence). GitNexus's own
call-graph confirmed exactly 2 callers of `judgeVerifySemanticCorrectness`
(`resolveDiscovery`, `resolveDecompose`) — both risk-map rows above already
rely on that confirmed blast radius rather than a guess.

### Files touched, in order

1. `src/intake/judge-executor.mjs` — add the mechanical pre-check inside
   `judgeVerifySemanticCorrectness`, before `buildVerifyCheckPrompt`/
   `runJudgeExecutor`.
2. `src/intake/discovery.mjs` — add the mechanical-marker guard before the
   existing `callerVerdict?.force === true` branch in `resolveDiscovery`
   (`discovery.mjs:661`). `decompose.mjs` needs no change (see the
   corrected Approach section above) — `resolveDecompose` already parks any
   `secondPass` disagreement unconditionally, mechanical or not.
3. `test/intake/judge-verify-second-pass-stability.test.mjs` — **corrected
   from an earlier draft that named `test/intake/judge-executor.test.mjs`**;
   reading the repo confirms `judgeVerifySemanticCorrectness` itself has no
   direct unit tests in `judge-executor.test.mjs` at all — its own direct
   tests live in `judge-verify-second-pass-stability.test.mjs` (fake-executor
   convention, `cfgFor`/`writeCapturingExecutor` already there) and its
   `resolveDiscovery` integration tests live in the same file (`addWork`/
   `answerAwaiting`/`listWork` against a temp store, e.g. the existing
   `resolveDiscovery threads the prior dispute's ask text...` test). This
   one file already has both pieces of infrastructure this item's 3 tests
   need — no new test-support code required. The 3 named tests this item's
   own locked verify already requires:
   - `rejects known-bad node --test reporter pattern before calling the LLM`
     — unit-level, calls `judgeVerifySemanticCorrectness` directly with a
     verify string matching D2's pattern; asserts `agrees === false`.
   - `does not call the LLM judge when the mechanical pattern trips` —
     same call, but asserts the fake executor's own capture/counter file
     was never written (mirrors `writeCapturingExecutor`'s existing
     capture-file-presence idiom already used in this file).
   - `does not allow --force to bypass a mechanical pattern rejection` —
     integration-level, calls `resolveDiscovery` with a `callerVerdict`
     carrying both a D2-matching `verify` and `force: true`; asserts the
     outcome is still `verify-disputed`, never `clear`.

No split: one cohesive change to one shared function plus its one call site
that actually needs a change. Not big enough, and not gray enough, to
justify separate child items (mode: small, per the gate above) — smaller
than the original draft even at "small," since reality-checking removed a
whole file (`decompose.mjs`) from scope.

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
  or acceptance, so no `fgos-coding-exploring` hand-back needed for it.
- The exact regex for D2 (`/\^#\s*(pass|fail)\b/`-shaped, gated on
  `node --test`/`--test-name-pattern` co-occurrence) is likewise an
  implementation detail already scoped by `CONTEXT.md`'s own pinned term
  ("known-bad-pattern trap (this item's scope)").
