# RESEARCH.md — tsk-5qs (fgos-coding-shaping dirties main)

## Round 1 — 2026-08-12

**Asked:** Is the "fgos-coding-shaping writes/commits DISCUSSION.md directly
on main" bug isolated to `fgos-coding-shaping`, or does it also hit
`fgos-coding-exploring`/`fgos-coding-planning` (and by extension
`fgos-coding-discovering`), given `fgos-coding-driving`'s own claim-timing
hard rule only claims a worktree right before the `executing`-stage skill?

**Checked:**

- `.claude/skills/fgos-coding-driving/SKILL.md` hard rule: "Claim right
  before the FIRST invocation of the `executing`-stage skill, never
  earlier" — this is the loop every non-`/fgOS:pick` caller
  (`/fgOS:cook`, a clarify/planning/execution sweep) runs through. Under
  this loop, `discovery`/`exploring`/`decompose`(=`planning`) never get a
  claim or worktree of their own — only `executing` does.
- `.claude/skills/fgos-coding-exploring/SKILL.md` hard rule: "Commit
  `CONTEXT.md` to the item's `fgw/<id>` branch before this session (or a
  later one) calls `fgos discover`." Assumes a `fgw/<id>` branch/worktree
  already exists at this point.
- `.claude/skills/fgos-coding-planning/SKILL.md` hard rule: same shape —
  "Commit `plan.md` (and `CONTEXT.md` if not already committed) to the
  item's `fgw/<id>` branch..." Same assumption.
- `.claude/skills/fgos-coding-shaping/SKILL.md` hard rule: same shape —
  "Commit `DISCUSSION.md` to the item's `fgw/<id>` branch at the end of
  every round..." Same assumption — this is tsk-5qs's original target.
- `plugins/fgOS/skills/pick/SKILL.md` steps 2/4: `/fgOS:pick` DOES claim +
  `EnterWorktree` before ever invoking `fgos-coding-driving` — so a
  session that reaches exploring/planning/shaping via `/fgOS:pick` really
  is inside `fgw/<id>` already, and the "commit to fgw/<id>" instruction
  is correct there.
- `plugins/fgOS/skills/cook/SKILL.md`: "This skill still never claims
  before stage `executing`" — deliberate, cites `fgos-coding-driving`'s
  own claim-timing rule (tsk-19j-4) as authority. `/fgOS:cook` never
  pre-claims via `/fgOS:pick`'s path.
- **git evidence (empirical, not inferred):** `git log --oneline -15` on
  this repo's `main` at session start showed, as the literal tip of
  `main` (no merge commit involved, no `fgw/*` branch merge in between):
  - `fa067c9c docs(tsk-2ej): confirm global fgos CLI stage-verb skew...`
    — `git show --stat fa067c9c` touches
    `docs/history/fgos-global-install-stage-verb-skew/{RESEARCH.md,plan.md}`
    — this is `fgos-coding-planning`'s own artifact (`plan.md`), not
    shaping's `DISCUSSION.md`.
  - `c67d7f9c`/`0ec857b0`/`b55ca519`/`a581b797` `docs(tsk-2sj): ...` — all
    touch `docs/history/orchestrator-worker-slots/DISCUSSION.md` — this
    IS `fgos-coding-shaping`'s artifact, tsk-5qs's original target.
  - `git branch --contains fa067c9c` → both `fgw/tsk-2ej` and `main`
    contain it — i.e. `main`'s HEAD literally *is* that commit, no
    fast-forward-then-diverge pattern, no merge commit — meaning the
    session that made it was checked out on `main` itself when it
    committed, not inside an isolated `fgw/tsk-2ej` worktree.

**Found:** The bug is **not isolated to `fgos-coding-shaping`**. The same
class of defect — a stage-skill's own hard rule instructs "commit to
`fgw/<id>`" while the actual claim-timing design (`fgos-coding-driving`,
locked by tsk-19j-4/D9) provides no worktree until `executing` — hits
`fgos-coding-exploring`, `fgos-coding-planning`, and (same shape, not
independently confirmed via git log but same code path) likely
`fgos-coding-discovering`, whenever any of them is reached through
`/fgOS:cook` (or any other non-`/fgOS:pick` caller of
`fgos-coding-driving`) rather than `/fgOS:pick`. Confirmed empirically:
`fa067c9c` (a `fgos-coding-planning` `plan.md` commit) sits on `main`'s
own HEAD exactly the same way the four `tsk-2sj` shaping commits do.

`docs/history/fgos-coding-driving-worktreebacked-claim-branch/CONTEXT.md`
(tsk-5y5) is the one existing doc that touches this same claim-timing
hard rule, but it explicitly scopes itself to a *future*
`worktreeBacked:false` domain and states "coding, always
`worktreeBacked:true`, so its behavior is explicitly unchanged by D1" —
it does not touch, and was never meant to touch, this main-dirtying gap
for the `coding` domain itself. No existing item/doc found that already
tracks the systemic version of this gap.

**Still open (this is the material fork for a person, not this skill):**
whether the fix should stay scoped to `fgos-coding-shaping` alone (as
originally submitted text says), or whether the root cause — the
claim-timing gap between `fgos-coding-driving`'s "claim only right before
`executing`" rule (a deliberately locked decision, tsk-19j-4/D9) and every
docs-writing stage-skill's own "commit to `fgw/<id>`" assumption — needs
fixing once, upstream, for `fgos-coding-exploring`/`fgos-coding-planning`/
`fgos-coding-discovering` too. This changes which files get touched and
whether `fgos-coding-driving`'s own hard rule (previously locked, tsk-19j-4)
gets reopened — a scope call only a person should make, not something to
guess past here.
