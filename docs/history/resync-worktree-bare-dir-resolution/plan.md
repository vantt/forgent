# Plan: tsk-jgs — `resync-worktree` bare invocation fails to resolve main checkout

Mode: **small** (0-1 risk flags: no auth/authz/data-model/audit/external-
system/cross-platform impact; touches one already-covered CLI path via a
one-line resolution-order fix plus a comment correction and a new
subprocess-level test — a few files, no gray areas). Evidence: `RESEARCH.md`
Round 1 + Round 2.

## Approach

Root cause and fix shape are both confirmed against current code
(`RESEARCH.md` Round 1 items 1-4, Round 2). Summary:

- `bin/fgos.mjs`'s `resync-worktree` case (`~4872-4876`) passes `dir`
  straight through as `resyncWorktree`'s `repoRoot`. When `--dir` is
  omitted (the bare case, run from inside the stale worktree per the
  hook's own refusal instruction), `dir` = `dataDir(undefined)` =
  `<cwd>/.fgos` — cwd-strict, never git-resolved (`bin/fgos.mjs:101-104`).
  That path does not exist on disk for a linked worktree (ADR0020 strips
  it), so the `execFileSync` cwd in `worktree.mjs`'s `git()` helper throws
  ENOENT, caught by `lastSyncedCommit`'s try/catch, surfacing as "could not
  read HEAD reflog" (`worktree.mjs:570-578`).
- The fix is NOT a bare `path.dirname(dir)` (Round 2: that still resolves
  to the worktree itself, not the main checkout, in the bare case) — it is
  the codebase's own existing `resolveMainCheckoutRoot(cwd)`
  (`src/runner/paths.mjs:72-85`), already used the same
  override-then-git-resolve-then-fallback way at
  `src/runner/dispatch.mjs:1253,1320,1402` and
  `src/setup/registrations.mjs:198-204`.

### Files touched

- `bin/fgos.mjs` — `resync-worktree` case (~4862-4876):
  1. Import `resolveMainCheckoutRoot` alongside the existing
     `resolveFgosDir`/`fgosDirFromRoot` import at line 26.
  2. Resolve `repoRoot` as: `flags.dir !== undefined ? path.dirname(dir) :
     (resolveMainCheckoutRoot(worktreePath) ?? path.dirname(dir))` — an
     explicit `--dir` still wins outright (unchanged behavior, already
     correct: `dataDir(flags.dir)` = `flags.dir + '/.fgos'`, so
     `path.dirname(dir)` recovers the caller-supplied root exactly); the
     bare case now git-resolves instead of trusting a cwd-strict path that
     never existed for a worktree.
  3. Pass `repoRoot` (not `dir`) into `resyncWorktree(...)`.
  4. Rewrite the comment at `4862-4871` — it currently asserts "`dir` ...
     is always the MAIN checkout", which is the wrong assumption that
     produced the bug (`dataDir()`'s own doc comment two lines above says
     it is explicitly cwd-strict, never git-resolved). Replace with an
     accurate description of the two-branch resolution above.
- `test/e2e/resync-worktree-bare-invocation.test.mjs` (new) — closes the
  test-coverage gap confirmed in `RESEARCH.md` Round 1 item 5: a real
  subprocess-level test invoking `node bin/fgos.mjs resync-worktree` bare
  (no `--dir`), with `cwd` set to a linked worktree whose branch was
  force-moved forward from outside, asserting `{resynced: true}` on stdout
  and exit code 0 — the exact repro shape the bug report already used
  manually. Reuses the same fixture shape (`git init` main root, `git
  worktree add`, force-move the branch via a second detached checkout,
  same as `initSharedAbsoluteHooksPathFixture`/`forceMoveBranchForward` in
  `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`) but without
  installing the pre-commit hook — this test is about the repair verb
  itself, not the hook that names it. No change needed to
  `src/cli/command-registry.mjs`: its `resync-worktree` entry already
  documents the bare form as the normal case; the fix makes reality match
  that doc rather than requiring the doc to change.
- `src/runner/worktree.mjs` — no change. `resyncWorktree`'s own logic
  and its existing unit tests (`test/runner/worktree.test.mjs`, 7 tests,
  all already pass an explicit correct `repoRoot`) are untouched; only the
  CLI call site's argument was wrong.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `resync-worktree` CLI case | low — one resolution-order change, explicit `--dir` path unchanged | new e2e subprocess test (above) exercises the exact bare-invocation path the bug reports |
| `resyncWorktree()` itself | none — untouched | existing 7 unit tests in `test/runner/worktree.test.mjs` continue to pass with an explicit `repoRoot` |
| Other verbs using `path.dirname(dir)` | none — this fix only changes `resync-worktree`'s own case, no shared helper is modified | n/a |

Impact-analysis capability gate (`AGENTS.md`/`CLAUDE.md`): checked
`fgos tool query --capability impact-analysis --status present` — GitNexus
is registered and `present`, but **flagged stale** (last indexed
`c0cedaa`, 87 commits behind current `HEAD` — confirmed via `git rev-list
--count c0cedaa..HEAD`). Per the project's own capability gate: `present`
+ stale = **degraded**. Every other required check still ran; this one
proof point is weak, named plainly rather than assumed. Compensating
evidence in place of a fresh `gitnexus impact` call: a manual grep-based
cross-check (`RESEARCH.md` Round 1 finding 5) already confirmed the exact
call-site count for both `resyncWorktree(` (8 references: 1 CLI call site
in `bin/fgos.mjs`, 7 direct unit-test calls in
`test/runner/worktree.test.mjs`) and `resync-worktree` (the same CLI case,
plus its 2 mentions in `test/e2e/main-checkout-lock-hook-worktree-commit.
test.mjs` and its `command-registry.mjs` entry) — the blast radius here is
already small and fully enumerated by hand, not merely assumed clear
because the tool reported `present`. `fgos-coding-implement` should still
run a fresh `gitnexus impact`/`detect_changes` at implementation time per
AGENTS.md's own unconditional "MUST run impact analysis before editing any
symbol" / "MUST run detect_changes() before committing" rules — the
degraded posture here only means this plan does not treat that call's
output as the sole evidence.

## Split decision

One honest piece — no split. The whole fix (resolution-order change +
comment correction + one new test file) is a single coherent unit; nothing
here is independently workable or independently valuable on its own.

## Outstanding questions

None
