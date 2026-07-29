# lock-status-visibility — plan (tsk-5z2)

## Mode

**Standard.** Flags counted against `CONTEXT.md`'s locked scope (post-D5):

- public contracts — yes: a new `fgos` CLI verb, plus a widened return
  shape on `acquireMainCheckoutLock` and its JSON error envelope.
- existing covered behavior — yes: `main-checkout-lock.mjs`,
  `claim-port.mjs`, and `bin/fgos.mjs`'s `unlock` case already have
  passing test coverage this change modifies, not just adds to.

2 flags, no hard-gate flag → standard (the "2–3 flags → standard" bucket).
`multi-domain` no longer applies post-D5 — scope is now one lock module
and its two existing callers, not four independent modules.

## Split decision

**No split.** One item, one lock, two failure-message call sites, one new
verb — small enough to stay a single piece of work.

## Approach

Widen `acquireMainCheckoutLock`'s `HELD`/`AMBIGUOUS` return with
`lockAgeMs`/`remainingTtlMs`, computed from the `record.ts`/`now`/`ttlMs`
already in scope inside `tryAcquireOnce` (`main-checkout-lock.mjs:157-175`)
— no new file read needed. Fold both fields into `claim-port.mjs`'s
`ClaimError` message (line 82) and `bin/fgos.mjs`'s unlock refusal message
(line 2269) — the two surfaces D2 names. Then add a read-only status verb
(D1) reporting the same for on-demand inspection outside a failed call.

### Risk map

| Component | Risk | What proves it |
|---|---|---|
| Widening `HELD`/`AMBIGUOUS` return shape | medium — existing callers/tests may pattern-match the exact return object | `test/runner/main-checkout-lock.test.mjs` green after the change, plus new assertions for the added fields |
| `claim-port.mjs` `ClaimError` message text change | low — confirmed message is user-facing only, not machine-parsed (`categoryOf` maps by `err.name`/category string, `claim-port.mjs:31-40`, not message text) | `test/cli/fgos.test.mjs`, `test/e2e/main-checkout-lock-hook.test.mjs` still assert category/exit code, not exact wording — grep both for the old message substring before editing to confirm no snapshot breaks |
| `bin/fgos.mjs` unlock refusal message change | low | same test files above |
| New `fgos lock-status` verb | low, additive `COMMAND_REGISTRY` entry, same pattern as `unlock`'s own registration | `test/cli/fgos.test.mjs`, `test/cli/fgos-help.test.mjs` (registry-driven help/usage) |

### Files touched

- `src/runner/main-checkout-lock.mjs` — widen `HELD`/`AMBIGUOUS` returns
  with `lockAgeMs`/`remainingTtlMs`
- `src/runner/claim-port.mjs` — `ClaimError` message (line 82)
- `bin/fgos.mjs` — unlock refusal message (line 2269), new `lock-status`
  verb case
- `src/cli/command-registry.mjs` — new verb registry entry
- `test/runner/main-checkout-lock.test.mjs`
- `test/cli/fgos.test.mjs`
- `test/cli/fgos-help.test.mjs`
- `test/e2e/main-checkout-lock-hook.test.mjs`

## Shape

1. **Phase 1 — widen the primitive + both messages.** Widen
   `acquireMainCheckoutLock`'s `HELD`/`AMBIGUOUS` return. Update
   `claim-port.mjs`'s `ClaimError` message and `bin/fgos.mjs`'s unlock
   refusal message to include age and remaining-TTL.
   Verify: `node --test test/runner/main-checkout-lock.test.mjs
   test/cli/fgos.test.mjs test/e2e/main-checkout-lock-hook.test.mjs`.
2. **Phase 2 — status verb.** Add the read-only status verb reporting
   holder identity, age, and remaining-TTL for `main-checkout.lock`,
   registered in `src/cli/command-registry.mjs` and implemented in
   `bin/fgos.mjs`, mirroring `unlock`'s own registration shape.
   Verify: `test/cli/fgos.test.mjs`, `test/cli/fgos-help.test.mjs`.

### Concrete cases to prove (standard-mode depth)

- No lock file present (free) — unaffected, still returns `ACQUIRED` with
  no age/TTL fields.
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
- Existing message-text assertions in the four test files above — must
  keep passing or be updated deliberately, never accidentally broken by
  a wording change.

## Execution

Execute and its verify already have a working mechanical path — this plan
names, per phase above, the one command that proves it done; it does not
redesign that path.
