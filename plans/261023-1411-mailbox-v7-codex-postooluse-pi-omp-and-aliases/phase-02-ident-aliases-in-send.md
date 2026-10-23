---
phase: 2
title: "V7b: IDENT handles, full ids and lead:<LANE> as send addresses"
status: pending
sub_rung: V7b
depends_on: [phase 1, IDENT C2 and C1b answers (fallbacks allowed)]
live_budget: "0"
---

# Phase 2: IDENT aliases in `send` (V7b)

## Context

Owner 11:38 "B rồi A": right after V6, `send --to` takes an IDENT handle (`claude-5v7u@fg-server`) or `lead:<LANE>`, resolved through IDENT; the signed names `<project>-<cli>-<2 chars>` keep working. IDENT 12:40: `not-found`/`ambiguous` are IDENT's codes; the mailbox maps them to `unknown-name`/`ambiguous-name`, with typed candidates `{id, handle, liveness}` (plan F4).

## Requirements

1. Host wiring `mailbox_verbs.rs`: alias detection (plan decision 5): `@` or `/` anywhere, or a `lead:` prefix. `@` and `lead:` through `fgos_identity::directory::resolve(state_root, query, &judge_here)`; `/` through C2's door, else the split with `machine_info` (another machine: `unknown-name`, "cross-machine delivery is not in this slice"). The state root from the resolver the `identity` verbs use; the read is behind the same `HOME` rule as the hook.
2. **Delivery only to this record's heads** (plan decision 5): a resolved entry passes as its local id (the writer key) in `SendRequest.to` only when that key is a live binding of this record and, for `@`, the binding's derived handle (decision 8, `handle_of`) equals the query. Otherwise `SendRequest.alias_refusal = Some(Unknown{candidates})` with the detail "that session has no mailbox address in this project". On IDENT `not-found` for `@`, the record's bindings are matched by derived handle before refusing.
3. Core: `SendRequest.alias_refusal: Option<NameRefusal>` (`Unknown` or `Ambiguous`, candidates as plain core data `{id, handle, liveness}`); check 2 uses it in place of resolution; counting, the other checks and the counters' reasons are unchanged (`count_attempt` already runs first, `core/src/delivery.rs:366-368`). No other core type changes.
4. Candidates are intersected with this record's live heads (plan decision 6). Text output joins handles; `--json` carries the typed objects. A `lead:` delivery adds the contract line `[report.role-holder]` ("delivered to the current holder of {{role}}, {{handle}}").
5. Spec: §5.1.1 "Role aliases" row replaced by the alias rule, §5.3 check 2 wording, §6.1 `send` row, new §8 item (role and handle addressing is an unauthenticated convenience; any same-user process can take a role), §17 row.

## Tests first

| # | Behaviour (test title) | File |
|---|---|---|
| T1 | an alias refusal is counted toward the budget and the lifetime cap and refused with its own reason and candidates | `core/tests/delivery.rs` (check-order table gains the alias rows) |
| T2 | an ambiguous alias is refused ambiguous-name with every candidate | same |
| T3 | an alias resolving to the sender itself is refused as self | same |
| T4 | text with @, / or a lead: prefix is an alias and every other text a mailbox name; a project folder containing @ still composes a short name without @ | detection unit test in `apps/fgos/src/wiring/mailbox_verbs.rs`; composition in `core/tests/names.rs` |
| T5 | a handle IDENT resolves to a session that is not a head of this record is refused unknown-name and says it has no address here | `apps/fgos/tests/mailbox_routes.rs` (temporary state root; IDENT directory written by IDENT's own `register`) |
| T6 | send --to lead:<LANE> reaches the head of this record that holds the role and names it in the report | same file (the one wiring proof of the alias path) |
| T7 | send --to @ lists only this record's heads as candidates | same file |
| T8 | a handle IDENT does not know resolves to the record's binding whose derived handle matches | same file |
| T9 | a full id of another machine is refused unknown-name and names cross-machine delivery as not in this slice | same file (only while the split fallback is used) |

## Steps

1. Sync; check the board for C1b/C2 answers.
2. T1-T9 failing; implement core field, wiring, contract lines.
3. `CARGO_BUILD_JOBS=4 cargo test -p fgos-mailbox-core -p fgos-mailbox -p fgos -- --test-threads=4` green; `cargo tree -p fgos-mailbox -e normal | grep -c host-runtime` prints 0 (plan decision 3).
4. Spec edits; sync.

## Acceptance

- T1-T9 green; the check-order table covers every adjacent pair with the alias rows.
- `fgos-mailbox` and `fgos-mailbox-core` dependency sets unchanged.

## Risks

- IDENT's directory is machine-wide and unauthenticated: a same-user process can take `lead:MAIL`. The record check bounds delivery to heads this record verified by the hook's caller check; the report names the holder; spec §8 states the limit.
