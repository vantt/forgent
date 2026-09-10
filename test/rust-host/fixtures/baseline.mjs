#!/usr/bin/env node
// Baseline fixture for parity harness self-tests
const args = process.argv.slice(2);
const payload = {
  contract: "test.v1",
  status: "ok",
  receivedArgs: args,
  message: "baseline execution payload",
};
process.stdout.write(JSON.stringify(payload) + "\n");
process.exit(0);
