# Integration report: owner-question store (phase 10)

Phases 1-9 and 8b were landed on main one by one, so the integration merge of phase branches was not needed; the
phase 10 branch (`qs/p10`) started at origin/main (fef194f81).

## Gate (combined tree = origin/main + docs changes)
| Command | Result |
|---|---|
| `node scripts/export-command-selectors.mjs --check` | pass, no regeneration needed |
| `node scripts/git-one-door-scan.mjs --root . --write-census` | 0 undeclared sites, census unchanged |
| `npm test` | exit 0; 8419 tests, 8391 pass, 0 fail (rest skipped); no ERROR lines |
| `cargo test --workspace` | 3326 pass, 0 fail |
| `cargo clippy --workspace -- -D warnings` | pass |
| `cargo check -p fgos --target x86_64-pc-windows-msvc` | pass |
| `cargo check -p fgos --target aarch64-apple-darwin` | pass |
| `cargo test --manifest-path apps/fgos-gateway/Cargo.toml` | 103 pass, 0 fail |
| `node scripts/plan-contract-check.mjs --plan plans/261118-1159-owner-question-store` | not run to a verdict here: `git-addon-unavailable: addon not shipped on this channel`; the lead asks the supervisor to run it on main |

## CLIs without the receipt hook
agy, omp and pi have no Stop or prompt-submit event whose output can reach the model, so there is no path for the
hook to tell the session its question was answered (phase 6). They read answers through `fgos questions show`.

## Question ids
- Migrated: none. No open owner question existed at cutover; Miu confirmed none on live branches.
- Handed to other planners: none.

## Backlog
Row p-o5h4qfpt53 was already `done` naming 849d0bc36 on main; p-wgbzcazoak stays `proposed` (non-goal).

## Known follow-ups
- Web TaskDetail D17 vitest fails on main (tier missing); not caused by this plan.
- The main-checkout ledger needs `npm run build:skills` after the fast-forward (p-vxmrnkpykj).
- Plan 1045 phase 7 lists `land-remote-diverged` where a local-ahead branch now refuses `land-target-ahead`.
- Live acceptance of `fgos session write` is pending the release.
