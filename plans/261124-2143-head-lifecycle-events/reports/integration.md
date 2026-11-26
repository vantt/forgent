# Integration report: head-lifecycle-events, phase 6

## Tree

- Gates ran on main `4780cdb2e`, which contains the four phase lands: `2b18815f1`, `0463c0385`, `8eeb37fef`, `8afaaba50`.
- They were run on 2026-11-26 by the unconfined supervisor session; evidence: [lead-supervisor-gates-261126-1340.md](lead-supervisor-gates-261126-1340.md).
- An earlier confined unit run (ticket `c-20573`) could not run the gates: its sandbox was read-only outside the worktree.

## Gates

| Gate | Exit | Result |
|---|---|---|
| `npm test` | 1 | 6621 tests, 6575 pass, 19 fail, 27 skipped |
| `cargo test --workspace --no-fail-fast` | 101 | 4502 pass, 3 fail |

## Failing files and attribution

Attribution is the supervisor report's; see [lead-supervisor-gates-261126-1340.md](lead-supervisor-gates-261126-1340.md) for detail.

cargo (3):
- `component-authority` `model_checks`: `head-permissions.v1.json` has no row (failed the day before too).
- `apps/fgos/tests/cli_tests.rs` host-interrupt test: fails only in the full run, passes alone (load-sensitive).
- `packages/mailbox/rust/core/tests/frame.rs` frame-contract placeholders: belongs to plan 261125-2313 phase 5.

npm (19):
- `test/run-supervisor/terminal-cutover.test.mjs` (8), `test/runner/provider-per-cli-credential-sources.test.mjs` (3), `test/workflow/guide-schema.test.mjs` (2), `test/install-packaging.test.mjs` (1), `test/scripts/convention-conformance.test.mjs` (1), `test/git/one-door.test.mjs`.
- `test/scripts/check-decision-citation-drift.test.mjs` (3 findings): two backlog rows cited D-local ids; fixed in `b79b357e2`.

## Conclusion

No failing file is in this plan's footprint, so acceptance 7 is met in the sense that this plan adds no failure. Main itself is not green: both full gates exit non-zero, for the reasons above, owned elsewhere.

## Open

- Step 2 (live lead-ended check with a throwaway lead) is still open; the supervisor runs it once the watcher tick is free (the last attempt got `skipped-busy`).
- Step 3 (CHANGELOG line) is parked while plan 261125-1631-agent-context-engine holds `CHANGELOG.md`.
- Step 4 is done: `p-iatzcg2gee`, `p-6hqvgokerb`, `p-tyowvhthul` and `p-pv7ha3l5ss` are `done` in `plans/backlog/` and `plans/backlog.md`, each with a closing note naming its owning proof.
