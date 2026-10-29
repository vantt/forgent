# Review, round four: COOK's answer to the round-three findings

Reviewer: code-reviewer for lead:HARDEN, 2026-10-29 (Asia/Saigon). Read-only.
Range: `ce1bb5c1e^..c4f8530ea` (4 commits, 16 files). Tree under test: c4f8530ea in a detached worktree (removed afterwards; the main checkout was not changed).
N1 and N2 were actually fixed in 8a8f41051, the parent of the range; I checked the tree at c4f8530ea, so they are covered.

## Verdict: PASS

Every round-three finding that COOK claims done is fixed in the tree, and I found no defect that breaks behaviour. Three Low items remain (below); none blocks landing. Q3 (file and line for catalog errors in doctor) is left by choice, and the CHANGELOG sentence now matches the code.

## Per finding

| Finding | Status | Evidence |
|---|---|---|
| N1 second `checkDeclaredSeats` | Fixed | One definition, `seat-resolver.mjs:255`. Callers: `config.mjs:1601`, `workflow/checked.mjs:33`, `catalog.mjs:56`, `catalog-entries.mjs:339`, `unit.mjs:301`, `seat-resolver.mjs:334`. The validator catches `SeatResolutionError` once and maps `err.at` to a path (`config.mjs:1600-1607`). `config.mjs` shrank from 2299 to 2116 lines. |
| N2 validator text twice | Fixed in `config.mjs` | One `makeFail(label, canonicalPrefix)` (`config.mjs:261`) builds `message` from `detail`; `subpath` is a getter over `deriveSubpath` (`:237`) and no longer stored. See L-A for the text duplication that moved into `seat-resolver.mjs`. |
| N3 `catalogLayersOf` guesses shapes | Fixed | Signature is `(origins, patterns)` only (`shipped-catalog.mjs:37`). `resolveCollaboration` takes `origins` only; `layers` and `options.shippedCheckersByRigor` removed (`catalog.mjs:73-85`, `:494`). See L-B for what is left. |
| N4 phantom single-read proof | Fixed | New test "run uses the loaded origins" (`run.test.mjs`) runs a global-only custom pattern through `runUnit` and asserts `layer: 'global'`. Negative control in the detached worktree: setting `origins: null` in `run.mjs:776` made exactly that test fail (86 of 87 pass, the failure is that test); reverted, `git status` clean. The three always-true assertions in the solo test were replaced by one that checks no origin file path is persisted in `unit.json`. |
| N5 misplaced or duplicate tests | Fixed | Project-only JS-error test removed (cross-file test keeps both paths). Doctor loop-error test moved to `registrations.test.mjs`. Both `resolveLayer` tests moved to `catalog.test.mjs`. |
| N6 duplicate doctor test | Fixed | The `without retired keys` duplicate is gone; the quiet case at `registrations.test.mjs:823` owns it. The replacement test (clean legacy JSON in a directory whose name contains `was retired;`) pins the sniff removal. |
| N7 formatter twice | Fixed | `attributeRunnerConfigError` exported from `config.mjs:244`, used by the loader and by doctor (`registrations.mjs:532`). |
| N8 enumerable `Symbol.for` origins | Not changed (Low, was optional) | The snapshot test now asserts the symbol is not enumerable on the snapshot copy (`run.test.mjs`). No behaviour defect. |
| N9 CHANGELOG too broad | Fixed | The line now says file and line for the runner, "`fgos doctor` gives file and line for loop errors and the source layer for pattern-catalog errors". Probe results below match this exactly. |
| Q3 doctor file and line for catalog errors | Not done by choice | Owner decision; sentence narrowed. Accepted. |
| M3 (a) seat-id error also named project path | Fixed | Probe, global-only bad seat id: `runner config (~/.fgos/config.yaml:12 patterns.custom.defaults.seats[0].seat) "Bad Id!" must be 1-40 characters...`. Duplicate seat names line 16 of the global file; empty `seats` names line 10. No project path in any of them. |
| M3 (b) doctor reports defaults key with layer only | Accepted as documented | Doctor says `(source layer: global)` for the unknown `defaults` key; the CHANGELOG no longer claims more. |
| M3 (c) `additionalProperties:false` on `defaults` | Not done (was optional) | `ALLOWED_DEFAULT_KEYS` is now derived from `paramTableOf` (`config.mjs:1487-1491`), so there is no hand-copied list left. |
| L3 leftovers | Fixed | `RETIRED_GATED_NAME` used in `catalog-entries.mjs:494` and in `runner-config-conversion.mjs`; `SEAT_BINDING_MARKER_PATH` used in `registrations.mjs:561,564,619` and in the conversion; `RESERVED_PATTERN_NAMES` still declared once. `LOOP_TUNING_KEYS` (`config.mjs:1483`) is a single small table used once; acceptable. One literal `'seatBinding.schema'` remains at `config.mjs:1521` (a path fragment inside the validator, not a second marker table). |
| L4 wiring proof | Fixed | See N4. `run.mjs` no longer imports `catalogLayersOf`; doctor passes `origins` only (`registrations.mjs:545-548`). |
| L6 plan-lint | Still fixed | The capability-plan-lint suite passes. |
| `' was retired; '` sniff | Fixed | `registrations.mjs:494-507`: `retiredJsonAdvice(targetPath)` returns structured findings (`runner-config-conversion.mjs:52`); the sniff is gone. A read or parse failure no longer becomes the generic advice: it is caught and reported as `${targetPath}: ${err.message}`, so the row fails and names the file (test "malformed legacy json file fails naming the file and parse failure"). The false positive from a directory named `... was retired; ...` is covered by its own test. |
| F1 retired-keys tables and dead branches | Fixed | Object branch now iterates `RETIRED_CONFIG_KEYS`; array and full-path branches deleted; one `formatRetiredKeySentence` (`retired-keys.mjs:31`) used by config, catalog-entries, registrations and conversion. `MARKER_PATH` alias deleted. |
| F2 `coverageNote` | Fixed | Gone from `runner-config-conversion.mjs` and `bin/fgos.mjs`; the stdout test now asserts the sentence is absent. Empty-patch notice also drops the command and patch body (two new tests, one through the CLI). |
| F3 shape guessing in `catalog.mjs` | Fixed | `shipped?.patterns ?? shipped` and `options.shippedCheckersByRigor` are gone from `catalog.mjs`. |
| F4 string signature | Fixed | `inspectGlobalRunnerConfig` takes only `{projectRoot, globalDir}`; the three test callers were updated. |
| F5 duplicate test and dedupe key | Fixed | Dedupe key is `key@file` (`config.mjs:389-392`); a new test covers parent and descendant in one file and the same key in two files. The duplicate catalog test is gone. |

