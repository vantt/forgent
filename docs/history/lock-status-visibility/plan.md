# lock-status-visibility — plan (tsk-5z2)

## Mode

**Standard.** Flags counted against `CONTEXT.md`'s locked scope:

- public contracts — yes: a new `fgos` CLI verb, plus widened return
  shapes on four existing `acquire*Lock` functions and their JSON error
  envelopes.
- existing covered behavior — yes: all four lock modules and their call
  sites already have passing test suites (below); this changes their
  return shapes and message text, not just adds new code.
- multi-domain — yes: touches four deliberately-independent, zero-dep
  modules (`main-checkout-lock.mjs`'s own header calls itself the
  "FOURTH, wholly independent instance" of the lineage) plus the CLI
  registry.

3 flags, no hard-gate flag (no auth/data-loss/audit-security/external
provider/validation removal) → standard, not high-risk. `fgos graph
--json` shows tsk-5z2 has no existing children and doesn't rank in
current `topUnblock` — no cross-item ordering signal to weigh against
judgment here.

## Split decision

**No split.** All four lock modules get the identical mechanical
treatment (widen the HELD/AMBIGUOUS-equivalent return with age/remaining-
TTL, update one message string per surface) — same pattern applied four
times, not four independently-scoped pieces of work. Splitting into four
child items would add process overhead (four separate verifies, four
separate returns) for work that is safest done together so the pattern
stays consistent across all four modules and the final status verb can
be written once, against a return shape already proven out three times
by the point it's reached. One item, phased plan, one `return`.

## Approach

Widen each of the four lock lineage's return objects to carry
`lockAgeMs`/`remainingTtlMs` alongside the existing `holderPid`, then
fold those into every failure message identified in `CONTEXT.md` D2, then
add one new read-only status verb (D1) that reports all four locks at
once. Order follows the lineage's own stated build order (per
`main-checkout-lock.mjs`'s header, which names `loop.mjs` → `session.mjs`
→ `events.mjs` as the three prior instances it mirrors, with
`main-checkout-lock.mjs` itself fourth) in reverse-mirror: fix
`main-checkout.lock` first since it has this item's own concrete scout
evidence (`claim-port.mjs:82`, `bin/fgos.mjs:2269` — exact messages
already read), prove the pattern once against its existing test suite,
then repeat the now-proven pattern against the other three, then the
status verb last since it depends on all four already exposing the new
fields.

### Risk map

