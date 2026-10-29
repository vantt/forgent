# Review, round three: COOK's config fixes for M3, L3, L4 and L6

Reviewer: code-reviewer for lead:HARDEN, 2026-10-29 (Asia/Saigon). Read-only.
Commits: d39df4cff, ba92af07d, aba04381f, 3c37682ca, plus the two merges 2dfd6ccf9 and 53e8a1e68. The landed tree is 53e8a1e68 (origin/main 13d15f306).
Findings checked: M3, L3, L4 and L6 from `review-261028-2257-harden-review-pattern-catalog-config.md`; F1 to F5 from `review-261029-1022-harden-recheck-config-fixes-round-two.md`.

## Verdict: CHANGES

L6 is fixed. L4 is fixed in the run path and in doctor: the second door read is gone. M3 is fixed for the loader, which now names the global file and line for every JS-only rule I probed. Doctor names file and line only for loop errors. Some seat-id errors still name the project path as well as the global one. L3 is partial: two hand-written tables are still there.

These commits also add problems that break the review standard:

- **N1.** A second copy of `checkDeclaredSeats` in `config.mjs`.
- **N2.** Every throw in the two validators now carries its text twice, which adds about 376 lines (RUL104: better, not bigger).
- **N3.** `catalogLayersOf` guesses which of five input shapes it got.
- **N4.** The test that claims to prove the single read is phantom.

Nothing here breaks production today, so the verdict is CHANGES, not a revert.

**About 3c37682ca.** Merge 2dfd6ccf9 dropped this commit's doctor and conversion half, and kept HARDEN's c729fd07c instead. In the landed tree, `retiredJsonAdvice` does not exist, and the `' was retired; '` string sniff is still at `src/setup/registrations.mjs:498-499`. The plan-lint half of 3c37682ca (L6) did land.

## Evidence base

- **Local main is behind.** The main checkout is at 2b1430144, and neither 3c37682ca nor 53e8a1e68 is in it. I extracted 53e8a1e68 with `git archive` into `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r3/tree`. The repository was not changed, and `git status` is the same as at the start.
- **Why I could not use `runChosenTests`.** Run against the extracted tree, every door call refuses: `git-addon-unavailable: addon not shipped on this channel`. The door accepts only the staged payload root, and `runChosenTests` always restages for the main checkout. The Rust code is byte-identical between 2b1430144 and 53e8a1e68; only `mutation-census.v1.json` differs. So I copied the main checkout's staged `fgos` and `fgos.node` and their `manifest.json` into the scratch tree. Then I ran `node --test` directly, with the same filtered environment `buildTestEnv` builds: `FGOS_HOST_BIN`, `FGOS_ACTIVE_MANIFEST_PATH`, `FGOS_ACTIVE_RELEASE_PATH` and `FGOS_CLAUDE_COMMAND`. The copied binaries were deleted afterwards.
- **Side effect.** My one first attempt through `runChosenTests` restaged `.fgos/runtime/git-addon/e9756c489113b5d0/` in the main checkout at 12:35. That directory is a runtime artifact, not a tracked file.
- **Focused tests on the landed tree.** I ran the five touched files: `dispatch-config-patterns`, `execution/run`, `patterns/catalog`, `report/capability-plan-lint` and `setup/registrations`. Result: **267 tests, 267 pass, 0 fail**, and no ERROR lines. Log: `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r3/focused.log`.
- **`test/architecture.test.mjs`.** 37 of 39 pass. The 2 that fail ("config has one Rust door", "one shell door") list tracked files, and the scratch extract is not a git checkout. That is an artifact of my setup, not a defect.
- **Probes:**
  - `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r3/probe-r3.test.mjs` (output in `probe.log`)
  - `/tmp/claude-1000/-home-vantt-projects-forgent/8e8e56bb-00a0-4158-ad04-ec29cabf8204/scratchpad/r3/probe-r3b.test.mjs`
- **Negative controls** (`neg.log`, `neg2.log`). I patched the scratch tree and restored it afterwards; a diff against `git show 53e8a1e68:` confirms the restore.

## Per finding

