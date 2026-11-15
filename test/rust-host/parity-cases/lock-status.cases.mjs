// `lock-status` parity table: the host against the step's base release. The verb only reads, so both entries share
// one fixture per name (a held lock is a `flock(1)` child that lives until this process exits); a case names its
// fixture, its arguments and how it is compared:
//   semantic - exit code, stderr text and the JSON envelope data (hash and time fields are normalised away);
//   exact    - exit code, stdout and stderr bytes (every refusal);
//   accepted - the host answers differently on purpose; `check(host, base)` states how, and returns a problem or "".
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { observe } from "../../../src/native/process-identity.mjs";

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "parity",
  GIT_AUTHOR_EMAIL: "parity@test",
  GIT_COMMITTER_NAME: "parity",
  GIT_COMMITTER_EMAIL: "parity@test",
};
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "lock-status-parity-"));
const children = [];
process.on("exit", () => {
  for (const child of children) child.kill("SIGKILL");
  fs.rmSync(scratch, { recursive: true, force: true });
});

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const ago = (file, ms) => {
  const when = new Date(Date.now() - ms);
  fs.utimesSync(file, when, when);
};

/** Holds `file` with `flock -o <file> sleep 600` and waits until the kernel shows the lock taken. */
function hold(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const child = spawn("flock", ["-o", file, "sleep", "600"], { env: { PATH: process.env.PATH }, stdio: "ignore" });
  child.unref();
  children.push(child);
  for (let tries = 0; tries < 250; tries += 1) {
    if (spawnSync("flock", ["-n", "-x", file, "true"], { stdio: "ignore" }).status !== 0) return child;
    spawnSync("sleep", ["0.02"]);
  }
  throw new Error(`flock did not take ${file}`);
}

/** A project (a Git repository with a `.fgos` directory) with its own state root and home. */
function project(name, { commit = false } = {}) {
  const root = path.join(scratch, name);
  const repo = path.join(root, "repo");
  const state = path.join(root, "state");
  const home = path.join(root, "home");
  fs.mkdirSync(path.join(repo, ".fgos", "locks"), { recursive: true });
  fs.mkdirSync(state, { mode: 0o700 });
  fs.mkdirSync(home);
  execFileSync("git", ["init", "-q"], { cwd: repo, env: GIT_ENV });
  if (commit) execFileSync("git", ["commit", "-q", "--allow-empty", "-m", "init"], { cwd: repo, env: GIT_ENV });
  return {
    temp: root,
    repo,
    cwd: repo,
    state,
    fgos: path.join(repo, ".fgos"),
    locks: path.join(repo, ".fgos", "locks"),
    env: { HOME: home, USERPROFILE: home, FGOS_STATE_ROOT: state },
    close() {},
  };
}

const me = observe(process.pid);
const domain = (pid, startTime) => ({ host: me.host, bootId: me.bootId, pid, startTime, pidNs: me.pidNs });
const deadPid = () => Number(spawnSync("sh", ["-c", "echo $$"], { encoding: "utf8" }).stdout.trim());

/** Each fixture is built the first time a case asks for it, then shared by both entries. */
const memo = new Map();
const once = (name, build) => () => {
  if (!memo.has(name)) memo.set(name, build());
  return memo.get(name);
};
const here = (fixture, cwd) => ({ ...fixture, cwd });

