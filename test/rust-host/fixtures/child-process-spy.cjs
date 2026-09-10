// test/rust-host/fixtures/child-process-spy.cjs
//
// Monkeypatches node:child_process methods to record spawned child processes.
// Appends { cmd, args } JSON lines to the file path in FGOS_HARNESS_SPY_LOG.

const fs = require("node:fs");
const cp = require("node:child_process");

const logPath = process.env.FGOS_HARNESS_SPY_LOG;

if (logPath) {
  let insideSpy = false;

  function recordChild(cmd, args) {
    try {
      const line = JSON.stringify({
        cmd: String(cmd),
        args: Array.isArray(args) ? args.map(String) : [],
      }) + "\n";
      fs.appendFileSync(logPath, line, "utf8");
    } catch (_) {
      // Ignore write errors to avoid impacting child execution
    }
  }

  function wrapCall(cmd, args, fn) {
    if (insideSpy) {
      return fn();
    }
    insideSpy = true;
    try {
      recordChild(cmd, args);
      return fn();
    } finally {
      insideSpy = false;
    }
  }

  const origSpawn = cp.spawn;
  cp.spawn = function(file, args, options) {
    return wrapCall(file, Array.isArray(args) ? args : [], () => origSpawn.apply(this, arguments));
  };

  const origSpawnSync = cp.spawnSync;
  cp.spawnSync = function(file, args, options) {
    return wrapCall(file, Array.isArray(args) ? args : [], () => origSpawnSync.apply(this, arguments));
  };

  const origExecFile = cp.execFile;
  cp.execFile = function(file, args, options, callback) {
    const realArgs = Array.isArray(args) ? args : [];
    return wrapCall(file, realArgs, () => origExecFile.apply(this, arguments));
  };

  const origExecFileSync = cp.execFileSync;
  cp.execFileSync = function(file, args, options) {
    const realArgs = Array.isArray(args) ? args : [];
    return wrapCall(file, realArgs, () => origExecFileSync.apply(this, arguments));
  };

  const origFork = cp.fork;
  cp.fork = function(modulePath, args, options) {
    const realArgs = Array.isArray(args) ? args : [];
    return wrapCall(modulePath, realArgs, () => origFork.apply(this, arguments));
  };

  const origExec = cp.exec;
  cp.exec = function(command, options, callback) {
    return wrapCall(command, [], () => origExec.apply(this, arguments));
  };

  const origExecSync = cp.execSync;
  cp.execSync = function(command, options) {
    return wrapCall(command, [], () => origExecSync.apply(this, arguments));
  };
}