| Finding | Status | Evidence |
|---|---|---|
| **M3.** A JS-only error in the global file names the project's `.fgos` | **FIXED for the loader, PARTIAL overall** | **What is done:**<br>• The one door read now asks for the origins of `runner.patterns` and `runner.loops` (`src/runner/dispatch/config.mjs:332`).<br>• The validators throw with `path`/`paths`, and the loader maps them through `resolveOriginLocations` (`:347-361`).<br>• Probes with only the global file bad all name `~/.fgos/config.yaml:<line>`: inverted bounds, non-cumulative `checkersByRigor` (all three lines), an unknown `defaults` key, empty `roleTasks` text, a bound on a parameter the loop does not read, and a duplicate seat.<br>• Doctor does the same for loop errors (`registrations.mjs:530-541`).<br>• The old message was `<repo>/.fgos runner …`, as shown in round one.<br>**What is still open:**<br>• **(a)** A seat-id error still names the project path as well. Probe `g-seat-badid`: `runner config (~/.fgos/config.yaml:12 patterns.custom.defaults.seats[0].seat) /tmp/r3b-repo-…/.fgos runner patterns.custom.defaults.seats[0].seat "Bad Id!" must be…`. The cause is that `detail: error.message` re-embeds the `label` that the loader built from the project dir (`config.mjs` seat block, the `assertSeatId` catch).<br>• **(b)** In doctor, a bad pattern `defaults` key reports only `(source layer: global)`, with no file or line (probe `doctor-g-defaults-unknown`). The CHANGELOG line says file and line are given "in the runner and in `fgos doctor`" for "an unknown key under a pattern's `defaults`". That claim is too broad.<br>• **(c)** The optional `additionalProperties: false` on `defaults` was not done, and `ALLOWED_DEFAULT_KEYS` is still hand-written (`config.mjs:1537`). |
| **L3.** Reserved names and parameter lists copied by hand | **PARTIAL** | **What is done:**<br>• `RESERVED_PATTERN_NAMES` is declared once (`retired-keys.mjs:5`). It is used in `config.mjs`, `catalog-entries.mjs`, `shipped-catalog.mjs`, `capability-plan-lint.mjs:66` and `registrations.mjs:621,672`. A grep finds no other declaration.<br>• The rigor order is now `RIGOR_VALUES`.<br>• The bounded parameters are derived from `paramTableOf` (`boundedParamsForLoop`, `config.mjs:1745`).<br>**What is not done:**<br>• The per-loop keys moved into a new hand-written table, `LOOP_TUNING_KEYS` (`config.mjs:1741`). It is exported, but no other module uses it.<br>• `ALLOWED_DEFAULT_KEYS` (`:1537`) still copies the union of the loops' `PARAMS` keys.<br>• `registrations.mjs:564,622` still have the literal `'runner.patterns.seatBinding.schema'`.<br>• `catalog-entries.mjs:492` still has the literal `'research-fan-out-gated'`, even though `RETIRED_GATED_NAME` exists. |
| **L4.** `catalogLayersOf` made a second door read | **FIXED (wiring unproven)** | **What is done:**<br>• `catalogLayersOf` no longer reads; it works from origins (`shipped-catalog.mjs:38`).<br>• `run.mjs:776-777` takes origins from the memoised `liveConfig()`, which is one read.<br>• Doctor reuses its single `readConfig` (`registrations.mjs:546`).<br>• The mixed key-space map is deleted.<br>• `resolveLayer` now ranks project > global > shipped instead of taking the first match (`catalog-entries.mjs:81`).<br>• Probe: a global-only pattern pins `layer: global`; without origins it would fall back to `project`.<br>**Negative control:** with `origins` and `layers` set to `null` in `run.mjs`, all 131 tests of `run`, `run-case-admission` and `dispatch-config-patterns` still pass. So the run-path wiring has no proof (see N4). |
| **L6.** `capability-plan-lint` skips the check when the catalog is unreadable | **FIXED** | The `try/catch` and the `knownPatterns.size > 0` guard are gone (`capability-plan-lint.mjs:59,504`). Negative control: restoring both makes the new test fail ("lintPhaseUnits throws when the shipped catalog cannot be read…"). |

**L5 (not asked, for the record).** COOK's L5 change, which made a bare legacy JSON file pass this row, was replaced by HARDEN's c729fd07c in merge 2dfd6ccf9. That version has the same outcome: `passed: true`, "not evaluated: …".

## The `' was retired; '` string sniff

