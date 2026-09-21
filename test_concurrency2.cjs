const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'test_concurrency2.log');
fs.writeFileSync(logFile, '');

const scriptPath = path.join(__dirname, 'timed-executor2.mjs');
fs.writeFileSync(
  scriptPath,
  `
  const fs = require('fs');
  const start = Date.now();
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1200);
  const end = Date.now();
  fs.appendFileSync(${JSON.stringify(logFile)}, JSON.stringify({ start, end, pid: process.pid }) + '\\n');
  process.exit(0);
  `
);

async function runOne(id) {
  // Simulate execFgos('pick')
  execFileSync('node', ['-e', '']); // 50ms overhead

  // Simulate executeExecutorCli -> cliSpawnAdapter
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath]);
    child.on('close', resolve);
  });
}

async function runAll() {
  await Promise.allSettled([runOne('cand1'), runOne('cand2')]);
  console.log(fs.readFileSync(logFile, 'utf8'));
}
runAll();
