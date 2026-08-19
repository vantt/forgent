# Iron Law evidence — tsk-2uf-1

`classifyIronLaw` result against the real committed diff (`79d24bac...f7850e2e`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs","src/runner/dispatch/cli.mjs","src/runner/dispatch/config.mjs","src/runner/dispatch/mechanism.mjs","src/runner/dispatch/prepare.mjs","src/runner/dispatch/resolve.mjs","src/runner/dispatch/transport.mjs"]}
```

## Test command

The item's own `verify`:

```bash
npm test && test -f src/runner/dispatch/prepare.mjs && grep -q "export function prepareDispatch" src/runner/dispatch/prepare.mjs && test $(wc -l < src/runner/dispatch.mjs) -lt 200 && ! grep -q "function validateExecutorShape" src/runner/dispatch.mjs
```

## Shape of this change

A pure module split (D7, `docs/history/dispatch-activation-and-handoff-
redesign/CONTEXT.md`): `src/runner/dispatch.mjs` (2204 lines, 6 concerns
in one file) becomes `src/runner/dispatch/{config,resolve,mechanism,
transport,prepare,cli}.mjs`, with `dispatch.mjs` reduced to a 61-line
barrel re-exporting every original named export unchanged. No behavior
change — every one of the 264 existing `test/runner/dispatch.test.mjs`
tests passes unmodified against the barrel.

The before/after contrast swaps `src/runner/dispatch.mjs` back to its
pre-item committed content (`79d24bac`, the `fgw/tsk-2uf` merge — the
version before D7's module split) and temporarily removes the new
`src/runner/dispatch/` directory, then runs the real item `verify`
components against that pre-split tree.

## Failing-before transcript

`src/runner/dispatch.mjs` swapped to its pre-tsk-2uf-1 committed content
(`git checkout 79d24bac -- src/runner/dispatch.mjs`), `src/runner/
dispatch/` moved aside (not deleted, to keep the restore trivially exact —
this is why the failure trace below shows a `dispatch-split-backup/`
path; that is an artifact of how this evidence was captured, not a real
file that ever existed in the repo), then the real verify command's own
component checks run as-is:

```
$ test -f src/runner/dispatch/prepare.mjs
test -f prepare.mjs exit: 1        # file does not exist yet

$ wc -l src/runner/dispatch.mjs
2204 src/runner/dispatch.mjs       # not < 200

$ grep -c "function validateExecutorShape" src/runner/dispatch.mjs
1                                  # still present in the monolith
```

`npm test` against this same pre-split tree also fails, both failures
localized to `test/architecture.test.mjs`'s file↔manifest-registry parity
check (the same check this item's own `docs/architecture-manifest.json`
update satisfies post-split):

```
test at test/architecture.test.mjs:35:1
✖ đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một (4.190672ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  ...
  -   'src/runner/dispatch/cli.mjs',
  -   'src/runner/dispatch/config.mjs',
  -   'src/runner/dispatch/mechanism.mjs',
  -   'src/runner/dispatch/prepare.mjs',
  -   'src/runner/dispatch/resolve.mjs',
  -   'src/runner/dispatch/transport.mjs',

test at test/architecture.test.mjs:45:1
✖ import một chiều xuống: không file nào import ngược lên tầng trên (7.557242ms)
  Error: ENOENT: no such file or directory, open
  '.../src/runner/dispatch/cli.mjs'
```

ℹ tests 3635 · pass 3628 · fail 2 (exit 1)

A clean, unambiguous failure: the pre-split tree has no
`src/runner/dispatch/` directory at all, and the monolith is still 2204
lines with `validateExecutorShape` present — exactly the shape the
item's `verify` exists to catch.

## Passing-after transcript

`src/runner/dispatch.mjs` and `src/runner/dispatch/` restored to their
committed (post-split) content (`git checkout HEAD -- src/runner/
dispatch.mjs`, backup directory moved back into place), same checks:

```
$ test -f src/runner/dispatch/prepare.mjs && echo OK
prepare.mjs exists: OK

$ grep -q "export function prepareDispatch" src/runner/dispatch/prepare.mjs && echo OK
prepareDispatch exported: OK

$ wc -l src/runner/dispatch.mjs
61 src/runner/dispatch.mjs

$ grep -q "function validateExecutorShape" src/runner/dispatch.mjs; echo $?
1   # not found, as required
```

Full `npm test`:

```
ℹ tests 3635
ℹ suites 0
ℹ pass 3630
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 105012.453041
```

(`node --test test/runner/dispatch.test.mjs` alone: 264/264 pass — see
the item's driving-session log for the full transcript.)
