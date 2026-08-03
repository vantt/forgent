# Iron Law evidence — tsk-3gx-3

`classifyIronLaw` on this item's final diff (evaluated the same way as
`tsk-3gx-1`/`tsk-3gx-2`, via `sync-root tsk-3gx` at the root's own
return-time check) returns `required: true`, matched module
`["bin/fgos.mjs"]` (no matched keyword flags) — the whole CLI dispatcher
file deliberately stands in for "the evolve verb" (D10/D14, `iron-law.mjs`'s
own module rule comment), so any change to it is self-modifying-capable by
definition, regardless of which case block moved.

## Test command

```
node --test --test-name-pattern="promote-to-component" test/cli/fgos.test.mjs
```

## Failing-before transcript

Captured by temporarily reverting `bin/fgos.mjs` and
`src/cli/command-registry.mjs` to their pre-fix content
(`git show HEAD:bin/fgos.mjs`, the commit before this item's own
implementation commit — HEAD at capture time was `9e63254`, `tsk-3gx-2`'s
own evidence commit) while keeping the new test file, then running the
new tests against the unfixed dispatcher:

```
$ node --test --test-name-pattern="promote-to-component" test/cli/fgos.test.mjs

✖ promote-to-component requires at least 2 ids, exit 4
✖ promote-to-component on a nonexistent member id is rejected as validation, exit 4
✖ promote-to-component refuses a member that already has a parent, exit 4
✖ promote-to-component refuses ids that are not connected via deps/mergeAfter, exit 4
✖ promote-to-component happy path (D1 new-item): ...
✖ promote-to-component happy path (D1 reuse-member): ...
✖ promote-to-component reports merged-parent-rejected (never crashes) ...
  AssertionError [ERR_ASSERTION]: fgos: unknown verb "promote-to-component". Usage: fgos
  <init|add|submit|discover|decompose|move|retrospective|cleanup|edit|ask|answer|decision|
  list|ready|rebuild|repair|check|rollup|take|return|review|approve|sync-root|reject|
  catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status> ...
  fgos: invocation fault recorded to /tmp/fgos-cli-GaY887/.fgos/invocation-faults.jsonl

  4 !== 0
✖ promote-to-component bails a conflicting member without setting its parent, still processes and merges the rest
ℹ tests 8
ℹ pass 0
ℹ fail 8
```

(all 8 fail identically — "unknown verb" — since the whole verb does not
exist yet on the unfixed dispatcher; one representative failure quoted
above, the rest are the same shape.)

## Passing-after transcript

Restored `bin/fgos.mjs` and `src/cli/command-registry.mjs`, then reran the
same tests:

```
$ node --test --test-name-pattern="promote-to-component" test/cli/fgos.test.mjs

✔ promote-to-component requires at least 2 ids, exit 4
✔ promote-to-component on a nonexistent member id is rejected as validation, exit 4
✔ promote-to-component refuses a member that already has a parent, exit 4
✔ promote-to-component refuses ids that are not connected via deps/mergeAfter, exit 4
✔ promote-to-component happy path (D1 new-item): creates a fresh root, merges both members into it, sets parent only after real success, records one decision
✔ promote-to-component happy path (D1 reuse-member): promotes an existing member to root, root itself is skipped not merged
✔ promote-to-component reports merged-parent-rejected (never crashes) when the real git merge succeeds but setting parent would close a deps+parent cycle
✔ promote-to-component bails a conflicting member without setting its parent, still processes and merges the rest
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

Full suite (`npm test`) also confirmed green at 2256/2256, both before and
again after this restore, before this item was returned.
