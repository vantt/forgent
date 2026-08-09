# Iron Law evidence — tsk-28o

`classifyIronLaw` result on this item's own branch-committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Why `matchedModules` names `dispatch.mjs` even though this item never
touches it

`fgw/tsk-28o` forked from `fgw/tsk-2ie5` *after* its sibling `tsk-2c1` had
already merged into it — `dispatch.mjs`'s real diff belongs entirely to
`tsk-2c1`, already proven with its own failing-test-first proof at
`docs/history/tsk-2c1/iron-law-evidence.md` (present in this branch's own
diff, inherited from the same parent). This item's own footprint is exactly
one file: `.fgos/config.json` — per ADR0020, that change can never land
through this branch at all (`fgos-write-rejected` guard), so this branch
carries no code of its own; the real deliverable is commit `7c86305` on
`main` directly, same precedent as `tsk-5ge`'s `5ca7a58`.

## Test command

```bash
node --test --test-name-pattern="declares the gather capacity" test/runner/dispatch.test.mjs
```

(Full scoped verify: `node --test --test-skip-pattern="declares the
submit-assist-classify capacity" test/runner/dispatch.test.mjs` — 177/177
pass. The skip pattern excludes the same pre-existing, live-shared-state
test `tsk-2c1` already documented.)

## Failing-before transcript

`.fgos/config.json` temporarily swapped to `7c86305`'s own parent
(`git checkout b7ea6412 -- .fgos/config.json` at the main checkout — the
commit immediately before the `gather` capacity was registered), same
test run:

```
✖ the committed .fgos/config.json runner section declares the gather capacity (tsk-28o): for "gather", needs "prompt-completion", carries "repo-content" (D1, gather-capacity-purpose-binding CONTEXT.md), kind cli, allowCrossProvider true, well-formed {prompt}/{model} args (5.82012ms)
  AssertionError [ERR_ASSERTION]: capacities.gather must exist
      at TestContext.<anonymous> (test/runner/dispatch.test.mjs:661:10)

ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## Passing-after transcript

`.fgos/config.json` restored (`git checkout HEAD -- .fgos/config.json` at
the main checkout, i.e. commit `7c86305`), same test:

```
✔ the committed .fgos/config.json runner section declares the gather capacity (tsk-28o): for "gather", needs "prompt-completion", carries "repo-content" (D1, gather-capacity-purpose-binding CONTEXT.md), kind cli, allowCrossProvider true, well-formed {prompt}/{model} args (8.779421ms)

ℹ tests 1
ℹ pass 1
ℹ fail 0
```

`git diff --stat HEAD -- .fgos/config.json` at the main checkout was empty
after the restore, confirming the pass is against the real committed fix,
not a leftover working-tree edit.

## Dormancy note

`capacities.gather` is inert on `main` until `tsk-2ie5` (parent, carrying
`tsk-2c1`'s `dispatch.mjs`/`fgos-researching` changes) itself merges —
same validate-only-then-consumed pattern `tsk-1o7`'s `for`/`needs` fields
already used before `tsk-2ie5` became their first real consumer. Verified
end-to-end against `tsk-2ie5`'s own branch code (which does have the
consuming logic): `decide --for gather --has-live-task-access` →
`{"mechanism":"out-of-process","capacityId":"gather"}`; `resolve --for
gather --carries repo-content --prompt "test prompt"` → resolves to
`agy`/`Gemini 3.5 Flash (Medium)` as expected, `carries` gate cleared.
