// Preload for a CLI process under test: a detached child cannot be started (as when a sandbox forbids it). Each
// refused spawn appends its arguments as one line to the file named by REFUSED_SPAWN_LOG.
const cp = require('node:child_process');
const fs = require('node:fs');
const spawn = cp.spawn;
cp.spawn = function (command, args, options) {
  if (options && options.detached) {
    fs.appendFileSync(process.env.REFUSED_SPAWN_LOG, `${(args ?? []).join(' ')}\n`);
    throw Object.assign(new Error('spawn refused'), { code: 'EACCES' });
  }
  return spawn.call(this, command, args, options);
};
