# events-jsonl-merge-abort-truncation-gap — RESEARCH

## Round 1 — 2026-08-20 (tsk-1ji, discovery stage)

**Asked:** Audit every git operation fgOS itself runs against the shared
main checkout's working tree (checkout/reset/clean/stash, including
anything inside `approve`/`sync-root`'s own postLand examine loop) that
could discard tracked-but-uncommitted content, specifically
`.fgos/events.jsonl`'s own uncommitted tail — so discovery can judge
whether a "stash/restore events.jsonl around any such git op" or "hold
events.lock for the duration of such git ops" fix is concretely feasible
given the real call sites.

**Checked (repo search, `rg` + direct reads):**

- `rg -n "'(checkout|reset|clean|stash)'" src bin --glob '*.mjs' -i` — six
  hits total:
  - `bin/fgos.mjs:3993` `gitAt(repoRoot, ['reset', '--hard', sha])` —
    `main-checkout-reset` verb, explicit `--confirm`-gated, human-invoked
    recovery tool, not an automatic path.
  - `src/runner/session.mjs:124` `gitAt(worktreePath, ['checkout', '--',
    '.fgos'])` — `restoreTrackedFgos`, own docstring states "Scoped
    strictly to THIS session's own worktree; the shared repoRoot `.fgos/`
    store is never touched" (lines 102-114). Not a risk to the main
    checkout.
  - `src/runner/loop.mjs:798-799` `git reset --hard`/`git clean -fdq` run
    with `{ cwd: wt.path }` — a claim worktree path, not `repoRoot`.
  - `src/runner/worktree.mjs:858,981` `git(repoRoot, ['-C', worktreePath,
    'reset', '--hard', branchTip])` — explicitly `-C worktreePath`, i.e.
    targets a linked worktree's own tree, not the main checkout's working
    directory, even though the `git` process itself launches from
    `repoRoot`.
  - **None of the six hits perform a checkout/reset/clean against the
    main checkout's own working tree outside the human-gated
    `main-checkout-reset` recovery verb.**
- `rg -n "stash" src bin --glob '*.mjs' -i` — no `git stash` call
  anywhere in fgOS's own source. Only a permissions-allowlist regex entry
  (`src/setup/agy-permissions.mjs:49`, `'command(regex:^git stash)'`) and
  comments in `events-jsonl-truncation-guard.mjs`/`registrations.mjs`
  naming "stash/checkout/reset/clean" as the generic known-cause class —
  none of those comments point at an actual `git stash` call site inside
  fgOS. This means the truncation-guard's own doc comment names a
  human-run raw-git-command class as one plausible trigger, not (only) an
  fgOS-internal call.
- `rg -n "repoRoot" src/verbs/merge/approve.mjs src/verbs/merge/sync-root.mjs`
  filtered to git/checkout/reset/clean/stash — no direct git tree-mutating
  call in either file itself; both delegate the real git work to
  `src/runner/merge.mjs`'s `mergeRunnerItem`/`mergeRunnerItemLocked`.
- **`src/runner/merge.mjs:1074-1098` `abortMergeIfPossible(repoRoot)`** —
  runs `git(repoRoot, ['merge', '--abort'])` whenever `MERGE_HEAD` exists,
  called from `mergeRunnerItemLocked` at lines 1196/1224/1262/1278/1299
  (every failure branch after the `git merge --no-commit --no-ff branch`
  attempt at line 1158). `git merge --abort` restores the ENTIRE working
  tree to its pre-merge-attempt HEAD state — functionally a hard reset —
  discarding any uncommitted change made to any tracked file (including
  `.fgos/events.jsonl`) during the window between the `--no-commit
  --no-ff` attempt and the abort call, regardless of whether that change
  has anything to do with the merge conflict itself.
- **Lock-ownership check** — is that merge/abort window protected against
  a concurrent `appendEvent` write to `.fgos/events.jsonl`?
  - `mergeRunnerItem` acquires `acquireMainCheckoutLock` (`src/runner/
    merge.mjs:773,894`, imported from `src/runner/main-checkout-lock.mjs`)
    for the duration of the merge attempt, including the abort branches.
  - `appendEvent` (`src/state/events.mjs:459`) acquires a DIFFERENT lock,
    `acquireEventsLock`/`.fgos/events.lock` (`src/state/events.mjs:351-
    389`).
  - `src/runner/main-checkout-lock.mjs:7-14` states this in its own header
    comment, by design: "a FOURTH, wholly independent instance of the
    wx-atomic-create + stale-pid-reclaim lock lineage ... this module
    touches neither runner.lock, sessions.lock, nor events.lock."
  - **Conclusion: the two locks never coordinate.** A concurrent session's
    `appendEvent` call (which only needs `events.lock`) can land between
    `git merge --no-commit --no-ff` and `git merge --abort` while a THIRD
    session's merge attempt holds `main-checkout-lock` — and that write
    gets silently discarded by the abort's tree-wide reset. This matches
    tsk-1ji's own diagnosed shape exactly: "the tracked, uncommitted-tail
    `.fgos/events.jsonl` reverting to an older committed snapshot while
    fgos verbs keep appending on top."
