# Progress: phase 5 code half landed; data move waits on q-exu5x27hbq

Lead: head:lead-forgent-261120-0625-work-d-ce9f6. Date: 2026-11-21, Asia/Saigon.

## Outcome

The code half of phase 5 landed on main as `da4a572b4` (`land work-data-model/p05d`). It has the single Rust implementation of `fgos migrate portfolio` (`apps/fgos/src/wiring/migrate.rs`), its proof `apps/fgos/tests/migrate_portfolio.rs` (18 tests), and readers that accept both the old and the new layout (`discussion_source.rs`, `refcheck.rs`, `head-plan.mjs`, `identity-ids-unique.mjs`, `check-backlog-reconciliation.mjs`). The id check keeps the minted shape for new ids and accepts legacy shapes only when reading existing files. Phase 6 started in parallel.

## What ran

- Gemini unit `c-2867` ran the whole phase at once. After 35 minutes it ended `execution-failure` (`infra-exec-failed`), leaving 6 files edited and nothing committed.
- The lead split the phase in two: code first, then the data move. Claude units cannot run cargo, node, `git apply` or `cp`, and they cannot read the main checkout. So the lead ran every test itself and handed over fixes and rustfmt output inline in the prompt.
- A code-reviewer subagent checked the branch against the real `docs/backlog.md` and `docs/discussions/`. It found 5 blockers:
  - the 97 `## Done / Declined` bullets were lost;
  - the reference rewrite edited code, contracts and a nested checkout under `.claude/worktrees/`;
  - an interrupted run could not recover;
  - real rows had wrong status or wrong cells;
  - 5 discussions failed the check.

  It also found 7 smaller issues, one of which was that new ids no longer had to come from the mint door. All of them were fixed in `1d48a14cb`.
- The lead ran the real migration on a throwaway clone. Results:
  - 445 rows became 445 items (348 table rows plus 97 bullets), and 51 discussions moved.
  - A second run changed nothing.
  - The remaining check errors are 69 legacy plan statuses (phase 7's job), the malformed `source:` entry `p-g2iprtzptz (the ...)` in plan `261117-1856-secretary-session-spine`, and one done-item / running-plan drift that clears when this plan is done.
- Land gates failed three times, each fixed at its cause:
  - the git one-door scan refused a raw `git ls-files`, so the migration now uses `GitDriver::tracked_paths` and refuses if the driver fails inside a checkout;
  - the architecture door rows refused copied code, so the migration now uses `civil_time::civil_from_days` and the scripts use `readFrontmatter`;
  - once main moved during the gates (`land-target-changed`), and the retry landed.

## Verify by the lead

The following are green: `cargo test -p fgos --test migrate_portfolio --test portfolio_check --test session_write_publish` (18, 14 and 5 tests), `cargo test -p fgos-supervision -p fgos-questions`, `cargo clippy -p fgos --all-targets -D warnings`, and `cargo fmt --all --check`. In this sandbox, the git driver tests need a writable 0700 `FGOS_STATE_ROOT`.

## Next for phase 5 (unit 2, after q-exu5x27hbq)

1. Route the verb (`main.rs`, `command-routes.json`, `command-route-annotations.json`).
2. Run `fgos migrate portfolio` as one commit.
3. Swap the head grants.
4. Hand-edit the code literals the prose-only rewrite leaves alone: `bin/fgos.mjs`, `core/agents/*.yaml`, `core/config-standard/sessionRotation.yaml`, the `src/` and `test/` files listed in the footprint, the convention rules and golden, and the supervision fixtures.
5. Run `npm run build:skills`.
6. Remove the old-path fallbacks in the readers.

## Tool frictions

- `fgos run` drops `--sync`, `--override`, `--plan`, `--phase`, `--timeout` and `--effort` from the ticket argv.
- `fgos request result --wait N` is refused with bad-args.
- `fgos request result` with no id fails with `verb-failed`.
- The claude worker sandbox refuses cargo, node, `git apply` and reads outside the worktree.
