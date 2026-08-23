# Iron Law evidence — tsk-2ie5

`classifyIronLaw` result on this item's own branch-committed diff
(`changedFiles(repoRoot, item)` against trunk, now carrying both merged
children):

```json
{"required":true,"matchedFlags":["credentials","audit"],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Why this item's own evidence is a citation, not a re-derivation

`tsk-2ie5` split into two children the moment `fgos-coding-planning` found the
ADR0020 wall (`.fgos/config.json` can never land through a `fgw/<id>`
branch): `tsk-2c1` (the code — `src/runner/dispatch.mjs`, `fgos-researching`
wiring) and `tsk-28o` (the config — the `gather` capacity registered
directly on `main`). This item's own worktree never carries independent
code of its own past that split — every file `classifyIronLaw` names above
is a merge of the two children's own already-committed work, each with its
own already-produced failing-test-first proof:

- `src/runner/dispatch.mjs` (`matchedModules`) — proven at
  `docs/history/tsk-2c1/iron-law-evidence.md`: `CAPACITY_CARRIES`,
  `resolveCapacityIdForPurpose`, and `logCapacityDispatch` all absent
  pre-fix (`SyntaxError` on import), 21/21 new tests passing post-fix.
- `credentials`/`audit` (`matchedFlags`) — these come from this item's own
  description text (the D15 `carries` governance discussion: "secrets
  KHONG BAO GIO la mot gia tri hop le", the `capacity.dispatch` audit
  event). The real gate this flag pair refers to is the SAME
  `resolveExecutorConfig` `carries` check `tsk-2c1`'s evidence already
  proves — specifically its "refuses a `carries: user-text` capacity
  handed repo-content — refused before spawn (D15 verify item 8)" test,
  and the dispatch-log tests proving every gather dispatch is now
  auditable (closing the exact gap this item was filed to close: "a
  Bash-launched gather emits zero `dispatch.jsonl` rows").
- `test/runner/dispatch.test.mjs` — the same file both children touched;
  `tsk-2c1`'s evidence covers the `carries`/purpose-binding tests it
  added, `tsk-28o`'s own `docs/history/tsk-28o/iron-law-evidence.md`
  covers the pinned `capacities.gather` committed-config assertion it
  added (with its own failing-before/passing-after transcript against the
  real main commit `7c86305`).

## Test command (this item's own scoped verify)

```bash
node --test --test-skip-pattern="declares the submit-assist-classify capacity" test/runner/dispatch.test.mjs test/skills/fgos-mirror.test.mjs
```

Run against this branch (`fgw/tsk-2ie5`, both children already merged):
182/182 pass. The skip pattern excludes the same pre-existing,
live-shared-state test both children's own evidence already documents
(`submit-assist-classify` renamed to `coding-classify-intake` by an
unrelated concurrent session mid-implementation).

No new failing-before/passing-after transcript is produced here — doing so
would re-derive evidence the two cited documents already established for
the real underlying changes; this item's own diff is their union, not a
third independent change.
