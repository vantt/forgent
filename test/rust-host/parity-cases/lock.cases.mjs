// `lock fence` parity table: the host against the step's base release, on the step runner's protocol (a case names
// a fixture builder, its arguments and how it is compared):
//   semantic - exit code, stderr text and the JSON envelope data (hash and time fields are normalised away);
//   exact    - exit code, stdout and stderr bytes (every refusal);
//   accepted - the host answers differently on purpose, or the two entries cannot see the same process:
//              `exit` and `hostStderr` pin a refusal whose text the host changed, `check(host, base)` compares two
//              answers that name different processes and returns a problem or "".
// A fence signals and removes things, so a case that fences builds a fresh fixture, and holder, for each entry. A case
// that only reads the holders (a refusal without `--yes`) shares one held fixture between the entries, so both see the
// same process and the listing is compared byte for byte.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { observe } from "../../../src/native/process-identity.mjs";
import { holdLockInChild } from "../../helpers/hold-lock-in-child.mjs";
import { acquireSync, createLockScope } from "../../../src/holder-lock/index.mjs";

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "parity",
  GIT_AUTHOR_EMAIL: "parity@test",
  GIT_COMMITTER_NAME: "parity",
  GIT_COMMITTER_EMAIL: "parity@test",
};

const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lock-fence-parity-")));
const shared = [];
process.on("exit", () => {
  for (const close of shared) close();
  fs.rmSync(scratch, { recursive: true, force: true });
});

/** No directory above the fixture holds a store, or a call from outside a project would find it. */
function assertNoStoreAbove(dir) {
  for (let up = path.dirname(dir); up !== path.dirname(up); up = path.dirname(up)) {
    if (fs.existsSync(path.join(up, ".fgos"))) throw new Error(`${up} holds a .fgos above the fixture ${dir}`);
  }
}

/** A project (a Git repository with a `.fgos` directory) with its own state root and home. `cleanups` run on close. */
function project() {
  const temp = fs.mkdtempSync(path.join(scratch, "fx-"));
  const repo = path.join(temp, "repo");
  const state = path.join(temp, "state");
  const home = path.join(temp, "home");
  assertNoStoreAbove(repo);
  fs.mkdirSync(path.join(repo, ".fgos", "locks"), { recursive: true });
  fs.mkdirSync(state, { mode: 0o700 });
  fs.mkdirSync(home);
  execFileSync("git", ["init", "-q"], { cwd: repo, env: GIT_ENV });
  execFileSync("git", ["commit", "-q", "--allow-empty", "-m", "init"], { cwd: repo, env: GIT_ENV });
  const cleanups = [];
  return {
    temp,
    repo,
    cwd: repo,
    fgos: path.join(repo, ".fgos"),
    locks: path.join(repo, ".fgos", "locks"),
    env: { HOME: home, USERPROFILE: home, FGOS_STATE_ROOT: state, FGOS_SESSION_ID: "fgos-lock-fence-parity" },
    cleanups,
    close() {
      for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    },
  };
}

const here = (fixture, cwd) => ({ ...fixture, cwd });
const killOnClose = (fx, child) => {
  // A holder a shared fixture keeps must not keep this process alive: it is killed when the process ends.
  child.unref();
  fx.cleanups.push(() => child.kill("SIGKILL"));
};

/** Each shared fixture is built the first time a case asks for it, then seen by both entries. */
const memo = new Map();
const once = (name, build) => async () => {
  if (!memo.has(name)) {
    const fx = await build();
    shared.push(() => fx.close());
    // The runner closes a fixture after each entry; a shared one lives until this process ends.
    memo.set(name, { ...fx, close() {} });
  }
  return memo.get(name);
};

/** A Node process holding `name` under the project's store until killed. */
const holding = (name, params = {}) => async () => {
  const fx = project();
  const holder = await holdLockInChild(name, { fgosDir: fx.fgos, ...params });
  killOnClose(fx, holder.child);
  return fx;
};

