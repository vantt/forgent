# HARDEN T5 phase 02 — layering moves, lower-layer guard, undefined-name gate

Branch `harden/t5-p02-layering`, base `e0d208e38`. One commit (message first line: "refactor(layering): shared leaf modules move below Dispatch ...").

## Moves (git mv, imports re-pointed in the same commit, no re-export)

| Old (src/runner/dispatch/) | New | Importing files (production + test, from the rewrite) |
|---|---|---|
| process-identity.mjs | src/native/process-identity.mjs | ~35 incl. scripts/run-rust-dev-host.mjs |
| proof-helpers.mjs | src/native/proof-helpers.mjs | ~35 |
| dispatch-error.mjs | src/run-supervisor/dispatch-error.mjs | 7 |
| cwd-lock.mjs | src/run-supervisor/cwd-lock.mjs | 8 |
| run-lock.mjs | src/run-supervisor/run-lock.mjs | ~15 |
| worker-artifacts.mjs | src/run-supervisor/worker-artifacts.mjs | 7 |
| stray-writes.mjs | src/run-supervisor/stray-writes.mjs | 5 |
| trust-store.mjs | src/run-supervisor/trust-store.mjs | ~10 |

111 files rewritten by one resolver script (relative specifiers resolved against the old location, plus literal repo paths in docs, manifest, census, contracts, a Rust doc comment). Manifest rows renamed in place (class unchanged); census regenerated (`--write-census`, 0 undeclared). `rg runner/dispatch/<moved>` over src, bin, scripts, test, docs, packages: nothing. Plans and archive keep old paths as records. Moved-file header comments lost their `dispatch/` prefix.

## Upward imports resolved
- `direct-launch.mjs` `awaitSettledResult` takes `readSettledResult` as a parameter; `assignment-runner.mjs` and `direct-cutover.test.mjs` pass it.
- `gate-kill-grace.mjs` throws `DispatchError('validation', msg, { code })`, codes `invalid-gate-kill-grace` and `invalid-cancel-wait` unchanged. The cancel wait site (same import) also moved. Tests in `run-supervisor-checks.test.mjs` assert the code, no longer the class name and category (the class changed; the code is the contract).
- Deviation to note: `bin/fgos.mjs` maps `DispatchError` to exit code 1, while `RunnerConfigError` mapped to the validation exit code, so a bad `dispatch.gateKillGraceMs` / `cancelWaitMs` now exits 1. The message is unchanged.

## Guard and gate
- `test/architecture.test.mjs`: one test, no file under src/native, src/state, src/holder-lock, src/run-supervisor (except `steps/`) imports `src/runner/dispatch/**`. Specifier extraction factored into one helper shared with the layer test (DRY). Proven red by appending an upward import to `src/state/hot-lock.mjs` (reported `src/state/hot-lock.mjs → src/runner/dispatch/transport.mjs`), reverted, green.
- `scripts/check-undefined-names.mjs` (run as `node --expose-internals scripts/check-undefined-names.mjs [--root dir]`): acorn from Node's internals, own scope analysis (imports, var/let/const, functions, classes, params, catch, destructuring, labels, typeof guard), globals taken from the running Node's `globalThis`. Exit 1 with `file:line name`, exit 2 `no-undef-parser-unavailable: node vX ...` when the parser cannot load.
- `test/scripts/check-undefined-names.test.mjs`: the tree is clean; a fixture with every declaration form reports only the two planted names; running without `--expose-internals` fails by name.

## No-undef findings on today's tree (2, no false positives left)
1. `src/intake/plan.mjs:958` `DEFAULTS.size` — `DEFAULTS` never imported (from `src/state/work.mjs`); a decompose child of a parent with no size threw ReferenceError. Fixed by the import. Latent because `addWork` defaults size itself.
2. `src/runner/dispatch/cli.mjs:467` `positional` — `typeof positional !== 'undefined' ? positional[1]` fallback in `reconcile` referenced an undefined name, dead branch. Removed the fallback.

## Net size vs budget (diff against e0d208e38)
- src + bin: +85 / -84 (moves and one-line import changes net 0; the rest is the guard fixes).
- scripts: +187 (budget about +80: over; a full scope analyzer needs destructuring, switch/for/catch/class scopes, hoisting; I kept it single-file, no dependencies).
- test: +142 / -74 (new test 48 lines, guard +14 net after the shared helper; remainder is import re-pointing, census, manifest are not in these counts).

## Verification
- Focused: architecture, doc-health, citation drift, every test importing a moved module, new test: all green.
- Full suite (`node scripts/run-tests.mjs`, 523 s wall): tests 8743, pass 8710, fail 1 (the known frozen V7n addendum test), no `run-tests: ERROR` lines, one run before the last test-only amend. The first full run also failed `public inspect use-case import graph` (a suffix check on `/dispatch/run-lock.mjs`, fixed); the final amend only renamed a helper and added a boundary comment in the new test, re-run with test-proof-inventory green (34 pass).
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared.
- Suite note: "9 duplicated test titles" warning is pre-existing.

## Not done / for the lead
- No guide or owner-machine direct-seat smoke (landing is the lead's).
- Docs: only dead-path replacements by literal; no spec prose changed.
