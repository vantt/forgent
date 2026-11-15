/**
 * Parity table of `fgos lock fence`: the host against the step's base release (the entry that still serves the
 * verb from Node). Every case builds a fresh project, home directory and holder for each entry, because a fence
 * signals and removes things: two entries never share state.
 *
 * A case is `{ id, args, prepare, normalise?, exitOnly? }`:
 *  - `prepare()` returns `{ cwd, env, ctx, teardown }` for one entry; `ctx.dir` is the project, `ctx.pids` the
 *    holder processes whose ids differ between entries;
 *  - `args` is a list, or a function of `ctx` when a path or id has to be named;
 *  - the answer is compared on exit code, stdout and stderr byte for byte after `scrub` has replaced what differs
 *    between entries by nature (project and home paths, holder pids and start times, the envelope's time and
 *    hash); `exitOnly` compares the exit code alone, for a refusal whose text the host changed on purpose (a
 *    missing or unknown sub-command, answered with the host's one text).
 * `runPreparedCase(entryA, entryB, testCase)` runs one case on both entries, one after the other, and fails when
 * the second entry (the host) started a Node process.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runCaseOnEntry } from "../harness.mjs";
import { holdLockInChild } from "../../helpers/hold-lock-in-child.mjs";
import { acquireSync, createLockScope } from "../../../src/holder-lock/index.mjs";
import { observe } from "../../../src/native/process-identity.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** A project: a git repository with an `.fgos` directory, and a home directory of its own. */
function makeProject() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "fgos-lockfence-parity-")));
  const dir = path.join(root, "project");
  const home = path.join(root, "home");
  fs.mkdirSync(dir);
  fs.mkdirSync(home);
  execFileSync("git", ["init", "-q", "."], { cwd: dir });
  execFileSync("git", ["-c", "user.email=a@b", "-c", "user.name=n", "commit", "-q", "--allow-empty", "-m", "i"], { cwd: dir });
  fs.mkdirSync(path.join(dir, ".fgos", "locks"), { recursive: true });
  return { root, dir, home, pids: [], cleanups: [] };
}

function prepared(project, extra = {}) {
  return {
    cwd: project.dir,
    env: { HOME: project.home, USERPROFILE: project.home, FGOS_SESSION_ID: "fgos-lock-fence-parity", ...extra.env },
    ctx: project,
    teardown: async () => {
      for (const cleanup of project.cleanups.reverse()) await cleanup();
      fs.rmSync(project.root, { recursive: true, force: true });
    },
  };
}

const plain = () => prepared(makeProject());

/** A Node process holding `name` under the project, until killed. */
function holding(name, params = {}) {
  return async () => {
    const project = makeProject();
    const holder = await holdLockInChild(name, { fgosDir: path.join(project.dir, ".fgos"), ...params });
    project.pids.push(holder.child.pid);
    project.cleanups.push(async () => {
      holder.child.kill("SIGKILL");
      await holder.exited;
    });
    return prepared(project);
  };
}