| Component | Risk | What proves it |
|---|---|---|
| Widening `main-checkout-lock.mjs`'s `HELD`/`AMBIGUOUS` return shape | medium — existing callers (`claim-port.mjs`) and tests may pattern-match the exact return object | `test/runner/main-checkout-lock.test.mjs`, `test/runner/claim-port.test.mjs` (if present) green after the change; new assertions for the added fields |
| `claim-port.mjs` `ClaimError` message text change | low — message is user-facing, not machine-parsed elsewhere (confirmed: `categoryOf` maps by `err.name`/category string, not message text, per `claim-port.mjs:31-40`) | `test/cli/fgos.test.mjs`, `test/e2e/main-checkout-lock-hook.test.mjs` still assert on category/exit code, not exact wording — grep both for the old message substring before editing to confirm no snapshot breaks |
| `bin/fgos.mjs` unlock refusal message change | low | same test files above, plus `test/runner/main-checkout-lock.test.mjs` if it exercises `unlock` |
| Widening `loop.mjs`, `session.mjs`, `events.mjs` acquire returns + messages | medium each, mirrors the main-checkout risk exactly, now a proven pattern by the time these are touched | `test/runner/loop.test.mjs`, `test/runner/session.test.mjs`, `test/runner/session-identity.test.mjs`, `test/state/events.test.mjs`, `test/e2e/runner-loop.test.mjs` |
| Missing `ttlMs` at some call site (flagged as an outstanding question in `CONTEXT.md`) | low, but must not fabricate — remaining-TTL is only shown where the call site actually supplies a `ttlMs` window; age alone otherwise | verify per call site during implementation which of the four pass `ttlMs` today (`claim-port.mjs:80` confirmed does; the other three not yet confirmed) — record the answer in code comments, not a new decision |
| New `fgos lock-status` verb (exact name/shape deferred to this step, not `CONTEXT.md`) | low, additive `COMMAND_REGISTRY` entry | `test/cli/fgos.test.mjs`, `test/cli/fgos-help.test.mjs` (registry-driven help/usage already covered there per tsk-3h4's own verify list) |

### Files likely touched

- `src/runner/main-checkout-lock.mjs` — widen `HELD`/`AMBIGUOUS` returns
- `src/runner/claim-port.mjs` — `ClaimError` message (line 82)
- `bin/fgos.mjs` — unlock refusal message (line 2269), new `lock-status`
  verb case
- `src/cli/command-registry.mjs` — new verb registry entry
- `src/runner/loop.mjs` — runner-lock return + message (line ~930)
- `src/runner/session.mjs` — sessions-lock return + message (line ~213)
- `src/state/events.mjs` — events-lock return + message
- `test/runner/main-checkout-lock.test.mjs`
- `test/cli/fgos.test.mjs`
- `test/cli/fgos-help.test.mjs`
- `test/e2e/main-checkout-lock-hook.test.mjs`
- `test/runner/loop.test.mjs`
- `test/runner/session.test.mjs`
- `test/state/events.test.mjs`

## Shape (phased)

1. **Phase 1 — main-checkout.lock.** Widen
   `acquireMainCheckoutLock`'s `HELD`/`AMBIGUOUS` return with
   `lockAgeMs`/`remainingTtlMs` (computed from the already-in-scope
   `record.ts`/`now`/`ttlMs`). Update `claim-port.mjs`'s `ClaimError`
   message and `bin/fgos.mjs`'s unlock refusal message to include both.
   Verify: `node --test test/runner/main-checkout-lock.test.mjs
   test/cli/fgos.test.mjs test/e2e/main-checkout-lock-hook.test.mjs`.
2. **Phase 2 — sibling locks.** Repeat the now-proven Phase 1 pattern
   against `loop.mjs` (runner.lock), `session.mjs` (sessions.lock), and
   `events.mjs` (events.lock) — same return-shape widening, same
   message-text treatment, one module at a time. Verify each against its
   own existing suite (`test/runner/loop.test.mjs`,
   `test/runner/session.test.mjs`, `test/state/events.test.mjs`) before
   moving to the next.
3. **Phase 3 — status verb.** Add the read-only status verb (`D1`)
   reporting holder identity, age, and remaining-TTL for all four locks
   at once, registered in `src/cli/command-registry.mjs` and implemented
   in `bin/fgos.mjs`. Verify: `test/cli/fgos.test.mjs`,
   `test/cli/fgos-help.test.mjs`.

### Concrete cases to prove (standard-mode depth)

- No lock file present (free) — unaffected, still returns `ACQUIRED`
  with no age/TTL fields.
- Lock held by a live holder well within TTL — age and remaining-TTL both
  positive and sane.
- Lock held by a live holder past TTL (about to self-expire on next
  reclaim attempt) — remaining-TTL near/at zero, not negative.
- Stale lock (dead pid or ttl-expired) — reclaimed as today; the new
  fields only apply to the `HELD`/`AMBIGUOUS` branches, not the
  reclaim-and-retry path.
- Ambiguous (corrupt/unparseable) lock — no `record.ts` exists to compute
  age/TTL from; message states this plainly rather than showing a
  fabricated number.
- Call site with no `ttlMs` supplied — age shown, remaining-TTL omitted
  or explicitly marked not-applicable, never a wrong number.
- Existing message-text assertions in the four test files above — must
  keep passing or be updated deliberately, never accidentally broken by
  a wording change.

## Execution

Execute and its verify already have a working mechanical path (per the
locked precedent this plan follows from tsk-3h4 and the wider fgOS
engine) — this plan names, per phase above, the one command that proves
it done; it does not redesign that path.
