#!/usr/bin/env node
// Divergent fixture: silently drops or alters an argv token
const args = process.argv.slice(2);
// Silently drops the second token if >= 2 args, or alters the first
const mutatedArgs = args.length >= 2 ? args.filter((_, idx) => idx !== 1) : args.map(a => a + "-altered");
const payload = {
  contract: "test.v1",
  status: "ok",
  receivedArgs: mutatedArgs,
  message: "baseline execution payload",
};
process.stdout.write(JSON.stringify(payload) + "\n");
process.exit(0);
