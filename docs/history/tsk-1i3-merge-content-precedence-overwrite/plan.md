# tsk-1i3 — merge-content-precedence-overwrite — plan

Mode: high-risk

Flags counted per `fgos-routing`'s Mode gate: **data loss** (hard-gate —
this item exists because a real commit destroyed 4 live `.fgos/*.jsonl`
files, D1-D4), **existing covered behavior** (`.githooks/pre-commit`
already carries e2e coverage in
`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`, tsk-56u/
tsk-5pb), **public contracts** (the hook's refuse/allow behavior is
user-visible to anyone committing to this repo, any actor, per the hook's
own header comment). One hard-gate flag alone forces high-risk regardless
of total count.

## Approach

**Chosen path:** add a fourth check to `.githooks/pre-commit`'s existing
chain (alongside `stagedFgosDeletions`, `stagedFgosChangesOnWorkerBranch`,
`staleWorktreeIndexRefusal`) that runs when `HEAD` is the main checkout's
own default branch (not `fgw/*`, i.e. the exact case none of the three
existing checks cover) and refuses any staged **modification**
(`--diff-filter=M`, matching a tracked path that already exists at
`HEAD`) under `.fgos/` whose new per-file line count is lower than the
line count `HEAD`'s own blob for that same path already has — D1/D2/D4.
No bypass flag — D3.

**Alternatives rejected:**
- Extending `merge.mjs`'s own `fgos-write-rejected` check instead —
  rejected per D1: that check only runs inside `mergeRunnerItem`, which a
  manual `git merge` bypasses entirely (the incident's own confirmed
  shape); it cannot close a gap outside its own call path.
- Scoping the new check to merge commits only (parent count ≥ 2) —
  rejected per D2: the invariant is content-precedence, not "is this a
  merge"; scoping by parent count adds a distinction the check does not
  need, since a legitimate single-parent commit (periodic checkpoint)
  trivially satisfies "no line-count decrease" by construction (it only
  appends).
- Full content-hash/semantic diffing instead of a line-count heuristic —
  rejected per D4: costs real latency on a path that must stay cheap
  enough to run on every commit; a line-count-non-decrease check already
  catches the observed failure class (the incident's own diff removed 352
  lines from `events.jsonl`) without needing exact content-identity
  proof.

**Files touched, in order:**
1. `.githooks/pre-commit` — add the new check function (same shape as
   the three existing ones: read `git diff --cached --name-only
   --diff-filter=M`, filter to `.fgos`/`.fgos/`-prefixed paths, compare
   `git show HEAD:<path> | wc -l` against the staged blob's own line
   count via `git show :<path> | wc -l`), wire it into `main()` gated on
   `hookRunsAtHome(repoRoot, committingToplevel)` being **false** for the
   `fgw/*` case already handled elsewhere and **true**/default-branch for
   this new case — mirrors the existing `currentFgwBranchIfMainCheckout`
   call site's own placement, right where `hookRunsAtHome` is already
   checked.
2. `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — extend
   with the new test cases (see Shape below). No new test file: this file
   already holds every sibling `.fgos/`-on-main-checkout scenario
   (tsk-56u/tsk-5pb tests at lines 296-378), and its
   `initSharedAbsoluteHooksPathFixture()` helper already builds exactly
   the fixture shape (`mainRoot` with a tracked, committed
   `.fgos/state.json`) this item's own tests need.

`fgos graph --json` was run (`componentCount: 550`, whole-repo view) —
this item has no sibling piece to sequence against (single file + its
test, no split, both deps `tsk-1vc`/`tsk-56u` already `delivered`), so
`criticalPath`/`topUnblock` do not change this ordering; noted as checked
per the Approach step's own requirement, not as a driver of this
particular order.

**Impact-analysis posture: degraded** (per CONTEXT.md's own scout
evidence — GitNexus `present` but stale-indexed). Evidence for this plan
gathered by direct `grep`/`Read` of `.githooks/pre-commit` and the test
file instead, cross-checking the posture per `CLAUDE.md`'s own gate
instruction.

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| New content-precedence check itself | High — this IS the data-loss-prevention mechanism (D1-D4); a bug either fails to catch a real regression (repeats the incident) or false-positive-blocks a legitimate commit | e2e test reproducing the incident's own shape: a commit on the default branch staging a `.fgos/*.jsonl` **modification** with fewer lines than `HEAD` must be refused; a same-or-more-lines modification must succeed |
| Compatibility with the 3 existing tsk-56u/tsk-5pb "allowed on main" tests (`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:333,361`) | Medium — verified directly by reading the fixture (`initSharedAbsoluteHooksPathFixture` seeds `.fgos/state.json` as `{}\n`, both existing tests rewrite it to a different but still single-line JSON body, so line-count-non-decrease holds for all of them as read) — this was a manual read, not a run | Run the existing e2e file (`npm test -- test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`) after the change lands, before the full-suite verify, to confirm the read holds under real execution |
| Compatibility with `mergeRunnerItem`'s own legitimate merge commit (`fgos approve`) | Medium — the new hook-level check fires on every commit, including the `git commit --no-edit` `mergeRunnerItem` itself makes after its own prior `fgos-write-rejected` check already passed clean; a disagreement between the two checks would false-positive-block a real approve | e2e test asserting a commit shaped like a legitimate append-only `.fgos/*` merge (matching `merge.test.mjs`'s own fixture pattern for a clean `fgos-write-rejected`-passing merge) is not refused by the new hook check |
| A brand-new file added under `.fgos/` (no `HEAD` baseline) | Low — must not be refused; nothing to regress against | Scoped out structurally by `--diff-filter=M` (only matches already-tracked paths); e2e test asserting a genuinely new `.fgos/` file (addition, not modification) still succeeds |
| Performance | Low — a per-file `wc -l` on two small blobs, only for staged `.fgos/*` paths on the rare commit-time path (not every commit touches `.fgos/`) | None needed — pinned assumption per D4, no proof point required |

## Shape

Concrete cases to prove (standard/high-risk depth):
- **Boundary — brand-new `.fgos/*` file added:** not refused (no `HEAD`
  baseline to compare against).
- **Existing behavior that must not regress:** the 3 already-covered
  tsk-56u/tsk-5pb "allowed on main" cases, plus every other existing test
  in `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` and
  `test/e2e/main-checkout-lock-hook.test.mjs` (full-suite run, not just
  the touched file).
- **The regression itself — the incident's own shape:** a commit on the
  default branch staging a `.fgos/*.jsonl` modification with strictly
  fewer lines than `HEAD` is refused, with a message naming the file(s)
  and the fact that main is left unchanged (matching the existing
  `refuse()` helper's own message shape and `docs/how-to/
  fix-fgos-write-rejected-merge-block.md`'s established pointer pattern).
- **Concurrent access:** already owned by the existing STR65
  main-checkout-lock check earlier in `main()` — this item does not
  re-solve concurrency, only content-precedence on whatever commit
  actually gets to run.
- **Partial failure (git itself erroring mid-check):** fail-closed, same
  pattern the sibling `staleWorktreeIndexRefusal` checks already use for
  an unreadable ref/reflog — refuse rather than silently let the commit
  through.

## Split decision

No split. One coherent piece: one new check function in one existing
file, tested by extending the one existing e2e file that already covers
every sibling scenario for this exact hook. Proceeds as itself.

## Verify

`npm test` — full suite, per this repo's own DoD bar (`AGENTS.md`); a
change to a git hook that gates every commit against this checkout is
exactly the kind of shared-contract change that needs the whole suite
green, not a narrowed slice.

## Outstanding questions

None
