# Review R3 (FINAL) — tsk-3tp sweep-checkpoint redesign (spec/safety lens)

Branch under review: `fgw/tsk-3tp` (worktree
`.claude/worktrees/tsk-3tp-0YK44Z`), HEAD `c784cb9e`. Scope per task: cross-
check shipped code against the locked D1-D4 decisions, confirm ADR0020 has
no exception, confirm the Install/setup/doctor gate is satisfied
(config-merge half), confirm CHANGELOG, confirm docs don't contradict code.
Review only — nothing fixed.

## 1. Full test suite

Command: bare `node --test` (no args, no npm wrapper — `npm test` is known
broken on this Node version), full run, ~2m43s.

```
ℹ tests 3882
ℹ pass 3875
ℹ fail 2
ℹ cancelled 0
ℹ skipped 5
```

Failures:

1. `herdr-plugin/web/src/api/client.test.ts` — the documented, unrelated,
   pre-existing failure. Confirmed unrelated (not in this branch's diff).
2. `test/runner/claim-port.test.mjs`: *"claimWork reads the event log fully
   4 times per call, not 6 or 7"* — got `6`, expected `4`. **Not a
   regression introduced by this branch.** Verified by direct A/B: checked
   out `main` in a disposable worktree (`git worktree add --detach`) and
   ran the same test file in isolation — on `main` it fails **`8` vs
   expected `4`**, strictly worse. This branch's own change (removing the
   `getUncommittedEventCount` call from the D2 fallback path, which used to
   do 2 extra full-file reads) *improves* the count from 8→6, it does not
   cause it. R2's report separately flagged this same test as tracked
   pre-existing flake `tsk-3tb`, and showed it goes green under
   `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` — a non-default env var, not part
   of this task's mandated bare `node --test` invocation, which is why it
   still shows red here. Non-blocking, already tracked, this branch does
   not worsen it.

Net: genuinely green modulo the one documented pre-existing issue
(herdr-plugin) **plus** one already-tracked, pre-existing, non-regressed
flake (`tsk-3tb`) that this run's un-flagged mandated command surfaces.
Neither is caused by this diff.

## 2. D1-D4 cross-check (CONTEXT.md) against shipped code

- **D1 (`.fgos` stays in-repo git history)** — untouched; no nested-repo/
  separate-ref surface introduced anywhere in the diff. PASS.
- **D2 (retire dedicated checkpoint commit; sweep into merge/approve +
  sparse fallback)** — confirmed exactly as specced:
  - `src/runner/merge.mjs:1353-1390` (`mergeRunnerItemLocked`): stages
    `.fgos/events.jsonl` + `.fgos/events/` dirty/untracked files into the
    already-forming staged-merge commit, right before `git commit
    --no-edit`. No new commit created — proven by
    `test/runner/merge.test.mjs`'s new test asserting exactly one
    first-parent commit lands and its subject never matches `periodic
    events\.jsonl checkpoint|fallback events checkpoint`.
  - `src/state/events-jsonl-truncation-guard.mjs`: `PERIODIC_CHECKPOINT_
    INTERVAL_SEC`/`DEFAULT_CHECKPOINT_EVENT_THRESHOLD` (900s/50-event
    triggers) fully removed; replaced by `DEFAULT_CHECKPOINT_FALLBACK_
    INTERVAL_SEC = 3600` gated on `oldestDirtySec` (shard mtime) vs
    `lastCommitSec`, exactly the "fallback thưa" mechanism plan.md
    specifies. Commit message changed to `chore(.fgos): fallback events
    checkpoint`. `eventThreshold` fully retired — grepped clean across
    `src/`/`test/` (only historical docs and an unrelated
    `events-compaction.mjs` param of the same name from a different
    feature remain).
  - `src/runner/claim-port.mjs`: unchanged (no diff at all) — its only
    call already passed just `commitEnv`, so no API-shape update was
    needed; not scope drift, just nothing to change.
  - `checkpoint.fallbackIntervalSec` registered via `registerConfigDefault`
    in `src/setup/registrations.mjs:1674-1678` (see §3).
  - CHANGELOG entry present (see §4).
  - Required test scenarios (a)-(d) from plan.md P1 all present: (a)
    `test/runner/merge.test.mjs` sweep-into-merge-commit test, (b) same
    test's "never a dedicated checkpoint commit" assertion, (c)
    `test/state/events-jsonl-truncation-guard.test.mjs`'s D2 fallback-fires
    test, (d) `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` opt-out coverage
    preserved (pre-existing tests in `test/runner/claim-port.test.mjs` /
    `test/runner/concurrent-claim-eventlog-loss.test.mjs`, mechanism itself
    untouched by this diff — same early-return guard). PASS.
