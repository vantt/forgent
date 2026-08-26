# Iron Law evidence — tsk-gli

## Classification

`classifyIronLaw` on this item's final committed diff (`changedFiles`
against trunk, run from `src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/agent-roster.mjs"]}
```

`required: true` because `src/runner/agent-roster.mjs` is a matched
module under `MODULE_RULES` (`src/evolve/iron-law.mjs`) — a real match on
the files-changed axis, not a description-keyword false positive
(`matchedFlags: []`, confirming the item's own text tripped nothing).

## Confirmed against the real diff — comment-only, not a behavior change

`git diff --name-only main...fgw/tsk-gli -- . ':!.fgos'`:

```
docs/explanation/why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md
docs/history/work-state-explanation-d20-claims-sync/RESEARCH.md
docs/history/work-state-explanation-d20-claims-sync/plan.md
docs/specs/work-state.md
src/runner/agent-roster.mjs
```

The one matched module's own diff (`git show 7c192680 -- src/runner/agent-roster.mjs`):

```diff
-// fields, for D20/D22's eligibility-inversion resolution
-// (resolveAgentTypeForTaskSpec, src/runner/dispatch/cli.mjs). LAYER: infra
+// fields, for docs/history/core-foundation-domain-boundary/DISCUSSION.md's D20/D22
+// eligibility-inversion resolution (resolveAgentTypeForTaskSpec, src/runner/dispatch/cli.mjs). LAYER: infra
```

Two lines, both inside the file's own top-of-file `//` block comment —
no executable line, no function body, no export, no import changed. The
rest of this item's diff is prose in two Markdown docs
(`docs/specs/work-state.md`, `docs/explanation/why-coding-domain-...md`)
plus this feature's own `RESEARCH.md`/`plan.md`. Nothing in this commit
changes runtime behavior.

## Why no failing-test-first transcript is attached

This item's diff has no behavior to write a failing test against — a
docstring correction on a matched module, plus prose in two canonical
docs. There is no red-before-green cycle possible when the change carries
no logic. Same shape already established for a matched-module-but-
comment-only diff by `docs/history/tsk-6av/iron-law-evidence.md` (a
different item, matched on a description keyword rather than a module,
but the same underlying justification: "no code to write a failing test
against").

## Item's own verify command, run independently (not the worker's self-report alone)

```
rg -c core-foundation-domain-boundary/DISCUSSION.md docs/specs/work-state.md docs/explanation/why-coding-domain-has-a-role-holder-axis-and-task-spec-ontology.md src/runner/agent-roster.mjs && npm test
```

`rg -c` confirmed all 3 footprint files carry the DISCUSSION.md pointer
(1 hit each). `npm test`, run live from this branch after the worker's
commit landed:

```
ℹ tests 4144
ℹ suites 0
ℹ pass 4139
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 153565.167896
```

0 failures — consistent with a comment/prose-only diff touching no
executable path. The worker's own dispatch report independently claimed
the same count ("All 4,139 tests passed cleanly"); this run confirms it
first-hand rather than trusting that report alone.

## Verification source

- `src/evolve/iron-law.mjs` — `MODULE_RULES` includes `src/runner/` as a
  matched-module prefix, which is why `agent-roster.mjs` trips
  `required: true` on a files-changed match regardless of what changed
  inside the file.
- `git show 7c192680 -- src/runner/agent-roster.mjs` — the real diff,
  read directly, confirming comment-only.
- `npm test` run live on this branch (`fgw/tsk-gli`), post-worker-commit
  — `4139 pass / 0 fail / 5 skip`.
- `docs/history/tsk-6av/iron-law-evidence.md` — precedent for the
  "matched-but-no-behavior-change, no failing-test-first transcript
  applies" shape this item follows.