- **Did 3c37682ca change it?** It did: it split out a `retiredJsonAdvice(...) → string|null` and dropped the sniff. **But merge 2dfd6ccf9 resolved both files to main's side.** The landed `registrations.mjs:498-499` still calls `formatLegacyJsonAdvice(display(f.file))` and keeps the advice only if `advice.includes(' was retired; ')`.
- **Does the check still hold?** Yes, today. Probe: a file with `reviewed.maxRounds` gives `true`, and a clean file gives `false`.
- **Why it is still fragile:**
  - **False positive.** A clean legacy file under a directory whose name contains ` was retired; ` gives `true` (probe). The row then fails with the generic advice. This is contrived.
  - **False negative.** `formatLegacyJsonAdvice` swallows every read and parse error (`runner-config-conversion.mjs:53-58`, `catch { doc = null }`). `parseYaml` goes through the native addon. So when the addon is missing, or the JSON has a syntax error, a file that does hold retired keys gets the generic text. The sniff then drops it, and the row reports `passed: true`. Only the door row still fails, and it does not name the retired keys.
- **Fix:**
  - Have the leaf return the structured findings, either `detectRetiredPatternKeys(patterns)` itself or a `retiredJsonAdvice → null` as 3c37682ca had it, and drop the sniff.
  - Let a parse failure surface instead of silently becoming the generic text.

## Round-two Lows F1 to F5

None of them was addressed:

| | Status | Evidence in the landed tree |
|---|---|---|
| F1 | Not addressed | The object branch of `detectRetiredPatternKeys` still lists the keys by hand (`retired-keys.mjs:89-108`). The array branch (`:56-71`) and the full-path branch (`:110-115`) are still dead. `RETIRED_GATED_NAME` is still used only inside the module. |
| F2 | Not addressed | `coverageNote` is still printed (`runner-config-conversion.mjs:404`, `bin/fgos.mjs:4756`). |
| F3 | Not addressed | `shipped?.patterns ?? shipped` is still there (`catalog.mjs:82`). `options.shippedCheckersByRigor` is still there (`:497`). |
| F4 | Not addressed | The string signature of `inspectGlobalRunnerConfig` is still there (`runner-config-conversion.mjs:260`). Tests `:233,390,608` still use it. |
| F5 | Not addressed | The duplicate test is still at `catalog.test.mjs:292`. Dedupe is still on the whole message (`config.mjs` `checkDoorRefusalsForRetiredKeys`). |

## New findings

### N1 (Medium). `validateRunnerPatternsShape` now holds a second copy of `checkDeclaredSeats`, and then calls the original anyway

- **Where:** ba92af07d added `config.mjs:1579-1652`, about 75 lines. They repeat `seat-resolver.mjs:249-269` line by line: non-empty, object, allowed keys, reserved ids, `assertSeatId`, duplicates, role, persona, tier. `checkDeclaredSeats` is still called right after (`:1655`).
- **Why it breaks the rules:** this violates design principle 1 (one door) and L10.
- **The copies already disagree:**
  - Probe: tier `""` is **accepted** by `checkDeclaredSeats` (with no tier list given) but **refused** by the copy.
  - The copy drops the resolver's codes. A duplicate seat is `duplicate-seat` in the resolver and `undefined` in the copy.
- **Through the door, most of the copy is dead:**
  - Probes: an unknown seat key, a bad role and an empty tier are refused by the config schema before the copy runs (`config-schema … (additionalProperties)` / `(enum)`).
  - Only the empty-array, reserved, id-format and duplicate checks are reachable, and those are exactly what `checkDeclaredSeats` already does.
- **The trailing `checkDeclaredSeats` call is unreachable for any input the copy refuses.**
- **Failure scenario:** someone adds a seat rule, for example a tier must be on the ladder, in `seat-resolver.mjs`. Config load then reports that error with the old `<repo>/.fgos runner` label, while every other seat error names file and line. Or someone changes a rule in one copy only, and config load and unit run disagree on whether the same seat list is valid.
- **Fix:**
  - Delete the copy.
  - Have `checkDeclaredSeats` throw its `SeatResolutionError` with the index and the field (for example `err.at = '[1].role'`).
  - In `config.mjs`, catch it once and map it to `path: ${prefix}.${name}.defaults.seats${err.at}`. That is about 6 lines instead of 75.

