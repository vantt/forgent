// Parity table of `fgos events sync|status|seal|export`: the host answers like the release the step started from.
//
// Every case runs on a fresh project per entry (the verbs write: seal, sync and export change the store), built by
// `prepare` at the same path for both entries so the answers can be compared byte for byte, and `evidence` reads
// what the call left behind (the files under the store, the fault records, the state root) so a difference in an
// effect fails like a difference in an answer. `runPreparedCase(entryA, entryB, testCase)` runs one case on both entries, one
// after the other, and compares them.
//
// `accepted` names a difference the migration accepts, as the pair of exit codes and the host's refusal text; the
// entries must differ in exactly that way and in no other.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { runCaseOnEntry, compareResults } from "../harness.mjs";
import { initializeWorkRepository } from "../../helpers/work-store-release.mjs";
import { writeProjectConfig } from "../../helpers/config-fixture.mjs";
import { prepareWorkStore } from "../../../src/state/work-event-store.mjs";
import { fixGitFetchMapping } from "../../../src/setup/git-checks.mjs";
import { resolveFaultLogPath } from "../../../src/observe/invocation-fault-log.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { stdio: "pipe" });

/** A project the Event Store can open: a repository with its fence and machine id, and a store that never publishes. */
function project(root, { remote = false, events = false } = {}) {
  const repo = path.join(root, "repo");
  const dir = initializeWorkRepository(repo);
  writeProjectConfig(repo, { eventStore: { sync: { intervalSec: 0 } } });
  if (remote) {
    git(root, "init", "--bare", "-q", path.join(root, "remote"));
    git(repo, "remote", "add", "origin", path.join(root, "remote"));
    fixGitFetchMapping(repo);
  }
  if (events) {
    const { store } = prepareWorkStore(dir, dir);
    for (const [index, id] of ["a", "b", "c"].entries()) {
      store.append("project", [{ eventType: "work.add", schemaVersion: 1, payload: { id: `item-${id}` }, ts: `2026-01-0${index + 1}T00:00:00.000Z` }], {}, "fixture", []);
    }
  }
  return repo;
}

const FIXTURES = {
  project: (root) => ({ repo: project(root) }),
  remote: (root) => ({ repo: project(root, { remote: true }) }),
  events: (root) => ({ repo: project(root, { events: true }) }),
  "events-remote": (root) => ({ repo: project(root, { events: true, remote: true }) }),
  nonproject: (root) => {
    const repo = path.join(root, "repo");
    fs.mkdirSync(repo, { recursive: true });
    return { repo, cwd: repo };
  },
  linked: (root) => {
    const repo = project(root);
    git(repo, "commit", "-q", "--allow-empty", "-m", "seed");
    const linked = path.join(root, "linked");
    git(repo, "worktree", "add", "-q", "--detach", linked);
    return { repo, cwd: linked };
  },
  // The caller stands outside the project and names it.
  elsewhere: (root) => {
    const repo = project(root);
    const cwd = path.join(root, "elsewhere");
    fs.mkdirSync(cwd);
    return { repo, cwd };
  },
  // As `gone`, for a project whose machine id lives only in the (removed) state root, as a project set up by the host has it.
  "gone-machine-in-state": (root) => {
    const repo = project(root);
    git(repo, "config", "--unset", "fgos.machineId");
    return { repo, env: { FGOS_STATE_ROOT: path.join(root, "state-gone") }, stateRoot: path.join(root, "state-gone") };
  },
  // A directory that is no repository, and a state root that is gone.
  "gone-nonproject": (root) => {
    const repo = path.join(root, "repo");
    fs.mkdirSync(repo, { recursive: true });
    return { repo, cwd: repo, env: { FGOS_STATE_ROOT: path.join(root, "state-gone") }, stateRoot: path.join(root, "state-gone") };
  },
  // The state root the call finds is gone: a detached child skips, and nothing may recreate it.
  gone: (root) => {
    const repo = project(root);
    return { repo, env: { FGOS_STATE_ROOT: path.join(root, "state-gone") }, stateRoot: path.join(root, "state-gone") };
  },
};

