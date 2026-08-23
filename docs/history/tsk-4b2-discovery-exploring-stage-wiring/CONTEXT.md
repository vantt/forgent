# CONTEXT: wire the `discovery`/`exploring` stages into the real flow

Item: `tsk-4b2`. Feature boundary: make `discovery`/`exploring` genuinely
reachable stages — driven identically whether an interactive session or a
headless launcher is holding the item — instead of dead schema with a
direct `clarify -> decompose` bypass. Not a rename, not a retirement: this
locks the "wire it up" direction chosen over "retire the dead stages"
(the other option originally on the table).

## Locked decisions

**D1 — Root cause confirmed exactly as the item's own description states,
by reading the real code, not assumed.** `src/state/workflow-stage-
graphs.mjs`'s `coding.stepMap` (:73-77) deliberately has no entry for
`discovery`/`exploring` (only `clarify`/`decompose`/`executing`) — so
`stageForStep` can never resolve them. `src/intake/discovery.mjs:181-186`'s
clear-verdict handler moves `clarify -> stageForStep(...,'Divide')`
(i.e. straight to `decompose`), a **deliberate** retarget (its own
comment cites "stage-decompose D2") made when `tsk-1x3` retired the old
judge-based discovery mechanism as Native-First waste. The only mover
addressing `discovery`/`exploring` by literal stage name
(`src/runner/loop.mjs:1105`) requires an item already AT `discovery` — a
state nothing produces. This is not a bug in the sense of an oversight;
it is two real, once-independently-correct design decisions
(`tsk-1x3`'s retarget, `tsk-5mj`'s later discovery-dispatch build-out)
that were never reconciled with each other.

**D2 — Governing law for HOW the fix must be shaped: `0026`/`0028`/`0029`
(Native-First Dispatch Doctrine) + `0030` (Release con người, priority
tier #2).** Two binding constraints from these, cited directly rather than
re-derived:

- *Driver/launcher parity (`0026`/`0028`/`0029`).* `fgos-coding-driving`
  (an interactive session driving an item — the **driver** role, T1,
  "ở lại") and `fgos-runner`'s background sweep (the **launcher** role,
  T1, "buông") must resolve `discovery`/`exploring` through the *same*
  stage→skill mapping and apply the *same* clear/unclear verdict handling.
  A background mechanism that dispatches a worker and then ignores the
  worker's own verdict (confirmed live at `loop.mjs:1105` and the sweep
  above it — see D5) is a violation of already-locked doctrine, not an
  acceptable simplification.
- *Fine-grained decomposition, never consolidated for tidiness (`0030`).*
  The `/fgOS:submit` skill's own `tier`/`kind`/`risk` re-classification
  (step 6b, `plugins/fgOS/skills/submit/SKILL.md`) stays a **separate**
  step, not folded into `discovery` — explicitly rejected during this
  item's own exploring pass, precisely because folding would coarsen two
  independently-resolvable units into one, the anti-pattern `0030` exists
  to block.

**D3 — `clarify -> discovery` becomes a real edge.** `discovery.mjs`'s
clear-verdict handler changes its target from `stageForStep(...,'Divide')`
to the literal stage `'discovery'` — matching the existing convention
`loop.mjs`'s own comment already documents (`discovery`/`exploring` have
no `stepMap` entry by design, so every real caller that reaches them
addresses them by literal name, never through `stageForStep`).

**D4 — `fgos-coding-driving` (the driver) gains inline, native handling
for `discovery` and `exploring`, same shape as its existing handling of
`clarify`/`decompose`.** For `discovery`: invoke `fgos-researching`
natively (in-session — Native-First rule 2: same provider, already has
soul, no spawn) and apply the verdict itself — `clear` moves the item to
`exploring`; `unclear` parks it via `fgos ask` with the concrete question
`fgos-researching` returned, never guessed past. For `exploring`: invoke
`fgos-coding-exploring` the same way it already runs (Socratic lock →
`CONTEXT.md`), same as this item's own exploring pass just did.

**D5 — `fgos-runner`'s background DISCOVERY DISPATCH sweep
(`loop.mjs`, ~1030-1108) must respect the same verdict contract, not
just "did a commit land."** Confirmed by reading the sweep directly: its
post-dispatch check (`facts.aheadCount === 0`) never reads the worker's
own `{clear, question}` verdict at all — it unconditionally advances
`discovery -> exploring` on any real commit. Per D2's driver/launcher
parity, this must change to capture and act on the real verdict
(park via `fgos ask` on `unclear`), exactly like the interactive path in
D4. Whether this lands as the same piece as D3/D4 or its own child item is
`fgos-coding-planning`'s call, not locked here.

