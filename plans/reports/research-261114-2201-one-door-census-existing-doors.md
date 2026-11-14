# One-door census of the existing doors

Date: 2026-11-14. Repo state: origin/main 781537524. Read-only research; no code changed.

## 1. Summary

The owner's premise needs one correction. Git is not the only door with a mechanical guard. Three more have a test today: process facts (`test/process/one-door.test.mjs`), YAML (`test/architecture.test.mjs:1278-1332`) and the holder-lock capability (`test/holder-lock/driver-unavailable.test.mjs:110`). All three are partial: they scan Node under `src/` and `bin/` (or JS imports only), none scans `scripts/`, none scans Rust.

I checked 17 jobs (section 4). Nine are clean or have only documented or legitimate second paths; the rest have at least one second path that no document names. The worst leaks are second choosers and second writers:

1. A hand-written YAML frontmatter parser and writer (`src/report/frontmatter.mjs`) still serves 9 callers, although YAML has one door.
2. Persona (agent definition) lookup has four more choosers with different tier orders than the door.
3. The global `~/.fgos` directory is chosen in 9 places; the project root is walked up by a second Rust resolver.
4. `activation.json`, the most critical record, is written by a private tmp+fsync+rename in `init.rs`, not by Durable File.
5. Seat Binding config is digested by a private `canonicalJson` copy.

Recommended order of work is in section 5. The proposed `doors` rows are in section 4. The rows need two things the planned shape lacks (section 6).

## 2. Method

Product file set, built the way the planned guard builds it: `git ls-files bin src scripts apps packages .githooks`, extensions `.mjs .js .cjs .rs .sh .ps1`, excluding `*.test.mjs`, any `test/`, `tests/`, `fixtures/`, `third-party/`, `upstreams/`. That is 867 files (387 Rust, 480 other). The repo has no root `crates/` directory; `apps/fgos-gateway` is scanned as part of `apps/`; `herdr-dashboard/` is outside the scanned list.

Scan helper (scratch, not committed): a Python script that applies a regex per line to that file list, drops pure comment lines, and for Rust marks lines after the first `#[cfg(test)]` as test code. Equivalent shell: `git ls-files ... | grep -E '\.(mjs|js|cjs|rs|sh|ps1)$' | grep -Ev '\.test\.mjs$|(^|/)(tests?|fixtures|third-party|upstreams)/' | xargs rg -n -e '<pattern>'`. Every pattern is quoted under its door below. Proposed row patterns were re-run against the file list; the `allowed` files in section 4 are the files that match today.

What this method misses: a leak that uses a different spelling than the pattern (for example `procRoot = '/proc'` passed as a parameter in `scripts/lib/test-file-watchdog.mjs:107` escapes the `/proc/` pattern); data-flow leaks (a path built in one file and read in another); prose-only rules; and anything in `.claude/skills/*` scripts (skills with `oneDoor: standalone` are outside the boundary by owner decision 2026-10-20). I did not run `scripts/git-one-door-scan.mjs`, so I have no current Git site count.

## 3. Existing mechanical guards (all that I found)

| Guard | What it covers | Gap |
|---|---|---|
| `scripts/git-one-door-scan.mjs` + `packages/git/contracts/mutation-census.v1.json`, `test/git/one-door.test.mjs`, `test/setup/git-mutation-census.test.mjs` | every spawn that can run `git` or a hook, Node and Rust | none for this report |
| `test/process/one-door.test.mjs` | `process.kill(` and `/proc/` under `src/` and `bin/`; comments stripped; allowlist with a reason per file and a staleness check | no `scripts/`, no Rust, no `child.kill`, no `ps`, no `kill -` in shell |
| `test/architecture.test.mjs:1278-1332` | any JS import, `import()`, `require()` or `createRequire` of a YAML parser; any bundled js-yaml copy | no Rust crate check, no hand-written parser |
| `test/holder-lock/driver-unavailable.test.mjs:110-140` | runtime: a second `holderLock.take()` is refused; source scan: only the facade calls `holderLock.take(` | does not cover `link()` locks, `flock` in other Rust files, lease protocols |
| `test/architecture.test.mjs` layers, tiers (`tierExceptions`), domain siloing, custody naming, import-graph tests | import direction, not jobs | a leaf that re-implements a job without importing anything passes |
| `scripts/export-command-selectors.mjs --check`, `npm run build:skills` | drift of generated files from their source | not about duplicated logic |

Everything below is a gap that none of these guards sees.

## 4. Door by door

Legitimacy codes: LEGIT = test, example, fixture or tooling that is allowed by owner decision; DOC = a documented twin or accepted duplication; LEAK = no document names it.

### 4.1 Process facts and control

Door: Rust crate `fgos-process` (`packages/process/rust`), Node client `src/native/process-identity.mjs` over `src/native/door.mjs`. Spec: `docs/platform/process/spec.md` lines 79-92 ("no /proc read and no process.kill" in Node).

Searches (`xargs rg` over the product list): `/proc/(?:self|sys|net|\{|\$|\d|loadavg|meminfo)|["']/proc["']`; `process\.kill\(|libc::kill(?:pg)?\(|\bkillpg\(|GenerateConsoleCtrlEvent|\bTerminateProcess\(|Command::new\("(?:kill|taskkill|pkill)"\)`; `GetProcessTimes|\bOpenProcess\(|ns_last_pid|pbi_start`; plus `isPidAlive|pidExists|kill\([^)]*,\s*0\)`; plus `['"]ps['"]|\bps -|pgrep|\blsof\b`.

Node under `src/` and `bin/`: clean. The only `process.kill(` are the two allowlisted files (`src/holder-lock/index.mjs:442`, `src/runner/dispatch/provider-credential-probe.mjs:150`), and `/proc` is read only in `src/run-supervisor/runtime-dir.mjs:58` (`/proc/net/unix`) and as bwrap arguments.

Second paths:

| Where | What | Verdict |
|---|---|---|
| `scripts/run-tests.mjs:269-273` | scans `/proc/*/cmdline` for stray processes | LEGIT tooling, but a reader |
| `scripts/run-tests.mjs:516` | `process.kill(pid, 'SIGKILL')` by bare pid taken from that scan, no identity check | LEAK, second killer; pid reuse can hit another process |
| `scripts/lib/test-file-watchdog.mjs:92,107-137` | `process.kill(pid, 0)` liveness, `/proc` scan, `ps -A`, SIGKILL by bare pid at 120 and 137 | LEAK, second judge and second killer |
| `scripts/lib/test-file-cpu.mjs:14` | `/proc/self/stat` | LEGIT tooling |
| `scripts/stress-test-files.mjs:93`, `scripts/test-select-coverage-map.mjs:272` | kill the process group of their own child | LEGIT |
| `scripts/lib/mailbox-live-confined.mjs:364-432`, `scripts/lib/mailbox-live-cli.mjs:216-228`, `scripts/record-mailbox-hook-fixtures.mjs:392-428,869-901` | read `/proc/<pid>/{stat,ns/pid,cwd,exe,cmdline}`; `mailbox-live-confined.mjs:432` SIGKILLs by pid | LEGIT live probes and fixture recorders; the kill is bare-pid |
| `scripts/git/p-space-resource.mjs:42,137-140`, `scripts/git/e3-bench.mjs:667`, `scripts/git/e1-power-cut.mjs:362`, `scripts/event-store/power-loss.sh:112-114` | benches read `/proc`, `kill -STOP/-KILL` | LEGIT benches |
| `packages/holder-lock/rust/src/route.rs:656` | `same_user`: `/proc/{pid}` metadata uid | LEAK, reader (a process fact) |
| `packages/holder-lock/rust/src/origin.rs:119` | `/proc/{pid}/comm` | LEAK, reader |
| `packages/holder-lock/rust/src/driver/flock.rs:181,433,407,621,696` | `/proc/self/fd`, `/proc/<pid>/fdinfo` holder discovery, a `/proc` scan, `/proc/<pid>/stat` parent and group (parsed with `fgos_process::facts::parse_relation`, read locally) | DOC for holder discovery (the holder-lock spec: "who holds it as the kernel reports"), LEAK for the stat read at 696 |
| `packages/holder-lock/rust/src/driver/flock.rs:732`, `port.rs:1304` | `libc::killpg` of its own spawned child group | DOC-like (own child), not named in the process spec |
| `packages/holder-lock/rust/src/helper.rs:101-149`, `route/hold.rs:459-548`, `borrow_vectors.rs:440-449` | Windows `OpenProcess` and `GetProcessTimes` to read a start time | LEAK, a second Windows start-time reader beside `platform/windows.rs` |
| `packages/git/node-addon/src/single_load.rs:24,43-54` | start time from `/proc/self/stat` (Linux), `GetProcessTimes` (Windows), `pbi_start` (macOS) for the single-load marker name | LEAK, third start-time reader of "this process" |
| `packages/git/rust/src/worktree.rs:580` | `/proc/{pid}/comm` after `observe(pid)` | LEAK, reader |
| `packages/terminal-control/rust/src/driver/herdr.rs:992` | opens `/proc/{shell_pid}/fd/0` to get a pane's tty | LEAK, reader (tty of a process) |
| `packages/git/rust/src/wal.rs:84-88,1197` | `/proc/self/fd/<n>` to name an open file | LEGIT, not a process fact |
| `packages/run-supervisor/rust/src/gate/unix.rs:741,750,759,821`, `gate/windows.rs:287`, `steps.rs:356,370` | `killpg`, `kill(-1)`, `GenerateConsoleCtrlEvent` | DOC: the launch gate is pid 1 of the domain and enforces the hard ceiling on its own clock (component-boundary row "Launch gate"); `steps.rs` kills a step group |
| `src/runner/dispatch/confinement/probes/harness.mjs:80-512` and `drivers/bwrap.mjs:578,680` | `--proc /proc` bwrap arguments, `ls /proc/$$/fd` | LEGIT, not a read of process facts |

