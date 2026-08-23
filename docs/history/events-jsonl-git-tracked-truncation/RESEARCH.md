# events-jsonl-git-tracked-truncation — RESEARCH

## Round 1 — 2026-08-10 (fgos-researching, stage `discovery`, tsk-cgg)

**Asked:** Is tsk-cgg's own account of the failure mode accurate against the
current repo, and does prior art already cover this ground?

**Checked and found (repo, cited):**

- `src/state/events.mjs:353` — `appendEventCore` derives `seq` purely from
  the log's own last line (`const seq = last ? last.seq + 1 : 1;`).
  Confirmed exactly as the item describes: after any truncation, the next
  append silently renumbers from the cut point.
- `.fgos/events.jsonl` is git-tracked: `git ls-files -- .fgos/events.jsonl`
  returns it; `.gitignore:4` comment states "events.jsonl is truth
  (committed); state.json is a derived view" — **this is a deliberate,
  load-bearing design choice (D10), not an oversight.** `src/runner/
  session.mjs:1-6` and `:104-127` (`restoreTrackedFgos`) and
  `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` both depend on
  `.fgos/` being git-tracked at HEAD — the whole session/worktree
  lifecycle (symlink-back-to-shared-store for driver sessions, HEAD-content
  restore before `git worktree remove`) is built on that assumption.
  **Implication for planning:** the item's own proposed direction (a) —
  untracking `events.jsonl` from git — is not a clean, isolated change; it
  would require re-deciding D10 and re-checking every consumer of the
  git-tracked assumption (0020's own worktree-worker exclusion logic
  included). This does not make (a) wrong, but planning should weigh it
  with eyes open rather than as a low-cost default.
- `scripts/check-events-seq-contiguity.mjs` (full file read) — confirmed:
  pure sliding-window check, throws only on `parsed.seq !== prevSeq + 1`.
  Its own header comment explains it exists because of a **prior, distinct**
  incident (`docs/history/live-events-seq-corruption/`, tsk-n4i) — a git
  *merge-conflict* hand-resolution that produced duplicate/non-monotonic
  `seq` values while preserving total line count. That prior incident's own
  root cause (D1: ad hoc merge-conflict resolution) is different from
  tsk-cgg's (git-stash reverting a tracked file to HEAD) — confirmed via
  that CONTEXT.md's own evidence trail (`git blame`, commit hashes). tsk-cgg's
  own finding — that a truncate-then-renumber preserves contiguity and is
  therefore invisible to this exact guard — is new: the prior incident never
  needed to consider it, because a merge conflict corrupts values without
  first deleting-and-renumbering.
- `docs/history/events-lock-concurrency-race/` (tsk-3ld, still open per
  its own file) — a genuinely distinct, unrelated concern (lock race under
  ≥20-concurrent-process write load). tsk-cgg's own description already
  rules out a race/lock cause via reflog inspection (no reset/checkout
  entries); this prior item's scope does not overlap tsk-cgg's.
- `docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md` — pre-release exemption
  to RUL11 ("committed log is inviolable") permitting in-place rewrite of
  the live store until v1.0.0. Relevant if planning decides any repair or
  migration touches the live store directly (tsk-cgg's own description
  already says the lost 65 events are unrecoverable — no stash/branch copy
  contains them — so this exemption's relevance here is limited to future
  recurrence-prevention tooling, not data recovery).
- Footprint files all exist as named: `src/state/events.mjs`,
  `scripts/check-events-seq-contiguity.mjs`, `src/setup/registrations.mjs`,
  `test/state/events.test.mjs`, `test/setup/checks.test.mjs`.
- `docs/platform-foundations.md:69` — L3 ("truth ở JSONL, db là view") is a
  real, currently-binding law as cited; its reopen threshold (line 267-269,
  multi-writer-as-main-load) is unrelated to this item.
- This worktree (`fgw/tsk-cgg`, created via `pick`/`worktree.mjs`) has NO
  `.fgos/` directory materialized on disk at all (`ENOENT`), even though
  `git ls-files .fgos` shows it tracked on this branch — confirms decision
  0020's worktree-worker exclusion is active for pick-created worktrees
  today. Practical consequence for tsk-cgg's own implementation/verify
  work: any interactive check against a live `events.jsonl` must run at the
  main checkout root, not this worktree; the actual test suite
  (`test/state/events.test.mjs`) already uses its own temp fixtures, not
  the real file, so this does not block `npm test` itself.

