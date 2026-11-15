// Parity table of `fgos gateway start|stop|status`: the host answers like the release the step started from.
//
// Every case runs on a fresh project per entry, built by `prepare` at the same path for both entries so the
// answers compare byte for byte, and `evidence` reads what the call left behind (the files under the store, the
// fault records, the registry, whether the process the registry names is still alive) so a difference in an effect
// fails like a difference in an answer. A runner calls, per entry: `prepare(case, scratch)`, the entry with the
// returned `cwd`/`args`/`env`, `evidence(fixture)`, then `fixture.cleanup()`.
//
// A real `start` is not a case: it builds the crate with `cargo` (a cold build takes minutes). The Rust unit tests
// of the gateway control prove it with a stub binary; a `start` that is refused before any build is a case.
//
// `substitute` lists `[pattern, replacement]` pairs applied to both entries' stdout and stderr before they compare:
// a live process fixture has a different pid in each entry. `accepted` names a difference the migration accepts, as
// the pair of exit codes and the words the host answers with; the entries must differ in exactly that way and in no
// other. `ignoreEvidence` names the evidence keys that may differ.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { observe, selfRecord } from "../../../src/native/process-identity.mjs";
import { resolveFaultLogPath } from "../../../src/observe/invocation-fault-log.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { stdio: "pipe" });
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** A repository with an empty store: what `fgos init` leaves for the gateway verbs, which read nothing else. */
function project(root) {
  const repo = path.join(root, "repo");
  fs.mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q");
  fs.mkdirSync(path.join(repo, ".fgos"));
  return repo;
}

/** Starts `body` (a shell script) as an orphan under `setsid`, as a gateway always is: never this process's child. */
function spawnOrphan(root, body) {
  const out = execFileSync("sh", ["-c", `setsid sh -c "$0" </dev/null >/dev/null 2>&1 & echo $!`, body]);
  const pid = Number.parseInt(out.toString().trim(), 10);
  const deadline = Date.now() + 5000;
  while (observe(pid).kind !== "live") {
    if (Date.now() > deadline) throw new Error(`the fixture process ${pid} never came up`);
    sleepSync(10);
  }
  return pid;
}

const SLEEP = "exec sleep 600";
/** A process that swallows TERM and says so, so a signal sent before it does cannot end it. */
const deaf = (root) => {
  const ready = path.join(root, "deaf-ready");
  return { body: `trap '' TERM; echo 1 > ${JSON.stringify(ready)}; while :; do sleep 1; done`, ready };
};

/** The process-identity tuple the registry records for a live pid. */
function liveRecord(pid) {
  const { kind, ...record } = observe(pid);
  if (kind !== "live") throw new Error(`pid ${pid} is not live`);
  return record;
}

/** A pid that no longer names a process: a child that has exited and been reaped. */
function deadPid() {
  return spawnSync(process.execPath, ["-e", ""]).pid;
}

const ENTRY = { startedAt: "2026-01-01T00:00:00.000Z", logPath: "/dev/null" };
const registryFile = (repo) => path.join(repo, ".fgos", "gateway.json");
const writeRegistry = (repo, entry) => fs.writeFileSync(registryFile(repo), JSON.stringify(entry));

/** A `node` process serving `200` on the port it picked, standing in for a reachable gateway. */
function serveContract(root) {
  const portFile = path.join(root, "serve-port");
  const script = `require('http').createServer((q, r) => { r.statusCode = 200; r.end('{}'); }).listen(0, '127.0.0.1', function () { require('fs').writeFileSync(${JSON.stringify(portFile)}, String(this.address().port)); });`;
  const pid = spawnOrphan(root, `exec ${JSON.stringify(process.execPath)} -e ${JSON.stringify(script)}`);
  const deadline = Date.now() + 5000;
  while (!fs.existsSync(portFile)) {
    if (Date.now() > deadline) throw new Error("the fixture server never listened");
    sleepSync(10);
  }
  return { pid, port: Number.parseInt(fs.readFileSync(portFile, "utf8"), 10) };
}

const kill = (pid) => {
  try { process.kill(pid, "SIGKILL"); } catch { /* already gone */ }
};

