# orphaned-runtime-claim-recovery-verb — plan.md

Mode: small (a few files, no gray areas: RESEARCH.md already identified
every primitive needed pre-existing — this is wiring, not new mechanism
design).

## Approach

RESEARCH.md Round 1 already fully designed this: a new `fgos unclaim <id>`
CLI verb reusing `releaseClaim` (`src/state/runtime-coordination.mjs`),
`rebuildViewFromDir` (`src/state/replay.mjs`, for the durable-only read),
and `isReclaimEligible` (`src/runner/claim-liveness.mjs`) — no new
low-level primitive, only a new verb composing three already-tested
functions.

Files touched: `bin/fgos.mjs` (new `case 'unclaim':`, placed near
`case 'unlock':` for discoverability), `test/runner/claim-port.test.mjs`
(new tests).

Risk map: light. The new verb only ever DELETES a runtime claim file
(never mutates the durable event log — `releaseClaim` touches only
`.fgos/runtime/claims/<id>.json`) and only after either (a) confirming
the durable status doesn't support the claim at all, or (b) the same
liveness check `pick`/`take` already trust. Proof point:
`test/runner/claim-port.test.mjs`'s own existing `isReclaimEligible`/
liveness tests must stay green — this plan reuses that function
unchanged, never modifies it.

Alternative rejected (per RESEARCH.md's own explicit answer to the
item's either/or scope question): folding a durable-status check into
`acquireClaim`/`isReclaimEligible`'s own automatic path instead of a
dedicated verb. Rejected — would silently change behavior at every
existing `pick`/`take` call site; a separate, explicitly-invoked verb
keeps this a deliberate recovery action, matching `fgos unlock`'s own
established posture for the analogous main-checkout-lock case.

## Shape

1. In `bin/fgos.mjs`, add `case 'unclaim':` near `case 'unlock':`
   (~line 4302): resolve `id = requireField(positional[0] ?? flags.id,
   'unclaim requires an id: fgos unclaim <id>')` and `repoRoot` the same
   way `unlock`/`doctor` already do (`flags.dir !== undefined ?
   path.dirname(dir) : (resolveMainCheckoutRoot(process.cwd()) ??
   process.cwd())`).
   - `const claim = readClaim(dir, id);` — if `null`, return
     `{ released: false, reason: 'no-claim' }` (mirrors `releaseClaim`'s
     own outcome, no error).
   - `const durableView = rebuildViewFromDir(dir);` — read the item's
     TRUE durable status (`durableView.work[id]?.status`), never the
     effective/claim-overlaid view.
   - If the durable status is NOT `'doing'` (item missing from the
     durable log entirely, or present with any other status) — orphaned
     by construction, no liveness check needed: `releaseClaim(dir, {
     id })`, return `{ released: true, reason: 'durable-status-mismatch',
     durableStatus: durableView.work[id]?.status ?? 'not-found' }`.
   - Otherwise (durable status genuinely IS `doing`) — apply
     `isReclaimEligible(repoRoot, id, claim.claimRole)`. If `false`
     (still live), throw a `ClaimError('conflict', ...)` naming the
     holder (`claim.writerId`/`claim.actor`) and the claim's own
     `acquiredAt` age — mirroring `unlock`'s own HELD-branch refusal
     shape (`bin/fgos.mjs:4304-4321`). If `true` (genuinely stale),
     `releaseClaim(dir, { id })`, return `{ released: true, reason:
     'stale-liveness' }`.
2. Add tests to `test/runner/claim-port.test.mjs`: (a) no claim exists —
   benign `{released:false, reason:'no-claim'}`; (b) claim exists,
   durable status is `todo` (or the item doesn't exist at all) — clears
   unconditionally, reproducing this item's own reported incident shape;
   (c) claim exists, durable status is `doing`, activity is fresh (within
   threshold) — refuses, error names the holder; (d) claim exists,
   durable status is `doing`, activity is stale (past threshold) —
   clears.
3. Run the full file, not just the new cases.

## Outstanding questions

None.
