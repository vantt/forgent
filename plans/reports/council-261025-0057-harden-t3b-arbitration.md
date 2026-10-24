# HARDEN T3 part 04b arbitration: Event Store

Big lead `lead:HARDEN` `claude-p74h@fg-server2`, 2026-10-25 01:00 (Asia/Saigon), main `52149c6cd`.

**Inputs:**
- the [brief](council-261025-0017-harden-t3b-council-brief.md) and the [baseline](research-261024-2352-harden-t3b-event-store-baseline.md);
- four seat reports:
  - [correctness](council-261025-0017-harden-t3b-seat-correctness.md) (opus);
  - [speed](council-261025-0017-harden-t3b-seat-speed.md) (sonnet);
  - [simplicity](council-261025-0017-harden-t3b-seat-simplicity.md) (sonnet);
  - [red-team](council-261025-0017-harden-t3b-seat-redteam.md) (opus);
- WORK's verdicts, sent before this arbitration (WORK owns the store's semantics), are quoted where used.

**Evidence the big lead re-checked directly on main:**
- **Missing root is an I/O error.** `receipt.rs:89-91` `own_bounds` does `read_dir(&layout.root).map_err(io)?`. A missing `.git/fgos/events` becomes `event-store-io: NotFound`.
- **No move confirmation exists.** `identity.rs:124` refuses with "explicit move confirmation required", and no confirmation path exists in `src`, `bin` or the crate.
- **Work is Linux-only by design.** `src/event-store/native.mjs:11` and `consumers.mjs:8` refuse on any `process.platform !== 'linux'`, which covers macOS too. WORK confirms this was deliberate (D15).
- **Read verbs sync in process.** The end trigger runs in the main process after the answer is printed (`bin/fgos.mjs:5297-5300`, `maintainEventStore(..., { end: true })`).

## 1. Outcome in one paragraph

The store's own invariants hold: no lost, duplicated or reordered event was found in any run, and seal, receipt and directory fsync ordering checked out. The failures sit at the store's edges:
- **Its first use:** a fresh clone reads `NotFound`. A hand-made `.git/fgos` with mode 775 is refused under the wrong name.
- **Its trust of peers:** one bad fetched ref makes every read fail on every machine (RT1). A peer's rewind is silently dropped (RT4).
- **Its identity:** moving a clone, or following the spec's own shared-machine-id advice, bricks the store with a confirmation step that does not exist (RT2).
- **What callers do around it:**
  - read verbs sync in process, holding the seal lock across network calls of up to 120 s each;
  - the write admission memoizes transient errors for the life of a process;
  - the Work state hot lock, which the store itself does not need, times out in 87% of 20-session release runs.

The delete list after the H33 fence release is large (about −1 450 src and −1 150 test lines), and three cuts can be made now.

## 2. Part A: target shape (for owner approval, then into the spec)

- **Authority.** The one writer and reader of Work's per-machine event refs, as owner direction B already defines. This arbitration adds two rules:
  - **Edge rule.** The store treats every input it does not own as hostile and every state it can name as named. A missing store root means "no history yet" for reads, and the reader's refusal names `fgos setup` and the path. A bad foreign ref is skipped, and the skip is named:
    - the read result carries the skipped ref;
    - `event-store-integrity` fails on it;
    - it is never dropped silently.

    The machine's own ref stays fail-closed (WORK). A peer rewind is named the same way.
  - **Identity rule.** A store move never bricks the store. Either the refusal names a confirmation path that exists, or the spec's move rule (store id kept) is what the code does. The spec's shared-machine-id advice either works or leaves the spec. WORK chooses which, with a test for both `mv` and a shared machine id.
- **Rust/Node boundary.** No Node file decides a store fact: simplicity S6/D10 and red-team RT14 list the three copies.
  - **Reads:** a due sync runs in the existing detached child, never in the read's process. The read result never waits on it. The proposal states the publication-delay window (WORK).
  - **Admission:** memoizes only a settled answer, meaning admitted or a refusal that names a repository state. It never memoizes an I/O or transport error (WORK).
