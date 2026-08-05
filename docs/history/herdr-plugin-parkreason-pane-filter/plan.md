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

---

# plan: switch fgos.rs's parse_doing to parkReason (tsk-1hb)

tsk-48i's own scope above is delivered (D1, the `parkReason` field is now
stamped on `fgos list --json` — confirmed via direct read of
`src/state/store.mjs:195-202`). This section is tsk-1hb's own plan for D2/D3
above — the `herdr-plugin/src/fgos.rs` consumer switch — appended to this
same feature dir per CONTEXT.md's "Scope note (post-lock)".

## Mode

Flags counted (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform, existing covered behavior, weak
proof around the area, multi-domain):

- **existing covered behavior** — `parse_doing_pins_literal_status_membership`
  (`herdr-plugin/src/fgos.rs:385-395`) currently pins the literal-status
  membership this item intentionally replaces (D3 explicitly supersedes
  it); `sort_status_tier_ranks_awaiting_approval_first_then_stage_order`
  and `parse_doing_excludes_done_items` also exercise `parse_doing` with
  fixtures that carry no `parkReason` field at all, so the filter swap
  changes what those fixtures need to assert without changing the fixtures
  themselves.

No other flag applies: no auth/authorization/data-model/audit-security
surface; no external system invoked (pure in-process JSON parsing, `node`
subprocess call unchanged); public contract (`parkReason` on `fgos list
--json`) already exists and is stable, this item only consumes it, never
changes it; not cross-platform in the risky sense; single domain, single
crate.

1 flag → **mode: small**. One file (`herdr-plugin/src/fgos.rs`), decisions
already locked in CONTEXT.md D2/D3 — no gray areas, only mechanical
translation of an already-specified predicate plus fixture upkeep.

## Approach

Per CONTEXT.md D2/D3 (locked, not reopened here): replace the literal
`item.status == "doing" || item.status == "awaiting-approval"` predicate in
`parse_doing` (`herdr-plugin/src/fgos.rs:110`) with a `parkReason`-based
one, and drop the literal match entirely (no parallel fallback, D3).

- `WorkItemRaw` (`fgos.rs:36-40`) gains `#[serde(rename = "parkReason")]
  park_reason: Option<String>` alongside the existing `title`/`status`/
  `stage` fields — `fgos list --json` already emits this key (tsk-48i D1,
  confirmed landed), `serde` simply needs the struct field to read it;
  absent-key JSON already deserializes to `None` for an `Option<T>` field
  with no extra attribute needed.
- `parse_doing`'s filter closure (`fgos.rs:110`) becomes:
  `matches!(item.park_reason.as_deref(), None | Some("natural-finish"))` —
  the exact D2 membership (absent or `natural-finish` in; `system-error`/
  `human-question` out), and because those four are the *only* values
  `parkReasonForStatus` ever returns (CONTEXT.md's own pinned terms), a
  positive match on the two "in" values already implies exclusion of the
  other two without a separate `&&` exclusion clause.
- `DoingRow`/`doing_tier` (`fgos.rs:28-33`, `:45-55`) are unaffected —
  D3 keeps `status`/`stage` available for display/sort; only pane
  *membership* moves off `status`.
- Doc comment above `parse_doing` (`fgos.rs:100-103`, currently describing
  the tsk-4vo D1 status-literal definition) gets rewritten to describe the
  `parkReason`-based definition instead — stale-comment drift the
  `Never Do` rule against "renaming without understanding" would otherwise
  leave behind.

**Alternative rejected**: keeping the literal `status` match as a parallel
fallback alongside the new `parkReason` check. Rejected per CONTEXT.md D3
verbatim — it would leave the crate still silently dependent on the
literal strings this item exists to remove.

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| `parse_doing` filter predicate swap | low — single boolean predicate, matches D2's spec verbatim, one call site | `cargo test parse_doing` (adapted membership test, see Shape) |
| `TIER_SORT_FIXTURE`/`STATUS_MEMBERSHIP_FIXTURE` test fixtures (`fgos.rs:264-297`, `:350-383`) carry no `parkReason` key today | medium — every fixture item needs an explicit `parkReason` value added (park statuses get their real value; non-park statuses stay absent), or the new filter silently mis-classifies them against the fixtures' own existing status-only shape | same `cargo test parse_doing` run, plus a direct read of the diff confirming every park-status fixture row (`awaiting-approval`→`natural-finish`, `blocked`→`system-error`, `awaiting-human`→`human-question`) gained the field |
| `parse_doing_pins_literal_status_membership` (the test D3 supersedes) | low — CONTEXT.md already charters replacing/adapting it, not preserving its old assertion | adapted test (see Shape) asserts the new `parkReason`-based membership on the same five-row shape |

**Impact-analysis posture** (`fgos tool query --capability impact-analysis
--status present`): GitNexus registered and `present`, but its index is the
Node/JS `forgent` repo graph — `herdr-plugin` is a separate Rust crate
outside that graph's coverage. Not leaned on as a proof point here, same as
CONTEXT.md's own stance: `parse_doing`'s only caller is `fetch_doing`
(`fgos.rs:169-172`, confirmed via direct read), itself only exercised by
this crate's own test suite — `cargo test` (the full crate suite, not just
`parse_doing`) is the real blast-radius check for a change this contained.

## Shape (small)

1. `herdr-plugin/src/fgos.rs`:
   - Add `park_reason` field to `WorkItemRaw` with `#[serde(rename =
     "parkReason")]`.
   - Rewrite `parse_doing`'s filter predicate and its doc comment per the
     Approach above.
   - Update `TIER_SORT_FIXTURE` and `STATUS_MEMBERSHIP_FIXTURE` to add the
     `parkReason` key on every row that needs one for its status
     (`awaiting-approval`→`"natural-finish"`, `blocked`→`"system-error"`,
     `awaiting-human`→`"human-question"`; `doing`/`todo` rows stay without
     the key).
   - Rename/adapt `parse_doing_pins_literal_status_membership` to assert
     the `parkReason`-based membership instead of the literal-status one
     (same five-row fixture shape, new assertions: `tsk-awaiting-human`
     still excluded, now via `human-question` rather than the literal
     status string).
   - Re-check `sort_status_tier_ranks_awaiting_approval_first_then_stage_order`
     and `parse_doing_excludes_done_items` still pass unmodified once their
     fixtures gain the `parkReason` key (they assert tier-sort/done-exclusion
     behavior, not membership itself, so no assertion change expected —
     only the fixture data needs the new field).

Cases to prove: `parkReason` absent → included (the `doing`-equivalent
case); `parkReason == "natural-finish"` → included; `parkReason ==
"system-error"` → excluded; `parkReason == "human-question"` → excluded;
existing tier-sort and done-exclusion behavior unchanged once fixtures
carry the new field.

No split — one piece, already the smallest honest unit (one file, one
predicate, three fixture updates).

## Proof surface (item verify)

```
cd herdr-plugin && cargo test parse_doing
```

## Assumptions

- Exact wording of the adapted `parse_doing_pins_literal_status_membership`
  test (renamed or left in place) is an implementation detail, not material
  to scope — CONTEXT.md's own "Outstanding questions deferred to planning"
  already defers this.
- `parkReasonForStatus`'s four-value closed set (absent/`natural-finish`/
  `system-error`/`human-question`) stays closed for the `coding` domain for
  the duration of this item's execution — CONTEXT.md's pinned terms already
  assert this; not re-verified here since no code in this item's diff can
  change that table (`workflow-stage-graphs.mjs` is untouched by this
  item's scope).
