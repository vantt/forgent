---
phase: 0
title: "Facts and prior art for the ten leaks (done at planning time)"
status: completed
effort: 0 (done by the planner, 2026-11-14)
blockedBy: []
---

# Phase 00: Facts and prior art

Read-only facts gathered on `origin/main` 781537524 by the planner and five scouts. Line numbers drift; every phase
re-greps its own sites before editing. Census: `git show origin/research/one-door-census:plans/reports/research-261114-2201-one-door-census-existing-doors.md`.
Nothing here needs executing; phases cite it.

## Leak 1: hand-written YAML frontmatter (`src/report/frontmatter.mjs`)

- Exports `parseFrontmatter` (:57), `renderFrontmatter` (:97); no imports; header :9-13 "deliberately hand-rolled, zero dependencies".
- Product callers (all verified): `bin/fgos.mjs:46,2783` (`authoritative-match` reads `authoritative_for`),
  `scripts/check-decision-citation-drift.mjs:41,235`, `scripts/check-decision-supersession.mjs:11,123`,
  `scripts/knowledge-classifier.mjs:7,44`, `scripts/knowledge-migration.mjs:10,275,281` (the only `renderFrontmatter` caller),
  `src/report/enduser-index-generate.mjs:13,68`, `src/report/knowledge-lints.mjs:12,62`. Tests: `test/report/frontmatter.test.mjs`,
  `test/report/enduser-index.test.mjs:11`, `test/scripts/knowledge-migration.test.mjs:540`, `test/scripts/knowledge-classifier.test.mjs`,
  `test/scripts/check-decision-supersession.test.mjs`.
- Other own frontmatter-block cutters: `src/setup/skill-wrappers.mjs:27,86` (`FRONTMATTER_PATTERN`, `extractFrontmatter`; :241
  reads `version:` with a line regex, i.e. a second YAML reader), `src/setup/instruction-registry.mjs:94` (cut, then `parseYaml` :167),
  `scripts/lib/git-spawn-match.mjs:85` (cut, then `parseYaml` :87). No shared cut function exists.
- YAML door: `src/util/yaml.mjs:29` `parseYaml` -> `nativeDoor().yaml.parse` (addon, no JS fallback). It needs a release or dev
  manifest (`src/native/door.mjs:38-40`, `git-addon-not-shipped`). `scripts/run-tests.mjs:117-125` stages it for tests; the main
  checkout has an activation; `check:before-merge` (`package.json:56`) runs in the main checkout. The pre-commit hook already reaches
  `parseYaml` through `git-spawn-match.mjs`, so scripts on this door are not new.
- No emitter: `src/util/yaml.mjs` exports only `parseYaml`, `YamlParseError`, `describeYamlError`; the addon `yaml` namespace exposes
  only `parse` (`packages/git/node-addon/src/yaml.rs:65-66`).
- **Q4 settled by evidence.** The tool profile types only `true/false/null/~`, numbers, `.inf/.nan`
  (`packages/yaml-doc/rust/src/profile.rs:178-215`); dates stay strings (no date variant, `model.rs:11-19`). A flat subset buys
  nothing but tolerance for invalid YAML. About nine docs carry invalid frontmatter (plain scalars containing `: `, a leading
  backtick): `docs/explanation/compound-learn-artifact-registry.md:2`, `docs/explanation/settleclaim-revision-drift-self-caused.md:2`,
  `docs/explanation/unsignaled-detection-backtick-false-positive.md:2`, `docs/distillery/deep-dives/{compound-engineering,routing,state}.md:4`,
  `docs/knowledge/fgos-show-id-output-fields/fgos-show-verb-output-fields.md:3`, `docs/knowledge/fgos-list-s-side-log-scoping/fgos-list-side-log-scoping.md:3`,
  `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md:3` (heuristic list; phase 01 confirms by parsing). Parsed
  differently but valid: `docs/distillery/deep-dives/fgos-harness-architecture.md:7` (folded block), `docs/doc-registry.md:2`,
  `docs/decisions/index.md:4` (`true` becomes boolean). Decision: fix the docs, no flat subset.
