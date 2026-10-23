# Phase 9 pre-flip — Lead and owner answers

Entries `L13-n`. Phase 8 records (`../phase-08/owner-answers.md`, L12-*) stay historical.

## L13-1 — W0 prep (Lead, 2026-10-23)

Under L12-137. Main import **022c0ee67** (origin/main `28127bc15`, 118 commits): conflicts in `CHANGELOG.md`, holder-lock spec history and the lock-registry schema owner enum, all resolved as unions; census regenerated; selectors and vectors `--check` exit 0; lease test 15/15; registrations 55/60 (known worktree-location five). Board: Git §7 consent requested (`28127bc15`), SEAT agreed to stage a `docs-lease` release from the cutover candidate commit (staging only). `review-batches.json`: of 423 composed specs, **387 reviewable now**, **36 deferred to G9** (26 in D1 writable dirs, 9 changed bytes at M1, 1 in D3 writable files); G7 batches c1 73 / c2 68 / c3 68 / c4 41 / c5 60 / c6 30 / c7 47; G0 batches b1 55 / b2 50 / b3 42 / b4 22 / b5 22. `preflip-gate-status.json` initialised (all unmet).

## L13-2 — Git one-door: no Git component extension from DOC (Lead under A42, 2026-10-23 19:20)

D3 stopped at `scripts/check-evidence-relocation.mjs`: it needs live-index mode/blob/stage (incl. unborn repos), which the existing Inspect port does not expose; extending it means `packages/git/rust/src/inspect.rs` + node addon + tests, i.e. the Git component of another lane. Decision: DOC does **not** extend `packages/git` (RUL104 better-not-bigger; most of these sites are documentation-migration tooling that retires after Phase 10). D3 migrates every site an existing typed port already serves; each site that would need a new port capability becomes an **exemption candidate** with its reason, the missing capability, and a retirement condition, batched into the owner packet with stop S1 (`.githooks/pre-commit:507`). If the owner prefers the port extension, it is filed as a Git-lane item, not done here.