/** What each fixture builds: the repository, where the call stands, the pids it must clean up and may inspect. */
const FIXTURES = {
  project: (root) => ({ repo: project(root) }),
  // A repository with no store: the walk for one stops at its top level, never at a `.fgos` of some parent.
  nonproject: (root) => {
    const repo = path.join(root, "repo");
    fs.mkdirSync(repo, { recursive: true });
    git(repo, "init", "-q");
    return { repo };
  },
  // The caller stands outside the project and names it.
  elsewhere: (root) => {
    const repo = project(root);
    const cwd = path.join(root, "elsewhere");
    fs.mkdirSync(cwd);
    return { repo, cwd };
  },
  // A linked worktree carries no store of its own.
  linked: (root) => {
    const repo = project(root);
    git(repo, "-c", "user.name=x", "-c", "user.email=x@example.test", "commit", "-q", "--allow-empty", "-m", "seed");
    const linked = path.join(root, "linked");
    git(repo, "worktree", "add", "-q", "--detach", linked);
    return { repo, cwd: linked };
  },
  // A linked worktree with a real store of its own: a disconnected snapshot.
  frozen: (root) => {
    const built = FIXTURES.linked(root);
    fs.mkdirSync(path.join(built.cwd, ".fgos"));
    return built;
  },
  corrupt: (root) => {
    const repo = project(root);
    fs.writeFileSync(registryFile(repo), "{not json");
    return { repo };
  },
  // The recorded process is gone.
  stale: (root) => {
    const repo = project(root);
    const pid = deadPid();
    writeRegistry(repo, { pid, record: { ...selfRecord(), pid, startTime: "1" }, port: 4170, ...ENTRY });
    return { repo };
  },
  // An old entry: a pid and nothing to prove which process it was.
  "no-identity": (root) => {
    const repo = project(root);
    const pid = spawnOrphan(root, SLEEP);
    writeRegistry(repo, { pid, port: 4170, ...ENTRY });
    return { repo, pids: [pid] };
  },
  // The recorded pid is alive but is not the process that was recorded (a reused pid).
  reused: (root) => {
    const repo = project(root);
    const pid = spawnOrphan(root, SLEEP);
    const record = liveRecord(pid);
    writeRegistry(repo, { pid, record: { ...record, startTime: String(Number(record.startTime) - 1000000) }, port: 4170, ...ENTRY });
    return { repo, pids: [pid] };
  },
  live: (root) => {
    const repo = project(root);
    const pid = spawnOrphan(root, SLEEP);
    writeRegistry(repo, { pid, record: liveRecord(pid), port: 1, ...ENTRY });
    return { repo, pids: [pid] };
  },
  "live-serving": (root) => {
    const repo = project(root);
    const { pid, port } = serveContract(root);
    writeRegistry(repo, { pid, record: liveRecord(pid), port, ...ENTRY });
    return { repo, pids: [pid] };
  },
  "live-deaf": (root) => {
    const repo = project(root);
    const { body, ready } = deaf(root);
    const pid = spawnOrphan(root, body);
    const deadline = Date.now() + 5000;
    while (!fs.existsSync(ready)) {
      if (Date.now() > deadline) throw new Error("the fixture process never ignored TERM");
      sleepSync(10);
    }
    writeRegistry(repo, { pid, record: liveRecord(pid), port: 1, ...ENTRY });
    return { repo, pids: [pid] };
  },
};

/** The nearest `.fgos` above `scratch`, if any: a fixture with a store above it is not its own project (a call from
 * a directory with no store of its own would act on that one, and a stop would write into it). */
function storeAbove(scratch) {
  for (let dir = path.dirname(scratch); dir !== path.dirname(dir); dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".fgos"))) return path.join(dir, ".fgos");
  }
  return null;
}

