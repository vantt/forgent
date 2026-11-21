# Phase 5: Record sources and need resolution

Status: blocked on owner question `q-e2bpqz65c2` (depends on phase 4). Decisions: SR-D8 (the keeper never reads domain state),
OS-D11 (each need resolves at an existing door), OS-D14 (ask the referee before a start), OS-D16 (`waitingOn:
person` points at a question), OS-D21 (phases run in guide cases).

## Inputs

- `packages/supervision/rust/src/keeper.rs` and the contract from phase 4.
- `packages/supervision/rust/src/portfolio.rs` (the plan reader).
- `src/workflow/case-projection.mjs`, `src/workflow/case-verbs.mjs` (case state; `fgos workflow` verbs).
- `fgos run --help` (`--case`, `--activity`: case admission already exists).
- `docs/platform/session-host/spec.md` §3, §8; `docs/platform/identity/spec.md` (holders, successors).
- Phase 10's referee entry.

## Footprint

`packages/supervision/rust/src/sources.rs` (new), `packages/supervision/rust/src/lib.rs`,
`packages/supervision/rust/src/portfolio.rs`, `packages/supervision/rust/tests/sources.rs` (new),
`apps/fgos/src/wiring/supervision.rs`, `src/workflow/records.mjs` (new), `src/workflow/case-verbs.mjs`,
`test/workflow/records.test.mjs` (new), `core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`.

## Steps

1. Source port in `sources.rs`: `records() -> Result<Vec<Record>, SourceError>` plus `closed(item) -> bool` for the
   orphan rule. Sources are listed in a new config key `watcher.schedulingSources` (default: `plans`,
   `workflow-cases`); a source that fails is reported as a decision `source-unavailable` and its records are skipped,
   never guessed.
2. Plan source (Rust, over `portfolio.rs`): one record per `running` plan, step `lead`, `needs: { role: lead }`; a
   `ready` plan is already handled by admission (phase 1). A `done` or `withdrawn` plan closes the item.
3. Workflow-case source: `fgos workflow records --json` in `src/workflow/records.mjs`, folded from the existing case
   projection: one record per open activity of each open case; `needs: { capability }` from the activity's binding;
   `waitingOn: person` with the gate's question id while a gate waits; `outcome` when settled; `maxRounds` from the
   case frame. The Rust adapter calls the verb through the host and validates against the contract.
4. Need resolution adapters in the wiring: `role` -> Session Host start with that persona; `actor` -> Identity holder,
   live gets a wake (mailbox or `supervisor wake --trigger keeper --ref <item>:<step>`), dead gets its successor
   started; `capability` -> `fgos run --case <item> --activity <step>` through the run door. Before any start, ask the
   referee with the candidate's resource claims; `held` keeps the record waiting (reason `resource-held`), not an
   error.
5. `waitingOn: person`: read the question's state through the Questions crate; answered means actionable.

## Verify

`cargo test -p fgos-supervision --test sources` and `node --test test/workflow/records.test.mjs`. Pass: a case with
two parallel open activities yields two records and two `fgos run --case` starts (fake run door); a running plan yields
one lead record; a gate waiting on `q-…` yields `waitingOn: person` and becomes actionable after the answer; a failing
source reports `source-unavailable` and the other source still runs; a held resource keeps the record waiting.

## Rollback

Revert the phase commit; remove `schedulingSources` from config with it. Admission (phase 1) keeps working alone.
