# Plan: tsk-4gc — driving loop Step 6 must resync when re-entering a `status:doing` item

Mode: standard (2 flags: existing covered behavior — this changes the
shared driving loop every coding-domain drive runs through; weak proof
around the area — a skill's own prose has no direct unit-test coverage,
only the code paths it calls do)

## Approach

**Chosen path.** Edit the canonical source
`domains/coding/skills/fgos-coding-driving/{SKILL.md,references/loop-mechanics.md}`,
then run `npm run build:skills` to regenerate the three derived copies and
commit everything together. Confirmed via `scripts/build-skill-wrappers.mjs`
+ `src/setup/skill-wrappers.mjs`: `assembleSkills` copies
`domains/<domain>/skills/*` (+ `core/skills/*`) into `.agents/skills/*`;
`generateAllSkillWrappers` builds `.claude/skills/*` thin wrappers from
that; `mirrorDevSkillsIntoPlugin` copies `.agents/skills/*` into
`plugins/fgOS/skills/*`. All four `fgos-coding-driving` copies on disk
today (`domains/coding/skills/`, `.agents/skills/`, `.claude/skills/`,
`plugins/fgOS/skills/`) are byte-identical right now (`diff -rq` verified
during this planning pass) — `domains/coding/skills/` is the one real
source; the other three are generated.

**Alternatives rejected.**
- Expose `resyncClaimWorktree` as a new standalone `fgos` CLI verb and
  call it directly from the loop's own bash. Rejected: `bin/fgos.mjs` has
  zero references to `resyncClaimWorktree` today (grepped this round) —
  building this needs new CLI surface, new tests, new docs, pure added
  complexity (YAGNI) when a safe, already-shipped, already-exercised call
  path (`fgos pick <id>`, its reattach branch) already performs the exact
  same resync as a documented side effect (tsk-2cd; see discovery round's
  `RESEARCH.md` evidence 3-4 for the citations).
- Hand-edit one of the three generated copies directly. Rejected: the
  next `npm run build:skills` silently regenerates it from
  `domains/coding/skills/` and reverts the edit — `build-skill-wrappers.mjs`'s
  own header comment says the mirror test now checks the generated
  wrappers are up to date with the `.agents/skills/*` source, not that
  they byte-match a hand-maintained copy, so drift here gets caught, not
  silently kept.

**Risk map.**

| Component | Risk | Proof point |
|---|---|---|
| `loop-mechanics.md` Step 6 prose | standard — changes a shared loop every coding-domain drive runs through | `npm test` (full state+cli+runner+e2e suite green — regression-proves the reused `resyncClaimWorktree`/`createClaimWorktree` reattach mechanism, covered by `test/runner/worktree.test.mjs`, is unaffected) plus one manual re-drive of a real anchored-then-child-merged item (same shape as the tsk-17h repro in the item's own description) to confirm a live session actually follows the corrected prose — this second point is process-level and cannot be automated (a skill is read by an LLM, not executed by a test runner), an honest limit rather than a gap |
| `SKILL.md`'s "Claim right before the FIRST invocation..." hard-rule bullet + its matching red-flag bullet | light — prose-only rewording, no executable surface | Read-through consistency check (see Phase 2) |

**Files touched, in order:**
1. `domains/coding/skills/fgos-coding-driving/references/loop-mechanics.md`
   — Step 6.
2. `domains/coding/skills/fgos-coding-driving/SKILL.md` — the matching
   hard-rule and red-flag bullets.
3. `npm run build:skills` — regenerates the three derived copies.
4. Commit the two hand edits and all regenerated files together — a
   partial commit leaves source and mirrors out of sync, the exact drift
   `build-skill-wrappers.mjs` exists to catch.

`fgos graph tsk-4gc --json`: the item has no `deps`, and reads as its own
single-item component in the full graph — no cross-item blocking fan-out
to sequence around. The ordering above is file-edit order within this one
item only.

**Impact-analysis posture:** `full` — GitNexus registered and `present`,
freshly checked this planning session (`fgos tool query --capability
impact-analysis --status present`).

## Shape

### Phase 1 — Fix Step 6's skip branch (`loop-mechanics.md`)

When `skill` resolves to the domain's `executing`-stage skill AND
`status == 'doing'` AND this is the FIRST invocation of that skill in
this drive AND `domain.worktreeBacked === true`: re-invoke
`node "$root/bin/fgos.mjs" pick "<id>" --dir "$root"` (the exact same
command the `status != 'doing'` branch already runs) before proceeding to
Step 7, instead of skipping outright. This hits `createClaimWorktree`'s
reattach path — `reattachableCheckout` finds the live checkout,
`resyncClaimWorktree` resyncs it to the branch's current tip when
provably safe (tsk-2cd) — then hand the session into the returned
worktree path the same way the fresh-claim branch already does
(`EnterWorktree`, same fallback-to-print-and-stop rule already documented
there).

Track "first invocation of this drive" the same way SKILL.md's own
Step 5 ("show the item once, label the pane once") already tracks
once-per-call state — never re-invoke on a later loop iteration within
the same drive, and never on a domain that isn't worktree-backed (that
branch is untouched).

Sketch of cases this needs to cover, at standard-lane depth:
- Already-`doing`, first invocation, worktree branch unchanged since last
  checkout → `fgos pick` reattaches, `resyncClaimWorktree` finds nothing
  to resync (no-op fast path), proceeds — must stay just as cheap as
  today in the common case.
- Already-`doing`, first invocation, branch advanced via a child merge
  (the tsk-17h repro) → resync brings the worktree's index/files to the
  branch's current tip.
- Already-`doing`, first invocation, worktree has real uncommitted local
  changes → `resyncClaimWorktree`'s own existing safety check (ancestor
  proof + clean-tree check, tsk-2cd) refuses rather than resets blind;
  this item does not change that guard, only whether Step 6 ever reaches
  it.
- Already-`doing`, SECOND+ invocation within the same drive → must NOT
  re-invoke again (existing "not first invocation" skip stays as-is).

Proof: `npm test`, plus the manual re-drive noted in the risk map.

### Phase 2 — Correct `SKILL.md`'s own hard-rule and red-flag bullets

- The "Claim right before the FIRST invocation of the `executing`-stage
  skill, never earlier, and only when not already claimed (`status !=
  'doing'`)" bullet currently asserts the FIRST invocation skips entirely
  when already claimed. Reword: the FIRST invocation always resyncs — a
  fresh `fgos pick` claim when not yet claimed, an idempotent reattach
  re-invoke of the same command when already claimed — never a bare
  skip. Keep the "never earlier" half unchanged (still true).
- The red-flag bullet "claiming an item before its FIRST invocation of
  the `executing`-stage skill, or claiming again when the item's status
  already reads `doing`" currently forbids exactly the behavior Phase 1
  introduces. Narrow it to the two things still genuinely wrong:
  claiming/resyncing before the first invocation (too early), and
  re-invoking on a second-or-later invocation within the same drive
  (redundant).
- Grepped this discovery round: no other reference doc
  (`reclaim-and-role-graph.md`, `caller-contract.md`) asserts the old
  skip-when-doing behavior, so no third file needs the same correction.

Proof: read-through consistency check across all three
`fgos-coding-driving` docs — no bullet left asserting the old behavior.

### Phase 3 — Regenerate mirrors and commit

`npm run build:skills`; `git status`/`git diff --stat` should show only
the two hand-edited files plus their three generated mirror copies
changed — nothing else. Commit all of it together.

Proof: the `git diff --stat` check above, plus `npm test` green.

## Outstanding questions

None
