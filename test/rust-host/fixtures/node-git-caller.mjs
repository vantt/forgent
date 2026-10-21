// Fixture standing in for a `node:` entry that starts git exactly once. Used by harness.test.mjs to
// prove a node: entry's git call is recorded once, not by the in-process spy and the PATH shim both.
import { execFileSync } from 'node:child_process';

execFileSync('git', ['rev-parse', '--show-toplevel'], { stdio: 'ignore' });
process.stdout.write('{"contract":"test.v1","status":"ok"}\n');
