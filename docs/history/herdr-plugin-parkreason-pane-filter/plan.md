# plan: expose parkReason on fgos list --json (tsk-48i)

## Mode

Flags counted (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform, existing covered behavior, weak
proof around the area, multi-domain):

- **public contracts** — adds a new field to `fgos list --json`'s per-item
  output, a contract at least one external consumer (`herdr-plugin`)
  reads. Additive only (no existing field renamed/removed), backward
  compatible.

No other flag applies: no auth/authorization/data-model/audit-security
surface; no external system invoked (pure in-process JSON stamping); not
cross-platform in the risky sense (the Rust consumer's own switch is a
separate, dependent item — tsk-48i itself never touches `herdr-plugin/`);
not modifying existing covered behavior (purely additive, mirrors
`statusCategory`'s already-proven pattern rather than changing it); single
domain.

1 flag → **mode: small**. Two files
(`src/state/store.mjs`, `test/cli/fgos.test.mjs`), no gray areas — the
shape to copy (`statusCategory`'s own write-time stamp) already exists and
is proven.

## Approach

Per CONTEXT.md D1 (locked, not reopened here): mirror `statusCategory`'s
exact write-time-stamping pattern.

- `src/state/store.mjs:170-192` (`addWork`) stamps `statusCategory` via
  `statusCategoryFor(getDomain(item.domain), item.status)` only when the
  result is truthy. Add the same shape for `parkReason`, calling
  `parkReasonForStatus(getDomain(item.domain), item.status)`
  (`src/state/workflow-stage-graphs.mjs:409`, already imported by
  `store.mjs` for the `statusCategoryFor` sibling — add `parkReasonForStatus`
  to that same import).
- `src/state/store.mjs:452-469` (`moveWork`) stamps `statusCategory` on the
  `to` status the same way. Mirror it for `parkReason` using `to` in place
  of `item.status`.
- No `bin/fgos.mjs` change needed: `list`'s `case 'list':` already returns
  whatever `listWork(dir)` produces verbatim (confirmed via direct read —
  `statusCategory` itself needs no separate CLI-side wiring to appear in
  `list --json` output today, so `parkReason` will surface the same way
  once stamped at the state layer).

**Alternative rejected**: deriving `parkReason` at READ time inside
`bin/fgos.mjs`'s `list` case instead of stamping at write time. Rejected —
`statusCategory`'s own doc comment (`work.mjs:96-134`) states this exact
pattern is required by `docs/platform-foundations.md`'s L3 replay-from-zero
law (a read-time-computed value could replay differently after
`DOMAINS[domain].parkReason` changes later); `parkReasonForStatus`'s own
doc comment makes the identical claim for the sibling field. Both fields
follow the same write-time discipline for the same reason.

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| `store.mjs` stamping (`addWork`/`moveWork`) | low — additive field, mirrors a proven pattern exactly, touches 2 call sites | CLI-level test: create/move an item to a park status (`blocked`), assert `fgos list --json`'s output carries `parkReason` on that item |
| Non-park statuses (`todo`, `doing`, tail-segment statuses) stay unstamped | low — `parkReasonForStatus` already returns `undefined` for these (confirmed via direct read of `DOMAINS.coding.parkReason`, which only declares `blocked`/`awaiting-human`/`awaiting-approval`), and the existing `if (result) { item.field = result }` guard (mirrored from `statusCategory`) means `undefined` never gets stamped as a key | same CLI-level test also asserts a `doing`-status item's output carries no `parkReason` key |

`fgos graph --json`'s `criticalPath`/`topUnblock` carry no signal here —
single small item, 0 deps, blocks nothing in the graph today.

**Impact-analysis posture** (`fgos tool query --capability impact-analysis
--status present`): GitNexus registered and `present`. Not invoked as a
proof point — `store.mjs`'s `addWork`/`moveWork` are two well-understood,
already-read call sites (confirmed via direct read, not graph query), and
the change is purely additive (a new conditionally-set object key),
carrying no risk of breaking an existing caller that graph traversal would
usefully surface.

## Shape (small)

1. `src/state/store.mjs`: import `parkReasonForStatus` alongside the
   existing `statusCategoryFor` import (line 36). In `addWork` (near line
   190) and `moveWork` (near line 467), add the mirrored stamp:
   ```js
   const park = parkReasonForStatus(getDomain(item.domain), item.status); // addWork
   if (park) { item.parkReason = park; }
   ```
   (and the `to`-based equivalent in `moveWork`).
2. `test/cli/fgos.test.mjs`: add a CLI-level test using the file's existing
   `run(cwd, [...])`/`envelopeData(...)` harness (precedent: the `list`
   tests at lines 295-380) — move a fresh item to `blocked`, run
   `list --json`, assert `work[id].parkReason === 'system-error'`; and
   assert a `doing`-status item's own record carries no `parkReason` key.

Cases to prove: a park status (`blocked`) gets the field; a non-park
status (`doing`) does not; the four tail-segment statuses (no
`statusLabels`/`parkReason` entry at all) are unaffected — same guard
already covers this, no separate test needed per the risk map above.

No split — one piece, already the smallest honest unit.

## Proof surface (item verify, unchanged from clarify)

```
grep -qE '\.parkReason\b' test/cli/fgos.test.mjs && node --test test/cli/fgos.test.mjs
```

## Assumptions

- None beyond CONTEXT.md D1. Exact assertion wording/fixture item id in
  the new test is an implementation detail, not material to scope.
