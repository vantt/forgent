# Miu restart handoff, 2026-11-21 14:45 (+07)

Why this restart: the owner ordered a fresh start (stop, then start through the start door) so the head binds to the active release `7aeee9e1`. Gens 18 to 20 ran on release `4f7ea1d8` (staged 2026-11-19), which lacks `session stop`, the portfolio reads (`supervisor plans`, `supervisor queue`, `slots`) and the coordination verbs (`supervisor raise`, `supervisor wake`, `run`, `metrics record`). Cause is backlog row `p-ycausep3zs` (a rotation successor runs the predecessor's release).

## First things for the new Miu

1. Check the grant: `fgos supervisor plans` and `fgos supervisor queue` must now work; `session stop` must be in the grant. If not, say so to the owner and stop.
2. Re-check the sandbox: `fgos answer` on a work item and `fgos mailbox send` failed with `git-floor-probe-failed ... Read-only file system` on the old release. See if the newer release routes them through the request socket. Report the result either way.
3. Use `supervisor raise` and `supervisor wake` for hand-offs to the supervisor. Keep free-form peer messages for replies only (owner goal, 2026-11-21: the secretary and supervisor use the mechanism already discussed and built).
4. Never guess which peer session is which head; `fgos identity resolve head:<persona>-<name>` first.

## Owner decisions in force

- Stability and correctness first. Supervisor and lead run Opus, secretary Sonnet, shapers Opus (flagship, pinned). No new work until the release hold is lifted, one thing at a time. Urgent means the owner says urgent or the agent sees it must go first (`p-fel4zoytbn`). A lead coordinates and hands phase work to workers through `fgos run`, not doing phases itself (`p-56oslt7ejt`).
- Owner's stated goal now: enough rights for supervisor and secretary, and stable session driving; both use the already built mechanism.
- Windows (S6A phases 20 rest and 21): option a. A Git-lane plan `261121-1309-git-windows-custody` (lead:WINCUSTODY, Opus) comes first; S6A then deletes the Node execution core whole. No second win32 path.
- Bugfix: `coding/bugfix` guide landed (`d44b2fb19`) and the owner approved it after the fact. `tsk-1pv` closed `wontfix` (superseded by the guide). Rule from the settled discussion: bugfix is a guide-tier file, no Work variant, no new core mechanism. Plan `261121-1314-coding-bugfix-guide` is done.
- Branches: 46 approved and deleted, plus 7 worktrees removed (about 3G freed). Kept: 28 group A branches with weaker evidence, and groups B, C, D, E of `plans/reports/review-261121-1011-unmerged-branch-verdicts.md`. Never delete a branch the owner has not approved by group.
- `mail/live-confined-zombie` lands later: row `p-s2x6ejt575`. Shaper start creates a topic's discussion stub: row `p-ucnc6j52qk`. Two filed rows from the workflow-engine discussion: `p-f367pplkhu`, `p-zhjqb4sxfk`.
- `tsk-3wd` and `tsk-5ui` are parked (`blocked`, reopenable); Work labels them `system-error` by default, which is only a label.
- Work data model plan `261120-0625-work-data-model`: phases 1 to 3 done; owner opened the footprint for `session-attempt.mjs` (q-b3acdzi4ur) and `head_request.rs`; phases 4 to 7 run in sequence.

## Waiting on the owner

Nothing open at 14:45. Pending proposal to the owner, answered by this restart: raise `p-ycausep3zs` to high, queued after the hold (the supervisor offered; I recommended yes; the owner has not answered that part yet, ask again in one line).

## Lessons

- `session write` can return `write-busy`; retry after 10 to 12 seconds.
- Do not pass another session's "done" on as fact when you cannot read it; write "per the supervisor".
- Do not offer to cancel work before reading the full record.
- Read `fgos identity resolve` before sending to a head; a head of cli `worker` is not in `ListAgents`.
- Memory files: `feedback-never-guess-session-identity`, `sandbox-fgos-writes-read-only` (the second may be obsolete after this restart; update or delete it once re-checked).
