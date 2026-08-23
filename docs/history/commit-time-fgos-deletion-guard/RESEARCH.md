# Research: commit-time guard against staging a .fgos/ deletion

## Round 1 — 2026-08-13 (discovery stage, tsk-56u)

**Asked:** How should a commit-time guard against staging a deletion under
`.fgos/` be built and wired in, given the item wants it to fire earlier
than the existing merge-time `fgos-write-rejected` check, plus a matching
AGENTS.md warning for the `git stash` hazard?

**Checked / found:**

- `.githooks/pre-commit` (repo-relative) already exists and is the correct
  file to extend. It currently implements the STR65 main-checkout activity
  lock (session lock + fgw/* branch refusal), installed via
  `git config core.hooksPath .githooks`. Its own header comment confirms
  this ONE file also fires for commits made inside ANY linked worktree
  sharing this repo's `core.hooksPath` (worktrees never get their own
  hooksPath) — `hookRunsAtHome(repoRoot)` gates its EXISTING guards to only
  apply when the actual git toplevel equals the main checkout root, so
  those two guards silently no-op for a worktree commit. A new
  staged-`.fgos`-deletion guard must NOT be gated the same way — the
  worktree is exactly where the hazard lives (see next finding) — so it
  needs its own unconditional check, not reuse of `hookRunsAtHome`.

- `.fgos/` is git-tracked (`git ls-files .fgos` returns real tracked
  paths: `.fgos/config.json`, `.fgos/events.jsonl`, etc.). Confirmed live
  in this session's own worktree: `git status --porcelain` shows every
  `.fgos/*` file as ` D` (deleted in working tree vs. index) — exactly the
  state a `git add -A` + commit would stage as a deletion. Root cause:
  `src/runner/worktree.mjs` (`createWorktree`, ~line 400-412) always
  `fs.rmSync`'s the checked-out `.fgos/` right after `git worktree add`
  (ADR0020: the runner is `.fgos/`'s sole writer, `0005`) — it does NOT
  `git rm` it, so the working tree loses the files but the git INDEX still
  has them, which is what makes a later `git add -A` see them as deleted.

- Existing merge-time detection to mirror (`src/runner/merge.mjs`
  ~line 1206-1220, the `fgos-write-rejected` outcome, ADR0020): after a
  `--no-commit --no-ff` merge lands cleanly, it runs
  `git diff --name-only --cached` and filters for paths that are exactly
  `.fgos` or start with `.fgos/`, aborting the merge if any match. This is
  the established detection shape; a commit-time guard doing the
  equivalent staged-diff check works identically pre-commit (staged files
  ARE what's about to be committed). The item's own wording scopes this
  narrower than merge.mjs's check — "refuses to stage a **deletion**" —
  so the new guard should filter on deletions specifically
  (`git diff --cached --name-only --diff-filter=D`, same `.fgos`/`.fgos/`
  path filter), not any staged `.fgos` change. This also matches the real
  hazard exactly: a worktree can only ever see `.fgos` paths as staged
  deletions (they were `rmSync`'d, never re-created), never as staged
  additions/modifications, so scoping to deletions loses no real coverage
  for this hazard.

- Hook installation / doctor registration: `src/setup/git-hooks.mjs`
  exports `installGitHooks` (writer, wires `core.hooksPath`) and
  `mainCheckoutHookWired` (reader) — the latter is already re-exported
  through `src/setup/checks.mjs` → `src/setup/registrations.mjs`, i.e.
  `fgos doctor` already has a check confirming this exact hook file is
  wired up. Extending the pre-commit hook's own logic with a new guard
  clause does not add a new config default, env var, or infra dependency
  per AGENTS.md's install/setup/doctor gate — it rides the
  already-registered hook file and wiring check. No new entry needed in
  `src/setup/registrations.mjs` for this — the footprint listed on the
  item names that file, but no evidence found that this item's scope
  actually needs to touch it.

- `tier`/`kind`/`risk` already on the item (`standard`/`bug`/`standard`)
  match what the evidence supports: a real gap in existing protection
  (bug), contained blast radius — one hook file's logic + docs, no
  runtime/production data path touched directly (standard/standard,
  vocabulary confirmed via `classificationVocabulary(domain, 'kind'|'risk')`,
  `src/state/workflow-stage-graphs.mjs` — `kind` ∈
  `[bug, chore, design, docs, feature, task]`, `risk` ∈ `[light, standard,
  heavy]`, same as `TIERS`). No `fgos edit` needed.

- `verify: "npm test"` already on the item counts as a real verify per
  `hasRealVerify` (`src/intake/discovery.mjs`) — not one of the two known
  placeholder strings — so it's kept as-is, not overwritten.

- Test precedent for planning: `test/e2e/main-checkout-lock-hook.test.mjs`
  and `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` already
  exercise `.githooks/pre-commit` end-to-end (disposable temp repo, hook +
  its dependency files copied in, same relative nesting as production) —
  this is the existing harness shape a new test for the deletion guard
  should extend, including the worktree-commit variant since that's the
  actual hazard scenario.

- AGENTS.md precedent for the second half of the item (a stash warning,
  never a mechanical block — git has no native pre-stash hook to refuse a
  stash cleanly, and the item's own "Wanted" section only asks for a
  warning here, not a guard): the existing `git reset --hard` warning
  lives at `AGENTS.md` lines ~82-90, right after the "fgOS Workflow"
  section, citing `tsk-3au`/`docs/history/main-checkout-destructive-git-
  safety-net/CONTEXT.md` and pointing at `fgos main-checkout-reset` as the
  safe alternative. A new paragraph naming both the `git add -A`/worktree-
  deletion-staging hazard and the `git stash`/main-checkout hazard belongs
  right next to it, same shape (name the move, name the real incident,
  name the safe alternative).

**Open:** nothing — every point raised by the item description resolved
against real repo evidence, no product decision left for a person.

**Verdict:** `clear`.
