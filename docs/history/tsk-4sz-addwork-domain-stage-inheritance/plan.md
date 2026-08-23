# addwork-domain-stage-inheritance — plan

Item: `tsk-4sz`. Decisions: `docs/history/tsk-4sz-addwork-domain-stage-inheritance/CONTEXT.md` (D1-D3).

## Mode gate

Flags counted (of: auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing covered
behavior, weak proof around the area, multi-domain):

- **existing covered behavior** — yes. `loop.mjs`'s `captureDiscoveredWork`
  sits in the runner's core dispatch chain (see risk map below); a
  regression here breaks live coding-domain runner sweeps, not just the
  new multi-domain path.
- **weak proof around the area** — yes. `CONTEXT.md`'s own record shows
  the item's first three proposed `verify` commands were disputed by
  `fgos discover`'s second-pass judge for proving nothing beyond "some
  file runs green" — the area genuinely lacked a real proof shape before
  this item locked one.
- **multi-domain** — yes. The bug only manifests for a domain whose
  Execute/Clarify-mapped stage name differs from `coding`'s literals
  (e.g. `triage`).

3 flags, no hard-gate flag (no auth/data-loss/audit-security/external-
provider/removed-validation) → **standard** mode. Matches the item's own
`tier: standard` classification.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` (run
during `fgos-coding-exploring`): GitNexus registered and `present` →
`impact-analysis: full` per `CLAUDE.md`'s gate — `impact()` run on both
target symbols before naming proof points below.

**One result was suspicious and cross-checked per the gate's own
instruction**, and turned out wrong: `impact({target: "resolveDecompose",
direction: "upstream"})` returned `risk: LOW, direct: 0` (no callers
found). `rg -n "resolveDecompose\(" src` shows a real caller at
`src/runner/loop.mjs:997` (`resolveDecompose(dir, item.id, config,
'runner')`, inside the runner's decompose-dispatch path) — the graph
missed this edge. Treat `decompose.mjs`'s actual risk as NOT low; it is
reached from the same runner subsystem as the second target below, not an
orphaned entry point.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `src/intake/plan.mjs:744-757` (child `addWork`) | Medium (corrected from GitNexus's under-reported LOW — real caller `loop.mjs:997` `resolveDecompose`, itself inside the runner's decompose-dispatch path). Change is additive (one new key + one literal swap) and reuses the exact `stageForStep` substitution already live one line below at `decompose.mjs:761` — same function, same `domain` variable already in scope. | New test: `"domain-aware decompose child addWork inherits parent domain+stage"` — a real `verdict.kind:'decompose'` split for the `triage` fixture domain, asserting children carry `domain: 'triage'` and the `triage` domain's own Execute-mapped stage (not `'executing'`). Full existing suite must stay green (coding-domain children unaffected — `stageForStep(getDomain(undefined), 'Execute')` resolves to the same `'executing'` literal). |
| `src/runner/loop.mjs:593-606` (discovered-from `addWork`, inside `captureDiscoveredWork`) | High per `impact()`: upstream chain `dispatchClaimedItem` → `claimAndDispatch` → `runOnce`, the runner's core per-tick dispatch loop (`impactedCount: 3`, `processes_affected: 3`, confidence 0.85 at every hop). Same additive-diff mitigation as above — `stageForStep`/`getDomain` already imported in this file (`loop.mjs:68`), no new import, no signature change. | New test: `"domain-aware discovered-from addWork inherits parent domain+stage"` — a runner-sweep-level assertion (same shape as the existing `test/e2e/domain-aware-stage-literals.test.mjs:209` runner-sweep test) that a discovered-from item captured while dispatching a non-`coding`-domain item carries that domain and its own Clarify-mapped stage. Full existing suite green, with particular attention to `test/e2e/domain-aware-stage-literals.test.mjs`'s existing runner-sweep test (line 209) and any `loop.mjs`/`captureDiscoveredWork` unit coverage — this is the HIGH-blast-radius edit. |

Both proof points are carried to `fgos-coding-validating` per this skill's own
rule (a medium/high risk-map entry needs a proof point there, not a guess
here).

## Approach

Reuse the `tsk-3xo` substitution pattern already proven in both target
files (`decompose.mjs:761`, `discovery.mjs:596-597,707-708`) rather than
inventing a new mechanism — this was the only approach considered; the
alternative (a store-layer default, e.g. `addWork` itself inferring
`domain` from `parent`) was rejected because `CONTEXT.md` D1 already
confirmed via `rg` that exactly two call sites need this, a store-layer
default would be a broader, unrequested change (YAGNI), and it would hide
the bug's actual shape (a caller failing to thread context it already
has) behind an implicit fallback instead of fixing the caller.

Files touched, in order:

1. `src/intake/plan.mjs:744-757` — add `domain: work.domain` and
   change `stage: 'executing'` to `stage: stageForStep(domain, 'Execute')`
   (the `domain` local is already resolved at line 521; `stageForStep` is
   already imported at line 29). Zero new imports.
2. `src/runner/loop.mjs:593-606` — add `domain: item.domain` and change
   `stage: 'clarify'` to `stage: stageForStep(getDomain(item.domain),
   'Clarify')` (`getDomain`/`stageForStep` already imported at line 68).
   Zero new imports.
3. `test/e2e/domain-aware-stage-literals.test.mjs` — add the two named
   test cases from the risk map above (exact names locked in `CONTEXT.md`
   D3, required verbatim by the item's own `verify`).

`fgos graph --json`'s `criticalPath`/`topUnblock` do not surface `tsk-4sz`
(it has no `deps` and nothing currently depends on it) — no ordering
signal from the graph beyond "this item is not currently blocking
anything," consistent with treating it as one self-contained piece.

## Split decision

No split. Both edits are the same bug shape, share one root cause, one
locked fix pattern, and one coherent test addition — `CONTEXT.md` D1
already confirmed the two-call-site scope is exhaustive and D3 already
locks the exact proof shape for both in one `verify`. Splitting into two
child items would duplicate the same "thread the domain through, swap the
stage literal" review for no independent value; `fgos graph --what-if` was
not run since there is no second candidate ordering to compare.

## Concrete cases to prove (standard-mode depth)

- Boundary: a `coding`-domain child/discovered-from item — must produce the
  exact same `stage` value as before the fix (`stageForStep` resolves
  identically for `coding`/absent domain — zero regression).
- The bug case: a `triage`-domain (or other non-`coding`-domain) child/
  discovered-from item — must carry the parent's `domain` and that
  domain's own Execute/Clarify-mapped stage, not a `coding` literal.
- Existing behavior that must not regress: every other `test/e2e/
  domain-aware-stage-literals.test.mjs` and `test/e2e/
  fixture-marketing-domain.test.mjs` assertion, plus the full suite (both
  edits sit in HIGH/medium-blast-radius runner code per the risk map).

## Assumptions

- Test additions land in `test/e2e/domain-aware-stage-literals.test.mjs`
  (extending the file already covering this exact concern) rather than a
  new file — not material to scope/behavior, `CONTEXT.md`'s own pinned
  assumption already left this to whoever writes the diff; naming it here
  only for `plan.md`'s own file-touch list above.
