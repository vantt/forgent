# Git phase 07 unit 20: one-door gate (V-GATE) and the last raw sites

Worktree `.claude/worktrees/git-p07`, branch `git/p07-switch`, from tip `7044c55d1`. No `git add` or `commit` was run. Phase 07 item 4 (V-GATE, D9) is built. The census it produces is **not empty yet**: 70 sites remain, against 89 on the starting tree. The open sites and the owner questions are below.

## Prior art

- `git log -S'one-door' -S'git-spawn-spy' -S'mutation-census'` finds only plan and spec text: no gate code existed.
- `scripts/git-p07-census.py` was a line-regex candidate inventory. It is **retired** (L10). The new scan replaces it, and the phase-07 step that named it now says so.
- Reused:
  - `test/helpers/js-source-lexer.mjs`, moved to `scripts/lib/js-source-lexer.mjs`. Five guard tests were retargeted to the new path.
  - The child_process wrapping pattern of `scripts/lib/test-git-config-guard.mjs`.
  - The sandbox door `scripts/lib/sandbox-git.mjs`.
  - The verify-checkout door (`createVerifyCheckout` with guarded `removeWorktree`).
  - Unit 15b's `pathExistsAt` and `commitAt`, now exported.
- A second Git-spawn scanner remains in `test/event-store/door.test.mjs`. It covers event-publication argv only and is owned by the Event Store lane. It is filed below as a separate item, not merged here.

## What was built

| Part | Where |
|---|---|
| Static scan, by data flow | `scripts/git-one-door-scan.mjs` (see the list below) |
| Shared matcher | `scripts/lib/git-spawn-match.mjs`: `shellRunsGit` plus the sandbox marker `SANDBOX_DOOR`. The scan, the spy and the sandbox door all use it. |
| Runtime spy | `test/helpers/git-spawn-spy.mjs`, preloaded by `scripts/run-tests.mjs` (see the list below) |
| Census | `packages/git/contracts/mutation-census.v1.json`: sites, named classes, a sha256 per scanned file and a payload digest. `buildRustDistribution` writes it (`writeMutationCensus`) before it stages the sources. `package.json` `files` ships it. |
| Doctor | `git-mutation-one-door` is registered in `src/setup/registrations.mjs`, with its body `checkMutationOneDoor` in `git-checks.mjs`. It fails on a census with any site, on a broken self-digest, or on a Node-payload file whose bytes differ from the census. |
| Probes | `test/git/one-door.test.mjs` with nine seeded shapes under `test/fixtures/git-one-door/`, plus the doctor verdict (see the list below) |

**Static scan details.**
- It covers JS (child_process imports, namespace and alias bindings, injected spawn defaults, `runBorrowed` specs), Rust `Command::new`, shell lines and shipped skill text.
- It follows variables, `??`/`||`/ternaries, templates, `path.join` basenames, destructuring, object properties, function returns (local and relative imports) and wrapper parameters, resolved at each caller across files. Callers of a Git wrapper are counted on the site.
- An unresolved binary is a site, not safe.

**Named classes.** These are reported apart, never by path alone:
- `git-driver`: fgos-git's own crate;
- `sandbox-door`: recognised by the marker on its spawn;
- `production-sandbox-probe`;
- `hook-read-context`: read verbs in `.githooks/`;
- `rust-test`;
- `configured-binary`: owner question Q1.

**Runtime spy details.**
- It records any `git` or hook spawn (argv, shell, `sh -c`, `env`/`xargs` launchers) that code in `src`, `bin` or `scripts` starts.
- It attributes a spawn to the frame that called child_process. It skips wrapper frames of modules that patched child_process after it, such as the hot-lock guard.
- It inherits into child CLIs through `NODE_OPTIONS`.
- A sandbox-door spawn passes only after its cwd and `-C`/`--git-dir` paths are rechecked against the marked root.
- `runSelectedTests` reads the log and fails the run, naming each site.