/** A holder that ignores SIGTERM, so the fence has to kill it. */
async function holdingStubborn() {
  const fx = project();
  const ready = path.join(fx.temp, "ready");
  const child = spawn(process.execPath, ["--input-type=module", "-e", `
    import fs from 'node:fs';
    import { acquireSync, createLockScope } from ${JSON.stringify(new URL("../../../src/holder-lock/index.mjs", import.meta.url).href)};
    const res = acquireSync(createLockScope('stubborn'), 'main-checkout', { fgosDir: ${JSON.stringify(fx.fgos)} });
    if (res.result !== 'acquired') process.exit(3);
    process.on('SIGTERM', () => {});
    fs.writeFileSync(${JSON.stringify(ready)}, 'held');
    setInterval(() => {}, 1000);
  `], { stdio: "ignore" });
  killOnClose(fx, child);
  for (let tries = 0; tries < 400 && !fs.existsSync(ready); tries += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  if (!fs.existsSync(ready)) throw new Error("the stubborn holder never took main-checkout");
  return fx;
}

/** A hot record naming a process that is running, gone, or one this host cannot judge; or one that does not parse. */
function withHotRecord(kind, name = "state") {
  const fx = project();
  const record = path.join(fx.locks, `${name}.hot`);
  if (kind === "torn") {
    fs.writeFileSync(record, '{"v":1,"pid":');
  } else if (kind === "unjudgeable") {
    fs.writeFileSync(record, JSON.stringify({ v: 1, pid: 4000000, startTime: "1", bootId: "elsewhere", pidNs: "pid:[1]", host: "other-host" }));
  } else {
    const child = spawn("sleep", ["300"], { stdio: "ignore" });
    const { pid, startTime, bootId, pidNs } = observe(child.pid);
    fs.writeFileSync(record, JSON.stringify({ v: 1, pid, startTime, bootId, pidNs }));
    if (kind === "dead") {
      child.kill("SIGKILL");
    } else {
      killOnClose(fx, child);
    }
  }
  return fx;
}

/** The lock held by the process that runs the cases, which the fence must refuse to signal. */
const heldByTheRunner = () => {
  const fx = project();
  const mine = acquireSync(createLockScope("parity-runner"), "main-checkout", { fgosDir: fx.fgos });
  if (mine.result !== "acquired") throw new Error("the runner could not take main-checkout");
  fx.cleanups.push(() => mine.handle.release());
  return fx;
};

const builders = {
  free: async () => project(),
  "free-from-outside": async () => {
    const fx = project();
    const outside = path.join(fx.temp, "outside");
    fs.mkdirSync(outside);
    return here(fx, outside);
  },
  nonproject: async () => {
    const fx = project();
    const empty = path.join(fx.temp, "empty");
    fs.mkdirSync(empty);
    return here(fx, empty);
  },
  "hot-torn": async () => withHotRecord("torn"),
  "hot-unjudgeable": async () => withHotRecord("unjudgeable"),
  "hot-dead": async () => withHotRecord("dead"),
  "hot-live": async () => withHotRecord("live"),
  "hot-live-shared": once("hot-live-shared", async () => withHotRecord("live")),
  held: holding("main-checkout"),
  "held-shared": once("held-shared", holding("main-checkout")),
  "held-merge-slot": holding("merge-slot", { ref: "main" }),
  "held-stubborn": holdingStubborn,
  "held-by-the-runner": once("held-by-the-runner", async () => heldByTheRunner()),
};

/** Two answers of a fence that name different holder processes: everything but the process ids must agree. */
function sameFence(host, base) {
  const shape = (data) => JSON.stringify({
    lock: data.lock,
    path: data.path.replace(/--\d+-\d+-\d+\.lock$/, "--<key>.lock"),
    status: data.status,
    holders: data.holders.map((holder) => Object.keys(holder).sort()),
    terminated: data.terminated.length,
    killed: data.killed.length,
  });
  return shape(host) === shape(base) ? "" : `host ${shape(host)} against base ${shape(base)}`;
}

const read = (id, fixture, args, extra = {}) => ({ id: `lock-fence-${id}`, fixture, args, mode: "semantic", ...extra });
const refusal = (id, fixture, args) => ({ id: `lock-fence-${id}`, fixture, args, mode: "exact" });
const fence = (id, fixture, args) => ({ id: `lock-fence-${id}`, fixture, args, mode: "accepted", check: sameFence });

const cases = [
  // The host's one text for a missing or unknown sub-command.
  { id: "lock-fence-no-sub-verb", fixture: "free", args: ["lock"], mode: "accepted", exit: 4, hostStderr: "fgos: lock requires a subcommand. Available: fence" },
  { id: "lock-fence-unknown-sub-verb", fixture: "free", args: ["lock", "unlock"], mode: "accepted", exit: 4, hostStderr: 'fgos: unknown lock subcommand "unlock". Available: fence' },

  // Refusals before anything runs.
  refusal("no-lock-name", "free", ["lock", "fence"]),
  refusal("yes-takes-the-name-as-its-value", "free", ["lock", "fence", "--yes", "main-checkout"]),
  refusal("unknown-flag", "free", ["lock", "fence", "main-checkout", "--bogus"]),
  refusal("equals-spelling-of-param", "free", ["lock", "fence", "merge-slot", "--param=ref=1"]),
  refusal("equals-spelling-of-yes", "free", ["lock", "fence", "main-checkout", "--yes=true"]),
  refusal("unknown-lock", "free", ["lock", "fence", "no-such-lock", "--yes"]),
  refusal("param-without-equals", "free", ["lock", "fence", "gateway", "--param", "bad"]),
  refusal("param-without-key", "free", ["lock", "fence", "gateway", "--param", "=x"]),
  refusal("param-bare", "free", ["lock", "fence", "gateway", "--param"]),
  refusal("path-param-missing", "free", ["lock", "fence", "merge-slot", "--yes"]),
  refusal("path-param-missing-event-seal", "free", ["lock", "fence", "event-seal"]),
  refusal("outside-a-project", "nonproject", ["lock", "fence", "gateway", "--yes"]),

  // Free locks.
  read("free-fixed-row", "free", ["lock", "fence", "gateway"]),
  read("free-main-checkout-with-yes", "free", ["lock", "fence", "main-checkout", "--yes"]),
  read("free-machine-row", "free", ["lock", "fence", "identity-pins"]),
  read("free-parametric-row", "free", ["lock", "fence", "merge-slot", "--param", "ref=main"]),
  read("free-parametric-row-repeated-param", "free", ["lock", "fence", "provider-account", "--param", "provider=codex", "--param", "account=a=b"]),
  // The key is the directory's device, inode and birth time, which differ between the entries' fixtures.
  fence("free-cwd-keyed-row", "free", (f) => ["lock", "fence", "dispatch-cwd", "--param", `cwd=${f.repo}`]),
  read("dir-names-the-project-from-outside", "free-from-outside", (f) => ["lock", "fence", "gateway", "--dir", f.repo]),

  // Hot records.
  read("hot-record-absent", "free", ["lock", "fence", "state"]),
  read("hot-record-absent-porting-events", "free", ["lock", "fence", "porting-events"]),
  refusal("hot-record-torn-without-attestation", "hot-torn", ["lock", "fence", "state"]),
  read("hot-record-torn-attested", "hot-torn", ["lock", "fence", "state", "--attest-stopped"]),
  refusal("hot-record-unjudgeable-without-attestation", "hot-unjudgeable", ["lock", "fence", "state"]),
  read("hot-record-unjudgeable-attested", "hot-unjudgeable", ["lock", "fence", "state", "--attest-stopped"]),
  read("hot-record-dead-holder", "hot-dead", ["lock", "fence", "state"]),
  refusal("hot-record-live-holder-unconfirmed", "hot-live-shared", ["lock", "fence", "state"]),
  fence("hot-record-live-holder-confirmed", "hot-live", ["lock", "fence", "state", "--yes"]),

  // Held locks.
  refusal("held-unconfirmed-lists-the-holder-and-signals-nothing", "held-shared", ["lock", "fence", "main-checkout"]),
  fence("held-confirmed-ends-the-holder", "held", ["lock", "fence", "main-checkout", "--yes"]),
  fence("held-parametric-row-confirmed", "held-merge-slot", ["lock", "fence", "merge-slot", "--param", "ref=main", "--yes"]),
  fence("held-holder-ignoring-sigterm-is-killed", "held-stubborn", ["lock", "fence", "main-checkout", "--yes"]),
  refusal("held-by-the-runner-is-refused", "held-by-the-runner", ["lock", "fence", "main-checkout", "--yes"]),
];

export { builders, cases };
