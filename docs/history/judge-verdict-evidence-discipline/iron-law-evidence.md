# Iron Law evidence — tsk-5q5

## Classification

`{"required":true,"matchedFlags":["auth"],"matchedModules":["src/state/store.mjs"]}`
(`classifyIronLaw`, `src/evolve/iron-law.mjs`).

`src/state/store.mjs` is a real match on `MODULE_RULES` (an `equals` rule),
and `tsk-5q5-2`'s implementation genuinely changes it (`addWork`/`editWork`
now call `checkAcceptanceEvidenceTraceable` before accepting a work item).
No false positive on the module side.

`matchedFlags: ["auth"]` is a false positive from `HEAVY_KEYWORDS`'
case-insensitive substring match: the item's description contains the word
"human-authored", which contains the substring "auth" — nothing about
authentication/authorization is in scope here. Left as a documented
non-issue per this classifier's own known-limitation stance (over-flagging
is the safe direction); it changes nothing about `required`, which is
already `true` from the real module match above.

## Scope of this evidence

`tsk-5q5` decomposed into two independently-implemented children,
`tsk-5q5-1` (verify semantic-correctness check, touching
`src/intake/discovery.mjs`/`decompose.mjs`/`judge-executor.mjs` — none of
which are on `MODULE_RULES`) and `tsk-5q5-2` (acceptance evidence-
traceability gate, touching `src/state/store.mjs`/`work.mjs` —
`store.mjs` IS on `MODULE_RULES`). Neither child wrote its own Iron Law
evidence file; `tsk-5q5`'s own stage move to `executing` is the
pass-through this plan documented once both children landed
(`plan.md`'s "Split" section), and this is the point in the lifecycle
where `fgos-coding-implement`'s own Iron Law step runs against the parent's full
changed-file set. This evidence therefore covers Track B (the only track
that actually touches a self-modifying-capable module) — Track A's diff
has no module-rule match and needed no failing-test-first proof beyond
its own child-level test suite (already green, see `test/intake/
discovery.test.mjs`/`decompose.test.mjs` in the item-scoped verify below).

## RED — Track B's tests against pre-fix `store.mjs`/`work.mjs`

Pre-fix `src/state/store.mjs` and `src/state/work.mjs` restored from
`git show 2063097^:<path>` (the parent of `tsk-5q5-2`'s own single
implementation commit), with post-fix `test/state/work.test.mjs` and
`test/cli/fgos.test.mjs` left in place (both are additive-only for this
track, no existing test needed changing):

```
$ node --test test/state/work.test.mjs
file:///.../test/state/work.test.mjs:10
  checkAcceptanceEvidenceTraceable,
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/state/work.mjs' does not
provide an export named 'checkAcceptanceEvidenceTraceable'
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

```
$ node --test test/state/work.test.mjs test/cli/fgos.test.mjs
ℹ tests 444
ℹ pass 441
ℹ fail 3
```

The 3 CLI failures are exactly the new evidence-traceability tests, e.g.:

```
✖ add --acceptance is refused when a clause supplies text+evidence
  together but evidence cites no real path
  AssertionError: Expected values to be strictly equal: 0 !== 4
✖ edit --acceptance is refused when a clause supplies text+evidence
  together but evidence cites no real path
  AssertionError: Expected values to be strictly equal: 0 !== 4
```

(exit code `0` instead of the expected `4` — pre-fix `add`/`edit` accept
the untraceable-evidence clause silently, exactly the tsk-d3c failure
shape this item backstops.) `test/state/work.test.mjs` fails to even load
(the pre-fix `work.mjs` exports no `checkAcceptanceEvidenceTraceable` at
all), confirming the function itself, not just its call sites, is new.

## GREEN — same files restored to post-fix (`git checkout HEAD --`)

```
$ git checkout HEAD -- src/state/store.mjs src/state/work.mjs
$ node --test test/state/work.test.mjs test/cli/fgos.test.mjs
ℹ tests 529
ℹ pass 529
ℹ fail 0
```

## Item-scoped verify (tsk-5q5's own recorded `verify`, both tracks)

```
$ node --test test/intake/discovery.test.mjs test/intake/plan.test.mjs test/state/work.test.mjs test/cli/fgos.test.mjs
ℹ tests 616
ℹ pass 616
ℹ fail 0
```

Working tree confirmed clean of the temporary RED-phase file swaps (aside
from the pre-existing, untouched `.fgos/*` deletions every session in this
worktree sees, per ADR0020) — restored via `git checkout HEAD --` before
this evidence was written, not left in place.

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming `src/state/store.mjs` is self-modifying-capable and triggers
  `required: true` on a real files-changed match; `HEAVY_KEYWORDS`
  (`src/intake/risk-keywords.mjs`) confirming `auth` is a plain substring
  keyword, explaining the `matchedFlags` false positive.
- The RED/GREEN transcripts above — real command runs against real file
  contents swapped in/out on disk (`git show 2063097^:<path>` extraction,
  `git checkout HEAD --` restore), not paraphrased or fabricated.
- `docs/history/judge-verdict-evidence-discipline/CONTEXT.md` (D1, D3) and
  `plan.md` (Track B, Split) — the decisions and shape this evidence
  satisfies.