- **D3 (Tầng B/worker-writes-`.fgos`-in-worktree stays closed forever)** —
  no code anywhere in the diff lets a worktree branch write `.fgos/`; the
  sweep operates exclusively on `lockRoot`'s own working directory (the
  main checkout), never on a merged-in branch's tree. See §3 (ADR0020).
  PASS.
- **D4 (2 sequential children, disjoint footprint, backups left for an
  optional post-approve step)** — `git diff main...HEAD` confirms disjoint
  footprints matches plan.md's declared split exactly (child 1: truncation
  guard + merge sweep + claim-port + setup/checks + CHANGELOG; child 2:
  `.gitattributes` + full contiguity-surface deletion + grep-absence
  tests). The two `.fgos/events.jsonl.backup-*` files are still present in
  `HEAD`'s tree (confirmed via `git show HEAD:...`) — correctly NOT deleted
  by either child, exactly as D4 says (deleting them would touch `.fgos/`
  from a worker branch, which the merge guard rejects; that deletion is a
  deliberate, separate, optional step to run directly on `main` after
  approve). PASS. (Aside, not a diff finding: the live worktree's own
  uncommitted working-tree state shows several `.fgos/*` files as locally
  deleted — this is *uncommitted* local state in this worktree, not part of
  the branch's git history/diff, and out of this review's scope.)

## 3. ADR0020 (worker branches never carry `.fgos/` changes) — no exceptions

Grepped `src/runner/merge.mjs` for every `.fgos`/ADR0020 touch point and
read the control flow in order:

1. `git merge --no-commit --no-ff` runs.
2. The existing `fgos-write-rejected` guard (`merge.mjs:~1277-1289`) reads
   `git diff --name-only --cached` on `repoRoot` — the merge's own staged
   diff — and aborts+rejects if the incoming branch staged **any** `.fgos/`
   path. This runs **before** the new sweep code.
3. Verify + invariant checks run.
4. Only then does the new sweep block run (`merge.mjs:1353+`), and it
   operates on `lockRoot`'s own `.fgos/events.jsonl`/`.fgos/events/` via
   `fs.existsSync`/`git status --porcelain`/`git add`, scoped to `lockRoot`
   as both pathspec base and git-cwd (the R1 fix). This is the main
   checkout's own pre-existing legitimate write path (working-dir append),
   never a read from the merged branch's tree — it cannot smuggle in
   anything the branch itself tried to write, because step 2 already
   rejected that outright.

No new `.fgos` write path was introduced anywhere else in the diff (`bin/
fgos.mjs`'s change is only to the noise-only-path exclusion regex used for
footprint reporting, unrelated to the merge guard). PASS — confirmed by
direct code read, not inference.

## 4. Install/setup/doctor gate — config-merge half (R2 already confirmed doctor)

- `src/setup/registrations.mjs:1674-1678`:
  `registerConfigDefault({ id: 'checkpoint', key: 'checkpoint', shape: {
  fallbackIntervalSec: DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC } })`.
- `registerConfigDefault` (`registrations.mjs:108+`) is a generic, open
  registry — its own doc comment states "a new `registerConfigDefault` call
  is automatically picked up here" (line ~163), i.e. no separate `fgos
  setup` wiring is needed per key; `fgos setup`'s config-merge
  (`src/setup/config-merge.mjs`'s `mergeConfigDefaults`, fill-missing-only)
  consumes this registry generically.
- Confirms this was necessary, not gratuitous: `test/setup/checks.test.mjs`
  (`config-not-stale` test fixture, ~line 1032) now includes `checkpoint:
  { fallbackIntervalSec: ... }` in its "every default key present" fixture
  — i.e. the generic `config-not-stale` doctor check (which R2 already
  confirmed fires) now flags a config file missing the `checkpoint` key as
  stale, closing the loop between setup and doctor for this one new key.
- `docs/specs/distribution.md`'s doctor-check/doctor-fix snapshot table
  (rows 7/7b) was updated in the same diff to drop the retired
  `events-jsonl-contiguous` id from both lists, per that doc's own stated
  rule ("this list is not a snapshot... a module adding one updates this
  row in the same change").

PASS — config-default registration is real, generic, tested, and the one
snapshot doc that enumerates doctor checks/fixes was kept in sync.

## 5. CHANGELOG.md

`## [Unreleased]` gained two accurate entries: one for the checkpoint
sweep/fallback redesign (names the retired interval/threshold, the new
`checkpoint.fallbackIntervalSec`), one for the full legacy contiguity-
surface retirement (names every retired file/script/doctor-check by path).
Both match the actual diff. PASS.

