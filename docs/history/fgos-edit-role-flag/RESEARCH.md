# RESEARCH.md — fgos-edit-role-flag (tsk-34o)

## Round 1 — 2026-08-18

**Asked:** is the fix direction for "`fgos edit` hardcodes `role:'human'`
unconditionally" real and low-risk enough to plan directly (verdict
`clear`), or does it need a person's design call (verdict `unclear`)?

**Checked:**

- `bin/fgos.mjs`'s `case 'edit'` — read directly. The `editWork` call with
  the hardcoded `role: 'human'` is at line **1833** today, unchanged from
  the item's own citation (the case block itself starts earlier, at 1618,
  after several new optional-field blocks were added since; the call site
  itself did not move).
- `bin/fgos.mjs`'s `case 'take'` — read directly, lines 2771-2776. Confirms
  the existing precedent named in the item:
  ```js
  const role = optionalField(flags.role, 'take --role requires "human" or "session" (omit --role entirely to default to human)') ?? 'human';
  if (role !== 'human' && role !== 'session') {
    throw new StoreError('validation', `take --role must be "human" or "session" (got "${role}").`);
  }
  ```
  Optional flag, defaults to `'human'` when omitted (backward compatible),
  explicit `'session'` opts out.
- `src/state/store.mjs:295` — `export function editWork(dir, { id, patch,
  role } = {})`. The store layer already accepts a generic `role`
  parameter with **no validation restricting it to `'human'`** — this is
  purely a CLI-surface gap, the same shape `tsk-5dn`'s `decision --kind`
  fix just was.
- **Existing internal precedent, stronger than `take`'s:** `bin/fgos.mjs:1290`,
  inside `case 'discover'`'s own classification-patch application, already
  calls `editWork(dir, { id, patch: classificationPatch, role: 'session'
  })` directly — bypassing the general `case 'edit'` CLI handler entirely.
  This proves `editWork` with `role: 'session'` is not just theoretically
  safe, it is already live, tested, production code path today (this exact
  skill's own `fgos discover --tier/--kind/--risk` flow uses it).
- **Blast radius of adding an opt-out flag** — grepped every real reader of
  an event's `role` field (`src/runner/anti-loop.mjs:142`,
  `scripts/measure-verify-cost.mjs:106`, `src/state/store.mjs`'s own
  writers/migration script). Only one semantic consumer exists:
  `visitsSinceLastHumanEvent` (`anti-loop.mjs:132-154`), and it only reads
  `event.type === 'work.move'` events with `role === 'human'` **and**
  `answer`/`reason` set — never a `work.edit` event. `edit`'s own role
  field has **zero current real consumers** anywhere in `src/` — confirmed
  by grep across `src/` and `scripts/` for `payload.role`/`.role ===`.
  `checkRetrospectiveContent` (`src/state/cleanup-harness.mjs`, the
  consumer the item's own description worried about by analogy to
  `tsk-5dn`) has no `role` reference at all — it reads `kind`, a different
  field, already fixed by `tsk-5dn`.

**Found:** adding an optional `--role human|session` flag to `case 'edit'`,
defaulting to `'human'` (unchanged behavior for every existing caller,
mirroring `take`'s exact pattern) is additive, backward-compatible, and has
zero blast radius on existing logic today — no consumer reads `edit`'s role
field as a trust signal yet, so this is a forward-looking integrity fix
(lets a caller that knows it is not a human — this skill's own automated
`fgos edit` calls included — say so honestly), not a change that could
break anything reading it today.

**Still open:** none for this scope. (A broader question — should every
*existing* CLI verb that hardcodes `role: 'human'` for a write it makes on
a person's behalf, e.g. `ask`/`answer`/`cleanup`'s `moveWork` calls at
lines 1427/1544/1898 — get the same treatment, or are those genuinely
always human-initiated by design (they represent responding to a parked
question, which today only a person does) — is out of scope for this item,
which is scoped to the general-purpose `edit` verb specifically named in
its own description.)

**Verdict:** `clear`. Verify: `npm test` (existing suite; a new focused
test file the same shape as `test/cli/fgos-decision-kind.test.mjs` covers
the new flag — Iron Law test-first for `bin/fgos.mjs`).
