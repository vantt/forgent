# plan-tsk-1uw.md — rewrite `docs/specs/work-state.md` for the live lifecycle

Child 1 of `tsk-5eq`. The parent's own shaping artifact is
`docs/history/spec-docs-lifecycle-realignment/plan.md` (on branch
`fgw/tsk-5eq`), with evidence in `RESEARCH.md` beside it. This file is
this child's plan only; it deliberately does **not** overwrite `plan.md`,
because four sibling branches merge into `main` independently and an
add/add collision on the same path would be a merge conflict for nothing.

Mode: standard

Flag count: 2 of 10 — **public contracts** (`docs/specs/` is this repo's
state layer; `AGENTS.md`'s Definition-of-done question 1 sends every stranger
agent to `docs/specs/reading-map.md` and question 3 to an area spec, and this
file is the area spec for the work-item lifecycle itself), **weak proof
around the area** (see the correction under Risk map — nothing in `npm test`
reads this file's contents at all). No hard-gate flag applies (no auth, no
data loss, no audit/security, no external provider, no removed validation),
so not `high-risk`. Not one yes/no question, so not a `spike`. Above `small`
because it is not "a few files, no gray areas": one 1215-line file carrying
~220 stale occurrences, where a per-section LIVE-vs-HISTORICAL judgment has
to be made and one legitimate legacy name must survive the sweep intact.

No `CONTEXT.md` exists for this feature — the parent reached `planning` on a
`clear` discovery verdict and no Socratic lock ever ran. The vocabulary
rule this plan is bound by is the parent `plan.md`'s own § "The one rewrite
rule"; every claim below cites either that table or a `path:line` read
directly at plan time.

impact-analysis: **full** — `fgos tool query --capability impact-analysis
--status present` returns GitNexus `present`. Recorded for completeness
only: this item's footprint is one Markdown file with no code symbols, so
no proof point below leans on blast-radius evidence. `present` is not a
freshness guarantee (`CLAUDE.md`), a second reason nothing here is gated
on it.

## Ground truth this rewrite is measured against

Read directly at plan time, not carried from memory.

| Fact | Source |
|---|---|
| coding stages: `discovery`, `exploring`, `decompose` (drain-only), `planning`, `executing` | `src/state/workflow-stage-graphs.mjs:90` |
| `stepMap` declares only `planning: 'Divide'`, `executing: 'Execute'` | `:107-110` |
| `clarify` retired entirely — a pre-item-creation Init helper (`fgos-clarifying`, called by `/fgOS:submit`), never a stage | `:78-89` |
| `decompose` kept ONLY as a drain-only legacy alias; no new item can land there | `:66-76`, `:102-106` |
| live edges: `discovery→planning` (verdict `clear`), `discovery→exploring` (`unclear`), `exploring→planning`, `planning→executing`; legacy `exploring→decompose`, `decompose→executing` | `:139-157` |
| `skillMap`: discovery→`fgos-coding-discovering`, exploring→`fgos-coding-exploring`, decompose/planning→`fgos-coding-planning`, executing→`fgos-coding-implement`, **retrospective (a status key)**→`fgos-coding-compounding` | `:223-230` |
| four domains registered: `coding`, `synthetic`, `triage`, `fixture-marketing` | `:53`, `:344`, `:372`, `:409` |
| a domain also declares `worktreeBacked`, `statusLabels`, `parkReason`, `classification` | `:237`, `:274`, `:282`, `:339` |
| status chain: `todo→doing→awaiting-approval→delivered→retrospective→cleanup→done`; `done` has exactly ONE door in (`cleanup→done`); `doing→done` and `awaiting-approval→done` no longer exist | `src/state/status-fsm.mjs:8-19`, `:100-160` |
| `compound-learn` retired as a stage; its synthesis job is the **status** `retrospective` | `workflow-stage-graphs.mjs:25-29` |
| `fgos compound` now requires `status: retrospective`, tags `docType`/`docPath`, and **never moves stage** | `bin/fgos.mjs:1363-1393` |
| `fgos plan` is a verb of its own; `src/intake/decompose.mjs` was renamed `src/intake/plan.mjs` | `bin/fgos.mjs:1227-1239`, `src/intake/plan.mjs` |
| `judgeDiscovery` retired — `resolveDiscovery` requires a caller-supplied verdict | `src/intake/discovery.mjs:44-51` |
| `src/intake/judge-executor.mjs` no longer exists | `src/intake/` listing |
| live verb list | `bin/fgos.mjs:4396` |

