---
type: plan
title: fgos add/edit missing --parent flag
item: tsk-1xx
stage: decompose
---

# tsk-1xx — plan

## Mode

**standard.** Flags counted against the mechanical list:

- data model — yes: changes which fields `edit` may write (`EDITABLE_FIELDS`
  in `src/state/store.mjs`), a store-layer invariant with its own
  explanatory comment (`store.mjs:251-253`) that currently asserts the
  opposite of what D1 requires.
- public contracts — yes: adds a flag to two already-shipped CLI verbs
  (`fgos add`, `fgos edit`) in `src/cli/command-registry.mjs`.
- existing covered behavior — yes: `test/state/store.test.mjs` has four
  dedicated tests around `parent`'s unified-cycle-guard behavior
  (lines 419-474), one of which (line 433) explicitly documents and relies
  on today's "parent is NOT editable" invariant in its own comment.

No hard-gate flag applies (no auth, no data loss, no audit/security surface,
no external provider, nothing removes a validation) — 3 flags, no hard gate,
so **standard**, not high-risk.

## Approach (per CONTEXT.md D1/D2)

Three files change, no schema/event-shape change (parent already exists as
a field; `work.edit`/`work.add` events already accept arbitrary allowed
keys).

**1. `src/cli/command-registry.mjs`** — add a `parent` parameter to both the
`add` and `edit` verb definitions (string type, same shape as the existing
`discovered-from`/`docs-ref` entries), so the machine-readable registry
that drives `--help` and any programmatic caller stays accurate.

**2. `bin/fgos.mjs`** — the actual CLI handlers (registry above is docs-only,
not the parser):
- `add` case (~line 762): add
  `parent: optionalField(flags.parent, 'add --parent requires a non-empty id; omit --parent entirely to leave unset.')`
  to the `work` object — an exact mirror of the existing `discoveredFrom`
  line right above it, which already carries a comment noting it "mirrors
  `parent`'s norm." No existence-check (per CONTEXT.md's pinned term);
  `work.mjs`'s shape validation is the only guard, same as `discoveredFrom`.
- `edit` case (~line 977): **cannot** reuse `optionalField` as-is — that
  helper throws on `""` (`requireField` inside it), which is right for
  `docs-ref` (no clear semantics there) but wrong for `parent` per D2. Add:
  ```js
  if (flags.parent !== undefined) {
    patch.parent = flags.parent === '' ? null : flags.parent;
  }
  ```
  mapping `--parent ""` to `null` — the sentinel `work.mjs:255` already
  treats as "absent" (`work.parent !== undefined && work.parent !== null`),
  so this reuses the existing optional-additive convention rather than
  inventing a new one. Update the `edit` case's trailing error message
  (~line 1035, "edit requires at least one field to change: ...") to list
  `--parent` alongside the existing flags.

**3. `src/state/store.mjs`** — add `'parent'` to `EDITABLE_FIELDS`
(line 193). Rewrite the comment at lines 251-253: it currently states
"`parent` is NOT editable, so an edit closes such a cycle only by patching
`deps`..." — that sentence becomes false once `parent` is editable; replace
it with a note that `editWork` now revalidates `parent`-only edits through
the same `assertNoUnifiedCycle` call, so both the deps-patch path and a
direct parent-patch path are covered by one guard, not two.

No change needed to `src/state/work.mjs` (shape validation already applies
to any merged candidate regardless of which door produced it) or to
`decompose.mjs` (its own internal `addWork()` call is unaffected by CLI
changes).

## Risk map

| Component | Risk | Proof point (carried to fgos-coding-validating) |
|---|---|---|
| `store.mjs` `EDITABLE_FIELDS` + cycle guard | medium | **New test**: an `editWork` patch that sets `parent` alone (no `deps` involved) into a cycle is rejected. This is a genuinely new attack surface — today it's structurally impossible since `parent` isn't editable, so no existing test covers it. The existing test at `store.test.mjs:433` covers a *deps*-patch closing a cycle against a fixed parent edge; that scenario is unaffected and must still pass unmodified. |
| `bin/fgos.mjs` edit handler (`""` → `null` mapping) | low-medium | **New test/CLI check**: `fgos edit <id> --parent ""` clears the field (candidate ends up with `parent: null` or absent, not the literal string `""`, which `work.mjs:256` would otherwise reject as an empty string). |
| `bin/fgos.mjs` add handler | low | **New test/CLI check**: `fgos add ... --parent <existing-id>` round-trips through `listWork` with `parent` set; omitting `--parent` leaves it unset (byte-identical to today). |
| `store.mjs:251-253` comment | low | Read-only proof: comment no longer asserts the now-false "parent not editable" claim. |
| Existing test suite (`store.test.mjs`, `porting-store.test.mjs`) | low | Full `npm test` green — this is a widening of `EDITABLE_FIELDS`, a shared invariant read by other suites; nothing here should regress but the shared-contract change means the broad run is the honest proof, not just the touched-file run. |

**Impact-analysis posture: full.** `fgos tool query --capability
impact-analysis --status present` returned GitNexus registered and
`present`. Per `CLAUDE.md`'s capability gate, the MUST rules apply as
written for execution: run `impact({target: "editWork", direction:
"upstream"})` (and `addWork`) before editing either function, and report
the blast radius before proceeding — `editWork`/`addWork` are the single
write door (D3) with many callers, so this is not optional evidence here.

## Files touched

- `src/cli/command-registry.mjs` (registry entries for `add`/`edit`)
- `bin/fgos.mjs` (`add` and `edit` case handlers)
- `src/state/store.mjs` (`EDITABLE_FIELDS`, comment at ~251-253)
- `test/state/store.test.mjs` (new tests per risk map above)

Order: `store.mjs` first (the write-door change the other two depend on,
and where the new cycle-guard test lives), then `bin/fgos.mjs` (both
handlers), then `command-registry.mjs` (docs-only, no runtime dependency,
safe last). `fgos graph --json`'s `criticalPath` does not include `tsk-1xx`
(it is not on the current longest-dependency chain), so no external
ordering signal applies beyond this item's own internal file order.

## Split

Single honest piece of work — one CLI flag gap across three files, all
directly coupled through the same write-door change. No split.

## Verify

```
npm test -- --grep "editWork|EDITABLE_FIELDS|parent"
```
(narrow first, per project rules), broadened to full `npm test` before
`fgos return`, given the shared-contract risk noted above. Replaces the
item's placeholder `verify` field (`"chưa xác định — P15 bổ sung"`).
