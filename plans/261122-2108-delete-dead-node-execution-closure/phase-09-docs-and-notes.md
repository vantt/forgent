# Phase 9: Docs, contract notes, comments and skills stop naming deleted files

Capability: `code:implement` (docs and comment text only; no code behaviour changes).

## Inputs

- `plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md`: the dead table, the live-kept table, and step 7's list of files that name a dead path as
  text.
- `plan.md` Decisions (the frozen mailbox harness) and Non-goals (which history records stay untouched).
- `docs/platform/governance.md#decision-scope-to-holder-table` (where a settled fact goes).

## Footprint

The phase 9 footprint in `plan.md`'s phase table: the live specs and contracts under `docs/platform/`, the
confinement how-to, `docs/reading-map.md`, the contract notes under `packages/execution/contracts/**` and
`packages/run-supervisor/contracts/{controller/**,envelope.v3.json,unit-state.v1.json,worker-env-allowlist.v1.json}`,
the agent-protocol and resource-referee contracts, the 17 Rust files whose comments name a dead Node file, the three
core skill sources, and their generated renders `.agents/skills/**` and `plugins/fgOS/skills/**` (regenerated, never
hand-edited).

## Steps

1. For each listed file, change only the text that presents a dead Node file as a living twin, owner or source.
   Name the Rust owner instead, or mark the text as history ("recorded from the retired Node module <name>"). Leave
   descriptions of live files alone.
2. Contract JSON: edit only the `note`, `about`, `description` and `implementation` prose fields. Keep every
   fixture value and key. Run the crate's tests afterwards to check that no test reads the edited prose.
3. Rust: edit comments only. `git diff -U0 -- '*.rs'` must show changed lines that are all comments.
4. `docs/platform/runner/spec.md`: add one settled-fact line. It says the Node Execution closure is deleted except
   for the files the frozen mailbox harness reaches, that those files retire when the mailbox lane re-measures, and
   it cites `packages/component-authority/model/`. Remove the `p-24xw2cwdvo` pointers from `docs/platform/runner/spec.md`,
   `docs/platform/run-supervisor/spec.md`, `docs/platform/component-boundary.md`, `docs/reading-map.md` and
   `docs/platform/runner/decisions/h-36d872fbb0e5.md`; if the last of these still needs an edit, raise it as a
   footprint-widen question instead of editing it.
5. Edit the core skill sources, then run `npm run build:skills`.

## Verify

`npm run build:skills` leaves no diff after it runs a second time. `git diff -U0 -- '*.rs'` contains only comment
lines. `cargo test -p fgos-execution -p fgos-run-supervisor` passes (crate names from `Cargo.toml`; run them alone).
`node --test test/architecture.test.mjs` passes. Pass condition: all green, and `git grep -n p-24xw2cwdvo -- docs`
finds only history records.

## Rollback

`git revert` the phase commit, then run `npm run build:skills`.