- **Trace.** End-trigger and seal-child failures leave a trace through existing doors: an Observe friction record or the `event-store-integrity` row. No new mechanism.
- **Doctor.** Ten rows become seven. `git-version`, `native-addon` and `orphan-branches` merge into their neighbours with no condition lost, and setup fixes go from 3 to 1, because machine-id and refspec are owned by Identity and Git.
- **Platform.** Linux-only stays for Work until owner Q2 decides otherwise. The CHANGELOG and spec text say "non-Linux", not "Windows". The 11 Windows test targets get `cfg(target_os = "linux")`, not `cfg(unix)` (red-team RT7). Then `fgos-event-store` joins the msvc/darwin land-gate list.
- **Size ceiling, HARDEN commits only:**
  - now: Rust src −150 or less (D1, D2, D3, D8, D10, D11, minus the new fixes);
  - at the H33 fence release: a further −1 000 or less (D4 to D7, D14, with WORK).

  The layer net must be ≤ 0, and it will be well below.

## 3. Disagreements and verdicts

| Point | Seats | Verdict | Source |
|---|---|---|---|
| Is the 20-session `hot-lock-timeout` a real limit? | Correctness: 20 parallel `fgos edit` on the release all pass. Speed: the work-gate benchmark fails in 21 of 24 release runs without strace. | **Both are right.** The CLI path holds the lock briefly. The benchmark's 20 tight writers hit the 10 ms polling lottery: no queue, a 5 s deadline, and a hold of about 50 ms, of which 20 ms is rewriting the 8.5 MB view under the lock. The store does not need this lock for its own invariants (speed, red-team, simplicity). | The hot mutex is the state store's (component-boundary); WORK keeps the 5 s deadline. The numbers go to WORK as a proposal: take the view rewrite and the store append out from under the hot lock, or queue waiters. HARDEN does not change it. |
| Cut two of the three per-append fsyncs (speed S-1, append p50 16.2 → 8.4 ms) | speed only | **Proposal to WORK, not taken in 04b.** | It reverses the pinned `p02_review.rs:76-111` and rests on an induction argument that kill tests cannot prove. Durability is WORK's semantics. |
| Delete `promote::abandon` (no caller) | simplicity asks the owner | **Big lead deletes it.** | Dead code with no caller (`rg`), and nothing to wire it to. No owner decision is needed under RUL104. |
| Drop or merge the `event-store-native-addon` row | simplicity asks the owner | **Merge it into `event-store-integrity`'s addon check if the addon contract version is checked there; otherwise keep it.** | Doctor rule: no condition lost. |
| Rollback export (D5) timing | simplicity asks the owner | **At the H33 fence release, with D4, D6 and D7.** | The owner's standing rule that fences and drains live one release already decides it. |
| `fgctl init` fails in a fresh clone of this repo | correctness | **Out of 04b. A new item for Distribution** (there is no DIST lane; the board's 16:30 line says a reviewer plays DIST). | `git-addon-missing` and `pin-mismatch` come before the store is reached. |
| The WAL refuses a 775 `.git/fgos` under the name `repository-identity-changed`; about 300 or more machine refs give `wal-record-too-large` | correctness, red-team | **Git area: OPC.** Rename the refusal to name the mode. Write the ref-count limit into the Git spec (Medium; there are 3 machines today). | `wal.rs:43`, `wal.rs:1076-1081`. |

## 4. Decisions made by the big lead inside the approved frame

1. **Red tests first, in WORK's crate, reviewed by WORK:**
   - fresh-clone read (S1/RT3);
   - RT1's three bad-ref shapes;
   - RT2's `mv` and shared-id cases;
   - RT4's rewind;
   - the admission memo of a transient error;
   - the 775 `.git/fgos` refusal name.
2. **What HARDEN implements in 04b, each change reviewed by WORK (and by OPC where Git code is touched):**
   - D1: four stream listings become one, with the missing root meaning no history;
   - the named refusal with "run fgos setup";
   - the setup fix checks the mode of the `.git/fgos` parents;
   - RT1 and RT4 skip-and-name in the reader, with the integrity row;
   - the admission memo for settled answers only;
   - the end-trigger trace;
   - D2, D3, D8, D9, D10, D11, D12;
   - the Windows test-target gating and the CHANGELOG/spec wording;
   - RT12 and RT13 doc fixes.
3. **Proposals to WORK, not implemented by HARDEN unless WORK hands them over:**
   - RT2's choice between confirmation and keep-id;
   - moving the due sync to the detached child, with the delay window stated;
   - S-1 fsync;
   - the hot-lock numbers.
4. **Deferred with the H33 fence (WORK's timing):** D4 to D7, D13 and D14.

## 5. Hand-offs

| To | What |
|---|---|
| WORK | Proposals §4 item 3, and the H33-dated deletions §4 item 4 (added to H33's row). Red tests and fixes in its crate come for review. |
| OPC (Git) | The WAL refusal name for a group-writable `.git/fgos`. The ref-count limit of the WAL record (RT6). |
| Distribution (reviewer playing DIST) | `fgctl init` fails in a fresh clone (`git-addon-missing`, `pin-mismatch --from`). |
| T4 | None new. |

## 6. Owner ask (batched; template `core/skills/_shared/decision-question.md`)

Sent to the owner in Vietnamese; summary:
- **Q1. Approve the Part A shape (§2).** It sets the edge rule (missing root = no history; bad foreign ref skipped and named, never silent) and the identity rule (a move never bricks the store). Recommendation: approve.
- **Q2. Work on macOS (RT7).** Work refuses on macOS by design (D15). The owner's rule is that fgOS supports macOS.
  - (a) Keep Linux-only for Work and say so plainly in the docs and CHANGELOG. This costs nothing, but Work cannot be used on a Mac.
  - (b) Enable it with darwin fsync (`F_FULLFSYNC`) and lock semantics. It costs about 1–2 days, and it can only be compile-checked here (no Mac).
  - (c) Like (b), but only once a Mac is available to run it.

  Recommendation: (a) now, plus a backlog item for (c), because shipping untested durability code to users is worse than a named refusal.
- **Q3. Removing a secret that leaked into a pushed event (RT11).**
  - (a) Prevent it: mask declared secrets at append through the existing `secrets` door.
  - (b) A removal path (a rewrite or tombstone rule). This is store semantics and a new mechanism.
  - (c) Document the manual remedy only.

  Recommendation: (a) + (c) now; (b) only if a leak happens.
- **Q4. Landing slot.** HARDEN self-lands 04b's changes on fg-server2 after WORK has reviewed each one. The owner machine follows WORK's guide.
- **Still open from 04a: Q3** (the scorecard constants).

## Unresolved questions

- Q1–Q4 above, and 04a's Q3.
- WORK's choice on RT2 (confirmation path or keep-id).

## WORK's decisions on the proposals (2026-10-25 01:20, `forgent-cd`)

1. **RT2:** keep the store id on a move, as the spec says; no confirmation path. A move is accepted while the store's recorded id and machine id still match. Only a changed machine id is refused, by name. The spec's shared-machine-id advice comes out of the spec, which WORK prefers, unless it gets a real verb. **WORK implements**, with tests for `mv` and for a changed machine id.
2. **Due sync of read verbs moves to the detached child:** accepted. The read result never waits on it. No data-loss window, because events are durable locally before any sync. The publication delay is at most the child's runtime, about 120 s on a slow remote, as today but off the reader's path. **HARDEN may implement it; WORK reviews.**
3. **S-1 (drop two of three fsyncs per append):** not WORK's to accept. The owner chose "fsync unchanged" on 2026-10-23 (option c), and TEST's standing condition is that each dropped fsync cites its durability-contract line and passes a crash case. It becomes an **owner question once its evidence exists**: the induction argument plus a run of `scripts/event-store/power-loss-driver.mjs` on the reduced set. The saving is about 8 ms per append. HARDEN gathers the evidence before asking.
4. **Hot lock:** WORK does not agree that the store does not need it, because the state lock also keeps the fold, the cache and the own-stream precondition coherent. The cheaper lever is the ~20 ms rewrite of the 8.5 MB view under the lock: write the cache after release, behind a revision check. HARDEN brings that as a proposal with release-build numbers, and WORK reviews it before anything else in the lock moves.

WORK recorded D4–D7, D13 and D14 on H33 (`f6382cdaf`). **Ordering:** the stray-shard import-legacy must land and run on fg-server and design-lap before D4 and D6 remove the import path.
