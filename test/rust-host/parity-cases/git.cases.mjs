// `git status|recover` parity table: the host against the step's base release, one fresh fixture per entry.
// A case names its fixture, its arguments (a function of the fixture for paths) and how it is compared:
//   semantic - exit code, stderr text and the JSON envelope data (the hash and time fields are normalised away);
//   exact    - exit code, stdout and stderr bytes (every refusal);
//   after    - also: the same entry answers `git status` the same afterwards, and the files the call wrote are the same.
// `accepted` marks a case whose host answer differs on purpose; its `check` states what the host answers instead.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fixture as landFixture } from "../../git/land-fixture.mjs";
import { recoverGitOperations } from "../../../src/git/status.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** A fixture: `build()` returns { cwd, repo, env, close } for one entry. */
const builders = {
  repo: () => base(),
  pending: async () => { const f = base(); await interrupt(f); return f; },
  retained: async () => { const f = base(); await interrupt(f); recoverGitOperations(f.repo, { loaderOptions: f.loader, portOptions: f.options }); return f; },
  merge: () => { const f = base(); fs.writeFileSync(path.join(f.repo, ".git/MERGE_HEAD"), `${git(f.repo, "rev-parse", "HEAD")}\n`); return f; },
  locks: () => { const f = base(); fs.writeFileSync(path.join(f.repo, ".git/index.lock"), ""); return f; },
  nonrepo: () => outside(),
  linked: () => linked(false),
  frozen: () => linked(true),
};

function base() {
  const f = landFixture();
  return Object.assign(f, { cwd: f.repo, env: entryEnv(f.options.stateRoot) });
}
const entryEnv = (stateRoot) => ({ FGOS_STATE_ROOT: stateRoot, FGOS_SESSION_ID: "parity-writer" });

async function interrupt(f) {
  const land = f.port();
  await land.prepare({ operationId: "parity-land", request: f.request });
  land.close();
}

function outside() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-parity-outside-"));
  const state = path.join(temp, "state");
  fs.mkdirSync(state, { mode: 0o700 });
  // A real repository to name with --dir from here.
  const repo = base();
  return { temp, repo: repo.repo, cwd: temp, env: entryEnv(repo.options.stateRoot), close() { repo.close(); fs.rmSync(temp, { recursive: true, force: true }); }, options: repo.options, loader: repo.loader };
}

function linked(frozen) {
  const f = base();
  const wt = path.join(f.temp, "linked");
  git(f.repo, "worktree", "add", "-q", "-b", "side", wt);
  if (frozen) fs.mkdirSync(path.join(wt, ".fgos"), { recursive: true });
  return Object.assign(f, { cwd: wt });
}

const status = (id, fixture, args, extra = {}) => ({ id: `status-${id}`, fixture, args, mode: "semantic", ...extra });
const refusal = (id, fixture, args, extra = {}) => ({ id, fixture, args, mode: "exact", ...extra });

const cases = [
  status("clean", "repo", ["git", "status", "--json"]),
  status("clean-without-json", "repo", ["git", "status"]),
  status("pending-land", "pending", ["git", "status", "--json"]),
  status("retained-land", "retained", ["git", "status", "--json"]),
  status("merge-in-progress", "merge", ["git", "status", "--json"]),
  status("native-lock", "locks", ["git", "status", "--json"]),
  status("outside-a-repository", "nonrepo", ["git", "status", "--json"]),
  status("dir-names-a-repository", "nonrepo", (f) => ["git", "status", "--dir", f.repo, "--json"]),
  status("dir-before-the-sub-command", "nonrepo", (f) => ["git", "--dir", f.repo, "status", "--json"]),
  status("linked-worktree", "linked", ["git", "status", "--json"]),
  status("frozen-worktree", "frozen", ["git", "status", "--json"]),
  status("frozen-worktree-dir-names-main", "frozen", (f) => ["git", "status", "--dir", f.repo, "--json"]),
  { id: "recover-nothing", fixture: "repo", args: ["git", "recover", "--json"], mode: "after" },
  { id: "recover-interrupted-land", fixture: "pending", args: ["git", "recover", "--json"], mode: "after" },
  { id: "recover-merge-in-progress", fixture: "merge", args: ["git", "recover", "--json"], mode: "semantic" },
  { id: "recover-from-a-linked-worktree", fixture: "linked", args: ["git", "recover", "--json"], mode: "semantic" },
  {
    id: "recover-dir-names-a-linked-worktree-from-outside",
    fixture: "linked",
    args: (f) => ["git", "recover", "--dir", f.cwd, "--json"],
    mode: "semantic",
  },
  // The base prints `--sha [object Object]` outside a repository; the host answers no merge pointer.
  {
    id: "recover-outside-a-repository",
    fixture: "nonrepo",
    args: ["git", "recover", "--json"],
    mode: "accepted",
    host: { recovered: [], kept: [], message: "no interrupted Land, ScopedCommit or remote transfer operation" },
    base: (data) => data.next?.includes("[object Object]"),
  },
  // One host text for a missing or unknown sub-command, exit 4 in both.
  { id: "no-sub-command", fixture: "repo", args: ["git"], mode: "accepted", exit: 4, hostStderr: "fgos: git requires a subcommand. Available: status, recover\n" },
  { id: "unknown-sub-command", fixture: "repo", args: ["git", "bogus"], mode: "accepted", exit: 4, hostStderr: 'fgos: unknown git subcommand "bogus". Available: status, recover\n' },
  refusal("status-unknown-flag", "repo", ["git", "status", "--bogus"]),
  refusal("recover-unknown-flag", "repo", ["git", "recover", "--bogus"]),
  refusal("status-dir-equals-spelling", "repo", (f) => ["git", "status", `--dir=${f.repo}`]),
  refusal("status-bare-dir", "repo", ["git", "status", "--dir"]),
  refusal("status-empty-dir", "repo", ["git", "status", "--dir", ""]),
];

export { cases, builders };
