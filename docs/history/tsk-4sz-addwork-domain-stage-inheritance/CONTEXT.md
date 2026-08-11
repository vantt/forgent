# addwork-domain-stage-inheritance — locked decisions

Item: `tsk-4sz`. Bug found while working the domain-only gap (`tsk-3w3`
Finding 4): `decompose.mjs`'s child `addWork` and `loop.mjs`'s
discovered-from `addWork` both hardcode a literal stage and never pass the
parent's `domain`, so children of a non-`coding` domain land with the
wrong domain AND a stage literal that may not even exist in that domain's
own stage graph.

## Feature boundary

Fix exactly the two `addWork(dir, {...})` call sites that create a new
work item on behalf of an existing one and silently drop that existing
item's `domain`:

- `src/intake/plan.mjs:744-757` — child items created from a
  `verdict.kind === 'decompose'` split.
- `src/runner/loop.mjs:593-606` — discovered-from items the runner creates
  from a worker's own discovery report.

Both are inheritance bugs of the same shape: a NEW item is derived from an
EXISTING item's context but doesn't carry that context's `domain` forward,
and separately hardcodes a stage literal (`'executing'` / `'clarify'`)
instead of resolving it through the domain-aware `stageForStep` helper
that already exists for exactly this purpose (`tsk-3xo`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is exactly these two call sites — confirmed exhaustive: `rg -n "addWork\(dir" src` returns only the `addWork` definition (`store.mjs:140`) plus these two call sites. No third call site shares this bug. |
| D2 | Both call sites gain `domain: <parent's own domain field>` (`work.domain` in `decompose.mjs`, `item.domain` in `loop.mjs`) and swap their hardcoded stage literal for `stageForStep(getDomain(<that domain>), '<Execute\|Clarify>')`, reusing the exact substitution pattern already proven at `decompose.mjs:761` and `discovery.mjs:596-597,707-708` (`tsk-3xo`). Zero behavior change for `domain: coding` items — `stageForStep` resolves to the same literal string when the domain is `coding` or absent. |
| D3 | Test coverage must exercise a REAL decompose-split verdict (not the existing pass-through fixture) for a non-`coding` domain, asserting the produced children carry both the correct `domain` and the correct (non-`executing`) stage — and equivalent coverage for `loop.mjs`'s discovered-from path. Exact test file(s)/fixture reuse is `fgos-coding-planning`'s call. Locked at `discover` (after 3 rounds of second-pass verify dispute, `view.discovery["tsk-4sz"]`): the item's `verify` must name BOTH new test cases explicitly via `--test-name-pattern`, and assert `pass >= 2`, so a fix that only covers one of the two call sites cannot pass silently — a single "existing file runs green" command was rejected twice for proving nothing new. Locked test names: `"domain-aware decompose child addWork inherits parent domain+stage"` (call site 1) and `"domain-aware discovered-from addWork inherits parent domain+stage"` (call site 2). **Verify command corrected during `fgos-coding-implement`** (`fgos return`'s real disposable-worktree spawn caught it, `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`): the pattern locked here originally matched Node's old TAP `# pass N` summary line and an over-narrow `[2-9]` single-digit sanity check; this repo's actual Node version (v24.18.0) prints `ℹ pass N`, and `[2-9]` fails on any two-digit+ count (e.g. the real run's `12`). Corrected to parse `ℹ pass N`/`ℹ fail N` with plain `-ge`/`-eq` numeric checks, no digit-class sanity check — see `fgos list --id tsk-4sz --json`'s `data.work['tsk-4sz'].verify` for the exact string in effect. |

## Scout evidence cited

- `src/intake/plan.mjs:521` — `const domain = getDomain(work.domain);` already resolved in scope at the child-`addWork` call site; only needs threading through.
- `src/intake/plan.mjs:744-757` — child `addWork` call: `stage: 'executing'` literal, no `domain` key.
- `src/intake/plan.mjs:761` — sibling `moveStage` call in the SAME function already uses `stageForStep(domain, 'Execute')` — the fix pattern is proven one line below the bug.
- `src/runner/loop.mjs:68` — `stageForStep`/`getDomain` already imported in this file (`from '../state/workflow-stage-graphs.mjs'`); no new import needed.
- `src/runner/loop.mjs:593-606` — discovered-from `addWork` call: `stage: 'clarify'` literal, no `domain` key.
- `src/intake/discovery.mjs:596-597,707-708` — the same `stageForStep(getDomain(work.domain), 'Divide'/'Clarify')` substitution already applied to `moveStage` calls elsewhere in the intake layer (`tsk-3xo`).
- `rg -n "addWork\(dir" src` — exactly 3 matches (`store.mjs` definition + the 2 call sites above), confirming D1's scope is exhaustive.
- `fgos tool query --capability impact-analysis --status present` — GitNexus registered and `present`, freshly checked (`impact-analysis: full` per `CLAUDE.md`'s gate). `impact()` must be run on `decompose.mjs`'s child-creation logic and `loop.mjs`'s discovery-capture logic before either is edited, per the repo's own Always-Do rule.

## Pinned assumptions (implementer-level, deferred to `fgos-coding-planning`)

- Exact test file(s) to extend vs. add new (`test/e2e/domain-aware-stage-literals.test.mjs`'s existing pass-through case, `test/e2e/fixture-marketing-domain.test.mjs`, or a new fixture) — D3 only fixes the required assertion shape, not the file layout.
- Whether the `domain` key should be omitted entirely when the parent's own `work.domain`/`item.domain` is `undefined` (matching `addWork`'s existing `??`-based tolerance elsewhere) rather than passed through as an explicit `undefined` value — a JS/API-shape detail with no behavioral difference, left to whoever writes the diff.

## Deferred to planning

None beyond the two pinned assumptions above.

## Outstanding questions

None — the item's own description already located both call sites with
line numbers, cited the existing proven fix pattern, and proposed the test
shape; scout confirmed all of it accurate against current `HEAD` and
confirmed the two-call-site scope is exhaustive. No product-level decision
needed a person's input beyond the gate approval below.
