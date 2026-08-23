# Plan — tsk-5pb: worktree manual-merge `.fgos/*` blob safety net

Mode: high-risk

Flag count: 1 hard-gate flag (**data loss**) — the item's own subject is a
confirmed data-loss incident on `.fgos/events.jsonl`/`.fgos/config.json`,
fgOS's own shared event-sourced state store. Per `fgos-routing`'s Mode
gate, any hard-gate flag forces `high-risk` regardless of total flag
count; no other flag (auth/authorization/audit-security/external-
provider/removing-a-validation) applies. This matches the submitter's own
stored `risk: heavy, tier: heavy` classification confirmed unchanged at
`discovery` (RESEARCH.md Round 1) — two independent readings agree.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` returned
gitnexus `present`. A PostToolUse hook this same session flagged the
index as **stale** (`last indexed: 7bb3231`, ahead of HEAD). Per
`CLAUDE.md`'s capability gate this is **degraded**, not `full`: the proof
points below still apply, but any GitNexus-sourced blast-radius claim
would be weak evidence. In practice this plan does not lean on GitNexus at
all — every touched file/function/precedent below was found and confirmed
by direct `rg`/`Read`, not by GitNexus, so the stale index does not
weaken anything this plan actually asserts.

## Correction (post-approval, before execution)

The FIRST version of this plan (already gate-approved by the user) built
its entire mechanism on the item's own "Suggested fix direction": *any
`.fgos/*` path reappearing Modified during a manual merge must be
resolved by taking the merge target's (`MERGE_HEAD`'s) committed version
verbatim.* Before implementation started, re-reading the item's own full
history (`fgos show tsk-5pb`) surfaced a decision another session had
already logged directly on this item, citing
`docs/how-to/resolve-an-events-jsonl-merge-conflict.md` step 5 — which
states the OPPOSITE resolution rule. Reading that doc plus its sibling,
`docs/how-to/fix-fgos-write-rejected-merge-block.md` (7 real precedent
items: tsk-n4i-1, tsk-5vf, tsk-4eu, tsk-5ge, tsk-28o, tsk-53n, **tsk-3v2**)
settled it with hard evidence, not opinion:

> tsk-3v2 — "Merging main into `fgw/tsk-19y` ... pulled in current main
> `.fgos/` state, which staged a diff against `fgw/tsk-19y`'s frozen
> snapshot and tripped the same `fgos-write-rejected` wall on approve ...
> The fix follows the same shape ... restore the `.fgos/` paths to what
> they were before the offending commit ... applied against the *target*
> branch's own frozen versions" — i.e. **HEAD's own content**, not
> `MERGE_HEAD`'s.

This is tsk-5pb's own incident, already hit and already correctly fixed
once under a different id. The established, 7-times-proven rule (ADR0020,
"one-door-write") is: **a worker's `fgw/<id>` branch must never carry ANY
change under `.fgos/` at all** — not "take theirs," not "take ours," but
*drop the diff entirely*, restoring the path to what the branch's own
commit history already had. The real content fix, if one is genuinely
needed, is a separate operator action applied directly to the main
checkout — never bundled into a branch's own commit, regardless of
direction.

The item's own "Suggested fix direction" (and this plan's first draft)
had the rule backwards. **This section supersedes the original Approach
below wherever the two conflict.** The corrected Approach follows.

## Approach

**Chosen path:** extend the EXISTING `tsk-56u` pre-commit guard
(`.githooks/pre-commit`, `stagedFgosDeletions`) rather than invent a new
merge-specific rule. That guard already encodes the correct principle
(`.fgos/` must never be staged as changed on a worker's checkout) but
only for one diff type (`--diff-filter=D`, Deleted). Add a sibling check,
scoped to `fgw/*` branches specifically, that fires on ANY staged change
under `.fgos/` — Added, Modified, Deleted, all of it — which is both
simpler than the withdrawn `MERGE_HEAD`-comparison mechanism and
correctly grounded in the same rule `docs/how-to/fix-fgos-write-rejected-
merge-block.md` already documents and seven real items already proved:
never let a `.fgos/` diff land on a worker branch's commit, full stop —
no case-by-case "which side is right" judgment needed at all, because
neither side is ever right on that branch.

**Why branch-scoped, not the deletion guard's existing unconditional
scope:** the deletion guard fires in the main checkout too (a `.fgos/`
deletion is always wrong, anywhere). A `.fgos/` *modification*, by
contrast, is the MAIN checkout's entire legitimate write path — every
`fgos <verb>` call and every periodic `chore(fgos): sync events log`
commit modifies `.fgos/` on the main checkout, by design. Scoping the new
"any change" check to `git symbolic-ref --short -q HEAD` starting with
`fgw/` (confirmed working via a real spike, below) targets exactly the
worker-branch case ADR0020 forbids, without touching the main checkout's
own normal operation at all — no `MERGE_HEAD` check needed, since the
rule holds unconditionally on a worker branch regardless of whether the
current commit is a merge.

**Alternatives rejected:**
- *The withdrawn `MERGE_HEAD`-comparison rule* — rejected: proven
  backwards by real precedent (tsk-3v2) and an existing, already-cited
  how-to doc; would have actively enforced the wrong resolution direction
  had it shipped.
- *Doc-only* (tsk-3au's shape) — rejected: the gap RESEARCH.md Round 1
  found real (nothing today catches a worker-branch `.fgos/` modification
  at commit time, only much later at `fgos approve`, or not at all before
  a raw git-level failure) is exactly the kind a narrow, already-proven-
  pattern mechanical guard closes; a `data loss` hard-gate item deserves
  more than prose when the fix is this narrow.
- *Split into two items* (doc piece + guard piece) — rejected: same
  reasoning as the withdrawn draft — both pieces are tiny, share one root
  cause, and a split would duplicate one DoD gate over two.

**Files touched, in order:**
1. `AGENTS.md` — add one bullet to the existing `.fgos/` safety-net
   section (ending after the `git stash` bullet), stating the CORRECTED
   rule: any `.fgos/*` path staged as changed (Modified or Deleted) on a
   worker's `fgw/<id>` branch — including one that reappears Modified
   because git's own merge machinery materialized a blob during a manual
   conflict resolution — must be restored to that branch's own prior
   content (`git checkout <the branch's own parent commit> -- <path>`)
   and dropped from the commit entirely, never resolved toward either
   side of a conflict. Point at `docs/how-to/fix-fgos-write-rejected-
   merge-block.md` (tsk-3v2's own example matches this exactly) for the
   full recipe and at `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`
   for the `events.jsonl`-specific seq-contiguity angle. Cite tsk-5pb's
   own incident as the motivating evidence, same style as the three
   existing bullets there.
2. `.githooks/pre-commit` — add `stagedFgosChangesOnWorkerBranch
   (committingToplevel)`, a sibling to `stagedFgosDeletions()` (line 127):
   read the current branch (`git symbolic-ref --short -q HEAD`, catching
   the detached-HEAD case the same way `currentFgwBranchIfMainCheckout`
   already does at line 152-157 — no branch means nothing to check); if
   it starts with `fgw/`, read every staged path under `.fgos/`
   (`git diff --cached --name-only`, filtered the same way
   `stagedFgosDeletions` already filters — this time with NO
   `--diff-filter` restriction, so Added/Copied/Modified/Renamed/Deleted
   all count). Any non-empty result refuses the commit, naming the paths
   and pointing at `docs/how-to/fix-fgos-write-rejected-merge-block.md`
   for the fix (mirroring the deletion guard's refusal shape, line 237).
   Wired into `main()` right after the existing `stagedFgosDeletions`
   call (after line 239) — this check does NOT need the
   `hookRunsAtHome`-unconditional treatment the deletion guard needs,
   since it is already branch-scoped rather than checkout-scoped: a
   worker's own worktree is always "away from home" for `hookRunsAtHome`
   purposes, so placing it before that gate (same position as the
   deletion guard) is what lets it actually fire there.

   **Detection mechanism spike (fgos-coding-validating, real evidence):**
   confirmed `git symbolic-ref --short -q HEAD` correctly reads the
   current branch name inside a repo mid-merge (returned `feature`, the
   real branch name, while `MERGE_HEAD` was also live) — the branch-name
   read is unaffected by merge state, so this check needs no special
   handling for "am I mid-merge" at all; it is equally correct on a
   worker branch's ordinary, non-merge commit that happens to touch
   `.fgos/` by mistake, a strict superset of tsk-5pb's own narrower
   merge-only incident.
3. `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — extend
   with cases mirroring the existing deletion-guard block (lines
   285-345), reusing its own `initSharedAbsoluteHooksPathFixture`/
   `commitAsSession` helpers: (a) a commit on the worktree's own `fgw/*`
   branch that stages `.fgos/state.json` Modified (simulating a
   materialized merge blob, or a plain accidental edit — no merge setup
   needed given the corrected mechanism has no `MERGE_HEAD` dependency)
   is refused; (b) the SAME staged Modified `.fgos/*` change on `main`
   (not a `fgw/*` branch) is unaffected — this is the regression proof
   that main's own legitimate `.fgos/` writes stay untouched; (c) a
   normal commit on a `fgw/*` branch that never touches `.fgos/` still
   succeeds (no false positive on ordinary worker-branch work).

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| New guard falsely blocking main checkout's own legitimate `.fgos/` writes (sync commits, `fgos <verb>` calls) | Medium — would break the platform's own normal write path | Test 3(b): the same staged Modified `.fgos/*` path is unaffected when HEAD is `main`, not `fgw/*` — proven by the branch-scoping design itself (`git symbolic-ref` read), confirmed working by the spike above |
| New guard failing to catch a worker-branch `.fgos/` change (the incident shape, or any other) | Medium — the whole point of this item | Test 3(a): staged Modified under `.fgos/` on a `fgw/*` branch is refused — no `MERGE_HEAD` dependency means this also covers non-merge accidental edits, a strict superset of the original incident |
| Doc rule alone not preventing recurrence for an actor who skips reading it | Low — accepted; the mechanical guard is the actual backstop | none needed — the guard is the enforcement, the doc is the explanation |

## Outstanding questions

None
