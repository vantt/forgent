# judge-verdict evidence discipline — plan

Status: shaped, awaiting approval
Item: `tsk-5q5`
CONTEXT: `docs/history/judge-verdict-evidence-discipline/CONTEXT.md` (D1-D4)

## Mode

**high-risk** (5 of 10 flags apply — 4+ triggers high-risk by count alone,
independent of any single hard-gate flag):

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | **yes** | `work.acceptance`'s shape contract (`src/state/work.mjs:288-303`) gets a new conditional check |
| audit/security | no | — |
| external systems | **yes** | the semantic-correctness check (D2) is expected to add a second nested `claude -p` executor call, the same external process `judge-executor.mjs` already spawns |
| public contracts | **yes** | `work.mjs`'s `validateWork` acceptance shape is a public contract other callers (`add`/`edit --acceptance`, `src/state/store.mjs`) already depend on; changing it changes what `edit --acceptance`/`add --acceptance` accept |
| cross-platform | no | — |
| existing covered behavior | **yes** | `test/intake/discovery.test.mjs` and `test/intake/plan.test.mjs` carry ~24+ existing tests asserting today's fail-safe/pass-through shapes; both mechanisms below must not regress them |
| weak proof around the area | **yes** | this item's entire premise is "nothing proves `verify`/`acceptance` before the item is trusted" |
| multi-domain | no | both tracks sit inside the intake/state layer, not genuinely separate product domains |

A `small`/`standard` mode would not honestly cover this: two independent
write-path mechanisms, one of them a new external-process call layered onto
an already fail-safe-sensitive judge path, with an existing, sizeable test
suite that must keep passing unchanged for every case it already covers.

## Graph context (`fgos graph --json`)

`tsk-5q5` is its own component (`size: 1`) — no declared deps, nothing else
in the graph depends on it or would be unblocked by finishing it first. This
means the split below has no cross-item unblock ordering to optimize for;
the two children are sequenced by implementation dependency only, not by
`criticalPath`/`topUnblock` signal (neither carries a component of more than
`tsk-5q5` itself).

## Approach

Two independent mechanisms, matching CONTEXT.md's D1 scope split. Neither
depends on the other's code changing — they touch disjoint files — so they
are shaped as two separate child items (Split, below), not one.

### Track A — verify semantic-correctness check (D2, D4)

- **Path honored**: add a second, independent judgment pass after
  `judgeDiscovery`/`judgeDecompose`'s own model call returns `clear`/
  `decompose` with a `verify` string, before `resolveDiscovery`/
  `resolveDecompose` commit the stage move. The second pass gets the same
  `view` context (graph/impact block, description, prior verdicts) plus the
  first pass's own proposed `verify`, and is asked one question: does this
  `verify` command actually, verifiably prove *this* item's specific claim
  — not just "is this valid shell".
- **Alternative rejected**: a purely syntactic check (e.g. `bash -n` on the
  string) was explicitly ruled out by D2 — it would have caught tsk-d3c's
  first failure (`Skill(...)` not being shell) but not its second (a
  syntactically valid command naming the wrong target). Only a second
  judgment pass can plausibly catch the semantic case; a mechanical lint
  cannot.
