# Current Cell: none

Status: idle
Owner: Coordinator
Last updated: 2026-09-01
Next action: prepare cell P03.3 (Phase 03 R4–R6). P03.2 closed — see
`P03.2.md` and `index.md`'s Active Cell/Phase-Requirement Matrix.

## Goal

Land ADR-007 R3: a CLI door that lets a real caller build and run an
inline Assignment from a raw execution contract, without a Work item, a
Stage, or `decide --for`. This is the door Phase 03's own two live proofs
(R4/R5, next cell P03.3) will run through — `decide --for` purposes do not
include reviewer/advisor roles per the plan text, so `execute --contract`
is the only real path for either proof.

## Requirements

- `src/runner/dispatch/cli.mjs`'s `execute` subcommand gains `--contract
  <file>` (a path to a JSON file). Mutually exclusive with `--for` and any
  stage-selection flag this subcommand already accepts — reject the
  combination with a clear error, non-zero exit, before anything else
  happens (mirror the existing mutual-exclusion style already used
  elsewhere in this file, e.g. how `--assignment` short-circuits the rest
  of the branch today at `cli.mjs:859`).
- Reading `--contract <file>`: parse the JSON, build an inline Assignment
  via the real public `buildAssignment()` API
  (`provenance: { kind: 'inline', contract, caller }` — same shape
  `mission-lite.mjs`'s `createMissionAssignment` already uses as its own
  real call site, read it for the pattern). `caller.writerId` should be
  auto-resolved via `resolveWriterIdentity()` (`src/util/session-identity.mjs`)
  when the file doesn't supply one — this door is the SECOND real call
  site for that function in the codebase (mission-lite.mjs is the first);
  decide whether it should be filled in unconditionally, or only when
  absent from the file, and document the choice.
- A mutating contract must exit non-zero **before launch** — i.e., before
  any executor is invoked. `buildAssignment()`'s own inline path already
  throws `RunnerConfigError` on `mutation !== 'read-only'` via
  `execution-contract.mjs`'s `validateExecutionContract` — this
  requirement is satisfied by construction as long as `buildAssignment()`
  runs and is allowed to throw BEFORE `executeAssignment()` is ever
  called, not after. Verify this ordering explicitly with a test, don't
  just assume it from reading the code.
- Attaching to a Work: R5 (Proof 2, next cell) needs the harness seam
  (R1, already landed in `domains/coding/harness/enrich-and-validate-contract.mjs`)
  to actually fire through this CLI door, which requires a `work` object
  to reach `buildAssignment()`. This door therefore needs a way to name a
  Work to attach to — reuse the existing `--work <id>` flag this file
  already parses for `decide --work` (`cli.mjs:995`, `listWork(fgosDir).work[workIdArg]`
  is the established lookup pattern) rather than inventing a second flag
  name for the same concept. Without this, R3's door could never be used
  to prove R5, so this is in-scope for R3 itself, not scope creep into
  R5's own cell.
- Persistence: do NOT hand-roll a write of `assignment.json` in the CLI
  branch. `executeAssignment()` (`assignment-runner.mjs:581-584`) already
  lazily writes the canonical `assignment.json` the first time it runs for
  an Assignment that doesn't yet have one on disk — the built (not yet
  persisted) Assignment object from `buildAssignment()` can be passed
  straight to `executeAssignment()`, the same way the existing
  `--assignment <id>` branch already does after it reads an
  *already-persisted* one back. Confirm this by reading
  `executeAssignment` yourself, don't assume from this note alone.
- Output: prints assignment id, run id, RunResult path (plain text or the
  same JSON-on-stdout convention the rest of `execute` already uses —
  match the existing `--assignment` branch's own output shape at
  `cli.mjs:906` rather than inventing a new one).
- `bin/fgos.mjs`: only touch if the dispatch subcommand wiring there
  requires the new flag to be declared — check first, don't assume.
- `CHANGELOG.md`: add one line under `## [Unreleased]` → `### Added`
  (create that heading if the file's current `[Unreleased]` section
  doesn't have one — see how a prior `### Added` block further down the
  file is formatted). No new config default or env var is introduced by
  this door; if you find yourself needing one, stop and flag it rather
  than inventing a default silently (AGENTS.md's Install/setup/doctor
  gate).

