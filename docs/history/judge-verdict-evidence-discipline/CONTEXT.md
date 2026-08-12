# judge-verdict evidence discipline — CONTEXT

## Feature boundary

`tsk-5q5`. Today, two separate writers can let a wrong claim ride into an
item's record unchallenged, both surfaced by `tsk-d3c`'s own history:

1. **`judgeDiscovery`/`judgeDecompose` (`src/intake/discovery.mjs`,
   `src/intake/plan.mjs`)** — the engine's model-backed judges that
   move an item `clarify`→`decompose` (and `decompose`→`executing` for
   children) trust the model's proposed `verify` string once it is a
   non-empty string. Nothing checks it is real, runnable shell, and
   nothing checks it actually tests the thing the item is about.
   Confirmed failure: `tsk-d3c`'s stage move auto-set `verify` to the
   literal string `Skill("fgOS:ready") loads without 'Unknown skill'
   error` — not valid shell syntax at all (`fgos return` runs `verify`
   via a shell command) — and it named an already-working plugin skill
   instead of the actually-broken dotdir skills, so it would have passed
   regardless of whether the real bug was fixed.
2. **Session-authored `acceptance` clauses (`work.acceptance`, written via
   `fgos add`/`edit --acceptance`, `src/state/work.mjs:288`)** — no judge
   function generates or touches this field at all; whichever session is
   drafting it (during `fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-implement`)
   writes it by hand. Confirmed failure: `tsk-d3c`'s own `acceptance`
   array asserted a root cause ("needs-plugin-registration") *and* an
   evidence citation for it at the same time, both wrong — later
   disproven and corrected (see `docs/history/fgos-skill-discovery-gap/
   CONTEXT.md` D2/D3). It also undercounted the affected skill set at 8
   when the real directory held 9 (missed `fgos-unlock`).

This item locks what's in scope and how a caught disagreement should
behave; it hands the actual fix shape (where the second-pass check lives,
what "traceable evidence" means mechanically) to `fgos-coding-planning`.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Scope covers **both** failure modes above: judgeDiscovery/judgeDecompose's `verify` generation (a real code path in `discovery.mjs`/`decompose.mjs`) AND session-authored `acceptance`-clause drift (no machine generation exists today — this half is a discipline/gate addition on top of the existing hand-authored write path, not a fix to an existing judge). |
| D2 | The `verify` validity check must attempt **semantic correctness**, not just syntactic/executability validity — i.e. it must try to catch "names the wrong target" (tsk-d3c's actual second failure), not only "is not valid shell at all" (tsk-d3c's first failure). This is expected to need a second, independent judgment pass — `fgos-coding-planning` decides the mechanism. |
| D3 | The `acceptance` write-time gate is **narrow**: it only triggers when a clause supplies `text` *and* `evidence` together in the same write, and checks that the evidence citation is real/traceable (points at something that actually exists/checks out) — never a blanket "evidence required at authorship" rule. This deliberately preserves RUL58 D4's existing allowance that a forward-looking clause may have `text` with no `evidence` yet, evidence added later before `done` (`docs/specs/work-state.md:64`, `:1018`). Reversing that existing allowance was explicitly rejected. |
| D4 | When the second-pass semantic check disagrees with judgeDiscovery/judgeDecompose's own clear verdict, the item parks in `awaiting-human` via the existing `putInAwaiting` fail-safe door (the same one an unclear verdict already uses), surfacing both verdicts to the person — it never silently overrides one judgment with the other, and never auto-retries as the primary response to a disagreement. |

## Pinned terms

- **Verify-generation failure** — `judgeDiscovery`/`judgeDecompose` accepting a model-proposed `verify` string with no executability or target-correctness check before it rides into the item's record and the item advances stage.
- **Acceptance-clause drift** — a session hand-authoring `work.acceptance` (via `add`/`edit --acceptance`) with a `text`+`evidence` pair that is wrong at the moment both are written, not caught before the item advances.
- **Fact+evidence-together clause** — an `acceptance` clause where `text` and `evidence` are both non-empty in the same write call, as opposed to a forward-looking clause with `text` only (evidence deferred to later, RUL58's existing allowance).

## Scout evidence

- `src/intake/discovery.mjs:168-209` (`judgeDiscovery`) — `verdict.verify` accepted whenever `typeof verdict.verify === 'string' && verdict.verify.trim()` (line 199-201); no shell-validity or target-correctness check anywhere in the function or its caller.
- `src/intake/discovery.mjs:257-265` (`resolveDiscovery`) — a `clear:true` verdict moves the item straight to `decompose` via `moveStage`, `verify` embedded as-is, no gate between judge output and stage move.
- `src/intake/plan.mjs:144-168` (`normalizeChild`) — same shape for a decomposed child's `verify`: only checked non-empty, never validity-checked.
- `src/intake/judge-executor.mjs:45-59` (`parseVerdict`) — the shared executor only validates that stdout parses to a plain object; field-level (`clear`/`verify`) validation is explicitly left to each caller, and neither caller adds a validity check beyond non-empty-string.
- `src/state/work.mjs:288-303` (`validateWork`'s acceptance-shape check) — validates `acceptance` is an array of `{text, evidence?}` objects with non-empty `text`; never checks whether a supplied `evidence` string is actually true or traceable to anything real.
- `docs/specs/work-state.md:64`, `:1018` (RUL58, Data Dictionary #24) — `evidence` is optional at creation, explicitly filled in later before `done`; RUL58's own gate only fires at the `done` transition, never at authorship.
- `docs/history/fgos-skill-discovery-gap/CONTEXT.md` (tsk-d3c's own decision record) — D2/D3 document the original wrong hypothesis and its correction; the item's real `acceptance` array (read via `fgos list --id tsk-d3c --json`) shows `text`+`evidence` both present and both wrong in the first two clauses, later effectively superseded by the third.
- `.claude/skills/fgos-coding-validating/SKILL.md:26-30`, `:85-91` — the existing "no plausibility language, concrete citation only" discipline this item's D2 asks `verify`-checking to match, and this item's D1/D3 ask `acceptance`-authorship to match too.

## Deferred / out of scope

- The actual mechanism for the semantic-correctness check (D2) — a second model call's prompt shape, what context it gets, how it's wired into `resolveDiscovery`/`resolveDecompose` — is left to `fgos-coding-planning`.
- The actual mechanism for checking an evidence citation is "real/traceable" (D3) — e.g. does it require the cited path/decision-ID to exist on disk, does it re-run a cited command — is left to `fgos-coding-planning`.
- Whether this pattern should eventually extend to `judgeDecompose`'s own top-level `reason` field or other model-proposed prose is explicitly not decided here — this item's evidence is about `verify` and `acceptance` only.

## Canonical references

- `src/intake/discovery.mjs`
- `src/intake/plan.mjs`
- `src/intake/judge-executor.mjs`
- `src/state/work.mjs`
- `docs/specs/work-state.md` (RUL58, Data Dictionary #24)
- `.claude/skills/fgos-coding-validating/SKILL.md`
- `docs/history/fgos-skill-discovery-gap/CONTEXT.md` (tsk-d3c)
