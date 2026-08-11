# tsk-5iv — plan

Mode: high-risk

**Flag count / which flags applied** (fgos-routing Mode-gate, direct-entry
fallback — no session Orient handoff existed for this item, so the gate's
own subsection was read and applied directly per fgos-coding-planning's Bootstrap
step): 2 flags — **audit/security / data-loss** (hard-gate, on its own
already forces high-risk) because D1 fixes a destructive `git reset --hard`
targeting the wrong tree; **existing covered behavior**, because every
touched function (`footprintDiffHits`, `excludeFgosPaths`,
`STORE_MISSING_WARNING_VERBS`, `isDirectoryContainingCoverage`) already has
passing test coverage this plan must not regress. No auth, authorization,
external systems, cross-platform, or multi-domain flags apply. Lane:
**high-risk** per the hard-gate rule alone, regardless of the low flag
count — a fuller map below, not a split (see Shape).

## impact-analysis capability

`impact-analysis: full` (GitNexus present, re-confirmed this session via
`fgos tool query --capability impact-analysis --status present`). Every
symbol below gets a real `impact({target, direction:"upstream"})` call
before it is edited, per `CLAUDE.md`'s Always Do rules.

## Approach

Six independent, already-diagnosed bug fixes from `CONTEXT.md` D1-D6. No
research needed — each fix's shape and location is already grounded in
real code reads (see CONTEXT.md's Scout evidence). This plan orders them
and names proof points; it does not re-derive what to do.

Rejected alternative: splitting into 6 separate child items (one per
D-ID) via `fgos add --parent`. Rejected because D1/D2/D3 all touch
`bin/fgos.mjs` — a real footprint overlap `footprintOverlapAmong` would
correctly flag between siblings, defeating the purpose of a
parallel-safe split — and because one session (this one) is doing all
six sequentially in one sitting regardless; splitting would only add
submit/discover/decompose/pick/verify/commit/return ceremony six times
over for work that is already fully scoped and already user-approved as
one batch. Pass-through: item proceeds as itself, no children.

## Files touched (footprint)

- `bin/fgos.mjs` — D1, D2, D3
- `src/intake/plan.mjs` — D5
- `test/intake/plan.test.mjs` — D6
- `.claude/skills/fgos-coding-exploring/SKILL.md` — D4
- `.agents/skills/fgos-coding-exploring/SKILL.md` — D4 (dual-root mirror, byte-identical)
- `test/skills/fgos-coding-exploring-root-fix.test.mjs` — new, asserts D4 (repo
  precedent: `test/skills/fgos-coding-compounding-doc-write-path.test.mjs` already
  reads a `SKILL.md`'s content and asserts on it — same pattern, new file)

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| D1 `main-checkout-reset` refusal (`bin/fgos.mjs` ~3842) | **High** — wrong fix silently leaves the destructive-reset-targets-wrong-tree bug live, or breaks the verb for the legitimate main-checkout case | `test/runner/main-checkout-reset-guard.test.mjs` (existing, must still pass — the guard function itself is untouched) + a new CLI-level test in `test/cli/fgos.test.mjs` asserting: (a) from a linked worktree with no `--dir`, the verb refuses before touching git; (b) from the real main checkout, or with `--dir <mainRoot>` from a worktree, it behaves exactly as before |
| D2 `excludeFgosPaths` narrowing (`bin/fgos.mjs` ~179) | **Medium** — too narrow reintroduces the noise tsk-x5r fixed; too broad keeps the policy-file blind spot | Existing `test/cli/fgos.test.mjs` tsk-x5r self-exempt test must still pass (noise still fixed) + a new test asserting a `.fgos/gate-bypass.json` change OUTSIDE the declared footprint DOES surface in `footprintDiffHits` (the blind spot closed) |
| D3 `STORE_MISSING_WARNING_VERBS` (`bin/fgos.mjs` ~4025) | **Low** — mechanical Set addition, same shape as the 3 verbs tsk-3g5 already added | New tests mirroring tsk-3g5's own pattern for `evolve` and `docs-index` (stderr warning fires from a `.fgos/`-less worktree) |
| D5 `isDirectoryContainingCoverage` (`src/intake/plan.mjs`) | **Medium** — CONTEXT.md D5 left the exact approach (tighten vs. document) to this stage; a behavior change risks new false positives on real single-file children | Decided here (see Shape): document, not tighten (see rationale below) — proof point is a code comment, not new test behavior, so risk is contained to documentation accuracy, checked by human review during Iron Law evidence write-up |
| D6 phantom test fixture (`test/intake/plan.test.mjs`) | **Low** — mechanical, the correct fixture shape is already fully specified in CONTEXT.md D6 | The fixed fixture must fail against `9174313~1` (pre-fix) source and pass against current `HEAD` — both checked by hand during implementation, same method all 4 round-3 reviewers used |
| D4 skill-doc `root=` gap (both dual-root copies) | **Low** — prose-only, no code path depends on it | New `test/skills/fgos-coding-exploring-root-fix.test.mjs` reads both files' content and asserts the `root=` assignment line appears before the `fgos add --dir "$root"` example in each |

## Order

1. **D1** first — highest risk, safety-critical, and touches `bin/fgos.mjs`
   which D2/D3 also touch (do the riskiest edit to that file first, on a
   clean base, rather than layering it on top of two other changes to the
   same file).
2. **D2** — same file, same session, sequential after D1 to avoid two
   half-finished edits to `bin/fgos.mjs` at once.
3. **D3** — same file, mechanical, last in the `bin/fgos.mjs` group.
4. **D6** — fix the phantom-test fixture next; this makes the existing
   `test/intake/plan.test.mjs` suite an honest regression guard again
   before D5 touches the function it guards.
5. **D5** — now that D6 makes the test file trustworthy, adjust/document
   `isDirectoryContainingCoverage` with real coverage watching it.
6. **D4** — independent of all code changes; last, lowest risk, no
   dependency on anything above.

(No `fgos graph --what-if` run — this item has no dependents/blockers in
the work graph, per `fgos graph --json`: it sits alone in its own
component, so no other item's unblock ordering is affected by internal
step order here.)

## Shape

**High-risk lane, no split** (see Approach for why). Concrete cases this
plan proves against, one per component:

- D1: worktree-without-`--dir` (must refuse), worktree-with-`--dir
  <mainRoot>` (must succeed exactly as before), main-checkout-cwd-no-`--dir`
  (must succeed exactly as before, since cwd IS the main worktree there).
- D2: `.fgos/events.jsonl` change bundled in an item's own commit (must
  stay exempt, existing behavior), `.fgos/gate-bypass.json` change outside
  the declared footprint (must now surface, new behavior).
- D3: `evolve`/`docs-index` called from a `.fgos/`-less linked worktree
  (must warn), called from the main checkout (must not warn — no
  regression on the common case).
- D5/D6: the decision is to **document, not tighten**
  `isDirectoryContainingCoverage`. Rationale: tightening (requiring the
  covering footprint to name the directory itself or a path at/above it)
  risks a real false positive — a legitimate child that touches exactly one
  file inside a directory-shaped decision would then incorrectly fail
  coverage, and CONTEXT.md D5 explicitly flagged this risk as the reason to
  defer the choice to this stage. Advisory-only signal (never blocks), and
  `PATH_TOKEN_PATTERN`'s 2+-segment requirement already bounds the worst
  case (a bare top-level dir can never be captured). Document the
  intentional one-file-covers-directory trade-off in a code comment next to
  `isDirectoryContainingCoverage` instead.
- D4: the `fgos-coding-exploring` example, copy-pasted as a standalone block, must
  actually run (`--dir "$root"` resolves because `root=` was assigned
  earlier in the SAME block, not just earlier in the file).

## Assumptions

- The existing `test/runner/main-checkout-reset-guard.test.mjs` and
  `src/runner/main-checkout-reset-guard.mjs` (`assertSafeMainCheckoutReset`)
  are untouched by D1 — the bug is in `bin/fgos.mjs`'s `repoRoot`
  computation feeding that function correct-vs-wrong booleans, not in the
  guard's own decision logic. Not material to CONTEXT.md (implementation
  detail); pinned here per fgos-coding-planning's own Assumptions rule.
