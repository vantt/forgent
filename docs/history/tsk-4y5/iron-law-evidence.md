# Iron Law evidence: tsk-4y5

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff returned `required: true` — matched modules `bin/fgos.mjs`,
`src/state/store.mjs` (self-modifying), `matchedFlags: []`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

## Failing-test-first proof

Test command: `node --test test/cli/fgos.test.mjs` (part of `npm test`).

**Before the fix** — `src/state/store.mjs`'s `EDITABLE_FIELDS` allowlist
had not yet been extended to include `urgent`/`impact`/`effort` (only
`bin/fgos.mjs`'s CLI parser had been). The new test
`edit --urgent/--impact/--effort set the item fields to the given values,
exit 0` failed, real transcript:

```
✖ edit --urgent/--impact/--effort set the item fields to the given values, exit 0 (132.459289ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  4 !== 0

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4y5-YNRjya/test/cli/fgos.test.mjs:832:10)
      ...
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 4,
    expected: 0,
    operator: 'strictEqual',
    diff: 'simple'
```

Manual reproduction of the same root cause (`bin/fgos.mjs`'s CLI handler
correctly forwarded the flags, but `store.mjs`'s own separate write-door
allowlist rejected them — a real integration bug, not a hypothetical):

```
$ node .../bin/fgos.mjs edit dbg-item --urgent critical --impact 12.5 --effort 3
fgos: edit cannot change "urgent" — allowed fields are: title, kind, risk, verify, tier, refs, deps, acceptance, priority, intent, docsRef.
```
(exit code 4)

**After the fix** — `EDITABLE_FIELDS` extended to
`['title', 'kind', 'risk', 'verify', 'tier', 'refs', 'deps', 'acceptance', 'priority', 'intent', 'docsRef', 'urgent', 'impact', 'effort']`
(`src/state/store.mjs`). Same manual reproduction, real transcript:

```
$ node .../bin/fgos.mjs edit dbg-item --urgent critical --impact 12.5 --effort 3
{
  "contract": "fgos.v1",
  "generated_at": "2026-07-31T06:24:06.071Z",
  "data_hash": "1383ca79ca7a47d1ff29fa191588c11bc06d4d11daed1a6c5945c2a83507a579",
  "data": {
    "id": "dbg-item",
    "fields": ["urgent", "impact", "effort"],
    "seq": 2
  }
}
```

Full suite after the fix (`npm test`): **1928 pass, 0 fail, 5 skip**
(Phase A checkpoint); final state after Phases B/C: **1952 pass, 0 fail,
5 skip** (5 skips pre-exist this item, unrelated).

## Why `bin/fgos.mjs`/`store.mjs` were touched at all

Phase A (D2/D3/D5, `docs/history/work-item-priority-matrix/plan.md`)
adds `--urgent`/`--impact`/`--effort` to `add`/`edit` — both files are
the CLI parser and the write-door allowlist for exactly those verbs, the
same two files every prior `add`/`edit` field addition (`priority`,
`intent`, `docsRef`, ...) has always touched.