Proposed rows:

```json
{ "job": "process facts: read /proc", "patterns": ["/proc/(?:self|sys|net|\\{|\\$|\\d|loadavg|meminfo)", "[\"']/proc[\"']"],
  "allowed": ["packages/process/rust/src/platform/linux.rs", "packages/process/rust/src/containment/linux.rs", "src/run-supervisor/runtime-dir.mjs", "src/runner/dispatch/confinement/drivers/bwrap.mjs", "src/runner/dispatch/confinement/probes/harness.mjs", "packages/git/rust/src/wal.rs", "packages/holder-lock/rust/src/driver/flock.rs", "packages/mailbox/rust/store/examples/mailbox-record-cost.rs", "scripts/ci-setup-bwrap.sh"],
  "debt": ["packages/holder-lock/rust/src/route.rs", "packages/holder-lock/rust/src/origin.rs", "packages/git/rust/src/worktree.rs", "packages/git/node-addon/src/single_load.rs", "packages/terminal-control/rust/src/driver/herdr.rs", "scripts/run-tests.mjs", "scripts/lib/test-file-watchdog.mjs", "scripts/lib/test-file-cpu.mjs", "scripts/lib/mailbox-live-cli.mjs", "scripts/lib/mailbox-live-confined.mjs", "scripts/record-mailbox-hook-fixtures.mjs", "scripts/git/e1-power-cut.mjs", "scripts/git/e3-bench.mjs", "scripts/git/p-space-resource.mjs"],
  "reason": "only fgos-process judges a process; holder-lock reads fdinfo for lock holders; tooling is listed as debt so it is visible" }
{ "job": "process control: signal a process or group", "patterns": ["process\\.kill\\(", "libc::kill(?:pg)?\\(", "\\bkillpg\\(", "GenerateConsoleCtrlEvent", "\\bTerminateProcess\\(", "Command::new\\(\"(?:kill|taskkill|pkill)\"\\)"],
  "allowed": ["packages/process/rust/src/containment/linux.rs", "packages/process/rust/src/containment/pgroup.rs", "packages/process/rust/src/control.rs", "packages/process/rust/src/mapped.rs", "packages/process/rust/src/platform/linux.rs", "packages/process/rust/src/platform/windows.rs", "packages/process/rust/src/platform/windows_job.rs", "packages/process/rust/src/platform/windows_spawn.rs", "packages/run-supervisor/rust/src/gate/unix.rs", "packages/run-supervisor/rust/src/gate/windows.rs", "packages/run-supervisor/rust/src/steps.rs", "packages/holder-lock/rust/src/driver/flock.rs", "packages/holder-lock/rust/src/port.rs", "packages/git/rust/src/driver.rs", "src/holder-lock/index.mjs", "src/runner/dispatch/provider-credential-probe.mjs"],
  "debt": ["scripts/run-tests.mjs", "scripts/lib/test-file-watchdog.mjs", "scripts/lib/mailbox-live-confined.mjs"],
  "reason": "signal by identity goes through fgos-process; the gate, holder-lock and one Node probe kill only their own child group (packages/git/rust/src/driver.rs matches only inside a test module, drop it if the guard skips cfg(test))" }
{ "job": "process identity: start time, boot id, pid namespace", "patterns": ["GetProcessTimes", "\\bOpenProcess\\(", "ns_last_pid", "pbi_start"],
  "allowed": ["packages/process/rust/src/platform/linux.rs", "packages/process/rust/src/platform/macos.rs", "packages/process/rust/src/platform/windows.rs", "packages/process/rust/src/platform/windows_job.rs"],
  "debt": ["packages/holder-lock/rust/src/helper.rs", "packages/holder-lock/rust/src/route/hold.rs", "packages/holder-lock/rust/src/borrow_vectors.rs", "packages/git/node-addon/src/single_load.rs"],
  "reason": "one reader of a process start time per platform" }
```

### 4.2 YAML

Door: `fgos-yaml-doc` (`packages/yaml-doc/rust`), Node `src/util/yaml.mjs` `parseYaml`. Spec: `docs/platform/yaml-document/spec.md`; supersession of the vendored js-yaml traced with `git log -S'RUL108'` (d309519fa, 53bc71d32, 5820e1a43).

Searches: `serde_yaml|saphyr|yaml_rust|serde_yml`; `parseYaml|js-yaml|require\('yaml`; `frontmatter|front-matter|FRONTMATTER|\^---`; `indexOf\(':'\)`; Cargo deps through `rg 'yaml' --glob Cargo.toml`.

Parser dependencies are clean: `saphyr-parser` is vendored and only `fgos-yaml-doc` (`packages/yaml-doc/rust/src/backend.rs`) uses it; several crates and Node call the door. Every `parseYaml` caller goes through `src/util/yaml.mjs`.

Second paths:

| Where | What | Verdict |
|---|---|---|
| `src/report/frontmatter.mjs:57-98` | hand-rolled flat YAML frontmatter parser (`key: value`, `[a, b]` arrays) and `renderFrontmatter` writer; header says "Deliberately hand-rolled ... fgOS has zero dependencies today" | LEAK. A second parser and a second writer of a YAML subset. The premise in its header (no dependency) is stale because the YAML door exists. Callers: `bin/fgos.mjs:2783`, `scripts/check-decision-citation-drift.mjs:235`, `scripts/check-decision-supersession.mjs:123`, `scripts/knowledge-classifier.mjs:44`, `scripts/knowledge-migration.mjs:275`, `src/report/enduser-index-generate.mjs:68`, `src/report/knowledge-lints.mjs:62`, plus `renderFrontmatter` in `knowledge-migration.mjs` |
| `src/setup/skill-wrappers.mjs:27,86,241` | its own `FRONTMATTER_PATTERN` and `extractFrontmatter`; line 241 reads `version:` from the YAML block with a regex | LEAK, second reader |
| `src/setup/instruction-registry.mjs:94` | own frontmatter regex, then `parseYaml` | DOC-like: the regex only cuts the block, the parse goes through the door |
| `scripts/lib/git-spawn-match.mjs:85` | same, cut by regex then `parseYaml` | LEGIT |
| `scripts/project-agents.mjs:170-175` | writes agent frontmatter lines by string join | LEAK, small second writer (generates `.claude/agents`) |

