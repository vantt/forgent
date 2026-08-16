# Plan: ghi event khi --acknowledge-iron-law thực sự được dùng

Item: tsk-sdr.
Mode: high-risk

## Lane

No `Mode:` hand-off existed when this session opened `fgos-coding-planning`
(this item's `discovery` verdict came back `clear`, so it went straight to
`planning` — no `fgos-coding-exploring` pass ever ran, no lane was ever
decided upstream). Applying `fgos-routing`'s Mode-gate directly
(direct-entry fallback):

- auth/authorization: no.
- data model: no — no new field, no schema shape change; reuses the
  existing `addDecision`/`type: 'decision'` event shape verbatim.
- **audit/security: yes (hard-gate)** — the whole point of this item is an
  audit-trail gap on the Iron Law gate, the mechanism that protects
  self-modifying merges from landing unreviewed. Recording (or
  mis-recording) this event IS the security-relevant behavior.
- external systems / public contracts / cross-platform: no.
- **existing covered behavior: yes** — touches `approve.mjs`/`sync-root.mjs`,
  both covered by `test/cli/fgos-iron-law-gate.test.mjs`'s existing D1/D3/D7/
  D8 suite (refuse-at-ask, proceed-at-warn, trunk-boundary discrimination).
  Must not change any existing refuse/proceed decision, only ADD a record on
  a path that currently records nothing.
- weak proof: no — every claim below is grounded in a direct `file:line`
  read, not inference (see Decisions below).
- multi-domain: no.

One hard-gate flag (audit/security) forces **high-risk** regardless of the
total count (2: audit/security + existing-covered-behavior) — same rule the
`backfill-risk-kind-vocabulary-drift` precedent plan applied.

## Decisions this plan is built on

No `CONTEXT.md` exists for this item — `discovery`'s own verdict found the
submitted text already fully scoped (concrete file:line citations, a named
existing pattern to reuse, no product ambiguity), so `exploring` never ran.
This plan is built directly on the item's own description, verified against
the live repo and against `docs/history/tsk-sdr-iron-law-acknowledge-event/
RESEARCH.md`'s Round 1 (the `fgos-researching` consult this session already
ran during `discovery`).

**Verified against the current repo (not just trusted from the item text):**

- `src/verbs/merge/approve.mjs:293-306` — `if (ironLaw.required &&
  acknowledgeIronLaw !== true) { ... }`. When `acknowledgeIronLaw === true`
  and `ironLaw.required` is also true, this whole block is skipped — nothing
  is ever written. Only the nested `ironLaw.level === 'warn'` sub-branch
  calls `recordIronLawSkip`. Confirmed live, matches the item's own claim.
- `src/verbs/merge/sync-root.mjs:80-89` — same gap, same shape, gated on
  `!item.parent && ironLaw.required && acknowledgeIronLaw !== true` (its own
  trunk-boundary discriminator, `plan.md` note per `docs/decisions/0032`/
  `tsk-1y6-1` D1 — deliberately different from `approve`'s `resolveRoot(view,
  id) === id`, not a bug to reconcile here).
- `src/verbs/merge/iron-law-level.mjs:34-41` — `recordIronLawSkip(dir, {
  verb, id, ironLaw })` is the sibling pattern to extend: calls
  `addDecision(dir, { text, rationale, id, kind: 'engine' })` directly
  (never via `fgos decision`, which has no `--kind` flag and would silently
  default to `kind: 'design'` — the file's own comment already names why
  that matters: the retrospective content gate reads `kind` to tell a
  machine gate record apart from real human design reflection).
- `src/state/store.mjs:1123-1148` — `addDecision`'s actual event shape:
  `{type: 'decision', payload: {...payload, source: payload.source ??
  'session', kind: payload.kind ?? 'design'}}`. `recordIronLawSkip` never
  passes `source`, defaulting to `'session'` — this plan keeps that same
  convention for the new record rather than inventing a different one.
- `test/cli/fgos-iron-law-gate.test.mjs:105-115` — the existing
  `ironLawSkipRecords(cwd, id)` helper filters on `type === 'decision' &&
  payload.id === id && /iron law/i.test(payload.text)`. This regex is loose
  (no "skip"/"skipped" anchor), so a new acknowledge-path record's text must
  say "acknowledged" (never reuse "skipped") to stay distinguishable from a
  warn-level skip record under the same grep — this is the actual mechanism
  that lets a future audit tell the two apart, so it is load-bearing, not
  cosmetic.
- `test/cli/fgos-iron-law-gate.test.mjs:212-230` — the existing warn-level
  test (`makeGatedRoot` + `writeIronLawLevel(cwd, 'warn')` + assert exactly
  one `kind: 'engine'` decision record) is the direct template for the new
  acknowledge-path test.

## Impact-analysis posture (CLAUDE.md gate)

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present`. `list_repos` shows the `/home/vantt/projects/forgentX` entry is
**334 commits behind HEAD** (`staleness.commitsBehind: 334`) → **degraded**:
ran it anyway, evidence below is marked weak and cross-checked by direct
code reading rather than trusted alone (per the project's own gate note: a
suspicious not-found answer is worth a grep cross-check regardless of what
`fgos tool query` reports).

`impact({target: "recordIronLawSkip", direction: "upstream", repo:
"/home/vantt/projects/forgentX"})` → `"Target 'recordIronLawSkip' not
found"`, `impactedCount: 0` — consistent with the index being 334 commits
stale (this function and file postdate the indexed commit). Cross-checked
directly: `grep -rn "recordIronLawSkip" src` (outside GitNexus) finds
exactly 3 hits — its own definition in `iron-law-level.mjs`, and one call
site each in `approve.mjs`/`sync-root.mjs`. No other importer exists, so the
blast radius of adding a sibling `recordIronLawAcknowledge` next to it, and
one call site in each of those same two files, is contained to those three
files plus their own test file — confirmed by direct reading, not GitNexus.