- `rg -n "events\.jsonl" src/runner/merge.mjs` — two hits, both comments;
  no special-case handling of `.fgos/events.jsonl` exists anywhere in the
  merge machinery today (no stash/restore around the merge attempt, no
  lock bridging).
- **Distinguished from a closely-related but DIFFERENT already-fixed
  issue** — `docs/history/events-jsonl-merge-driver-recurring-write-loss/
  CONTEXT.md` (tsk-3wq, status: done) diagnosed and fixed a different
  mechanism: git's default line-based 3-way merge silently corrupting
  `.fgos/events.jsonl`'s CONTENT when two branches' committed versions of
  the file actually conflict during `git merge --no-commit --no-ff`. Its
  landed fix is `.fgos/events.jsonl merge=union` in `.gitattributes`
  (checked directly — present, comment cites tsk-3wq). A `merge=union`
  driver only runs when git's merge algorithm actually processes
  conflicting hunks of that file; `git merge --abort` never invokes any
  merge driver — it is a straight revert-to-pre-merge-HEAD, so **tsk-3wq's
  fix does not, and structurally cannot, close the mechanism this round
  found.** The two items are adjacent but non-overlapping halves of the
  same "`.fgos/events.jsonl` is a git-tracked append-only log with no
  append-log-aware protection against ordinary git operations" problem
  family.

**What remains open:** which concrete remedy to implement is a planning-
stage engineering choice, not a fact gap — e.g. hold `events.lock` for the
duration of `mergeRunnerItemLocked`'s merge-attempt-through-abort window,
or snapshot/restore `.fgos/events.jsonl`'s live tail around the same
window, or move the truncation-guard check to run opportunistically right
after every `abortMergeIfPossible` call. No further repo fact is needed to
choose between these; they are implementation trade-offs a planning pass
can resolve directly.

## Recovered rounds (folded in during planning) — originally
`docs/history/tsk-1ji-truncation-guard-realtime-gap/RESEARCH.md`, an
untracked file already sitting in this claimed worktree from an earlier,
interrupted attempt at this same item (never committed, discovery verdict
never applied — the item was still at stage `discovery` when this session
picked it fresh). Preserved verbatim below, unedited, as its own three
dated rounds; the stray duplicate folder is removed once this copy lands.

### Round 1 (2026-08-20, recovered) — which git ops fgOS itself runs against the main checkout's working tree that could discard `.fgos/events.jsonl`'s uncommitted tail

