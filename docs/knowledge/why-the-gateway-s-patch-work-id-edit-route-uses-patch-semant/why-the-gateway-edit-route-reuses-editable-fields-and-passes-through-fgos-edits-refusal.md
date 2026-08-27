---
authoritative_for: why the gateway's PATCH /work/{id} edit route uses PATCH semantics, reads its accepted fields from EDITABLE_FIELDS instead of hardcoding a list, and passes fgos edit's own refusal to the client verbatim instead of re-validating
framework: diataxis
mode: explanation
---

# Why the gateway edit route reuses EDITABLE_FIELDS and passes through `fgos edit`'s refusal

The gateway's `/v1` surface had `GET /work/{id}` but no way to edit an
item — `POST /work` only adds. `docs/ui-spec/modals/M03-add-edit-item.md`'s
edit mode already assumed an edit effect
(`run_fgos_add_or_edit_verb`), so the UI spec was resting on an endpoint
that didn't exist yet; the next item touching the task-detail screen
(`tsk-4id`) would have hit that gap directly.

## PATCH, not PUT — because `fgos edit` is a partial update

The HTTP method was left to the implementer, but had to match the real
semantics of the verb underneath: `fgos edit` only changes the fields a
caller actually passes, leaving everything else untouched. That's a
partial-update contract, which `PATCH` names accurately and `PUT`
(whole-resource replace) does not — so the route is `PATCH
/work/{id}`.

## The accepted-fields list is read from the engine, never re-declared

The route's accepted body fields come from `EDITABLE_FIELDS`
(`src/state/store.mjs:275`) at call time, not from a second, hand-maintained
list in the gateway. The full set as of this item: `title`, `description`,
`kind`, `risk`, `verify`, `tier`, `refs`, `deps`, `acceptance`, `priority`,
`intent`, `docsRef`, `parent`, `urgent`, `impact`, `effort`, `footprint`,
`mergeAfter`, `supersededBy`, `duplicates`, `domainFields`, `goalTier`.
Reading this from the one real source instead of hardcoding a duplicate is
what keeps the gateway from drifting out of sync the next time
`EDITABLE_FIELDS` itself changes.

## Validation stays in the engine — the gateway never re-implements it

`fgos edit` refuses when no field actually changed; that refusal has to
reach the client **verbatim**, never re-worded or re-derived by the
gateway. This follows the same rule the area spec already states (R2):
validation is not allowed to be re-implemented client-side — whatever the
engine refuses is the thing a person actually sees. The gateway route is a
thin pass-through of `fgos edit`'s own result, not a second validation
layer.

## Why this route had to land before tsk-2ok, not after

This item's own footprint (`herdr-plugin/src/gateway.rs`,
`docs/contracts/fgos-gateway-api-v1.yaml`) overlaps two siblings already
touching the same file — `tsk-54y` (CORS + bind) and `tsk-48w`
(static-serving) — so none of the three could run concurrently with each
other; they had to sequence through `gateway.rs` one at a time.

Separately, `tsk-2ok` (multi-project support) changes the prefix of
*every* route, which would have forced this item to match a new path
shape had it landed first. `tsk-2ok` hadn't started yet, and the locked v1
decision (`D11`, single-gateway-only) meant there was no multi-project
shape to design against yet — so building the edit route ahead of `tsk-2ok`
was the correct order, not a scheduling accident.

## What stayed explicitly out of scope

The `M03` add/edit modal screen itself belongs to `tsk-4id`, not this item
— this item only builds the route the modal's edit mode depends on. The
add route (`POST /work`) already existed and needed no change.

## Source

`tsk-41h`, a child of `tsk-ldb`. Chokepoint principle cited from `tsk-7l9`
D7 (`docs/explanation/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md`):
gateway never touches the repo directly, every write goes through a real
`fgos` verb — this item is that principle applied to one new route, not a
new architectural decision of its own. Fuller shaping record:
`docs/history/herdr-web-dashboard-plan-realignment/`. Verify: `cd
herdr-plugin && cargo test --lib gateway`.