Proposed row (retired-name style: current callers are listed as debt until moved):

```json
{ "job": "YAML text parsing and writing", "patterns": ["\\b(?:parseFrontmatter|renderFrontmatter|extractFrontmatter)\\(", "saphyr_parser::", "serde_yaml::", "yaml_rust::"],
  "allowed": ["packages/yaml-doc/rust/src/backend.rs"],
  "debt": ["src/report/frontmatter.mjs", "bin/fgos.mjs", "scripts/check-decision-citation-drift.mjs", "scripts/check-decision-supersession.mjs", "scripts/knowledge-classifier.mjs", "scripts/knowledge-migration.mjs", "src/report/enduser-index-generate.mjs", "src/report/knowledge-lints.mjs", "src/setup/skill-wrappers.mjs"],
  "reason": "only fgos-yaml-doc decides what YAML means; the frontmatter helper retires into the door" }
```

### 4.3 Locks

Door: `fgos-holder-lock` (`packages/holder-lock/rust`), Node facade `src/holder-lock/index.mjs`. Spec: `docs/platform/holder-lock/spec.md` (sections 1, 15).

Searches: `libc::flock|LockFileEx|F_OFD_SETLK|F_SETLK|CreateMutexW|File::lock\(|try_lock_(?:shared|exclusive)\(|fs\.linkSync\(`; `'wx'|O_EXCL|create_new\(true\)`; `\.lock['"\`]|lockPath|acquireLock|withLock`; `Resource::new\(`; `holder-lock/(driver|hold-transport|protocol|registry|native-handover|hot-guard|state-root)` imports.

Kernel lock primitives outside holder-lock: only `packages/git/node-addon/src/single_load.rs:73,146` (a Windows mutex and a Unix `flock` for the single-load marker). Every other Rust lock goes through `Resource::new` (distribution, event-store, observe, run-supervisor, `apps/fgos/src/wiring/mailbox_body.rs:159`, git). Node imports of holder-lock internals are `hot-guard`, `state-root`, `native-handover`, `registry`, `driver` (`doorKillWaitMs`); none takes a lock.

Second paths:

| Where | What | Verdict |
|---|---|---|
| `src/state/hot-lock.mjs:168-178,217,278,331` | the state store's hot mutex: record written to a temp file, `link()` onto `locks/<resource>.hot`, unlink to release, reclaim under a kernel lock | DOC (holder-lock spec section 15, `packages/holder-lock/contracts/hot-lock.v1.json`); Node-only, Rust refuses `hot-mutex` without the hot-state port (`scope.rs:132`) |
| `src/run-supervisor/run-lock.mjs:246` and callers (`assignment-runner.mjs`, `run-admission.mjs`, `recovery-planner.mjs`, `settlement.mjs`, `unit-control.mjs`, `recover.mjs`) | generation and control-epoch lease records over `installOnce`, reclaim only when `resolveHolderLiveness` says dead | DOC (runtime-recovery design cited in its header); a lease protocol, not a kernel lock |
| `packages/git/node-addon/src/single_load.rs:73,146` | single-load marker | LEAK, low: a kernel lock outside holder-lock for a non-registry purpose |
| `packages/git/rust/src/native_lock.rs:481,534,644,965` | `create_new` and `hard_link` lock files compatible with Git's own `*.lock` | LEGIT, part of the Git door |
| `packages/event-store/rust/src/append.rs:270-277` | `create_new` for the append file, under the `event-append` holder-lock | LEGIT |
| `packages/distribution/rust/src/git_gate.rs:232` vs `init.rs:269-273`, `lock.rs` | two spellings of the activation fence: `.fgos/locks/activation.lock` (a directory with `TOMBSTONE`) and `activation-v2.lock` (a holder-lock file); `init.rs:203,258` migrate the old form | DOC-like transition; the benches still build the old form (`scripts/git/e1-power-cut.mjs:59,92`, `e3-bench.mjs:58`, `p-space-resource.mjs:55`, `scripts/event-store/forge-probe.sh:38`, `power-loss-driver.mjs:41`, `v-spawn-bench.mjs:107`) |

Proposed row:

```json
{ "job": "kernel lock primitive", "patterns": ["libc::flock", "LockFileEx", "F_OFD_SETLK", "F_SETLK", "CreateMutexW", "File::lock\\(", "\\.try_lock_(?:shared|exclusive)\\("],
  "allowed": ["packages/holder-lock/rust/src/driver/flock.rs", "packages/holder-lock/rust/src/driver/mod.rs", "packages/holder-lock/rust/src/driver/windows.rs", "packages/holder-lock/rust/src/route/hold.rs", "packages/holder-lock/rust/src/borrow_windows.rs", "packages/run-supervisor/rust/src/adopt.rs", "packages/run-supervisor/rust/src/supervise.rs", "src/holder-lock/driver.mjs", "src/holder-lock/hold-transport.mjs"],
  "debt": ["packages/git/node-addon/src/single_load.rs"],
  "reason": "a kernel lock is taken only through holder-lock (several allowed files match only in comments that name LockFileEx)" }
{ "job": "link-based hot mutex", "patterns": ["fs\\.linkSync\\("], "allowed": ["src/state/hot-lock.mjs"], "reason": "the documented hot mutex of the state store; no other file may publish a lock by hard link" }
```

### 4.4 `.fgos` paths, project root, global directory, state root

Doors: invocation root `resolveInvocationRoot` in `src/runner/paths.mjs:145` (spec: `docs/platform/host-invocation-routing/spec.md` "Project root of a Node-payload verb"); native host walk `resolve_target_root` in `apps/fgos/src/cli_projector.rs`; state root `src/holder-lock/state-root.mjs` over `packages/holder-lock/rust/src/state_root.rs`; global directory `~/.fgos` owned by Config (`packages/config/rust/src/machine.rs`, `docs/platform/config/spec.md`).

Searches: `['"\`]\.fgos['"\`/]|\.fgos/` (about 55 Node files and 40 Rust files join `.fgos`; joining a path under a known root is normal and is not the leak); `join\("\.fgos"\)\.is_dir\(\)`; `homedir\(\)\s*,\s*['"]\.fgos['"]|fn home_dir\(`; `XDG_STATE_HOME|XDG_RUNTIME_DIR|HOME|USERPROFILE`; `cwd\(\)[^;]*\.fgos`.

The state root is clean: Node never computes it (`state-root.mjs` header: "Node never computes the root from HOME/XDG itself"). Nothing joins `process.cwd()` to `.fgos` in product code.

Second paths:

| Where | What | Verdict |
|---|---|---|
| `packages/work-state/rust/src/lib.rs:56-66` | `resolve_workspace_root` walks up for `.fgos`, falls back to the start path; no home-directory stop, no Git top-level bound | LEAK, second chooser of the project root; the doc names only three readers (Node door, host walk, identity main root) and a fixture table for them |
| `apps/fgos/src/cli_projector.rs:48` | the host walk | DOC (fixture table `test/rust-host/fixtures/invocation-root-table.json`, known difference stated) |
| `src/config/facade.mjs:36`, `src/setup/bin-discovery.mjs:85`, `src/setup/runner-config-conversion.mjs:290`, `src/setup/registrations.mjs:517` | each builds the global directory as `os.homedir()/.fgos` | LEAK, four copies of one chooser; Config owns the global directory |
| `src/runner/dispatch/confinement/backend-registry.mjs:190`, `confinement/resources.mjs:636`, `provider-capacity.mjs:41` | `~/.fgos/confinement-backends.json`, `~/.fgos/credentials`, `~/.fgos/runtime/provider-capacity` | LEAK, three more choosers; the `credentials` and `private` split is a Secrets/Config matter |
| `packages/distribution/rust/src/uninstall.rs:445` | its own `home_dir()` (HOME, then USERPROFILE) while `fgos_config::machine::home_dir` exists and `apps/fgos/src/main.rs:451` uses it | LEAK, second reader |
| `packages/terminal-control/rust/src/driver/herdr.rs:82-90` | `HOME` for herdr's config path | LEGIT, herdr's own directory |
| `packages/identity/rust/src/project.rs:19-20`, `shared.rs:271` | `.fgos/project.json` and `.fgos/cache/...` under the trusted main root | DOC (Identity owns its files; main root is the third reader named in the host spec) |
| `src/setup/agent-hooks.mjs:46,476,546`, `src/setup/managed-timer.mjs:305` | build `.fgos/installation/bin/fgos` by hand | LEAK, see 4.17 |