/** A holder that ignores SIGTERM, so the fence has to kill it. */
function holdingStubborn() {
  return async () => {
    const project = makeProject();
    const fgosDir = path.join(project.dir, ".fgos");
    const ready = path.join(project.root, "ready");
    const child = spawn(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs';
      import { acquireSync, createLockScope } from ${JSON.stringify(new URL("../../../src/holder-lock/index.mjs", import.meta.url).href)};
      const res = acquireSync(createLockScope('stubborn'), 'main-checkout', { fgosDir: ${JSON.stringify(fgosDir)} });
      if (res.result !== 'acquired') process.exit(3);
      process.on('SIGTERM', () => {});
      fs.writeFileSync(${JSON.stringify(ready)}, 'held');
      setInterval(() => {}, 1000);
    `], { stdio: "ignore" });
    const exited = new Promise((resolve) => child.once("exit", resolve));
    for (let i = 0; i < 400 && !fs.existsSync(ready); i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
    project.pids.push(child.pid);
    project.cleanups.push(async () => {
      child.kill("SIGKILL");
      await exited;
    });
    return prepared(project);
  };
}

/** A hot record naming a process that is running (`live`), gone (`dead`), or one this host cannot judge. */
function withHotRecord(kind, name = "state") {
  return async () => {
    const project = makeProject();
    const record = path.join(project.dir, ".fgos", "locks", `${name}.hot`);
    if (kind === "torn") {
      fs.writeFileSync(record, '{"v":1,"pid":');
    } else if (kind === "unjudgeable") {
      fs.writeFileSync(record, JSON.stringify({ v: 1, pid: 4000000, startTime: "1", bootId: "elsewhere", pidNs: "pid:[1]", host: "other-host" }));
    } else {
      const child = spawn("sleep", ["300"], { stdio: "ignore" });
      const exited = new Promise((resolve) => child.once("exit", resolve));
      const { pid, startTime, bootId, pidNs } = observe(child.pid);
      fs.writeFileSync(record, JSON.stringify({ v: 1, pid, startTime, bootId, pidNs }));
      project.pids.push(pid);
      project.starts = [startTime];
      if (kind === "dead") {
        child.kill("SIGKILL");
        await exited;
      } else {
        project.cleanups.push(async () => {
          child.kill("SIGKILL");
          await exited;
        });
      }
    }
    return prepared(project);
  };
}

/** The lock held by the process that runs the case, which the fence must refuse to signal. */
function heldByTheRunner() {
  return async () => {
    const project = makeProject();
    const scope = createLockScope("parity-runner");
    const mine = acquireSync(scope, "main-checkout", { fgosDir: path.join(project.dir, ".fgos") });
    if (mine.result !== "acquired") throw new Error("the runner could not take main-checkout");
    project.pids.push(process.pid, process.ppid);
    project.cleanups.push(async () => mine.handle.release());
    return prepared(project);
  };
}

/** A call from a directory outside the project, naming it with `--dir`. */
function fromOutside() {
  const make = plain;
  return async () => {
    const value = await make();
    const outside = path.join(value.ctx.root, "outside");
    fs.mkdirSync(outside);
    value.cwd = outside;
    return value;
  };
}

function nonProject() {
  return async () => {
    const value = await plain();
    const empty = path.join(value.ctx.root, "empty");
    fs.mkdirSync(empty);
    value.cwd = empty;
    return value;
  };
}

/** What differs between two entries by nature, replaced by one token. */
export function scrub(text, ctx) {
  let out = text;
  for (const [from, to] of [[ctx.dir, "<DIR>"], [ctx.home, "<HOME>"], [ctx.root, "<ROOT>"]]) out = out.split(from).join(to);
  for (const pid of ctx.pids) out = out.replace(new RegExp(`\\b${pid}\\b`, "g"), "<PID>");
  return out
    .replace(/"generated_at": "[^"]*"/g, '"generated_at": "<TIME>"')
    .replace(/"data_hash": "[^"]*"/g, '"data_hash": "<HASH>"')
    .replace(/\(started \d+\)/g, "(started <START>)")
    .replace(/"startTime": "\d+"/g, '"startTime": "<START>"')
    .replace(/dispatch-cwd--[0-9-]+\.lock/g, "dispatch-cwd--<KEY>.lock");
}

const withDir = (...tail) => (ctx) => tail.map((token) => (token === "<DIR>" ? ctx.dir : token));

export const cases = [
  // Refusals before anything runs.
  { id: "no-sub-verb", args: ["lock"], prepare: plain, exitOnly: true },
  { id: "unknown-sub-verb", args: ["lock", "unlock"], prepare: plain, exitOnly: true },
  { id: "no-lock-name", args: ["lock", "fence"], prepare: plain },
  { id: "yes-takes-the-name-as-its-value", args: ["lock", "fence", "--yes", "main-checkout"], prepare: plain },
  { id: "unknown-flag", args: ["lock", "fence", "main-checkout", "--bogus"], prepare: plain },
  { id: "equals-spelling-of-param", args: ["lock", "fence", "merge-slot", "--param=ref=1"], prepare: plain },
  { id: "equals-spelling-of-yes", args: ["lock", "fence", "main-checkout", "--yes=true"], prepare: plain },
  { id: "unknown-lock", args: ["lock", "fence", "no-such-lock", "--yes"], prepare: plain },
  { id: "param-without-equals", args: ["lock", "fence", "gateway", "--param", "bad"], prepare: plain },
  { id: "param-without-key", args: ["lock", "fence", "gateway", "--param", "=x"], prepare: plain },
  { id: "param-bare", args: ["lock", "fence", "gateway", "--param"], prepare: plain },
  { id: "path-param-missing", args: ["lock", "fence", "merge-slot", "--yes"], prepare: plain },
  { id: "path-param-missing-event-seal", args: ["lock", "fence", "event-seal"], prepare: plain },
  { id: "outside-a-project", args: ["lock", "fence", "gateway", "--yes"], prepare: nonProject() },
  // Free locks.
  { id: "free-fixed-row", args: ["lock", "fence", "gateway"], prepare: plain },
  { id: "free-main-checkout-with-yes", args: ["lock", "fence", "main-checkout", "--yes"], prepare: plain },
  { id: "free-machine-row", args: ["lock", "fence", "identity-pins"], prepare: plain },
  { id: "free-parametric-row", args: ["lock", "fence", "merge-slot", "--param", "ref=main"], prepare: plain },
  { id: "free-parametric-row-repeated-param", args: ["lock", "fence", "provider-account", "--param", "provider=codex", "--param", "account=a=b"], prepare: plain },
  { id: "free-cwd-keyed-row", args: (ctx) => ["lock", "fence", "dispatch-cwd", "--param", `cwd=${ctx.dir}`], prepare: plain },
  { id: "dir-names-the-project-from-outside", args: withDir("lock", "fence", "gateway", "--dir", "<DIR>"), prepare: fromOutside() },
  // Hot records.
  { id: "hot-record-absent", args: ["lock", "fence", "state"], prepare: plain },
  { id: "hot-record-absent-porting-events", args: ["lock", "fence", "porting-events"], prepare: plain },
  { id: "hot-record-torn-without-attestation", args: ["lock", "fence", "state"], prepare: withHotRecord("torn") },
  { id: "hot-record-torn-attested", args: ["lock", "fence", "state", "--attest-stopped"], prepare: withHotRecord("torn") },
  { id: "hot-record-unjudgeable-without-attestation", args: ["lock", "fence", "state"], prepare: withHotRecord("unjudgeable") },
  { id: "hot-record-unjudgeable-attested", args: ["lock", "fence", "state", "--attest-stopped"], prepare: withHotRecord("unjudgeable") },
  { id: "hot-record-dead-holder", args: ["lock", "fence", "state"], prepare: withHotRecord("dead") },
  { id: "hot-record-live-holder-unconfirmed", args: ["lock", "fence", "state"], prepare: withHotRecord("live") },
  { id: "hot-record-live-holder-confirmed", args: ["lock", "fence", "state", "--yes"], prepare: withHotRecord("live") },
  // Held locks.
  { id: "held-unconfirmed-lists-the-holder-and-signals-nothing", args: ["lock", "fence", "main-checkout"], prepare: holding("main-checkout") },
  { id: "held-confirmed-ends-the-holder", args: ["lock", "fence", "main-checkout", "--yes"], prepare: holding("main-checkout") },
  { id: "held-parametric-row-confirmed", args: ["lock", "fence", "merge-slot", "--param", "ref=main", "--yes"], prepare: holding("merge-slot", { ref: "main" }) },
  { id: "held-holder-ignoring-sigterm-is-killed", args: ["lock", "fence", "main-checkout", "--yes"], prepare: holdingStubborn(), timeoutMs: 40000 },
  { id: "held-by-the-runner-is-refused", args: ["lock", "fence", "main-checkout", "--yes"], prepare: heldByTheRunner() },
];

/** Runs `testCase` on both entries, a fresh fixture for each; the entry that runs first never sees the other's. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const answers = [];
  for (const entry of [entryA, entryB]) {
    const fixture = await testCase.prepare();
    try {
      const args = typeof testCase.args === "function" ? testCase.args(fixture.ctx) : testCase.args;
      const result = await runCaseOnEntry(entry, { id: testCase.id, args, cwd: fixture.cwd, env: fixture.env, timeoutMs: testCase.timeoutMs ?? 30000 }, { repoRoot: REPO_ROOT });
      answers.push({
        exit: result.exitCode,
        signal: result.signal,
        launchError: result.launchError,
        nodeChildren: result.spawnedChildren.filter((child) => path.basename(child.cmd) === "node").length,
        stdout: scrub(result.stdoutText, fixture.ctx),
        stderr: scrub(result.stderrText, fixture.ctx),
      });
    } finally {
      await fixture.teardown();
    }
  }
  const [a, b] = answers;
  const differences = [];
  if (a.launchError || b.launchError) differences.push(`launch failure: ${JSON.stringify([a.launchError, b.launchError])}`);
  if (b.nodeChildren > 0) differences.push(`the second entry started ${b.nodeChildren} node process(es)`);
  if (a.exit !== b.exit || a.signal !== b.signal) differences.push(`exit ${a.exit}/${a.signal} against ${b.exit}/${b.signal}`);
  if (!testCase.exitOnly) {
    if (a.stdout !== b.stdout) differences.push(`stdout differs:\n--- A\n${a.stdout}\n--- B\n${b.stdout}`);
    if (a.stderr !== b.stderr) differences.push(`stderr differs:\n--- A\n${a.stderr}\n--- B\n${b.stderr}`);
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences, a, b };
}