## Approach

**Chosen path: one in-place rewrite of `docs/specs/work-state.md`, section
by section, in the file's own Vietnamese BA-grade voice, bounded by an
explicit scope line (below).**

Rejected — *mechanical find-and-replace of the three stale names*. Three of
the five vocabulary rows are not renames at all: `clarify` retired to a
different lifecycle position (pre-item Init, not a stage), `compound-learn`
retired to a different **axis** (status, not stage), and `decompose` must
survive as a legacy alias. A replace pass would produce sentences that are
individually well-formed and collectively false, which is the exact defect
this item exists to remove.

Rejected — *rewrite the whole spec to current on every axis*. The file is
also stale about verbs unrelated to the lifecycle (`merge`, `show`,
`schedule`, `gate-approve`, `gate-bypass` are all live and undocumented
here). Those are other features' documentation debt; folding them in would
make this item unreviewable and would collide with no sibling's footprint
only by luck. Named in Open Gaps instead — see the scope line.

### Scope line

**In:** everything on the lifecycle axis — the `stage` dimension, the
`status` dimension (needed: see below), the domain registry, and the verbs
that move an item along either axis (`discover`, `plan`, `compound`,
`retrospective`, `cleanup`, `move`, `ready`), plus every Business Rule /
Edge Case / Open Gap / Pointer line that asserts a lifecycle fact.

**Why the `status` axis is in scope and not creep:** the mandatory
vocabulary table's row 5 requires every `compound-learn` mention to be
rewritten as "the status `retrospective`". Data Dictionary #4 currently
enumerates the statuses and states the schema "rejects any value outside
these seven" — so naming `retrospective` without correcting #4 would leave
the spec asserting that the status this rewrite introduces does not exist.
The status chain is also, literally, the state machine the item's own
description says no longer exists. Correcting the enumeration, `done`'s
doors, RUL4, and the `move` verb's edge list is the minimum honest unit.

**Out:** verbs off the lifecycle axis (`merge`, `show`, `schedule`,
`gate-approve`, `gate-bypass`, `session`, `goal`, `tool`, `setup`,
`doctor`, `unlock`, `evolve`, `sync-root`, `catchup`), and the `runner.md`
cross-references that sibling `tsk-5eq`'s child 2 owns. Recorded as a
named Open Gap in the file itself, not silently dropped.

**Never touched:** `sources:` frontmatter slugs (`stage-clarify`,
`stage-decompose-s1/s2`, `compound-learn-enduser-docs` are FEATURE slugs,
not stage names — parent `plan.md` § "Never rewrite"), `decisions:` hex
list, and any `docs/decisions/` / `docs/history/` / CHANGELOG reference.

### Risk map

