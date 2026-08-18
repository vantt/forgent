# plan.md — tsk-5mc: fix tsk-4sz's vacuous-pass verify + doc variant

Item: `tsk-5mc`. Decisions: `CONTEXT.md` (D1-D4, locked via `--force` past
a documented `judgeVerifySemanticCorrectness` instability — see
CONTEXT.md's "tsk-5mc's own verify command" section for the full round
history; second reproduction filed separately as `tsk-25g`).

## Mode gate

Flags checked: auth (no), authorization (no), data model (no), audit/
security (no — this touches a work-item metadata field and a doc file,
not a security control), external systems (no), public contracts (no),
cross-platform (no), existing covered behavior (no — the current
behavior IS the bug; nothing passing today gets changed), weak proof
around the area (no — D3's RED/GREEN dry-run already proved the fix
before this plan), multi-domain (no).

**0 flags → mode: tiny.** One item, two files, no gray areas, no split.

## Approach

D1/D2 (CONTEXT.md) already lock the two artifacts and the mechanism
(`fgos edit tsk-4sz --verify "..."` for the field, a new doc section for
the doc). `fgos graph --json`'s `criticalPath`/`topUnblock` do not surface
`tsk-5mc` at all — it is an isolated leaf with no deps and nothing
depending on it, confirming there is no ordering question between the two
edits; either could go first, this plan does the field first since it is
the smaller, mechanically-verifiable half.

`fgos tool query --capability impact-analysis --status present`: GitNexus
present (checked during `fgos-coding-exploring`, CONTEXT.md's scout evidence).
Not applicable here — neither edit touches a function/class/method
symbol, so no blast-radius proof point is needed.

Risk map: both edits are metadata/doc changes with no runtime code path.
Only risk is a typo in the new `verify` text breaking `fgos return` for
`tsk-4sz` later — mitigated by the RED/GREEN dry-run already proving the
exact literal text in CONTEXT.md D3 (round 6, the version locked via
`--force`).

## Shape

Direct note (tiny mode — no phased breakdown needed):

1. `fgos edit tsk-4sz --verify "<D3's round-6 fixed text, CONTEXT.md>"
   --dir <mainRoot>` — same text already dry-run proven RED/GREEN in
   CONTEXT.md, applied for real this time (not reverted after).
2. Add a `## Multi-file-glob variant` section to
   `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`,
   placed after the existing `## Real example` section (D4), citing
   `tsk-4sz`'s own incident (aggregate `pass >= 2` across a 12-file glob
   vacuously passing when the pattern matches zero real tests) the same
   way the existing section cites `tsk-580`.
3. Run `tsk-5mc`'s own locked `verify` (the round-6 command, already the
   item's stored `verify` field post-`--force`) for real — it must now
   pass, since both artifacts above are what it checks for.

No split: one honest piece of work, already this size.

## Proof surface

This item's own verify (already locked on the item via `fgos discover
--force`, CONTEXT.md's round-6 text) is the one command that proves it
done — no separate command needed here.
