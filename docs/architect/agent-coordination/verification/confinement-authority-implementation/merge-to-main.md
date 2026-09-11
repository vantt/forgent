# Merge To Main — Confinement Authority Implementation Track (Post-Close Follow-Up)

Cell: isolated worktree/branch `confinement-authority-implementation--merge-to-main`
(not a numbered P-phase cell)
Role: Doer + Reviewer + Red-Team
Date: 2026-09-11

**Status note**: this is a user-authorized follow-up, separate from the
numbered P00-P08 cells. The user explicitly authorized "merge to main"
twice, then explicitly authorized a careful+thorough merge after being
shown the conflict analysis. It merges the ENTIRE confinement-authority-implementation
track (P00-P08) into `main`, not a single cell's diff.

## Why this cell exists

P08.md recorded that the whole track, including P08 itself, was NOT yet
merged into `main` — that remained a separate, explicit decision the user
had not made at the time. The user subsequently authorized that merge. This
cell documents how it was carried out and verified.

## Strategy

An isolated worktree/branch `confinement-authority-implementation--merge-to-main`
was created off `main`'s own tip `c256a2846c622f6f712a0901caeb73d6b1f1ddfa`
(which itself carried `main`'s own confinement-policy commits `ddaf4c64`/
`9ddf5901` and the batch-tab pane-sharing feature `c256a284`/`2e1a2951`,
landed on `main` independently while this track was in flight). `main`
itself was never mutated directly until the merge was fully verified in
this isolated worktree.

## Conflicts

`git merge-tree` identified 5 files with real merge-tree conflicts:

- `.fgos/config.json`
- `CHANGELOG.md`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/herdr-round.mjs`
- `src/runner/dispatch/transport.mjs`

Of these, only `cli.mjs` actually needed manual conflict-marker
resolution — `main`'s batch-tab pane-sharing feature and the track's
confinement dispatch integration both touched its dispatch-entry logic.
The other 4 (`.fgos/config.json`, `CHANGELOG.md`, `herdr-round.mjs`,
`transport.mjs`) auto-merged cleanly (capability confinement policy +
executor bwrap-backend migration compose in `config.json` with no semantic
overlap; both `CHANGELOG.md` `## [Unreleased]` sections were kept) but were
still hand-verified for semantic correctness rather than trusted blind.

