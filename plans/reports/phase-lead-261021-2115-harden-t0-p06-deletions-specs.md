# Phase lead report: deletions and spec updates

Branch `harden/t0-p06-deletions-specs` (base `0b0db39fe`). Commits: `4a86ca6aa` doctor row, `fd176750d` route, `c0c861fc5` crate functions, `f3b0da583` contract and next steps, `d45998675` door error and one-door allowlist, `5766ab939` specs, plus one small follow-up that drops the last route name from the process spec. Not pushed, not merged. Cargo target on ext4 (`/home/vantt/projects/forgent-worktrees/harden-t0-p06-target`).

## Deletions with evidence

- Doctor row `coordination-abandoned-claims`: `registrations.mjs` comment, `getAbandonedClaims`, `processStartFingerprint`, the check and the fix (lines 5989-6144 on this branch; the plan's numbers were one line off). `doctor-coordination-checks.test.mjs`: lines 46-115 only (the file still ends with the `runner-coordination-orgPolicy-shape` cases, lines 16-45). `checks.test.mjs:194` id. Three docs. `rg "coordination-abandoned-claims|getAbandonedClaims|processStartFingerprint" src test docs packages` before: 16 hits; after: nothing. Doctor `--json` on this workspace lists 145 checks and no such id (I did not run the base, so I cannot confirm the "146 before" arithmetic).
- Route `process-observe`: `route.rs` arm, usage text, doc comment and `process_observe` fn; contract file `internal-route.process-observe.v1.json` (git rm); `internal_lock_routes.rs` the whole route test plus the `process-observe` entry in the protocol-1 refusal list (it would now be an unknown route, not a protocol refusal). `test/state/hot-lock-host-judge.test.mjs` was already deleted in phase 3. `rg "process-observe|runProcessObserveRoute|observeViaHost|hot-lock-host-judge" src test docs packages apps` after: nothing (CHANGELOG history lines at 249 and 411 keep the old name, as history).
- Crate: `facts::start_time` deleted; `holders_multiprocess.rs` two callers now `facts::identity_of(..).map(|t| t.start_time)`. `kcmp_same_file` deleted with its re-export; the kcmp half of `kernel_table_and_fdinfo_agree_on_the_locker_stamp` removed, the lock-table half kept. `rg "start_time\(|kcmp_same_file" packages apps --glob '*.rs'` after: only the unrelated test name `observes_this_process_as_live_with_a_start_time`.
- `test/process/one-door.test.mjs`: both `registrations.mjs` allowlist entries removed (phase 3 added them for the claim probes); the file is green.

## Specs, contract and error texts

- `containment.port.v1.json`: `spawn_in` errors gain `invalid-bwrap-prefix` and `driver-unavailable` (names from `ContainmentError::name`); `linux-pgroup.is_empty` describes the judge plus row scan plus seen-members rule and `unknown`; the reused-pgid escape is added. Shape unchanged.
- Named errors with next step: every remaining `lock-route-error` and `lock-route-bad-output` throw in `src/holder-lock/driver.mjs` (six) ends with one shared next-step sentence; `process-containment` warn and fail texts in `src/setup/run-supervisor-checks.mjs` each end with an imperative step; `test/setup/run-supervisor-checks.test.mjs` extended by two assertions in the existing case, no new test. Not in the plan's list but needed for the spec claim "each named loader error carries a next step": `process-door-unavailable` in `process-identity.mjs` now ends with "restage the active release with fgctl init" (`process-door-not-shipped` already had its step; `native-load.test.mjs:178` asserts only that one and passes).
- Spec claims were checked against the tree: door export names and the `identity-unknown` signal outcome (`packages/git/node-addon/src/process.rs`), the `gateway-stop-identity-unknown` and `lock-fence-identity-unknown` names, the per-process verification key (`door.mjs`), the cached boot id and pid namespace, `process-identity.mjs` at 27 lines. All markdown links in the four edited spec files resolve.

## Doc files touched (for the DOC lane, ledger H12)

- `docs/platform/process/spec.md`: header status/source/reviewed/Related; §2 reconcile sentence; §3 zombie wording and the door paragraphs (policies P1/P2, unknown mapping, named loader errors, per-process verification, Node budget) replacing the Node leaf paragraph; §8 new 2026-10-21 entry superseding the 2026-10-16 Plan 4.2 entry by name (the old entry stays, with a pointer); §9 row; §10 `linux-pgroup` row.
- `docs/platform/component-boundary.md`: Process Facts and Containment rows; two new rows, Durable file and Canonical JSON (accepted exceptions, accepted Rust duplication); reviewed date.
- `docs/platform/holder-lock/spec.md`: boundary table row, §10 route list and protocol sentence (`{v, protocol}` 2 for lock routes, 1 for `quiesce-scan`), `process-observe` row removed, §15 "host that cannot be run" reworded to "record of another host" (two places).
- `docs/specs/reading-map.md`: holder-lock line route list, hot-lock line (Windows creation time through the door), process line (door and thin client), one new line for the two boundary rows.
- `docs/specs/distribution.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`: the row id removed from the check lists (three occurrences). `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`: the row removed from the table. `CHANGELOG.md`: two lines under Unreleased (the row, the route).

## Retired tests and owners

- `doctor-coordination-checks.test.mjs` lines 46-115: behaviour removed (no replacement; nothing writes `claim.json`).
- `internal_lock_routes.rs` route test: behaviour removed; the in-process judgement is owned by `judge_vectors.rs` and the phase 2 Node wiring case. The refusal-list entry: behaviour removed.
- kcmp half of the linux.rs test: behaviour removed.
- `hot-lock-host-judge.test.mjs`: already retired in phase 3.

## Commands I ran and results

- `node --test` through `ensureGitAddon` (script in the scratchpad): `doctor-coordination-checks`, `checks`, `registrations` 170 pass; `run-supervisor-checks`, `rust-host/internal-routes`, `holder-lock/driver-unavailable`, `state-root`, `facade-multiprocess` pass; `process/one-door`, `runner/dispatch-reconciliation-import-graph`, `run-supervisor-checks` 52 pass; `runner/dead-vocabulary-guard`, `setup/doctor-fresh-run`, `test/docs/*`, `setup/registrations` 100 pass.
- `cargo test -p fgos-process`, `-p fgos-holder-lock`, `-p fgos --test internal_lock_routes`: all result lines ok, no warnings. I did not run `cargo test --workspace` or `npm test`.
- `fgos-lock-fences` file `test/holder-lock/fences-rust-locks.test.mjs`: 4 fail with `fgctl binary must exist at .../release/fgctl` (needs a release build; same as reported in phases 2 and 3), not related.
- Census regenerated with `--write-census` in each commit that touches hashed files.

## Δ lines (`git diff --numstat 0b0db39fe HEAD`)

Node (src, scripts): +12 / -165. Rust (src): +4 / -64. Tests (node and rust): +4 / -97. Docs, contracts, census, CHANGELOG: +72 / -75 (includes the deleted route contract).

## Not done

- `docs/backlog.md` row `p-3c7681b8`: not closed. The file is generated (`bee backlog render`, source `.bee/backlog.jsonl`, neither present in this checkout) and the row is about tests leaking fixture sessions into `.fgos/coordination/sessions/`, which deleting the doctor row does not fix. Needs the big lead's call (close with a reason through the backlog tool, or keep).
- `decision-index`: the §8 entry carries no decision id, so not run.
- Messages to DOC (`forgentx-5f`) and SEAT: not sent by me; the file list above is the H12 content. SEAT note: `registrations.mjs` diff is the one deleted range only.
- Release-build `fences-rust-locks` and the full suites are left to the big lead.