**Probe and doctor test.** `test/git/one-door.test.mjs` passes 2/2:
- the nine seeded shapes: callback argv, `runBorrowed` facade, argv in a variable and mutated, global options and a prefix, a wrapper prepending the verb, a Rust variable binary, a shell string, hook replay plus skill text, and `status`;
- the doctor verdict: a site, payload drift, a bad digest and a missing census each fail it, and an empty census built from the payload passes.

### Test-side moves the gate required

- **Launcher and config guard.** `scripts/run-tests.mjs` `snapshotGitIdentity` and `scripts/lib/test-git-config-guard.mjs` read the repository layout and config files from disk (`scripts/lib/git-dir-layout.mjs`) instead of spawning `git`. This closes unit 17's "config-guard read" residue.
- **Release source listing.** `listLegacyNodeSourceFiles` (release staging and doctor `active-release-matches-checkout`) now takes `openInspect` and reads `trackedPaths` plus untracked `status` through Inspect. An unpacked tree with no `.git` keeps the filesystem walk and never loads the addon. The build reads with the addon it just compiled.
- **Sandbox door marker.** `sandboxGit` and `gitVersion(root)` now carry the marker. `gitVersion` takes the sandbox root.

## Sites moved (scan before → after)

The before column is the final scanner run on `git archive HEAD`.

| Family | Before | After |
|---|---|---|
| literal `git` spawn | 17 | 3 |
| shell line | 5 | 0 |
| Rust `Command::new("git")` | 1 | 1 |
| wrapper caller (shell `-c`) | 2 | 2 |
| unresolved binary | 64 | 64 |
| **total undeclared** | **89** | **70** |

Classes after: hook-read-context 21, configured-binary 32, rust-test 83, sandbox-door 2.

**Moved:**
- **`bin/fgos.mjs`.**
  - `return`: commit count and changed paths go through Inspect `countCommits`/`diff`. The disposable verify checkout uses `createVerifyCheckout` plus guarded `removeWorktree`, so there is no forced `worktree remove`; the port strips `.fgos`.
  - Branch tip goes through `resolveRefSha`.
  - `init` headless check, `knowledge attest`, `knowledge`/doc-tag and `compound --doc-path` use `pathExistsAt`/`resolveCommit`.
  - `preflight` uses `resolveRepo` and Inspect `diff` index↔worktree under the two skill prefixes.
  - `resync-worktree` gets its branch from `listWorktrees`.
  - The `gitAt` wrapper is deleted.
- **Build listing.** `scripts/build-rust-distribution.mjs` reads the source list through Inspect, as above.
- **Test launcher and guard.** The two guard reads and the run-tests identity read are now done from disk.
- **`scripts/ci-external-consumer.sh`.** It goes through a new CLI entry of the sandbox door (`node scripts/lib/sandbox-git.mjs --root <sandbox> -- <git args>`). Its wiring test is `test/scripts/sandbox-git.test.mjs`, new because nothing tested the door before.
- **`scripts/fgos-shell-integration.sh`.** The common dir is read from the `.git` layout. `test/scripts/fgos-shell-integration.test.mjs` is extended with a relative-gitdir linked worktree and a malformed `.git` case.
- **u15b needsWrites 4.** `src/verbs/events/migrate.mjs` stop check passes `workspaceListing(cwd).worktrees`. Its owning test, `test/event-store/migrate-cutover-grant.test.mjs`, now also blocks on a process in a linked worktree; that test skips in this sandbox (PID namespace).
- **u15b needsWrites 5.** `packages/distribution/rust/src/git_gate.rs` `predecessor_scan` passes `--dir` per linked worktree from fgos-git `list_worktrees`. A refused listing fails closed (`git-predecessor-writer-live: linked worktree listing unavailable`). Its test extension is in `apps/` (see needsWrites).
- **u15b needsWrites 6.** `scripts/install-git-hooks.mjs` reports a typed RepositoryConfig refusal in one line with exit 1. `test/scripts/install-git-hooks.test.mjs` fixtures are activated, and its CLI fixture links `src/`; it passes 11/11 and gains one test for the refusal path.

