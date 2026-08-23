# RESEARCH.md — tsk-sdr

## Round 1 (2026-08-16)

**Asked:** confirm the exact fix shape for "log an event when
`--acknowledge-iron-law` is actually used to bypass a real Iron Law trip",
so a later audit can distinguish "never tripped" from "tripped but
acknowledged" for an item.

**Checked (repo search):**

- `src/verbs/merge/approve.mjs:293-306` — the gate:
  ```js
  if (resolveRoot(view, id) === id) {
    if (ironLaw.required && acknowledgeIronLaw !== true) {
      if (readIronLawLevel(repoRoot) === 'warn') {
        recordIronLawSkip(dir, { verb: 'approve', id, ironLaw });
        process.stderr.write(...);
      } else {
        throw new StoreError('validation', ironLawRefusal('approve', id, ironLaw));
      }
    }
  }
  ```
  When `acknowledgeIronLaw === true` and `ironLaw.required` is also true,
  the whole `if` body is skipped — nothing is written. Confirmed: no event
  of any kind marks "this item tripped the gate and a human acknowledged
  it" on the acknowledge path.
- `src/verbs/merge/sync-root.mjs:80-89` — same shape, same gap, guarded by
  `!item.parent && ironLaw.required && acknowledgeIronLaw !== true` instead
  (sync-root's own trunk-boundary discriminator, not `resolveRoot`).
- `src/verbs/merge/iron-law-level.mjs:34-41` — `recordIronLawSkip(dir, {
  verb, id, ironLaw })` is the existing pattern for the sibling case (the
  `warn`-level skip): calls `addDecision(dir, { text, rationale, id, kind:
  'engine' })` directly, never shells out to `fgos decision` (no `--kind`
  flag on that CLI command, would silently default to `kind: 'design'` —
  the file's own comment names this exact trap and why `kind: 'engine'`
  matters: the retrospective content gate reads `kind` to tell a machine
  gate-skip apart from real human design reflection).
- `src/state/store.mjs:1123-1148` — `addDecision`'s real shape:
  `{type: 'decision', payload: {...payload, source: payload.source ??
  'session', kind: payload.kind ?? 'design'}}`. `recordIronLawSkip` never
  passes `source`, so its record defaults to `source: 'session'` even
  though it is machine-written — existing convention, not something this
  item should deviate from for its own new record.
- `test/cli/fgos-iron-law-gate.test.mjs:105-115` — the existing test
  helper `ironLawSkipRecords(cwd, id)` filters `events.jsonl` for `type
  === 'decision' && payload.id === id && /iron law/i.test(payload.text)`.
  This regex is loose enough (`/iron law/i`, no "skip"/"skipped" anchor)
  that a new acknowledge-path record's `text` would ALSO match it if that
  text mentions "Iron Law" — so a new record must phrase its `text`
  distinctly from the warn-skip text ("...Iron Law skipped for...") to stay
  greppable apart, e.g. "...Iron Law acknowledged for..." — never reuse the
  literal word "skipped" for an explicit acknowledge, since that is exactly
  the ambiguity this item exists to remove (an audit must tell "warn-level
  auto-skip" apart from "explicit human acknowledge").
- `test/cli/fgos-iron-law-gate.test.mjs:212-230` — the existing warn-level
  test's shape (`makeGatedRoot` + `writeIronLawLevel(cwd, 'warn')` + assert
  exactly one decision record with `kind: 'engine'`) is the direct template
  for a new acknowledge-path test: same fixture, but call `approve` with
  `--acknowledge-iron-law` instead of setting `ironLaw.level = warn`, and
  assert on a record filtered by the new distinct text instead of reusing
  `ironLawSkipRecords` verbatim (or extend that helper to accept a pattern
  arg — implementation's call, not this research's).

**Found:** the fix shape is already fully determined by the existing warn-
skip pattern in the same file — no external lookup needed (nothing here is
a third-party library/concept, it is pure in-repo convention). A new
`recordIronLawAcknowledge(dir, { verb, id, ironLaw })` in
`iron-law-level.mjs`, same `addDecision(..., kind: 'engine')` shape, called
from both `approve.mjs` and `sync-root.mjs` on the branch where
`acknowledgeIronLaw === true && ironLaw.required` (currently unhandled),
with `text` phrased to say "acknowledged" (not "skipped") so it stays
distinguishable from `recordIronLawSkip`'s record under the same loose
`/iron law/i` grep.

**Still open:** none — both call sites, the record helper's shape, the
event-log collision risk, and a test template are all confirmed from real
code with `file:line` citations above.

**Verdict:** `clear`. Proposed verify:
```
npm test && grep -q 'recordIronLawAcknowledge' src/verbs/merge/iron-law-level.mjs && grep -q 'recordIronLawAcknowledge' src/verbs/merge/approve.mjs && grep -q 'recordIronLawAcknowledge' src/verbs/merge/sync-root.mjs
```
