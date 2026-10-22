---
title: "Identity I1-I4: machine, session, project ids and the shared directory"
status: planning
lane: IDENT
spec: docs/platform/identity/spec.md
created: 2026-10-22
---

# Identity I1-I4

Spec: [docs/platform/identity/spec.md](../../docs/platform/identity/spec.md). G0 is signed for I1-I4 (spec section 10). Board row: IDENT in [the program board](../261017-1313-fgos-platform-program-board/plan.md).

## Outcome

Every agent can print one stable handle for itself and its machine (`claude-4f@fg-server`) and paste it into the board, so lanes address each other unambiguously. Later rungs add the project id, a local directory that resolves handles, and the same directory across machines through Event Store refs.

## Order (owner 2026-10-22 11:20: "đẩy nhanh identity vì trao đổi lộn xộn quá")

The ladder of spec section 7 is reordered so the first landing removes the mess on the board. People and agents read board lines through Git already, so a stable printed handle fixes cross-machine naming before any automatic cross-machine resolution exists.

| Phase | Rung | Content | Proof | Waits for |
|---|---|---|---|---|
| [01](phase-01-machine-id-and-handle.md) | I2 | Identity crate mints and reads the machine id; Event Store reads it through the crate; machine handle and alias; `fgos identity machine` | crate tests; Event Store suite unchanged and green; `fgos identity machine --json` | — |
| [02](phase-02-session-full-id-and-handle.md) | I3a | Session full id `<machine-id>/<local id>` and a handle derived from the local id; `fgos identity session`; bare `fgos identity` adds both | crate vectors; two live sessions print different handles | 01 |
| [03](phase-03-project-id.md) | I1 | Project id in a tracked `.fgos/` file, minted by setup, fork keeps it, `fgos identity project [--new]`; doctor check | crate tests; doctor row; file survives the `.fgos` strip rules | — (parallel with 01-02) |
| [04](phase-04-local-directory-resolve-list.md) | I3b | Local directory of live sessions, role aliases `lead:<LANE>`, `resolve` and `list` on one machine | two live sessions resolve each other by handle and by role | 02, 03 |
| [05](phase-05-shared-directory-across-machines.md) | I4 | Directory entries published as an Event Store event type on the machine's ref; `resolve` across machines after one fetch | a session on one machine resolves one on another after `fgos events sync` | 04, Event Store publication live |
| [06](phase-06-board-and-consumers.md) | — | Board and reports name agents by handle (spec decision 6); Mailbox address takes the session handle | board rows rewritten once; mailbox spec points here | 02 (board), 04 (mailbox) |

## Landing on every machine and notes to consumers (owner 2026-10-22 11:25)

- A rung is landed only when every participating machine (three today) has activated the release that carries it. The IDENT lead tracks this in the board row: machine handle, release, date.
- After phases 01-02 land, each machine runs `fgos identity machine --json` and `fgos identity session --json` and posts one board log line with its own machine handle and session handle. That set of lines is the first machine roster, written by the machines themselves; phase 06 turns it into the board's reference list.
- After each landing the lead posts one board log line tagged `IDENT` addressed to MAIL (`f2c6f8ce`) and HARDEN (`forgent-a8`): what changed for them and the command that checks it.

## Frame (approved scope and budget)

- Scope: a new crate `packages/identity/rust`, its route in the host, its Convention kinds, setup and doctor registration, Event Store's machine-id read path, the identity and Event Store specs, CHANGELOG, the board. Session Identity's crate is called, not moved or renamed, until HARDEN T1 phase 6 lands (spec decision 1).
- Budget: about 1200 lines of Rust and Node source, 600 lines of tests, 300 lines of docs; phases 01-02 within one day.
- Out of frame (ask first): changing the local session-id rule, the `.fgos` strip rules (barrier F10), Event Store's ref naming, I5.

## Constraints

RUL104 (better, not bigger), L10 (move every caller, delete the old path in the same change), design principle 8 (one owning proof per behaviour), formats as Convention kinds (spec section 4 rule 5). Facts: [scout report](../reports/scout-261022-1100-identity-i1-i4-facts.md).

## Prior art (reused, not rebuilt)

- Machine id format and atomic mint: `packages/event-store/rust/src/identity.rs` (`valid_machine_id`, `mint_machine_id`). Moves into the identity crate unchanged.
- Local session id: Session Identity's rule (`packages/session-identity/rust/src/resolve.rs`), called as is.
- Store id stays with Event Store as the clone id; the clone handle is `<project-handle>@<machine-handle>`.
- Distribution `workspaceId` = `sha256(realpath)` is path-derived and stays a local key only.