## Specific checks you asked for

- **No-test-only-switches:** none added. `grep` of the diff shows no env var, flag or test-only branch in `src` or `bin`.
- **Retired tests:** the doctor and `resolveLayer` tests moved (same names) rather than disappeared. Retired outright: the project-only JS-error test (owned by the cross-file test), the second "without retired keys" doctor test (owned by `registrations.test.mjs:823`), and "checkCatalog detects retired tuning when a custom pattern named patterns exists" (see L-C: the commit does not name an owner).
- **Bigger than needed:** no. `src` is net minus 131 lines against 53e8a1e68 (370 added, 501 removed), `config.mjs` minus 183. Tests grew by new proofs only. The `mutation-census.v1.json` change is the regenerated digest for the touched files.
- **Plan IDs or finding codes in code, tests or commit text:** none in the added lines I read.

## New findings

No Critical, High or Medium items. Low:

### L-A. Error text is still written twice, now in `seat-resolver.mjs`
`checkDeclaredSeats` (`seat-resolver.mjs:255-325`) builds each `SeatResolutionError` with a full `message` and a second near-identical `detail` string, nine times. The `assertSeatId` branch even calls `assertSeatId` a second time with an empty label to strip the prefix (`:285-296`). Scenario: someone edits the tier-list wording in `message` and not in `detail`; the unit path (`unit.mjs:301`) shows the old wording while config load shows the new one. Smaller fix: derive `message` as `${label}${at}${detail}` in the `SeatResolutionError` constructor, or have callers pass only `detail` plus `at`. This is the same defect as the round-three N2, moved, so it is worth one follow-up item, but it breaks nothing.

