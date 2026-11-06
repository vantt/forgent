# HARDEN doctor readiness-only, dead and duplicate rows deleted

Branch `harden/doctor-p02` (from origin/main `61409ec73`), worktree `/home/vantt/projects/forgent-worktrees/harden-doctor-p02`. Twelve doctor rows removed, each after showing the condition it judges is owned elsewhere; the two Event Store rows folded into the two Git rows first.

## Condition table (row, what it could fail on, owner after deletion)

| Row | Conditions | Owner after |
|---|---|---|
| `dependencies-installed` | a declared runtime dependency missing from `node_modules` | none needed: `package.json` has `dependencies: {}` (fgOS ships no runtime dependency); the row judged the user's own package |
| `plugin-skill-cli-reachable` | no tier of `resolveFgosBin` resolves | `resolveFgosBin` tiers 0-3: `test/setup/bin-discovery.test.mjs` (tiers 0, 1, 2, cache, none). The live PATH tier only had the row's test, so it moved to a new case there; PATH on the project side is `project-fgos-launcher` |
| `plugin-dev-skills-packaged` | a `.claude/skills/fgos-*` skill with no `plugins/fgOS/skills` copy | `test/skills/fgos-mirror.test.mjs`: every `.claude` wrapper matches its `.agents` source, and `.agents` and the plugin have the same names, file sets and bytes (checked: the three dirs list the same 14 names today) |
| `command-routes-drift` | `export-command-selectors.mjs --check` reports drift | `test/rust-host/command-routes.test.mjs` "drift detection: clean committed file passes --check silently" (same script, same `--check`) |
| `tier-vocabulary-dead-keys` | 15 retired runner keys (`models`, `DEFAULT_TIER_TO_POLICY`, `QUALITY_TIER_BRIDGE`, `QUALITY_MODE_VALUES`, `minTier`, `minRigor`, `rigorOverrides`, `PLACEMENT_POLICY_SHADOW`, `rigorToTier`, `executors.*.rigorOverrides/models`, `capabilities.*.overrides/rigorOverrides/minTier/minRigor`) | `config-unknown-key`, proven by a real-door fixture, see below |
| `coordination-protocol-dead-vocabulary` | `minTier`, `minRigor`, `QUALITY_*` words in YAML under `.fgos/coordination-protocols`, `core/coordination-protocols`, `core/workflows`, `domains` | `test/runner/dead-vocabulary-guard.test.mjs` scans `core`, `domains`, `src`, `bin`, `scripts` and the project config for the same symbols (and its two exclusion regexes for the deleted functions are gone). Coordination protocols are retired, nothing reads a user's protocol YAML |
| `coordination-protocol-fixtures-valid` | returned "retired", no condition | none (behaviour removed) |
| `coordination-example-requests-valid` | returned "retired", no condition | none (behaviour removed) |
| `operation-capability-resolves` | returned "retired", no condition | none (behaviour removed) |
| `identity-pinned-machines` | always passed; failed only on an unreadable pin file | `fgos identity pins` (the verb the row only listed); listing and states: `packages/identity/rust/tests/signing.rs` `pins_list_by_machine_forget_one_and_refuse_what_they_do_not_hold` |
| `event-store-refspec` | (1) remote set, fetch mapping missing; (2) push refspec that can match `refs/fgos/`; (3) positive fetch of `refs/fgos/local-events` or `branch-events`; (4) no mapping provenance; (5) provenance URL differs from the remote | `git-repository-config`: (1) was already its own check; (2)-(5) folded in (see below) |
| `event-store-native-addon` | Event Store facade exports missing from the addon | `git-component-compatible` (folded in); `eventStoreAddonAvailable` itself stays proven by `test/distribution/native-addon.test.mjs` |

### `tier-vocabulary-dead-keys` proof

New case in `test/setup/checks-doctor-config.test.mjs` ("every runner key a past release retired is reported by the config engine as an unknown key, whichever file carries it"): all 15 key paths, once in the project file and once in the global file, each named by `config-unknown-key <path>`. A scratch run first showed the same on the real door: all 15 are reported, and the two `executors.*` keys also fail `config-schema`. Difference to state plainly: the engine reports an unknown key as a warning (passes with a warning), the old row failed. The engine ignores such a key at run time, so nothing breaks; the replacement hint ("replace with rigor") is gone, the key path stays named. No key was accepted by the engine, so no row stays.

### Folds

- `git-repository-config` now also fails: unsafe publication refspec (push that can match `refs/fgos/`, fetch of the local or branch event namespace), no mapping provenance (`event-store-refspec-missing`), remote URL moved since setup (`event-store-remote-changed`). It reads the facts through the run's one Event Store doctor (`eventStoreDoctorOf`, same `once` key the registered Event Store rows use), so there is no second inspection. If those facts cannot be read, the row judges only what it read and the six Event Store rows keep reporting the failure from their remembered error.
- `git-component-compatible` now also fails when the addon lacks the Event Store facade exports.
- A mapping installed by hand (raw `git config`) carries no provenance, so the row now fails it as the old Event Store row did; the Git component's own driver-directory test installed its mappings by hand and now installs them through the setup fix (`test/git/native-load.test.mjs`).
- `src/setup/event-store-checks.mjs` reclassified `use-case` to `infra` in `docs/architecture-manifest.json`: it imports only infra (`src/event-store/index.mjs`) and `node:fs`, and `git-checks.mjs` (infra) now imports it.

