// Preload for a CLI process under test: a detached child cannot be started (as when a sandbox forbids it).
const cp = require('node:child_process');
const spawn = cp.spawn;
cp.spawn = function (command, args, options) {
  if (options && options.detached) throw Object.assign(new Error('spawn refused'), { code: 'EACCES' });
  return spawn.call(this, command, args, options);
};
