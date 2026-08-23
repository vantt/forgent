# Plan: tsk-2cl — pre-commit staleWorktreeIndexRefusal fail-closed on unreadable branch tip

Mode: **tiny** (0-1 risk flags; one same-shape branch in one function,
matching two sibling branches already in the same file — a direct task,
not even needing a "few files" small-mode framing). Evidence:
`RESEARCH.md` Round 1.

## Approach

Per `RESEARCH.md` Round 1 finding 2: change `.githooks/pre-commit`'s
`staleWorktreeIndexRefusal` (`~199-204`) from `catch { return null; }`
(fail-open — commit proceeds unguarded) to the same fail-closed shape the
two sibling branches in the same function already use (reflog-unreadable,
`189-197`; not-an-ancestor, `207-215`): `catch { return "commit refused:
..."; }`, citing `branch` and `lastSynced` (the only two values in scope
— `branchTip` is, by definition, what failed to read). Also correct the
stale in-code comment at line 203 ("branch ref unreadable -- not this
guard's failure mode"), which rationalized the fail-open behavior this fix
removes.

### Files touched

- `.githooks/pre-commit` — `staleWorktreeIndexRefusal` (`~199-204`): swap
  the `catch` body, same message shape as its two siblings ("commit
  refused: ... (fail-closed). Inspect this worktree by hand."), citing
  `branch` and `lastSynced`. Remove/replace the now-inaccurate comment.
- `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — new test:
  simulate a branch ref `git rev-parse` failure by corrupting the ref file
  directly on disk (`fs.writeFileSync` garbage bytes into
  `.git/worktrees/<name>/refs/heads` or the shared `refs/heads/<branch>`
  under `--git-common-dir`, whichever holds it for a linked worktree —
  confirm which at implementation time) AFTER the worktree already has a
  real reflog entry (so the reflog-unreadable branch does not fire first)
  — then attempt a commit and assert refusal, matching the sibling
  `tsk-1d7` tests' own shape (real hook subprocess, real repo fixture,
  asserting `result.status !== 0` and a matching `stderr` message).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `staleWorktreeIndexRefusal`'s new branch | low — additive fail-closed swap in one already-isolated `catch`, matches two sibling branches byte-for-byte in shape | new e2e test above |
| The other two existing branches (reflog-unreadable, not-an-ancestor) | none — untouched | existing `tsk-1d7` e2e tests continue to pass |
| In-sync / no-op path (the dominant real-world case) | none — untouched, only the fail-open catch changes | existing "branch tip has NOT moved" test (`main-checkout-lock-hook-worktree-commit.test.mjs:168`) |

Impact-analysis capability gate: checked
`fgos tool query --capability impact-analysis --status present` — GitNexus
`present` but flagged stale (same staleness already confirmed on this
branch family: index at `c0cedaa`, well behind current `HEAD`). Posture:
**degraded**. Compensating evidence: `.githooks/pre-commit` is a single
136-line file with exactly one caller of `staleWorktreeIndexRefusal`
(`main()`, line 224, `RESEARCH.md` Round 1 finding 1) — the blast radius
is fully enumerated by direct read, not assumed clear from a tool result.

## Split decision

One honest piece — no split. The fix and its one new test form a single
coherent unit; nothing here is independently workable on its own.

## Outstanding questions

None
