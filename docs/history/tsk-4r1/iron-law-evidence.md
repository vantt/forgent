# Iron Law evidence — tsk-4r1

`classifyIronLaw` result against the real committed diff (`e980eb2b`):
`{"required":true,"matchedFlags":["audit"],"matchedModules":[]}` — the
item's own description cites the audit report filename.

Verify command (narrowed from a full `npm test` after discovering a
pre-existing, unrelated failure in the broader suite — see "A note on
scope" below): `node --test test/setup/checks.test.mjs test/setup/
registrations.test.mjs && cargo test --manifest-path herdr-plugin/
Cargo.toml`.

## Failing-before

With `src/setup/registrations.mjs` reverted to its pre-fix state (`git show
HEAD~1:...`) and every other file (tests, spec, `gateway.rs`) left at the
real committed state:

```
$ node --test test/setup/checks.test.mjs test/setup/registrations.test.mjs

✖ DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus ... worker-slots-ceiling-usable, and gateway-token-configured
✖ Data Dictionary #7 names exactly the registered doctor checks — no missing entry, no stale one
✖ Data Dictionary #7b names exactly the registered doctor fixes — no missing entry, no stale one
✖ gateway-token-configured check fails when HOME has no gateway.token, and fix provisions a real one the check then accepts
  AssertionError [ERR_ASSERTION]: gateway-token-configured must be registered
✖ gateway-token-configured fix is idempotent — an existing token is never rotated out from under a client that already has it
  AssertionError [ERR_ASSERTION]: gateway-token-configured fix must be registered
✖ the gateway config-default is registered under the "gateway" key with port and an unarmed null token
  AssertionError [ERR_ASSERTION]: the gateway config-default is missing from CONFIG_DEFAULT_REGISTRATIONS

ℹ tests 113
ℹ pass 107
ℹ fail 6
```

6 real failures, exactly matching Finding 9's own claim: the gateway
config/check/fix genuinely did not exist in the registry, and the spec's
own exhaustive-list tests (Data Dictionary #7/#7b) caught the gap
structurally, not just via my own new tests.

## Passing-after

With `src/setup/registrations.mjs` restored to the real committed state
(`e980eb2b`):

```
$ node --test test/setup/checks.test.mjs test/setup/registrations.test.mjs

ℹ tests 113
ℹ pass 113
ℹ fail 0
```

```
$ cargo test --manifest-path herdr-plugin/Cargo.toml

test result: ok. 120 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s
test result: ok. 41 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
```

## A note on scope: a pre-existing, unrelated failure in the full suite

Running the FULL `npm test` (3249 tests) surfaces exactly one failure
unrelated to this item: `test/runner/dispatch.test.mjs:651` ("the committed
`.fgos/config.json` runner section declares the gather capacity"),
asserting `capacities.gather` exists. Confirmed pre-existing via `git stash`
(my changes stashed away, base commit `b1e8e1112` = `chore(tsk-5tm-2): remove
gather capacity from config (D6)`) — the same failure reproduces on the
unmodified base commit, before this item touched anything. Out of this
item's scope (a different concurrent commit's own regression); this item's
verify was narrowed to the two test files it actually needs, per
`fgos-coding-implement`'s "the fix would require redesigning scope... stop"
boundary — fixing `tsk-5tm-2`'s own gap is not this item's job.
