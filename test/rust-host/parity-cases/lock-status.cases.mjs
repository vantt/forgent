// lock-status parity table: the host against the release the step started from. `lock-status` reads, so both entries
// share one fixture per case (a held lock is a `flock(1)` child that lives as long as this module's process).
// Every case names its fixture; the fixtures are built once when the table loads.
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
const holders = [];
process.on("exit", () => {
  for (const child of holders) child.kill("SIGKILL");
  fs.rmSync(scratch, { recursive: true, force: true });
});

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
    repo,
    state,
    fgos: path.join(repo, ".fgos"),
    locks: path.join(repo, ".fgos", "locks"),
    env: { HOME: home, USERPROFILE: home, FGOS_STATE_ROOT: state },
  };
}

/** Holds `file` with `flock -o <file> sleep 30` and waits until the kernel shows the lock taken. */
function hold(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const child = spawn("flock", ["-o", file, "sleep", "30"], { env: { PATH: process.env.PATH }, stdio: "ignore" });
  holders.push(child);
  for (let tries = 0; tries < 250; tries += 1) {
    if (spawnSync("flock", ["-n", "-x", file, "true"], { stdio: "ignore" }).status !== 0) return child;
    spawnSync("sleep", ["0.02"]);
  }
  throw new Error(`flock did not take ${file}`);
}

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const ago = (file, ms) => {
  const when = new Date(Date.now() - ms);
  fs.utimesSync(file, when, when);
};
const lockCase = (id, fixture, args = ["lock-status"], extra = {}) => ({
  id: `lock-status-${id}`,
  args,
  cwd: fixture.repo,
  env: fixture.env,
  modes: ["semantic-json"],
  ignoreChildren: true,
  ...extra,
});
const refusal = (id, fixture, args, exit = 4) => lockCase(id, fixture, args, { modes: ["exact-bytes"], expectedExitCode: exit });

const cases = [];

// Nothing held, from every way of naming the project.
const free = project("free");
cases.push(lockCase("all-free", free, ["lock-status"], { expectedExitCode: 0 }));
cases.push(lockCase("json-flag", free, ["lock-status", "--json"], { expectedExitCode: 0 }));
cases.push(lockCase("extra-positional", free, ["lock-status", "extra", "words"], { expectedExitCode: 0 }));
cases.push(lockCase("dir-from-outside", free, ["lock-status", "--dir", free.repo], { cwd: scratch }));
cases.push(lockCase("dir-before-verb-word", free, ["lock-status", "--dir", free.repo, "--json"], { cwd: scratch }));
cases.push(lockCase("from-a-subdirectory", free, ["lock-status"], { cwd: (() => { const sub = path.join(free.repo, "sub"); fs.mkdirSync(sub); return sub; })() }));

// Refusals compared as exact bytes.
cases.push(refusal("unknown-flag", free, ["lock-status", "--bogus"]));
cases.push(refusal("unknown-flag-with-value", free, ["lock-status", "--bogus", "value"]));
cases.push(refusal("equals-spelled-dir", free, ["lock-status", `--dir=${free.repo}`]));
cases.push(refusal("equals-spelled-flag", free, ["lock-status", "--json=true"]));
cases.push(refusal("bare-dir", free, ["lock-status", "--dir"]));
cases.push(refusal("empty-dir", free, ["lock-status", "--dir", ""]));

// No project: no repository at all, a worktree with no `.fgos`, a worktree with its own.
const nonproject = path.join(scratch, "nonproject");
fs.mkdirSync(nonproject);
cases.push(lockCase("nonproject", free, ["lock-status"], { cwd: nonproject, expectedExitCode: 0 }));
const linked = project("linked", { commit: true });
const worktree = path.join(scratch, "linked", "wt");
execFileSync("git", ["worktree", "add", "-q", "--detach", worktree], { cwd: linked.repo, env: GIT_ENV });
cases.push(lockCase("worktree-without-store", linked, ["lock-status"], { cwd: worktree, modes: ["semantic-json"] }));
const frozen = path.join(scratch, "linked", "wt-frozen");
execFileSync("git", ["worktree", "add", "-q", "--detach", frozen], { cwd: linked.repo, env: GIT_ENV });
fs.mkdirSync(path.join(frozen, ".fgos", "locks"), { recursive: true });
cases.push(lockCase("worktree-with-its-own-store", linked, ["lock-status"], { cwd: frozen }));
cases.push(lockCase("worktree-named-by-dir", linked, ["lock-status", "--dir", worktree], { cwd: scratch }));

