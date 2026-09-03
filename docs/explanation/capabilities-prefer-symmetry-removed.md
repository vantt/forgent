---
authoritative_for: capabilities.<name>.prefer no longer requires executor's own "for" array (D5 supersedes D2), resolveExecutorAndOverrides
---

# Why `capabilities.<name>.prefer` no longer requires a matching `for` on the executor

`resolveExecutorAndOverrides` (`src/runner/dispatch/resolve.mjs`) used to
enforce a symmetry rule: if `capabilities.<name>.prefer` named an
executor, that executor had to self-declare a matching `for: [<name>]`
entry, or resolution threw `RunnerConfigError` ("symmetry required"). This
was `tsk-1ai`'s D2 (`docs/history/capability-capacity-remodel/CONTEXT.md`)
— now superseded by D5 (same doc): `prefer` alone is sufficient; the
target executor no longer needs its own `for` entry.

## How the gap surfaced

`runner.executors.agy` was missing `for: ["fgos-coding-implement"]` —
traced to commit `24819bb4`, where it had been dropped alongside the
matching `capabilities` entry as a quick fix for a validation error, not
a deliberate architectural rejection. Presented with the choice —
restore the prior symmetric wiring, or remove the symmetry requirement
entirely — **the user chose to remove the requirement**.

## Why remove it rather than restore it

The reverse check forced a second config edit per wiring decision without
a proportional safety benefit: a careless `prefer` edit could add a
careless `for` entry just as easily, so the symmetry check wasn't
actually preventing mistakes, just adding friction for every legitimate
change. `prefer` naming a nonexistent executor id still throws loud
(`RunnerConfigError`) — the removal only drops the *reverse* check, not
all validation.

## What changed, mechanically

- `resolveExecutorAndOverrides`'s resolution order: (1) a literal
  `cfg.executors[executorIdOrPurpose]` entry always wins first (unchanged
  — the deep-customization escape hatch); (2) `cfg.capabilities[name]
  .prefer` now resolves directly to the named executor, no reverse `for`
  check; (3) failing that, the existing `resolveExecutorIdForPurpose`
  scan (first `for` match wins) still applies for a purpose with no
  `prefer` set; (4) nothing found → `{executorId: null, configured:
  false}`.
- `validateCapabilitiesShape` no longer requires/validates that symmetry
  at config-load time.
- Every `test/runner/dispatch.test.mjs` assertion of the symmetry
  requirement was updated to match the new behavior.
- `.fgos/config.json` now sets `capabilities["fgos-coding-implement"] =
  {prefer: "agy-cli", ...}` without `agy-cli` declaring a matching `for`
  array — the whole point of the change, landed as a direct main-checkout
  commit per ADR0020's `fgos-write-rejected` guard (never through a
  `fgw/<id>` branch, since `.fgos/config.json` is not itself a work
  item's own footprint file).

## The general lesson

A locked decision (D2) was reversed here — not silently, and not by
editing D2 in place, but by recording a new D-ID (D5) that explicitly
supersedes it, citing the real reason (friction without proportional
safety benefit). This is the correct pattern for reversing a prior
locked decision: a new decision record, not an edit to the old one.