## Residue (open sites; none allowlisted)

| Site | Owner | Why it stays | What retires it |
|---|---|---|---|
| `bin/fgos.mjs` `main-checkout-reset` (`rawMainCheckoutGit`: rev-list, log, `reset --hard`) | Git (SafeRestore) + CLI | SafeRestore refuses to discard commits or local changes on the main checkout (`restore-discard-requires-producer`), and only moves it forward. The verb exists for a confirmed backward reset. Moved, it failed 3 owning tests (`test/cli/fgos-claim.test.mjs`). | Owner question Q2 |
| `core/skills/distill/scripts/distill.mjs:49` (11 callers, including `pull --ff-only`) and `core/skills/instruction-audit/scripts/instruction-audit.mjs:74` | skills | `fgos setup` copies these scripts into consumer projects (`src/setup/skill-wrappers.mjs:1254`, `:185-194`; a live copy exists in skillhub-mcp). There, neither `src/git/inspect.mjs` nor the addon can load. distill also needs a commit log listing, a diff stat and a fast-forward that Inspect lacks. | Owner question Q3 |
| `packages/herdr-fgos-common/rust/src/fgos.rs:348` `repo_root()` | herdr-dashboard (outside the cargo workspace, `herdr-dashboard/src/main.rs:27`); fgos-gateway inside it | Its public API is compiled by herdr-dashboard. The gateway move is in `apps/` (see needsWrites). | herdr-dashboard and the gateway resolve the root via `fgos_git::GitDriver::open_at(cwd)?.trusted_main_root()`, then `repo_root()` is deleted |
| `src/runner/goal-check.mjs:57` `/bin/sh -c` / `cmd.exe` via `runBorrowed` | runner | The script is a consumer's declared verify command | Owner question Q1 |
| 64 unresolved binaries | scan precision | See the grouping below | Extending the scan's resolution, or Q1 |

The 64 unresolved binaries, grouped by root source:
- host-binary resolution: `holder-lock/index.mjs` ×8, run-supervisor, assignment-runner, terminal-control, fanout-batch, run-supervisor checks;
- process primitives that run a caller's argv: `process/containment` ×5, `mapped.rs`, run-supervisor gate/steps, host-runtime provider, `holder-lock/semantics.rs`;
- configured executables: bwrap probes in registrations, provider credential probe/renewal, worker boot, `gh` in `github-adapter`;
- benchmark and tool scripts: `e3-bench`, test-timing, stress-test, herdr-cockpit-notify;
- the probe's own temp-dir git: `borrow_vectors.rs` ×2. This is the named probe class; the scan cannot yet prove its `temp_dir` data flow.

**Runtime sweep.** The spy ran over `test/runner`, `test/cli`, `test/workflow`, `test/state` and `test/setup`: 6162 tests, 5690 pass, 393 fail, 14 skipped.
- **Failure signatures.** They are bwrap/confinement (about 350), EROFS on the main checkout or the npm cache (about 230), PID-namespace `unavailable` (18), and `git-fence-missing` in fixtures that `pick` a worktree without activating (15; for example `test/runner/dispatch-production-call-sites.test.mjs`). None traces to a module this unit changed. A baseline comparison of the whole sweep was not run.
- **Spy entries.**
  - The `main-checkout-reset` residue: 9 entries.
  - One consumer verify command: `test/runner/merge-land.test.mjs:64` races Land with `git update-ref` through goal-check's `/bin/sh -c`. This is Q1, and that test fails `npm test` under the spy until Q1 is answered.
  - 18 entries blamed `src/holder-lock/hot-guard.mjs`. The cause was a frame regex that did not accept `[as execFileSync]`; it is fixed, and a rerun of `dispatch-confinement-blind` plus `merge-land` recorded only the goal-check entry.

## Owner questions (five-part form)

