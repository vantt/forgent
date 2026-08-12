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

---

## Round 1 — 2026-08-12 — tsk-2yo (classification → discovery, retire capacity), stage `discovery`

**Asked.** Is tsk-2yo's goal clear enough to leave `discovery`? Scope as
stated (D12/D13, `DISCUSSION.md:419-432`): (a) the `discovery`-stage skill
chủ (`fgos-coding-discovering`) starts judging `tier`/`kind`/`risk` on
research evidence, reading vocabulary via `getDomain(item.domain)
.classification` instead of hardcoding; (b) `classify.mjs` keeps its code
but its role is redefined to "temp value at generation time only"; (c)
`/fgOS:submit` loses its step 6/7 re-judge + no-soul gate; (d) capacity
`submit-assist-classify` is retired via `fgos tool remove --name
submit-assist-classify`, decision record kept.

**Checked** (all repo-first; nothing needed an external lookup):

| Thing | Where checked | Found |
|---|---|---|
| Task definition + D-IDs | `DISCUSSION.md:419-432` (`{#task-classification-to-discovery}`), D12 `:94`, D13 `:95` | Item's own description matches D12/D13 near-verbatim; item's own `verify` field (`fgos list --id tsk-2yo --json`) is a refined, more concrete version of the draft verify in `DISCUSSION.md:430-432` (targets `"live soul"` absence + `"classification"` presence in `fgos-coding-discovering/SKILL.md` instead of the draft's `.fgos/state.json` grep) |
| Dependency `tsk-tku` | `fgos list --id tsk-tku --json` | `status: delivered`, `stage: executing` — the discovery-stage skill chủ (`fgos-coding-discovering`) this task extends already exists and is merged |
| `getDomain(domain).classification` vocabulary | `src/state/workflow-stage-graphs.mjs:304-334, 562-571` | **Already exists** — `classification: { kind: [...], risk: ['light','standard','heavy'] }` on the `coding` domain entry, plus an exported accessor `classificationVocabulary(domain, field)`. Not something tsk-2yo has to invent; it already follows the same absent-key-means-not-declared shape as `skillMap`/`parkReason`. `tier` is NOT in this table (it uses `work.mjs`'s separate global `TIERS`, unchanged) |
| `classify.mjs` current shape | `src/intake/classify.mjs:41-96` | Pure, deterministic keyword-based `{tier, kind, risk}` derivation (`risk = tier` per its own D5) — exactly what the item's description means by "temp value at generation time"; no design gap, just a role/consumer change, not a rewrite |
| `fgos tool remove --name` CLI verb | `bin/fgos.mjs:4075, 4124` | Already implemented (`case 'tool'`, `requireField(... 'tool remove requires --name ...')`) — retiring `submit-assist-classify` is a one-line call, not new plumbing |
| Headless `fgos-verdict` schema | `src/runner/loop.mjs:564-591`, `src/runner/prompt-templates/worker-prompt-discovery.txt:25-31` | Current shape is `{clear: true, verify?}` / `{clear: false, question?}` only — **no tier/kind/risk fields today**. This is a real, named gap, but NOT an open design question: `DISCUSSION.md:99` (D17) already spells out the exact direction — "đường headless cần mở rộng schema khối `fgos-verdict` để worker báo `tier`/`kind`/`risk` dạng DATA cho runner áp dụng, vì worker bị cấm gọi `fgos`; đường tương tác thì skill tự gọi `fgos edit`" — and D17 explicitly flags task 4 (this item) as "to hơn" for exactly this reason. The runner side already has a working precedent to mirror: `captureDiscoveredWork` (`loop.mjs:612-636`) already applies "classify()-derived tier/kind/risk (block overrides win)" from a sibling fence (`fgos-discovered`) |
| `fgos-coding-discovering/SKILL.md` current non-goal | Full read, this session | Explicitly states classification is "Non-goal ... thuộc phạm vi task khác — tsk-2yo — KHÔNG phải skill này", with a matching hard rule forbidding `tier`/`kind`/`risk` judgment and `fgos edit` calls on those fields. This is precisely the passage tsk-2yo's implementation edits — confirms scope boundary, not a gap |
| `/fgOS:submit` current step 6/7 | `plugins/fgOS/skills/submit/SKILL.md:37, 99-112, 171, 187-188` | Step 7 (renumbered from the draft's "step 6") re-judges `tier`/`kind`/`risk` on clean text, gated behind "a live soul is running this" (line 187) — exactly what the item's own verify (`! grep -q "live soul"`) targets; step 4's own live-soul gate (line 99) is the twin the item's description calls the "no-soul gate" |

**Still open** (for `fgos-coding-planning`, not for a person):

- Exact mechanism for how the discovery-stage skill applies its judged
  `tier`/`kind`/`risk` on the interactive path (`fgos edit`, per D17) vs.
  what field(s)/flags that verb needs — an implementation detail, not a
  product decision; D17 already names the split (`fgos edit` interactive,
  extended `fgos-verdict` fence headless).
- Exact shape of the `fgos-verdict` fence extension (new optional keys vs.
  a nested object) and where the runner applies them (mirroring
  `captureDiscoveredWork`'s block-overrides-win pattern, or a new path) —
  implementation detail, `DISCUSSION.md` D17 already fixes the direction.

**Verdict.** `clear: true` — goal and scope are independently confirmed
against the live tree; every mechanism the description depends on (domain
classification vocabulary, `classify.mjs`, `fgos tool remove`, the
`fgos-verdict` fence and its known extension direction, submit's current
gate) exists and matches the description, with the two open points above
being implementation-detail, not ambiguity. Reusing the item's own attached
`verify` unchanged: `npm test && ! grep -q "live soul"
plugins/fgOS/skills/submit/SKILL.md && grep -q "classification"
.claude/skills/fgos-coding-discovering/SKILL.md`.

---

## Round 1 — 2026-08-12 — tsk-30v (nextDiscoveryEdge verdict-branch edges), stage `discovery`

**Asked.** Is tsk-30v's goal clear enough to leave `discovery`? Item's own
claim: `nextDiscoveryEdge` picks its edge PURELY BY STAGE today, verdict
never participates — clear walks the linear chain
clarify→discovery→exploring, unclear parks in place. Wanted: clear skips
`exploring`, lands straight on `planning`; unclear goes to `exploring`
(instead of parking). Item also claims "both edges already valid in the
FSM, only the edge-picker doesn't use them" and names a stale
`loop.mjs:1068-1074` comment plus the already-wired `loop.mjs:1132-1138`
`resolveDiscovery(..., callerVerdict)` call (tsk-4v6).

**Checked** (all repo-first; nothing needed an external lookup):

| Thing | Where checked | Found |
|---|---|---|
| `nextDiscoveryEdge` current body | `src/intake/discovery.mjs:136-162` | Confirmed: signature is `(work)` — no verdict parameter anywhere. Three `if` branches keyed only on `work.stage`. For `work.stage === 'discovery'` it unconditionally `return { to: 'exploring', expectedStage: 'discovery' }` — no verdict input possible. Matches the item's own claim exactly. |
| Caller `resolveDiscovery` | `src/intake/discovery.mjs:225-461` | `nextDiscoveryEdge(work)` is called at two sites (277-283 trust-signal skip, 433-438 explicit-clear), both **only reachable when `verdict.clear === true`**. When `verdict.clear === false` the function goes straight to `putInAwaiting` (457-459) — `nextDiscoveryEdge` is never invoked, stage never changes. Confirms "unclear parks in place" literally: status becomes `awaiting-human`, `stage` stays `discovery`. |
| FSM `transitions` array, `coding` domain | `src/state/workflow-stage-graphs.mjs:123-149` | Full list: `clarify→discovery`, `clarify→exploring` (legacy, dead — `clarify` retired from `stages`/`stepMap` per tsk-qod), `decompose→executing`, `exploring→decompose` (legacy drain-only per tsk-403 D18), `discovery→exploring`, `exploring→planning`, `planning→executing`. **`discovery→planning` (or `discovery→decompose`) is NOT registered.** The item's own claim ("cả hai cạnh đã hợp lệ sẵn trong FSM") does not hold for the clear-verdict destination edge — only `discovery→exploring` pre-exists; a genuinely new transition tuple must be added to this array for the clear-skip-exploring path to be legal, or `transitionStage`/`stage-fsm.mjs`'s CAS check (which requires a registered edge, no bypass, per its own no-bypass contract cited at `workflow-stage-graphs.mjs:131`) will throw. |
| `stage-fsm.mjs` edge enforcement | Confirmed via `workflow-stage-graphs.mjs:129-131`'s own comment ("`moveStage`'s FSM check … always requires a registered edge, no bypass") | No bypass path exists — adding the edge to `transitions` is mandatory, not optional polish. |
| `moveStage` / `putInAwaiting` independence | `src/state/store.mjs:763-785` (`moveStage`, delegates to `stage-fsm.mjs`'s `transitionStage`, reads/writes only `work.stage`), `store.mjs:721-733` (`putInAwaiting`, delegates to `status-fsm.mjs`'s `transitionWork` via `moveWork`, reads/writes only `work.status`) | The two are structurally independent — neither FSM inspects the other's field. Calling `moveStage(..., to:'exploring')` then `putInAwaiting(..., ask)` in sequence on the same item, in the same `resolveDiscovery` call, succeeds at the FSM level (no cross-guard blocks this direction). Existing convention in `resolveDiscovery`/`plan.mjs`'s `resolvePlan` today treats the two calls as mutually exclusive per branch (never both), with an explicit guard (`discovery.mjs:418-423`) blocking `moveStage` when status is ALREADY `awaiting-human` — that guard protects the opposite ordering (a stale, unanswered park), not this one. |
| `answerAwaiting` resume semantics | `store.mjs:747-751` | Resumes only `status` (to `statusAtAsk`, `todo` or `doing`) — never touches `stage`. Confirms that if `moveStage` advances an unclear item to `exploring` *before* `putInAwaiting` parks it, the item sits at `stage: 'exploring'` both while parked and after a person answers — landing the resumed session straight into the Socratic collab (`fgos-coding-exploring`), never looping back through `fgos-coding-discovering` a second time on the same unresolved question. |
| `loop.mjs` stale comment | `src/runner/loop.mjs:1082-1085` (current line numbers; item description's `1068-1074` is stale/drifted, same block) | Confirmed stale: `// there is no verdict to gate the transition on here, unlike the` / `// clarify->planning engine's own edge — the worker records / // its findings in RESEARCH.md and the item unconditionally advances / // discovery -> exploring once dispatch settles`. Contradicted ~65 lines below. |
| `loop.mjs` real verdict-gated call | `src/runner/loop.mjs:1132-1151` | Confirmed: `const callerVerdict = parseVerdictBlock(worker.stdout ?? '');` then `resolveDiscovery(dir, item.id, config, 'runner', callerVerdict)` at line 1150. Matches item's claim (tsk-4v6 already wired verdict through here) — only the comment 65 lines above is stale, not the code. |
| `test/intake/discovery.test.mjs` existing coverage | Full file read, 566 lines | Existing test at line 275-284, `'resolveDiscovery advances discovery -> exploring on a caller-supplied clear verdict'`, currently encodes the OLD (to-be-changed) behavior — it will need to become an `unclear`-verdict test once the edge picker is verdict-aware. No existing test exercises a `clear` verdict landing on `planning` from `discovery`, nor an `unclear` verdict advancing stage while also parking. Test helpers already present (`tmpStoreDir`, `sampleWork` defaulting `stage: 'discovery'`) are sufficient to write both new cases without new infrastructure. |
| `decompose`→`planning` rename status | `workflow-stage-graphs.mjs:90,107-108,215-222` | Already landed for the active literal: `planningStage` resolves via `stageForStep(domain,'Divide')` → `'planning'`. `decompose` survives only as drain-only legacy (no `stepMap` entry, so unreachable by any new edge). New code must target `'planning'`, never `'decompose'`. |

**Found.**

1. The product decision itself (`clear` skips `exploring`, `unclear` goes to
   `exploring` instead of parking) is already locked at the parent-tree
   level — `DISCUSSION.md` D2/D3/D6, D14 (`{#task-verdict-branch-edges}`).
   Nothing here reopens that.
2. One factual correction to the item's own premise: the `discovery →
   planning` edge does **not** pre-exist in `transitions` — it must be
   added there (`workflow-stage-graphs.mjs`), same file/array the item's
   own description didn't call out as in-scope but that the enforced
   no-bypass CAS check (`stage-fsm.mjs`) makes mandatory. This is a small,
   mechanical addition (one more frozen tuple), not a design gap — the
   edge's *validity* was never in question, only its literal registration.
3. `nextDiscoveryEdge` needs a `verdict`-shaped input (today `(work)` only)
   so its `discovery`-stage branch can pick `planning` vs. `exploring`
   instead of hardcoding `exploring`.
4. `resolveDiscovery`'s clear/unclear branching needs restructuring so that
   specifically at `stage === 'discovery'`, the unclear path also calls
   `moveStage(..., to: 'exploring')` before/alongside the existing
   `putInAwaiting` park — confirmed structurally safe (independent FSMs,
   no cross-guard blocks this ordering) and matches D2's literal wording
   ("unclear không còn park tại chỗ" — no longer parks *in place*, i.e. the
   *stage* must move even though status still asks a person). The
   `clarify`/`exploring`-stage unclear paths (legacy, and exploring's own
   gate) are unaffected — this restructuring is scoped to the
   `stage === 'discovery'` branch only, matching D6's stated boundary
   (discovery is the only "máy một mình" stage in this design).
5. The stale `loop.mjs:1082-1085` comment and the already-real
   `loop.mjs:1132-1151` verdict-gated call are both confirmed exactly as
   the item describes (module-relative line numbers drifted slightly from
   the item's draft numbers, same block).
6. The item's own attached `verify` (`npm test && node --test
   test/intake/discovery.test.mjs`) is real, runnable, and already targets
   the right test file — `hasRealVerify` (`discovery.mjs:89-91`) will
   preserve it unchanged regardless of what this round proposes.

**Still open** (for `fgos-coding-planning`, not for a person):

- Exact call-site shape for the `discovery`-stage unclear branch (a small
  local `if (work.stage === 'discovery')` special-case inside
  `resolveDiscovery`, vs. lifting the whole clear/unclear branch into a
  stage-aware helper) — an implementation/module-boundary choice, not a
  goal-clarity gap.
- Whether the new `discovery → planning` transition tuple needs its own
  code comment explaining why it's new (repo convention, seen throughout
  `workflow-stage-graphs.mjs`) — a style/documentation detail, not a
  design question.

**Verdict.** `clear: true` — the design decision was already locked
upstream; this round confirms every mechanical fact needed to implement it
(current `nextDiscoveryEdge`/`resolveDiscovery` shape, the missing FSM
edge, the stale comment, the already-real verify, FSM independence
enabling the unclear-also-advances-stage fix) and surfaces one factual
correction to the item's own premise (the `discovery→planning` edge is
missing, not merely unused) that `fgos-coding-planning` needs as
input, not a person. `verify` carried forward unchanged: `npm test && node
--test test/intake/discovery.test.mjs`.