### N2 (Medium, RUL104). Each validator throw now carries its text twice: about 376 lines added for one mapping

- **How much grew:** `config.mjs` went from 1923 to 2299 lines.
- **What each throw now does:** each of about 45 throws builds the message, then a `detail` with the same text, a `path`, and a `subpath`. `subpath` is just `path` without the `runner.` prefix.
- **Failure scenario:** someone edits a message in one string and not the other. The loader prints `detail` when it can attribute an origin, and `message` when it cannot, so the two outputs drift apart.
- **Fix:**
  - Use one local helper, `fail(relPath, detail)`, that builds `runner config (${label}.${relPath}) ${detail}` and sets `path = ${prefix}.${relPath}`.
  - Derive `subpath` instead of storing it.
  - This takes each throw back to one line and removes the duplicated text.

### N3 (Low to Medium). `catalogLayersOf` guesses which of five input shapes it got

- **Where:** `shipped-catalog.mjs:38-44` accepts:
  - an origins array;
  - `{origins}`;
  - a loaded config, read through its symbol;
  - and, for the patterns, `.patterns`, `.value.runner.patterns` or `.runner.patterns`. It also falls back to the first argument when the `patterns` argument is an empty object.
- **Who uses which shape:** both production callers pass `(originsArray, patterns)`. Only the test `run.test.mjs` "snapshotRunnerConfig … pin provenance derives from the same read" uses the overload `catalogLayersOf(loaded)`.
- **Why it matters:** this is the same "guess the shape" pattern that round one (N6) and round two (F3) asked to remove.
- **Failure scenario:** an old caller passes a path string, as the pre-L4 signature took. It gets back a valid-looking map with every name set to `shipped` (probe: `catalogLayersOf('/some/dir')` gives no error). A pin then records the wrong layer, with no error at all.
- **Fix:** accept `(origins, patterns)` only, and retire the overload assertion.

**Related.** `resolveCollaboration` now takes both `origins` and `layers`. `run.mjs` passes both, and `layers` is computed from those same `origins` (`catalog.mjs:83-88,540-542`; `checkCatalog` `layerSource = origins ?? layers`). That is two representations of one fact. Pass `origins` only.

### N4 (Low to Medium, design principle 8). The proofs of the single read are phantom

- **The run-path assertion cannot fail.** In "runUnit runs solo read-only unit end-to-end", `record.collaboration.pattern.layer === 'shipped'` (`run.test.mjs`) also holds with no origins at all. The fallback `deepEqual(entry, shippedEntry) → 'shipped'` gives the same answer. Negative control: with `origins` and `layers` removed from `run.mjs`, 131 of 131 tests still pass.
- **Two more assertions in the same test always pass:**
  - `JSON.stringify(record).includes('RUNNER_CONFIG_ORIGINS') === false`. That string is a JS identifier and never data, and symbols never serialise.
  - `record.configSnapshot.runner.origins === undefined`. No key is ever named `origins`.
- **The snapshot test does not belong where it is.** The renamed test "snapshotRunnerConfig … and pin provenance derives from the same read" asserts `catalogLayersOf` behaviour inside the `snapshotRunnerConfig` proof. That duplicates "catalogLayersOf: answers per-pattern layer…" in `dispatch-config-patterns.test.mjs`.
- **Fix:** add one wiring proof. Run a unit with a global-only custom pattern through `runUnit` and assert `layer: 'global'`; that assertion fails without the wiring. Drop the three always-true assertions and the `catalogLayersOf` lines from the snapshot test.

### N5 (Low). The growth of `dispatch-config-patterns.test.mjs` is partly duplicate or misplaced

Of the about 230 lines:

- **"JS-only validation error in project file…" duplicates the cross-file test.** "relational validation error participating across files reports each source" already asserts both the project path and the global path. Keep the global-only test (it is the M3 scenario) and the cross-file test; retire the project-only one.
- **The doctor test is in the wrong file.** "doctor runner-patterns-config attributes loop shape validation error…" is the doctor row's wiring proof, but it lives here instead of in `test/setup/registrations.test.mjs`, which owns that row (design principle 8: a test lands in the file that owns the module).
- **Two `resolveLayer` tests are in the wrong file.** `resolveLayer` lives in `catalog-entries.mjs`, whose owning file is `test/runner/execution/patterns/catalog.test.mjs`. That file received its own bracket-path test in ba92af07d.
- **The seat-path test pins the copy.** "validateRunnerPatternsShape retains indexed seat paths…" pins the N1 copy and has to move when N1 is fixed.
- **The metadata test is fine.** "loader internal metadata … survives shallow copy" is a real behaviour, and it is the only proof that the symbol survives `withDefaultExecutor`.