Proposed rows:

```json
{ "job": "project root by walking up for .fgos", "patterns": ["join\\(\"\\.fgos\"\\)\\.is_dir\\(\\)"],
  "allowed": ["apps/fgos/src/cli_projector.rs"], "debt": ["packages/work-state/rust/src/lib.rs"],
  "reason": "the host walk is the native door; the Node door is src/runner/paths.mjs" }
{ "job": "global fgOS directory", "patterns": ["homedir\\(\\)\\s*,\\s*['\"]\\.fgos['\"]", "fn home_dir\\("],
  "allowed": ["packages/config/rust/src/machine.rs"],
  "debt": ["src/config/facade.mjs", "src/setup/bin-discovery.mjs", "src/setup/runner-config-conversion.mjs", "src/setup/registrations.mjs", "src/runner/dispatch/confinement/backend-registry.mjs", "src/runner/dispatch/confinement/resources.mjs", "src/runner/dispatch/provider-capacity.mjs", "packages/distribution/rust/src/uninstall.rs"],
  "reason": "Config owns where the global directory is" }
```

### 4.5 Atomic and durable file writes

Door: `fgos-durable-file` (`packages/durable-file/rust`), Node `replaceDurably` and `installOnce` in `src/native/door.mjs:105-115`. Spec: `docs/platform/component-boundary.md` row "Durable file (L0 leaf)" (line 88).

Searches: `renameSync\(|fs\.rename\(|fsyncSync\(|fdatasyncSync\(`; `fs::rename|\.sync_all\(\)|\.sync_data\(\)|fs::hard_link|MoveFileEx`; `\.tmp-|\.tmp\b|uniqueTmpTag`; `replaceDurably|installOnce|install_once|replace_durably` for callers. 45 product files match the row pattern.

The boundary row already accepts two things: "Node keeps its per-module no-fsync helpers ... each naming its temporary with `uniqueTmpTag()`", and a short list of Rust supervisor and holder-lock helpers that do not fsync (`supervise.rs`, `adopt.rs`, `supervise/windows.rs`, `route/hold.rs`, `predecessor.rs`).

Second paths (hand-written tmp+rename):

| Where | What | Verdict |
|---|---|---|
| `src/state/hot-lock.mjs:276-278`, `src/runner/worktree.mjs:285-287` | tmp named with `uniqueTmpTag()` | DOC |
| `src/runner/main-checkout-activity.mjs:95-97`, `src/setup/skill-wrappers.mjs:61-64,572-575` | tmp named `.tmp-<pid>-<Date.now()>-<random>` | LEAK against the stated convention: the row says every Node helper names its temp with `uniqueTmpTag()` |
| `src/util/capped-jsonl-log.mjs:19-22`, `src/setup/managed-timer.mjs:352-354` | tmp named `<file>.<pid>.tmp`: two calls in one process share the name | LEAK, same reason, and a weaker name |
| `src/holder-lock/hold-transport.mjs:229-231` | fixed `req-<n>.json.tmp` | LEAK against the convention; the file is owned by one writer so the collision risk is low |
| `src/runner/dispatch/provider-credential-renewal.mjs:872,1152,1237,1363,1376,1473`, `run-admission.mjs:309`, `src/workflow/case-close.mjs:209`, `src/runner/worktree.mjs:329,336` | directory renames used as claim and move steps | LEGIT (copy-then-rename, named "stay" in the row) |
| `src/workflow/store.mjs:121-131,252` | `writeDurably`: append + fsync of the workflow ledger, own `fsyncDirectory` | DOC (RUL-WF-24, workflow spec line 67: the ledger is hardened in place) |
| `src/run-supervisor/run-lock.mjs:44-72` | `fsyncFileBestEffort`, `fsyncDirBestEffort` | LEAK, low: second best-effort fsync helpers beside Durable File |
| `packages/distribution/rust/src/init.rs:548-555` | writes `activation.json`: tmp, `sync_all`, `rename`, directory `sync_all` | LEAK, high: the same job as `replace_durably_with_mode`, which this crate already uses in `shim.rs:190` and `fgctl_refresh.rs:182`; it is the most important record on the machine |
| `packages/event-store/rust/src/rotate.rs:59-71`, `identity.rs:104,166`, `fsio.rs:56` | own fsync and rename; `fsio.rs:78` also calls `replace_durably_observed` | LEAK for `rotate.rs`; `identity.rs:168` uses `install_once` so the fsyncs at 104/166 are probably the parent-dir step, not verified |
| `packages/holder-lock/rust/src/tombstone.rs:59-80` | tmp, file fsync, directory fsync | LEAK (holder-lock sits below or beside Durable File; not named in the accepted list) |
| `packages/distribution/rust/src/store.rs:173-232`, `fgctl_refresh.rs:267-279` | directory renames to stage a release or swap fgctl | LEGIT staging |
| `packages/git/rust/src/{native_lock,repository_config,restore,sequence,objects,wal}.rs` | Git writes its own files with its own durability | LEGIT, Git door |
| scripts: `export-command-selectors.mjs:377`, `git-one-door-scan.mjs:2738`, `lib/git-addon-stage.mjs:49-73`, `run-rust-dev-host.mjs:33`, `knowledge-migration.mjs:299-307`, `lib/codex-auth-guard.mjs:43,67` | tooling tmp+rename | LEGIT tooling |

Proposed row:

```json
{ "job": "durable or atomic file replace", "patterns": ["renameSync\\(", "fs::rename\\(", "\\.sync_all\\(\\)", "fsyncSync\\(", "fs::hard_link\\("],
  "allowed": ["packages/durable-file/rust/src/lib.rs", "src/native/door.mjs"],
  "debt": ["<every product file that matches today, 43 files: see this section; shrink as callers move>"],
  "reason": "only fgos-durable-file orders temp, fsync, install and directory fsync; the listed files are named accepted duplication, Git-owned writes, directory-rename staging or tooling" }
```

The pattern cannot tell a file replace from a directory rename or a log append. This row is a ratchet (it stops the count growing), not proof of one path. A finer row, `activation record write`, would be `activation\.json` with `allowed` = `packages/distribution/rust/src/{init,shim,uninstall,lib,fgctl_refresh}.rs` plus the host's `apps/fgos/src/legacy_exec.rs`; it would show `init.rs:548` as the one writer that does not go through Durable File.

### 4.6 Canonical JSON

Door: `fgos-canonical-json` (`packages/canonical-json/rust`), Node `canonicalJson` in `src/native/door.mjs:98`. Spec: component-boundary row "Canonical JSON (L0 leaf)" (line 89), which lists accepted exceptions.

Search: `(?:function|fn)\s+(?:canonicalJson|stableStringify|sortedJson|canonical_json|to_canonical_json)\b`, plus `Object\.keys\([^)]*\)\.sort\(\)` as a cross-check (this matches many legitimate sorts, so it is not a row).

