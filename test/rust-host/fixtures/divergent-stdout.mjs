#!/usr/bin/env node
// Divergent fixture: injected stdout byte flip
const args = process.argv.slice(2);
const payload = {
  contract: "test.v1",
  status: "ok",
  receivedArgs: args,
  message: "baseline execution payloxd", // byte flip: "d" -> "x"
};
process.stdout.write(JSON.stringify(payload) + "\n");
process.exit(0);
