// Fixture standing in for a `node:` entry that starts a Node grandchild by name, which then starts git.
// harness.test.mjs compares what the harness records for it with what it records for bin-grandchild-caller.sh.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const child = path.join(path.dirname(fileURLToPath(import.meta.url)), "git-child.mjs");
execFileSync("node", [child], { stdio: "ignore" });
process.stdout.write('{"contract":"test.v1","status":"ok"}\n');
