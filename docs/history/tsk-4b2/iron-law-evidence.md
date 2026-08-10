# Iron Law evidence — tsk-4b2

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-4b2`):

```json
{
  "required": true,
  "matchedFlags": ["migration"],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Verify command

```
node --test test/intake/discovery.test.mjs
```

## RED — pre-fix (`src/intake/discovery.mjs` and `bin/fgos.mjs` at commit
`bdd360e6`, the commit immediately before the implementation landed)

```
ℹ tests 29
ℹ pass 21
ℹ fail 8
```

Real failures, e.g.:

```
✖ resolveDiscovery advances to discovery when docsRef points at a real, non-empty CONTEXT.md, with no verdict required (tsk-4b2 D3)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'decompose'
  - 'discovery'

✖ resolveDiscovery advances discovery -> exploring on a caller-supplied clear verdict (tsk-4b2 D3/D6, nextDiscoveryEdge)
  (throws: resolveDiscovery: work "item-x" (domain "coding") is at stage "discovery",
   which this engine cannot advance from -- pre-fix nextDiscoveryEdge does not exist)

✖ resolveDiscovery advances exploring -> decompose on a caller-supplied clear verdict (tsk-4b2 D6)
  (same throw as above, pre-fix has no exploring-stage branch)

✖ resolveDiscovery refuses a clear verdict for a coding-domain item already at decompose (tsk-4b2 D3/D6)
  AssertionError: pre-fix error message text does not match the new format

✖ resolveDiscovery keeps the direct clarify->decompose edge unchanged for a domain that never registered
  discovery/exploring (tsk-4b2, domain-aware nextDiscoveryEdge)
  (pre-fix has no domain-aware branch at all -- this test's own setup for the
   'triage' fixture domain throws before reaching the assertion)
```

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
ℹ tests 29
ℹ pass 29
ℹ fail 0
```

## Real command output pasted verbatim, not paraphrased

RED run:
```
$ node --test test/intake/discovery.test.mjs
...
ℹ tests 29
ℹ pass 21
ℹ fail 8
```

GREEN run (identical file state to what is actually committed):
```
$ node --test test/intake/discovery.test.mjs
...
ℹ tests 29
ℹ pass 29
ℹ fail 0
```

Full `npm test` (2750 tests, 0 fail) was also run clean against the final
committed state before `fgos return` — see the item's own decision log
for that run's real summary line.