- **Prior art.** `320adbdef` (2026-07-22) added the helper. The YAML door (`8ef1baf1c`, `21c45f9f7`, landing `53bc71d32`,
  2026-10-16..23) kept it on purpose: `docs/platform/packaging-distribution/spec.md:827` ("Kept on their own paths:
  `src/report/frontmatter.mjs` pairs `parseFrontmatter` with `renderFrontmatter` ... replacing only the parser would make the pair
  asymmetric"), also `docs/platform/yaml-document/spec.md:43,177`. The lead's decision (owner-approved) reverses a recorded
  decision: phase 01 writes a superseding decision-history entry, never an in-place edit.
- **The writer.** `scripts/knowledge-migration.mjs` is a one-shot migration that already ran live (`docs/explanation/compound-learn-artifact-registry.md:394-400`:
  `tsk-5mh` ran `--apply` and landed). Nothing runs it (`package.json`, CI, hooks, `bin/`). `scripts/knowledge-classifier.mjs`
  is its inventory step (archive plan `260825-1841-knowledge-registry/phase-03-classifier-inventory.md`). Decision: delete both
  with their tests; the writer half of the helper goes with them, so no YAML emitter is needed.
- Registrations of the helper: `test/architecture.test.mjs:1775` (`ARM_STATIC_IMPORTS`), `test/test-ownership.mjs:49`,
  `docs/architecture-manifest.json:238`, census `packages/git/contracts/mutation-census.v1.json:972`,
  `scripts/check-decision-citation-drift.baseline.json:245-246,521-528`, docs `docs/reading-map.md:170`,
  `docs/platform/work-state/contracts/knowledge-registry.md:698-710`, `docs/platform/component-boundary.md:90`,
  `docs/platform/decision-citation-drift/spec.md:126`, `docs/platform/proposals/knowledge-registry-redesign.md:655`.
- Other hand-written frontmatter writers (outside rank 1; not fixed here, see plan.md ideas): `src/report/knowledge-projection.mjs:17`,
  `src/report/decision-index.mjs:97`, `src/workflow/case-runtime.mjs:198`, `scripts/knowledge-canary.mjs:39`, `scripts/project-agents.mjs:170-175`.

## Leak 2: persona choosers

- Door `src/runner/agent-definitions.mjs`: `agentTierDirs` (:39; tiers workspace `fgos/agents`, domain from the payload's
  `domainCatalog`, core), `scanAgentTiers` (:60), `findAgentDuplicates` (:78), `readAgentDefinition` (:104),
  `resolveAgentDefinition(name, {projectRoot, installRoot, workflow})` (:252; private `lookupTiers` :211). :43 "Domain doctrine is the
  running payload's, never the project's own domains/ directory." `src/runner/agent-listing.mjs` already reads through the door.
- Second choosers: `src/runner/dispatch/assignment.mjs:631-689` `renderPersonaSection` (reads `core/agents/<ref>.yaml` at :633,
  skips workspace and domain tiers); `src/runner/agent-roster.mjs:31-75` (core, domains, legacy `cwd/agents`, first wins; only
  importer `src/runner/work-dispatch.mjs:13,76`); `scripts/project-agents.mjs:~100-137` `findAgentYamlFiles`;
  `src/setup/registrations.mjs:809-863` `allAgentYamlFiles` (reads the project's own `domains/` at :818, against the door's rule)
  and `readAgentSkills` (last wins, :858).
- Prior art: roster `f0cf7f9dc` (2026-08-20), `7c192680f` (2026-08-26); legacy `agents/*.yaml` emptied in `f18c9e87f`
  (2026-08-20, tsk-397-12); "deprioritized, not retired" (`docs/explanation/tsk-397-post-merge-review-remediation.md:76-80`).
  No document says the roster's reverse order is intended; D24 is "core plus domains" (`docs/history/core-foundation-domain-boundary/DISCUSSION.md:88-94`),
  D33 global name uniqueness (:474).
- **Decided by evidence:** an agent the door cannot resolve cannot run (dispatch resolves through the door), so any other walk
  only shows or validates agents that will fail later. Every chooser moves to the door; the legacy `agents/` scan and the
  project-`domains/` read are dropped.

## Leak 3: activation record write (census Q3)

- `packages/distribution/rust/src/init.rs:526-558` `publish_activation_file`: tmp `activation.json.tmp.<id>`, default mode,
  `sync_all`, `rename`, parent-dir `sync_all` with errors ignored. Callers `init.rs:1621,2089,2228`. Stale sweep of its temps
  `cleanup_stale_activation_tmp_files` `init.rs:279-290` (called at 1197, 1251, 1306, 1376).
- Durable File: `packages/durable-file/rust/src/lib.rs` `replace_durably` (:170, mode 0o600), `replace_durably_with_mode` (:175),
  `replace_durably_observed` (:193); temps `.durable-file-<pid>-<seq>.tmp`; dir-fsync errors propagate.
- **Q3 answered by evidence: not intentional.** Durable File is a compile-time crate linked into fgctl through
  `packages/distribution/rust/Cargo.toml:10` (`apps/fgctl/src/main.rs:209`), so "not staged at init time" cannot apply. `init.rs`
  (`8e6961c26`, 2026-09-11) predates the crate (`42bc4c7cc`, 2026-10-18); `b0e39084a` moved `shim.rs` and `74d794cee` moved
  `fgctl_refresh.rs` to the door and skipped `init.rs`. No comment explains the difference: a missed migration.

## Leak 4 remainder: global directory

- F0 phase 04 takes the work-state root walk; F0 phase 06 creates `globalFgosDir()` (Node) over a `fgos-config` function and moves
  five Node choosers. Left by F0 as debt: `src/setup/registrations.mjs:517` (display label in `checkRunnerPatternsConfig`) and
  `packages/distribution/rust/src/uninstall.rs:445-449` (own `home_dir()`: HOME then USERPROFILE on every platform; config's
  `packages/config/rust/src/machine.rs:101-106` uses HOME on unix, USERPROFILE on Windows, rejects whitespace).
- `fgos-distribution` does not depend on `fgos-config`; adding it is cycle-free (config's closure: durable-file, holder-lock,
  canonical-json, identity, git, host-runtime, yaml-doc) and changes one line in `Cargo.lock` (`Cargo.lock:290-302`, the
  fgos-distribution entry). Prior art: `456eb901c` (2026-10-29) "one home-directory rule for every snapshot builder";
  `uninstall.rs:445` came later (`c5cea8e25`, 2026-11-12) without reusing it.

## Leak 5: seat-policy canonical digest

- `src/runner/execution/seat-policy.mjs:54-63` private `canonicalJson`, `seatConfigDigestOf`; `:97-99` `accountViewDigest`.
  `configDigest` is persisted in the unit's `bindingInput` (`src/runner/execution/bind.mjs:528,547`) and compared on replay
  (`src/runner/dispatch/assignment-runner.mjs:301-309`, refusal `binding-replay-config-mismatch`). `accountViewDigest` is
  provenance only. The Rust crate never computes either (`packages/seat-binding/rust/src/model.rs:674-701` echo `Option<String>`).
- Byte differences private vs door (`src/native/door.mjs:98`): key order equal (UTF-16 code units); an `undefined` member gives
  `null` privately but is dropped by the door; `Date`, non-finite numbers and `undefined` array members differ. YAML-loaded config
  carries none of these except `.inf/.nan` (typed by the profile). So the switch keeps digests for real config, but phase 05 must
  prove it before deleting the copy, because a changed digest makes replay of existing units refuse.

## Leak 6: writer identity environment

- Rust `packages/identity/rust/src/launcher.rs:13-54` `scrub_and_set` (scrubs 5 names, sets `FGOS_SESSION_ID`, optional
  `FGOS_PARENT_WRITER_ID`) has **no production caller** (only `packages/identity/rust/tests/attempt_writer_id.rs:113-158`) and is
  not exposed by the addon (`packages/git/node-addon/src/session_identity.rs:13-68`).
- The live path is Node: `src/run-supervisor/direct-launch.mjs:149-153` `withIdentityEnv` (used :222 and
  `src/runner/dispatch/assignment-runner.mjs:1063`); it deletes only `FGOS_PARENT_WRITER_ID` and leaves the four other names the
  contract scrubs (`packages/identity/contracts/attempt-writer-id.v1.json:20`). `assignment-runner.mjs:421` spells
  `FGOS_SESSION_ID="<id>"` for codex's `shell_environment_policy.set`.
- `src/setup/agent-hooks.mjs:484` `startsWith('att-')` is inside a generated pi/omp extension (TypeScript text that runs in the
  agent process and cannot import Node modules); the predicate's owner is `attempt.rs:48-50`.
- `src/setup/registrations.mjs:421-426` `insideHarnessShell` detects a harness shell, not a writer. Mailbox Rust already calls
  `fgos-identity` (`packages/mailbox/rust/store/src/hook/resolve.rs:17-18`); `resolve.rs:40` is the process-boundary env read.
- Prior art: `fa9e84c1c` (2026-11-03, "writer id has one path"), `dd8ac8973` (2026-11-12, env allowlist), `105169643`
  (2026-10-24, the `att-` check). The Node copy is the newer path; the Rust function was never wired.

## Leak 7: second launcher, second killer

- `src/runner/dispatch/provider-credential-probe.mjs:129-150` spawns an agent CLI detached inside the account's own home under a
  lock lent through `spawnHolding`, with a timeout and `process.kill(-pid,'SIGKILL')`. Callers: `provider-account-probe.mjs:212,232`,
  `provider-capacity.mjs:961,1014`, `provider-credential-renewal.mjs:41,1221`. Run Supervisor has no bounded-command API; it is
  built around attempts (`src/run-supervisor/direct-launch.mjs`, `client.mjs`). The process-control allowlist already names the
  kill (`test/process/one-door.test.mjs:17`). **Decided:** a legitimate second launcher (a probe is not a run: no attempt, no
  writes, own bounded lifetime); documented as allowed, no code move (a supervisor API would be a new mechanism, RUL104).
- `scripts/run-tests.mjs:269-273` (`/proc/*/cmdline` scan), `:516` bare `process.kill(pid,'SIGKILL')`;
  `scripts/lib/test-file-watchdog.mjs:92-99` (`kill(pid,0)`), `:107-125` (environ scan, SIGKILL), `:129-143` (`ps -A`, `killTree`);
  `scripts/lib/mailbox-live-confined.mjs:432` bare-pid SIGKILL. The process door is reachable from scripts:
  `src/native/process-identity.mjs` exports `judge`, `observe`, `selfRecord`, `signalByIdentity`, `selfChain`, `scan`;
  `scripts/lib/git-addon-stage.mjs:37-44,84-86` `ensureAddonForScript`; run-tests exports the staging env to children
  (`run-tests.mjs:122-123,679`). `packages/process/rust/src/control.rs:103` `signal_by_identity` uses pidfd on Linux.

## Leak 8: Rust process-fact readers

- Sites: `packages/holder-lock/rust/src/route.rs:652-660` (`same_user`, metadata uid of `/proc/<pid>`, kept for non-dumpable
  processes per its comment :648-651), `origin.rs:118-119` (`comm`), `driver/flock.rs:694-700` (parent, group),
  `helper.rs:101-149`, `route/hold.rs:459-548`, `borrow_vectors.rs:440-449` (Windows `OpenProcess`/`GetProcessTimes`; they also
  hold a `SYNCHRONIZE` handle for waiting; `borrow_vectors.rs` is product code, `pub mod` at `lib.rs:15`);
  `packages/git/node-addon/src/single_load.rs:21-35,43-70,~125-135` (self start time, three platforms);
  `packages/git/rust/src/worktree.rs:578-582` (`comm`); `packages/terminal-control/rust/src/driver/herdr.rs:990-993` (`/proc/<pid>/fd/0` tty).
- `fgos-process` exposes `identity_of`/`self_identity` (`facts.rs:294-306`), `relation_of`, `command_name_of` (:490-500),
  `effective_uid` (:592); Windows `relation_of`/`command_name_of` return `None` (`platform/mod.rs:51,56`); no tty-of-fd function.
- All four crates already depend on `fgos-process` (`holder-lock/rust/Cargo.toml:8`, `git/rust/Cargo.toml:14`,
  `git/node-addon/Cargo.toml:20`, `terminal-control/rust/Cargo.toml:9`): no `Cargo.lock` change.
- Prior art: `fgos-process` `605d489af` (2026-10-16) came first; `same_user` `1afc7973f` (2026-10-17) and the addon start time
  `403d63b21` (2026-10-18) were written beside it, not before it.

## Leak 9: write helpers

- Node (`docs/platform/component-boundary.md:88` accepts per-module no-fsync helpers that name temps with `uniqueTmpTag()`,
  `src/util/unique-tmp-tag.mjs:11`; "no shared write helper"): leaks against that convention are
  `src/runner/main-checkout-activity.mjs:94-97`, `src/setup/skill-wrappers.mjs:57-64,561-575`, `src/util/capped-jsonl-log.mjs:19-22`
  (`<file>.<pid>.tmp`), `src/setup/managed-timer.mjs:352-354` (`<file>.<pid>.tmp`), `src/holder-lock/hold-transport.mjs:226-231`
  (`req-<n>.json.tmp`). `src/run-supervisor/run-lock.mjs:47-72` best-effort fsync helpers: the Node door has no fsync-only op
  (the addon's durable namespace has only `replaceDurably`/`installOnce`).
- Added by the big lead (COOK's find, re-checked on F0 integration `1161aad8c`): three more private atomic writers.
  `scripts/export-command-selectors.mjs:375-380` `writeAtomic` (tmp `${target}.tmp.${pid}.${Date.now()}`; `.gitignore` covers
  that exact name per its comment :370-374); `src/runner/dispatch/provider-credential-renewal.mjs:127-129` `writeFileAtomic`, an
  exported second name for `replaceDurably` (mode 0o600) imported by `src/runner/dispatch/confinement/cleanup.mjs:14,107,201`
  and used at `provider-credential-renewal.mjs:336,1110`; `src/runner/dispatch/visibility-session.mjs:84-91` `writeJsonAtomic`
  (over `publishMutableProjection`, maps the error to `VisibilityError`). Same family, other tooling temps:
  `scripts/git-one-door-scan.mjs:2706` (`${target}.${pid}.tmp`), `scripts/lib/git-addon-stage.mjs:49,58,66,73`,
  `scripts/run-rust-dev-host.mjs:24-33` `atomicWrite`, `scripts/event-store/store-increment-worker.mjs:62` (bench).
  `src/workflow/case-runtime.mjs:30-35` `writeText`/`writeJsonAtomic` is a private adapter over `replaceDurably` (adds mkdir), not a second writer.
  The second manifest formatter at `bin/fgos.mjs:3971` belongs to F0 phase 09, not here.
- Rust files matching `.sync_all()`/`.sync_data()` outside tests (12): durable-file `lib.rs`; `distribution/init.rs` (leak 3);
  `holder-lock/tombstone.rs` (exchange via `renameat2(RENAME_EXCHANGE)`, Linux only; holder-lock does not depend on durable-file);
  event-store `rotate.rs` (renames an existing segment, dir sync via the door), `identity.rs` (ancestor fsync that durable-file's
  header leaves to the caller, then `install_once`), `fsio.rs` (trait default `sync_file`); `observe/shard.rs`;
  `run-supervisor/gate.rs`; Git-owned `restore.rs`, `native_lock.rs`, `sequence.rs`, `repository_config.rs`. Durable File has no
  move-existing or exchange primitive. **Decided:** rotate and tombstone are different jobs (move an existing file, swap two
  directories), allowed with reasons, not leaks of "write new bytes durably".

## Leak 10: readers and small duplicates

- Shim path by hand: `src/setup/agent-hooks.mjs:45-46` (`getProjectShimPath`, local), `:476` (`mailboxShim` walk-up), `:546`
  (inside a generated TypeScript template), `src/setup/managed-timer.mjs:305`. `src/util/host-bin-path.mjs` (tier 0 leaf) has no
  shim-path export. Activation readers outside the door: `src/setup/bin-discovery.mjs:24`, `src/setup/registrations.mjs:2576,2767,2950,3703`.
  `FGOS_ACTIVE_MANIFEST_PATH`: owner `src/run-supervisor/payload-root.mjs:28` (its comment), also read at
  `registrations.mjs:2561,2794,2807` and `apps/fgos/src/legacy_exec.rs:103`.
- Five route clients repeat host lookup and translation: `src/holder-lock/driver.mjs:55-116`, `src/seat-binding/client.mjs:~60-117`,
  `src/terminal-control/client.mjs:33-80`, `src/run-supervisor/client.mjs:22-60`, `src/util/session-identity.mjs:~51-75`, beside
  `src/util/host-bin.mjs` `invokeHost` (envelope verbs, appends `--dir`; not usable for line-JSON `internal` routes). Each keeps
  its own error class and codes that callers match. holder-lock (tier 1) may import only tier-0 leaves (it already imports
  `host-bin-path.mjs`).
- `src/setup/runner-config-conversion.mjs:14-24,55,112,196-197,254-263` locates and reads `config.yaml|json` raw (the validating
  door refuses retired keys, so it reads around it); `src/config/facade.mjs:1-3` claims to be the only Node config reader and has
  no raw-read export (:60-84). Prior art `ad780d148`, `638df66ea` (2026-10-28).
- `src/runner/dispatch/reconciliation-planner.mjs:64,265,328` appends `.fgos/dispatch/reconciliation-actions.jsonl` under the
  `reconcile` lock; readers are tests only; not in `src/state/fgos-file-registry.mjs`.
- Clock copies: `apps/fgctl/build.rs:~31-33` (civil date), `packages/event-store/rust/src/publish.rs:122` `timestamp_seconds`
  (callers `seal.rs:542`, `publish.rs:74`). Owner-kept pair: `packages/identity/rust/src/text.rs` (`iso_utc` :92, `iso_utc_secs`
  :114) and `packages/host-runtime/rust/src/civil_time.rs` (identity spec :273). event-store already depends on `fgos-identity`
  (`packages/event-store/rust/Cargo.toml:17`); fgctl has no `[build-dependencies]`.

## Census Q2 (Secrets) — settled by evidence, no change

`docs/platform/secrets/spec.md:7-8` is an unsigned draft, "Implementation: Not started"; :187 and :235 place a person-made
login copied into a private home with the lease (provider-capacity / agent-confinement), not with the value resolver. There
is no resolver to route through. The credential-file reads stay; nothing to plan.

## Census Q1 (seat-binding reads)

Out of scope: the capability plan owns it.