/** Builds the fixture of `testCase` under `scratch` and the call to run: the `{REPO}`, `{OUT}` and `{STATE}` tokens of its args are filled in. */
export function prepare(testCase, scratch) {
  fs.mkdirSync(scratch, { recursive: true });
  const built = FIXTURES[testCase.fixture](scratch);
  const tokens = { "{REPO}": built.repo, "{OUT}": path.join(scratch, "out"), "{STATE}": built.stateRoot ?? "" };
  const fill = (text) => Object.entries(tokens).reduce((acc, [token, value]) => acc.split(token).join(value), text);
  return {
    scratch,
    repo: built.repo,
    stateRoot: built.stateRoot ?? null,
    out: tokens["{OUT}"],
    cwd: built.cwd ?? built.repo,
    env: built.env ?? {},
    args: testCase.args.map(fill),
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

/** What a call left behind, comparable between entries: the store's files, the fault records, the state root, the export. */
export function evidence(fixture) {
  const dir = path.join(fixture.repo, ".fgos");
  const log = fs.existsSync(dir) ? resolveFaultLogPath(dir, fixture.repo) : null;
  const faults = log && fs.existsSync(log)
    ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => {
      const record = JSON.parse(line);
      return { faultClass: record.faultClass, message: record.message, verb: record.verb, sub: record.sub };
    })
    : [];
  const storeFiles = listFiles(path.join(fixture.repo, ".git", "fgos", "events")).filter((file) => !file.endsWith("store.json") && !/\.tmp$/.test(file));
  const exported = fs.existsSync(fixture.out) ? listFiles(fixture.out).map((file) => [file, fs.readFileSync(path.join(fixture.out, file), "utf8").split("\n").length]) : null;
  return { faults, storeFiles, exported, stateRootExists: fixture.stateRoot ? fs.existsSync(fixture.stateRoot) : null };
}

const SEMANTIC = ["semantic-json"];
const EXACT = ["exact-bytes"];
const LINE = /^fgos: invocation fault recorded to .*\n/m;

const c = (id, fixture, args, options = {}) => ({ id: `events-${id}`, fixture, args: ["events", ...args], modes: SEMANTIC, ignoreChildren: true, ...options });
// A refusal compared on exit code and exact stderr bytes.
const refusal = (id, fixture, args, expectedExitCode, options = {}) => c(id, fixture, args, { modes: EXACT, expectedExitCode, ...options });
// A call whose text the migration changes on purpose: the pair of exits and the host's own words.
const accepted = (id, fixture, args, baseExit, hostExit, hostText, options = {}) =>
  c(id, fixture, args, { modes: [], accepted: { baseExit, hostExit, hostText }, ...options });
// A detached child that fails records why; the host prints no record line, so that one stderr line is dropped.
const child = (options = {}) => ({ dropRecordLine: LINE.source, ...options });

export const cases = [
  // status
  c("status", "events", ["status"], { expectedExitCode: 0, jsonIgnorePaths: ["data.facts"] }),
  c("status-empty-store", "project", ["status"], { expectedExitCode: 0, jsonIgnorePaths: ["data.facts"] }),
  c("status-remote-named", "project", ["status", "--remote", "origin"], { expectedExitCode: 0, jsonIgnorePaths: ["data.facts"] }),
  c("status-remote-other", "project", ["status", "--remote", "elsewhere"], { expectedExitCode: 0, jsonIgnorePaths: ["data.facts"] }),
  c("status-linked-worktree", "linked", ["status"], { expectedExitCode: 0, jsonIgnorePaths: ["data.facts"] }),
  c("status-named-dir-from-elsewhere", "elsewhere", ["status", "--dir", "{REPO}"], { expectedExitCode: 0, jsonIgnorePaths: ["data.facts"] }),
  refusal("status-no-repository", "nonproject", ["status"], 1),
  accepted("status-remote-bare", "project", ["status", "--remote"], 1, 4, "events status --remote needs a value"),
  refusal("status-unknown-flag", "project", ["status", "--bogus"], 4),
  refusal("status-equals-flag", "project", ["status", "--remote=origin"], 4),
  // sync
  refusal("sync-no-remote", "project", ["sync"], 1),
  refusal("sync-no-push-no-remote", "project", ["sync", "--no-push"], 1),
  c("sync-no-push", "remote", ["sync", "--no-push"], { expectedExitCode: 0, jsonIgnorePaths: ["data.status"] }),
  c("sync-publishes", "events-remote", ["sync"], { expectedExitCode: 0, jsonIgnorePaths: ["data.status"] }),
  c("sync-opportunistic-no-remote", "project", ["sync", "--opportunistic"], { expectedExitCode: 0 }),
  c("sync-opportunistic", "events-remote", ["sync", "--opportunistic"], { expectedExitCode: 0 }),
  accepted("sync-remote-bare", "project", ["sync", "--remote"], 1, 4, "events sync --remote needs a value"),
  accepted("sync-no-push-valued", "project", ["sync", "--no-push", "yes"], 1, 4, "events sync --no-push takes no value"),
  refusal("sync-unknown-flag", "project", ["sync", "--bogus"], 4),
  // seal
  refusal("seal-no-stream", "project", ["seal"], 4, child()),
  refusal("seal-bad-stream", "project", ["seal", "--stream", "Bad_1"], 4, child()),
  refusal("seal-bare-stream", "project", ["seal", "--stream"], 4, child()),
  refusal("seal-equals-flag", "project", ["seal", "--stream=project"], 4),
  refusal("seal-unlisted-stream", "project", ["seal", "--stream", "demo"], 1, child()),
  c("seal-empty-stream", "project", ["seal", "--stream", "project"], { expectedExitCode: 0 }),
  c("seal-open-events", "events", ["seal", "--stream", "project"], { expectedExitCode: 0 }),
  refusal("seal-history-outside-cache", "events", ["seal", "--stream", "project", "--history", "/tmp/elsewhere.json"], 4, child()),
  refusal("seal-history-relative", "events", ["seal", "--stream", "project", "--history", "cache/h.json"], 4, child()),
  refusal("seal-history-bare", "events", ["seal", "--stream", "project", "--history"], 4, child()),
  refusal("seal-history-escapes-cache", "events", ["seal", "--stream", "project", "--history", "{REPO}/.fgos/cache/../x.json"], 4, child()),
  c("seal-history-in-cache", "events", ["seal", "--stream", "project", "--history", "{REPO}/.fgos/cache/history.json"], { expectedExitCode: 0 }),
  // a detached child never rebuilds a state root its owner removed
  c("seal-state-root-gone", "gone", ["seal", "--stream", "project", "--dir", "{REPO}"], { expectedExitCode: 0 }),
  c("sync-opportunistic-state-root-gone", "gone", ["sync", "--opportunistic", "--dir", "{REPO}"], { expectedExitCode: 0 }),
  // The same child with no --dir: the root the doors resolve is the project, so it skips too.
  c("seal-state-root-gone-no-dir", "gone-machine-in-state", ["seal", "--stream", "project"], { expectedExitCode: 0 }),
  c("seal-unlisted-stream-state-root-gone-no-dir", "gone-machine-in-state", ["seal", "--stream", "demo"], { expectedExitCode: 0, dropRecordLine: LINE.source }),
  c("seal-state-root-gone-outside-a-repository", "gone-nonproject", ["seal", "--stream", "project"], { expectedExitCode: 0 }),
  c("sync-opportunistic-state-root-gone-no-dir", "gone-machine-in-state", ["sync", "--opportunistic"], { expectedExitCode: 0 }),
  c("sync-state-root-gone-foreground", "gone", ["sync", "--no-push", "--dir", "{REPO}"], { modes: [], ignoreStderr: true }),
  // export
  c("export", "events", ["export", "--out", "{OUT}"], { expectedExitCode: 0, jsonIgnorePaths: ["data.cursor"] }),
  c("export-stream", "events", ["export", "--out", "{OUT}", "--stream", "project"], { expectedExitCode: 0, jsonIgnorePaths: ["data.cursor"] }),
  c("export-since-default", "events", ["export", "--out", "{OUT}", "--stream", "project", "--since", "null"], { expectedExitCode: 0, jsonIgnorePaths: ["data.cursor"] }),
  c("export-empty-store", "project", ["export", "--out", "{OUT}"], { expectedExitCode: 0, jsonIgnorePaths: ["data.cursor"] }),
  refusal("export-no-out", "project", ["export"], 1),
  refusal("export-bare-out", "project", ["export", "--out"], 1),
  refusal("export-unlisted-stream", "events", ["export", "--out", "{OUT}", "--stream", "demo"], 1),
  accepted("export-since-not-json", "events", ["export", "--out", "{OUT}", "--since", "notjson"], 1, 4, "events export --since must be a cursor as JSON"),
  accepted("export-stream-bare", "events", ["export", "--out", "{OUT}", "--stream"], 1, 4, "events export --stream needs a value"),
  // the call itself
  refusal("no-sub-command", "project", [], 4, { modes: [], accepted: { baseExit: 4, hostExit: 4, hostText: "events requires a subcommand. Available: sync, status, seal, export" } }),
  refusal("unknown-sub-command", "project", ["bogus"], 4, { modes: [], accepted: { baseExit: 4, hostExit: 4, hostText: 'unknown events subcommand "bogus". Available: sync, status, seal, export' } }),
  refusal("flag-before-sub-command", "project", ["--remote", "status"], 4, { modes: [], accepted: { baseExit: 4, hostExit: 4, hostText: "events requires a subcommand. Available: sync, status, seal, export" } }),
];

// What differs between two runs by nature: ages and times, store ids, commit ids, and the value of a `--k=v` token
// the host redacts in a fault record.
const VOLATILE = [
  [/"(oldestUnsealedAgeSec|time|createdAt|at|startedAt|lastSeq)": \d+/g, '"$1": <n>'],
  [/[0-9a-f]{40}/g, "<sha>"],
  [/[0-9a-f]{32}/g, "<id>"],
  [/--([a-z-]+)=(<\d+>|[^"\\\s]*)/g, "--$1=<v>"],
];
const normalize = (text) => VOLATILE.reduce((acc, [pattern, to]) => acc.replace(pattern, to), text);

function dataText(text, ignorePaths) {
  const json = JSON.parse(text);
  const hashesItself = crypto.createHash("sha256").update(JSON.stringify(json.data)).digest("hex") === json.data_hash;
  for (const dotted of ignorePaths ?? []) {
    const keys = dotted.split(".").slice(1);
    let node = json.data;
    for (const key of keys.slice(0, -1)) node = node?.[key];
    if (node && typeof node === "object") delete node[keys.at(-1)];
  }
  // Key order is part of the answer (the envelope hashes the data as printed), so the text keeps it.
  return { hashesItself, text: normalize(JSON.stringify(json.data, null, 1)) };
}

const normaliseFaults = (left) => ({ ...left, faults: left.faults.map((fault) => ({ ...fault, message: normalize(fault.message) })) });

async function runOn(entry, testCase, parent) {
  fs.rmSync(parent, { recursive: true, force: true });
  const fixture = prepare(testCase, path.join(parent, "w"));
  const result = await runCaseOnEntry(entry, { id: testCase.id, args: fixture.args, cwd: fixture.cwd, env: fixture.env, ignoreChildren: true, timeoutMs: 120000 });
  const left = evidence(fixture);
  fs.rmSync(parent, { recursive: true, force: true });
  return { result, left };
}

function withoutRecordLine(result, pattern) {
  if (!pattern) return result;
  const text = result.stderrText.replace(new RegExp(pattern, "m"), "");
  return { ...result, stderrText: text, stderr: Buffer.from(text) };
}

/** Every `.fgos` above `dir`: a call from a fixture would take one of them for its project and write into it. */
function storesAbove(dir) {
  const found = [];
  for (let up = path.dirname(dir); up !== path.dirname(up); up = path.dirname(up)) {
    if (fs.existsSync(path.join(up, ".fgos"))) found.push(path.join(up, ".fgos"));
  }
  if (fs.existsSync(path.join(path.parse(dir).root, ".fgos"))) found.push(path.join(path.parse(dir).root, ".fgos"));
  return found;
}

/** Runs `testCase` on both entries (a fresh project each, at the same path) and compares them; `{ caseId, passed, differences }`. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const parent = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "events-parity-")), "p");
  // Each fixture is its own repository root with its own `.fgos`: nothing above it may be a project, before or after.
  const before = storesAbove(parent);
  const a = await runOn(entryA, testCase, parent);
  const b = await runOn(entryB, testCase, parent);
  const after = storesAbove(parent);
  fs.rmSync(path.dirname(parent), { recursive: true, force: true });
  if (before.length > 0 || after.length > 0) {
    return { caseId: testCase.id, passed: false, differences: [`a .fgos exists above the fixture tree (before: ${before}; after: ${after})`] };
  }
  const ra = withoutRecordLine(a.result, testCase.dropRecordLine);
  const rb = withoutRecordLine(b.result, testCase.dropRecordLine);
  const differences = [];
  if (rb.spawnedChildren.some((child) => path.basename(child.cmd) === "node")) differences.push("the host entry started a node process");
  if (testCase.accepted) {
    const { baseExit, hostExit, hostText, hostStdout, hostStateRootAbsent } = testCase.accepted;
    if (ra.exitCode !== baseExit) differences.push(`base exit ${ra.exitCode} != ${baseExit}`);
    if (rb.exitCode !== hostExit) differences.push(`host exit ${rb.exitCode} != ${hostExit}`);
    if (!rb.stderrText.includes(hostText)) differences.push(`host stderr lacks "${hostText}": ${rb.stderrText}`);
    if (hostStdout && !rb.stdoutText.includes(hostStdout)) differences.push(`host stdout lacks "${hostStdout}": ${rb.stdoutText}`);
    if (hostStateRootAbsent && b.left.stateRootExists !== false) differences.push("the host left a state root behind");
  } else {
    const wanted = testCase.modes ?? [];
    const quiet = (result) => (testCase.ignoreStderr ? { ...result, stderr: Buffer.alloc(0), stderrText: "" } : result);
    differences.push(...compareResults({ ...testCase, modes: [], ignoreChildren: true }, quiet(ra), quiet(rb)).differences);
    if (wanted.includes("exact-bytes")) {
      if (!ra.stdout.equals(rb.stdout)) differences.push("stdout bytes differ");
      if (!ra.stderr.equals(rb.stderr)) differences.push("stderr bytes differ");
    }
    if (wanted.includes("semantic-json")) {
      const da = dataText(ra.stdoutText, testCase.jsonIgnorePaths);
      const db = dataText(rb.stdoutText, testCase.jsonIgnorePaths);
      if (!da.hashesItself || !db.hashesItself) differences.push("data_hash does not hash its own data");
      if (da.text !== db.text) differences.push(`data differs:\n--- base\n${da.text.slice(0, 1500)}\n--- host\n${db.text.slice(0, 1500)}`);
      if (ra.stderrText !== rb.stderrText) differences.push(`stderr differs: ${JSON.stringify(ra.stderrText)} vs ${JSON.stringify(rb.stderrText)}`);
    }
    if (JSON.stringify(normaliseFaults(a.left)) !== JSON.stringify(normaliseFaults(b.left))) {
      differences.push(`what the call left behind differs: ${JSON.stringify(a.left)} vs ${JSON.stringify(b.left)}`);
    }
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}
