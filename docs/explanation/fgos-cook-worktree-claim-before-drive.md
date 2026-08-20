---
type: explanation
title: Why /fgOS:cook claims a worktree before driving instead of dirtying the main checkout
tags: [cook, worktree, claim-timing, fgos-coding-driving, branch-isolation]
timestamp: 2026-08-20T00:00:00.000Z
source_capture_ids: [tsk-hes]
authoritative_for: fgos-cook worktree-claim-before-drive
---

# Why `/fgOS:cook` claims a worktree before driving instead of dirtying the main checkout

`tsk-hes` is the item that closed a real gap in `/fgOS:cook`'s own
sequencing: `fgos-coding-driving`'s claim-timing rule only creates an
item's `fgw/<id>` worktree right before its FIRST invocation of the
`executing`-stage skill (`tsk-19j-4`'s D9) — so every earlier stage
(`discovery`/`exploring`/`planning`) that `cook` drove was writing and
committing its own docs (`CONTEXT.md`, `plan.md`) directly onto whatever
checkout the session happened to be sitting in.

## The bug, confirmed live before the fix

Before this item, `plugins/fgOS/skills/cook/SKILL.md`'s own Hard rules
section stated the old contract verbatim: *"This skill still never claims
before stage `executing`... discovery/exploring/planning work happens on
the item while it is still `todo`."* Step 2 invoked `fgos-coding-driving`
with no prior claim.

The consequence was concrete, not theoretical: commit `fa067c9c`
(`docs(tsk-2ej)` — `plan.md`/`RESEARCH.md` for `fgos-coding-planning`'s own
discovery round) sat directly on `main`'s own linear history, single-parent,
no merge commit — proof that pre-`executing` writes were landing straight
on the checkout `cook` was invoked from, dirtying `main` for every
in-flight item cook drove.

## The fix: caller claims first, the driver's own rule already expects that

The fix is not a change to `fgos-coding-driving`'s own claim-timing rule —
it is `/fgOS:cook` becoming a caller that claims before it hands an item to
the driver, the same shape `/fgOS:pick` already used. `fgos-coding-driving`'s
own Hard rules read `status == doing` before claiming and skip their own
claim in that case; nothing in the driver's contract forbids a caller from
claiming first. `plugins/fgOS/skills/cook/SKILL.md` now reflects this: Step
2's queue-drain claims the front-of-queue id (`fgos pick <id>` +
`EnterWorktree`) before its first `fgos-coding-driving` invocation for that
id — and the same claim happens again for any id pushed onto the front of
the queue via an anchor report, right before that id's own first
invocation. The `EnterWorktree` fallback (print the path, tell the user to
open a new session there, if it is unavailable or refuses) mirrors
`/fgOS:pick`'s own step 4 exactly — no new fallback pattern invented.

## Not a fresh problem — the same class of bug, deliberately deferred once already

This exact defect class had already been found and fixed once, same day,
for a sibling caller: `tsk-5qs` (`docs/history/fgos-coding-shaping-branch-isolation/`,
merged `6abea4bc` roughly an hour before `tsk-hes`'s own discovery round)
fixed `fgos-coding-shaping` for the identical root cause — *"`fgos-coding-driving`'s
claim-timing rule only claims a worktree right before the `executing`
stage, so nothing ever created the `fgw/<id>` branch."* `tsk-5qs`'s own D1
named the `cook`/planning-side instance of this same bug as real and
deliberately left it out of scope — the same `fa067c9c` commit `tsk-hes`
cites as its own live evidence is the commit `tsk-5qs`'s own research had
already surfaced. `tsk-hes` is that deferred follow-up landing, not a
newly-discovered problem.

`/fgOS:discover` was explicitly left untouched by this fix — it already
claims via `fgos take` (no worktree) today, a related but distinct gap
scoped to a separate item, not folded into this one.

## The accepted cost: advisory noise, not a correctness break

Claiming an item earlier — before discovery/exploring/planning instead of
only at executing — means the item now sits in `doing` status for the full
span of those stages, including multi-round human Q&A. That makes it show
up in `/fgOS:stale`'s advisory report even though nothing is actually
stuck. This is not a new trade-off `tsk-hes` introduced: `/fgOS:pick` and
`fgos-coding-shaping` already pay the identical cost in production, and
`/fgOS:stale` is explicitly read-only/advisory — it never reclaims a claim
on its own. The cost is real but already accepted twice elsewhere with no
correctness break, only advisory noise a person can plainly see and
ignore.

## Outcome

Landed `awaiting-approval`, light tier, first attempt, ahead by 3 commits,
no friction recorded. Verify followed the two-sided skill-prose shape
(`docs/how-to/write-verify-for-a-skill-prose-change.md`): `npm test &&
grep -q "EnterWorktree" ... && grep -q "fgos pick" ... && ! grep -q "never
claims before stage" ...` — proving both that the new claim mechanism is
really in the file and that the old contract was actually replaced, not
left standing alongside a new one.

---

**Source:** `docs/history/fgos-cook-branch-isolation/` (`RESEARCH.md`,
`plan.md`); work-item capture via `fgos check tsk-hes`.