| Component | Risk | What proves it |
|---|---|---|
| Deleting a `decompose` mention that is legitimate drain-only legacy documentation | **medium** | The rewritten stage section must still describe `decompose` as a drain-only alias with a live item count. The item's verify uses a *targeted* negative (the old `### Giai đoạn Chia-việc (stage decompose)` heading), never a blanket `! grep -q decompose` — checked: the item's recorded verify already has this shape. Carried to `fgos-coding-validating`. |
| Rewriting a line that is correct HISTORICAL narration rather than stale LIVE guidance | **medium** | `work-state.md` is a state-layer spec: unlike `docs/backlog.md`, it has no `done` rows and no dated incident narration — every assertion in it is written in the present tense about the live system. Spot-checked across §Business Rules, §Edge Cases Settled, §Open Gaps: the only past-tense text is "Đã đóng" at `:1183` and "trước fix này" clauses inside RUL54/RUL55, none of which name a stage. Carried to `fgos-coding-validating` as a proof point. |
| Correcting the status axis pulls in more than the lifecycle | **low** | Bounded by the scope line above; the Out list is written into the file's own Open Gaps so the boundary is visible to the next reader rather than implicit. |
| `coverage: full` becomes a false claim after a deliberately bounded rewrite | **low** | Downgraded to `coverage: partial` with the gap named — see Assumption A2. |
| Regression in the repo's own checks | **low** | `npm test` is the verify's first clause. But see the correction directly below: it is a general regression guard here, **not** coverage of this file. |

**Correction to the parent plan's risk map (new evidence, plan time).**
The parent `plan.md` records "Breaking `scripts/check-decision-citation-
drift.mjs`, which scans `docs/specs/*.md`" as a medium risk answered by
"`npm test` is the first clause of every child's verify". That answer does
not hold. `npm test` is `node --test 'test/**/*.test.mjs'`
(`package.json:24`), and `test/scripts/check-decision-citation-drift.test.mjs`
exercises the checker's pure functions over **synthetic fixtures** — its
`docs/specs/work-state.md` string at `:108` is a fixture label, not a file
read. Nothing under `test/` or `scripts/` reads the real
`docs/specs/work-state.md`; the drift checker is a manual, detect-only
script with no test-suite or doctor wiring. So `npm test` cannot go red
because of anything written into this file, in either direction. This is
what makes "weak proof around the area" a genuine flag for this child and
why the item's own targeted grep pair is the only real proof surface.

### Order

`fgos graph --json` puts `tsk-1uw` in the same 10-item component as its
parent and siblings, off the `criticalPath`, with nothing downstream
waiting on it — ordering is free, so the order below is by reading
dependency only (later sections cite earlier ones, so earlier ones settle
the vocabulary first).

## Shape — one item, five phases in one file

No split. The footprint is a single file; every phase below edits a
different region of it, and splitting would hand four sessions the same
path — precisely the collision `footprintOverlapAmong` exists to prevent.

1. **Stage sections (`:234-382`) — the load-bearing rewrite.**
   Replace `### Giai đoạn Làm-rõ (stage clarify)` with sections covering
   the live front of the chain: stage `discovery` (machine-alone pass) and
   stage `exploring` (the machine+human decision lock), plus a plain
   statement that `clarify` is no longer a stage at all but a
   pre-item-creation Init helper. Replace `### Giai đoạn Chia-việc (stage
   decompose)` with the `planning` stage, keeping the pass-through / split
   / need-human / invalid-verdict verdict shape (still live in
   `src/intake/plan.mjs`) and keeping one honest paragraph on `decompose`
   as a drain-only alias. Update `### Bản ghi cổng discovery` (`:292-307`)
   — the record is still appended per judgment, but the judgment now comes
   from a caller-supplied verdict, not a nested model call.

2. **Domain model (`:383-458`).** Four domains, not two. Rewrite the "hôm
   nay tồn tại hai domain" paragraph; state what a domain declares today
   (stages, stepMap, transitions, skillMap, `worktreeBacked`,
   `statusLabels`, `parkReason`, `classification`); replace the
   `compound-learn` stage paragraph with the status-`retrospective`
   account; correct the `coding` skill map at `:421-430`.

3. **Status axis, bounded (`:44`, `:52`, `:61`, `:865-868`, RUL4/RUL50).**
   Data Dictionary #4's enumeration and `done`'s doors; #12 `stage`'s value
   list; #21 `domain`'s value list; the `move` verb's legal-edge sentence;
   RUL4's `done` gate. Add short Behaviors entries for `fgos retrospective`
   and `fgos cleanup` — they are lifecycle verbs and the spec currently has
   no entry for either.