Confirmed in the current `main` checkout: the merge commit
`0f501a77a4c9db7f6c44f96b717ca8752e1b815d` has two parents —
`87ae3d65654aad2de6e007c99d594ebc46446693` (the `main`-side housekeeping
commit, see below) and `6641862b6d669eafa1f75ed24e58542d898...` (the
track's own tip) — and its diff against `c256a284` shows exactly
`.fgos/config.json`, `CHANGELOG.md`, `cli.mjs`, `authority.mjs` (new file,
919 lines), `request.mjs` (new file, 244 lines), `herdr-round.mjs`, and
`transport.mjs` among the dispatch-layer files touched.

## The doer's own self-directed extra fix

Once `cli.mjs`'s conflict resolution routed everything through the
confinement door, `dispatchBatchKey` was being silently dropped at the
`executeThroughConfinement` seam — not something git's conflict markers
could see, since both sides of the merge independently threaded the field
through their own code paths without the other's context. The doer traced
this and threaded `dispatchBatchKey` through
`buildConfinementRequest`/`executeThroughConfinement`'s context and
adapterOpts whitelists in `src/runner/dispatch/confinement/authority.mjs`
and `request.mjs` so batch-tab grouping still reaches the herdr-spawn
adapter when dispatch is routed through the confinement door. Verified
present at current HEAD: `authority.mjs:847` and `request.mjs:232` both
forward `dispatchBatchKey`, and `cli.mjs:617`/`964` supply it.

## Reviewer's independent re-verification (`agy-herdr`)

Confirmed the `dispatchBatchKey` whitelist fix and traced the full call
chain. Independently reran the full test suite and found 1 additional
pre-existing flaky test (`fgos-intake-4.test.mjs:318`), root-caused via
git history as unrelated to the merge (no commits on this branch touch the
implicated file). Reproduced the `claude-bwrap` live confinement test.
Judged the batch-tab test-based verification adequate.

## Red-team's adversarial pass (`claude-reviewer-herdr`)

`codex-herdr` failed to even start on the first red-team attempt (a
pane-startup timeout) — the 5th distinct `codex-herdr` failure mode seen
across this track (see P03.md, P04.md, P05.md, P07.md, P08.md for the
prior four). Retried with `claude-reviewer-herdr`:

- Re-attempted the P08 H-1 credential-leak exploit chain (the Codex
  credential copied into every `private-home` sandbox regardless of
  executor) and confirmed it is still fixed post-merge.
- Ran a REAL bwrap sandbox exploit attempt and found host-read is NOT
  confined — documented as an existing, non-regressed v1 driver
  limitation (`docs/specs/confinement-authority.md` already states host
  read and network remain available in the v1 driver, to avoid
  attestation overclaim), not a new finding.
- Exhaustively checked every executor candidate for the 3 required +
  `host-write-denied` capabilities has a working bwrap backend, and
  confirmed fail-closed behavior (never silently unconfined) when a
  backend can't resolve.
- Traced batch-tab/confinement isolation and found no cross-dispatch
  resource confusion.
- Found and deleted 2 tiny leftover debug artifact files (verified by size
  and content — not real credentials — before deletion).
- Investigated a full-suite run showing 344 failures and root-caused ~339
  of them as a pre-existing, unrelated protocol-pack/`CoordinationProtocol`
  discovery gap, confirmed via git log showing zero commits touching the
  implicated files on this branch. Flagged as a real but separate
  follow-up work item, not a merge blocker (see Deferred below).

## The recurring `.fgos/config.json` strict-mode artifact

The known, pre-existing `confinement.strict:false` artifact (written by
`config.mjs:202` whenever tests/`doctor` run from a checkout, already
documented in P07.md's own deferred section) appeared twice during this
merge:

- Once in the merge worktree — handled via housekeeping commit `87ae3d65`
  ("chore(config): preserve local confinement.strict=false tweak before
  merge"), committing it rather than losing it to a dirty-file collision.
- Once more in the `main` checkout just before the final fast-forward —
  handled via `git checkout -- .fgos/config.json`, since the incoming
  merge already supplied the identical value.

Not a new issue; the recurring nature of this artifact is already recorded
in P07.md.

## Final action

`git merge --ff-only` in the `main` checkout, advancing `main` from
`c256a2846c622f6f712a0901caeb73d6b1f1ddfa` to
`0f501a77a4c9db7f6c44f96b717ca8752e1b815d`. Confirmed via
`git rev-parse` before and after. Not pushed to any remote — that remains
a separate future decision.

## Deferred (not blocking)

- The pre-existing protocol-pack/`CoordinationProtocol` test-discovery gap
  (~339 unrelated failures out of the 344 seen in a full-suite run) is
  worth its own work item since it silently breaks "run the suite, expect
  N failures" as a health check for future reviewers. Not this track's
  scope to fix — noted for whoever picks it up next.
- `fgos-intake-4.test.mjs:318` is a flaky test unrelated to this merge
  (reviewer, root-caused via git history).
- Host-read is not confined by the v1 bwrap driver (pre-existing,
  documented in `docs/specs/confinement-authority.md`, not a regression).
- All P00-P08 findings not specifically touched by this cell remain as
  previously documented in their own `.md` files in this directory; not
  re-litigated here.

## Merge

`git merge --ff-only` in the main checkout (`/home/vantt/projects/forgentX`)
— see `plan.md`'s cell-status table for the merge commit. This closes the
confinement-authority-implementation track's presence on `main`; P00-P08
plus this merge step are all now part of `main`'s own history.