| Where | What | Verdict |
|---|---|---|
| `src/runner/dispatch/recovery-planner.mjs:63` `stableStringify` | purity contract | DOC (named exception) |
| `src/runner/dispatch/effective-execution-contract.mjs:41` | writes `undefined` members, the door drops them; moving it changes stored hashes | DOC (named exception, comment explains) |
| `scripts/build-rust-distribution.mjs:41` + `packages/distribution/rust/src/verify.rs:46` `to_canonical_json` | release-manifest producer and verifier pair | DOC ("stay together until the Packaging plan moves them as one"); `packages/event-store/rust/examples/distribution_digest_audit.rs` compares it with the JCS form |
| `src/run-supervisor/trust-store.mjs:438` `sortedJson` | must match codex's own byte order | DOC |
| `src/runner/execution/seat-policy.mjs:54` `canonicalJson` | digests the seat config (`seatConfigDigestOf`, line 63) and the account view (line 98); object keys sorted by `Array.sort` | LEAK, not in the accepted list. Sorts by code unit order and handles numbers by `JSON.stringify`, so it matches RFC 8785 only by luck. It sits in Seat Binding's own area |
| `packages/run-supervisor/rust/src/envelope.rs:19` | thin wrapper over the crate that adds a safe-integer check | LEGIT |
| `packages/config/rust/src/relocate.rs:140` `canon` | wrapper over the crate | LEGIT |

Proposed row:

```json
{ "job": "canonical JSON bytes", "patterns": ["(?:function|fn)\\s+(?:canonicalJson|stableStringify|sortedJson|canonical_json|to_canonical_json)\\b"],
  "allowed": ["packages/canonical-json/rust/src/lib.rs", "packages/git/node-addon/src/canonical_json.rs", "src/native/door.mjs", "packages/run-supervisor/rust/src/envelope.rs", "src/runner/dispatch/recovery-planner.mjs", "src/runner/dispatch/effective-execution-contract.mjs", "src/run-supervisor/trust-store.mjs", "scripts/build-rust-distribution.mjs", "packages/distribution/rust/src/verify.rs"],
  "debt": ["src/runner/execution/seat-policy.mjs"],
  "reason": "RFC 8785 bytes come from one crate; each exception is named in the component-boundary row" }
```

### 4.7 Session and writer identity

Door: `fgos-identity` (`packages/identity/rust`), Node facade `src/util/session-identity.mjs`. Spec: `docs/platform/identity/spec.md`; boundary row line 83.

Searches: `FGOS_SESSION_ID|FGOS_PARENT_WRITER_ID|CODEX_THREAD_ID|PI_SESSION_ID|CLAUDE_CODE_SESSION_ID` (21 files); `['"\`]att-`; `randomUUID\(\)|randomBytes\(`.

| Where | What | Verdict |
|---|---|---|
| `src/util/session-identity.mjs:15` | `ENV_ORDER`, a copy of the Rust env order used as a cache key | DOC (comment: "what the rule reads: the cache key"); drifts silently if Rust changes the order |
| `src/run-supervisor/direct-launch.mjs:149-153` `withIdentityEnv` | sets `FGOS_SESSION_ID`, sets or deletes `FGOS_PARENT_WRITER_ID`; does not scrub the other session variables (an env allowlist at line 35 does that) | LEAK, second writer of the launcher env beside `launcher.rs:scrub_and_set` (`packages/identity/rust/src/launcher.rs:49-51`) |
| `src/runner/dispatch/assignment-runner.mjs:421` | writes `FGOS_SESSION_ID="<writerId>"` into codex's `shell_environment_policy.set` | LEAK, a third place that spells the writer variable |
| `src/setup/agent-hooks.mjs:484` | reads `FGOS_SESSION_ID` and tests `startsWith('att-')`, i.e. knows the attempt id format | LEAK, a second reader that parses id shape (Identity owns the shape, `attempt.rs:32`) |
| `src/setup/registrations.mjs:425` | `CLAUDECODE || CLAUDE_CODE_SESSION_ID` to detect Claude | LEAK, low |
| `packages/mailbox/rust/store/src/{hook/resolve.rs,adapters/codex.rs}`, `apps/fgos/src/wiring/mailbox_identity.rs` | mailbox heads read session variables | not read in detail; the mailbox spec says it never owns writer identity, so these should call `fgos-identity`; unverified |
| `scripts/*` (benches, fixtures) | set or delete the variables for runs | LEGIT |

Proposed row:

```json
{ "job": "writer and session id environment", "patterns": ["FGOS_SESSION_ID", "FGOS_PARENT_WRITER_ID", "CODEX_THREAD_ID", "PI_SESSION_ID", "CLAUDE_CODE_SESSION_ID"],
  "allowed": ["packages/identity/rust/src/launcher.rs", "packages/identity/rust/src/resolve.rs", "packages/identity/rust/src/session.rs", "packages/identity/rust/src/directory.rs", "src/util/session-identity.mjs", "src/cli/command-registry.mjs"],
  "debt": ["src/run-supervisor/direct-launch.mjs", "src/runner/dispatch/assignment-runner.mjs", "src/setup/agent-hooks.mjs", "src/setup/registrations.mjs", "packages/mailbox/rust/store/src/hook/resolve.rs", "packages/mailbox/rust/store/src/adapters/codex.rs", "apps/fgos/src/wiring/mailbox_identity.rs", "apps/fgos/examples/mailbox-ident-cost.rs", "scripts/event-store/settle-host-proof.mjs", "scripts/event-store/v-spawn-bench.mjs", "scripts/lib/mailbox-behaviour-run.mjs", "scripts/lib/mailbox-live-cli.mjs", "scripts/record-mailbox-hook-fixtures.mjs", "scripts/regenerate-observe-fixtures.mjs", "scripts/stress-test-files.mjs"],
  "reason": "only fgos-identity resolves a writer and builds the launcher environment" }
```

### 4.8 Id minting

Door: `fgos identity mint` (`packages/identity/rust/src/mint.rs`), Node `src/util/identity-mint.mjs`. Spec: `docs/platform/identity/spec.md` section 4a; `core/instructions/id-minting.md`.

Searches: `Math\.max\([^)]*\)\s*\+\s*1|nextId|nextNumber|highest|padStart\(4|D-ADR|\btsk-`; `mintWorkId|mint_random`; base32 alphabets. Result: no max-plus-one reader, no hand-formatted `D-ADR` outside `mint.rs`. `mintWorkId` callers are `bin/fgos.mjs:790,910`, `src/runner/loop.mjs:762`, `src/verbs/merge/promote-to-component.mjs`. Clean.

Notes: `packages/identity/rust/src/machine.rs:60` keeps its own base32 alphabet beside `text.rs:67` (same crate, one-line copy). Other ids (`unit-run-<ts>-<hex>` in `unit-run-start.mjs:424`, `cmd_...` in `assignment-runner.mjs:1331`, `disp_...` in `confinement/request.mjs:406`, `adhoc-...` in `run-request.mjs:213`) are run-local ids, not in the four mint kinds; no door covers them and the spec does not claim one.

Proposed row (ratchet on the one hand-formatted sequence id):

```json
{ "job": "sequence id formatting (D-ADR, backlog, decision file)", "patterns": ["format!\\(\"D-ADR", "D-ADR\\$\\{"],
  "allowed": ["packages/identity/rust/src/mint.rs"], "reason": "numbers come only from fgos identity mint" }
```

### 4.9 Config loading and effective sections

Door: `fgos-config` (`packages/config/rust`), Node facade `src/config/facade.mjs` ("the one module that reads or writes a config file from Node"). Spec: `docs/platform/config/spec.md`.

Searches: `config\.(yaml|json)` outside `packages/config`; `fgos_config::` outside it; `readConfig|loadRunnerConfig`.

Rust is clean: other crates and `apps/fgos` call `fgos_config::provider`/`machine`/`snapshot`. Node:

