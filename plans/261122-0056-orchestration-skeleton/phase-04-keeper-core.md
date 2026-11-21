# Phase 4: Scheduling record contract and keeper core

Status: blocked on owner question `q-e2bpqz65c2` (OS-D12 and OS-D19 are tentative). Decisions: OS-D4, OS-D5,
OS-D7, OS-D9 (`waitingOn`, `outcome`), OS-D10 (`until`), OS-D11 (`needs`: `role`, `actor`, `capability`), OS-D12
(one record per open step, key `item`, `step`), OS-D13 (loop cap belongs to the domain; the keeper counts and
compares).

## Inputs

- Discussion §6 and §3 4h, 4i, 4m.
- `packages/supervision/rust/src/wake.rs` after phase 1 (admission and its ports).
- `packages/supervision/contracts/event-streams.v1.json`.

## Footprint

`packages/supervision/contracts/scheduling-record.v1.json` (new), `packages/supervision/contracts/event-streams.v1.json`,
`packages/supervision/rust/src/keeper.rs` (new), `packages/supervision/rust/src/lib.rs`,
`packages/supervision/rust/src/wake.rs`, `packages/supervision/rust/tests/keeper.rs` (new).

## Steps

1. Contract `scheduling-record.v1.json`: `{ item, step, waitingOn?, needs?, outcome? }`. `item` and `step` are
   domain ids, never minted here. `waitingOn: { kind: actor|time|event|person, ref, until? }`. `needs: { kind:
   role|actor|capability, ref, maxRounds? }`. `outcome: done|withdrawn|wontfix|cancelled`. A record with `outcome` is
   closed; with no `waitingOn` and no `outcome` it is actionable. Unknown fields refused by name.
2. `keeper.rs`, pure: input = records from all sources, `now`, the keeper's own past decisions (from the event
   stream), caps. Output = decisions, each with a reason code:
   - actionable with `needs` -> `start` (or `wake` when the actor is live), unless a cap holds it;
   - actionable with no `needs` -> raise `needs-judgement` (reason `needs-missing`);
   - `waitingOn.until` passed -> raise `until-expired` once; event id `until:<item>:<step>:<until>` so repeated ticks
     raise once;
   - starts for (`item`, `step`) reached `needs.maxRounds` -> raise `needs-judgement` (reason `round-cap`), no start;
   - a record whose `item` the source reports closed while the record is open -> raise `needs-judgement` (reason
     `orphan-record`); never close it.
3. Wire the keeper into the wake door after admission: decisions of kind raise go through the raise door; start and
   wake decisions go through the ports (adapters arrive in phase 5; here fakes). Add the decision record kinds to
   `event-streams.v1.json`.

## Verify

`cargo test -p fgos-supervision --test keeper`. Pass: two open steps of one item yield two starts; an `until` past
`now` raises once across three ticks; missing `needs` raises `needs-missing`; `maxRounds` reached raises `round-cap`;
an orphan raises and stays open; a record with `outcome` yields nothing. Record contract fixtures validate.

## Rollback

Revert the phase commit; no source writes records yet.