const builders = {
  free: once("free", () => project("free")),
  "free-subdirectory": once("free-sub", () => {
    const sub = path.join(builders.free().repo, "sub");
    fs.mkdirSync(sub, { recursive: true });
    return here(builders.free(), sub);
  }),
  "free-from-outside": once("free-outside", () => here(builders.free(), scratch)),
  nonproject: once("nonproject", () => {
    const dir = path.join(scratch, "nonproject");
    fs.mkdirSync(dir);
    return here(builders.free(), dir);
  }),
  linked: once("linked", () => project("linked", { commit: true })),
  "linked-worktree": once("linked-worktree", () => {
    const main = builders.linked();
    const wt = path.join(main.temp, "wt");
    execFileSync("git", ["worktree", "add", "-q", "--detach", wt], { cwd: main.repo, env: GIT_ENV });
    return here(main, wt);
  }),
  "linked-frozen": once("linked-frozen", () => {
    const main = builders.linked();
    const wt = path.join(main.temp, "wt-frozen");
    execFileSync("git", ["worktree", "add", "-q", "--detach", wt], { cwd: main.repo, env: GIT_ENV });
    fs.mkdirSync(path.join(wt, ".fgos", "locks"), { recursive: true });
    return here(main, wt);
  }),
  "linked-from-outside": once("linked-outside", () => here(builders.linked(), scratch)),
  held: once("held", () => {
    const fx = project("held");
    hold(path.join(fx.locks, "main-checkout.lock"));
    hold(path.join(fx.locks, "merge-slot--main.lock"));
    hold(path.join(fx.state, "locks", "provider-state.lock"));
    hold(path.join(fx.state, "locks", "provider-account", "claude", "work.lock"));
    return fx;
  }),
  foreign: once("foreign", () => {
    const fx = project("foreign");
    write(path.join(fx.locks, "runner.lock"), "");
    hold(path.join(fx.locks, "gateway.lock"));
    return fx;
  }),
  "empty-placeholder": once("empty-placeholder", () => {
    const fx = project("empty-placeholder");
    hold(path.join(fx.locks, "merge-slot--.lock"));
    hold(path.join(fx.locks, "dispatch-cwd--.lock"));
    hold(path.join(fx.state, "locks", "worker-session", ".lock"));
    return fx;
  }),
  runs: once("runs", () => {
    const fx = project("runs");
    hold(path.join(fx.fgos, "workflow-runs", "case-1", "locks", "advance.lock"));
    hold(path.join(fx.fgos, "workflow-runs", ".bindings", "locks", "advance.lock"));
    hold(path.join(fx.fgos, "assignments", "work", "runs", "01", "locks", "recovery.lock"));
    hold(path.join(fx.fgos, "assignments", "work", "runs", "02", "attempt.lock"));
    hold(path.join(fx.fgos, "assignments", "work", "runs", "03", "attempt.lock"));
    write(path.join(fx.fgos, "assignments", "work", "runs", "03", "closed.json"), "{}");
    return fx;
  }),
  "hot-unparseable": once("hot", () => {
    const fx = project("hot");
    write(path.join(fx.locks, "state.hot"), '{"pid":');
    return fx;
  }),
  "hot-unjudgeable": once("hot-old", () => {
    const fx = project("hot-old");
    const alien = '{"v":1,"pid":4242,"startTime":"1","bootId":"b","pidNs":"pid:[1]","host":"another-host"}';
    write(path.join(fx.locks, "state.hot"), alien);
    ago(path.join(fx.locks, "state.hot"), 12 * 60 * 1000);
    write(path.join(fx.locks, "porting-events.hot"), alien);
    return fx;
  }),
  "hot-dead": once("hot-dead", () => {
    const fx = project("hot-dead");
    write(path.join(fx.locks, "state.hot"), JSON.stringify({ v: 1, pid: deadPid(), startTime: "1", bootId: me.bootId, pidNs: me.pidNs, host: me.host }));
    ago(path.join(fx.locks, "state.hot"), 20 * 60 * 1000);
    return fx;
  }),
  predecessors: once("predecessors", () => {
    const fx = project("predecessors");
    const sleeper = spawn("sleep", ["600"], { stdio: "ignore" });
    sleeper.unref();
  children.push(sleeper);
    const alive = observe(sleeper.pid);
    const record = (name, content) => {
      write(path.join(fx.locks, name), "");
      write(path.join(fx.locks, `${name}.predecessor.json`), typeof content === "string" ? content : JSON.stringify(content));
    };
    record("gateway.lock", { v: 1, domainKind: "linux-pgroup", domainId: domain(deadPid(), "1") });
    record("runner.lock", { v: 1, domainKind: "linux-pgroup", domainId: domain(sleeper.pid, alive.startTime) });
    record("sessions.lock", { v: 1, domainKind: "linux-gate", domainId: { host: "another-host", bootId: null, pid: 5, startTime: "1", pidNs: "pid:[1]" } });
    record("reconcile.lock", {
      v: 1,
      domainKind: "windows-job",
      domainId: { job: "Global\\fgos-job-1", sessionId: "1", declaredAt: "1", holder: { host: "h", pid: 4, startTime: "1" }, keeper: null },
    });
    record("observe.lock", "not json at all");
    record("mailbox.lock", { v: 2, domainKind: "linux-gate", domainId: {} });
    record("repo-config.lock", { domainKind: "linux-gate" });
    return fx;
  }),
};

