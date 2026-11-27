# Phase 3: integration and live proof

Capability: `code:test`.

## Inputs

- `plan.md`: acceptance criteria 1 to 5.
- The branches of phases 1 and 2.

## Files this phase may write

- `plans/261127-1220-confined-rust-offline/reports/` (gate output and live-check transcripts)

## Steps

1. Merge the phase 1 and phase 2 branches onto one integration tree.
2. lead:SUPERVISOR job, on the integration tree:
   `cargo test --workspace`, `npm test`, and `git diff --exit-code packages/execution/contracts`.
   Record the tail of each output in `reports/gates.md`.
3. Land the integration through the land door.
4. Once a release that contains the land is staged and activated (the owner or lead:SUPERVISOR, as for every
   release), run the live check of acceptance criterion 4. Dispatch one confined unit under an invocation with
   `homeEnv: HOME` that runs `cargo test -p fgos-agent-context-engine --locked --no-run` in its worktree.
   Record the launch argv lines `--ro-bind` for both cache paths and the cargo tail in `reports/live-check.md`.
   Then run the same command in a unit with `CARGO_HOME=$(mktemp -d)`. Record the exit code, the elapsed time
   (seconds, not minutes) and cargo's offline refusal naming `pkm-core`.
5. Tell the planner of plan `261124-1853-confinement-to-rust` in one line that the resolver now carries
   `toolchain-cache`, and that its port and delete of the Node twins must keep that resource.
6. After the live check passes, the lead marks backlog row p-ymhj4xcf6x done, and leads stop sending cargo
   gates to lead:SUPERVISOR.

## Verify

Pass: `reports/gates.md` shows all three gates green. `reports/live-check.md` shows the compile finished with
no credential prompt, and the empty-cache run refused within seconds with the named offline error.

## Rollback

Revert the integration land. Units go back to sending cargo gates to lead:SUPERVISOR.
