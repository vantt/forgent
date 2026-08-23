# pick worktree-reclaim zero-destroy fix (tsk-3lx) — plan

## Mode

**Standard.** Flag count: 2 —

- **existing covered behavior** — `createWorktree`/`reclaimOrphanedCheckout`
  (`src/runner/worktree.mjs`) already have direct regression coverage
  (`test/runner/worktree.test.mjs`, 574 lines, including the exact reclaim
  paths this item changes: "reclaims a branch already checked out at an
  orphaned path", "reclaims a branch registered as checked out at a path
  that's already gone") plus indirect coverage through
  `worktree-callsite-wrapper.test.mjs`, `claim-port.test.mjs`,
  `merge.test.mjs`, `loop.test.mjs`, `fgos.test.mjs`.
- **weak proof around the area** — same fragile, previously-bitten
  territory `tsk-4m0`'s own plan already named: `tsk-1wd`/decision 0018
  (reclaim force-removing a live checkout), `tsk-2zv` (claim-lock §3b
  reclaim exemption), `tsk-65n` (reattach path), `tsk-4m0` itself, and now
  this item's own 4th recurrence.

Neither a hard-gate flag (auth/data-loss/audit/external-provider/removing
a validation) nor 4+ flags apply — same mode `tsk-4m0` itself landed at,
for the same reason: a single, well-bounded mechanism fix in one function,
not a redesign.

## Approach (honors CONTEXT.md D1–D4)

**Chosen path**: replace `createWorktree`'s reclaim-then-add sequence, for
the case where an orphaned checkout still physically exists on disk, with
git's own native `git worktree move <orphanPath> <newPath>` instead of
`git worktree remove --force <orphanPath>` followed by a separate
`git worktree add <newPath> <branch>`. `git worktree move` relocates an
existing checkout (updates git's internal worktree administration and the
directory in one operation) without ever destroying it — if the move
fails for any reason, the checkout stays exactly where it was, still
valid, still on `branch`, with every commit intact. This is what makes
D2's zero-destroy bar achievable: the destructive-before-confirmed window
this item's `CONTEXT.md` names is closed structurally, because there is
no longer a separate "remove old" step that can succeed while "create
new" then fails.

The already-gone-from-disk branch of `reclaimOrphanedCheckout` (registered
in git's worktree list but the directory itself no longer exists — e.g.
manually `rm -rf`'d) is unchanged: there is nothing physical to lose there
today, so `git worktree prune` followed by ordinary `git worktree add`
stays exactly as it is — D2's guarantee only needs to cover the case where
a real, live checkout exists to protect.

**Alternatives rejected**:
- *Detached-HEAD bridge checkout* (the other candidate `CONTEXT.md`'s
  Deferred section named) — create a second, temporary checkout at the
  branch's tip SHA before removing the named-branch one, then re-attach.
  Rejected: needs two live checkouts and an extra teardown step for the
  bridge itself, more filesystem churn and more failure surface than a
  single native `move`, for the same end result.
- *Retry-only on transient `ENOENT`* (this item's own rejected option B,
  `CONTEXT.md` D2) — narrower fix, already rejected by the person who
  locked D2: reduces frequency, does not close the destructive-before-
  confirmed window itself.

**Risk map:**

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| `reclaimOrphanedCheckout`/`createWorktree` reclaim-path switched to `git worktree move` | Medium — the exact fragile, previously-bitten function; changes a path 3 prior incidents already touched | New test: inject a failure in the move/create step (mirrors `tsk-4m0`'s own failure-injection testing style) and assert the ORIGINAL `orphanPath` checkout still exists, is still valid, and `git log` on `branch` still shows every prior commit — this is the direct proof of D2 |
| Normal (non-failure) reclaim-and-relocate | Medium — must still produce a working checkout with the branch's commits at the new mkdtemp-style path | Update the existing "reclaims a branch already checked out at an orphaned path" / "...at a path that's already gone" tests (`test/runner/worktree.test.mjs` ~114-155) to assert the new end-state via `git worktree move` semantics; same observable outcome (reused branch checked out only at the new path) |
| Shared call site: `approve`'s ephemeral leaf-merge worktree (`bin/fgos.mjs:1721`, D3) | Medium — no live incident recorded there yet, but shares the exact reclaim code path | Existing test suite for this path (`merge.test.mjs`) must keep passing unmodified — regression, not new coverage; D3 means no separate fix is needed here, only confirmation nothing broke |
| Dirty-checkout guard (`isCheckoutDirty`, D4, unchanged) | Low — no logic change | Existing dirty-checkout-refusal test in `worktree.test.mjs` must keep passing unmodified |
| `provisionDependencies`/checked-out `.fgos` removal (downstream of add/move) | Low — unchanged logic, still runs after the checkout exists either way | Existing test suite regression only |
| How-to doc update | Low — documentation only | Manual review; no automated proof needed |

Impact-analysis posture: **full** (GitNexus present,
`fgos tool query --capability impact-analysis --status present` returned
one `present` provider). The medium-risk proof points above can lean on
GitNexus blast-radius evidence for `createWorktree`/`reclaimOrphanedCheckout`
at validating time, not just the new tests.

`fgos graph --json` was run: this item has no deps and sits in its own
size-1 component, so there is no cross-item ordering question the
`criticalPath`/`topUnblock` fields need to inform — not load-bearing here,
same as `tsk-4m0`'s own plan noted for its own single-piece shape.

**Files touched, in order:**

1. `src/runner/worktree.mjs` — swap the live-checkout branch of
   `reclaimOrphanedCheckout`'s reclaim step to `git worktree move` instead
   of `remove --force`; the already-gone-from-disk branch (`prune`) stays
   untouched.
2. `test/runner/worktree.test.mjs` — the new failure-injection regression
   test (proves D2) plus updates to the two existing orphan-reclaim tests
   to assert the new end-state.
3. `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`
   — update to note the automatic directory-loss scenario this doc was
   written for is now structurally closed (zero-destroy); keep the doc for
   residual cases outside even `git worktree move`'s reach (git binary
   totally unavailable, `.fgos`-writer failure, disk full during the move
   itself) — same "narrows scope, does not guarantee zero manual cases"
   framing `tsk-4m0`'s own D2 used for its own doc.

## Shape

One phase, no split — see below. Concrete cases to prove at
`fgos-coding-validating`/execution time, matching the risk map:

- **Empty/boundary**: branch does not exist yet at all (first-ever pick,
  no reclaim call happens) — must stay byte-identical to today's
  `git worktree add -b` path; covered by existing "makes a fresh branch...
  from HEAD when none exists" test, unmodified.
- **Existing behavior that must not regress**: every currently-passing
  case in `test/runner/worktree.test.mjs`, `worktree-callsite-wrapper
  .test.mjs`, `claim-port.test.mjs`, `merge.test.mjs`, `loop.test.mjs`,
  `fgos.test.mjs` stays green, with only the two orphan-reclaim tests
  updated to assert the new (but observably equivalent) end-state.
- **Partial failure (the actual proof of D2)**: the move/create step
  itself fails partway — the pre-existing checkout at `orphanPath` must
  remain exactly as it was: same path, same commits, still valid,
  requiring zero manual recovery for this class of failure. This is the
  gap `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation
  -failure.md` currently documents as a residual — this test proves it
  closed.
- **Dirty-checkout refusal (D4, unchanged)**: a checkout with real
  uncommitted changes must still be refused, not silently moved or
  destroyed — existing `isCheckoutDirty` guard/test stays as the proof,
  unmodified.

## Validated at fgos-coding-validating

Empirically confirmed against this repo's real `git` (2.34.1, `git worktree
move <worktree> <new-path>` is a real, documented subcommand):

- `git worktree move` to a target path that does **not yet exist** places
  the checkout's contents directly at that path (verified: `.git` file and
  a tracked file both land exactly at `<target>/`, branch/HEAD unchanged) —
  this is the mechanism's core, confirmed working.
- `git worktree move` to a target path that **already exists as a
  directory — even an empty one** — does NOT place contents there
  directly; it nests the source's basename underneath instead
  (`<target>/<basename-of-source>/...`), the same as ordinary `mv`
  semantics into an existing directory. Verified both for a non-empty and
  a genuinely empty pre-existing target.
- **Constraint this adds to the implementation** (`src/runner/worktree.mjs`
  step 1 above): the reclaim-via-move path must NOT reuse `createWorktree`'s
  existing `worktreePath = fs.mkdtempSync(...)` (line 286) as the move's
  destination while that directory still exists — `mkdtempSync` always
  creates the directory, so passing it straight to `git worktree move`
  would trigger the nesting behavior above, landing the checkout one level
  too deep and breaking every downstream `path.join(worktreePath, ...)`
  call (`.fgos` removal, `provisionDependencies`, the `{ path: worktreePath
  }` returned to the caller). The move-path must compute a fresh,
  not-yet-created path (e.g. `mkdtempSync` immediately followed by
  `fs.rmdirSync` on the empty dir right before the move call, so the path
  exists as a name but not as a directory at move-time) instead of reusing
  the directory as-is.
- `git worktree move` without `-f`/`--force` already refuses to move a
  dirty or locked worktree by design (confirmed via `git worktree move -h`)
  — this is compatible with, but does not replace, the existing
  `isCheckoutDirty` guard (D4, unchanged): the implementation should never
  pass `--force`, so a dirty checkout is refused by git itself as a second
  independent check, not just by `isCheckoutDirty`.

## Split decision

**No split.** One honest ordering-mechanism fix in one function, its
regression tests, and one doc update — same shape and same reasoning
`tsk-4m0`'s own plan used for its analogous single-function fix: splitting
"code fix" from "doc update" would create an artificial dependency for no
isolation benefit, and the doc is only meaningful once the fix it
describes actually exists.

## Verify command

```
node --test test/runner/worktree.test.mjs test/runner/worktree-callsite-wrapper.test.mjs test/runner/claim-port.test.mjs test/runner/merge.test.mjs test/runner/loop.test.mjs test/runner/promote-engine.test.mjs test/cli/fgos.test.mjs
```

`test/runner/promote-engine.test.mjs` added post-`fgos-coding-validating`
(`fgos-coding-implement` impact-analysis pass, GitNexus full posture):
`reclaimOrphanedCheckout` impact query (upstream, CRITICAL risk, 9
symbols) surfaced a THIRD real call site beyond `CONTEXT.md`'s D3 —
`cleanupMergedBranch` (`src/runner/merge.mjs:931`) calls it directly, not
only through `createWorktree` — plus a depth-3 caller,
`retargetMember` (`src/runner/promote-engine.mjs`), with its own
dedicated test file not previously in this verify command. The other
depth-2/3 callers (`createClaimWorktree`, `withMergeEphemeralWorktree`,
`createDispatchWorktree`, `claimWork`, `startupReap`,
`dispatchClaimedItem`) are already covered by the six files already
listed (`claim-port.test.mjs`, `merge.test.mjs`, `loop.test.mjs`).

Real progress at `return` time: the new failure-injection test (D2's
proof) passes, the two updated orphan-reclaim tests pass, every other
test across all seven files above stays green unmodified, and the how-to
doc reflects the new, narrower residual scope.
