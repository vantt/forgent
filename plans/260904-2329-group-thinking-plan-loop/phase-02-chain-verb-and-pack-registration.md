# Phase 02 — Chain Verb And Pack Registration

Depends on: Entry Conditions only. Runs in parallel with Phase 01. Zero
file overlap with Phase 01 — verify this before dispatch by diffing this
phase's own Files list against Phase 01's.

## Objective

Give the external Lead a real, read-only way to see "what's done, what's
next" across a whole chain of cell-sessions, reconstructed ENTIRELY from
the sessions' own event logs — never a new persisted plan/status object.
Register the existing `standalone-master-coordination-loop` fixture into
the group-thinking Protocol Pack so it can be launched through the same
gate the three existing group-thinking-lite protocols already use.

## Requirements

- **R1**: `core/protocol-packs/group-thinking.json` gains a member entry
  `{ id: "core.coordination-protocol.standalone-master-coordination-loop",
  version: "1.0.0" }` (read the fixture's own real `metadata.id`/
  `metadata.version` directly before writing this — do not assume from
  memory). This is a pure data edit; the pack loader is already
  data-driven (confirmed by `group-thinking-pack.mjs`'s own header
  comment) — no code change required for this requirement alone.
- **R2**: A new read-only verb, `fgos coordination chain <track>`,
  accepts a track/prefix string, lists every session id under
  `.fgos/coordination/sessions/` whose id starts with `<track>--`,
  calls the existing `showCoordinationUseCase` (or the function it
  wraps) per matching session id, and renders:
  - a list of cells, each with: cell id (parsed from the session id
    after the `--`), status, phase, last disposition (if any),
    `pendingDriverAuthorizations`, and its Assignment ids;
  - `activeCell`: the most-recently-created session whose status is
    still `active` (or `null` if none);
  - `nextAction`: a plain-text hint derived from the active cell's own
    `pendingDriverAuthorizations`/quorum-missing data (reuse whatever
    `show.mjs` already derives for one session — do not invent new
    derivation logic).
  Sort cells by creation order using `manifest.createdAt`
  (`store.mjs`, confirmed present at ~line 238) — not filesystem
  `birthtime`, which is unreliable across filesystems/copy operations and
  was only a fallback guess in an earlier draft of this plan.
- **R3**: `--json` flag on the new verb, matching `fgos coordination
  show`'s own existing `--json` convention exactly (same envelope shape
  where applicable).
- **R4**: The verb touches NOTHING outside read paths — it must never
  call any function that appends an event, creates a session, or
  dispatches an Assignment. Prove this with a static/architecture-style
  test if this repo already has a pattern for "this module only imports
  read-side functions" (check `test/architecture.test.mjs` for a
  precedent before inventing a new check style).
- **R5**: Register the verb in whatever this repo's CLI dispatch table is
  (`src/cli/command-registry.mjs` and/or `bin/fgos.mjs`'s own
  `coordination` case — confirm the real registration point by reading
  how `show`/`launch-master-loop` are already registered, mirror that
  exact pattern, do not invent a new registration mechanism). `bin/fgos.mjs`
  dispatches coordination subcommands via inline `if (sub === ...)`
  branches (confirmed) — every place that ENUMERATES the legal subcommand
  list as a string (the `command-registry.mjs` description string, and
  `bin/fgos.mjs`'s own `requireField`-style usage/error message that lists
  `<run|show|launch-master-loop>` or similar) must be updated to include
  `chain` too — grep for every such enumeration, do not update only the
  dispatch branch itself and miss the usage/help text.
- **R6**: No new persistence anywhere. If implementing this verb tempts
  writing a cache/index file under `.fgos/`, that is a requirements
  violation — stop and re-derive from the event logs directly. Correctness
  over speed for v1; note any real performance concern as a named Gap,
  not a reason to add a cache.
- **R7 (moved here from an earlier draft's Phase 01 — this is CLI-layer
  work, exclusively this cell's own lease)**: `bin/fgos.mjs`'s
  `coordination` case gains a `--cwd <path>` flag (the worker/session
  working directory Phase 01's own engine-level mechanism needs — Phase
  01 itself never touches this file), distinct from whatever flag already
  names the repo root, mirroring the existing `dispatch execute`
  command's own `--cwd`/`--repo-root` split (see AGENTS.md's Dispatch
  section for the precedent this must match exactly). When `--cwd` is
  omitted, behavior is byte-identical to today (cwd defaults to repo
  root, exactly as now). Add the CLI-level assertion: `fgos coordination
  run --cwd <a real worktree> --file <request naming a mutating step>`
  actually reaches `runCoordinationUseCase` with `ctx.cwd` set to that
  worktree — a real, end-to-end CLI test, not just that the flag parses.
- **R8**: the stale "no resume door" comments in
  `src/verbs/coordination/launch-master-loop.mjs` (confirmed present,
  ~lines 22-24 and ~152-157 — re-locate before editing) are factually
  wrong (resuming an existing `coordinationId` already works, proven by
  this plan's own design investigation and by existing tests elsewhere
  in this codebase) — correct them to describe the real, current
  behavior. This is a comment-only correction; no behavior change.

## Files

