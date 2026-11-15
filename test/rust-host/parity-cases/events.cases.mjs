// Parity table of `fgos events sync|status|seal|export`: the host answers like the release the step started from.
//
// Every case runs on a fresh project per entry (the verbs write: seal, sync and export change the store), built by
// `prepare` at the same path for both entries so the answers can be compared byte for byte, and `evidence` reads
// what the call left behind (the files under the store, the fault records, the state root) so a difference in an
// effect fails like a difference in an answer. A runner calls, per entry: `prepare(case, scratch)`, the entry with the
// returned `cwd`/`args`/`env`, then `evidence(fixture)`.
//
// `accepted` names a difference the migration accepts, as the pair of exit codes and the host's refusal text; the
// entries must differ in exactly that way and in no other.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
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
