# plan.md: tsk-5ld — 2 missing --force test cases for resolveDiscovery

## Lane

**tiny**, direct-entry fallback (tsk-da1): no `fgos-routing` Orient step
ran this session (entered via `/fgOS:pick` → `fgos-coding-driving`
directly). Flag count, same rule `fgos-routing`'s own Orient step uses:
auth — no; authorization — no; data model — no; audit/security — no
(adds test coverage, doesn't change the audited mechanism); external
systems — no; public contracts — no; cross-platform — no; existing
covered behavior — no (adds coverage, doesn't change behavior); weak
proof around the area — no (the opposite: this item strengthens proof,
using an already-proven pattern from `decompose.test.mjs`); multi-domain
— no. 0 flags → tiny.

## Approach

Direct note (tiny mode, per this skill's own Shape scaling): add exactly
the two test cases `CONTEXT.md` D1 locked, to the exact file D2 locked
(`test/intake/judge-verify-second-pass-stability.test.mjs`), mirroring
`test/intake/plan.test.mjs:1315-1418`'s already-proven pattern
(tsk-25g, commit `cd0cc56`, merged to `main`) adapted to
`resolveDiscovery`'s call shape instead of `resolveDecompose`'s:

- **Case (a) — force succeeds on non-mechanical disagreement:** configure
  a fake executor that disagrees (non-mechanical reason) on the second
  pass; call `resolveDiscovery(dir, id, cfg, role, {clear: true, verify,
  force: true})`; assert `outcome === 'clear'` (or whatever the real
  success outcome literal is — confirm by reading `resolveDiscovery`'s
  return shape at the override branch, `discovery.mjs:686-701`, before
  writing the assertion); assert a decision was logged (`view.decisions`,
  matching `/discover --force overrode/` — the exact text
  `discovery.mjs:687-689` writes, read fresh rather than assumed).
- **Case (b) — force refuses when already awaiting-human:** `addWork(dir,
  sampleWork({status: 'awaiting-human'}))` (mirrors
  `decompose.test.mjs`'s equivalent setup exactly); call
  `resolveDiscovery(dir, id, cfg, role, {clear: true, verify, force:
  true})`; assert it throws, matching `/already "awaiting-human"/` (the
  exact text `discovery.mjs:681-684` throws).

No split — one honest piece, two test cases in one file, no dependency
between them worth a separate item.

## Impact-analysis posture

Not applicable — this item adds `test()` blocks to an already-fully-read
file (`judge-verify-second-pass-stability.test.mjs`, read in full at
`fgos-coding-exploring`); it edits no production symbol, so there is no blast
radius to confirm. `fgos tool query` reports GitNexus `present` (index
still flagged stale mid-session, unchanged from `tsk-25g`'s own
observation) — moot here regardless of freshness, same reasoning
`tsk-25g`'s own D2 phase used for its test-file-only edits.

## Proof surface

The item's own already-accepted `verify` (locked at `fgos-coding-exploring`'s
gate, `outcome: clear`, no dispute):

```
top=$(git rev-parse --show-toplevel); out=$(node --test --test-name-pattern="tsk-5ld" "$top/test/intake/judge-verify-second-pass-stability.test.mjs" 2>&1); fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$"); test "${fail:-0}" = "0" && echo "$out" | grep -qE "^. .*resolveDiscovery --force overrides a disputed \(non-mechanical\) verify.*\(tsk-5ld\)" && echo "$out" | grep -qE "^. .*resolveDiscovery --force refuses when the item is already awaiting-human.*\(tsk-5ld\)"
```

RED-confirmed against the current (unmodified) repo this session
(`fgos-coding-exploring`'s Gate section / decision log).

## Assumptions

- `resolveDiscovery`'s exact success-outcome literal and exact decision
  text are read fresh from the real source (`discovery.mjs`) at
  implementation time, not assumed from memory of `resolveDecompose`'s
  parallel (`clear` there is `'clear'`; `discovery.mjs`'s own equivalent
  needs a fresh read — different function, could differ in wording even
  if the shape matches). Not material enough to ask about — a pure
  read-the-code-you're-editing step, per this skill's own "not material"
  gap category.
