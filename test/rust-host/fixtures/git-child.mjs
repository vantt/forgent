// Grandchild for the evidence-symmetry self-test: a Node process that starts git exactly once.
import { execFileSync } from "node:child_process";

execFileSync("git", ["rev-parse", "--show-toplevel"], { stdio: "ignore" });