| Where | What | Verdict |
|---|---|---|
| `src/setup/runner-config-conversion.mjs:19-20,55,112,256` | locates `config.yaml` or `config.json` itself, reads the file text, parses it with `parseYaml`, compares backup bytes; writes go through `execFileSync(hostBin, ['config','patch',...])` | LEAK, a second reader of the config file in a file the facade says is the only one; the write path is right |
| `src/runner/dispatch/config.mjs:155-158,256` | builds display names `~/.fgos/<file>`, `config.yaml` | LEGIT (message text) |
| `src/runner/dispatch/config.mjs:411` | reads the tier ladder JSON from the standard | LEGIT (shipped data, not user config) |
| `src/setup/seat-binding-checks.mjs`, `src/verbs/merge/iron-law-level.mjs:38`, `src/verbs/state/settle-legacy-config.mjs:17` | message text and the legacy `config.json` settle verb | LEGIT/DOC (legacy bootstrap) |
| `scripts/ci-external-consumer.sh:435-449,525` | reads and appends to `.fgos/config.*` | LEGIT CI |

Proposed row:

```json
{ "job": "read a config file", "patterns": ["['\"`]config\\.ya?ml['\"`]"],
  "allowed": ["packages/config/rust/src/*: enumerate at land", "src/runner/dispatch/config.mjs", "src/setup/seat-binding-checks.mjs", "src/verbs/merge/iron-law-level.mjs", "src/verbs/state/settle-legacy-config.mjs", "apps/fgctl/src/help.rs"],
  "debt": ["src/setup/runner-config-conversion.mjs"], "reason": "only fgos-config reads config; the others only name the file in text" }
