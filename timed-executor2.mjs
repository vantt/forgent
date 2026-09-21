
  const fs = require('fs');
  const start = Date.now();
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1200);
  const end = Date.now();
  fs.appendFileSync("/home/vantt/projects/forgentX/test_concurrency2.log", JSON.stringify({ start, end, pid: process.pid }) + '\n');
  process.exit(0);
  