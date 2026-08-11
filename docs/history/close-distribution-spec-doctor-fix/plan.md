# tsk-1qm — plan

**Stage:** decompose (fgos-coding-planning). **Date:** 2026-08-02. Builds on
`CONTEXT.md` (D1-D4, approved).

## Mode

**Tiny.** 0 flags apply (no auth/authorization/data-model/audit-security/
external-systems/public-contract-change/cross-platform/weak-proof/
multi-domain — this is a docs-only correction to already-shipped,
already-tested behavior, not a code or contract change). One file, one
direct task: rewrite RUL9, RUL11, and Data Dictionary #7 in
`docs/specs/distribution.md` to match reality.

## Direct note

1. RUL9 (`:200`): add the `--fix` exception — the no-flag default path
   still writes nothing (unchanged), `--fix` runs registered fixes for
   real.
2. RUL11 (`:210`): replace "does not exist yet ... Deferred Idea" with a
   plain statement that `--fix` exists, runs the registered-fix list
   (today: `gate-bypass-configured`), and the list grows through the same
   registry `registerFix` exposes.
3. Data Dictionary #7: replace the 6-item hardcoded enumeration with a
   description of the registry mechanism (`registerCheck`,
   `src/setup/registrations.mjs`) — per CONTEXT.md D2, never a frozen list.
4. Also update "Open Gaps" (`:239-242`), which currently repeats RUL11's
   stale "Deferred Idea" framing as its own justification for zero gaps —
   needs the same correction so it doesn't cite the rule being superseded.

No split — one honest piece of work.

## Proof point

`docs/specs/distribution.md`'s RUL9/RUL11/Data Dictionary #7 reflect real
behavior (verified against live `fgos doctor`/`fgos doctor --fix` output,
already captured in CONTEXT.md's scout evidence);
`scripts/check-decision-citation-drift.mjs` reports no new finding in this
file (baseline already checked: 3 pre-existing findings elsewhere, none in
this file, and RUL11's `(per D8)` citation is a local ID the checker's
4-digit/ADR pattern doesn't scan).

## Gate

See hand-off message for the approval question.
