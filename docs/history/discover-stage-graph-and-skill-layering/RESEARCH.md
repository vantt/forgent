# RESEARCH: discover-stage-graph-and-skill-layering

## Round 1 — 2026-08-11, tsk-qod (Đưa fgos-clarifying về bước Init)

**Asked:** Is tsk-qod's goal ("gỡ `fgos-clarifying` khỏi `skillMap`; bỏ
stage `clarify` khỏi `stages`; verb `submit` gọi nó trước khi tạo item")
clear enough, and are there facts on disk that change what "clear" means
here?

**Checked:**

- `src/intake/classify.mjs` — grepped for `domain`; only one unrelated
  comment match. Confirms the item description's own claim: domain
  classification at intake time is a **completely missing capability**
  today, not a partially-built one.
- `bin/fgos.mjs`'s `case 'submit':` (around line 1127) — `--domain` is an
  optional, caller-supplied CLI flag only. Nothing classifies it
  automatically from the submitted text. Confirms the same gap from the
  producer side.
- `src/state/workflow-stage-graphs.mjs`'s `coding` domain: `stages`
  includes `'clarify'` at index 0; `skillMap.clarify = 'fgos-clarifying'`;
  `stepMap.clarify = 'Clarify'`. Removing the `skillMap` entry (the
  item's own literal verify check) makes `skillForStage(coding,'clarify')`
  resolve to `null`.
- `fgos-coding-driving`'s own loop treats a `null` skill resolution as
  **mechanical** ("nothing left for THIS skill to load; the caller's own
  next step already covers it") — correct for `executing`
  (worker dispatch is a real, separate automated path) and `cleanup`
  (`cleanup-harness.mjs` is a real, separate automated path). **No
  equivalent automated path exists for `clarify`** — `fgos-clarifying` is
  the *only* thing that ever calls `fgos discover --verdict ...` for a
  clarify-stage item today. If `skillMap.clarify` is removed with nothing
  else changed, the driving loop would read every clarify-stage item as
  "mechanical, nothing to do" while nothing mechanical actually handles
  it.
- **Fresh count, `fgos list --all --json`, 2026-08-11 ~14:32 UTC: 90 items
  currently sit at `stage: 'clarify'`**, spanning every status
  (`todo`/`doing`/`awaiting-human`/`wontfix`/`done`/`cleanup`). This
  includes `tsk-2mt` (this item's own parent, `status: doing`) and four of
  its own sibling children still queued behind this one
  (`tsk-tku`, `tsk-2yo`, `tsk-30v`, `tsk-lya`, `tsk-15u`, all `status:
  todo`). Full id list recorded in this session's own tool transcript
  (not duplicated here — 90 ids, available on request).

**Precedent, same feature tree:** `tsk-403` (task 1, already delivered)
hit the *same class* of problem for stage `decompose` at a MUCH smaller
scale (3–4 open items) and resolved it via D18: keep `decompose` as a
legacy, drain-only `stages`/`skillMap`/edge entry (with no `stepMap`
entry, so no new item can land there), explicitly to avoid stranding the
open items. Neither D5 nor D9 (this item's own cited decisions) address
whether `clarify` needs the same treatment, and D18 was scoped to
`decompose` only by name.

**What's still open:** whether `clarify` needs the same drain-only-alias
treatment D18 gave `decompose` (at ~25x the item count), or whether the
90 open items get a different resolution (bulk migration before the
skillMap entry is pulled, a smaller/scoped batch of the removal, etc.).
This is a real product/sequencing decision — not an implementation detail
— since it changes whether 90 real work items (including this tree's own
parent and four queued siblings) become silently unreachable the moment
this item's own literal verify condition is satisfied.

## Round 1 verdict

`clear: false` — the *what* (retire `clarify` as a stage-skill, move
`fgos-clarifying` to run at Init) is understood; the open item count this
round surfaced is new evidence neither D5 nor D9 accounted for, and is
material to scope/sequencing in the same way D18 was for `tsk-403`.
Handed back to the caller as an `unclear` verdict with a concrete question
citing this round's own evidence.

## Round 2 — 2026-08-11, tsk-qod (human answer applied)

**Answered:** Option (b) — migrate/advance the 90 stage-`clarify` items
past `clarify` *before* the `skillMap.clarify` entry is removed. Explicitly
**not** a D18-style legacy drain-only alias — the person's own words:
"xử lý dứt điểm bằng di trú thay vì để lại một alias khác phải dọn sau"
(resolve it definitively via migration, not leave another alias to clean
up later).

**Consequence for scope:** this item's own footprint now includes a real
migration step (advancing 90 items off `stage: 'clarify'`) in addition to
the registry edit the item's title already named. The concrete mechanism
(one bulk pass vs. per-item, which target stage each item lands on, how a
`doing`/`awaiting-human` item is handled differently from a `todo` one)
is left to `fgos-coding-planning`'s own Approach/Shape step — this round's
job was only to confirm the decision is now locked, not to design the
migration.

## Round 2 verdict

`clear: true` — the open question from round 1 is resolved by the human's
explicit answer above. `verify` carried forward unchanged (the item's own
current `verify`); `fgos-coding-planning` at `exploring` next locks the
migration decision into `CONTEXT.md` with its own D-ID and refines
`verify` to match the now-larger scope.

## Round 3 — 2026-08-11, tsk-tku (skill chủ cho stage discovery)

**Asked:** Is tsk-tku's goal ("tạo `fgos-coding-discovering`, trỏ
`skillMap.discovery` vào nó thay `fgos-researching`, gỡ khối ngoại lệ
`## Discovery and exploring stages` khỏi `fgos-coding-driving`") clear
enough to move forward, and are prerequisite decisions (D4/D6/D7/D8/D9) and
prerequisite items (`tsk-403`, `tsk-qod`) actually settled on disk?

**Checked:**

- `DISCUSSION.md` §4 D4/D6/D7/D8/D9 (this file, lines 86-91) — fully
  specify: name (`fgos-coding-discovering`, not `fgos-discover`, D8), why
  `fgos-researching` isn't promoted to stage-owner (helper reused from
  multiple call sites, D7), the mechanical chủ-vs-helper test ("mở file
  ra, có lệnh gọi `fgos <verb>` chuyển stage không", D7), and the domain
  prefix (`coding`, D9). §7 task 3's own row (`DISCUSSION.md:405-417`)
  restates the exact verify command that matches this item's own live
  `verify` field byte-for-byte.
- `src/state/workflow-stage-graphs.mjs:89` — `stages` already reads
  `['discovery', 'exploring', 'decompose', 'planning', 'executing']`;
  `:212-219` — `skillMap.discovery` is still `'fgos-researching'` today
  (the literal thing this item repoints), and every OTHER stage skill
  already carries the `coding-` prefix (`fgos-coding-exploring`,
  `fgos-coding-planning`, `fgos-coding-implement`,
  `fgos-coding-compounding`) — confirms task 1 (`tsk-403`, family rename)
  already landed, so this item is not blocked waiting on that prefix
  convention to exist.
- `bin/fgos.mjs:1183-1215`, `case 'discover':` — already domain-aware via
  `discoverableStages(getDomain(...))` (tsk-4b2), accepting a call from
  any of the domain's registered discovery-capable stages, not hardcoded
  to one. The engine verb side needs no change for this item — confirms
  D17's own "con 3 nhỏ hơn" scope read (`DISCUSSION.md:99`).
- `.claude/skills/fgos-coding-driving/SKILL.md`'s own loaded content (this
  session's transcript) — the `## Discovery and exploring stages` section
  and its own Hard-rule "one documented exception" both still present
  verbatim, confirming the item's own verify line
  (`! grep -q "Discovery and exploring stages" ...`) targets a real,
  currently-failing condition, not something already removed.
- `find .claude/skills`, `find .agents/skills` — both mirrors exist for
  every existing `fgos-coding-*` skill (`.claude/skills/fgos-coding-
  exploring`, `.agents/skills/fgos-coding-exploring`, same pair for
  `fgos-researching`). Confirms D15's "hai bản mirror skill dir" applies
  the same way to a brand-new skill directory, not only to the renames
  task 1 already did — `fgos-coding-discovering` needs both.
- `settlements.tsk-tku` (`fgos list --id tsk-tku --json`) shows a
  `clarify-pass` entry and `deps: ["tsk-qod"]` with `tsk-qod` off the open
  frontier — confirms this item's own prerequisite (`tsk-qod`, clarify
  retired to Init) is already settled, not merely designed.

**What's still open:** nothing that blocks this item's own scope. D12's
"phán lại tier/kind/risk" classification logic is explicitly task 4
(`tsk-2yo`)'s job, not this item's (`DISCUSSION.md:405-417` names task 3's
scope as registry-repoint + exception-removal only) — confirmed not to
leak into this item's verify or description.

## Round 3 verdict

`clear: true` — every named decision (D4/D6/D7/D8/D9) is already locked in
`DISCUSSION.md`, every prerequisite (`tsk-403`, `tsk-qod`) is already
delivered on disk (not just decided), and the item's own literal `verify`
command was independently re-derived from the repo's current state, not
just copied. `verify` carried forward unchanged (the item's own current
`verify`).

**Correction (empirical, post-verdict):** the prediction above ("skips
`exploring`") was wrong — `nextDiscoveryEdge` does not yet do
verdict-based edge selection (that is task 5, `tsk-30v`, still open); a
`clear` verdict at `discovery` still walked the item to `exploring`
unconditionally, matching today's pre-`tsk-30v` behavior exactly.

## Round 4 — 2026-08-11, tsk-tku (empirical finding at the exploring→? edge)

**Finding, not a question — recorded for the tree, not blocking this
item.** After `fgos-exploring`'s own gate fired `fgos discover --verdict
clear` for `tsk-tku` at stage `exploring`, the item landed on stage
`decompose` (the legacy drain-only alias, D18), not `planning` (the active
chain a new item is supposed to walk per D11/D18's own stated intent —
"chỉ dùng cho item CÒN MỞ tại thời điểm rename... không item mới nào vào
đây nữa"). `tsk-tku` is unambiguously a new item in this same design tree,
not one of the 4 named in D18 (`tsk-42i`/`tsk-3at`/`tsk-3m6`/`tsk-1opx`).

**Checked:** `src/state/workflow-stage-graphs.mjs`'s `transitions` array —
`{from:'exploring',to:'decompose'}` is registered BEFORE
`{from:'exploring',to:'planning'}`. Whatever function resolves the
exploring→? edge (not `nextDiscoveryEdge`, which only handles
`discovery`'s own two edges per D2/D6 — this is a separate resolver for
the `clarify`-legacy `exploring→decompose`/`exploring→planning` pair)
appears to pick array order rather than filtering the legacy alias for
new items, contrary to D18's stated intent.

**Why this doesn't block tsk-tku:** `skillMap.decompose` and
`skillMap.planning` both already resolve to the identical skill
(`'fgos-coding-planning'`) — functionally a no-op difference for THIS
item's own forward progress via `fgos-coding-driving`. Not fixed here:
out of tsk-tku's own literal scope (registry-repoint for `discovery` +
exception removal only, per `DISCUSSION.md` task 3), and the `transitions`
array is shared, live state that 4 other currently-open items depend on
for their own FSM legality — changing it without a scoped task risks
those items, not something to fix as a drive-by inside this item's own
verify. Flagged here as evidence for whoever picks up `tsk-30v` (task 5,
verdict branch edges) or a new follow-up item on the `exploring→?`
resolver specifically.
