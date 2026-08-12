# CONTEXT: priority-write catch blocks swallow errors silently

Item: `tsk-6d8`. Feature boundary: make the two priority-write `catch {}`
blocks (`discovery.mjs`, `decompose.mjs`) emit a visible signal on failure
instead of being completely silent, without changing the fail-safe
control flow (never abort the clarify/unclear resolution that follows).

## Locked decisions

**D1 — Fix is a stderr write, never a second write-door call or a
re-throw.** Per `RESEARCH.md`: a second `fgos <verb>`-style write inside
the catch could itself fail and recurse into the same silence; a re-throw
defeats the fail-safe the item's own description agrees is sound.
`process.stderr.write` is the established "always succeeds, visible in
operation" pattern already used elsewhere (`lock-wait.mjs`).

## Scout evidence

- `src/intake/discovery.mjs:289-310`, `src/intake/plan.mjs`'s
  priority-write try/catch — read in full, cited in `RESEARCH.md`.

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`

## Outstanding questions

None