// Held locks: main checkout, a parametric merge slot, a machine lock and a machine parametric row.
const held = project("held");
hold(path.join(held.locks, "main-checkout.lock"));
hold(path.join(held.locks, "merge-slot--main.lock"));
hold(path.join(held.state, "locks", "provider-state.lock"));
hold(path.join(held.state, "locks", "provider-account", "claude", "work.lock"));
cases.push(lockCase("held-locks", held, ["lock-status"], { expectedExitCode: 0 }));

// A foreign holder of the gateway lock, a free file beside it, and the files the Node scan accepted with an empty
// placeholder: the host lists a lock file by the registry's own template, so `merge-slot--.lock` and a bare
// `.lock` in the worker-session directory name no instance. The one accepted difference of this table.
const foreign = project("foreign");
write(path.join(foreign.locks, "runner.lock"), "");
hold(path.join(foreign.locks, "gateway.lock"));
cases.push(lockCase("foreign-holder-problem", foreign, ["lock-status"], { expectedExitCode: 0 }));
const emptyPlaceholder = project("empty-placeholder");
hold(path.join(emptyPlaceholder.locks, "merge-slot--.lock"));
hold(path.join(emptyPlaceholder.locks, "dispatch-cwd--.lock"));
hold(path.join(emptyPlaceholder.state, "locks", "worker-session", ".lock"));
cases.push(
  lockCase("empty-placeholder-names-no-instance", emptyPlaceholder, ["lock-status"], {
    jsonIgnorePaths: ["data_hash", "data.problems"],
    acceptedDifference: {
      path: "data.problems",
      nodeCount: 3,
      host: [],
      reason: "the registry template needs at least one character for a placeholder; Node's own scan accepted an empty one for these three rows",
    },
  }),
);

// Run-scoped locks: a workflow run (and the bindings directory, which counts), an assignment run, an open attempt
// and a closed one (never scanned).
const runs = project("runs");
hold(path.join(runs.fgos, "workflow-runs", "case-1", "locks", "advance.lock"));
hold(path.join(runs.fgos, "workflow-runs", ".bindings", "locks", "advance.lock"));
hold(path.join(runs.fgos, "assignments", "work", "runs", "01", "locks", "recovery.lock"));
hold(path.join(runs.fgos, "assignments", "work", "runs", "02", "attempt.lock"));
hold(path.join(runs.fgos, "assignments", "work", "runs", "03", "attempt.lock"));
write(path.join(runs.fgos, "assignments", "work", "runs", "03", "closed.json"), "{}");
cases.push(lockCase("run-scoped-holders", runs, ["lock-status"], { expectedExitCode: 0 }));