const BEACON = { v: 1, kind: "beacon", writer: { id: "session-1", source: "pre-commit" }, windowMs: 3_600_000, auditPid: 7 };
const beacon = (name, record, ageMs) => ({
  fixture: `beacon-${name}`,
  build: once(`beacon-${name}`, () => {
    const fx = project(`beacon-${name}`);
    write(path.join(fx.fgos, "runtime", "main-checkout-activity.json"), typeof record === "string" ? record : JSON.stringify({ ...record, writtenAt: Date.now() - ageMs }));
    return fx;
  }),
});
const beacons = {
  active: beacon("active", BEACON, 1000),
  expired: beacon("expired", { ...BEACON, windowMs: 1000 }, 3_600_000),
  numeric: beacon("numeric", { ...BEACON, writer: { id: 4242 } }, 1000),
  corrupt: beacon("corrupt", "not json", 0),
  version: beacon("version", { ...BEACON, v: 2 }, 0),
};
for (const { fixture, build } of Object.values(beacons)) builders[fixture] = build;

const read = (id, fixture, args = ["lock-status"], extra = {}) => ({ id: `lock-status-${id}`, fixture, args, mode: "semantic", ...extra });
const refusal = (id, fixture, args) => ({ id: `lock-status-${id}`, fixture, args, mode: "exact" });

const cases = [
  read("all-free", "free"),
  read("json-flag", "free", ["lock-status", "--json"]),
  read("extra-positional", "free", ["lock-status", "extra", "words"]),
  read("dir-from-outside", "free-from-outside", (f) => ["lock-status", "--dir", f.repo]),
  read("dir-before-verb-word", "free-from-outside", (f) => ["lock-status", "--dir", f.repo, "--json"]),
  read("from-a-subdirectory", "free-subdirectory"),

  refusal("unknown-flag", "free", ["lock-status", "--bogus"]),
  refusal("unknown-flag-with-value", "free", ["lock-status", "--bogus", "value"]),
  refusal("equals-spelled-dir", "free", (f) => ["lock-status", `--dir=${f.repo}`]),
  refusal("equals-spelled-flag", "free", ["lock-status", "--json=true"]),
  refusal("bare-dir", "free", ["lock-status", "--dir"]),
  refusal("empty-dir", "free", ["lock-status", "--dir", ""]),

  read("nonproject", "nonproject"),
  read("worktree-without-store", "linked-worktree"),
  read("worktree-with-its-own-store", "linked-frozen"),
  read("worktree-named-by-dir", "linked-from-outside", (f) => ["lock-status", "--dir", path.join(f.temp, "wt")]),

  read("held-locks", "held"),
  read("foreign-holder-problem", "foreign"),
  // The files Node's own scan accepted with an empty placeholder name no instance now: the registry template
  // needs one character. The only accepted difference of this table.
  {
    id: "lock-status-empty-placeholder-names-no-instance",
    fixture: "empty-placeholder",
    args: ["lock-status"],
    mode: "accepted",
    check(host, base) {
      if (base.problems.length !== 3) return `the base reported ${base.problems.length} problems, not 3`;
      if (host.problems.length !== 0) return `the host reported ${JSON.stringify(host.problems)}`;
      const rest = (data) => JSON.stringify({ ...data, problems: [] });
      return rest(host) === rest(base) ? "" : "the answers differ beyond the problems";
    },
  },
  read("run-scoped-holders", "runs"),

  read("hot-record-does-not-parse", "hot-unparseable"),
  read("hot-record-unjudgeable-for-minutes", "hot-unjudgeable"),
  read("hot-record-of-a-dead-holder", "hot-dead"),
  read("predecessor-records", "predecessors"),

  read("beacon-active", "beacon-active"),
  read("beacon-expired", "beacon-expired"),
  read("beacon-numeric-writer", "beacon-numeric"),
  read("beacon-corrupt", "beacon-corrupt"),
  read("beacon-unknown-version", "beacon-version"),
];

export { builders, cases };
