# tsk-3xo — plan

## Mode

**standard** (3 flags counted):

- multi-domain — the bug is exactly a domain-routing gap (D1/D3 in
  CONTEXT.md).
- existing covered behavior — `discover`/`decompose` CLI verbs and
  `discovery.mjs`/`decompose.mjs`'s `moveStage` calls are exercised by the
  existing coding-domain test suite; this change must be zero-behavior for
  every one of those paths.
- weak proof around the area — 0 existing tests for the cross-domain path
  (CONTEXT.md's Scout evidence; `test/e2e/synthetic-domain.test.mjs`
  deliberately sidesteps it).

Not counted: auth/authorization/data model/audit-security/external
systems/cross-platform (none apply). Public contracts: the CLI verb's
error text technically changes shape for an *unrecognized* domain case,
but for every domain already in the registry today (`coding`,
`synthetic`) the observable behavior is byte-identical
(`stageForStep(getDomain(undefined), 'Clarify') === 'clarify'`,
re-verified in CONTEXT.md) — not counted as a public-contract break.

No hard-gate flag present, flag count is 3 → standard, not high-risk. No
single yes/no question decides feasibility → not a spike. This is a real
bug fix across 3 files with a proven pattern to copy, not a couple of
files with no gray areas → not tiny/small either.

## Approach

Replace all 7 hardcoded stage literals with
`stageForStep(getDomain(work.domain), '<Step>')`, copying the exact
pattern already proven correct at `bin/fgos.mjs:744-745` (`submitWork`).
No new parameter needed anywhere — `work.domain` (or `id`'s resolvable
work record) is already in scope at every one of the 7 sites (CONTEXT.md
pinned-terms list). Bundle in the same change: correct the stale
"silently overwritten" doc comment (D1) and add the missing regression
test.

**Alternatives rejected:**
- *Leave literals, add a domain check on top* — rejected: doesn't fix the
  actual crash, just changes where it happens; the literals are the bug,
  not a missing guard.
- *Generalize via a new abstraction (e.g. a `resolveStageLiteral` helper)*
  — rejected: `stageForStep`/`getDomain` already are that abstraction;
  wrapping them again is unneeded indirection (YAGNI) for 7 call sites
  that already share one clear pattern.
- *Split into 2 items (literals vs. doc correction)* — rejected per D1:
  same file/comment neighborhood, no extra cost to bundle, and the person
  already confirmed bundling.

**Ordering** (disjoint files per the source report §4 — no real
dependency between them, order below is for review clarity, not a
build-order requirement):

1. `src/state/workflow-stage-graphs.mjs:32-40` — doc comment correction
   (D1). Zero code-behavior risk, do first so the rest of the diff is read
   against a correct baseline.
2. `bin/fgos.mjs:955,979` — the 2 CLI-gate literals (`discover`/`decompose`
   verbs).
3. `src/intake/discovery.mjs:593-599,663-669` — the 2 `moveStage` literals.
4. `src/intake/plan.mjs:542,604,685,759` — the 4 `moveStage` literals.
5. `tsk-3w3`'s decision-log correction — a `fgos decision` call (not a code
   change), correcting the stale claim per D1.
6. New e2e test (see Proof surface below).

`fgos graph --json` was run this stage: tsk-3xo is its own connected
component (parent `tsk-3w3` has no other open children right now), so
`criticalPath`/`topUnblock` carry no ordering signal specific to this
item — noted, not omitted.

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` re-run fresh this stage → `gitnexus` present. Per
`CLAUDE.md`'s gate: **full** — `fgos-coding-implement` MUST run `impact()` on each
of the 7 call sites' enclosing functions (at minimum: the `discover` and
`decompose` CLI verb handlers in `bin/fgos.mjs`, and whichever named
functions in `discovery.mjs`/`decompose.mjs` own the 6 `moveStage` calls)
before editing, and report blast radius — not optional for this item.

## Risk map

| Component | Risk | Proof point (carried to fgos-coding-validating) |
|---|---|---|
| `bin/fgos.mjs` CLI gates (955, 979) | medium — sync CLI is the most-used entry point; a mistake here breaks `fgos discover`/`fgos plan` for every existing coding item | `impact()` on both verb handlers before editing; full existing test suite (`npm test`) green after the change, since this path is covered by existing coding-domain tests |
| `discovery.mjs`/`decompose.mjs` `moveStage` calls (6 sites) | medium — these are the actual engine transitions; `judgeDiscovery`/`judgeDecompose` outcomes depend on them succeeding | `impact()` on the enclosing functions; `npm test` green; the new e2e test (below) exercising the previously-unreachable cross-domain path |
| doc-comment + decision-log correction | low — no code path, text only | none needed beyond a read-back that the corrected text matches CONTEXT.md's Evidence section |
| new e2e test itself | medium — must actually exercise the previously-broken path, not a no-op | test fails on `HEAD~` (pre-fix) and passes post-fix — verified by running it before and after the literal-replacement commits |

## Shape

Concrete cases the new test must prove, matching the source report's own
spec (CONTEXT.md → report §3 "New test needed"):

1. A domain declaring a stage mapped to `Clarify` under a **non-coding
   literal name** (e.g. `triage` → `Clarify`) — extend the existing
   `synthetic` domain fixture, or add a second disposable domain, per
   `test/e2e/synthetic-domain.test.mjs`'s existing pattern.
2. Drive that domain's item through `fgos submit --domain X` → sync
   `fgos discover` → a runner sweep tick. Assert: no throw at any stage of
   that path.
3. Assert the item lands on that domain's own correct next stage (not
   silently on `coding`'s literal `'decompose'`).
4. In the same runner-sweep tick, include one ordinary coding-domain item
   ready to dispatch; assert it is unaffected (still dispatches normally)
   — this is the regression the report's §3 "real failure mode" describes
   (one mismatched-domain item halting the whole tick).
5. Existing coding-domain behavior: the full existing suite (`npm test`)
   must stay green — this is the "zero-behavior-change" claim's actual
   proof, not just the new domain's success path.

## Split decision

No split. This is one honest piece of work: 3 files, 7 call sites, one
proven pattern, one doc correction, one new test — all landing in a single
commit/PR per CONTEXT.md D1's "same neighborhood" reasoning. `tsk-3xo`
proceeds as itself, parented under `tsk-3w3` (CONTEXT.md D2), no children.

## Assumptions

- `work.domain` (or the equivalent field read via `listWork(dir).work[id]`)
  is reliably in scope at all 7 call sites without adding a new parameter
  — stated as fact in CONTEXT.md's Evidence, not re-derived here; if
  `fgos-coding-validating` finds a site where it is not actually in scope, that
  is a plan-invalidating finding, not a minor implementation detail.
- The `synthetic` domain fixture (or a disposable second domain) can be
  extended with a `Clarify`-mapped stage without breaking
  `test/e2e/synthetic-domain.test.mjs`'s own existing assertions — not
  verified yet; `fgos-coding-validating` should confirm before `fgos-coding-implement`
  commits to that specific fixture shape.
