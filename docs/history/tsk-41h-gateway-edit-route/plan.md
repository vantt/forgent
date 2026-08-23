# plan.md — tsk-41h: gateway route edit for /v1 (PATCH /work/{id})

Mode: **standard**

Flag count/which applied (per `fgos-routing`'s Mode gate): 2 flags —
**existing covered behavior** (`build_router` is CRITICAL-risk per the
impact scan `tsk-54y` already ran — 9+ existing tests depend on its exact
route composition) and **public contracts** (the item's own footprint
edits `docs/contracts/fgos-gateway-api-v1.yaml`, the one source of truth
for every client this cluster builds against tsk-yo0/tsk-5jr onward). No
hard-gate flag: no auth/authorization decision (reuses the existing
`require_token` layer unchanged), no data-loss risk (a PATCH mutating
fields the engine itself validates, same write shape `move`/`ask`/`answer`
already have), no external-system integration, no cross-platform surface.
2 flags, no hard-gate → **standard**.

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returns gitnexus `present` (re-confirmed this session).
Ran `mcp__gitnexus__impact` on `build_router` during `tsk-54y`'s own
planning pass (same session, findings still valid — this item does not
change `build_router`'s signature, only adds one more `.route()` chain
entry and one new handler function, the same shape `tsk-48w`'s
`with_static_serving` used to keep blast radius at zero on
`build_router`'s own 9 tests).

## Approach

**Chosen path** (already implemented and proven with real evidence at
this same session — see RESEARCH.md's live command-execution section):

1. `PATCH /work/{id}` handler `patch_work`, added to the SAME route chain
   entry as the existing `get_work_by_id` (`.route("/work/{id}",
   get(get_work_by_id).patch(patch_work))`) — no new path, no signature
   change to `build_router` itself, so the file's own 9+ existing tests
   for that function are untouched (confirmed: `cargo test --lib gateway`
   — 32/32 pass, the original 9 plus `tsk-48w`'s 4 plus this item's 9 new
   ones, zero regressions).
2. Request body accepted as a raw `serde_json::Map<String, Value>`
   (`AppJson<serde_json::Map<String, Value>>`), not a fully-typed struct
   per field — deliberately: the item's own scope line ("KHÔNG hardcode
   lại danh sách") means the handler must cover every one of
   `EDITABLE_FIELDS`' 21 entries, read directly from `src/state/store.mjs`
   and `bin/fgos.mjs`'s real `edit` case (RESEARCH.md), not re-guessed or
   narrowed to a convenient subset.
3. Translation, not validation (area spec R2): each recognized field
   becomes exactly the CLI flag/encoding `bin/fgos.mjs`'s own `edit` case
   uses for it (plain string, comma-joined list, JSON-encoded string, or
   stringified number — see RESEARCH.md's per-field breakdown). An
   unrecognized JSON key is silently dropped, matching the CLI's own
   behavior for an unrecognized flag exactly (never a stricter check this
   route would be inventing on its own authority). `fgos edit`'s real
   rejections — including "no field changed", an out-of-vocabulary enum
   value, or an unresolvable `acceptance` evidence path — reach the caller
   verbatim through the same `run_verb_blocking`/`GatewayError` path every
   other write route already uses.
4. `docs/contracts/fgos-gateway-api-v1.yaml` updated in the SAME commit as
   the code (item's own scope line: "cập nhật... CÙNG LÚC với code, không
   trước") — a new `EditableWorkFields` schema (all 21 fields, each
   documented with its real shape/quirk) and a `patch:` operation on
   `/work/{id}`.
5. Every enum/id-shaped scalar field gets `reject_leading_dash`
   (RESEARCH.md's judgment call: consistent with this file's own default
   for `to`/`expect`/`status`/`stage`, rather than inventing a second
   free-text exemption class beyond the existing `text`/`reason` one).
   Every list-field element gets the same guard PLUS a check that it
   contains no comma (a comma inside one element would silently re-split
   it on the CLI's own comma-separated parse, producing a different patch
   than what was sent — refused up front instead).

**HTTP method: PATCH, not PUT** (item's own open question, now answered
and recorded, not left to Execute): `fgos edit` is a partial update — only
fields present in the body change, everything else on the item is left
alone — which is exactly PATCH's semantics per RFC 5789, whereas PUT
conventionally implies a full-resource replace this endpoint never does.

**Real correction made at THIS validating pass, not guessed:** an earlier
draft treated `urgent` as a boolean (bare `--urgent` flag when `true`,
nothing when `false`) because its NAME reads boolean-shaped and it sits
in the CLI's plain same-name pass-through loop alongside `title`/`kind`/
`risk`. A live `fgos edit --urgent` smoke test against a real scratch
store rejected the literal boolean `true`: `work.urgent must be one of
["low","medium","high","critical"]`. Fixed before commit — `urgent` now
sits in the SAME plain-string-field loop as `title`/`kind`/`risk`, taking
a real enum string, not a bespoke boolean branch. `docs/contracts/
fgos-gateway-api-v1.yaml`'s `EditableWorkFields.urgent` corrected to match
(`type: string, enum: [low, medium, high, critical]`).

**Phương án đã cân nhắc và loại:**
- A fully-typed Rust struct with one field per `EditableWorkFields` entry
  (21 typed `Option<T>` fields) — considered, rejected in favor of the raw
  `Map<String, Value>` + explicit per-field-group loop shape: with 21
  fields split across 4 different encoding shapes (plain string, list,
  JSON-string, number), a typed struct would need the exact same 4 loops
  internally anyway (to build the CLI args), while adding 21 named struct
  fields' worth of boilerplate for no behavioral difference — YAGNI.
- Deep type/value validation in Rust (matching `EDITABLE_FIELDS`'
  semantic rules — e.g. is `risk` one of the real coding-domain values) —
  rejected outright: area spec R2 is explicit that validation stays at
  the engine, never re-implemented at a client-facing layer. This
  handler's own job ends at "is this JSON shape translatable into a CLI
  arg at all" (string vs array vs number), never "is this value
  semantically valid for the domain."

**Files touched:** `herdr-plugin/src/gateway.rs` (route + handler + 9 new
tests + a new `CapturingGateway` test double), `docs/contracts/
fgos-gateway-api-v1.yaml` (`EditableWorkFields` schema + `patch:`
operation on `/work/{id}`).

**Order:** single item, no ordering dependency on other pieces of this
plan (`deps: []`) — the one real sequencing constraint is the cluster-wide
"never run two of tsk-54y/tsk-48w/tsk-41h/tsk-2ok in parallel" rule
(tsk-ldb's own description), already honored: both tsk-54y and tsk-48w
delivered before this item started.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| New route doesn't disturb `build_router`'s existing 9+ tests | Low — additive route-chain entry, no signature change, same "wrap, don't touch" shape `tsk-48w` already proved works | `cargo test --lib gateway`: 32/32 pass, the original 9 + `tsk-48w`'s 4 + this item's 9 new ones, all green |
| Per-field CLI-arg translation matches the REAL `fgos edit` flag/encoding for every one of the 21 fields | Medium — a mismatch here would silently save something different from what was sent, or reject a legitimate patch | Live command execution against a real scratch `.fgos` store (`fgos init`+`fgos add`+`fgos edit` with the exact flags this handler builds) — real success for `title`/`risk`/`priority`/`effort`/`docsRef`/`domainFields`; real, correct rejections for an out-of-vocabulary `risk` value and an unresolvable `acceptance` evidence path (proving R2's "engine validates, not this route" holds in practice, not just in prose) |
| `urgent`'s real type/encoding | Medium (already resolved) — caught by the same live smoke test above, not guessed | See "Real correction" above — fixed and re-verified (`cargo test --lib gateway` green after the fix) |
| A comma inside a list-field element can't silently corrupt the patch | Low | Dedicated test: an element containing `,` is refused (400), never silently re-split |

## Decide the split

One honest piece of work — no split. Route handler, contract yaml update,
and tests all serve the exact one observable behavior the item's own
title names ("route edit cho /v1"); the item's own scope note already
draws the boundary that keeps this small (no M03 screen, no add route —
already exists).

## Verify

Item's existing verify (`cd herdr-plugin && cargo test --lib gateway`)
is already real, runnable, and targets exactly this file (same verify
`tsk-54y` used successfully for a prior gateway-only change). No sync
needed.

## Outstanding questions

None