### L-B. `catalogLayersOf` is now dead in production, and `layers` map input survives in two places
`catalogLayersOf` has no caller in `src` or `bin` (only the header comment at `shipped-catalog.mjs:3`); its five remaining references are tests. `checkCatalog` still accepts a `layers` map (`layerSource = origins ?? layers`) and `resolveLayer` still accepts a map or a bare string; only tests use those shapes (the catalog tests at `catalog.test.mjs:282-290` pass `layers`). RUL104 says to delete an unused mechanism in the same change. Scenario: a future caller passes a map that silently differs from the origins that the loader read; nothing detects the disagreement. Suggest deleting `catalogLayersOf` or giving it a production caller, and moving the tests that use `layers` to `origins`.

### L-C. A test was retired without naming its owner
"checkCatalog detects retired tuning when a custom pattern named patterns exists" is deleted (`catalog.test.mjs`, around old line 292); the commit message does not say which test now owns the behaviour. The behaviour it guarded (a pattern literally named `patterns` was misread as the map) belonged to the array and path input shapes, which are gone, so the removal is defensible, but design principle 8 asks the change to say so. Add one sentence to the next commit or board line.

## Tests run

Detached worktree at c4f8530ea, through `runChosenTests` (not `npm test`, not `cargo test`):

- Seven files: `dispatch-config-patterns`, `execution/run`, `execution/patterns/catalog`, `setup/registrations`, `setup/runner-config-conversion`, `report/capability-plan-lint`, `execution/seat-resolver`. Result: **315 tests, 315 pass, 0 fail**, no ERROR lines (one expected `fgos: error: config-schema` line is printed by a test that feeds a retired key on purpose, and the test passes).
- Negative control: `run.test.mjs` with `origins: null` in `run.mjs`: 87 tests, 86 pass, 1 fail ("run uses the loaded origins"). Reverted with `git checkout`; the worktree was clean before removal.
- Probes (temporary test file, deleted): global-only bad seat id, duplicate seat, empty seats and unknown `defaults` key. The loader names `~/.fgos/config.yaml:<line>` for all four and no project path; doctor reports the problem with `(source layer: global)`, as the CHANGELOG says. `catalogLayersOf('/x')` still returns an all-`shipped` map with no error (a path string is silently accepted; only the dead-code finding L-B applies).

## Unresolved questions

- None blocking. Should L-B be handled as part of this lane or logged as a separate item? It is cleanup, not a defect.

Status: DONE
Summary: Verdict PASS. All round-three findings and F1 to F5 are fixed with evidence, the L4 wiring test fails when the wiring is removed, and 315 of 315 focused tests pass; only three Low cleanup items remain (message and detail duplicated in the seat resolver, dead `catalogLayersOf` and `layers` shapes, one retired test with no named owner).
Concerns/Blockers: None. The detached worktree was removed and the report is the only file written.

## Follow-up from COOK (2026-10-29)

- Low 3 is closed. The retired-tuning behaviour is owned by two tests in `test/runner/execution/patterns/catalog.test.mjs`: "checkCatalog reports config-key-retired for reviewed tuning with source layer attribution" and "checkCatalog reports config-key-retired for reviewed mixing catalog fields with retired tuning". A custom pattern named `patterns` is no longer a special case, because one table-driven matcher replaced the shape sniffing, so that behaviour was removed.
- Lows 1 and 2 stay on COOK's open list for the owner to choose; they are a small separate cleanup in `seat-resolver.mjs` and `shipped-catalog.mjs`.