- **Alternative rejected**: silently rejecting a disagreement and asking the
  first pass to just retry was ruled out by D4 — an unresolved disagreement
  between two model judgments is exactly the "genuinely needs a person"
  case `fgos ask`/`answer`'s existing gate contract already exists for
  (`.claude/skills/fgos-routing/SKILL.md`'s gate contract section); reusing
  `putInAwaiting` is smaller than inventing a third disagreement-handling
  path.
- **Risk map**:
  | Component | Risk | What would prove it |
  |---|---|---|
  | Adds a second `spawnSync` call per clarify/decompose resolution | medium | timing/perf: does a doubled judge-call cost meaningfully change the runner sweep's cadence? — `fgos-coding-validating` should read `runner-loop.test.mjs`'s existing timeout assumptions and/or run the sweep once with the change to observe |
  | `judgeDiscovery`'s and `judgeDecompose`'s existing fail-safe contract (never throw, fold any failure to "not clear"/`invalid`) must extend cleanly to a second-pass failure too | high | must be proven against `test/intake/discovery.test.mjs`'s and `decompose.test.mjs`'s own fail-safe test blocks — a second-pass spawn error must fold to the same "not clear"/`invalid` outcome, never a thrown error |
  | Existing tests hardcode a single-call shape (`runJudgeExecutor` called once per resolve) | medium | read `test/intake/discovery.test.mjs`/`decompose.test.mjs`'s mock/stub shape before assuming a second call slots in without rewriting test scaffolding |
- **Files likely touched**: `src/intake/discovery.mjs`, `src/intake/plan.mjs`, `src/intake/judge-executor.mjs` (if the second pass reuses the shared spawn/parse/retry helper), `test/intake/discovery.test.mjs`, `test/intake/plan.test.mjs`.
- **Concrete cases to prove**: (1) first pass says `clear:true` with a bogus `verify`, second pass disagrees → item parks in `awaiting-human`, both verdicts visible; (2) first pass says `clear:true`, second pass agrees → item advances exactly as today; (3) second pass itself fails to spawn/parse → folds to the same fail-safe outcome as a first-pass failure, never a thrown error; (4) `judgeDecompose`'s per-child `verify` gets the same second-pass treatment, a bad child `verify` invalidates only that child's normalization, not silently accepted.

### Track B — acceptance write-time evidence-traceability gate (D1, D3)

- **Path honored**: extend `validateWork`'s existing acceptance-shape check
  (`src/state/work.mjs:288-303`) with one additional, narrow condition: when
  a clause supplies both non-empty `text` *and* non-empty `evidence` in the
  same write, check that the `evidence` string is traceable — points at
  something that actually exists on disk (a real path fragment it cites) or
  matches an already-recorded decision (`view.decisions`) — before accepting
  it. A clause with `text` only (no `evidence` yet) is completely untouched,
  preserving RUL58 D4's existing "evidence added later" allowance.
- **Alternative rejected**: requiring evidence at authorship for every
  clause (the "universal" option) was explicitly rejected — it would break
  the common, already-relied-on case where `evidence` is deliberately absent
  until the item nears `done`.
- **Risk map**:
  | Component | Risk | What would prove it |
  |---|---|---|
  | What "traceable" mechanically means (file-exists check vs. decision-log cross-reference vs. both) | high | needs a proof point at `fgos-coding-validating`: read `docs/specs/work-state.md`'s exact RUL58/Data Dictionary #24 wording again against whatever check shape gets proposed, and confirm against `test/state/work.test.mjs`'s existing acceptance-shape tests that no currently-passing case starts failing |
  | `validateWork` is called from both `addWork` and `editWork` (`add`/`edit --acceptance`) | medium | confirm both call sites in `src/state/store.mjs` route through the same shape check unchanged, so the new condition applies uniformly, not just to one verb |
  | False positives — a real, well-evidenced clause getting rejected because its citation doesn't match the traceability heuristic | high | needs at least one worked example against a REAL existing item's acceptance array (e.g. `tsk-d3c`'s own, read in this item's CONTEXT.md scout evidence) proving the heuristic accepts good citations and rejects the actually-bad tsk-d3c pair |
- **Files likely touched**: `src/state/work.mjs`, `src/state/store.mjs` (only if the check needs data `validateWork` doesn't currently receive, e.g. `view.decisions` for cross-referencing), `test/state/work.test.mjs`, `test/cli/fgos.test.mjs` (add/edit --acceptance CLI-level coverage).
- **Concrete cases to prove**: (1) a clause with `text` only, no `evidence` → unaffected, passes exactly as today; (2) a clause with `text`+`evidence` where `evidence` cites a real, existing path/decision → accepted; (3) a clause with `text`+`evidence` where `evidence` is untraceable (the tsk-d3c shape) → rejected with a clear validation error naming the clause; (4) `add`/`edit --acceptance` both enforce the same rule identically.

## Split

Two children, independently workable, no dependency between them (confirmed
by the graph context above — `tsk-5q5` unblocks nothing today, so there is
no cross-item ordering signal to defer to). Both parent `tsk-5q5`.

**Write mechanism (repo-fit correction):** neither `add`, `submit`, nor
`edit` exposes a `--parent` flag anywhere in `bin/fgos.mjs` (confirmed by a
full grep across all verb cases) — `parent` is only ever set inside
`resolveDecompose`'s own `addWork` call (`src/intake/plan.mjs:380-395`),
fired by the `fgos discover` verb (or the runner's async sweep) once
`judgeDecompose`'s model verdict resolves to `decompose`. There is no
session-side CLI door to hand-write a parent-tagged child directly. This
plan therefore does not create the children itself — it documents the exact
split `judgeDecompose` should arrive at once `fgos discover` is called on
`tsk-5q5`: `buildDecomposePrompt` already feeds this plan's own content in
via `readLockedContext` (`decompose.mjs:36-50`, reading both `CONTEXT.md`
and `plan.md` under `docsRef`) and explicitly instructs the model not to
propose anything different from what's locked here (`decompose.mjs:116-118`
in the prompt text). The two child descriptions below are that locked
target, written precisely enough for the model to reproduce them; whoever
next calls `fgos discover tsk-5q5` (or the runner sweep, once it's todo) is
the actual write step.

1. **`tsk-5q5-1`** — "Add a second-pass semantic-correctness check to
   judgeDiscovery/judgeDecompose's verify, parking on disagreement"
   Verify: `node --test test/intake/discovery.test.mjs test/intake/plan.test.mjs`
2. **`tsk-5q5-2`** — "Add a narrow write-time evidence-traceability gate to
   work.acceptance for clauses supplying text+evidence together"
   Verify: `node --test test/state/work.test.mjs test/cli/fgos.test.mjs`

`tsk-5q5` itself carries no further direct work once these are written —
its own stage move (`decompose`→`executing`) is a pass-through once
children exist (per `resolveDecompose`'s existing "already-decomposed"
idempotency), same shape any other split-into-children item takes.

This plan's target split is advisory input to `judgeDecompose`, not a
guaranteed commit — every clarify/decompose transition in this system works
this way (the same is already true of `CONTEXT.md` feeding `judgeDiscovery`),
so it is not a risk unique to this plan. It is not re-litigated as a
feasibility-matrix row below for that reason; if `judgeDecompose` ever
proposes something materially different from this split, that is a
`need-human` or mismatched-verdict outcome the existing gate/ask-answer
contract already handles (`fgos-routing`'s gate contract section), not a
gap this plan needs to close.

**Post-split docsRef backfill (proof-surface fix):** `normalizeChild`
(`decompose.mjs:144-168`) and `resolveDecompose`'s `addWork` call
(`decompose.mjs:380-395`) only carry `title`/`verify`/`kind`/`risk`/`refs`/
`footprint`/`deps`/`parent`/`tier` onto a new child — no `description`, no
`docsRef`. `fgos-coding-implement`'s own Orient step only reads a `docsRef` "if
present" (`.claude/skills/fgos-coding-implement/SKILL.md:57-59`), and absent one,
treats the bare title as the whole spec. Without a fix, `tsk-5q5-1`/
`tsk-5q5-2` would be born with only their one-line titles, orphaned from
every risk-map row, file list, and concrete case in this plan. Mitigation:
immediately after `fgos discover tsk-5q5` creates the children, run
`fgos edit --id tsk-5q5-1 --docs-ref docs/history/judge-verdict-evidence-discipline/`
and the same for `tsk-5q5-2` — both children point at the same shared
`CONTEXT.md`/`plan.md` (one plan covers both tracks), so `fgos-coding-implement`'s
Orient step picks up this plan's Track A/Track B detail instead of working
from title alone. This is a real, available `edit` call (confirmed generic,
not root-only, at `bin/fgos.mjs`'s `edit` verb) — the next session handling
`tsk-5q5`'s `decompose`→`executing` edge must run it before either child is
executed.

## Leave execution alone

Both children's `verify` above is the one proof command each needs; how
Execute actually runs and re-verifies them is the existing mechanical
build/verify/return path (`fgos-coding-implement`) — this plan does not re-design
that.
