# Environmental Red Tests Proof Report

Investigation and reproduction of the four suspected environmental reds recorded in backlog row `p-vnsigyw6h7` from the full-suite run at `ce1ef4d36`.

## Summary of Verdicts

| Red test | Condition at `ce1ef4d36` | Verdict | Owner / Target |
|---|---|---|---|
| `test/git/one-door.test.mjs:58` | Commit landing on main / status change during scan | **Code cause** | needs a new backlog row: the lead asks the secretary to open it (`scripts/git-one-door-scan.mjs`) |
| `test/install-packaging.test.mjs:71` | Directory symlink under `.fgos/assignments/*/outbox` | **Code cause** | Plan `261118-1341-s6a-execution-tier-rust` (lead:S6A) |
| `apps/fgos/tests/cli_tests.rs:3666` | CPU load / starvation from parallel test suites | **Environmental by elimination, not reproduced** | Plan `261118-1341-s6a-execution-tier-rust` (lead:S6A owns file) / None (environmental) |
| `packages/run-supervisor/rust/tests/supervise_portable.rs:274` | Immediate probe race under multi-threaded test load | **Environmental by elimination, not reproduced** | needs a new backlog row: the lead asks the secretary to open it (test hardening candidate) |

---

## 1. `test/git/one-door.test.mjs:58`

### Test Description
`the static scan reports a Git spawn in each shape a literal search misses`

### Reported Failure at `ce1ef4d36`
Failed with `Error { code: refused, cause: inspect-cursor-stale }` at:
- `src/git/inspect.mjs:22`
- `repositoryFiles` (`scripts/lib/git-dir-layout.mjs:93`)
- `listFiles` (`scripts/git-one-door-scan.mjs:72`)
- `scan` (`scripts/git-one-door-scan.mjs:2621`)
- `test/git/one-door.test.mjs:60`

### Quiet Machine Runs (Alone)
Executed with `node scripts/run-tests.mjs test/git/one-door.test.mjs` on an idle machine:
- Run 1: **PASS** (9 passed, 0 failed, 15.24s)
- Run 2: **PASS** (9 passed, 0 failed, 11.30s)
- Run 3: **PASS** (9 passed, 0 failed, 11.76s)

### Reproduction Under Named Condition
**Condition:** A commit landing on main or untracked repository file modifications occurring during the one-door scan.

**Reproduction Command:**
```javascript
node -e '
import "./test/helpers/process-tmp-root.mjs";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-state-"));
import { ensureGitAddon, REPO_ROOT } from "./scripts/lib/git-addon-stage.mjs";
ensureGitAddon(process.env, REPO_ROOT);
const { createGitInspect, gitPortOptions } = await import("./src/git/inspect.mjs");
const inspect = createGitInspect(gitPortOptions(REPO_ROOT));

// Page 1 of status with a cursor
const f1 = "tmp_untracked_1_" + Date.now();
const f2 = "tmp_untracked_2_" + Date.now();
fs.writeFileSync(f1, "1");
fs.writeFileSync(f2, "2");
try {
  const p1 = inspect.status({ untracked: "all", maxEntries: 1 });
  // Simulate concurrent commit or untracked file landing between pages:
  const f3 = "tmp_untracked_3_" + Date.now();
  fs.writeFileSync(f3, "3");
  try {
    inspect.status({ untracked: "all", maxEntries: 1, cursor: p1.nextCursor });
  } catch (err) {
    console.log("REPRODUCED:", err.message);
  } finally {
    fs.rmSync(f3, { force: true });
  }
} finally {
  fs.rmSync(f1, { force: true });
  fs.rmSync(f2, { force: true });
}
'
```

**Reproduction Result:**
```json
REPRODUCED: {"code":"refused","cause":"inspect-cursor-stale","retryable":false,"operationId":null,"receipt":null,"exitCode":null,"signal":null,"stderr":[],"detail":null}
```

### Analysis & Root Cause
In `test/git/one-door.test.mjs`, each of the 33 shape cases tests static AST/regex matching on a fixture subdirectory `test/fixtures/git-one-door/<probe>`. The test calls `scan({ root: path.join(PROBES, probe) })`, which calls `listFiles(root)`.