// Hot records: one that does not parse, one whose holder cannot be judged (old and young), one of a dead holder.
const hot = project("hot");
write(path.join(hot.locks, "state.hot"), '{"pid":');
cases.push(lockCase("hot-record-does-not-parse", hot, ["lock-status"], { expectedExitCode: 0 }));
const hotOld = project("hot-old");
const alienRecord = '{"v":1,"pid":4242,"startTime":"1","bootId":"b","pidNs":"pid:[1]","host":"another-host"}';
write(path.join(hotOld.locks, "state.hot"), alienRecord);
ago(path.join(hotOld.locks, "state.hot"), 12 * 60 * 1000);
write(path.join(hotOld.locks, "porting-events.hot"), alienRecord);
cases.push(lockCase("hot-record-unjudgeable-for-minutes", hotOld, ["lock-status"], { expectedExitCode: 0 }));
const hotDead = project("hot-dead");
const reaped = spawnSync("true");
void reaped;
const gone = (() => {
  const child = spawnSync("sh", ["-c", "echo $$"], { encoding: "utf8" });
  return Number(child.stdout.trim());
})();
const me = observe(process.pid);
write(path.join(hotDead.locks, "state.hot"), JSON.stringify({ v: 1, pid: gone, startTime: "1", bootId: me.bootId, pidNs: me.pidNs, host: me.host }));
ago(path.join(hotDead.locks, "state.hot"), 20 * 60 * 1000);
cases.push(lockCase("hot-record-of-a-dead-holder", hotDead, ["lock-status"], { expectedExitCode: 0 }));

// Predecessor records beside lock files: dead, alive, another host, a Windows job, not JSON, unknown version.
const predecessors = project("predecessors");
const sleeper = spawn("sleep", ["30"], { stdio: "ignore" });
holders.push(sleeper);
const alive = observe(sleeper.pid);
const domain = (pid, startTime) => ({ host: me.host, bootId: me.bootId, pid, startTime, pidNs: me.pidNs });
const predecessor = (name, record) => {
  write(path.join(predecessors.locks, name), "");
  write(path.join(predecessors.locks, `${name}.predecessor.json`), typeof record === "string" ? record : JSON.stringify(record));
};
predecessor("gateway.lock", { v: 1, domainKind: "linux-pgroup", domainId: domain(gone, "1") });
predecessor("runner.lock", { v: 1, domainKind: "linux-pgroup", domainId: domain(sleeper.pid, alive.startTime) });
predecessor("sessions.lock", { v: 1, domainKind: "linux-gate", domainId: { host: "another-host", bootId: null, pid: 5, startTime: "1", pidNs: "pid:[1]" } });
predecessor("reconcile.lock", {
  v: 1,
  domainKind: "windows-job",
  domainId: { job: "Global\\fgos-job-1", sessionId: "1", declaredAt: "1", holder: { host: "h", pid: 4, startTime: "1" }, keeper: null },
});
predecessor("observe.lock", "not json at all");
predecessor("mailbox.lock", { v: 2, domainKind: "linux-gate", domainId: {} });
predecessor("repo-config.lock", { domainKind: "linux-gate" });
cases.push(lockCase("predecessor-records", predecessors, ["lock-status"], { expectedExitCode: 0 }));

// The beacon: present and active, present and expired, corrupt, a numeric writer.
const beacon = (name, record, ageMs) => {
  const fixture = project(name);
  write(path.join(fixture.fgos, "runtime", "main-checkout-activity.json"), typeof record === "string" ? record : JSON.stringify({ ...record, writtenAt: Date.now() - ageMs }));
  return fixture;
};
const base = { v: 1, kind: "beacon", writer: { id: "session-1", source: "pre-commit" }, windowMs: 3_600_000, auditPid: 7 };
cases.push(lockCase("beacon-active", beacon("beacon-active", base, 1000), ["lock-status"], { jsonIgnorePaths: ["data_hash", "data.beacon.ageMs"] }));
cases.push(lockCase("beacon-expired", beacon("beacon-expired", { ...base, windowMs: 1000 }, 3_600_000), ["lock-status"], { jsonIgnorePaths: ["data_hash", "data.beacon.ageMs"] }));
cases.push(lockCase("beacon-numeric-writer", beacon("beacon-numeric", { ...base, writer: { id: 4242 } }, 1000), ["lock-status"], { jsonIgnorePaths: ["data_hash", "data.beacon.ageMs"] }));
cases.push(lockCase("beacon-corrupt", beacon("beacon-corrupt", "not json", 0), ["lock-status"]));
cases.push(lockCase("beacon-unknown-version", beacon("beacon-version", { ...base, v: 2 }, 0), ["lock-status"]));

export { cases };