4. **Verb sections (`:23`, `:32`, `:831-862`).** Split `### Chạy
   context-discovery / phán chia-việc (discover)` into the two verbs that
   actually exist now (`discover` and `plan`), and rewrite the `compound`
   entry point + its verb behavior to the tagging-only, `retrospective`-
   gated shape. Add the `fgos plan` line to Entry Points.

5. **Sweep the tail (`## Business Rules` `:1045-1097`, `## Edge Cases
   Settled` `:1099-1167`, `## Open Gaps` `:1169-1183`, `## Pointers`
   `:1189-1215`), and the frontmatter.** Rules known stale from the reads
   above: RUL4, RUL18, RUL19, RUL22, RUL23, RUL27, RUL35, RUL49, RUL50,
   RUL51, RUL52, RUL59. Pointers known stale: `src/intake/judge-executor.mjs`
   (`:1204`, file deleted), `src/intake/discovery.mjs` (`:1205`,
   `judgeDiscovery` retired), `src/intake/plan.mjs` (`:1206`), `stage.mjs`
   (`:1198`), `work.mjs` (`:1199`), `workflow-stage-graphs.mjs` (`:1200`,
   claims one domain), `loop.mjs` (`:1208`), and the test-count claim
   (`:1215`). Frontmatter: `updated: 2026-08-12`, append
   `spec-docs-lifecycle-realignment` to `sources:`, `coverage` per A2.

### Cases worth proving against

- **Boundary — legitimate legacy survives.** After the rewrite the file
  must still document `decompose` as a drain-only alias with a live count.
  A rewrite that deletes every occurrence is wrong even though it would
  pass a naive grep, and the item's verify is deliberately shaped so it
  cannot reward that.
- **Boundary — a feature slug is not a stage name.** `sources:` at `:4`
  contains `stage-clarify` and `stage-decompose-s1/s2`. These must survive
  byte-for-byte. This is the single most likely accident of a bulk edit.
- **Existing behavior must not regress.** `npm test` stays the verify's
  first clause even though (per the correction above) it does not read this
  file — it guards against an unrelated accident in the same commit.
- **Empty case — the negative anchors.** Both stale headings must be gone
  as *headings*, and the cross-reference to them at `:23` and `:1172`/
  `:1178` must be retargeted, or the file would point at sections that no
  longer exist.
- **Partial completion.** The three sibling docs items merge independently,
  so the spec tree will briefly be mixed (this file current, `runner.md`
  not). That is acceptable and is the point of the split; this item never
  edits another child's file to keep them in sync.

## Assumptions

- **A1** — the file stays Vietnamese, BA-grade, tech-agnostic, matching its
  existing voice (`AGENTS.md` "Before touching code"). Implementation detail
  belonging in source comments does not move into the spec. Not material to
  scope; pinned rather than asked.
- **A2** — `coverage: full` is downgraded to `coverage: partial`, with the
  Out-of-scope list from the scope line written into `## Open Gaps` as a
  named gap. Rationale: `full` is already untrue (five live verbs have no
  entry) and would still be untrue after a deliberately bounded rewrite;
  claiming `full` on a file whose own Open Gaps section lists what it does
  not cover is the dishonest option. Flagged for `fgos-coding-validating`
  as the one judgment call in this plan that a reviewer might reverse.
- **A3** — the item's recorded `verify` is kept exactly as-is. Unlike the
  parent's (which the parent flagged as vacuous), this one is genuinely
  red today, re-checked at plan time: `### Giai đoạn Làm-rõ (stage
  clarify)` present at `:234`, `### Giai đoạn Chia-việc (stage decompose)`
  present at `:308`, and `grep -c 'stage \`planning\`'` returns `0`. All
  three clauses flip only when the work is real.
- **A4** — no `fgos docs-index` run is required: this item edits no file
  under `docs/how-to/` and changes no document's first H1.

## Outstanding questions

None