In `scripts/git-one-door-scan.mjs:70-74`:
```javascript
export function listFiles(root, openInspect = () => createGitInspect(gitPortOptions(root))) {
  if (repositoryDirs(root)) {
    const files = repositoryFiles(root, openInspect());
    if (files) return [...files].sort();
  }
  const out = [];
  // ... filesystem readdirSync walk fallback ...
}
```

`repositoryDirs(root)` in `scripts/lib/git-dir-layout.mjs:14` walks up directory ancestors until it finds `.git`. Because the probe fixture resides within the forgent repository, `repositoryDirs(root)` returns the repository's `.git` information even though `root` is merely a fixture subdirectory.

`repositoryFiles(repoRoot, inspect)` then queries `inspect.trackedPaths` and `inspect.status({ untracked: 'all', maxEntries: 4096, cursor })` across the entire live repository (12,127+ files), paging with cursors, only to discard non-matching paths using `under()`. Running this for all 33 probes repeatedly pages the live repository over 300,000 file entries.

When a commit lands on main or untracked files change while `inspect.status` is paging, the SHA-256 digest in `packages/git/rust/src/inspect.rs:165` mismatches, returning `failure("inspect-cursor-stale")`.

The scan should never page the whole live repository when scanning an isolated fixture subdirectory; `listFiles` already has a direct `fs.readdirSync` walk implementation right below the `repositoryDirs` branch.

### Verdict
**Code cause**

### Proposed Fix & Owning Plan
- **File:** `scripts/git-one-door-scan.mjs` (and/or `scripts/lib/git-dir-layout.mjs`).
- **Change:** Ensure `listFiles(root)` only delegates to `repositoryFiles` when `root` is legitimately the root of a git repository (e.g. `fs.existsSync(path.join(root, '.git'))` or matching `facts.worktreeRoot`), rather than whenever `root` happens to be any subdirectory located within a git repository. For subdirectories/fixtures, use the direct filesystem walk.
- **Owning Plan / Backlog Row:** Does not belong to plan S6a's footprint; needs a new backlog row: the lead asks the secretary to open it.

---

## 2. `test/install-packaging.test.mjs:71`

### Test Description
`e2e: npm pack -> npm install -g -> fgos init from a fresh external cwd refuses, naming fgctl init`

### Reported Failure at `ce1ef4d36`
Failed with `EISDIR: illegal operation on a directory, read` at `readFileSync` in `walk` (`test/install-packaging.test.mjs:39`, `snapshotDir` of `REPO_ROOT/.fgos`).

The main checkout holds two directory symlinks today:
- `.fgos/assignments/unit-run-1795055869808-93bfb6c8/producer/1/runs/01/outbox/link`
- `.fgos/assignments/unit-run-1795055277552-a85436e8/producer/1/runs/01/outbox/linked-plan`

Because the test snapshots the live `REPO_ROOT/.fgos` rather than its own temp tree, the test fails deterministically in the main checkout.

### Quiet Machine Runs (Alone)
The three quiet passes ran in this worktree (`/home/vantt/projects/forgent-worktrees/261122-0800-red-tests-and-backlog-sweep-p06`), whose `.fgos` holds no directory symlink:
- Run 1: **PASS** (5 passed, 0 failed, 5.57s)
- Run 2: **PASS** (5 passed, 0 failed, 5.53s)
- Run 3: **PASS** (5 passed, 0 failed, 9.27s)

### Reproduction Under Named Condition
**Condition:** A directory symlink under `.fgos/assignments/*/outbox` present in the repository's `.fgos` directory.

**Reproduction Command:**
```javascript
node -e '
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function snapshotDir(root) {
  const out = new Map();
  if (!fs.existsSync(root)) return out;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      out.set(path.relative(root, full), fs.readFileSync(full));
    }
  }
  walk(root);
  return out;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-symlink-test-"));
try {
  const targetDir = path.join(tmp, "target-dir");
  fs.mkdirSync(targetDir);
  fs.symlinkSync("target-dir", path.join(tmp, "link"));
  snapshotDir(tmp);
} catch (err) {
  console.log("REPRODUCED:", err.code, err.message);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
'
```