**Asked:** List every git operation fgOS itself runs against the main
checkout's own working tree that could silently discard
`.fgos/events.jsonl`'s uncommitted tail (stash/checkout/reset/clean-class
ops), with file:line citations — feeds tsk-1ji's improvement direction (b)
("audit every git operation fgOS itself runs against the main checkout's
own working tree ... and ensure none of them can ever discard
`.fgos/events.jsonl`'s own uncommitted tail").

**Checked:**
- `rg -n "git stash|git checkout|git reset|git clean" src/runner src/state --glob "*.mjs"` — no literal-string hits outside comments/error messages.
- `rg -n "'stash'|'checkout'|'reset'|'clean'" src/runner src/state --glob "*.mjs"` (array-arg form, the actual call shape) — 6 real call sites, all read directly:
  - `src/runner/session.mjs:124` — `gitAt(worktreePath, ['checkout', '--', '.fgos'])`, inside `restoreTrackedFgos`. Own docstring (lines 102-114) states explicitly: "Scoped strictly to THIS session's own worktree; the shared repoRoot `.fgos/` store is never touched." Confirmed by the `worktreePath` argument — never called with the main checkout root. Not a candidate.
  - `src/runner/loop.mjs:798-799` — `execFileSync('git', ['reset', '--hard', dispatchBaseline], { cwd: wt.path, ... })` + `['clean', '-fdq']` same cwd. `wt.path` is a dispatch worktree object, not the main checkout. Not a candidate.
  - `src/runner/worktree.mjs:858` and `:981` — `git(repoRoot, ['-C', worktreePath, 'reset', '--hard', branchTip])`. The `-C worktreePath` flag redirects git's actual working directory to the linked worktree even though `repoRoot` is passed as the exec cwd for the git binary — targets the worktree, not the main checkout. Not a candidate.
  - `src/runner/main-checkout-reset-guard.mjs` (whole file) — backs the `main-checkout-reset` CLI verb (`bin/fgos.mjs:3971-3990`). This DOES run `git reset --hard` on the main checkout, but only on explicit human invocation with `--sha <sha> [--confirm]`; `assertSafeMainCheckoutReset` refuses when the tree is dirty and `--confirm` was not passed, after showing the full `git status --porcelain` (whole-repo scope). Confirmed via `bin/fgos.mjs:4193-4195`: `main-checkout-reset` is deliberately excluded from `STORE_MISSING_WARNING_VERBS`'s degrade-safe warning set because "it is destructive, not merely read-stale" and gets its own hard refusal (tsk-5iv D1, tsk-3au). Never called automatically by `pick`/`return`/`approve`/`submit` — grep confirms no internal caller, only the CLI `case 'main-checkout-reset':` switch arm. Ruled out as an *automatic* loss vector; already correctly gated for the human-invoked path.
- `rg -n "'stash'|stash" src/runner src/state --glob "*.mjs"` — **zero real call sites**. The only 3 hits are comments/error-message text referencing "stash/reflog" (main-checkout-reset-guard.mjs:7) and "stash/checkout/reset/clean" (events-jsonl-truncation-guard.mjs:3,130 — the guard's own error message naming the known failure class). **fgOS's own code never runs `git stash` anywhere.** The original tsk-cgg incident (2026-08-10 `git stash push`, documented in `docs/history/events-jsonl-git-tracked-truncation/CONTEXT.md`) was a human running `git stash` directly on the shared main checkout outside fgOS's verb layer entirely — not an fgOS-internal call.
- `src/runner/merge.mjs` full grep of `execFileSync('git'|gitAt\(|git\(repoRoot` (35 matches) read in context around every `merge`/`reset`/`clean`-adjacent hit:
  - `abortMergeIfPossible(repoRoot)` (`merge.mjs:1074-1098`) calls `git(repoRoot, ['merge', '--abort'])` directly on `repoRoot` — the main checkout, no `-C` redirect. This is a REAL candidate site.
  - It is called from `mergeRunnerItemLocked` at two points: (1) `merge.mjs:1196`, when the initial `git merge --no-commit --no-ff branch` throws and the failure is not the one self-resolvable decision-index collision shape; (2) **`merge.mjs:1221-1229`, specifically when the merge staged ANY change under `.fgos/`** (`stagedPaths.filter(p => p === '.fgos' || p.startsWith('.fgos/'))`), the exact class of file at risk for tsk-1ji.
  - `git merge --abort` is `git reset --merge` under the hood: per git's own documented semantics, it resets tracked-and-differing-from-target files back to the pre-merge commit, but is supposed to preserve any file that ALSO differs between the index and working tree (i.e., has further uncommitted changes on top) — normally by refusing ("entry not uptodate") rather than silently discarding. Whether that safety holds for `.fgos/events.jsonl` specifically, when a concurrent `appendEvent` writes to the working-tree file in the narrow window between `git merge --no-commit --no-ff` staging a `.fgos/` change and this abort call reverting it, is NOT yet confirmed empirically — this round only located and read the call site, it did not reproduce or trace the interleaving. Flagged as the single concrete open item for a `planning`/`validating` pass to either confirm empirically or treat as the working hypothesis.

**Found:**
- fgOS's own automated code has exactly ONE risky main-checkout git-abort site: `merge.mjs:1224`'s `abortMergeIfPossible(repoRoot)` call, reached only when a merge attempt staged a `.fgos/`-prefixed path. No `stash` call exists anywhere in fgOS's own code. The two `reset --hard`/`clean -fdq` call sites (`loop.mjs`, `worktree.mjs`) and the one `checkout -- .fgos` call (`session.mjs`) are all scoped to linked worktrees, never the main checkout. The one main-checkout `reset --hard` verb (`main-checkout-reset`) is human-invoked-only and already gated (tsk-3au/tsk-5iv).
- This means direction (b) ("audit every git operation... and ensure none of them can ever discard the uncommitted tail") is narrow in scope for fgOS's OWN automated operations — one call site, not a sprawling audit — but CANNOT close the class the original tsk-cgg incident actually documented, since that incident was a human running `git stash` directly, outside any fgOS verb fgOS's own audit could ever reach. Direction (b), scoped to fgOS-internal ops only, addresses a theoretical/narrower risk (the merge-abort site) than the one incident on record (human-run `git stash`).

**Still open:** whether `git reset --merge`'s "keep if working-tree-vs-index differs" safety actually holds for `.fgos/events.jsonl` under the specific interleaving above (empirical confirmation, not yet attempted this round — a candidate for `validating`, not `discovery`).

### Round 2 (2026-08-20, recovered) — does wiring the truncation guard into pick/return/approve's lock acquisition conflict with tsk-cgg's locked D3, and does `return` even have a lock-acquisition site to wire into

**Asked:** tsk-1ji's own description proposes improvement direction (a):
"run this check far more frequently ... e.g. opportunistically inside
`appendEvent` itself, or wired into pick/return/approve's own
main-checkout-lock acquisition." tsk-cgg's locked D3
(`docs/history/events-jsonl-git-tracked-truncation/CONTEXT.md`) says the
guard "is never wired into `appendEvent`'s own hot write path (every
`fgos` verb call must keep succeeding even mid-incident)." Does direction
(a) conflict with D3? Does `return` actually have a main-checkout-lock
acquisition site to hook into, as the item's own text assumes?

**Checked:**
- `rg -n "acquireMainCheckoutLock\(" bin/fgos.mjs src/runner --glob "*.mjs"` (excluding tests and the lock module's own definition/comments) — 5 real call sites:
  - `src/runner/claim-port.mjs:104` (`claimWork`) — backs `pick`/`take`, the one door for claiming an item. Runs once per claim, not once per event append.
  - `src/runner/merge.mjs:773` and `:894` — backs the merge-landing path used by `approve`/`sync-root`. Runs once per merge attempt, not once per event append.
  - `bin/fgos.mjs:3883` — the `unlock` verb itself (clears the lock), unrelated to pick/return/approve's own write flow.
  - No other call sites exist.
- Searched the full `case 'return':` body in `bin/fgos.mjs` (lines 3030-3341) for `acquireMainCheckoutLock` — **zero hits**. Confirmed `moveWork` (`src/state/store.mjs:562`, what `return` ultimately calls) also never calls it — grep across `src/state/*.mjs` for `acquireMainCheckoutLock` returns nothing. **`return` does not acquire `main-checkout-lock` at all, today.** tsk-1ji's own description is factually imprecise on this point: "wired into pick/return/approve's own main-checkout-lock acquisition" assumes a lock-acquisition site on `return` that does not exist in the current codebase. A `return`-side hook would need a different site (e.g. inside `return`'s own body directly, not "the lock acquisition" — `return` never takes this lock because it does not need main-checkout-exclusive access the way claiming/merging do) or the item's scope needs to drop `return` from direction (a)'s literal wording.
- Read `checkTruncationGuard`/`computeGuardMark` (`src/state/events-jsonl-truncation-guard.mjs:44-136`) in full: the check reads and line-splits the ENTIRE `.fgos/events.jsonl` on every invocation (`raw.split("\n")`, O(file size), no incremental/tail-only read). At the incident's own reported scale (seq in the low-20000s) this is milliseconds in Node, not a real latency concern for a once-per-pick/once-per-approve call, but it is real work each time — flagged for planning to size/confirm on the current file, not assumed free.
- D3's own wording ("never wired into `appendEvent`'s own hot write path") is specifically about the highest-frequency site — one call per event, i.e. potentially many times per second across concurrent sessions — and gives the reason: "every `fgos` verb call must keep succeeding even mid-incident," i.e. the guard must never become a write-path gate that could fail a `fgos` call. `claimWork`'s and `merge.mjs`'s lock-acquisition sites are a different, much coarser granularity (once per `pick`/once per `approve`, not once per append) and, if implemented the same way tsk-cgg's own CI wiring already is — detect-and-report only, never gate or block the calling verb on a bad result — do not violate D3's actual constraint. D3 rules out blocking `appendEvent`; it does not rule out a non-blocking, coarser-grained check elsewhere.

**Found:**
- Direction (a) does NOT structurally conflict with tsk-cgg's D3, provided any new wiring stays non-blocking (detect-and-report, same posture as the existing `npm test`/doctor wiring) and targets `claimWork`'s/`merge.mjs`'s lock-acquisition sites rather than `appendEvent` itself.
- The item's own description is imprecise about `return`: it has no `main-checkout-lock` acquisition to hook into today. A real plan for direction (a) needs to either drop `return` from the "wire into lock acquisition" framing, or pick a different hook site inside `return`'s own body (e.g. at the top of the case, unconditionally, not gated on lock acquisition since none exists).
- The check's cost is real (whole-file read+split) but small at the incident's current scale — not a blocker, but should be sized for planning rather than assumed negligible.

**Still open:** none for this specific question — clear enough to inform planning's scope choice between (a)/(b)/both.

### Round 3 (2026-08-20, recovered) — is there an existing work item already covering direction (a) or (b), to avoid duplicate work

**Asked:** Beyond tsk-1ji itself, is any other work item already proposing or covering (a) wiring the truncation guard into a more-frequent check site, or (b) auditing/hardening fgOS's own main-checkout git operations against discarding `.fgos/events.jsonl`'s uncommitted tail?

**Checked:**
- `node bin/fgos.mjs list --all --json --dir <root>`, scanned every item's title+description (lowercased) for `truncat`, `main-checkout-lock`, `abortMergeIfPossible`, `opportunistic`, `realtime`, `appendEvent` — 39 matches, all read. Grouped:
  - Directly on point, already accounted for: tsk-cgg (done, built the detection-only guard this item extends), tsk-3wq (done, unrelated merge-conflict class), tsk-24e (`doing` — the live symptom report tsk-1ji itself traces back to, still open, not a duplicate — it's the upstream trigger), tsk-64o (`delivered` — a related but distinct mergedSha-diagnostic-logging gap, already cited by tsk-1ji itself).
  - One near-miss requiring a direct check: **tsk-4fu-1** (`wontfix`, parent tsk-4fu also `wontfix`) — "Dieu tra root cause truncation events.jsonl khi verb ghi state chay tu cwd worktree" (investigate truncation root cause when a verb writes state run from worktree cwd). Read in full: a DIFFERENT failure mechanism (a verb writing to `.fgos/` while `cwd` is a linked worktree instead of the main checkout, per ADR0020's ".fgos never materializes in a worktree" rule — a wrong-target-path bug, not a git stash/checkout/reset/clean revert of the main checkout's own working tree) and already closed `wontfix`. Not overlapping with either of tsk-1ji's proposed directions.
  - Every other match is main-checkout-lock plumbing/race work (tsk-53f, tsk-3oa, tsk-2tm, tsk-2rf, tsk-45z, tsk-6c2, tsk-4l8, tsk-1d9, tsk-24t, etc.) — all about lock correctness/contention, none about wiring the truncation guard into the claim/merge flow or auditing git ops for tail-discard risk.

**Found:** no duplicate/overlapping open work found for either direction (a) or (b). tsk-1ji is the first item proposing to close this specific efficacy gap.

**Still open:** none.

### Round 4 (2026-08-20) — tsk-24e's own parked question, and the scope boundary this item draws against it

**Asked:** tsk-24e (this item's own dependency) is `status: doing`,
`stage: exploring`, currently parked `awaiting-human` with its own open
question. Does that question overlap with what this item is about to fix?

**Checked:** `fgos show tsk-24e --json` — its `discovery[0].question` cites
`docs/history/tsk-24e-events-loss-post-fix-gap/RESEARCH.md`, which traced
three already-merged fixes (tsk-1q5, tsk-3wq, tsk-2tm) against fresh
2026-08-20 loss evidence and found a real, never-implemented gap: nothing
in `src/` ever git-commits `.fgos/events.jsonl` automatically, exposing it
to "a concurrent session's raw `git reset --hard`/`git checkout -f`/`git
clean -fd` on the shared main checkout." tsk-24e's own park asks a person
to choose between (a) a code-level guard on raw force-checkout/reset, (b)
a periodic auto-commit cadence, (c) both, (d) other — and does not mention
`abortMergeIfPossible` or any fgOS-internal merge-abort mechanism
anywhere.

**Found:** tsk-24e's own research frames the threat as a human/session
running raw git commands directly, outside any fgOS verb — a different
trigger from this item's own fgOS-internal `abortMergeIfPossible` finding.
The two are adjacent (same shared file, same broad "uncommitted tail gets
discarded" shape) but non-overlapping in mechanism. This item's fix does
not answer tsk-24e's own parked question and does not attempt to; see
plan.md's "Scope boundary against tsk-24e" for the boundary this item
draws.

**Still open:** none for this item's own scope decision — tsk-24e's own
park remains a separate, still-open question for a person to answer on
tsk-24e itself.

## Round 5 — 2026-08-20 (tsk-1ji, validating stage — empirical falsification)

**Asked:** plan.md's own required proof point (Concurrent-access sketch):
does `git merge --abort` actually silently discard a concurrent
`.fgos/events.jsonl` append, as the plan's Approach section hypothesized,
or does git's documented "refuse if uncommitted" safety hold? Reproduced
directly against three throwaway git fixtures (not the live repo) —
this is a Tier-A action per `fgos-coding-validating`'s own Gate Step 1
("is there a valid action in reach that closes the gap... run the
command"), run before accepting or rejecting the plan.

**Checked (all three fixtures: real `git` binary, real commands, full
output captured):**

1. **events.jsonl untouched by the merge's own diff, concurrent append
   during the conflict window, then `git merge --abort`.** Real conflict
   forced on an unrelated file (`conflict.txt`). Result: abort exits `0`,
   and the concurrently-appended line (`line2-concurrent-append`) is
   **preserved** in `events.jsonl` after the abort. Git's documented
   "leave alone what the merge never staged" safety holds exactly as
   documented.
2. **events.jsonl staged by the merge's own `merge=union` driver (the
   exact `.fgos/`-path trigger at `merge.mjs:1218-1231`), THEN a
   concurrent append lands on top of that staged content, THEN `git merge
   --abort`.** Result: abort **fails outright** — `error: Entry
   'events.jsonl' not uptodate. Cannot merge. / fatal: Could not reset
   index file to revision 'HEAD'.`, exit code `128`. The concurrently-
   appended line **survives** (the abort never completed). This is the
   scenario Round 1's recovered research flagged as the one needing
   empirical confirmation — confirmed, and the opposite of what this
   item's plan assumed: `abortMergeIfPossible`'s own try/catch
   (`merge.mjs:1223-1230`) already converts this into a loud `MergeError`
   thrown up to the caller, not a silent success. The real, different bug
   this scenario exposes: the main checkout is left in a broken,
   half-aborted git state (`Could not reset index file to revision
   'HEAD'`) requiring manual recovery — a main-checkout availability
   problem, not a silent-data-loss problem.
3. **events.jsonl already dirty (uncommitted) BEFORE the merge attempt
   even starts — the realistic case, since nothing in `src/` auto-commits
   `.fgos/events.jsonl` (tsk-24e's own finding) — and the target branch
   also touches events.jsonl.** Result: the initial `git merge --no-commit
   --no-ff branch` call itself **refuses outright**, before `MERGE_HEAD`
   is ever created: `error: Your local changes to the following files
   would be overwritten by merge: events.jsonl`. No abort ever runs
   (`mergeHeadExists` correctly reads false — `abortMergeIfPossible`'s
   existing tsk-2j9 early-return no-ops). The uncommitted content is
   completely untouched.

**Found:** none of the three realistic interleavings this item's plan
could construct reproduce "silently reverting the tracked, uncommitted-
tail `.fgos/events.jsonl` to an older committed snapshot" — the exact
symptom this item's own description, and the real tsk-24e/tsk-4oq
incident, report. In every fixture, git's own safety either preserved the
uncommitted content or refused the operation loudly (never silently). The
`abortMergeIfPossible` mechanism this item's Approach was built around is
**empirically falsified** as the explanation for the real incident, at
least for every interleaving this round could construct. This is a
genuine reality-gate FAIL on plan.md's own "Assumptions" dimension, not a
minor note — see `plan.md`'s status and the hand-back this triggers.

**Still open:** what the real mechanism behind the tsk-4oq/tsk-6al losses
actually is. Candidates not yet ruled out: a human/session running a raw
git command directly (tsk-24e's own working hypothesis, outside any
fgOS-internal audit's reach); some other fgOS-internal code path this
round's three fixtures did not construct; or a race this round's
single-process, sequential-step simulation cannot reproduce (a genuinely
concurrent second `fgos` process writing mid-syscall, as opposed to this
round's own before/after ordering). This is exactly the kind of
scope-changing gap `fgos-coding-planning`'s Step 6 hands back to
`fgos-coding-exploring` for — not something this round's own tools can
resolve further without a person's input on where to look next.