**Q1 — Commands from configuration or consumer data.**
1. *What is happening.* 32 spawn sites run a binary from an env variable or config (`FGOS_HOST_BIN`, `FGOS_CLAUDE_COMMAND`, bwrap/provider executables). The goal-check shell also runs an item's declared `verify` command. The scan reports these as class `configured-binary`, not as product writers.
2. *Cause.* By data flow they can be `git`: an operator could set the variable, or an item could declare `verify: git commit -am x`. But the command is the operator's or consumer's, not product code.
3. *Options.*
   - (a) Keep the named class, reported and counted, with no runtime guard. This costs nothing.
   - (b) Additionally refuse, at the spawn, a configured binary whose basename is `git`. This is about 10 lines in a shared resolver; it still lets `sh -c 'git …'` through.
   - (c) Count them as sites. The census then never empties; this blocks phase 08.
4. *Recommendation.* (a) now, (b) as a follow-up item. A verify command that runs Git is the consumer's own choice inside their checkout.
5. *Scope of the answer.* Only the classification of env/config/declared-command binaries. It does not cover the unresolved host-binary or process-primitive rows, which stay sites.

**Q2 — `main-checkout-reset`.**
1. *What is happening.* The verb still runs `git reset --hard` (plus `rev-list`/`log`) under the main-checkout lock.
2. *Cause.* SafeRestore deliberately refuses discarding commits or local changes on the main checkout (`restore-discard-requires-producer`, `packages/git/rust/src/restore.rs:179`). It also requires the target to descend from HEAD unless discarding. A confirmed backward reset is this verb's purpose.
3. *Options.*
   - (a) Add an operator-confirmed main-checkout discard to SafeRestore: main 50 held, old HEAD pinned, delta snapshotted, a `confirmedBy` field. This is Git port work, about 60–100 lines in Rust plus conformance tests.
   - (b) Narrow the verb to forward resets and refuse the rest by name. This removes the site today, but users lose the confirmed backward reset that AGENTS.md tells sessions to use.
   - (c) Delete the verb.
4. *Recommendation.* (a). It keeps the safe door AGENTS.md promises and adds the snapshot the old path never had.
5. *Scope of the answer.* SafeRestore's main-checkout rule and this one verb.

**Q3 — Shipped skill scripts that run Git in consumer projects.**
1. *What is happening.* distill (11 calls including `pull --ff-only`) and instruction-audit (one `check-ignore`) start `git` from copies installed into other projects.
2. *Cause.* No fgOS payload or addon is reachable from those copies, and no `fgos` verb exposes Git reads. distill also needs a commit log listing, a diff stat and a fast-forward that Inspect lacks.
3. *Options.*
   - (a) Add a public read-only `fgos git inspect <method> --json` verb. This is about 60–100 lines, plus about 150–250 in Rust for distill's missing operations and a fast-forward on Sync/Remote.
   - (b) Add a named class "portable skill script". This contradicts §12, and `pull` is a write.
   - (c) Rewrite instruction-audit's ignore check in plain JS and hand distill's Git steps back to the agent. The gitignore semantics would be incomplete, and the skill text would still be a finding.
   - (d) Open an item for (a) and keep both rows as open sites until it lands.
4. *Recommendation.* (d) leading to (a), next to §18 open item 7 (the public Worktree verb).
5. *Scope of the answer.* The two skills and a possible public Inspect verb; no spec law change.

## Separate items noticed (out of scope)

- `test/event-store/door.test.mjs` keeps its own event-argv Git scanner. Once the census is empty it is a subset of V-GATE; Event Store should retarget it onto `scripts/git-one-door-scan.mjs` (L10).
- The installed release host rejects `quiesce-scan --dir`. `fgos events migrate` through that host fails its stop check until a newer release is activated.
- The fgos-gateway would need a trusted fgOS state root to start once it resolves its root through fgos-git.

## Verification (this sandbox)

Wrapper: umask 077, `FGOS_STATE_ROOT`/`FGOS_TEST_FIXTURE_ROOT` private under `/tmp/fgos-work/u20`, `FGOS_HOST_BIN` from `ensureGitAddon`, and `node --test --import=./scripts/lib/test-git-config-guard.mjs --import=./test/helpers/git-spawn-spy.mjs <files>`.

