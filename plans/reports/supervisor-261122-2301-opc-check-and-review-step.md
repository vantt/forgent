# lead:OPC check and where review belongs (owner ask via Miu, 2026-11-22 23:00)

Requested by the owner through Miu (event `549d477a3f0447ba`). Read-only check, no code change.

## 1. lead:OPC: alive, why it never rotates, what it still does

- **Alive.** Process 2282988, Claude session `claude-36tm@fg-server2` (the board still names the older
  `claude-muyt`). Started 2026-11-18 14:59, so it has been up for 4 days 8 hours. Its last turn was at 22:54 tonight.
- **Why it never rotates:** it is not an fgOS head. It is a Claude session opened by hand, which Miu reopened at the
  owner's request (see its launch prompt in `/proc/2282988/cmdline`). It has no head grant, no generation line and no
  rotation hook, so nothing measures its context or rotates it. It only auto-compacts. The same gap applies to the
  manual `lead:SUPERVISOR` session (`claude-b7gj`, pid 2802150).
- **Its own closing condition is already met.** The launch prompt says: "you close when lead:SUPERVISION is complete
  (its plan 261118-1045 is done and its lead has ended)". `fgos supervisor plans` shows
  `261118-1045-project-supervisor` as `done`, and no lead for it is live.
- **What it still does:** it has taken on work outside that clause.
  - Release windows on fg-server2: it built, activated and probed releases at 18:06, 21:06 and 22:17 tonight (board
    `log.md`).
  - Recovering stuck Land chains: it ran `fgos git recover` at 18:30 (backlog p-o4juyw2ntg).
  - One DOCOS review.
  - The board still lists it as the standing reviewer of Git diffs for every lane (owner decision 10-22 22:42).
    In practice that role now gets little use. Plan leads review each phase themselves (below).

## 2. Where review belongs

Review already exists in two places:

- `core/skills/fgos-lead/SKILL.md` step 4: the lead reviews every phase result with a `code-reviewer` subagent on
  `git diff origin/main...HEAD` before it lands.
- In the coding domain, `domains/coding/registry.yaml` and `workflows/feature.yaml` and `bugfix.yaml` already define
  a `reviewer` role and a `review-item` task. The engine fires the `review` handoff when `fgos return` moves an item
  to `awaiting-approval`. The `fgos-coding-implement` guide says on purpose that it does not call review itself
  (SKILL.md lines 98 and 149).

### Decision question A: review step

**What is happening:** the owner is weighing a review step inside `fgos-coding-implement` against having the
supervisor start a reviewer only when one is needed.

**Cause:** checked the guide, the coding workflows and the lead skill (above). Review is already wired at the item
level (engine handoff) and at the phase level (lead plus subagent). The one thing missing is the Git-specific gate
list that OPC carries in its prompt: msvc check, clippy `-D warnings`, the one-door census, and a macOS
compile-check for platform code.

**Options:**
- (a) Keep the two existing review points. Move OPC's Git gate list into the lead's review brief as the checklist
  for diffs that touch `packages/git/**`, `src/git/**`, `.githooks/pre-commit` or the census. Gain: one door and no
  new mechanism. Cost: about 15 to 30 lines in `core/skills/fgos-lead/SKILL.md` plus a skills rebuild. Harm: no
  second pair of eyes from outside the lane.
- (b) The supervisor starts a `reviewer` head only when needed, for example when a diff touches Git or a one-door
  contract. Gain: an independent reviewer with its own context. Cost: a new persona, a grant row in
  `head-grants.mjs`, a trigger rule in the supervisor skill and tests, roughly 150 to 300 lines. Under RUL104 this is
  a new mechanism, so it only goes ahead if the owner picks it.
- (c) Add a review step to `fgos-coding-implement`. Harm: it duplicates the review the engine already fires at
  `awaiting-approval`, which breaks principle 1 (one door). Not recommended.

**Recommendation:** (a). Review already happens at both levels. The only real gap is the Git checklist, and it fits
inside the lead's existing review step.

**Scope of the answer:** a yes to (a) allows editing the lead skill's review brief and rebuilding the skills. It does
not allow new personas, grants, or changes to the coding workflows.

### Decision question B: what happens to lead:OPC

**What is happening:** OPC has run unrotated for more than 4 days, past its own closing condition, and now mostly
runs release windows.

**Cause:** see section 1. It is a hand-opened session, so no rotation applies to it. The supervisor cannot stop it
because `session stop` acts on heads only.

**Options:**
- (a) Close OPC now under its own lifetime clause. Release windows become a one-off chore when a release is needed
  (the supervisor's `fgos run`, or the owner). The Git checklist moves into lead review (A-a). Cost: Miu or the owner
  tells OPC to write its closing board line and stop. Harm: nobody is permanently assigned to release windows.
- (b) Keep OPC as the standing operator for releases and recoveries, and rotate it by hand (owner or Miu) when it
  gets long. Gain: continuity. Harm: it grows unbounded, with no measured rotation.
- (c) Make release operation a real head (persona plus grant) so it rotates like the other heads. Cost: a new
  mechanism, roughly 100 to 200 lines. Under RUL104 it needs the owner's pick.

**Recommendation:** (a). Its job is done by its own terms, and the leftover duties are occasional chores.

**Scope of the answer:** a yes to (a) allows Miu or the owner to close OPC and update its board row. It does not
build anything new.

Status: DONE
