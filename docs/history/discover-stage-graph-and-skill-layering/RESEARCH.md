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

---

## Round 1 — 2026-08-11 — tsk-lya (picker split + discover prose), stage `discovery`

**Asked.** Is tsk-lya's goal clear enough to leave `discovery`? Scope as
stated: (1) `discover-next` stops self-claiming/self-dispatching/
self-computing ceiling, delegates to `/fgOS:discover <id>` after picking;
(2) generate a `plan-next`/`plan-loop` pair for the planning-stage pool;
(3) fix four prose defects in `discover/SKILL.md`.

**Checked** (all repo-first; nothing needed an external lookup):

| Thing | Where checked | Found |
|---|---|---|
| Task definition + D-IDs | `DISCUSSION.md:449-465` (`{#task-picker-split-and-prose}`), D1 `:83`, D8 `:90`, D10 `:92`, D11 `:93` | Scope matches the item's own description verbatim, incl. the draft verify |
| Dependency `tsk-403` | `fgos list --id tsk-403 --json` | `status: delivered` — the plan-family rename (D11's prerequisite: `decompose`→`planning`, `fgos decompose`→`fgos plan`, skill prefix `coding-`) has already landed on `main` and is present in this worktree |
| Rename landed | `src/intake/plan.mjs`, `plugins/fgOS/skills/plan/`, absence of `plugins/fgOS/skills/decompose/` | All confirmed in this worktree — the picker split is unblocked |
| `discover-next/SKILL.md` current shape | `plugins/fgOS/skills/discover-next/SKILL.md:55-77` | Step 4 self-claims, then invokes `fgos-coding-driving` directly with a ceiling it computes itself from the picked stage (`stage:decompose` or `stage:executing`) — exactly D10's complaint, a legacy from before `tsk-2b0` split the bottom tier (`discover-pool.mjs:1-2`'s own pre-split comment) |
| `discover-pool.mjs` pooling | `src/state/discover-pool.mjs:19-24, 53-61, 76-108` | `pickNextDiscoverItem` pools BOTH clarify-shaped stages (`clarify`/`discovery`/`exploring`) AND `decompose`/`planning` in one function — the "planning pool ăn ké discover-next" the item names; a `plan-next`/`plan-loop` pair needs its own pick function scoped to `decompose`/`planning` only (mirrors `compareDecomposeOrder`, already isolated as its own function) |
| Existing next/loop template | `plugins/fgOS/skills/discover-next/SKILL.md`, `discover-loop/SKILL.md`, `cleanup-next/SKILL.md` (full read) | Consistent five/six-step shape across all three: ignore `$ARGUMENTS` → pick via a pure pool function → pool-empty stop → claim + dispatch (or run the verb) → relay the driver's stop reason verbatim, incl. the `lock-timeout` relay contract. `plan-next`/`plan-loop` has three ready templates to mirror |
| `discover/SKILL.md` Socratic claims | `plugins/fgOS/skills/discover/SKILL.md:7, 21, 127` (post-tsk-403-rename text) | 3 assertive sentences, incl. the frontmatter `description` (loaded into every session), all claim the live session does "real Socratic reasoning (`fgos-coding-exploring`)" when `/fgOS:discover` runs — but the driver resolves stage `clarify` to `fgos-clarifying` (`workflow-stage-graphs.mjs:148`, verified live this session: my own `discover` call at `clarify` invoked `fgos-clarifying`, not `fgos-coding-exploring`), and a clear verdict lands on stage `discovery`, not `planning` directly (`nextDiscoveryEdge`, `discovery.mjs:120-124`) |
| `discover/SKILL.md` lines 30-33 | Same file | Claims "`discover` errors if called on an item that isn't at stage `clarify`" — but `nextDiscoveryEdge` (`discovery.mjs:120-134`) explicitly handles `clarify`, `discovery`, AND `exploring` without erroring; it only throws for stages outside `discoverableStages(domain)` (i.e. `decompose`/`planning`/`executing`) |
| `discover/SKILL.md` step 4 | Same file `:132-146` | Relays `fgos-coding-driving`'s narrated stop reason with no re-read of live state first — exactly the class of bug the Q&A log's vòng 4-5 already caught once (`DISCUSSION.md:113-114`: a session reported "reached ceiling at decompose" while the item was actually at `discovery`) |
| `discover/SKILL.md` layer/caller context | `DISCUSSION.md:126-136` (vòng 7), `herdr-plugin/src/pick.rs:17,130` | ADR 0028 vocabulary already pins launcher (picks one, steps out, no soul needed) vs orchestrator; `pick.rs` calls `/fgOS:discover <id> --autoClose` from both a manual button and an auto-launcher — confirms "hiếm khi là người, không ai ngồi xem" is a real caller shape, not a hypothetical |
| Item's own attached verify | `fgos list --id tsk-lya --json` | `! grep -q "Socratic reasoning"` currently fails (3 live hits confirmed above) — the verify is red today as expected pre-implementation, and its negative-grep is broader/more correct than the DISCUSSION draft's narrower `"Socratic reasoning (fgos-exploring)"` (catches all 3 assertions, not just one phrasing) |
| Skill-dir mirrors | `find .claude -iname "discover-next*" -o -iname "plan-next*"` | No hits — `plugins/fgOS/skills/*` launcher/picker skills have no `.claude`/`.agents` mirror (unlike the 5 coding-domain stage skills tsk-403 renamed); no extra mirrored-edit surface for this item |
| Note: `RESEARCH.md` itself | This worktree vs. main checkout | The file was untracked/uncommitted on the main checkout (a prior session's scratch from `tsk-403`'s own discovery pass) and is absent from this worktree's git history. Created fresh here per this skill's own flow step 4 ("create if it does not exist yet") — not a merge of the main-checkout content, which sits outside this item's footprint |

**Found.**

1. Every claim in the item's description is independently verifiable in the
   current tree — this is a well-grounded, already-decided scope (D1/D8/D10/
   D11), not an open design question.
2. The dependency (`tsk-403`) is satisfied — `delivered` and present in this
   worktree — so nothing blocks starting.
3. Three ready templates exist for the new `plan-next`/`plan-loop` pair
   (`discover-next`, `discover-loop`, `cleanup-next`), and the pool split
   needed underneath them is already half-isolated (`compareDecomposeOrder`
   is a separate function today, just not exposed as its own pick entry
   point).
4. All four named `discover/SKILL.md` prose defects reproduce exactly as
   described, with concrete line numbers and a live-verified mechanism
   (this session's own `fgos discover` call moved `tsk-lya` `clarify` →
   `discovery` via `fgos-clarifying`, not `fgos-coding-exploring`).

**Still open** (for `fgos-planning`, not for a person):

- Whether the new pick function for the planning pool lives in
  `discover-pool.mjs` (narrowed to clarify-shaped stages only) plus a new
  sibling file, or a renamed/split module — a naming/module-boundary
  choice, not a goal-clarity gap.
- Exact wording for the new layer/caller declaration block in
  `discover/SKILL.md` — content is fully specified by the item's
  description and the Q&A log; phrasing is an implementation detail.

**Verdict.** `clear: true` — goal, scope, and every named defect are
independently confirmed against the live tree; the attached verify is a
real, currently-red, runnable command that accurately targets what was
found. Reusing the item's own attached verify unchanged.
