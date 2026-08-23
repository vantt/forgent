# Iron Law evidence — tsk-54j

Item: `tsk-54j` — "herdr web dashboard P0a: area spec for the web dashboard
surface". Deliverable: `docs/specs/herdr-web-dashboard.md` plus one pointer
line in `docs/specs/reading-map.md`.

## Classification

`classifyIronLaw`, run against the real committed diff (`changedFiles`,
`src/runner/merge.mjs`) after the implementation commit landed:

```json
{"required":true,"matchedFlags":["auth","authentication","migration","secret","delete"],"matchedModules":[]}
```

**`matchedModules` is empty, and that is the honest reading of this item.**
The flags all come from the item's own description text — the spec discusses
authentication, secret storage and deletion because those are what it has to
document. No code module was touched: the committed diff is two markdown files
under `docs/specs/`. The gate still applies, so the evidence below is real
rather than waived.

## Proof command

The item's own `verify`, run exactly as recorded on the item:

```bash
test -f docs/specs/herdr-web-dashboard.md \
  && grep -q '^## Purpose' docs/specs/herdr-web-dashboard.md \
  && grep -q '^## Entry Points & Triggers' docs/specs/herdr-web-dashboard.md \
  && grep -q '^## Actors & Access' docs/specs/herdr-web-dashboard.md \
  && grep -q '^## Behaviors & Operations' docs/specs/herdr-web-dashboard.md \
  && grep -q '^## Business Rules' docs/specs/herdr-web-dashboard.md \
  && grep -q 'herdr-web-dashboard.md' docs/specs/reading-map.md
```

## Failing first

Run at planning time, before any file was written (the discipline this repo
records as *"a verify that has never run red is not a verify"*):

```text
verify exit: 1
```

The red comes from the first clause: `test -f docs/specs/herdr-web-dashboard.md`
on a file that did not exist. This is a fail-closed red, not the fail-open
class this feature's own reality gate caught in its first round (a filter that
matches nothing but still exits 0) — a missing file cannot make `test -f`
succeed.

## Passing after

Run after `docs/specs/herdr-web-dashboard.md` was written and the pointer line
was added to `docs/specs/reading-map.md`:

```text
verify exit: 0
```

## What this proves, and what it does not

Proves: the spec exists at the required path, carries the five required
headings, and is discoverable from the reading map — the mechanical
requirement `AGENTS.md` places on a new product area.

Does not prove: that the prose under those headings is correct or sourced.
That was covered separately, at the item's own reality gate, by re-reading
each claim against the artifact it cites — `docs/history/herdr-web-dashboard/
plan.md` §"Kế hoạch riêng của P0a" records those checks (RA1-RA6) and the two
answers settled at the `validateApprove` gate.