## Approach

One honest piece of work, no split — a same-shaped sibling to an existing,
already-tested pattern in the same file. Order (dependency-driven, not
`fgos graph`-derived: this item has no split candidates and no dependents to
compare `topUnblock`/`criticalPath` across, so that step does not apply
here):

### 1. `src/verbs/merge/iron-law-level.mjs` — new `recordIronLawAcknowledge`

Add, next to `recordIronLawSkip`:

```js
// The explicit-acknowledge record — the sibling this file's own
// `recordIronLawSkip` was missing: written when a caller passed
// `--acknowledge-iron-law` on an item that actually tripped the gate, so a
// later audit can tell "never tripped" apart from "tripped, human
// acknowledged" instead of only ever seeing a silence in both cases.
export function recordIronLawAcknowledge(dir, { verb, id, ironLaw }) {
  return addDecision(dir, {
    text: `${verb}: Iron Law acknowledged for "${id}" via --acknowledge-iron-law — matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}]`,
    rationale: '--acknowledge-iron-law was passed and the gate required proof — the caller explicitly confirmed failing-test-first proof instead of the gate refusing or the warn-level auto-skip firing',
    id,
    kind: 'engine',
  });
}
```

`text` says "acknowledged", never "skipped" — the one load-bearing detail
from Decisions above that keeps this record distinguishable from
`recordIronLawSkip`'s under the existing loose `/iron law/i` test grep.

### 2. `src/verbs/merge/approve.mjs` — wire the acknowledge branch

Restructure the existing block (line ~295) from a single negative
condition into three real branches instead of two, so the previously-silent
`acknowledgeIronLaw === true` path gets one too:

```js
if (ironLaw.required) {
  if (acknowledgeIronLaw === true) {
    recordIronLawAcknowledge(dir, { verb: 'approve', id, ironLaw });
  } else if (readIronLawLevel(repoRoot) === 'warn') {
    recordIronLawSkip(dir, { verb: 'approve', id, ironLaw });
    process.stderr.write(
      `fgos: approve: "${id}" trips the Iron Law, proceeding at ironLaw.level = "warn". `
        + `Matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}].\n`,
    );
  } else {
    throw new StoreError('validation', ironLawRefusal('approve', id, ironLaw));
  }
}
```

Add `recordIronLawAcknowledge` to the existing `import { readIronLawLevel,
recordIronLawSkip } from './iron-law-level.mjs';` line. The refuse and
warn-skip branches keep their exact existing behavior (same condition, same
call, same stderr text) — only the previously-empty `acknowledgeIronLaw ===
true` gap gains a body. This is the existing-covered-behavior proof point:
the D1/D3/D7/D8 suite must still pass unchanged (see Test below).

### 3. `src/verbs/merge/sync-root.mjs` — same restructure

Same shape at line ~80, using its own `!item.parent` discriminator instead
of `approve`'s `resolveRoot`:

```js
if (!item.parent && ironLaw.required) {
  if (acknowledgeIronLaw === true) {
    recordIronLawAcknowledge(dir, { verb: 'sync-root', id, ironLaw });
  } else if (readIronLawLevel(repoRoot) === 'warn') {
    recordIronLawSkip(dir, { verb: 'sync-root', id, ironLaw });
    process.stderr.write(...); // unchanged
  } else {
    throw new StoreError('validation', ironLawRefusal('sync-root', id, ironLaw));
  }
}
```

Add `recordIronLawAcknowledge` to `sync-root.mjs`'s existing `import {
readIronLawLevel, recordIronLawSkip } from './iron-law-level.mjs';` line.

### 4. `test/cli/fgos-iron-law-gate.test.mjs` — new cases

Mirror the existing warn-level test (`ironLawSkipRecords` pattern,
`makeGatedRoot`), but drive `approve`/`sync-root` with `--acknowledge-iron-law`
instead of setting `ironLaw.level = warn`:

- `approve` of a gated root with `--acknowledge-iron-law` proceeds (status
  0, item reaches `delivered`) AND writes exactly one `kind: 'engine'`
  decision record whose text matches `/acknowledged/i` and does NOT match
  `/skipped/i` for that item.
- `sync-root` of a gated root (no parent) with `--acknowledge-iron-law`:
  same shape, outcome `synced`, one `kind: 'engine'` "acknowledged" record.
- **Regression proof (existing-covered-behavior flag):** the existing D1/D3/
  D7/D8 tests in this same file are the proof that refuse-at-ask and
  proceed-at-warn are unchanged — run unmodified as part of `npm test`,
  never edited to accommodate this change. If any of them needed editing,
  that would itself be the signal the restructure broke an existing
  decision, not something to paper over.
- No concurrency/partial-failure case needed: `addDecision` is the same
  single mechanism `recordIronLawSkip` already uses without a concurrency
  test of its own, and this call site adds no new locking.

## Proof surface (for `fgos gate-approve --verify`)

Item's own real verify, set at `discovery`, unchanged and already real (not
a placeholder — `fgos-coding-planning`'s own sync step confirms this, no
edit needed):

```
npm test && grep -q 'recordIronLawAcknowledge' src/verbs/merge/iron-law-level.mjs && grep -q 'recordIronLawAcknowledge' src/verbs/merge/approve.mjs && grep -q 'recordIronLawAcknowledge' src/verbs/merge/sync-root.mjs
```

## Outstanding questions

None
