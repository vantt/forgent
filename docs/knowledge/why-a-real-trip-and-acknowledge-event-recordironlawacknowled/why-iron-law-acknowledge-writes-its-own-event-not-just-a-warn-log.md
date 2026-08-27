---
authoritative_for: why a real trip-and-acknowledge event (recordIronLawAcknowledge) is recorded when --acknowledge-iron-law is actually used to pass a merge, distinct from the existing warn-level skip record
framework: diataxis
mode: explanation
---

# Why Iron Law acknowledge writes its own event, not just a warn log

`approve`/`sync-root` already had `recordIronLawSkip`
(`src/verbs/merge/approve.mjs`, `sync-root.mjs`) for the `warn`-level path
— but when the gate actually **tripped** and a caller passed
`--acknowledge-iron-law` to get past it, nothing recorded that the gate had
fired and been consciously overridden. Only a `warn`-level log line existed
either way.

## Why this gap mattered

Without a real event, a later audit reading the item's own event history
cannot tell two very different situations apart: "the Iron Law gate never
tripped on this diff at all" and "the gate tripped, and a person explicitly
acknowledged bypassing it." Both look identical from the outside — no
distinguishing record either way — even though the second case is exactly
the moment a human decision overrode a safety gate, the kind of event an
audit trail exists to capture.

## The fix

`recordIronLawAcknowledge` (`src/verbs/merge/iron-law-level.mjs`) is called
from both `approve` and `sync-root` at the exact point
`--acknowledge-iron-law` is actually used to satisfy a required gate — a
same-shaped sibling to the existing `recordIronLawSkip` function, not a new
pattern. Two call sites, one shared function, no split candidates: this was
kept as one honest piece of work rather than decomposed further.

## Source

`tsk-sdr`. Verify: `npm test && grep -q 'recordIronLawAcknowledge'
src/verbs/merge/iron-law-level.mjs && grep -q 'recordIronLawAcknowledge'
src/verbs/merge/approve.mjs && grep -q 'recordIronLawAcknowledge'
src/verbs/merge/sync-root.mjs`.
