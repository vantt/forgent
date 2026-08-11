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

## Verdict

`clear: false` — the *what* (retire `clarify` as a stage-skill, move
`fgos-clarifying` to run at Init) is understood; the open item count this
round surfaced is new evidence neither D5 nor D9 accounted for, and is
material to scope/sequencing in the same way D18 was for `tsk-403`.
Handed back to the caller as an `unclear` verdict with a concrete question
citing this round's own evidence.
