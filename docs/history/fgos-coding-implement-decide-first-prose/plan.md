# plan.md — tsk-1ep: fgos-coding-implement decide-first prose fix

Mode: tiny (0 flags: no auth, no authorization, no data model, no
audit/security, no external systems, no public contracts, no
cross-platform, no existing covered *behavior* touched — this edits
prose, not runtime code, and no test exercises SKILL.md text — no
weak-proof area, single domain).

## Approach

Single piece, no split — `fgos graph --json` has nothing to inform here
(one prose edit applied identically to two files, no ordering choice).

Files touched (both existing, edited, not new):
- `.agents/skills/fgos-coding-implement/SKILL.md` (canonical source)
- `plugins/fgOS/skills/fgos-coding-implement/SKILL.md` (byte-identical
  mirror, `RESEARCH.md` round 1 — confirmed identical today, no sync
  script found, so this item must edit both by hand to keep parity)

Not touched: `.claude/skills/fgos-coding-implement/SKILL.md` (15-line
thin wrapper by design, tsk-1qi D5/D7 — `RESEARCH.md` round 1), and
`docs/task-specs/coding/implement-item.md` (no stale framing found there).

Impact-analysis capability gate: not applicable — this edits prose in a
skill-instruction file, not a code symbol GitNexus indexes; there is no
blast radius to assess.

Risk map: light. The only real risk is the two mirrored files drifting
out of parity — caught by the verify command's own `diff -q` check.

## Shape

Two edits, applied identically to both files:

1. **Hard rules bullet** ("Do your own Implement work directly...never
   delegate it to the Agent/Task tool as an ad hoc sub-dispatch..."):
   rewrite to state the item's own finding (`RESEARCH.md` round 1,
   confirmed live this session): per `docs/decisions/0033-cli-spawn-
   shaped-capacity-thang-hasLiveTaskAccess.md` (extends 0026 rule 2,
   narrowing it to `agentType`-shaped capacities only), a `cli-spawn`-
   shaped capacity already registered in `.fgos/config.json` (e.g.
   `fgos-coding-implement` -> `agy`) resolves `out-of-process`
   *unconditionally* once configured — `--has-live-task-access` does not
   change that. So this skill must call `dispatch.mjs decide` FIRST for
   the Implement step, every time, and branch on the real answer —
   never assume "I have a live Task tool, so I do it myself" as the
   default. "Do it directly" stays correct only for whichever branch
   `decide` actually returns (`in-process`, or `unavailable` — no
   capacity registered), never as the a-priori default the current
   prose states.
2. **Flow step 2 ("Implement")**: add the `decide` call as its own first
   sub-step, before "Make the real change...": run
   `node src/runner/dispatch.mjs decide --work <id> --has-live-task-access`
   (the session already knows it has live Task/Agent tool access, so
   passes the flag per `AGENTS.md`'s own dispatch doctrine section), then
   branch:
   - `unavailable` — proceed exactly as today (do the work directly).
   - `in-process` — proceed exactly as today, via the returned
     `agentType` if present.
   - `out-of-process` — dispatch via `dispatch.mjs execute <executorId>
     --prompt "..." --has-live-task-access` (Step B of the shared
     fragment, `../_shared/executor-dispatch-fallback.md`), reading the
     result's `stdout` as the work product, then continue this skill's
     own Verify/Commit/Return steps unchanged — the dispatch only
     replaces the "write the files yourself" sub-step, not the whole
     skill.

   Cite 0033 explicitly in both edits (the same "cite the decision, don't
   just assert" discipline every other skill in this repo already
   follows).

## Concrete cases

- A `coding`-domain item at `executing` whose capacity IS registered
  cli-spawn (today: `fgos-coding-implement` -> `agy`) — `decide` must
  return `out-of-process`, and this skill must actually dispatch, not
  silently keep doing the work itself (this is the live bug tsk-52z's own
  drive exposed and reported incorrectly, `RESEARCH.md` round 1).
- A `coding`-domain item whose capacity has nothing registered — `decide`
  returns `unavailable`, skill proceeds exactly as before this fix; no
  behavior change for that case.

## Split decision

No split. One honest piece of work — pass-through.

## Outstanding questions

None
