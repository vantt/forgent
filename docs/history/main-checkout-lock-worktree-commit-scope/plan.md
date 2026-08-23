# tsk-sir — plan

## Mode gate

Flags counted against `CONTEXT.md`'s locked decisions (D1-D9):

| Flag | Applies? | Why |
|------|----------|-----|
| auth | no | — |
| authorization | no | — |
| data model | no | — |
| audit/security | **yes** | `.githooks/pre-commit` is the STR65 "concurrent-writer guard" — a safety-critical git hook (decision `0021`). This change loosens its lock-acquire guard for a class of commits. |
| external systems | no | — |
| public contracts | no | internal hook, not a CLI verb or public API |
| cross-platform | no | no new platform-specific code |
| existing covered behavior | **yes** | `test/e2e/main-checkout-lock-hook.test.mjs` already covers this exact hook file (guard 2, main-checkout-on-fgw-branch refusal) — must not regress |
| weak proof around the area | yes | `impact-analysis: degraded` — GitNexus present but index stale (`251d0b5`); its own call-graph already missed this hook as a caller (CONTEXT.md D6) |
| multi-domain | no | single file, runner/git-hooks infra only |

**Mode: high-risk.** Count alone (3 flags) would land `standard`, but D4's
fix is literally "removing a validation" for a specific case (skip the
lock-acquire check for linked-worktree commits) — one of the explicit
hard-gate flags, which forces `high-risk` regardless of size. Matches the
same classification `tsk-1p9` (sibling item, same session) used for its
own small-diff-but-removes-a-check change (`git branch -d` → `-D`).

Small diff, high-risk classification because of WHAT it removes, not how
much code it touches — the plan below stays proportionate to that (a full
risk map and proof points, not a bigger implementation).

## Approach

**Chosen:** add one early check at the top of `.githooks/pre-commit`'s
`main()` — compute `gitDir`/`gitCommonDir` ONCE, before guard 1
(`acquireMainCheckoutLock`), and skip guard 1 entirely when they differ
(linked worktree). Refactor `currentFgwBranchIfMainCheckout` to take the
already-computed `isMainCheckout` boolean as a parameter instead of
re-deriving `gitDir`/`gitCommonDir` itself a second time — one
`execFileSync` pair per commit instead of two, and one place computing the
worktree/main distinction instead of two copies that could drift apart
(the asymmetry CONTEXT.md's D2 already flagged as the root gap).

```js
function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const isMainCheckout = computeIsMainCheckout(repoRoot); // extracted, was inline in currentFgwBranchIfMainCheckout

  if (isMainCheckout) {
    const fgosDir = path.join(repoRoot, '.fgos');
    const { id } = resolveWriterIdentity(fgosDir);
    const ttlMs = resolveTtlMs();
    const result = acquireMainCheckoutLock(fgosDir, { identity: id, ttlMs });
    if (result.status === HELD) { refuse(...); return; }
    if (result.status === AMBIGUOUS) { refuse(...); return; }
  }
  // linked worktree: guard 1 skipped entirely -- no lock hazard applies
  // (CONTEXT.md D2: worktree has its own separate index, D9: under the
  // code-intended relative hooksPath a worktree commit never even reaches
  // this file at all -- this branch only matters on a checkout whose
  // hooksPath drifted absolute, per D7)

  const fgwBranch = isMainCheckout ? currentFgwBranchIfMainCheckout(repoRoot) : null;
  if (fgwBranch) { refuse(...); return; }

  process.exit(0);
}
```

**Alternatives rejected:**
- Changing `acquireMainCheckoutLock` itself to accept a
  "skip if worktree" option — rejected per D4: the primitive is shared by
  `claimWork`/`mergeRunnerItem`/`fgos unlock`, none of which are ever
  invoked from a worktree commit context; adding worktree-awareness to the
  primitive would be dead weight at every other call site.
- Leaving `currentFgwBranchIfMainCheckout`'s own `gitDir`/`gitCommonDir`
  computation untouched and just duplicating the same check inline before
  guard 1 — rejected: two copies of the same comparison is exactly the
  asymmetry-by-duplication risk D2 already named; one computation, reused,
  is the smaller and more honest fix.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|-----------|------|--------------------------------------|
| Guard 1 (lock-acquire skip for worktree) | medium-high | `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` (already written, currently RED) must go green |
| Guard 2 (`currentFgwBranchIfMainCheckout`, refactored to take `isMainCheckout` param) | medium | `test/e2e/main-checkout-lock-hook.test.mjs` (existing, currently green) must stay green — no regression on the fgw-branch-on-main refusal or the legitimate-worktree-on-fgw-branch pass-through |
| `main-checkout-lock.mjs` primitive | none | unchanged (D4/D5) — no proof point needed, confirmed by D5's call-site scout |
| Real dogfood on this checkout | medium | `fgos doctor`'s hook-wired check is currently a false negative here (`tsk-1gn`, out of scope) — `fgos-coding-validating` should not rely on `fgos doctor` green/red as evidence for this item; use the e2e tests + a real `git commit` from this session's own worktree instead, same as this session already did live twice |

`impact-analysis: degraded` (GitNexus present, index stale) — the e2e
tests above are this item's actual blast-radius evidence, not a
tool-graph query; note the degraded posture here per `CLAUDE.md`'s gate
rather than skip mentioning it.

## Files touched

- `.githooks/pre-commit` — the only file changed (guard 1 pre-check +
  `currentFgwBranchIfMainCheckout` refactor).
- `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — already
  written and committed this session (proof point, currently red).

No other file needs to change — confirmed by D5's call-site scout
(`acquireMainCheckoutLock`'s other 2 real call sites, `claimWork`/
`mergeRunnerItem`, are untouched by this change) and by `fgos graph
--what-if tsk-sir`: `unblocksTransitive: 0` — no dependent item's shape is
affected by how this lands.

## Shape

Single piece — no split. The fix is one cohesive change to one file (plus
its own already-written proof test); splitting the guard-1 skip from the
guard-2 refactor would ship a version where the two guards duplicate the
worktree-detection logic again, reopening exactly the asymmetry D2 named
as the root gap. `fgos graph --what-if tsk-sir` confirms no other item
depends on this one's shape (`unblocksTransitive: 0`), so there is no
ordering constraint from sibling work either.

## Verify

```
node --test test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs test/e2e/main-checkout-lock-hook.test.mjs
```

Both files: the new repro (must flip red→green) and the existing e2e
suite for the same hook (must stay green — regression guard on guard 2 and
the other lock states already covered there).
