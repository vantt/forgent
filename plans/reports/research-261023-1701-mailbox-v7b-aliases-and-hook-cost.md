---
title: "Mailbox V7b: Identity names as addresses, head registration with Identity, handle in frames, hook cost"
description: "Phases 2-3 of plans/261023-1411-mailbox-v7-codex-postooluse-pi-omp-and-aliases: send --to takes Identity handles, full ids and lead:<LANE>; a newly bound head is made known to Identity; frames show the sender's handle; the hook's cost measured with Identity linked."
date: 2026-10-23
---

# Mailbox V7b: aliases, registration with Identity, handle in frames, cost

Branch `mailbox/v1-v3`. Commits: `a3574712c` (aliases), `b251608d5` (registration and handle), `db1b0bf87` and `d79d85b6e` (cost instrument, live cases A1/A2). Main merged at `e2712f058` (Identity doors at `0d3224362`).

## Identity doors used

The plan's fallbacks were not used, because IDENT's doors landed on main before the wiring was written:

- `directory::resolve` for handles, `lead:<LANE>` and full ids. The mailbox does not split ids.
- `session_for(state_root, &WriterKey)` derives each head's full id and handle from its key and the session-id variable Identity names its CLI by. The mapping comes from Identity's own `ENV_ORDER` and `session::cli_of`.
- `directory::register_writer(state_root, None, &key, head_pid, &[], false)` registers a newly bound head.
- The state root comes from `fgos_holder_lock::state_root` (the `identity` verbs' resolver). It is read only when `HOME` is set.

There is no `handle_for` door. The handle is `session_for(...).info.handle`. pi and omp are not wired; `PI_SESSION_ID` (C4) is not on main.

## Proof

- `CARGO_BUILD_JOBS=4 cargo test -p fgos-mailbox-core -p fgos-mailbox -p fgos -p fgos-identity -- --test-threads=4`: 432 passed, 0 failed (`/tmp/fgos-work/mailbox-v7/p3-gate.log`). Phase 2's gate before that was 360 passed.
- `cargo tree -p fgos-mailbox -e normal | grep -c host-runtime` printed 0. `Cargo.lock` is unchanged; `fgos-process` moved from a dev-dependency of `apps/fgos` to a normal one.
- Mutants killed (12). **Correction (V7 review H1):** the mutant that drops the id match in `address` (`info.id == listed.id`) was not among them. It survived the shipped tests, because every alias proof used a record with one head. The "Identity id check" in this list was the one in `ensure_registered`. The review-fix step adds a two-head proof that kills the `address` mutant.
  - core: the alias check placed after resolution;
  - wiring: a resolved session delivered without the record check, candidates left unfiltered, the derived-handle fallback removed, the Identity id check in `ensure_registered` removed, the register door skipped;
  - store: the registered flag set on a refreshing call, and the handle not set at render;
  - phase 1 (5): listed in the V7a report.

## Live runs (4 of 4 budgeted, benign, no retry, dry runs first)

| Case | CLI | Result |
|---|---|---|
| A1 | Claude Code 2.1.309, 7.1 s | Passed. The head took `lead:MBXTEST` itself (`fgos identity session --register --role`); Identity listed it as `claude-yk2t@mailbox-live`. The send `--to` that handle and the send `--to lead:MBXTEST` were both recorded for `project-claude-fd`, offered inline, and their tokens reached the final answer. The role answer ended "delivered to the current holder of lead:MBXTEST, claude-yk2t@mailbox-live". The frame showed the peer's handle. |
| A2 | Codex 0.161.0, 13.3 s | Passed. Identity listed the Codex head as `codex-y4ws@mailbox-live`, registered through `register_writer` (liveness `alive`). The send `--to` that handle was offered inline. Frame header: `<mailbox-message from="project-claude-7a" agent="claude" handle="claude-5z5t@mailbox-live" id="8ed20d4a9a44e7c8" attempt="1">` |
| T1 | Claude Code | Steady `PostToolUse` p95 30.4 ms (n 99, p50 23.6, max 33.0); registering call 14.1 ms. Every check passed. |
| T2 | Codex | Steady p95 39.6 ms (n 98, p50 25.8, max 44.0); registering call 23.6 ms. The p95 check passed. The `heldBack` check failed because the model ran `fgos mailbox inbox --claim` after the pointer line, despite the prompt telling it to ignore added context. The message ended `offered` (1 offer). This is a model-behaviour finding that bears on V7c's arm P, not a cost result. |

Both steady p95 values are under the 50 ms target (V5: 26.5 ms and 38.1 ms).

## Registering-call cost (no CLI, no model)

`cargo run --release -p fgos --example mailbox-ident-cost -- /tmp/fgos-work/mailbox-v7/ident-cost` (`/tmp/fgos-work/mailbox-v7/ident-cost.log`) ran 50 process-level calls of the release host after 3 warm-up calls. Each call named a new key for the same head, so the mailbox replaced the binding and asked Identity. Every call added exactly one Identity entry and left no hook-outcome line.

| Series | p50 ms | p95 ms | max ms |
|---|---|---|---|
| registering, directory of 450-499 entries | 14.1 | 32.0 | 51.6 |
| registering, empty directory | 3.0 | 3.8 | 3.9 |
| steady, same key | 2.1 | 2.3 | 2.4 |

The p95 is under 50 ms. The component that grows is Identity's directory scan, which judges each entry's head and so reads its process facts. The directory cannot hold the plan's 500 entries through 50 registering calls without passing its 512-entry cap, so the seed was 447 and the last measured call left 500.

Host binary (release): 11,190,440 bytes at V7a, 11,251,832 bytes now (+61,392).

## Deviations

1. No fallbacks. C1, C1b and C2 were covered by the landed doors, so the split and the "other machine" note planned for T9 were never built. Identity's full-id resolve answers `not-found` for another machine.
2. The Identity code lives in `apps/fgos/src/wiring/mailbox_identity.rs`: aliases, `session_of` for the frame handle, and `ensure_registered`. The detection unit test is there too.
3. An alias refusal keeps the group check first (check 1), then takes check 2's place.
4. The frame shows `handle="unknown"` for a head whose handle cannot be derived, and `handle="unregistered"` for a sender with no head. Role and handle values, and alias candidates, go through `escape_handle` (the header alphabet plus `@` and `:`).
5. Two by-hand instruments were added: `apps/fgos/examples/mailbox-ident-cost.rs` (the measurement) and `apps/fgos/examples/identity-mint-machine.rs`. The live cases' private state roots need a machine id, and the product mints one only in the Node `doctor --fix`, which a private release does not stage.
6. A registering call on a machine with no machine id now leaves `ident:machine-id-missing` in the hook-outcome file. One existing proof was adapted to mint first.

## Open

- IDENT's `session_for` is about to gain a `head_pid: Option<u32>` argument. It is adapted at the next sync if it is on main.
