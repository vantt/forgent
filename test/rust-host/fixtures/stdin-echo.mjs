#!/usr/bin/env node
// Fixture that consumes and echoes stdin
let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => {
  buffer += chunk;
});
process.stdin.on("end", () => {
  process.stdout.write("stdin:" + buffer);
  process.exit(0);
});
