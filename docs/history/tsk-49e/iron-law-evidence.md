# Iron Law evidence — tsk-49e

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-49e`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/state/store.mjs"]}
```

Matched via the `src/state/store.mjs` exact-path rule
(`src/evolve/iron-law.mjs`).

## Verify command

```
node --test test/state/store.test.mjs test/state/replay.test.mjs test/state/events.test.mjs test/scripts/events-jsonl-contiguity.test.mjs && npm test
```

## RED — pre-fix (`src/state/events.mjs`, `src/state/replay.mjs`,
`src/state/store.mjs` at commit `7e2f3e48`, the `tsk-4mx` commit
immediately before this item's implementation landed)

```
$ node --test test/state/replay.test.mjs
✖ rebuildView incremental path reads only the NEW bytes, not the whole file
  AssertionError: the incremental path must never call fs.readFileSync on the full log path
  true !== false

✖ rebuildView falls back to a full read when the snapshot sub-fields are malformed (wrong type, not absent)
  TypeError: Cannot set properties of undefined (setting 'size')
```

(readLastLineBefore/readEventsFromByte/foldEvents' seed-view parameter/
rebuildView's fast path do not exist pre-fix — the core new-behavior
tests fail exactly as expected; a few of the "falls back correctly"
tests coincidentally pass pre-fix too, since a full read is always what
happens without the fast path in the first place — not a gap in the
proof, the RED tests above are the ones that specifically exercise the
NEW mechanism.)

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
$ node --test test/state/replay.test.mjs test/state/store.test.mjs test/state/events.test.mjs
ℹ tests 153
ℹ pass 153
ℹ fail 0
```

Full `npm test` was also run clean against the final committed state
before `fgos return`.
