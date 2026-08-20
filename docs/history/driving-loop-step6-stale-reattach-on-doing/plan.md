# Plan: tsk-4gc — driving loop Step 6 must resync when re-entering a `status:doing` item

Mode: standard (2 flags: existing covered behavior — this changes the
shared driving loop every coding-domain drive runs through; weak proof
around the area — a skill's own prose has no direct unit-test coverage,
only the code paths it calls do)

## Approach

**Revision note (2026-08-20, after a validating-stage reality-gate
FAIL):** the original Phase 1 mechanism below ("re-invoke `fgos pick
<id>`") does not work for the case that matters most — see
`RESEARCH.md` Round 2. Corrected to reuse the existing, already-tested
`fgos resync-worktree` verb instead, which needs no claim/CAS machinery
at all. The file-edit targets and build/mirror mechanics below are
unchanged from the original round; only the mechanism inside Step 6
changes.

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

Inside Step 6, the fix calls the EXISTING `fgos resync-worktree --dir
"$root"` CLI verb (`bin/fgos.mjs:3906`, wired to `resyncWorktree` at
`src/runner/worktree.mjs:902`) — bare invocation, no `--path`/`--branch`
needed, since the session is already sitting inside the item's claimed
worktree at that point (`--path` defaults to `process.cwd()`, `--branch`
defaults to the worktree's own current branch). This verb touches no
claim/item state at all — pure git-worktree-plus-branch repair — so it
has no dependency on claim liveness/staleness, unlike `fgos pick`'s own
reattach path.

**Alternatives rejected.**
- Re-invoke `fgos pick <id>` on every Step 6 first-invocation when
  `status == 'doing'` (the ORIGINAL Phase 1, before this revision).
  Rejected with hard evidence, not a hunch: `src/runner/
  claim-liveness.mjs:112-117`'s `isReclaimEligible` requires the
  worktree's activity to have gone quiet for more than `humanMs` (24h for
  a `session` claim, `src/state/graph-metrics.mjs:485`) before
  `claim-port.mjs:289-326`'s stale-claim-reclaim block will even attempt
  a release-and-reclaim; otherwise `claim-port.mjs:331-339` throws an FSM
  conflict error against the item's real `doing` status. A continuous
  drive re-entering its own recently-active claim (the exact tsk-17h/
  fan-out shape this item targets) is minutes old, not 24 hours — this
  mechanism would error, not resync, on the case that matters. See
  `RESEARCH.md` Round 2 for the full citation trail.
- Expose `resyncClaimWorktree` as a NEW standalone `fgos` CLI verb.
  Rejected: unnecessary once `fgos resync-worktree` (a different,
  already-existing verb wired to `resyncWorktree`, not
  `resyncClaimWorktree`) was found to already solve exactly this problem,
  with no claim/CAS dependency and existing test coverage
  (`test/runner/worktree.test.mjs`, `test/e2e/
  resync-worktree-bare-invocation.test.mjs`) — adding new CLI surface
  for a solved problem is exactly what YAGNI rules out.
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
| `loop-mechanics.md` Step 6 prose | standard — changes a shared loop every coding-domain drive runs through | `npm test` (full state+cli+runner+e2e suite green — regression-proves `resyncWorktree`/the bare `resync-worktree` CLI shape this fix reuses, covered by `test/runner/worktree.test.mjs` and `test/e2e/resync-worktree-bare-invocation.test.mjs`, is unaffected) plus one manual re-drive of a real anchored-then-child-merged item (same shape as the tsk-17h repro in the item's own description) to confirm a live session actually follows the corrected prose — this second point is process-level and cannot be automated (a skill is read by an LLM, not executed by a test runner), an honest limit rather than a gap |
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
this drive AND `domain.worktreeBacked === true`: before proceeding to
Step 7, run

```bash
node "$root/bin/fgos.mjs" resync-worktree --dir "$root"
```

from inside the item's claimed worktree (the session is already there in
this branch — `status == 'doing'` means Step 6 skipped the fresh-claim
path). No `<id>`, `--path`, or `--branch` needed: `--path` defaults to
`process.cwd()` (the worktree itself) and `--branch` defaults to that
worktree's own current branch (`bin/fgos.mjs:3907-3908`). This calls
`resyncWorktree` (`src/runner/worktree.mjs:902`), the existing repair
verb purpose-built for exactly this failure — a worktree whose branch ref
was force-moved from outside (an `approve` leaf→root merge) while the
worktree still holds files at the old tree, verbatim the tsk-17h repro
(`worktree.mjs:885-901`'s own doc comment). It has no dependency on claim
state at all, so it works regardless of how recently the item's claim was
active — closing the exact gap that broke the original `fgos pick`-based
mechanism (see Approach's "Alternatives rejected").

A thrown `WorktreeError` from this call (the non-ancestor or
stray-uncommitted-dirt refusal cases `resyncWorktree` already implements)
must surface as a real stop, not be swallowed — relay it the same way
this loop already relays any other unexpected failure from a step it
runs; never retry blind or proceed past it.

Track "first invocation of this drive" the same way SKILL.md's own
Step 5 ("show the item once, label the pane once") already tracks
once-per-call state — never re-invoke on a later loop iteration within
the same drive, and never on a domain that isn't worktree-backed (that
branch is untouched).

Sketch of cases this needs to cover, at standard-lane depth:
- Already-`doing`, first invocation, worktree branch unchanged since last
  checkout → `resyncWorktree` returns `{resynced: false, reason:
  'already-in-sync'}` (`worktree.mjs:939-941`, a no-op fast path) —
  must stay just as cheap as today in the common case.
- Already-`doing`, first invocation, branch advanced via a child merge
  (the tsk-17h repro) → resync brings the worktree's index/files to the
  branch's current tip, reapplying any staged content on top
  (`worktree.mjs:970-1006`).
- Already-`doing`, first invocation, worktree has real stray uncommitted
  changes beyond what's staged → `resyncWorktree` refuses outright
  (`worktree.mjs:956-968`) rather than guessing a merge; Step 6 must
  relay this refusal as a stop, per above.
- Already-`doing`, SECOND+ invocation within the same drive → must NOT
  re-invoke again (existing "not first invocation" skip stays as-is).

Proof: `npm test`, plus the manual re-drive noted in the risk map.

### Phase 2 — Correct `SKILL.md`'s own hard-rule and red-flag bullets

- The "Claim right before the FIRST invocation of the `executing`-stage
  skill, never earlier, and only when not already claimed (`status !=
  'doing'`)" bullet currently asserts the FIRST invocation skips entirely
  when already claimed. Reword: the FIRST invocation always resyncs — a
  fresh `fgos pick` claim when not yet claimed, an `fgos resync-worktree`
  call (no claim/CAS involved) when already claimed — never a bare skip.
  Keep the "never earlier" half unchanged (still true).
- The red-flag bullet "claiming an item before its FIRST invocation of
  the `executing`-stage skill, or claiming again when the item's status
  already reads `doing`" currently forbids exactly the behavior Phase 1
  introduces. Narrow it to the two things still genuinely wrong:
  claiming/resyncing before the first invocation (too early), and
  running `resync-worktree` again on a second-or-later invocation within
  the same drive (redundant).
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