```

The `allowed` list for `packages/config` was not enumerated because I did not run the pattern against every config source file; do that when landing (check (b) of the guard needs exact files).

### 4.10 Event Store appends

Door: `fgos-event-store` (`packages/event-store/rust`), Node facade `src/event-store/`. Spec: `docs/platform/event-store/spec.md`; consumer registry `packages/event-store/contracts/consumers.v1.json` (work, porting, identity, mailbox).

Searches: `appendFileSync|appendFile\(|flag: ?['"]a['"]|\.append\(true\)|createWriteStream`; `events\.jsonl|events/|state\.json|refs/fgos|porting-events|event-append|event-seal`.

Event streams are written only by the crate (`append.rs:270-277`). Second paths:

| Where | What | Verdict |
|---|---|---|
| `src/workflow/store.mjs:47,98,115-131` | the Workflow case ledger `events.jsonl`, own append, fsync, `installOnce` for the first line | DOC (RUL-WF-24); a second append-only durable log that is not an Event Store consumer |
| `src/runner/dispatch/reconciliation-planner.mjs:64,265,328` | `appendFileSync` to `.fgos/dispatch/reconciliation-actions.jsonl` | LEAK, low: a plain unlocked append audit log, one writer per call, no fsync |
| `src/runner/worker-log.mjs:78,106`, `src/runner/dispatch/provider-capacity.mjs:49` | append logs | LEGIT logs, not events |
| `apps/fgos/src/wiring/mailbox_body.rs:113,466,561,609` | owns refs `refs/fgos/mail-bodies/<machine>` and takes the `event-seal` lock | DOC-like (mailbox is a registered consumer); worth confirming that the ref writes go through the Git Publication port, I did not read it |
| `src/state/store.mjs:450` `refsGitDir` | reads the Git ref files directly, "outside the Git ports on purpose" because ports refuse inside the hot lock | DOC (comment in the function) |

Proposed row: none beyond a ratchet. `refs/fgos` string writers are all in `packages/git/rust/src/publication.rs` (30 matches) and the other Git-owned files; a row `refs/fgos` with `allowed` = those files plus `packages/event-store/rust/src/*` would catch a third crate that names the namespace. Not proposed as a priority.

### 4.11 Mailbox

Door: `fgos-mailbox` crates (`packages/mailbox/rust/{core,store}`), wired in `apps/fgos/src/wiring/mailbox_*.rs`. Spec: `docs/platform/agent-mailbox/spec.md`.

Search: `mailbox` over product files by directory. Node only installs hooks and checks (`src/setup/agent-hooks.mjs`, `mailbox-limits.mjs`, `managed-timer.mjs`) and lists lock names; it contains no delivery path. Clean. Note `src/runner/hook.mjs:19` `NATIVE_HOOK_KINDS = ['mailbox','mailbox-sync']` routes to the native host.

### 4.12 Worktree create and remove

Door: Git's worktree port `createGitWorktree` (`src/git/worktree.mjs`), verb `fgos worktree` (`src/verbs/worktree/`), under the `worktree-admin` lock. Spec: `docs/platform/git/spec.md`.

Searches: `createGitWorktree|worktree\.(create|remove|prune)\(|\.git/worktrees|gitdir:|forgent-worktrees`; recursive deletes `rmSync\(|remove_dir_all`.

All create and remove calls go through the port (`src/runner/worktree.mjs:24,805,1457`, `repo-locks.mjs:89,119`, `merge.mjs:684`, `verbs/worktree/{create,remove}.mjs`, `scripts/lib/git-ports.mjs:56`). Second paths are readers of the `.git` pointer file:

| Where | Verdict |
|---|---|
| `src/state/store.mjs:438-460` `refsGitDir` | DOC (comment: stays outside the ports on purpose) |
| `scripts/fgos-shell-integration.sh:72,168` | DOC ("same reading as scripts/lib/git-dir-layout.mjs ... inlined on purpose") |
| `scripts/lib/git-dir-layout.mjs:21` | LEGIT tooling, the layout reader that other scripts share |
| `src/git/main-checkout-delete-guard.mjs:242` | LEGIT, inside the Git component |
| `src/runner/dispatch/runtime-inspection.mjs:247` | LEAK, low: reads the pointer to find a workspace |

Worktree directory removal by recursive delete exists only inside `packages/git/rust/src/worktree.rs:518,972,1605-1607`. Clean.

Proposed row:

```json
{ "job": "read a .git pointer file", "patterns": ["gitdir:"],
  "allowed": ["packages/git/rust/src/driver.rs", "packages/git/rust/src/worktree.rs", "src/git/main-checkout-delete-guard.mjs", "src/state/store.mjs", "scripts/lib/git-dir-layout.mjs", "scripts/fgos-shell-integration.sh"],
  "debt": ["src/runner/dispatch/runtime-inspection.mjs"], "reason": "the pointer is read by Git and by the three named exceptions" }
```

### 4.13 Spawning agent CLIs

Door: Run Supervisor (`fgos-run-supervisor`, Node client `src/run-supervisor/client.mjs` and `direct-launch.mjs`), command from `resolveExecutorCommand` (`src/runner/dispatch/transport.mjs:144`), agent argv by the executor config. Spec: component-boundary rows "Run Supervisor", "Agent protocol".

Searches: spawn with a literal agent binary `(spawn|spawnSync|execFile|execFileSync|exec)\(\s*['"\`](claude|codex|omp|pi|agy|gemini)`; `child_process` import list; Rust `Command::new\(`.

Node `child_process` is imported by 30 files under `src/` and `bin/`. Agent-CLI spawners other than the supervisor path:

| Where | What | Verdict |
|---|---|---|
| `src/runner/dispatch/provider-credential-probe.mjs:125-150` | spawns the agent CLI itself, detached, with its own timeout and process-group kill | DOC for the kill (process one-door allowlist), LEAK for the spawn: a second agent launch path outside the supervisor and gate |
| `src/setup/omp-natives-checks.mjs:58` | `omp --version` | LEGIT doctor probe |
| `packages/mailbox/rust/store/src/adapters/version.rs:62` | CLI `--version` probe | LEGIT |
| `src/runner/dispatch/worker-session-boot.mjs:195` | spawns the herdr server (`herdr --session <n> server`) | DOC (header: "the one herdr thing this module still does itself") |
| `scripts/lib/mailbox-live-cli.mjs:172`, `scripts/herdr-cockpit*.{sh,mjs}` | dev tooling | LEGIT |
| `packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs:210` | spawns external providers for one invocation | DOC (header contrasts it with the detached run supervisor) |
| `packages/run-supervisor/rust/src/attempt_step.rs:91,107` | runs the Node payload as a step | LEGIT |

Proposed rows are ratchets (they list today's files and refuse new ones):

```json
{ "job": "start a child process from Node product code", "patterns": ["from 'node:child_process'", "require\\('(?:node:)?child_process'\\)"],
  "allowed": ["<the 30 files under bin/ and src/ that import it today; enumerate at land>"],
  "reason": "ratchet: a new spawn site must be added here on purpose; it does not prove one path" }
{ "job": "spawn the herdr binary", "patterns": ["FGOS_HERDR_BIN"],
  "allowed": ["packages/terminal-control/rust/src/driver/herdr.rs", "src/runner/dispatch/terminal-slot.mjs"],
  "debt": ["packages/run-supervisor/rust/src/terminal_slot.rs", "packages/run-supervisor/rust/src/adopt.rs", "src/runner/dispatch/herdr-round.mjs"],
  "reason": "terminal-control owns pane access; the binary default is chosen twice today (terminal-slot.mjs:15 and terminal_slot.rs:75), once per language" }
```

### 4.14 Agent definitions and personas

Door: `src/runner/agent-definitions.mjs` ("the one lookup of an agent definition (persona) by name across its layers"; order workspace, workflow folder, owning domain, core; first layer wins). Spec: none under `docs/platform` names it other than the runner spec and the header.

Searches: `['"]core['"],\s*['"]agents['"]`; `/agents/`, `agentsDir`; `persona.*\.yaml`.

| Where | What | Verdict |
|---|---|---|
| `src/runner/dispatch/assignment.mjs:628-650` `renderPersonaSection` | builds `<root>/core/agents/<ref>.yaml` and reads it directly (unless text is pinned) | LEAK, a second chooser that skips the workspace, workflow and domain layers |
| `src/runner/agent-roster.mjs:48-50` | scans core, then domains, then legacy `agents/` (D24/D33 precedence: core first, the reverse of the door); reads each file through `readAgentDefinition` | LEAK, second chooser with another tier order; the header says the file exists only for the task-spec eligibility check |
| `scripts/project-agents.mjs:131-137` | scans core, domains, legacy for the Claude projection | LEAK, third tier walker (generator, so lower severity) |
| `src/setup/registrations.mjs:811-834` | doctor check scans core, domains, legacy | LEAK, fourth tier walker |
| `src/runner/agent-listing.mjs:74` | lists tiers and what hides what | DOC (header: "reads the same tiers as `resolveAgentDefinition`") |

Proposed row:

```json
{ "job": "agent definition tier directories", "patterns": ["['\"]core['\"],\\s*['\"]agents['\"]"],
  "allowed": ["src/runner/agent-definitions.mjs"],
  "debt": ["src/runner/dispatch/assignment.mjs", "src/runner/agent-roster.mjs", "scripts/project-agents.mjs", "src/setup/registrations.mjs"],
  "reason": "one module knows the tier directories and their order" }
```

### 4.15 Decision-question shape checker

Door: `src/state/decision-question.mjs` (`checkDecisionQuestion`, `formatDecisionQuestion`, `requiredPartsForStage`); consumers `src/runner/hook.mjs:14`, `src/intake/discovery.mjs:59`, `src/intake/plan.mjs:31`; template prose in `core/instructions/decision-question.md` and `core/skills/_shared/decision-question.md`.

Searches: `decision-question|decisionQuestion|checkDecisionQuestion`; the five label strings (`Recommendation:`, `What is happening`, `Scope of the answer`). No second shape checker and no hand-built question text in product code. Clean. Note the code labels are Vietnamese with English aliases, the prose template is English: two spellings of one shape, one in code and one in prose; a changed part list would need both.

### 4.16 Time and clock

There is no clock door. The identity spec (line 273) records an owner decision of 2026-10-23 to keep two ISO-8601 helpers (`fgos-identity` `text::iso_utc_now`, host-runtime `civil_time`) because a leaf crate "would make the system bigger, not better".

Searches: `Date\.now\(\)|new Date\(\)` (about 170 uses under `src/`, no injection convention beyond optional `now` parameters); `SystemTime::now|Instant::now` (about 130 uses); `fn (iso_utc|iso_utc_now|civil_from_days|days_from_civil)|719_?468`.

Copies of the civil-date algorithm: `packages/host-runtime/rust/src/civil_time.rs:9-58`, `packages/identity/rust/src/text.rs:84-100` (the owner-kept pair), `apps/fgctl/build.rs:31-33` (a third, build-time, not covered by the owner decision), and `packages/event-store/rust/src/publish.rs:120-135` (the inverse, date to seconds, hand-computed). `packages/observe/rust/src/time.rs:52` reuses host-runtime's `format_unix_millis_rfc3339`. Verdict: DOC for the pair, LEAK (low) for `build.rs` and `publish.rs`. Not proposed as a doors row: the clock is a convention, not a job with a single owner.

### 4.17 Other doors found

Host binary and activation record. Door: `src/util/host-bin-path.mjs` (`resolveActiveHostBin`, `readActivationFile`) in Node; the host's own reader `apps/fgos/src/legacy_exec.rs:103`; writer `packages/distribution/rust`. Second paths:
- `src/setup/project-launcher.mjs:44-103` generated sh and bat launchers walk up for `.fgos/installation/activation.json` (DOC: generated twin, a shell language cannot import).
- `src/run-supervisor/payload-root.mjs:28` reads `FGOS_ACTIVE_MANIFEST_PATH` (`releasePayloadManifest`): a second reader of the manifest location.
- `src/setup/agent-hooks.mjs:46,476,546`, `src/setup/managed-timer.mjs:305` build `.fgos/installation/bin/fgos` by hand (LEAK, four sites).
- Five Node clients repeat the "no fgos host binary found (tried: ...)" error and the "host-version-mismatch" check separately: `src/holder-lock/driver.mjs:66,99`, `src/seat-binding/client.mjs:69,111`, `src/terminal-control/client.mjs:43,65`, `src/run-supervisor/client.mjs:30`, `src/util/session-identity.mjs:60`, beside `src/util/host-bin.mjs` `invokeHost`. They all call `resolveActiveHostBin`, so the chooser is single; the invoke-and-translate step is copied.

```json
{ "job": "installation shim and activation record location", "patterns": ["activation\\.json", "FGOS_ACTIVE_MANIFEST_PATH", "installation['\"],\\s*['\"]bin['\"]"],
  "allowed": ["src/util/host-bin-path.mjs", "apps/fgos/src/legacy_exec.rs", "packages/distribution/rust/src/init.rs", "packages/distribution/rust/src/lib.rs", "packages/distribution/rust/src/shim.rs", "packages/distribution/rust/src/uninstall.rs", "packages/distribution/rust/src/fgctl_refresh.rs", "src/setup/project-launcher.mjs", "apps/fgctl/src/help.rs"],
  "debt": ["src/run-supervisor/payload-root.mjs", "src/setup/agent-hooks.mjs", "src/setup/managed-timer.mjs", "src/setup/bin-discovery.mjs", "src/setup/registrations.mjs"],
  "reason": "distribution writes the record, host-bin-path reads it; everyone else asks host-bin-path" }
```
(Scripts that also match are tooling: `scripts/run-tests.mjs`, `scripts/lib/dev-host-manifest.mjs`, `scripts/lib/git-addon-stage.mjs`, CI scripts, benches; list them as debt or exclude `scripts/`; see section 6.)

Seat Binding. Door: `fgos-seat-binding` (Rust crate behind `fgos internal seat-binding bind|ladder`, thin client `src/seat-binding/client.mjs`). The owner cites about 31 second-path reads of seat binding; I did not re-derive that count. Evidence I found of the same pattern: `deriveProviderFamily` and `normalizeProviderFamily` both map a family and are both read by `src/runner/execution/bind.mjs` (the seat-binding authority phase plan lists this as AU-16 with "delete one of the two family functions"); `src/runner/execution/seat-policy.mjs:54` has the private canonical digest (section 4.6); `llmAccounts` is read in six Node files outside the crate (`provider-account-probe.mjs`, `llm-accounts.mjs`, `explain.mjs`, `provider-capacity.mjs`, `case-start.mjs`, `run.mjs`); `modelPolicy`/tier ladder is read in eight. A row needs the owner's list of the 31 reads to pick a pattern; I propose none.

Convention (names and placement). Door: `fgos convention` (`packages/convention`). Search `plans/reports|YYMMDD|toISOString\(\)\.slice\(2, ?8\)|%y%m%d` over `src/`, `bin/`, `apps/`, `packages/`: no hand-built report or plan names in product code. Clean.

Secrets. Door: `fgos-secrets` (`packages/secrets/rust`). The runner reads provider credential files directly (`src/runner/dispatch/provider-credential-renewal.mjs`, 13 matches of `credentials.json|auth.json|.credentials`; `worker-home.mjs`, `confinement/policies.mjs`, `provider-account-probe.mjs`). The Secrets spec describes a resolver for secret values; the runner code handles whole login homes for account renewal, a different job. I could not tell from the spec whether those reads should go through the resolver; unresolved question 2.

Observe shards. Door: `packages/observe/rust/src/shard.rs` ("the one door to the writer shards"). Node never writes `.fgos/observe` (`src/setup/registrations.mjs:3640-3651` only probes that the directory is writable; `src/observe/friction-client.mjs` is the client). Clean.

Generated surfaces (`.agents/skills`, `plugins/fgOS/skills`, `command-routes.json`): drift is checked by `build:skills` and `export-command-selectors.mjs --check`. Not a duplication leak; no row.

## 5. Ranking

Severity rule: a second chooser or writer ranks above a second reader; a leak in a file that decides persisted state ranks above one in tooling.

| Rank | Leak | Why it ranks here | Door |
|---|---|---|---|
| 1 | `src/report/frontmatter.mjs` parser and writer, nine callers, plus `skill-wrappers.mjs:241` regex | a second parser and writer: two authorities on what the text means, and it rewrites docs (`knowledge-migration.mjs`) | 4.2 |
| 2 | persona choosers: `assignment.mjs:633`, `agent-roster.mjs:48-50` (reverse order), `project-agents.mjs:131-137`, `registrations.mjs:811-834` | different tiers or order give a different persona than the door picks; the prompt a seat gets can differ from the one that was validated | 4.14 |
| 3 | `packages/distribution/rust/src/init.rs:548-555` activation record write | second writer of the file every `fgos` call trusts, with its own durability steps | 4.5 |
| 4 | global directory chosen in nine places; `work-state/rust/src/lib.rs:56` second project-root walk | second choosers; the walk has no home or Git bound so it can pick a different project than the door | 4.4 |
| 5 | `seat-policy.mjs:54` canonical digest | a digest that decides cache and pin equality in Seat Binding, undocumented | 4.6 |
| 6 | `withIdentityEnv` (`direct-launch.mjs:149`), `assignment-runner.mjs:421`, `agent-hooks.mjs:484` | second writer of the launcher environment, second parser of id shape | 4.7 |
| 7 | `provider-credential-probe.mjs` second agent launch; `scripts/run-tests.mjs:516`, `test-file-watchdog.mjs:120,137` bare-pid SIGKILL | second launcher and second killer; the pid kills are tooling but can hit a reused pid | 4.1, 4.13 |
| 8 | Rust `/proc` and start-time readers outside `fgos-process` (nine files) | second readers of process facts; judgement stays in the crate, so wrong answers are limited to uid, comm, tty | 4.1 |
| 9 | Node tmp+rename helpers that break the `uniqueTmpTag` convention (`main-checkout-activity.mjs`, `skill-wrappers.mjs`, `capped-jsonl-log.mjs`, `managed-timer.mjs`, `hold-transport.mjs`), `rotate.rs`, `tombstone.rs` | repeated write helpers; collision risk only for the `<pid>.tmp` names | 4.5 |
| 10 | host-bin shim path by hand (4 sites), five route clients repeating error translation, `runner-config-conversion.mjs` config reads, `reconciliation-planner.mjs` append log, clock copies (`build.rs`, `publish.rs`) | readers and small duplicates | 4.17, 4.9, 4.10, 4.16 |

Clean doors (no second path in product code): id minting, decision-question, mailbox (Node side), Convention, Observe shard writes, event-stream appends, kernel lock primitives (one exception), worktree create and remove, state root.

## 6. What the planned `doors` table shape cannot express yet

These are facts from running the proposed patterns, for whoever lands phase 01.

1. A row cannot carry known leaks. Section 4's rows only pass if every leak is in `allowed`, which hides it. A second list, for example `debt`, checked for staleness the way `tierExceptions` is, keeps the leak visible and shrinking. I used `debt` in the rows above; the shape in `phase-01-manifest-artifact.md` has no such field.
2. Product files include Rust files that hold `#[cfg(test)]` modules. Patterns such as `.sync_all()` and `libc::kill` match inside those modules (for example `packages/git/rust/src/driver.rs:4481`). Either the check stops reading at the first `#[cfg(test)]` line, or rows list test-carrying files as allowed. Without this, check (b) (a stale `allowed` file) is also unpredictable.
3. `scripts/` is in the product directory list but holds dev tooling that legitimately reads `/proc`, kills, and renames (about 30 matches across the rows). Either exclude declared tooling or list it with a reason; I listed it as `debt`.
4. Comments count. Several lock-row matches in `holder-lock` are comments that name `LockFileEx`; the phase file accepts this. It makes check (b) pass for files whose code no longer holds the primitive.
5. Patterns that match a verb everywhere (`renameSync(`, `Command::new(`, `child_process` imports) can only be ratchets. They stop growth; they do not prove one path. The census file for Git solved this with data-flow analysis; no row here has that.
6. `allowed` needs exact paths, so rows for `packages/process/rust/src/**` and `packages/config/rust/src/**` must be enumerated at landing. The shape has no glob.

## 7. Recommendation

Land the table with these rows first, in this order, because each is cheap and catches a real failure:
1. "kernel lock primitive", "process control", "process facts: /proc" and "canonical JSON bytes": exact patterns, short `allowed` lists, no ratchet semantics.
2. "YAML text parsing" with `allowed` for the one crate and the frontmatter helper in `debt`; then move the nine frontmatter callers to `parseYaml` and delete the helper (leak rank 1). This is the one leak where the owner's own rule (one parser) is already contradicted by a file header.
3. "agent definition tier directories" and "global fgOS directory": the leak lists are short and each move is mechanical.
4. Add the `debt` field and cfg(test) handling (section 6, items 1 and 2) before landing any of these, or the rows will have to hide leaks in `allowed`.

Not recommended: a row for the clock, and ratchet rows for `child_process` and `Command::new` until a data-flow check exists. They would pass while a second path appears.

## 8. Limitations

- I did not run `git-one-door-scan.mjs` or any test. All claims come from reading and pattern matching.
- Line numbers are from origin/main 781537524 and will drift.
- The Rust test-module split is a heuristic (everything after the first `#[cfg(test)]` line). A file with a test module in the middle is misclassified.
- Several Rust verdicts rest on the file header or one function (mailbox identity readers, event-store `identity.rs`, `mailbox_body.rs` Git ref writes); each says "unverified" where it applies.
- Section 4.17 Seat Binding does not reproduce the owner's count of 31; I could not locate that list.
- Skills' own scripts and `herdr-dashboard/` were not scanned.

## 9. Unresolved questions

1. Seat Binding: where is the list of the 31 second-path reads? A `doors` row for it needs that list to choose a pattern.
2. Should the runner's provider credential file reads (`provider-credential-renewal.mjs`) go through the Secrets resolver, or are account login homes outside the Secrets door?
3. Is the activation record write in `init.rs:548-555` intentionally separate (for example because it must work before `fgos-durable-file` is staged) or just older than Durable File?
4. Is the frontmatter helper meant to stay (flat OKF subset, no YAML semantics) with the YAML door applying only to YAML documents? The header says zero dependencies; that no longer holds, but the owner may still want a flat-subset reader.
5. Does the owner want `debt` listed in the manifest (visible, shrinking) or leaks kept out of the guard until fixed?
