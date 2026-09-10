// test/rust-host/fixtures/child-process-spy.cjs
//
// Monkeypatches node:child_process methods to record spawned child processes.
// Appends { cmd, args } JSON lines to the file path in FGOS_HARNESS_SPY_LOG.
//
// Commands named in FGOS_HARNESS_SHIMMED_COMMANDS (comma-separated basenames)
// are deliberately NOT recorded here -- the harness's PATH shim
// (harness.mjs's buildPathShim) already intercepts those at the real OS-exec
// boundary, which is the only mechanism a bin: (compiled) entry can ever get.
// Recording the same real invocation from both this in-process monkeypatch
// AND the PATH shim would double-count it for node: entries while a bin:
// entry only ever gets the single PATH-shim count, producing a spurious
// mismatch in exactly the node-vs-bin comparison this harness exists for.

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const logPath = process.env.FGOS_HARNESS_SPY_LOG;
const shimmedCommands = new Set(
  (process.env.FGOS_HARNESS_SHIMMED_COMMANDS || "").split(",").filter(Boolean)
);

if (logPath) {
  let insideSpy = false;

  function recordChild(cmd, args) {
    try {
      if (shimmedCommands.has(path.basename(String(cmd)))) return;
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
