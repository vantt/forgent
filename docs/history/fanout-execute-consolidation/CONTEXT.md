# fanout-execute-consolidation — CONTEXT

## Feature boundary

`fgos-fanout`'s out-of-process dispatch path (`references/wave-dispatch-
mechanics.md`) today spells out ~15 raw bash steps for the agent to run
by hand each wave: read `fgos list`, compute a schedule in its head
(`computeSchedule` is a pure JS function with no CLI door of its own for
this scoped-candidate case), read `fgos slots`, trim the batch by hand,
then for each out-of-process candidate: 3 separate commands (`fgos pick`
→ `dispatch.mjs execute --cwd <worktree>` → `fgos return`). This item
consolidates that into 2 real CLI verbs so the skill's own job shrinks to
2 calls plus the genuinely-judgment parts that must stay in prose. The
in-process branch (fire a native Agent via the Task tool) and the
risk-keyword approve gate stay unchanged in the skill, for reasons
recorded below — not in scope to move.

**Explicitly out of scope (D5)**: `fgos-fanout/SKILL.md`'s existing
"Known hazard" section documents a worktree-isolation race in the
in-process branch — the Claude Code harness tracks "current worktree" as
one flag per SESSION, not one per concurrently-dispatched Agent, so
sibling Agents entering their own worktrees can clobber each other's
state or drift the coordinating session's own cwd. This is a harness-level
limitation, not a bug in `dispatch.mjs` or `fanout`'s own code — neither
module can fix it (`dispatch.mjs` never even participates in the
in-process branch beyond the initial `decide` call). This item touches
only the out-of-process branch and does not fix, mitigate, or claim to
improve that hazard at any scope choice made here.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | verb moi gom out-of-process chain (pick->execute->return, gop slot-poll/trim) dat lam subcommand moi trong dispatch.mjs, canh decide/execute/log san co -- khong tao verb rieng trong bin/fgos.mjs |
| D2 | verb moi gom CA 2 phan -- chain out-of-process (pick->execute->return) VA slot-poll/trim-batch, khong tach rieng |
| D3 | risk-keyword approve check GIU LO RA o skill, khong gom vao verb -- verb moi chi lo toi awaiting-approval, khong tu approve |
| D4 | mo rong fgos schedule verb co san them --candidates <id,id,...> optional filter, khong tao verb schedule rieng cho fanout |
| D6 | verb moi la subcommand trong dispatch.mjs (module CLI da ton tai, skill da goi qua CLI-call prose tu truoc), KHONG phai bespoke script file rieng -- khong mau thuan voi quyet dinh cua tsk-4bq (tu choi mot Node orchestration script rieng de giu quy uoc CLI-call-prose-khong-embedded-script); fgos-fanout van la CLI-call prose thuan tuy sau thay doi nay, chi it lenh hon |
| D5 | item nay khong cham/khong sua known hazard worktree-isolation race o nhanh in-process -- hazard do la gioi han harness Claude Code, khong phai loi dispatch.mjs hay fanout |

## Pinned terms

- **out-of-process branch** — the part of `fgos-fanout`'s Workflow that
  fires a candidate as a real OS subprocess via `dispatch.mjs execute`,
  as opposed to the in-process branch (native Agent via Task tool).
- **slot-poll/trim-batch** — reading `fgos slots --json` to check worker-
  slot capacity before firing a batch, and cutting the batch down to
  `execution.free` when it's a real number smaller than the batch.
- **`fanout-batch`** — this item's proposed name for the new
  `dispatch.mjs` subcommand (D2). A single call, no internal wait-retry
  loop — see D2's own rationale in the decisions table.

## Scout evidence

- `.agents/skills/fgos-fanout/SKILL.md` + `references/wave-dispatch-
  mechanics.md` — the current out-of-process Workflow (Step 2/3/5), the
  only skill among 14 dev-skills carrying real loop/conditional control
  flow instead of single-command bash blocks.
- `src/state/graph-metrics.mjs:747` (`computeSchedule`), `src/state/
  worker-slots.mjs:106,150` (`countWorkerSlots`/`hasWorkerSlotRoom`) —
  already pure, tested functions; nothing here requires new algorithm
  work, only new CLI wiring.
- `bin/fgos.mjs:2550` (`schedule` case) + `src/state/store.mjs:1444`
  (`computedSchedule`) — an existing CLI verb wraps `computeSchedule`,
  but only the UNSCOPED form (`computeSchedule(view)`, no
  `candidateIds`) — does not cover fanout's own scoped-candidate need.
- `src/runner/dispatch/cli.mjs` — `executeExecutorCli`'s own docblock:
  "dispatch itself has no Task/Agent tool to call (a passive
  CLI/library)" — the confirmed architectural reason the in-process
  branch cannot move here.
- `src/intake/risk-keywords.mjs` (`HEAVY_KEYWORDS`) — the deterministic
  keyword check `fgos-fanout`'s own gather-and-approve step runs before
  auto-approving a leaf.
- **`docs/history/fgos-fanout-out-of-process-dispatch/plan.md` (tsk-4bq,
  the item that originally built this out-of-process branch)** —
  "Alternatives rejected" section explicitly rejects "a bespoke Node
  orchestration script... instead of plain bash &/wait job control,"
  reasoning "fgos-fanout's entire Workflow today is expressed as
  CLI-call prose, no embedded scripts; introducing one script file just
  for this branch breaks that convention for no real gain." Distinguished
  in D6 below — this item extends an EXISTING CLI module (`dispatch.mjs`,
  already invoked via CLI-call prose for `decide`/`execute`/`log`), not a
  new standalone script file; the skill stays pure CLI-call prose either
  way, just with fewer calls.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — this item
  touches BOTH `src/` (new subcommands) AND `SKILL.md` prose (3 mirrors),
  so its eventual `verify` needs `npm test` (covers the `src/` code with
  real unit tests) PLUS a POSITIVE/NEGATIVE grep pair proving the new
  verbs exist and the old raw multi-step bash pattern is gone from all 3
  skill mirrors — left for `fgos-coding-planning` to write in full, per
  this skill's own scope (verify authorship is not this skill's step).
- Impact-analysis capability posture: **present** (GitNexus registered,
  `fgos tool query --capability impact-analysis --status present`
  confirms), but the project's own gate warns the index is stale relative
  to current HEAD — treat blast-radius evidence from GitNexus queries as
  real but weaker than fresh; cross-check with grep where it matters
  (already done for `computeSchedule`/`hasWorkerSlotRoom`/executor-list
  above, all direct-read confirmed).
- `docs/history/fanout-execute-consolidation/DISCUSSION.md` — the full
  4-round `fgos-coding-shaping` discussion this item's decisions were
  locked in, including the Mermaid diagram of the target flow.

## Canonical references

- `docs/history/fanout-execute-consolidation/DISCUSSION.md` — design
  discussion, D1-D5, target-flow diagram.
- `plans/reports/audit-260819-2045-dispatch-execute-optimization-report.md`
  — the dispatch-execute audit that surfaced the original "code embedded
  in skills" observation this item traces back to.
- `docs/history/fgos-fanout-out-of-process-dispatch/` (tsk-4bq) — prior
  item that built the branch this item consolidates; its own "Alternatives
  rejected" section is the prior-art conflict D6 resolves.

## Outstanding questions

None
