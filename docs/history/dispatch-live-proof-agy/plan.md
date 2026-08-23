# plan.md — tsk-52z: dispatch live-tee + agy trigger proof

Mode: tiny (0 flags: no auth, no authorization, no data model, no
audit/security, no external systems, no public contracts, no
cross-platform, no existing covered behavior touched, no weak-proof area,
single domain — new files only, no gray areas).

## Purpose

This item is a vehicle, not the point. Its own artifact (a pure
`doubleNumber` function + test) is deliberately trivial, mirroring tsk-1fk's
proven shape exactly (`RESEARCH.md` round 1). What actually needs proving,
live, in this same drive, is observed at `executing` (code-implement) time,
not in the artifact:

1. **tsk-129's live-tee feature actually shows on screen.** tsk-129
   (delivered, merged `2fcfa2e2`) wired `dispatch.mjs`'s CLI `execute`
   branch to `opts.onChunk`, tee-ing live stdout/stderr chunks to stderr as
   they happen instead of staying silent until completion. This item's own
   drive through `executing` is the live demonstration: whoever is watching
   this session should see intermediate output while the implementer
   (in-process or out-of-process) works, not a silent gap followed by a
   final result.
2. **agy actually gets triggered for this item at `executing`.** Per
   AGENTS.md's dispatch doctrine, `fgos-coding-implement` (the `executing`-
   stage skill) must call `node src/runner/dispatch.mjs decide` before
   dispatching implementation work. If that call resolves `mechanism:
   "out-of-process"`, `execute` must actually invoke the configured `agy`
   executor (`.fgos/config.json`'s `runner.executors.agy`, already fixed by
   tsk-it0's cwd/`--new-project` config change) — never run the raw command
   through Bash directly (AGENTS.md's own hard rule).

## Approach

Single piece, no split — `fgos graph --json`'s `criticalPath`/`topUnblock`
have nothing to inform here (one independent file pair, no ordering choice
across pieces).

- Files touched: `examples/dispatch-live-proof-agy/double-number.mjs`
  (new), `examples/dispatch-live-proof-agy/double-number.test.mjs` (new).
  Both new — no existing symbol is edited, so the impact-analysis capability
  gate (CLAUDE.md) does not apply here: there is no blast radius to assess
  when nothing existing is touched.
- Precedent: tsk-1fk's `examples/dispatch-proof-agy/reverse-string.mjs` +
  `.test.mjs` (confirmed working pattern, `RESEARCH.md` round 1) — same
  ESM `export function` shape, same `node:test` + `node:assert/strict`
  test shape, same one-`test()`-block structure.
- Risk map: light. The only real risk is a copy-paste typo in the function
  body or the assertions — caught immediately by `node --test` itself,
  which is also this item's own verify command. No proof point beyond that
  is warranted at this mode.

## Concrete cases

- Boundary input: `doubleNumber(0) === 0` (explicitly asserted).
- Ordinary input: `doubleNumber(21) === 42` (explicitly asserted).
- No concurrent-access or partial-failure surface — a pure, synchronous,
  side-effect-free function.

## Split decision

No split. One honest piece of work — pass-through.

## Outstanding questions

None