## 6. Docs vs code — contradiction check

**FINDING (real, not historical-narrative):**
`docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-
writes.md` (Diataxis `type: explanation`, lives under `docs/explanation/`,
not `docs/history/` — so per this task's own carve-out it is NOT exempt as
historical narrative) still presents, as current runnable mechanism:

- the `.fgos/events.jsonl merge=union` `.gitattributes` entry — this
  branch deleted that exact line;
- `scripts/events-jsonl-contiguity.mjs --check`/`--fix`, with example
  command output — this branch deleted that script entirely;
- "That script is registered into `fgos doctor`'s existing check
  registry... so this class of residue is caught proactively going forward
  on any git operation" — false as of this branch; the check/fix pair
  (`events-jsonl-contiguous`) is retired.

None of this doc's ~235 lines carries a superseded/retired notice, and its
own "Related" section links only to historical CONTEXT.md/plan.md docs,
never to `docs/history/tsk-3tp-worker-write-events-tang-b/`. A reader (or
agent) landing on this doc after this branch merges would try to run a
script that no longer exists and would be told a doctor check runs that no
longer does.

**Minor, same root cause:** `docs/how-to/resolve-an-events-jsonl-
truncation.md` (line ~51) contrasts the truncation guard's "no registered
fix" against "the sibling `events-jsonl-contiguous` check" as if that
sibling still exists and still has a fix — also now stale, lower severity
(a parenthetical aside, not a runnable-command claim, and the doc's own
primary subject — the truncation guard — remains fully accurate).

No other stale-doc hits found: grepped every non-`docs/history/` doc for
`periodic events.jsonl checkpoint`, `PERIODIC_CHECKPOINT_INTERVAL_SEC`,
`DEFAULT_CHECKPOINT_EVENT_THRESHOLD`, `900s`/`15 phút`/`eventThreshold`
checkpoint-interval mentions, and `events-jsonl-contiguity`/
`events-jsonl-contiguous` — all other hits were either unrelated 15-minute
intervals belonging to a different mechanism (claim/lock TTLs) or already
confirmed-updated (`docs/specs/distribution.md`'s doctor-check snapshot
table, §4 above).

## Verdict

Everything the locked design (D1-D4), ADR0020, and the Install/setup/
doctor gate require was verified against the real shipped diff/tests, not
inferred — all PASS. The two test-suite failures are both pre-existing and
non-regressed (one documented, one verified via direct A/B against `main`
and already tracked as `tsk-3tb`). The one real, concrete issue this round
surfaces is a documentation/code contradiction: an `docs/explanation/`
page describes deleted tooling (`.gitattributes merge=union` entry +
`scripts/events-jsonl-contiguity.mjs` + its doctor registration) as current
and runnable. Not a safety or correctness risk to the merge itself, but a
real stale-doc gap this round was specifically asked to catch.

Verdict: FINDINGS

1. `docs/explanation/events-jsonl-lost-update-race-under-concurrent-
   session-writes.md` describes the retired `.gitattributes merge=union`
   entry and `scripts/events-jsonl-contiguity.mjs` (with runnable example
   commands) as current, active mechanism, including a claim that a `fgos
   doctor` check still runs it "on any git operation." Both are gone as of
   this branch. Needs a retired/superseded note (or a rewrite of the
   affected section) pointing at
   `docs/history/tsk-3tp-worker-write-events-tang-b/` for what replaced it.
2. `docs/how-to/resolve-an-events-jsonl-truncation.md`'s aside contrasting
   against "the sibling `events-jsonl-contiguous` check" is stale for the
   same reason — lower severity, doesn't affect the doc's own primary
   procedure.
3. Informational, non-blocking: `test/runner/claim-port.test.mjs`'s read-
   count assertion fails under this task's mandated bare `node --test`
   (6 vs expected 4) — confirmed pre-existing on `main` (8 vs 4, worse) via
   direct A/B, already tracked as `tsk-3tb`, not caused or worsened by this
   branch. Flagging only so the "genuinely green" claim in §1 has the full
   picture on record.