**D6 — a real `exploring -> decompose` edge, fired from `fgos-coding-exploring`
itself.** `fgos-coding-exploring/SKILL.md`'s own Gate today still calls
`fgos discover --verdict clear` — stale prose written for when this skill
ran AT stage `clarify`. It needs its own forward move once `CONTEXT.md` is
locked and approved. Exact mechanism (extend `discovery.mjs`'s existing
`expectedStage` gate to also accept `'exploring'`, vs. a distinct call) is
an implementation-shape choice, left to `fgos-coding-planning`/`fgos-coding-validating`
to size — not a product decision this record needs to lock.

**D7 — `fgos-clarifying`'s own hand-off prose needs no change.** It already
says an understood item "proceeds to stage `discovery`'s next step" — this
was already correct, just previously unreachable.

**D8 — `fgos-routing/SKILL.md:137-143`'s stage table gets two fixes.**
(a) The wrong `clarify` → `fgos-coding-exploring` line becomes `clarify` →
`fgos-clarifying`, matching what the registry (`skillForStage`) actually
returns — this is a plain factual bug regardless of D1-D6. (b) The table
gains real rows for `discovery` → `fgos-researching` and `exploring` →
`fgos-coding-exploring`, since those stages are no longer theoretical once D3-D6
land.

**D9 — `fgos-coding-exploring/SKILL.md`'s own prose gets updated to match its
real stage.** Its header currently states "This skill normally runs while
a claimed item's `stage` is `clarify`" — becomes `exploring`. Its Gate's
engine call changes per D6.

**D10 — mirror requirement stands.** Every change under
`.claude/skills/{fgos-coding-driving,fgos-coding-exploring,fgos-routing}/
SKILL.md` gets a byte-identical mirror under `.agents/skills/` (existing
project rule, `test/skills/fgos-mirror.test.mjs`).

## Pinned terms

- **driver** — a T1 role that stays engaged with one item through its
  whole lifecycle (`fgos-coding-driving`, used by `/fgOS:pick`/`/fgOS:cook`).
- **launcher** — a T1 role that activates one item and releases
  immediately (`/fgOS:submit`, `fgos-runner`'s own claim-and-spawn step).
- Both roles must produce the same capability once a stage-skill needing
  soul is invoked — only the start/stop point differs (`0026`/`0028`/`0029`).

## Scout evidence

- `src/state/workflow-stage-graphs.mjs:61,73-77,98-101` — stage/transition/
  stepMap declarations.
- `src/intake/discovery.mjs:6-19` (RETARGET/RETIRED comments), `:181-186`,
  `:322-325` — the real clarify-verdict engine.
- `src/runner/loop.mjs:1030-1108` — DISCOVERY DISPATCH sweep, worker
  dispatch, the confirmed verdict-ignoring bug at `:1105`.
- `.claude/skills/fgos-researching/SKILL.md:5-9,166-176` — already
  stage-agnostic, already returns the exact `{clear, question}` contract
  needed; no change needed to this skill itself.
- `.claude/skills/fgos-coding-exploring/SKILL.md:14-20,301-329` — stale
  "runs at clarify" framing, stale `fgos discover` hand-off call.
- `.claude/skills/fgos-clarifying/SKILL.md` Flow step 3 — already correct.
- `.claude/skills/fgos-routing/SKILL.md:137-143` — wrong table line + gap.
- `plugins/fgOS/skills/submit/SKILL.md:25-32,146-204` — the existing
  in-session `tier`/`kind`/`risk` classify step, confirmed staying separate
  per D2.
- Impact-analysis posture: **degraded** — GitNexus registered/`present`
  but index stale (`fgos tool query --capability impact-analysis --status
  present`, checked this session) — blast radius across
  `fgos-coding-driving`/`loop.mjs` callers not confirmed by the tool
  itself; this record's own file-read trace (above) is the substitute
  evidence for `fgos-coding-validating`'s reality gate.

## Canonical references

- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
- `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`
- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md` (finding #6, the item's own source)

## Outstanding questions

None
