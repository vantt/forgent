// Help parity table: every help form the Node payload answers, plus the refusals, as exact-byte cases.
// The selectors and sub-verbs come from the generated route and manifest files, never a restated list,
// so a verb added to the registry shows up here on the next regeneration.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const contracts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../packages/host-runtime/contracts");
const routes = JSON.parse(fs.readFileSync(path.join(contracts, "command-routes.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(contracts, "command-manifest.json"), "utf8"));

const HELP_FLAGS = new Set(["--help", "-h"]);
const selectors = Object.keys(routes).sort();
const verbs = selectors.filter((selector) => !HELP_FLAGS.has(selector));

// Help reads no store, so every case runs from a directory that holds none.
const cwd = os.tmpdir();
const helpCase = (id, args, expectedExitCode) => ({
  id: `help-${id}`,
  args,
  cwd,
  modes: ["exact-bytes"],
  ...(expectedExitCode === undefined ? {} : { expectedExitCode }),
  ignoreChildren: true,
});

const cases = [];

for (const flag of selectors.filter((selector) => HELP_FLAGS.has(selector))) {
  cases.push(helpCase(`${flag}`, [flag], 0));
  cases.push(helpCase(`${flag}-json`, [flag, "--json"], 0));
}

for (const verb of verbs) {
  cases.push(helpCase(`${verb}-long`, [verb, "--help"], 0));
  cases.push(helpCase(`${verb}-long-json`, [verb, "--help", "--json"], 0));
  cases.push(helpCase(`${verb}-short`, [verb, "-h"], 0));
  cases.push(helpCase(`${verb}-leading-long`, ["--help", verb], 0));
  cases.push(helpCase(`${verb}-leading-short-json`, ["-h", verb, "--json"], 0));
}

for (const command of manifest.commands) {
  for (const sub of Object.keys(command.subcommands ?? {})) {
    cases.push(helpCase(`${command.name}-${sub}-json`, [command.name, sub, "--help", "--json"], 0));
  }
}

// Refusals and leniencies the Node payload has today; the host must answer the same bytes and exit code.
cases.push(helpCase("refusal-unknown-sub", ["metrics", "bogus", "--help"], 4));
cases.push(helpCase("refusal-unknown-sub-json", ["dispatch", "bogus", "--help", "--json"], 4));
cases.push(helpCase("refusal-leading-unknown-word", ["-h", "foo"], 4));
cases.push(helpCase("refusal-unknown-option", ["--help", "--bogus"], 4));
cases.push(helpCase("refusal-unknown-sub-after-flag", ["--help", "dispatch", "bogus", "--json"], 4));
cases.push(helpCase("too-many-words", ["ready", "a", "b", "c", "--help"]));
cases.push(helpCase("sub-on-verb-without-subs", ["ready", "bogus", "--help"]));
cases.push(helpCase("unknown-option-after-verb", ["ready", "--bogus", "--help"]));
cases.push(helpCase("dir-option", ["--help", "--dir", path.join(cwd, "fgos-help-parity-no-such-dir")]));

export { cases };