## Non-Goals (Out Of Scope For This Cell)

The two live proofs themselves (R4/R5, next cell P03.3) — this cell only
builds the door, does not run a real proof through it. R6 (ADR
traceability table). Do not change `buildAssignment`/`buildInlineAssignment`
(`assignment.mjs`) or the harness seam (`domains/coding/harness/`) —
both already landed in P03.1 and are closed cells; if this cell finds a
genuine gap in either, document it as a Gap/Follow-Up rather than
reopening P03.1's own commit. Do not change `decide --for`'s own purpose
table (the plan text already establishes `execute --contract` as the
alternate door specifically because `decide --for` doesn't cover these
roles — extending that table is a different, unrelated decision).

## Watch-Fors

- `guardCwdRepoRootDivergence` is already called in the plain-prompt
  `execute` path (`cli.mjs`, right before the final `executeExecutorCli`
  call) — check whether the `--contract` branch needs the same guard
  before resolving `--cwd`/`--repo-root`/`--dir`, matching the existing
  `--assignment` branch's own `cwd`/`root` resolution logic
  (`cli.mjs:861-869`) rather than diverging from it.
- `decideExecutorCli` is called before `executeAssignment` in the existing
  `--assignment` branch (to check dispatch mechanism/human-only gates
  first) — decide whether `--contract` needs the same pre-flight decide
  call or whether an inline, no-Work, no-Stage Assignment has no
  equivalent gate to check (mission-lite's own `createMissionAssignment`
  path does NOT call `decide` first — read why, in
  `src/runner/dispatch/mission-lite.mjs`, before deciding which precedent
  this door should follow).
- The JSON file's exact shape is an open design call: does the file
  contain the contract's own fields directly (the file IS the contract,
  simplest for a caller to author), or a wrapper object like
  `{ contract: {...}, caller: {...} }`? Make the call, document it in
  `P03.2.md`'s Gaps section — whichever you choose, the two live proofs in
  the NEXT cell will need to author a real file in this exact shape, so
  get it right and keep it simple (a human or a calling agent should be
  able to hand-write this file from ADR-006 §4's contract field list
  alone).

## Tests First

- `--contract <file>` with a mutating contract (`mutation: 'mutating'` or
  missing/invalid) exits non-zero before any executor is invoked — assert
  this by confirming no executor/adapter call happens (not just that the
  exit code is non-zero).
- `--contract` + `--for` together: rejected with a clear error, non-zero
  exit, before any other work happens.
- `--contract` + `--work <id>` naming a real Work at a declared Stage: the
  harness seam actually fires (assert on the built `assignment.json`'s
  `provenance.validators` containing `'domain-harness-seam'`, mirroring
  the assertion style `test/runner/assignment-provenance.test.mjs`'s own
  P03.1 tests already use).
- `--contract` with no `--work`: a standalone inline Assignment, harness
  seam does not fire, no Stage/domain involved at all (the actual Proof 1
  shape — read R4's text in
  `plans/260831-1637-step07-inline-assignment-mvp/phase-03-harness-seam-and-two-proofs.md`
  again before writing this test).
- A real (not mocked) run through `executeAssignment` — this repo's own
  established standard for CLI subcommand tests is a real subprocess
  invocation (`execFileSync(process.execPath, ['src/runner/dispatch.mjs',
  'execute', '--contract', ...])`) against a fake/local executor, matching
  how `test/runner/assignment-dispatch.test.mjs`'s existing `execute
  --assignment` tests are structured — read one of those for the pattern
  before writing new ones.

## Trace Update

Doer writes Requirements, Proof Matrix, Commands, Gaps in
`docs/architect/agent-coordination/verification/step-07-mvp/P03.2.md`
(new file). Doer does not write Review/Red-Team sections. No cell/finding
IDs in code comments, test names, or commit messages — ADR-006/ADR-007
section references are fine (durable), transient coordination labels are
not.
