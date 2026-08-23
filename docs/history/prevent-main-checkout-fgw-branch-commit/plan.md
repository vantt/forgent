---
type: how-to
title: Plan — main-checkout fgw/* commit guard
tags: []
timestamp: 2026-08-03T09:23:00.000Z
source_capture_ids: [tsk-4hkd]
---

# Plan — main-checkout fgw/* commit guard

## Mode

Flags counted (auth / authorization / data model / audit-security /
external systems / public contracts / cross-platform / existing covered
behavior / weak proof / multi-domain): only **existing covered behavior**
applies — this touches `.githooks/pre-commit`, which already has a
dedicated e2e test suite (`test/e2e/main-checkout-lock-hook.test.mjs`,
seven passing cases). Everything else: no auth, no data model, no external
system, no public contract, single-platform (git hook script), single
domain.

1 flag → **small**: a couple of files (the hook, its test file), no gray
areas — matches D1's own framing in `CONTEXT.md` ("single-file hook edit").

## Approach

**Chosen path**: add one more `refuse(...)` branch inside
`.githooks/pre-commit`'s existing `main()`, right after the
`AMBIGUOUS`/`HELD` checks and before `process.exit(0)`:

1. Resolve `gitDir = git rev-parse --git-dir` and `gitCommonDir =
   git rev-parse --git-common-dir` from `repoRoot` (both already
   resolvable via `execFileSync('git', [...], { cwd: repoRoot })`, same
   pattern the hook already uses for other git plumbing calls elsewhere in
   this repo).
2. `isMainCheckout = path.resolve(gitDir) === path.resolve(gitCommonDir)`
   — true only for the one real checkout; false for every linked worktree
   (each gets its own git-dir under `<main>/.git/worktrees/<name>`).
3. If `isMainCheckout`, resolve the current branch: `git symbolic-ref
   --short -q HEAD` (empty/nonzero on detached HEAD — treat that as "not
   on a fgw/* branch", never throw).
4. If `isMainCheckout && /^fgw\//.test(branch)`, call
   `refuse('commit refused: main checkout is on branch ' + branch + ' —
   checkout back to the default branch and use "fgos pick <id>" for item
   work.')`.

**Alternatives rejected**: a `docs/how-to/` write-up alone (D1 already
rejects — nobody reads it before making the mistake again); a `fgos
doctor` check alone (D1 already rejects — nobody remembers to run it,
CLAUDE.md's install/doctor gate itself only helps for config-default/
env-var/infra-dependency cases, not a live workflow mistake); a
`post-checkout` hook that reverts the branch automatically (rejected —
silently switching branches out from under someone is a worse surprise
than a refused commit; refusing at commit-time still catches the mistake
before any real damage, since nothing observable happens from a bare
`git checkout` alone).

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| `isMainCheckout` detection (git-dir vs git-common-dir) | medium — must not misfire inside a linked worktree (would block ALL legitimate `fgw/*` work) | e2e case: commit inside a linked worktree on a `fgw/*` branch must succeed |
| `fgw/*` branch detection on detached HEAD | low — `symbolic-ref` fails cleanly on detached HEAD, no branch name to match | e2e case: existing detached-worktree test (truth 6) must keep passing unmodified |
| Refusal message clarity | low — cosmetic | reviewed in the PR itself, no separate proof point needed |

Impact-analysis gate: `fgos tool query --capability impact-analysis
--status present` → GitNexus registered and `present` (`full` posture, per
`CONTEXT.md`'s scout evidence). Per the project's impact-analysis gate,
`impact()` runs on `main()` (the function being edited) before the edit,
and `detect_changes()` runs before commit — both at `fgos-coding-implement`
time, not here.

**Files touched**: `.githooks/pre-commit` (the guard),
`test/e2e/main-checkout-lock-hook.test.mjs` (new cases). No other file —
confirmed via the scout in `CONTEXT.md` (no existing doctor check or docs
entry references this failure mode).

**Order**: single item, no split (`fgos graph --json` shows this item as
its own isolated component — no dependency ordering to resolve). Implement
the hook guard and its tests together in the one execution pass; they are
not separable proof points.

## Shape (small)

One execution pass:

1. Edit `.githooks/pre-commit`: add the `isMainCheckout` + branch-match
   guard described above.
2. Add e2e test cases to `test/e2e/main-checkout-lock-hook.test.mjs`:
   - **new**: main checkout checked out to a branch named `fgw/<id>` →
     commit refused, stderr matches `/commit refused.*fgw\//`.
   - **new**: a linked worktree (`git worktree add -b fgw/<id>
     <path>`, not `--detach`) whose branch is `fgw/<id>` → commit
     succeeds (this is the medium-risk proof point from the risk map).
   - **regression**: all 7 existing cases in the file must keep passing
     unmodified — they already cover main-checkout-on-`main`
     (succeeds) and a detached worktree (succeeds), both of which must
     stay true after the new guard is added.
3. Run `npm test -- test/e2e/main-checkout-lock-hook.test.mjs` (the
   item's own `verify`, set by `fgos discover`'s clear verdict).

No split — one honest piece of work, proceeds as itself (`tsk-4hkd`).

## Assumptions

- `git symbolic-ref --short -q HEAD` is available in the CI/dev
  environments this hook runs in (standard git plumbing, no version
  concern — not material enough to ask, pinned here per the mid-planning
  gap filter).
