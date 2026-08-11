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