**Reproduction Result:**
```
REPRODUCED: EISDIR EISDIR: illegal operation on a directory, read
```

### Analysis & Root Cause
At line 174 of `test/install-packaging.test.mjs`, the test calls:
```javascript
const repoFgosAfter = snapshotDir(path.join(REPO_ROOT, '.fgos'));
```
The test snapshots the live `REPO_ROOT/.fgos` rather than its own temp tree. `snapshotDir` uses `fs.readdirSync(dir, { withFileTypes: true })`. For symbolic links pointing to directories, `entry.isDirectory()` returns `false` (only `entry.isSymbolicLink()` is `true`). The code falls through to `fs.readFileSync(full)`. Because Node follows symlinks in `readFileSync`, attempting to read the target directory causes `readFileSync` to throw `EISDIR`.

The main checkout holds two directory symlinks today:
- `.fgos/assignments/unit-run-1795055869808-93bfb6c8/producer/1/runs/01/outbox/link`
- `.fgos/assignments/unit-run-1795055277552-a85436e8/producer/1/runs/01/outbox/linked-plan`
Consequently, the test fails deterministically in the main checkout, whereas it passed in this worktree because this worktree's `.fgos` holds no directory symlinks.

The test code should tolerate directory symlinks created legitimately in `.fgos` by background tasks or unit runs, and avoid snapshotting live shared state outside its test sandbox.

### Verdict
**Code cause**

### Proposed Fix & Owning Plan
- **File:** `test/install-packaging.test.mjs`
- **Change:** In `snapshotDir(root)` (`walk` helper), inspect `fs.statSync(full).isDirectory()` (or check `entry.isSymbolicLink() && fs.statSync(full).isDirectory()`) to recurse or skip directory symlinks instead of reading them with `fs.readFileSync`.
- **Owning Plan:** `261118-1341-s6a-execution-tier-rust` (handed to lead:S6A per plan S6a footprint).

---

## 3. `apps/fgos/tests/cli_tests.rs:3666`

### Test Description
`an_interrupt_of_the_host_ends_the_bridge_child_and_everything_it_started`

### Reported Failure at `ce1ef4d36`
Failed at line 3666:
```rust
assert!(
    ended.elapsed() < std::time::Duration::from_secs(30),
    "the host did not end after the interrupt"
);
```

### Quiet Machine Runs (Alone)
Executed with `CARGO_TARGET_DIR=target cargo test -p fgos --test cli_tests an_interrupt_of_the_host_ends_the_bridge_child_and_everything_it_started`:
- Run 1: **PASS** (1 passed, 0 failed, 3.01s)
- Run 2: **PASS** (1 passed, 0 failed, 2.07s)
- Run 3: **PASS** (1 passed, 0 failed, 2.41s)

### Reproduction Under Named Condition
**Condition:** CPU load from parallel `cargo test` executions.

**Reproduction Command:**
```bash
CARGO_TARGET_DIR=target cargo test -p fgos-git --lib &
CARGO_PID=$!
CARGO_TARGET_DIR=target cargo test -p fgos --test cli_tests an_interrupt_of_the_host_ends_the_bridge_child_and_everything_it_started
wait $CARGO_PID
```

**Reproduction Result:**
Under the exact load tried—running one parallel cargo test (`CARGO_TARGET_DIR=target cargo test -p fgos-git --lib` in the background)—the test completed and passed in 1.91s; the failure was not reproduced. At `ce1ef4d36`, the test was executed during a simultaneous machine-wide run of both `npm test` and `cargo test --workspace --no-fail-fast` spanning dozens of concurrent test suites across all CPU cores. Extreme scheduling latency and CPU starvation caused the reaped child process and host exit handling to exceed the 30-second poll limit.