**Still open (left to planning, per the item's own "quyết lúc plan"):**

- Concrete shape of the fix — direction (a) untrack+snapshot, (b) real
  high-water-mark guard, or (c) both — including the D10/0020 re-decision
  cost of (a) surfaced above.
- Whether historical/forensic detection (diffing committed snapshots across
  git history against expected event counts) is worth building, per the
  item's own closing question.

**Verdict:** clear — intent and technical grounding are both solid enough
to proceed to `exploring`. No new person-facing question raised; the D10
tension above is planning-stage input, not a discovery-stage blocker.

## Round 2 — 2026-08-11 (fgos-coding-exploring, stage `exploring`, tsk-cgg)

**Asked:** (1) Does a prior item already cover this ground more completely
than Round 1 found? (2) How many silent stash-style truncations have
actually happened in the past — can git history answer that?

**Checked and found (repo, cited):**

- **A directly relevant prior item was missed in Round 1:** `tsk-3wq`
  (`docs/history/events-jsonl-merge-driver-recurring-write-loss/`, status
  `retrospective` — merged and done) diagnosed the SAME root vulnerability
  (`.fgos/events.jsonl` both live and git-tracked) via a *different* git
  operation (merge conflicts, not stash) and already recurred **3 times**
  after the first incident (tsk-n4i): tsk-4vo's children, tsk-5td,
  tsk-2x9k. Its D1 explicitly considered and **rejected** "stop-committing
  entirely" (this item's own direction (a)), citing "bigger behavior
  change, loses git history of state changes, needs a new backup/restore
  story." Its fix, now live in the repo:
  - `.gitattributes:12` — `.fgos/events.jsonl merge=union` (git's built-in
    union merge driver, keeps both sides on conflict instead of leaving
    markers).
  - `src/state/events-jsonl-contiguity.mjs` (`checkContiguity`/
    `fixContiguity`) — registered as doctor check `events-jsonl-contiguous`
    + a matching `registerFix` in `src/setup/registrations.mjs:582-590`.
  - **Read in full: this newer check is structurally blind to tsk-cgg's
    own failure mode for exactly the same reason as the older
    `check-events-seq-contiguity.mjs`** — `checkContiguity` only inspects
    the CURRENT file's internal self-consistency (duplicate/gapped `seq`).
    A stash-truncated-then-appended log is, by construction, perfectly
    self-consistent (contiguous 1..N) — this check (and its auto-`fix`,
    which would happily "fix" — i.e. silently accept — a truncated log)
    cannot see it, confirmed by direct code read, not inference.
  - **Conclusion:** tsk-3wq closed the merge-conflict vector. tsk-cgg's
    stash-truncation vector is a genuinely distinct, still-open gap in the
    same root vulnerability — not a duplicate of tsk-3wq, and not
    something tsk-3wq's already-merged fix accidentally also covers.

- **Forensic git-history audit, run for real (not proposed):** walked
  every commit that ever touched `.fgos/events.jsonl` (`git log --reverse
  -- .fgos/events.jsonl`, 273 commits, 2026-07-17 → 2026-08-10) and
  compared each commit's own file content against its **direct first
  parent's** version (`git show <sha>^1:.fgos/events.jsonl`), 272
  parent→child pairs. **Method correction made mid-round:** an initial
  pass compared adjacent entries in the file-touching-commit list
  directly (not parent→child) and found 2 apparent "drops" — both proved
  to be false positives on inspection: `git merge-base --is-ancestor`
  confirmed neither pair is actually ancestor→descendant (they're commits
  from divergent branches that later merged, so an earlier-based commit
  legitimately has a lower seq than a later-dated commit on a different
  branch — not a regression). The corrected parent-relative method is the
  only one that actually measures "did a commit's own change reduce the
  file" and was used for the real result below.
  - **Result: 0 real drops across all 272 parent-child pairs.** No commit,
    relative to its own direct parent, ever reduced `.fgos/events.jsonl`'s
    max-seq or line count, in the entire commit history since
    2026-07-17.
  - **What this does and does not prove:** this is clean evidence that the
    merge-conflict class (tsk-3wq's own target, which by nature produces a
    bad *commit*) has not silently recurred since that fix landed — every
    commit ever made only grew or corrected forward relative to its own
    parent. **It does NOT and structurally CANNOT bound how many
    stash-style truncations happened before tsk-cgg's own** — a
    stash-style truncation corrupts the *working tree* between two
    commits and gets silently built upon by the next round of ordinary
    `appendEvent` calls before anyone commits again, so the next commit
    that touches the file looks like ordinary forward growth from the
    truncated point, indistinguishable in committed history from organic
    growth. This is the same limitation the item's own closing question
    anticipated ("với cơ chế hiện tại thì không thể truy ngược"), now
    confirmed empirically rather than asserted: **git-history diffing is
    not a viable way to quantify past stash-style truncations, at any
    audit depth** — only an external, continuously-updated high-water-mark
    (never itself subject to the same git-operation revert) could have
    caught these as they happened, and none existed until this item.

**Verdict:** clear. Both open Round-1 questions are now answered with
evidence, not deferred: prior art exists but doesn't close this item's
specific gap (confirmed, not assumed), and the historical-audit question
has a definitive, correctly-methodology-checked answer (0 known
merge-class regressions; stash-class incidence is provably unknowable via
git history alone, which is itself the decision-relevant finding).
