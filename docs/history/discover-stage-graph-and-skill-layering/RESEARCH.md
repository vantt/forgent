# RESEARCH — discover-stage-graph-and-skill-layering

Accumulating record. Each round appends its own dated section; never
overwrite an earlier round.

---

## Round 1 — 2026-08-11 — tsk-403 (plan-family rename), stage `discovery`

**Asked.** Is the plan-family rename clear enough to leave `discovery`?
Scope as stated: (1) stage `decompose` → `planning`, verb `fgos decompose`
→ `fgos plan`, launcher `/fgOS:decompose` → `/fgOS:plan`; (2)
`src/intake/decompose.mjs` → `plan.mjs`; (3) `coding-` prefix on 5 skills
(`fgos-exploring`, `fgos-planning`, `fgos-validating`, `fgos-compounding`,
`fgos-code-implement` → `fgos-coding-implement`), leaving
`fgos-clarifying`/`fgos-researching` alone. Verdict *values*
`decompose`/`pass-through` stay.

**Checked** (all repo-first; nothing here needed an external lookup — every
named thing resolved inside this repo):

| Thing | Where checked | Found |
|---|---|---|
| Task definition + decisions | `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md:334-356` (`{#task-plan-family-rename}`), D11 `:85`, D15 `:89` | Scope confirmed verbatim, incl. "phải đi TRƯỚC mọi con khác" and the draft verify |
| Rename precedent | `docs/history/rename-fgos-executing-to-fgos-code-implement/CONTEXT.md:16` (D1), `:137` (verify) | "Full rewrite covers all markdown docs, including dated historical snapshots: `docs/history/*`, `plans/*`, `plans/reports/*`. Does **not** cover `.fgos/state.json` or `.fgos/events.jsonl`" |
| Stage registry | `src/state/workflow-stage-graphs.mjs:61` | `stages: ['clarify','discovery','exploring','decompose','executing']`; `stepLabels` maps `decompose: 'Divide'` (`:75`) |
| Stage lookup helpers | `workflow-stage-graphs.mjs:452-462` | `effectiveStage` only falls back when `item.stage` is nullish — it does **not** alias a retired stage name. `skillForStage` returns `null` for an unknown stage and "never throws" |
| Verdict values | `bin/fgos.mjs:410-436`, `src/intake/decompose.mjs:216-275` | `--verdict pass-through\|decompose\|need-human` are literal string values in the same files that carry the stage name |
| Live state | `.fgos/state.json` stage histogram | `executing` 269, `compound-learn` 158, `clarify` 91, **`decompose` 7**, `discovery` 3, `exploring` 2 |
| Event log | `.fgos/events.jsonl` | 350 rows matching `"stage":"decompose"` / `"to":"decompose"` |
| `gather` capacity | `node src/runner/dispatch.mjs decide --for gather --has-live-task-access` | `{"mechanism":"out-of-process","capacityId":"gather"}` |
| Rename surface | `git ls-files` + `rg -l` | `decompose`: 191 tracked files outside `docs/history`/`plans`, plus 315 inside them. Per-skill-name file counts: `fgos-planning` 371 (252 history), `fgos-validating` 364 (262), `fgos-exploring` 309 (195), `fgos-code-implement` 234 (162), `fgos-compounding` 76 (31) |
| Skill dir mirrors | `.claude/skills/`, `.agents/skills/` | Both mirrors carry all 5 target skills — every rename is a paired edit |

**Found.**

1. **`decompose` is not a find-and-replaceable token.** In the same files it
   is simultaneously (a) the stage name being renamed, (b) the verdict value
   being *kept*, and (c) a function-name root (`resolveDecompose`,
   `judgeDecompose`, `resolveCallerDecomposeVerdict`,
   `resolveContentRoot`'s neighbours in `test/intake/decompose.test.mjs`).
   `bin/fgos.mjs` alone holds 37 occurrences spanning both meanings —
   `fgos decompose` (command, renames) and `--verdict decompose` (value,
   stays). Every occurrence needs per-site classification, not a bulk
   substitution. This matches the item's own "giữ nguyên" instruction but
   makes the mechanical cost materially higher than the other two sub-tasks.

2. **Three live items are still open at stage `decompose`** — `tsk-42i`
   (blocked), `tsk-3at` (awaiting-human), `tsk-3m6` (doing). The precedent's
   D1 excludes `.fgos/state.json` and `.fgos/events.jsonl` from a rename
   sweep, and that exclusion was harmless there because the renamed thing
   was a *skill name* (a doc-level label). Here the renamed thing is a
   **value that lives inside `state.json`**. After the rename,
   `domain.stages.indexOf('decompose')` returns `-1` and
   `skillForStage(domain,'decompose')` returns `null` for those three items
   — so a driver loop resolves "no skill, position is mechanical" and stops,
   and any ceiling comparison against a `stage:*` ceiling mis-ranks them.

3. **The `compound-learn` precedent does not cover this case.** 158 items
   still carry the retired stage `compound-learn` in `state.json` while it
   is absent from `stages` — but **all 158 are terminal (0 open)**, which is
   why nothing broke. `decompose` has 3 open. The repo has never yet retired
   a stage name that live, open items were sitting on.

4. **The item's noted risk is stale.** It says "Rủi ro capacityId bằng 0 vì
   capacities trong `.fgos/config.json` đang rỗng". A `gather`-purpose
   capacity is registered *now* and resolves `out-of-process` with
   `capacityId: "gather"`. Whatever that risk was guarding against, the
   precondition no longer holds as written.

5. **The attached verify is narrower than the DISCUSSION's draft.** The
   draft (`DISCUSSION.md:355`) ends with `&& ! rg -l --hidden
   "fgos-code-implement" --glob "!node_modules" --glob "!.git" --glob
   "!.fgos" --glob "!docs/history" .` — the residual-reference clause that
   actually proves the sweep finished. The verify currently on `tsk-403`
   drops it, so it would pass with hundreds of stale references still in
   tree. The precedent's own verify (`CONTEXT.md:137`) additionally excludes
   `.claude/worktrees/**` and `.fgos/events.jsonl*` and adds a `git
   ls-files` cross-check — both learned the hard way there (`CONTEXT.md:110`
   records the missing-backup-exclusion miss).

**Still open** (for `fgos-planning`/`fgos-validating`, not for a person):

- How the 3 open `decompose` items are handled: driven past `decompose`
  before the rename lands, migrated, or accepted as stranded. No bulk-patch
  verb exists (precedent D1), and `fgos plan` would *advance* them, not
  relabel them.
- Whether the verify gets the residual-reference clause and the precedent's
  exclusion globs restored.
- Whether `npm test` is green at HEAD before the sweep starts (not measured
  this round — that is validating's baseline, not a research finding).

**Verdict.** `clear: true` — the goal is determinable, the surface is
measured, and every remaining item above is a scope/approach decision the
planning stage owns.

---

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
