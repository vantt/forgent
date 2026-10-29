# Independent review: `harden/recheck-new-batch-b` at `db770a620`

Worktree `/home/vantt/projects/forgent-worktrees/harden-batch-b`, 12 commits on `origin/main`. Read-only review; nothing was edited, committed or pushed in the worktree.

## Verdict: CHANGES (small)

Nothing is Critical or High. The trust boundary in the addon's trusted root holds, the retired yaml-doc API has no caller, and the defaults are identical. Two Medium findings each lose operator-facing behaviour that the commit text says is not lost (findings 1 and 2), and the user-visible changes have no CHANGELOG line (finding 3). Each fix is a few lines, or one owner decision.

## Findings

### 1. Medium: `runner-patterns-config` no longer tells a legacy JSON user which retired key to change (`3e1953acd`)

`src/setup/registrations.mjs:490-492` returns `passed: true, "not evaluated"` as soon as any `config-format-legacy-json` finding exists, project or global.

- **What was lost.** The old row called `formatLegacyJsonAdvice`, which read the JSON file and printed `runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead; edit config.json, then run fgos config migrate`. Neither door row gives that replacement: `config-format-legacy-json` only says "run fgos config migrate", and the `config-schema` row names the path without its replacement.
- **Failure scenario.** A project still has `.fgos/config.json` with `runner.patterns.reviewed.maxRounds`. Doctor says to run migrate. `fgos config migrate` refuses, because `migrate.rs` only drops ids listed under `retired` in `migration.v1.json` (today only `lock.predecessorKillWaitMs`) and an unknown key returns `Err` at `migrate.rs:~240`. The user then gets a schema refusal with no hint of the new key. The edit-then-migrate advice existed for exactly this case, and the deleted test was its proof ("honest edit-then-migrate instruction").
- **Second loss.** A project YAML holding a retired pattern key, plus a legacy JSON *global* file, now also skips the retired-key hint for the YAML file.
- **Author's report.** It says the advice "is no longer shown". That is disclosed, but the commit message only says the row "no longer re-derives the legacy JSON failure".
- **Fix.** Drop only the duplicate legacy-format message and keep the retired-key advice. For example: when a legacy finding exists, run `formatLegacyJsonAdvice` only if it finds retired keys, and still run the YAML retired-key loop over the non-legacy findings. Alternatively, move the replacement hint into the migrate refusal. Restore one test that asserts the replacement key text for the legacy-JSON case.

### 2. Medium: removing `dependencies-installed` drops a check that could still fail, and the rationale is wrong (`3697c07c3`)

The commit says the row "always passed" because forgent's `package.json` has no dependencies. But the row read the `package.json` of the **doctored project** (`resolveMainCheckout(cwd)`, where `cwd` is the doctor's `repoRoot`), not fgOS's own.