- `STORE_MISSING_WARNING_VERBS` entries for `evolve`/`docs-index` follow the
  exact same test/warning shape tsk-3g5 already established for
  `gate-bypass`/`doc-sources`/`lock-status` — no new warning message
  wording needed. Not material; implementation detail.

## Proof surface (per-piece verify, no split so this is the item's own)

```
grep -A5 "main-checkout-reset" bin/fgos.mjs | grep -q isMainWorktree && \
grep -A20 "function excludeFgosPaths" bin/fgos.mjs | grep -q entropy-history && \
grep -A3 "STORE_MISSING_WARNING_VERBS = new Set" bin/fgos.mjs | grep -q evolve && \
grep -A3 "STORE_MISSING_WARNING_VERBS = new Set" bin/fgos.mjs | grep -q docs-index && \
test $(grep -c "root=\$(git rev-parse --path-format=absolute --git-common-dir" .claude/skills/fgos-coding-exploring/SKILL.md) -ge 3 && \
test $(grep -c "root=\$(git rev-parse --path-format=absolute --git-common-dir" .agents/skills/fgos-coding-exploring/SKILL.md) -ge 3 && \
grep -q other.mjs test/intake/plan.test.mjs && \
node --test test/cli/fgos.test.mjs test/intake/plan.test.mjs test/runner/loop.test.mjs test/runner/main-checkout-reset-guard.test.mjs test/skills/fgos-coding-exploring-root-fix.test.mjs && \
node --test 'test/**/*.test.mjs'
```

Same command CONTEXT.md's discover gate already locked (D1-D6), extended
with `test/runner/main-checkout-reset-guard.test.mjs` and the new
`test/skills/fgos-coding-exploring-root-fix.test.mjs`.

## Open questions

None — every material question was resolved in CONTEXT.md (D1-D6); the one
implementation-level choice CONTEXT.md deferred (D5's tighten-vs-document)
is decided above under Shape.