/** Builds the fixture of `testCase` under `scratch` and the call to run: the `{REPO}` token of its args is filled in. */
export function prepare(testCase, scratch) {
  const before = storeAbove(scratch);
  if (before) throw new Error(`${before} exists above the fixture ${scratch}: the fixture would not be its own project`);
  fs.mkdirSync(scratch, { recursive: true });
  const home = path.join(scratch, "home");
  fs.mkdirSync(home);
  const built = FIXTURES[testCase.fixture](scratch);
  const pids = built.pids ?? [];
  return {
    scratch,
    repo: built.repo,
    pids,
    maskFaultMessage: Boolean(testCase.maskFaultMessage),
    cwd: built.cwd ?? built.repo,
    // An empty home, so the machine's real config decides no case.
    env: { HOME: home, USERPROFILE: home },
    args: testCase.args.map((arg) => arg.split("{REPO}").join(built.repo)),
    cleanup: () => pids.forEach(kill),
  };
}

const listFiles = (root) => {
  const found = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else found.push(path.relative(root, full));
    }
  };
  walk(root);
  return found.sort();
};

/** What a call left behind, comparable between entries: the store's files, the fault records, the registry, the processes. */
export function evidence(fixture) {
  const after = storeAbove(fixture.scratch);
  if (after) throw new Error(`the call left or found a store above the fixture: ${after}`);
  const dir = path.join(fixture.repo, ".fgos");
  const log = fs.existsSync(dir) ? resolveFaultLogPath(dir, fixture.repo) : null;
  const faults = log && fs.existsSync(log)
    ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => {
      const record = JSON.parse(line);
      return { faultClass: record.faultClass, message: fixture.maskFaultMessage ? undefined : record.message, verb: record.verb, sub: record.sub };
    })
    : [];
  const registry = fs.existsSync(registryFile(fixture.repo)) ? fs.readFileSync(registryFile(fixture.repo), "utf8").replace(/"pid":\d+/g, '"pid":<pid>').replace(/"startTime":"\d+"/g, '"startTime":"<t>"').replace(/"port":\d+/g, '"port":<port>') : null;
  return {
    faults,
    files: listFiles(dir).filter((file) => !file.startsWith(path.join("logs", "invocation-faults"))),
    registry,
    // The linked worktree carries the store of a frozen fixture too.
    linkedFiles: fixture.cwd === fixture.repo ? [] : listFiles(path.join(fixture.cwd, ".fgos")),
    alive: fixture.pids.map((pid) => observe(pid).kind === "live"),
  };
}

const SEMANTIC = ["semantic-json"];
const EXACT = ["exact-bytes"];
/** A live fixture's pid differs between the entries, in the answer and in the envelope's hash of it. */
const PID = { jsonIgnorePaths: ["data.pid", "data_hash"], substitute: [["pid \\d+", "pid <pid>"]] };

const c = (id, fixture, args, options = {}) => ({ id: `gateway-${id}`, fixture, args: ["gateway", ...args], modes: SEMANTIC, ignoreChildren: true, ...options });
// A refusal compared on exit code and exact stderr bytes.
const refusal = (id, fixture, args, expectedExitCode, options = {}) => c(id, fixture, args, { modes: EXACT, expectedExitCode, ...options });
// A call whose text the migration changes on purpose: the pair of exits and the host's own words.
const accepted = (id, fixture, args, baseExit, hostExit, hostText, options = {}) =>
  c(id, fixture, args, { modes: [], accepted: { baseExit, hostExit, hostText }, ...options });

