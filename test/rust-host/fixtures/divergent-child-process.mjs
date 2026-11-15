#!/usr/bin/env node
// Divergent fixture: spawns an unexpected child process
import { execFileSync } from "node:child_process";

// Unexpected child process execution, started by name so the harness PATH shim sees it
execFileSync("node", ["-e", "process.exit(0)"]);

const args = process.argv.slice(2);
const payload = {
  contract: "test.v1",
  status: "ok",
  receivedArgs: args,
  message: "baseline execution payload",
};
process.stdout.write(JSON.stringify(payload) + "\n");
process.exit(0);
