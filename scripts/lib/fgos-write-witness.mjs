// fgos-write-witness.mjs -- preloaded (`node --test --import`) into every test file's process by
// scripts/run-tests.mjs, and spread to child Node processes through NODE_OPTIONS like the git spawn spy.
//
// It records which paths inside the checkout's `.fgos` directory a process of the test run is about
// to create, change or remove through Node's `fs`, and the state each path was in just before the
// process first touched it. The run-tests door reads the record after the run and fails the suite on
// a path that differs from that recorded state; a write by any other session (a live head, the
// watcher, the land that runs the gate) is never recorded, so it can never fail a run.
//
// The runner hands it two env values: the log file (FGOS_TEST_FGOS_WRITE_WITNESS_LOG) and the `.fgos`
// directory (FGOS_TEST_FGOS_WRITE_WITNESS_DIR). Without them it patches nothing and logs nothing.
// It sees Node `fs` calls only: not the Rust host binary, a shell, or a child started without
// NODE_OPTIONS.

import fs from 'node:fs';
import module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WITNESS_LOG_ENV = 'FGOS_TEST_FGOS_WRITE_WITNESS_LOG';
export const WITNESS_DIR_ENV = 'FGOS_TEST_FGOS_WRITE_WITNESS_DIR';

const SELF_IMPORT = `--import=${new URL(import.meta.url).href}`;
const WRITE_FLAGS = fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_TRUNC;

// Which argument positions are the paths a call writes; a number is the position of an `fs.open` flags.
const ALWAYS = (...positions) => () => positions;
const SPECS = {
  writeFile: ALWAYS(0), appendFile: ALWAYS(0), truncate: ALWAYS(0), mkdir: ALWAYS(0), rm: ALWAYS(0), rmdir: ALWAYS(0),
  unlink: ALWAYS(0), utimes: ALWAYS(0), lutimes: ALWAYS(0), rename: ALWAYS(0, 1), copyFile: ALWAYS(1), cp: ALWAYS(1),
  symlink: ALWAYS(1), link: ALWAYS(1),
  open: (args) => (opensForWrite(args[1]) ? [0] : []),
};

function opensForWrite(flags) {
  if (typeof flags === 'string') return /[wa+]/.test(flags);
  if (typeof flags === 'number') return (flags & WRITE_FLAGS) !== 0;
  return false;
}

function install(logFile, fgosDir) {
  const { appendFileSync, lstatSync } = fs;
  const touched = new Set();
  let logFailed = false;
  const append = (entry) => {
    try {
      appendFileSync(logFile, `${JSON.stringify({ pid: process.pid, ...entry })}\n`);
    } catch (error) {
      if (logFailed) return;
      logFailed = true;
      try { process.stderr.write(`fgos-write-witness: cannot append to ${logFile}: ${error?.message}\n`); } catch { /* nothing to report to */ }
    }
  };

  const toPath = (value) => {
    if (typeof value === 'string') return value;
    if (value instanceof URL) return value.protocol === 'file:' ? fileURLToPath(value) : null;
    if (Buffer.isBuffer(value)) return value.toString();
    return null;
  };

  // Records one absolute path inside `.fgos` (the directory itself under '.') with the state it is in now.
  const noteAbs = (abs) => {
    const rel = path.relative(fgosDir, abs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return;
    const key = rel || '.';
    if (touched.has(key)) return;
    touched.add(key);
    let before = { exists: false };
    try {
      const stat = lstatSync(abs);
      before = { exists: true, isDir: stat.isDirectory(), size: stat.size, mtimeMs: stat.mtimeMs };
    } catch { /* absent now */ }
    append({ kind: 'write', path: key, before });
  };

  const note = (value) => {
    try {
      const raw = toPath(value);
      if (raw !== null) noteAbs(path.resolve(raw));
    } catch { /* the witness never throws into the caller */ }
  };

  // A recursive mkdir also creates every absent ancestor: record the topmost one inside `.fgos`, so
  // removing that ancestor later is seen as undoing this process's own directory.
  const noteCreatedAncestor = (value, options) => {
    try {
      if (!options || typeof options !== 'object' || !options.recursive) return;
      const raw = toPath(value);
      if (raw === null) return;
      let top = null;
      for (let dir = path.resolve(raw); ; dir = path.dirname(dir)) {
        const rel = path.relative(fgosDir, dir);
        if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) break;
        try { lstatSync(dir); break; } catch { top = dir; }
      }
      if (top !== null) noteAbs(top);
    } catch { /* never throws */ }
  };

  const wrap = (target, name, positionsOf) => {
    const original = target[name];
    if (typeof original !== 'function') return;
    target[name] = function witnessed(...args) {
      try { for (const position of positionsOf(args)) note(args[position]); } catch { /* never throws */ }
      if (name === 'mkdir' || name === 'mkdirSync') noteCreatedAncestor(args[0], args[1]);
      return original.apply(this, args);
    };
    // Keep what callers read off the function (promisify.custom and the like).
    for (const key of Reflect.ownKeys(original)) {
      if (key === 'length' || key === 'name' || key === 'prototype') continue;
      try { Object.defineProperty(target[name], key, Object.getOwnPropertyDescriptor(original, key)); } catch { /* not copyable */ }
    }
  };

  for (const [name, positionsOf] of Object.entries(SPECS)) {
    wrap(fs, name, positionsOf);
    wrap(fs, `${name}Sync`, positionsOf);
    wrap(fs.promises, name, positionsOf);
  }
  wrap(fs, 'createWriteStream', ALWAYS(0));
  append({ kind: 'load' });
}

// For tests that drive a runner with a fake `spawn`: wraps it so the child it stands for leaves the
// load record the real preload writes. Without the witness env value in the child's env it is a no-op.
export function asWitnessedSpawn(spawnFn) {
  if (typeof spawnFn !== 'function') return spawnFn;
  return function witnessedSpawn(execPath, argv, opts) {
    const log = opts?.env?.[WITNESS_LOG_ENV];
    if (log) fs.appendFileSync(log, `${JSON.stringify({ kind: 'load', pid: process.pid })}\n`);
    return spawnFn.call(this, execPath, argv, opts);
  };
}

const logFile = process.env[WITNESS_LOG_ENV];
const dirValue = process.env[WITNESS_DIR_ENV];
if (logFile && dirValue) {
  install(logFile, path.resolve(dirValue));
  module.syncBuiltinESMExports();
}
// Children started with the inherited env carry the witness too.
if (!String(process.env.NODE_OPTIONS ?? '').includes(SELF_IMPORT)) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ''}${SELF_IMPORT}`;
}
