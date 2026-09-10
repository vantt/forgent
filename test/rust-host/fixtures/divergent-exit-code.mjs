#!/usr/bin/env node
// Divergent fixture: injected exit-code change (1 instead of 0)
const args = process.argv.slice(2);
const payload = {
  contract: "test.v1",
  status: "ok",
  receivedArgs: args,
  message: "baseline execution payload",
};
process.stdout.write(JSON.stringify(payload) + "\n");
process.exit(1);
