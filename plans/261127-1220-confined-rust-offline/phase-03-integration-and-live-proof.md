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

## Owner answer q-wvelmdqfga (2026-11-28): option A

The first live check (release 460a9af0) compiled `pkm-core` offline and refused an empty cache in 0.05 s, but
`cargo test -p fgos-agent-context-engine --locked --no-run` exited 101: ort-sys 2.0.0-rc.15 reads
`CARGO_NET_OFFLINE` as "skip download" and then does not link the prebuilt binary it already cached in
`~/.cache/ort.pyke.io`. The owner chose option A:

- The `toolchain-cache` resource also binds the owner's `<home>/.cache/ort.pyke.io` read-only and sets
  `ORT_LIB_PATH` to its single `dfbin/<target>/<hash>` lib directory, only when exactly one exists (same
  private-root and confinement-root exclusions as the cargo and rustup homes). No directory, or more than one,
  gives no mount and no variable.
- The owning test in `confinement_policy.rs` and spec §9.4 are extended for it. Decision 3 (offline, named
  refusal) stays.
- Allowed: changes to the confinement resolver, its test and spec §9.4 only. Forbidden: anything else,
  vendoring ort, or changing `Cargo.toml` features.
- One fix unit runs in this phase's worktree, then the gates and the live check of step 4 run again.

## Verify

Pass: `reports/gates.md` shows all three gates green. `reports/live-check.md` shows the compile finished with
no credential prompt, and the empty-cache run refused within seconds with the named offline error.

## Rollback

Revert the integration land. Units go back to sending cargo gates to lead:SUPERVISOR.
