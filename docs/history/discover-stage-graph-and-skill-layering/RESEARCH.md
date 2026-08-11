# RESEARCH — discover-stage-graph-and-skill-layering

Accumulating record. Each round appends its own dated section; never
overwrite an earlier round.

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