### N6 (Low). The merge left two doctor tests for the same case

`test/setup/registrations.test.mjs:823` (from c729fd07c) already covers "legacy JSON without retired keys gives `passed: true`" in its `quiet` block. The test at `:844` (from 3c37682ca) asserts the same thing again. Retire `:844`.

### N7 (Low). The same error formatter is written twice

`config.mjs:349-360` and `registrations.mjs:532-540` both build `runner config (${locations.join(', ')}${subpath}) ${detail}` from a `RunnerConfigError`. Export one `attributeRunnerConfigError(err, origins, projectDir)` from `config.mjs` and call it in both places.

### N8 (Low). Origins travel as an enumerable `Symbol.for` property

- **Where:** `config.mjs:108,365-370`.
- **What it does:** because the property is enumerable, a spread (`{...cfg}`) carries the origins along, and the test relies on that. `Symbol.for` puts the key in the process-wide registry, so any module can read or forge it. A deliberately non-enumerable property, or returning `{ cfg, origins }`, would make the flow explicit.
- **Why it is only Low:** this is a hidden channel rather than a contract. Nothing breaks today; JSON and `structuredClone` drop it.

### N9 (Low). The CHANGELOG line claims too much for doctor

The line says file and line are given for an unknown `defaults` key "in the runner and in `fgos doctor`". Doctor gives only the layer for pattern errors (see M3 b). Either narrow the sentence, or route doctor's pattern check through the same attribution.

**Checked and clean:**

- **No plan IDs or finding codes.** No added line in `src`, `test` or `bin` of the four commits contains a plan ID, finding code, `tsk-`, `D-ADR` or phase label.
- **No layering breaks.** The layering tests pass, and the new imports (`config.mjs` → `loops/index.mjs`, `shipped-catalog.mjs` → `config.mjs`) create no cycle.

## Recommended order

1. **N1.** Delete the seat copy and map the resolver's error to a path. This also fixes M3 (a).
2. **N2.** Use one throw helper and remove the duplicated text.
3. **N4.** Add one real run-path wiring proof, and drop the phantom assertions.
4. **N3.** Give `catalogLayersOf` one signature and pass only `origins` to `resolveCollaboration`.
5. **The string sniff.** Restore the structured-return version from 3c37682ca that the merge lost, and stop swallowing parse errors.
6. **The rest.** L3 leftovers, N5 to N9, and round two's F1 to F5.

## Unresolved questions

- **Q1.** Was it intended that merge 2dfd6ccf9 dropped 3c37682ca's `retiredJsonAdvice` in favour of c729fd07c? The commit message of 3c37682ca and the "lands" board line both say COOK's version landed. One of the two lanes needs to own the structured return.
- **Q2.** The main checkout here is at 2b1430144, behind origin/main. Should the lead pull before the next focused run, so that `runChosenTests` itself can test the landed code? I could not run it without checking out a branch.
- **Q3.** Should doctor's pattern-catalog problems give file and line as well as the layer? That would make the CHANGELOG sentence true. It needs `checkCatalog` to take origins with lines, which is a small widening of its API, so it is the owner's choice.

Status: DONE_WITH_CONCERNS
Summary: Verdict CHANGES. L6 is fixed, L4 is fixed with no proof of its run-path wiring, M3 is fixed for the loader but partial for doctor and seat ids, and L3 is partial. New defects: a second copy of `checkDeclaredSeats`, about 376 lines of duplicated error text, a `catalogLayersOf` that guesses its input shape, and phantom single-read assertions. The `' was retired; '` sniff is still on main because the merge dropped 3c37682ca's fix. F1–F5 are untouched. The focused tests on the landed tree pass 267 of 267.
Concerns/Blockers: The local main checkout is behind origin/main, so I ran the focused tests with `node --test` on a `git archive` extract that used a scratch copy of the staged addon, not through `runChosenTests`. One `runChosenTests` attempt restaged the main checkout's untracked `.fgos/runtime/git-addon/` directory.
