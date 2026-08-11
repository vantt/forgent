# RESEARCH: unlock's misleading "live session" claim for string identities

## Round 1 (tsk-24t, stage discovery)

**Checked:** `bin/fgos.mjs:4062-4089` (`unlock` case), `src/runner/
main-checkout-lock.mjs:190-260` (`tryAcquireOnce`, both the numeric-pid and
string-identity branches).

**Confirms the item's own claim:** for a string identity (the shape
`.githooks/pre-commit` writes per commit, per this module's own header
comment), `tryAcquireOnce` computes `held` PURELY from TTL freshness
(`main-checkout-lock.mjs:230-231`: `held = now - record.ts <= ttlMs;`) —
no liveness probe exists for a string identity (there is no pid to check
`isPidAlive` against). The module's own comment names this a deliberate
fail-closed design (D5): "Undecidable without a window — fail closed
rather than guess free or held." This part is a locked, correct decision,
not a bug.

`bin/fgos.mjs`'s `unlock` case (`:4073-4081`), on `HELD`, throws a message
that unconditionally says "held by a live session" — accurate for the
numeric-pid branch (where `isPidAlive` genuinely ran), but a fabrication
for the string-identity branch, where liveness was never checked at all.
An operator reading this message for a dead pre-commit hook's own orphaned
lock is told something the code never established.

**Fix shape confirmed minimal:** `lockResult.holderPid` (returned by
`tryAcquireOnce` as `record.pid` verbatim, `main-checkout-lock.mjs`'s
shared `return { status: HELD, holderPid: record.pid, ... }` for BOTH
branches) already carries the type distinction needed —
`typeof holderPid === 'number'` for the pid-liveness-checked branch,
`typeof holderPid === 'string'` for the TTL-only branch. No change to
`main-checkout-lock.mjs`'s own acquire logic; `bin/fgos.mjs`'s message
composition branches on this existing field.

**User's own scope decision (asked directly, not assumed):** message-only
fix. `unlock` keeps refusing to clear a string-identity-within-TTL lock
(the same safe, conservative behavior as today) — only the error text
changes, from a fabricated "live session" claim to an honest "liveness
cannot be determined, TTL not yet expired" statement. Adding a `--force`
override capability was considered and explicitly declined — loosening
the actual clear-ability of this lock is a real safety tradeoff (the same
protection exists to stop concurrent writers corrupting the working
tree) the user chose not to open in this item.

**Verdict:** `{clear: true, verify: "node --test test/cli/fgos.test.mjs test/runner/main-checkout-lock.test.mjs && npm test"}`
