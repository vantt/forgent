# Integration report

Tree: trial/watch-p5 merged with origin/trial/watch-p4 (phases 1 to 5 together). Only conflict: the mutation census, regenerated with `node scripts/git-one-door-scan.mjs --root . --write-census` (0 undeclared sites). The command manifest merged cleanly.

## Gate on the combined tree
- `cargo build --locked --release --workspace`: ok.
- `cargo test --workspace`: 2821 passed, 0 failed. `cargo clippy --workspace --all-targets -- -D warnings`: clean.
- Node, 10 files (architecture, dispatch-inspect, run-verb, dispatch-runtime-inspect, run-result-v3-reader, doc-health, git-mutation-census, check-decision-citation-drift, help-routes, command-routes): 202 passed, 0 failed.
- `test/workflow` workflow-runner-seats, workflow-store-ledger, workflow-runner-cli: 24 of 30 pass, 6 fail. The same 6 fail on a detached worktree at origin/main (581ddcf52): pre-existing on main, not caused by this branch (for example the CLI exits 4 on `workflow start`).
- `node scripts/plan-contract-check.mjs`: could not run here (`git-addon-unavailable`: addon not shipped on this channel); not proven.

## Not done
- Partial-tree gates (phases 1 and 2 only; phase 3 only) and the live `--verify` check on this checkout were not run; the lead asked for the combined-tree gate only.

## Acceptance
Outcomes 1 and 2 are covered by the passing run-verb, run-result-v3-reader, dispatch-runtime-inspect and dispatch-inspect tests. The live end-to-end check is the unproven part.
