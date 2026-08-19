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
all — the two touched files (`.githooks/pre-commit`, `AGENTS.md`) and
their one existing consumer (`test/e2e/main-checkout-lock-hook-worktree-
commit.test.mjs`) were found and confirmed by direct `rg`/`Read`, not by
GitNexus, so the stale index does not weaken anything this plan actually
asserts.

## Approach

**Chosen path:** land the doc rule AND a narrow mechanical guard together,
in one pass-through item (no split) — the closer precedent (tsk-56u,
`docs/history/commit-time-fgos-deletion-guard/`) shipped both a doc rule
and a pre-commit-hook guard for the sibling case (staged **Deletion**
under `.fgos/`); RESEARCH.md Round 1 confirmed the staged-**Modification**
case tsk-5pb reports has no equivalent guard today, at either the
pre-commit-hook layer or the `fgos approve`/`sync-root` engine layer (that
engine-side ADR0020 check in `src/runner/merge.mjs:1218-1231` only fires
for the engine's OWN controlled merge, never a person's manual `git
merge` inside a worktree).

**Alternatives rejected:**
- *Doc-only* (tsk-3au's shape) — rejected: the item's own "Suggested fix
  direction" explicitly names a mechanical guard as "even safer than
  documentation alone," and RESEARCH.md confirmed the gap is real and
  reachable by an ordinary `git merge --no-commit --no-ff` inside any
  fgOS worktree, by any actor (human or agent) — a prose-only rule can be
  (and, per the item's own incident, already was) missed under pressure.
  A `data loss` hard-gate item deserves more than prose when a narrow
  mechanical fix is achievable.
- *Split into two items* (doc piece + guard piece) — rejected: both
  pieces touch the same root cause, are individually tiny (one AGENTS.md
  paragraph; one ~15-line hook function mirroring an existing one plus
  its wiring line), and a split here would produce two DoD gates for one
  coherent fix — the anti-pattern `fgos-coding-planning`'s own "no gate
  here" rationale warns against duplicating.

**Files touched, in order:**
1. `AGENTS.md` — add one bullet to the existing `.fgos/` safety-net
   section (the same section housing tsk-3au's/tsk-56u's own rules,
   currently ending after the `git stash` bullet), naming the exact rule:
   any `.fgos/*` path that reappears **Modified** (not Deleted) during a
   manual merge/rebase resolution inside a worktree or the main checkout
   must be resolved by taking the merge target's (`MERGE_HEAD`'s)
   committed version verbatim — never HEAD's pre-merge content. Cite
   tsk-5pb's own incident narrative as the evidence, same style as the
   three existing bullets there.
2. `.githooks/pre-commit` — add `staleFgosMergeResolutions
   (committingToplevel)`, a sibling to the existing
   `stagedFgosDeletions()` (line 127), with a detection shape CORRECTED
   by a real spike (see "Detection mechanism spike" below — the first
   draft of this function, modeled on `stagedFgosDeletions`'s `git diff
   --cached --diff-filter=M` shape, was proven wrong by that spike): when
   `MERGE_HEAD` resolves (`git rev-parse -q --verify MERGE_HEAD`,
   mid-merge commit only — a no-op, correctly-empty check on an ordinary
   non-merge commit), find candidate paths via `git diff --name-only HEAD
   MERGE_HEAD -- .fgos` (paths where the two merge parents actually
   diverged — **never** `git diff --cached` against HEAD, which misses a
   path resolved by reverting to HEAD's own pre-merge content, since that
   produces zero diff from HEAD by definition). For each candidate path,
   compare the staged blob (`git show :<path>`) against `git show
   MERGE_HEAD:<path>`. Any mismatch means the resolution took something
   other than the merge target's version — refuse, naming the mismatched
   paths and the exact recovery command (`git checkout MERGE_HEAD --
   <paths>`), mirroring the existing deletion guard's refusal shape (line
   237) and wired into `main()` right next to it (after line 239, before
   the `hookRunsAtHome` branch — this guard, like the deletion guard,
   must fire unconditionally regardless of `hookRunsAtHome`, since it
   protects exactly the "away from home" worktree case the deletion
   guard's own header comment already documents this file as covering).

   **Detection mechanism spike (fgos-coding-validating, real evidence,
   not plausibility):** reproduced the exact incident shape in a
   throwaway repo — base commit with `.fgos/state.json` content A;
   `feature` branch diverges it to B; `main` diverges it to C; `git
   checkout feature && git merge --no-commit --no-ff main` produces a
   real `CONTENT conflict` and a resolvable `MERGE_HEAD`. Staging the
   WRONG resolution (reverting to feature's own pre-merge content B —
   exactly tsk-5pb's own incident) produced `git diff --cached --name-only
   --diff-filter=M` → **empty** (B equals HEAD's own committed content
   for that path, so nothing differs from HEAD) — the first-draft
   mechanism would have silently let this exact incident through. Staging
   it via `git diff --name-only HEAD MERGE_HEAD -- .fgos` → correctly
   yields `.fgos/state.json` as a candidate regardless of which side ends
   up staged; then `git show :.fgos/state.json` (B) vs `git show
   MERGE_HEAD:.fgos/state.json` (C) → correctly mismatch → refuse. Staging
   the CORRECT resolution (MERGE_HEAD's content C) → `git show
   :.fgos/state.json` vs `git show MERGE_HEAD:.fgos/state.json` → match →
   no refusal, confirmed no false positive on the ordinary correct path.
3. `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — extend
   with two cases mirroring this file's existing deletion-guard coverage:
   (a) a merge commit that stages `.fgos/events.jsonl` Modified with
   content that diverges from `MERGE_HEAD`'s own blob is refused; (b) a
   merge commit that stages the exact `MERGE_HEAD` content for the same
   path is allowed through (the ordinary correct-resolution path must
   never be blocked — this is the proof point the risk map below calls
   for).

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| New pre-commit guard falsely blocking a correct merge resolution | Medium — a false positive would refuse an ordinary, correct commit, blocking real work | **Proven** by the Detection mechanism spike above: staging MERGE_HEAD's own content produced a byte-exact match, no refusal. Test 3(b) makes this a permanent regression check against the real hook file (not a reimplementation) |
| New guard failing to catch the real incident shape | Medium — the whole point of this item | **Proven** by the Detection mechanism spike above: staging tsk-5pb's own incident shape (revert to HEAD's own pre-merge content) was independently confirmed both invisible to the first-draft `git diff --cached --diff-filter=M` mechanism AND correctly caught by the corrected `git diff --name-only HEAD MERGE_HEAD -- .fgos` candidate-set mechanism. Test 3(a) makes this a permanent regression check |
| Doc rule alone not preventing recurrence for an actor who skips reading it | Low — accepted; the mechanical guard above is the actual backstop, the doc rule is for a person who reads AGENTS.md before manually resolving a conflict | none needed — the guard is the enforcement, the doc is the explanation |

## Outstanding questions

None
