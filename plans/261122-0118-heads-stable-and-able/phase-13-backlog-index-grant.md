# Phase 13: Heads may write the backlog index file

Capability: `code:implement`.

Closes `p-dw3h5wscns`. Owner decision 2026-11-23 on `q-nudu6zlusf`: fix the grant, nothing wider.

## Inputs

- `src/session-host/head-grants.mjs`: the secretary and supervisor rows grant writes `plans` and `plans/backlog/*`, but
  `fgos session write plans/backlog.md` is refused `path-not-granted` (seen 2026-11-23 17:15 from head:supervisor-forgent).
  The fgos-secretary and fgos-supervisor skills both tell the head to replace exactly that file.

## Footprint

`src/session-host/head-grants.mjs`, `test/session-host/head-grants.test.mjs`.

## Steps

1. Add `plans/backlog.md` to the `writes` of the secretary and supervisor rows of `GRANTS`, and nothing else.
2. Extend the owning proof in `test/session-host/head-grants.test.mjs`: both roles may write `plans/backlog.md`; a
   neighbouring path (for example `plans/backlog.md.bak` or `plans/other.md` outside a granted pattern) is still refused.
3. `node --test test/session-host/head-grants.test.mjs` green; land through the lead's normal land.

## Done when

A confined secretary or supervisor `fgos session write plans/backlog.md` succeeds once the release carrying this phase
is active (phase 11's live probe row re-confirms it); no other head write grant changes.
