# pick worktree-creation-failure claim race (tsk-4m0) — plan

## Mode

**Standard.** Flag count: 2 —

- **existing covered behavior** — `claim-port.mjs`'s `claimWork` is the
  single choke point every claim path (`take`, `pick`, runner `claimItem`)
  funnels through, already regression-tested (`test/runner/claim-port.test.mjs`)
  and the subject of a dedicated hardening item (`tsk-49a`, guarantee-proof
  test for the CAS).
- **weak proof around the area** — claim/worktree-creation ordering has a
  real incident history: `tsk-1wd`/decision 0018 (reclaim force-removing a
  live checkout), `tsk-2zv` (claim-lock §3b reclaim exemption), `tsk-65n`
  (reattach path). This is fragile, previously-bitten territory, not a
  clean corner.

Neither a hard-gate flag (auth/data-loss/audit/external-provider) nor 4+
flags apply, so this stays `standard` rather than `high-risk` — it's a
single, well-bounded ordering fix in one function, not a redesign.

## Approach (honors CONTEXT.md D1/D2/D3)

**Chosen path**: wrap `claimWork`'s existing `if (isolate) { const
worktree = createClaimWorktree(...) }` block (`src/runner/claim-port.mjs:249-252`)
in a `try/catch` that, on `createClaimWorktree` throwing, calls `moveWork`
a second time to put the item back to the status it had before this
claim's own `moveWork` (line 211) — then rethrows the original error
unchanged. Per D1, this is the whole fix: no new field, no new stage, no
retry-path branch, because a reverted claim means a retry sees ordinary
`expectedStatus: 'todo'` (or `'blocked'`, see below) semantics again.

**Alternatives rejected** (per CONTEXT.md D1, already decided — cited,
not reopened here): teaching the retry path to recognize
"already-doing-mine-no-worktree" (CONTEXT.md's option b) — rejected
because it adds a second code path instead of making the failure a
no-op; docs-only (option c) — rejected because D2 already keeps the
how-to doc regardless, and the underlying race is fixable in ~20 lines.

**The two revert targets** (both existing branches inside `claimWork`,
same function, same fix):
- Ordinary claim: `expectedStatus` was `'todo'` (line 205) → revert target
  is `'todo'`.
- Branch-take (`isBranchTake`, `item.status === 'blocked' &&
  branchAlreadyExists`, line 204): `expectedStatus` was `'blocked'` →
  revert target is `'blocked'`. This path was not the one reproduced live
  on `tsk-f31`, but it runs through the exact same
  `moveWork`-before-`createClaimWorktree` ordering (line 211 then 250),
  so it carries the identical bug and gets the identical fix in the same
  change — not a separate follow-up.

**`addOutcome`'s predicted-outcome record** (line 222-234, written between
the two `moveWork` calls): left untouched on revert. It's an append-only
diagnostic log (compound-learning's `predicted` half), not authoritative
claim state — un-writing it on revert would be reaching into a different
subsystem's invariant (append-only) to fix a problem that isn't there.
Noted as an explicit choice so a reviewer doesn't read the omission as an
oversight.

**Risk map:**

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| Revert-on-failure for the `todo` path (the reproduced case) | Medium — core claim CAS, already-tested function | New test: force `createClaimWorktree` to throw (e.g. pass an unwritable/invalid `worktreeDir`), assert `claimWork` rethrows the original error AND the item's status is back to `todo` in the store afterward |
| Revert-on-failure for the `blocked`/branch-take path | Medium — same ordering bug, less-trodden path, no live incident yet | New test: same failure injection, but starting from a `blocked` item with an existing branch (`isBranchTake` true), assert revert lands back on `blocked` not `todo` |
| Interaction with `addOutcome`/lock release (`finally` at line 255-264) | Low — no logic change to either | Existing test suite (`test/runner/claim-port.test.mjs`) must keep passing unmodified — regression, not new coverage |
| How-to doc (D2) | Low — documentation only | Manual review; no automated proof needed |

Impact-analysis posture: **full** (gitnexus present, `fgos tool query
--capability impact-analysis --status present` confirms). The above proof
points can lean on GitNexus blast-radius evidence at validating time, not
just the new tests.

**Files touched, in order:**

1. `src/runner/claim-port.mjs` — the revert-on-failure fix (both paths).
2. `test/runner/claim-port.test.mjs` — the two new regression tests above.
3. `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`
   (new, per D2) — manual recovery steps for whatever the auto-revert
   can't cover (e.g. git binary itself unavailable at the moment the
   revert's own `moveWork` call would need to run — a `.fgos/` writer
   failure, not a git-worktree failure, so the revert itself can't paper
   over it). Follows the naming/shape precedent of
   `docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md`.

`fgos graph`/`--what-if` was run but is not load-bearing here: this item
is a single honest piece with no split (see below), so there is no
cross-item ordering question for the critical-path/topUnblock fields to
inform.

## Shape

One phase, no split — see below. Concrete cases to prove at
`fgos-coding-validating`/execution time, matching the risk map:

- **Empty/boundary**: `createClaimWorktree` fails on the very first claim
  attempt (branch doesn't exist yet, `git worktree add -b` itself fails) —
  covered by the `todo`-path test.
- **Existing behavior that must not regress**: every currently-passing
  case in `test/runner/claim-port.test.mjs` (successful claim/worktree
  creation, CAS conflict, lock contention) stays green untouched.
  `tsk-49a`'s CAS-guarantee framing is not touched by this change — the
  revert only fires on a `createClaimWorktree` exception, never changes
  which claimant wins the CAS.
- **Partial failure**: the failure happens between the two `moveWork`
  calls (i.e., inside the revert's own `moveWork`) — out of scope by
  design (CONTEXT.md D2: this residual is exactly what the how-to doc
  exists for, not a second layer of auto-recovery).

## Split decision

**No split.** This is one honest piece of work: a single ordering fix in
one function (with a symmetric second branch), its regression tests, and
one doc. Splitting "code fix" from "how-to doc" into separate items would
create an artificial dependency for no isolation benefit — both land in
the same PR-sized change, touch non-overlapping files, and the doc is
worthless without the fix it documents (and vice versa: shipping the fix
without the doc leaves D2 unmet, per the locked decision).

## Verify command

```
node --test test/runner/claim-port.test.mjs
```

Real progress at `return` time: the two new tests pass, the existing
tests in the same file still pass, and the how-to doc exists at
`docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`.