## Red to green

Fold removed (the one spread line in `git-checks.mjs` dropped): `test/setup/git-checks.test.mjs` 3 fail (the two new mapping cases, and the run-sharing case); restored: green. The full suite then caught the hand-installed-mapping case in `native-load.test.mjs` (fixed, 17 pass).

## Tests retired and their owners

| Retired | New owner |
|---|---|
| `checks.test.mjs` row-list ids of the twelve rows; `operation-capability-resolves` retired-protocol test | behaviour removed (rows judged nothing fgOS needs), row list is the registry inventory |
| `registrations.test.mjs` four `plugin-skill-cli-reachable` cases | `bin-discovery.test.mjs` tier cases + new "falls back to a live PATH probe as tier 3" case |
| `registrations.test.mjs` three `plugin-dev-skills-packaged` cases | `fgos-mirror.test.mjs` (names, files, bytes of the plugin mirror) |
| `release-tree.test.mjs` R4 list entry `command-routes-drift` | `command-routes.test.mjs` drift case |
| `checks-doctor-config.test.mjs` three `tier-vocabulary-dead-keys` cases, one `coordination-protocol-dead-vocabulary` case | new unknown-key fixture case there; `dead-vocabulary-guard.test.mjs` |
| `identity-checks.test.mjs` pinned-machines case | `signing.rs` pins case (Rust) |
| `event-store-checks.test.mjs`: mapping/URL case, refspec-vs-Git agreement case, push-refspec case, native-addon assertion | moved (assertions kept, now on `git-repository-config`, with the specific message asserted) to `git-checks.test.mjs`: "the repository-config row fails a missing Event Store fetch mapping, an Event Store push or local-namespace fetch, and a remote that moved since setup" and "... allows ordinary pushes and protective negative fetches but refuses Event Store pushes"; the addon assertion is `a malformed explicit addon remains a failing diagnostic` plus `native-addon.test.mjs` |

## Size (measured, `git diff --numstat`)

| | Estimate | Measured |
|---|---|---|
| Node (`src`) | -420 | +37 / -399 = -362 |
| tests | -250 | +96 / -284 = -188 |
| docs / CHANGELOG | n/a | +18 / -23 |

Under the estimate because the folded conditions and the shared-run accessors cost more than the 40 planned and the new proofs (unknown-key fixture, live-PATH case, two moved Git cases) are kept. No Rust, no schema change.

## Docs

Registry contract inventory line, packaging-distribution spec row 7 (and the plugin-mirror line pointing at the mirror test), Event Store spec section 21 (two rows removed, fold note under the table, history section at the end; the signed text stays), Git spec section 12 (two rows), identity spec doctor line, seat-binding spec line naming the row that reports a retired global key, how-to doctor table (ten rows removed, Event Store sentence), CHANGELOG line.

## Run results

- Focused: `checks`, `registrations`, `git-checks`, `event-store-checks`, `identity-checks`, `bin-discovery`, `checks-doctor-config`, `dead-vocabulary-guard`, `fgos-mirror`, `command-routes`, `native-addon`, `native-load`, `architecture`, `doc-health`: green.
- Full suite (`/dev/shm/p02-full.log`, private cargo dir): 8741 tests, 8706 pass, 3 fail, no `run-tests: ERROR` line. The three: the known frozen V7n addendum; `check-decision-citation-drift` "CLI run against the real repo root" (12 findings, all in `docs/platform/documentation/spec.md`, a file this branch does not touch, from origin/main `61409ec73`); `native-load` umask test (mine, fixed afterwards and re-run green).
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared.
- `fgos doctor --json` through `npm run fgos:dev` on this worktree: 146 rows before, 134 after (the twelve ids; no id added), `git-repository-config` and `git-component-compatible` pass. Wall time is not measurable here: three runs each, 66.8 / 65.6 / 127.4 s before and 161.3 / 117.3 / 68.3 s after on a machine busy with other lanes; best-of 65.6 vs 68.3 s, the removed rows cost milliseconds (no row did a child process or heavy read except `command-routes-drift`, one node spawn).

## Deviations and notes

- `tier-vocabulary-dead-keys`: replaced by an existing row of lower severity (warning, not failure), see above; reported rather than kept since no key is accepted by the engine.
- The registration of `tier-vocabulary-dead-keys` sat in the row range the parallel T5 lane owns for `registrations.mjs`; only that registration (six lines) was removed there. Expect a trivial textual conflict if their edit touches the neighbouring lines.
- `docs/architecture-manifest.json` reclassification of `event-store-checks.mjs` (see Folds).
- Not run: the cargo checks (no Rust touched), the land gate on a host built for activation, owner-machine guide section (landing is the big lead's).
- Pre-existing unused imports in `registrations.mjs` left alone (`MODEL_POLICY_TIERS`, `deriveProviderFamily`, `skillForStep`, `listAssignmentRuns`); `resolveExecutorAndOverrides` became unused and was removed.

## Unresolved questions

- None blocking. Owner may want the retired-key hint ("replace with rigor") back as a message on `config-unknown-key`; that is the config engine's wording, not a doctor row.