export const cases = [
  // status
  c("status-fresh", "project", ["status"], { expectedExitCode: 0 }),
  c("status-flag-before-sub", "elsewhere", ["--dir", "{REPO}", "status"], { expectedExitCode: 0 }),
  c("status-named-dir-from-elsewhere", "elsewhere", ["status", "--dir", "{REPO}"], { expectedExitCode: 0 }),
  c("status-extra-positional", "project", ["status", "extra"], { expectedExitCode: 0 }),
  c("status-nonproject", "nonproject", ["status"], { expectedExitCode: 0 }),
  c("status-linked-worktree", "linked", ["status"], { expectedExitCode: 0 }),
  c("status-frozen-worktree", "frozen", ["status"], { expectedExitCode: 0 }),
  c("status-stale-registry", "stale", ["status"], { expectedExitCode: 0, jsonIgnorePaths: ["data.pid", "data_hash"] }),
  c("status-no-identity", "no-identity", ["status"], { expectedExitCode: 0, ...PID }),
  c("status-live-not-reachable", "live", ["status"], { expectedExitCode: 0, ...PID }),
  c("status-live-reachable", "live-serving", ["status"], { expectedExitCode: 0, jsonIgnorePaths: ["data.pid", "data.port", "data_hash"] }),
  refusal("status-corrupt-registry", "corrupt", ["status"], 4, { substitute: [["\\(not valid JSON\\): .*", "(not valid JSON): <reason>"]] }),
  refusal("status-unknown-flag", "project", ["status", "--bogus"], 4),
  // Of several unknown flags the first one the Node parser lists is the one named.
  refusal("status-several-unknown-flags", "project", ["status", "--zzz", "--aaa", "--json"], 4),
  // The Rust fault writer reduces a `--k=v` value inside the recorded message to its length, the Node writer keeps
  // it: the record is compared on its class, verb and sub-command, and its message is not.
  refusal("status-equals-flag", "project", ["status", "--dir={REPO}"], 4, { maskFaultMessage: true }),
  refusal("status-bare-dir", "project", ["status", "--dir"], 4),
  refusal("status-empty-dir", "project", ["status", "--dir", ""], 4),
  // stop
  c("stop-fresh", "project", ["stop"], { expectedExitCode: 0 }),
  c("stop-named-dir-from-elsewhere", "elsewhere", ["stop", "--dir", "{REPO}"], { expectedExitCode: 0 }),
  // Where no project is found the host creates nothing, where the Node CLI left an empty store with a lock file.
  c("stop-nonproject", "nonproject", ["stop"], { expectedExitCode: 0, ignoreEvidence: ["files"] }),
  // A linked worktree carries no store, so no project is found there: the host answers "already stopped", creates
  // nothing and runs no shutdown seal. The Node CLI created `<linked>/.fgos` (a lock file) and sealed the main
  // checkout's open events. The answer is compared; what the call left in the worktree is not.
  c("stop-linked-worktree", "linked", ["stop"], { expectedExitCode: 0, ignoreEvidence: ["linkedFiles"] }),
  refusal("stop-frozen-worktree", "frozen", ["stop"], 4),
  c("stop-stale-registry", "stale", ["stop"], { expectedExitCode: 0, jsonIgnorePaths: ["data.pid", "data_hash"] }),
  c("stop-live-process", "live", ["stop"], { expectedExitCode: 0, ...PID }),
  c("stop-reused-pid", "reused", ["stop"], { expectedExitCode: 0, jsonIgnorePaths: ["data.pid", "data_hash"] }),
  c("stop-process-ignoring-term", "live-deaf", ["stop"], { expectedExitCode: 0, timeoutMs: 30000, ...PID }),
  refusal("stop-no-identity", "no-identity", ["stop"], 4, { substitute: PID.substitute }),
  refusal("stop-corrupt-registry", "corrupt", ["stop"], 4, { substitute: [["\\(not valid JSON\\): .*", "(not valid JSON): <reason>"]] }),
  refusal("stop-unknown-flag", "project", ["stop", "--bogus"], 4),
  // start (refused before any build)
  refusal("start-no-gateway-crate", "project", ["start"], 4),
  refusal("start-already-running", "live", ["start"], 4, { substitute: PID.substitute }),
  refusal("start-no-identity", "no-identity", ["start"], 4, { substitute: PID.substitute }),
  refusal("start-corrupt-registry", "corrupt", ["start"], 4, { substitute: [["\\(not valid JSON\\): .*", "(not valid JSON): <reason>"]] }),
  refusal("start-frozen-worktree", "frozen", ["start"], 4),
  refusal("start-unknown-flag", "project", ["start", "--bogus"], 4),
  accepted("start-nonproject", "nonproject", ["start"], 4, 4, "not inside an fgOS project"),
  // the call itself
  accepted("no-sub-command", "project", [], 4, 4, "gateway requires a subcommand. Available: start, stop, status"),
  accepted("unknown-sub-command", "project", ["restart"], 4, 4, 'unknown gateway subcommand "restart". Available: start, stop, status'),
  accepted("flag-before-missing-sub-command", "project", ["--dir", "{REPO}"], 4, 4, "gateway requires a subcommand. Available: start, stop, status"),
];