- `node scripts/git-one-door-scan.mjs`: 70 sites, exit 1 (expected, residue above).
- `node --test test/git/one-door.test.mjs`: 2/2.
- **Focused set (1158 tests).** It covered `test/git/*`, architecture, the lexer and its guard users, `test/distribution/*`, dev-host, drift check, `test/scripts/*`, setup checks, worktree, preflight, return and knowledge attest.
  - After the fixes, the reruns of the failing files gave 227 pass and 4 fail. All four also fail for reasons outside this change:
    - `runSelectedTests gives the suite a fixture root…`: `/var/tmp` is read-only here;
    - `leaf-notify-drift…`: its fixture has no fence; it is in u15b's baseline list;
    - `linked worktree skips activation owned only by main…`: `resolveMainCheckoutRoot` needs the addon the test's cleared env removes; untouched here;
    - `integration: a real mutant…`: EROFS on the main checkout's `.fgos/locks`.
- CLI set (return, preflight, knowledge, resync, lock-fence, claim, compound): 110/115 in the first run. After the fixture activation and the reset residue, `fgos-claim` plus resync gave 33/33.
- Sub-lanes:
  - `test/scripts/install-git-hooks.test.mjs`: 11/11;
  - `test/scripts/fgos-shell-integration.test.mjs`: 24/24;
  - `test/scripts/sandbox-git.test.mjs`: 1/1;
  - `test/architecture.test.mjs`: 29/29.
- **Rust (sub-lane).**
  - `cargo test --locked -p fgctl --test git_wal_activation_gate`: 2/2 under umask 077, with the `apps/` test extension. Without it, the HEAD test is unchanged.
  - `cargo test --locked -p fgos-distribution`: 57 pass, 2 fail (`workspace::tests::*`, `git-floor-probe-failed: Read-only file system`). These also fail on HEAD.
  - `cargo clippy --locked -p fgos-distribution -p fgctl --all-targets -- -D warnings`: clean.
  - `rustfmt --check` on the touched files: clean. `cargo fmt --all -- --check` reports only `apps/fgctl/src/main.rs`, untouched and already unformatted at HEAD.

**The host must run:**
- `cargo test --workspace && cargo clippy --workspace --all-targets -- -D warnings && cargo fmt --all -- --check`.
- `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p07 build> npm test`. The spy is now preloaded, so this suite fails on the `main-checkout-reset` tests until Q2 is answered and on `merge-land.test.mjs`'s racing verify command until Q1 is answered; that failure is the gate working.
- The quiesce/PID-namespace tests: `migrate-cutover-grant`, the fgctl live-writer-in-linked-worktree branch, `fences-*`.
- fgos-gateway build after applying the `apps/` patch.

## needsWrites

The patch is `outbox/needs-writes-apps.patch`, from the Rust sub-lane; these files were restored to HEAD here:
- `apps/fgctl/tests/git_wal_activation_gate.rs`: the owning test of the gate's linked-worktree scan;
- `apps/fgos-gateway/src/main.rs`, `apps/fgos-gateway/Cargo.toml`, `apps/fgos-gateway/Cargo.lock`: the gateway resolves the main checkout through fgos-git, not `herdr_fgos_common::fgos::repo_root()`.

Status: DONE_WITH_CONCERNS
Summary: V-GATE is built (data-flow scan, runtime spy in `npm test`, nine probes, build-written census, doctor `git-mutation-one-door`). Undeclared sites fell from 89 to 70, but the census is not empty: three owner questions (configured binaries, `main-checkout-reset`, shipped skill scripts) and 64 unresolved binaries remain.
Concerns/Blockers: `npm test` with the spy fails on `main-checkout-reset` until Q2 is answered; the `apps/` changes need the needsWrites patch; doctor `git-mutation-one-door` stays red until the census empties.
Context refs:
- plans/261018-0914-git-component-fgos-git/phase-07-caller-migration-and-one-door.md
- docs/platform/git/spec.md §12