May touch:
- `core/protocol-packs/group-thinking.json` (R1).
- `src/verbs/coordination/chain.mjs` (new file, R2-R4).
- `src/cli/command-registry.mjs` and `bin/fgos.mjs` — the `coordination`
  verb's subcommand registration (the new `chain` subcommand, R5), the
  new `--cwd` flag (R7), and every enumerated-subcommand string (R5) —
  this cell owns ALL CLI-layer wiring for both this phase and Phase 01's
  own mechanism; do not touch any unrelated case in this file.
- `src/verbs/coordination/launch-master-loop.mjs` — comment-only
  correction (R8).
- `CHANGELOG.md` — one `## [Unreleased]` line for the new `chain`
  subcommand and `--cwd` flag.
- `test/verbs/coordination-chain.test.mjs` (new file) and/or
  `test/verbs/coordination-group-thinking-pack-registration.test.mjs`
  (existing file, extend for R1's new pack member) — real tests per
  below.
- `test/cli/coordination.test.mjs` — extend for the new `chain`
  subcommand's own CLI-level test AND Phase 01's own `--cwd` flag's
  CLI-level test (R7) — this file is exclusively this cell's own lease;
  Phase 01 never touches it.
- This cell's own report file under
  `docs/architect/agent-coordination/verification/group-thinking-plan-loop/`.

Do NOT touch:
- Anything under `src/runner/coordination/**` or
  `src/runner/dispatch/**` — this cell is read-only, verbs-layer only, no
  kernel/dispatch-core file should appear in this cell's own diff at all.
  If implementing R2 seems to require touching one of these, STOP —
  that means `show.mjs`'s own existing read path doesn't expose what's
  needed, and the correct fix is exposing it through the EXISTING
  `show`-side function (a small, additive export), not by adding new
  logic into the kernel proper. Report this rather than silently
  expanding scope.
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
  itself (registering it into the pack does not require editing the
  fixture).
- `.agents/skills/fgos-plan-loop/**` (does not exist yet; Phase 03's own
  lease).
- Phase 01's own Files list (mutation-core files) — zero overlap
  required.

## Tests First

1. A real chain of 3 sessions opened with ids `probe--cellA`,
   `probe--cellB`, `probe--other-track--cellC` (deliberately similar but
   NOT matching the `probe--` prefix cleanly — proves prefix matching is
   exact, not a loose substring match) — `fgos coordination chain probe`
   lists exactly `cellA` and `cellB`, never `other-track--cellC`.
2. One of the three sessions stays open (a pending driver-authorized
   step never dispatched) — `chain`'s own `activeCell` names it, and
   `nextAction` names the real pending authorization, not a generic
   placeholder.
3. All sessions closed — `activeCell` is `null`, and every cell's own
   final disposition/status renders correctly.
4. `chain` on a track prefix with ZERO matching sessions returns an
   empty, well-formed result (not an error, not a crash) — a plan that
   hasn't started its first cell yet is a legitimate state.
5. R1's pack registration: `loadProtocolPack()`'s own `members` array now
   includes `standalone-master-coordination-loop`'s real id/version,
   confirmed by reading the pack JSON directly, not by trusting a
   narrated claim.
6. A request naming `protocolId: 'core.coordination-protocol.standalone-master-coordination-loop'`
   through `runGroupThinkingRequest` (the SAME gate the three
   group-thinking-lite protocols already use) dispatches successfully —
   proves the registration is real, not just a JSON edit that looks
   right.
7. `chain` never calls a write-side function — enforced by whatever
   static check pattern R4 settled on, with a deliberately-broken PoC
   (a throwaway variant that DOES call a write function) confirmed to
   trip that check, proving the check itself has teeth.
8. R7's `--cwd` flag: `fgos coordination run --cwd <real worktree> --file
   <request>` actually dispatches with `ctx.cwd` set to that worktree —
   confirmed by a real, direct assertion (e.g. the session lands under
   the correct `.fgos/` per Phase 01's R8 fix), not just that the CLI
   exits 0. Omitting `--cwd` behaves byte-identically to today.
9. Every enumerated-subcommand string found during R5's own grep (help
   text, error messages, the registry description) lists `chain`
   correctly — paste the real grep output in the report.

## Risks / Rollback

- **Risk**: session creation order isn't reliably derivable from the
  event log alone (if the log's own first line's timestamp is unreliable
  or absent for some session shape). Mitigation: check this against a
  REAL, already-existing multi-session fixture from this repo's own test
  suite before deciding the ordering mechanism, not a hypothetical one.
- **Risk**: R5's CLI registration touches a shared file
  (`command-registry.mjs`) that Phase 01 might also incidentally need —
  confirmed NOT the case by design (Phase 01 never touches CLI
  registration), but the Coordinator should re-verify zero overlap right
  before dispatching this cell, since file lists can drift between plan
  authoring and execution.
- **Rollback**: this cell adds files and one JSON array entry — reverting
  is a clean `git revert`, no other cell's state is affected.

## Acceptance

- All 9 Tests First items pass, independently re-run by the Coordinator.
- Zero regression in the existing group-thinking pack conformance suite
  (the three existing protocols' own tests stay green, unchanged).
- `chain`'s own implementation contains zero write-side function calls
  (verified, not asserted).
- Independent Reviewer + Red-Team both return APPROVE; this cell is
  lower-risk than Phase 01 (read-only, verbs-layer, no kernel) but still
  gets the same independent-review bar as every cell in this plan.
