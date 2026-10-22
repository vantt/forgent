---
title: "Identity: one door for every id (machine, project, session, and every owner's records)"
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
| [00](phase-00-rename-to-identity.md) | — | Rename package, crate, operation id and spec to Identity; move every caller | `cargo test --workspace`, `npm test` green; `rg fgos_session_identity` finds nothing | — (first) |
| [01](phase-01-machine-id-and-handle.md) | I2 | Machine id minted and read here; Event Store reads it through Identity; machine handle and alias; `fgos identity machine` | crate tests; Event Store suite green; `fgos identity machine --json` | 00 |
| [02](phase-02-session-full-id-and-handle.md) | I3a | Session full id `<machine-id>/<local id>` and a stable handle; `fgos identity session`; bare `fgos identity` adds optional fields | crate vectors; two live sessions print different, stable handles | 01 |
| [03](phase-03-project-id.md) | I1 | Project id in tracked `.fgos/project.json`, minted only by explicit `fgos identity project --init`, fork keeps it, `--new` splits; doctor warns when absent | crate tests; two clones of one repo print the same id | 00, 01 |
| [07](phase-07-mint-door-for-every-owner.md) | — | Mint door for every owner (spec section 4a): random 50-bit ids, counter refs for sequences; move `tsk-`, decision numbers, `D-ADR` and `p-` onto it | crate tests; a two-clone race on a real remote claims distinct numbers; doctor finds no duplicate id | 01 |
| [04](phase-04-local-directory-resolve-list.md) | I3b | Local directory of live sessions, role aliases `lead:<LANE>`, `resolve` and `list` on one machine | two live sessions resolve each other by handle and by role | 02, 03 |
| [05](phase-05-shared-directory-across-machines.md) | I4 | Directory entries through Event Store refs; `resolve` across machines after one fetch | a session on one machine resolves one on another after `fgos events sync` | 04, Event Store publication live (outline only) |
| [06](phase-06-board-and-consumers.md) | — | Board and reports name agents by handle; Mailbox address takes the session handle | board rows rewritten once; mailbox spec points here | 02 (board), 04 (mailbox) |

## Landing on every machine and notes to consumers (owner 2026-10-22 11:25)

- A rung is landed only when every participating machine (three today) has activated the release that carries it. The IDENT lead tracks this in the board row: machine handle, release, date.
- After phases 01-02 land, each machine runs `fgos identity machine --json` and `fgos identity session --json` and posts one board log line with its own machine handle and session handle. That set of lines is the first machine roster, written by the machines themselves; phase 06 turns it into the board's reference list.
- After each landing the lead posts one board log line tagged `IDENT` addressed to MAIL (`f2c6f8ce`) and HARDEN (`forgent-a8`): what changed for them and the command that checks it.

## Frame (approved scope and budget)

- Scope: the one identity component, grown inside the existing crate, renamed first to `packages/identity/rust` (phase 00; no new crate), its route in the host, its Convention kinds, setup and doctor registration, Event Store's machine-id read path, the identity and Event Store specs, CHANGELOG, the board. Scope also covers the mint door and moving the four colliding id kinds onto it (phase 07). Out of frame: ids already safe across machines (unit run, workflow run, claim, reservation and operation ids carry milliseconds plus 32-128 random bits and live in machine-local records), which are not churned (RUL104).
- Budget: about 1500 lines of Rust and Node source, 800 lines of tests, 400 lines of docs; phases 00-02 within one day.
- Out of frame (ask first): changing the local session-id rule, the `.fgos` strip rules (barrier F10), Event Store's ref naming, I5.

## Constraints

RUL104 (better, not bigger), L10 (move every caller, delete the old path in the same change), design principle 8 (one owning proof per behaviour), formats as Convention kinds (spec section 4 rule 5). Facts: [scout report](../reports/scout-261022-1100-identity-i1-i4-facts.md).

## Prior art (reused, not rebuilt)

- Machine id format and atomic mint: `packages/event-store/rust/src/identity.rs` (`valid_machine_id`, `mint_machine_id`). Moves into the identity crate with its slug and random helpers (phase 01).
- Local session id: Session Identity's rule (`resolve.rs`, in `packages/identity/rust` after phase 00), called as is.
- Store id stays with Event Store as the clone id; the clone handle is `<project-handle>@<machine-handle>`.
- Distribution `workspaceId` = `sha256(realpath)` is path-derived and stays a local key only.

## Red Team Review

One reviewer (sonnet), four lenses: [report](../reports/red-team-261022-1100-identity-i1-i4-plan.md). 12 findings (3 critical, 5 high, 4 medium), all with file:line evidence, all accepted by the lead (within the G0 frame, so not asked):

| # | Finding | Applied in |
|---|---|---|
| 1 | Deleting `fixEventStoreMachineId` breaks `events migrate` | 01: it stays and calls the identity mint |
| 2 | Bare `fgos identity` on the hook path must not fail or write | 02: optional fields, `machine: null`, no writes; 04: explicit registration only |
| 3 | Setup on three machines would mint three project ids | 03: explicit `--init` only, refuses when the remote already has it; committed once by the lead |
| 4 | Writes under a Read/Safe route | 01: operations `identity.writer` (renamed in 00), `identity.read`, `identity.write` |
| 5 | Outcome schema forbids additive fields | 02: contract `1.1.0`, optional keys, moved with its golden |
| 6 | Host runtime leaking into Event Store and the addon | 01: library without host-runtime; provider behind a cargo feature |
| 7 | Mint cannot move verbatim; three proofs of one rule | 01: `text` module moved down; one validator; Event Store duplicates deleted |
| 8 | Machine handle may fail its own kind; no alias writer | 01: cut to 40, `m-` prefix, `--alias` verb |
| 9 | Convention cannot express `@`, `:` or a fixed set | 01, 02, 04: only single-class part kinds; composition tested in the crate |
| 10 | Handle instability (lengthening, reboot, unresolved, private `usable()`) | 02: 4 chars, boot id in pid ids, unresolved has no handle, additive `env_var` field |
| 11 | Liveness of the wrong process; unbounded directory | 04: head Record from the tree walk, prune on write, cap 512 |
| 12 | File lists and weak verifications | all phases: files added; 06 grep fixed; 05 marked outline only |

### Whole-Plan Consistency Sweep
Searched every phase for the superseded terms (setup mints the project id, delete `fixEventStoreMachineId`, 3-character suffix, Convention `machine-id` and `cli-name` kinds, registration on first read, `grep -c '@'`): none remain. Phase 03 now depends on 01 for the crate. No contradictions left.