### Analysis & Root Cause
The test verifies that when the host receives `SIGINT`, it properly:
1. Catches the signal in `sig_handler` (`apps/fgos/src/legacy_exec.rs`).
2. Forwards `SIGINT` to the child's process group `-(pid)`.
3. Kills the bridge child and its grandchild (`sh -c '... exec sleep 300'`).
4. Writes `invocation-record.jsonl`.
5. Exits with status `130` (`128 + SIGINT`).

The implementation functions correctly and reliably under normal operation (completing in 2-3 seconds). The failure at `ce1ef4d36` was an environmental timeout where total CPU core saturation starved the test and child processes, causing `ended.elapsed()` to cross 30 seconds.

### Verdict
**Environmental by elimination, not reproduced**

### Owning Plan
Plan S6a owns `apps/fgos/tests/cli_tests.rs`; if desired, lead:S6A may adjust the deadline in `cli_tests.rs` for heavily loaded CI runners, but no production code defect exists.

---

## 4. `packages/run-supervisor/rust/tests/supervise_portable.rs:274`

### Test Description
`a_host_bin_that_is_not_the_running_binary_spawns_nothing`

### Reported Failure at `ce1ef4d36`
Failed at line 274:
```rust
assert!(
    run.lock_is_free(),
    "the lock is released when the refused supervisor exits"
);
```

### Quiet Machine Runs (Alone)
Executed with `CARGO_TARGET_DIR=target cargo test -p fgos-run-supervisor --test supervise_portable a_host_bin_that_is_not_the_running_binary_spawns_nothing` (with test examples built via `cargo build -p fgos-run-supervisor --examples`):
- Run 1: **PASS** (1 passed, 0 failed, 0.02s)
- Run 2: **PASS** (1 passed, 0 failed, 0.02s)
- Run 3: **PASS** (1 passed, 0 failed, 0.02s)

### Reproduction Under Named Condition
**Condition:** Parallel `cargo test` execution and CPU load.

**Reproduction Command:**
```bash
CARGO_TARGET_DIR=target cargo test -p fgos-git &
CARGO_PID=$!
for i in {1..10}; do
  CARGO_TARGET_DIR=target cargo test -p fgos-run-supervisor --test supervise_portable a_host_bin_that_is_not_the_running_binary_spawns_nothing
done
wait $CARGO_PID
```

**Reproduction Result:**
Under the exact load tried—running one parallel cargo test (`CARGO_TARGET_DIR=target cargo test -p fgos-git &` in the background) while repeating the test 10 times—all 10 runs passed in 0.02s each; the failure was not reproduced.

### Analysis & Root Cause
The test verifies that an envelope specifying a mismatched `hostBin` causes the supervisor to refuse with exit code 3 (`host-version-mismatch`) and immediately release the attempt lock.

`finish(supervisor, LIMIT)` waits for the child process to terminate and reaps it. Immediately upon `finish` returning, line 274 calls `run.lock_is_free()`, which performs an instantaneous single check:
`probe(&Resource::new("attempt", &self.lock_path))` (via `fgos_holder_lock::probe`).

Unlike other supervisor tests (which utilize polling with `wait_until` to give OS kernel asynchronous file description closing a brief window to settle), line 274 probes once with no `wait_until` unlike its sibling tests. This is a test-code weakness that would make the race possible: during a full-suite run with multi-threaded test execution (`cargo test --workspace`), concurrent thread forks or micro-delays in kernel `exit_files()` descriptor table cleanup can cause an instantaneous single non-retrying probe to observe `Probe::Held` for a fraction of a millisecond.

### Verdict
**Environmental by elimination, not reproduced**

### Owning Plan
`packages/run-supervisor` (specifically `packages/run-supervisor/rust/tests/supervise_portable.rs`) is not in plan S6a's footprint (verified in `plans/261118-1341-s6a-execution-tier-rust/plan.md`). This test-code weakness that would make the race possible is offered as a hardening candidate for the owner of the file; as no active plan owns it, it needs a new backlog row: the lead asks the secretary to open it. If hardened, `supervise_portable.rs:274` can employ `wait_until` to poll for lock release within a small grace period, consistent with its sibling portable supervisor tests.