- **Failure scenario.** On any project using fgOS (mission #1) whose `package.json` declares dependencies and has no `node_modules`, doctor used to fail with `missing from node_modules: … — run npm install`. Now the row is gone and nothing says so.
- **Is removal right?** Arguably yes: policing a user project's npm install is outside fgOS's scope, and the row was meant for fgOS's own dependencies. But it is a user-visible change that the stated reasoning hides.
- **Fix.** Correct the reasoning in the report and the CHANGELOG ("doctor no longer checks a project's node_modules"). Also make sure the install gate (AGENTS.md: a new infra dependency registers a doctor check) is still enforced when fgOS next takes an npm dependency; the author's docs item 2 already proposes the knowledge-doc line. Owner decision: accept the removal as scoped, or keep it as an fgOS-own-payload check.

### 3. Medium: user-visible changes have no `## [Unreleased]` line (whole branch)

`CHANGELOG.md` is not under `docs/`, and AGENTS.md requires a line for user-visible changes. Four are missing:

- `fgos config show` and `explain` now include a PATH-detected `runner.executor` (`9a26ee453`);
- the `dependencies-installed` row is gone;
- `runner-patterns-config` passes "not evaluated" on legacy JSON;
- Windows processes print a `config-platform-unsupported` warning.

The author lists these as "docs lines needed" because docs are frozen. Confirm whether the freeze covers CHANGELOG.md; if it does not, add the lines in this branch.

### 4. Low: the `config-platform-unsupported` warning text is wrong for three of six entries (`9013ee20b`, `src/config/facade.mjs:45-48`)

The warning is once per process, not per read (module flag `platformWarned`). That is quiet enough, with one caveat: every short-lived Node child on Windows (hooks, runner children) prints one `(node:PID) Warning:` line on stderr.

The problem is the text. It fires on whichever entry refuses first, including `check`, `fix` and `init`. Those refuse with the same id (keyword `write`) and do not fall back to a default; doctor's config rows fail. If the first call in a process is `fgos doctor`'s check, the warning "readers that keep a fail-closed value use their default" is misleading.

Fix: emit only from the `snapshot` entry, or word it neutrally ("this platform cannot read config files (Unix only)").

### 5. Low: "one home rule for every snapshot builder" is not yet true (`8bcedcd94`)

- `apps/fgos/src/wiring/mailbox_config.rs:113-141` is still a snapshot builder. It reads only `HOME`, so Windows has no USERPROFILE fallback, and it builds its own `Schemas::bundled()`/`Standard::bundled()` on every call instead of using `machine::context`. That is the same private-bundle pattern `9a26ee453` retired from the provider.
- The author disclosed this as MAIL-owned. Per L10 / design principle 1, open a follow-up item for it.
- The commit says "like the CLI and Node do", but Node's `os.homedir()` falls back to the passwd entry when `HOME` is unset (and to `HOMEDRIVE`+`HOMEPATH` on Windows). Rust refuses `home-unset` in that case. The difference predates this branch; the wording overstates the alignment.
- Behaviour deltas I verified:
  - Unix: a blank `HOME` now refuses in `project_snapshot` and the gateway, where it used to resolve a relative `.fgos`. This is an improvement.
  - Gateway: it moved from `var_os` to `var`, so a non-UTF-8 `HOME` now means "no home" (rare; disclosed).
  - Windows: `project_snapshot` (work-state gate-bypass, herdr settings) now reads `USERPROFILE` instead of `HOME`. This matches Node's `os.homedir()`.
- `apps/fgos-gateway/src/gateway.rs:72` still says "could not resolve $HOME"; on Windows the variable is USERPROFILE.

### 6. Low: the removed addon memo moves cost onto every Node config read (`07635f4ef`)

Every `readConfig`/`checkConfig` with a project root now runs `GitDriver::new`, which costs about five stat/canonicalize calls (state root trust check plus hooks dir mode and emptiness). It then runs `resolve_topology`: a walk up from the project and, from a linked worktree, the `.git` pointer, `commondir` and `gitdir` reads, plus one `read_dir(<common>/worktrees)` and one `gitdir` read **per registered worktree**.

The addon's snapshot cache does not shield this, because the trusted root is computed before the cache lookup (`config.rs:126-131`).

- **Short CLI processes.** These are probably faster overall: the old first read paid `require_floor` (a `git --version` spawn) and `read_repository_facts`, which this route no longer runs.
- **Long-lived processes.** A supervisor or the dashboard, reading config in a loop from a linked worktree on a machine with many worktrees, pays O(worktrees) syscalls per read.
- **Measurement.** Not measured: the addon cannot load outside the test runner from a checkout. If it matters, memoise the result in the Node facade per process for `projectRoot`, or cache `trusted_root_at` keyed on the `.git` entry stamp in the Git crate (its one owner), not in the addon.

### 7. Low: leftovers

- `src/terminal-control/config.mjs:24`: `defaultOf` still hard-codes `retainFailedPaneMs` as a literal `null`. The commit says the defaults "come from the bundled standard", but the snapshot `value` already holds the standard's value, so `readSetting(value.terminal, name)` would remove the last copy.
- `packages/config/contracts/fixtures/registry-defaults.v1.json:88,98,108,118`: the `reason` strings still name `EVENT_STORE_DEFAULTS in src/event-store/config.mjs`, which this branch deletes.
- `packages/yaml-doc/rust/src/edit.rs:611`: the `inline_slot` doc still says "Where an inline comment of the node goes". Its only caller is now the read in `comments_at`.
- `packages/yaml-doc/rust/tests/api_seal.rs` (`dc79704d1`):
  - `the_release_profiles_unwind_so_the_guard_can_catch` now fails on `panic = "abort"` in **any** manifest under `apps/packages/tools/herdr-dashboard`, including crates that never link yaml-doc. That is wider than the invariant it guards. Consider applying it only to manifests that reach `fgos-yaml-doc`, like the sibling pin test does.
  - The walk also picks up untracked local crates under `tools/`.
- Spec drift until the frozen docs land: `docs/platform/yaml-document/spec.md` (signed §5) still lists `insert`/`setInlineComment` and the three removed rule ids, and `docs/platform/config/spec.md` still names `Reason::suggested`/`[setup:suggested]`. The author lists both. Land this branch with, or right after, those lines.
- `test/util/yaml.test.mjs` retired its no-addon case and names `test/git/native-load.test.mjs` as the owner. That test proves the loader refuses; the yaml-door "no JS fallback" property is held by `test/architecture.test.mjs`'s no-parser-import guard. Name both in the header comment. The identical case in `test/config/facade.test.mjs:119` was kept, which is inconsistent but harmless.

## What I verified

- **07635f4ef, linked-worktree trust.** `trusted_root_at` → `trusted_root` → `resolve_topology(path, path)` is the same topology function the old `resolve_repo(project, project)` ran first (`packages/git/rust/src/driver.rs:322-330, 417-483, 1598-1637`). The main checkout comes from the reciprocal `commondir` and `gitdir` registration, never from the worktree's own `.git` content alone. A forged pointer is `untrusted-worktree` and a gitfile main is `trusted-main-gitfile-unsupported`. A linked worktree therefore still cannot supply its own `command` values. `test/config/config-door.test.mjs` "a linked worktree takes command values from the main checkout" passes.
- **07635f4ef, refused repositories.** For a repository the Git floor refuses, or whose config `check_config` refuses, Node config reads now succeed, which matches the CLI provider. They read YAML files only, so the Git floor guards nothing here. Unchanged: `GitDriver::new` still requires `git` on PATH (`git-unavailable`) and a trusted state root, and creates the state root if absent. Config reads therefore still fail on a machine with no git; that predates this branch (question 3).
- **9a26ee453, `fgos config show` output.** It changes for exactly one key. `PathDetectors::detect` answers only `runner.executor` (`packages/config/rust/src/detect.rs:103-115`), and only when no layer and no standard hold it (`snapshot.rs:362-369`). `show` and `explain` now include it with provenance `detected`, as spec §8 and line 229 require. I found no other effect on the write verbs or `check`: redundancy (`write.rs:294-306`, `migrate.rs:240-250`, `doctor.rs:211`) compares only with the standard, never the detected layer. The `apps/fgos/tests/cli_tests.rs` config cases all use `--path` on other keys. I did not run them (the crate is outside the allowed list).
- **5e944a8fb, no caller.** `rg` over the whole worktree for `set_inline_comment|setInlineComment|insert_inner|apply_insert|sanitize_inline|inline-comment-*|Position::` finds only plans, archive reports and the frozen spec. Dependents of `fgos-yaml-doc`: node-addon, config, host-runtime, gateway, herdr-dashboard, fuzz. None calls `.insert(`/`Position`/`set_inline_comment`. I also compiled the uncompiled fuzz crate in a scratch copy with a stub `libfuzzer-sys` macro, patched to the vendored parser: `cargo check --bins` (parse, edit_reparse, merge, seed) is clean. The op remap (7 → 4; comment-block op 2 keeps its value-unchanged assertion) is consistent with `OPS` and `seed.rs`.
- **77581731b, defaults.** `core/config-standard/eventStore.yaml` holds remote `origin`, seal 300/30, sync 300, rebuild 5, identical to the deleted `EVENT_STORE_DEFAULTS`. `terminal.yaml` holds grace 60000, retain null, even-split/80/20/8, identical to `DEFAULT_TERMINAL_CONFIG`. In `readEventStoreConfig`, the fallback `eventStoreConfig({})` inside the refusal catch is only reached after the door loaded, and `standardValue` reads no file, so on Windows the fallback still works.
- **3e1953acd, wiring.**
  - `bin/fgos.mjs:4213-4220` creates one run per doctor invocation after `runFixes`, and `registerCheck` passes `run` through and turns a throw into a failed row.
  - `run.once` caches errors too, so a door failure fails all 17 config rows plus the patterns row with one message.
  - Apart from findings 1 and 2, no fail or warn condition is lost: global legacy JSON is covered by `config-format-legacy-json` ("project or global"), and door-level throws now fail the row instead of being parsed.
- **Tests retired.** Each retired test names an owner or a removed behaviour in the author's table. I checked `resolveExecutorEnv` (dispatch.test), `provider-capacity.test.mjs:73` for `config-accounts-unavailable-confined` (producer `provider-capacity.mjs:631`), and `native-load`. I found no weakened assertion on a surviving behaviour beyond finding 1. The 13 converted `insert` → `set-new-key-*` fixtures keep the new-key layout cases.
- **Codes and leftovers.** No plan IDs or finding codes in added lines or commit messages (regex scan of `git log` bodies and `+` lines). No `envPatch`, `resolveEnvPatch`, `require_accounts`, `Reason::suggested`, `stamp_of`, `MEMO_SLOTS` or `DEFAULT_TERMINAL_CONFIG` left in code. One stale `dependencies-installed` title remains in `scripts/check-decision-codes.baseline.json:227`; it predates this branch and the author disclosed it.
- **Tests run (focused only).**
  - Node `runChosenTests` on facade, config-door, config-checks, checks-doctor-config, registrations, checks, event-store verbs, terminal client-route, provider-adapter and util/yaml: 255 tests, 254 pass. The 1 fail is the known Data Dictionary #7. No ERROR lines.
  - Rust: `cargo test -p fgos-yaml-doc`, `-p fgos-config --features host-provider` and `-p fgos-node-addon` all pass.
  - `cargo clippy -D warnings` on those three crates is clean (only the vendored arraydeque lints).

## Unresolved questions

1. Does the docs freeze cover `CHANGELOG.md`? If not, finding 3 should be fixed in this branch.
2. Owner decision for finding 2: should fgOS doctor check a user project's `node_modules` at all? (Recommendation: no, but say so in the CHANGELOG.)
3. Pre-existing and outside this branch: Node config reads need a `git` binary on PATH and a trusted state root because `trusted_root_at` builds a full `GitDriver`. Should the disk-only topology check stop requiring them? A non-repository project on a git-less machine cannot read its config today.
4. Finding 6: is any long-lived process reading config in a loop from a linked worktree? If so, a memo belongs in the Git crate's topology door.

Status: DONE_WITH_CONCERNS
Summary: No critical or high defects. The trust boundary holds, the retired API has no caller (fuzz crate compile-checked), the defaults are identical, and the focused Node and Rust suites plus clippy are green apart from the known red test. Verdict is CHANGES for two Medium operator-facing losses (the retired-key advice for legacy JSON, and a mis-justified doctor row removal) and the missing CHANGELOG lines.
Concerns/Blockers: Landing still depends on the frozen docs lines (Data Dictionary #7, yaml-document and config spec drift).
