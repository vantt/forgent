# Lead notes: H2 step 2 wave 1 on fg-server2

## 2026-11-28

- The lead head forgent-261127-1003-h2-ste-f47e4 started on fg-server2. The earlier lead's branches lived on
  fg-server and were never pushed, so wave 1 (phases 1, 2, 3 and 7) restarted from main here. Owner questions
  q-kmo7m6h2ga and q-yd6y7264jj concern fg-server only and block nothing on fg-server2.
- Disk on fg-server2 was 6.3G free at start. Phase 7 was parked (event 08ce70c6fa334abc) and then started once
  space was back to 84G. A phase 3 run failed on ENOSPC while settling.
- Executors: gemini answered provider-limit on both accounts, and the deepseek fallback often ended with
  `infra-no-report` (phase 1 after 16 min, phase 7, phase 3c). Reran with `--provider claude` (a different
  provider). Claude's sandbox refuses `fgos`, `npm run fgos:dev` and `scripts/doc-health.mjs` (read-only git),
  so the CLI tests and doc-health could not run inside units.
- Phase 1: worktree p01. Commit de6d91c9b4 (34/34 registry tests). Review: 2 blocking findings (the `grown`
  check, an `--exact` example the Rust parser refuses) and 8 nits, all accepted. Fix commit 5453e00e8d is being
  rechecked by an independent reviewer.
- Phase 2: worktree p02b. The rule unit is committed (1d45e5a6fb, f8c538ce81), and the pre-commit context-engine
  check passed. `rules.json` is compiled with `documentation-door`, but it is skip-worktree in the index, so the
  runner skipped it. An unconfined commit was asked of the supervisor (event aa0089676534922f), as in plan 0144.
- Phase 3: the first try in p03b failed the hook, probably on a dead reference to
  `core/instructions/documentation-door.md`, which phase 2 creates. The p03c rerun names the rule only, but its
  commit still failed with `commit-failed:git-error`, and no hook output was kept. An unconfined doc-health run
  and commit were asked of the supervisor (event 0759ff02d2d596ab).
- Phase 7: worktree p07. Commit 0336e6aa34; `cargo test -p fgos-documentation` and `cargo test -p fgos doc_locate`
  are green. The `npm run fgos:dev` live call and the timing were not run (sandbox). In review.
- Superseded worktrees p02 and p03 were handed to the supervisor for removal.
- 01:45 to 02:05: the supervisor ran `fgos git recover`, landed p02 (48bbd49188), p01 (712f1b9028) and phase 3 as p03w
  (2c5c90a967). The lead landed p07 (5216bb90ef); the land gates ran the Node gate set, `cargo fmt --check` and the
  selector export check, not `cargo test`, which phase 5's full gate covers. Phases 1, 2 and 7 are done.
- Phase 3 stays open: p03w did not carry the link in `plans/260925-documentation-authority-unification/plan.md`
  section 12.1 (acceptance criterion 5). Unit c-38499-1795805833048 wrote it in worktree p03x (branch
  `h2-step2-core-write-door/p03x`), and the runner commit failed again with `commit-failed:git-error`, so the
  supervisor is asked to commit and land it.
- A lead cannot merge the trunk into a worktree: `--sync` is dropped by the request door (unit c-35716-1795804977920
  recorded no syncBase), and a sync-only run is refused `bad-args`.
