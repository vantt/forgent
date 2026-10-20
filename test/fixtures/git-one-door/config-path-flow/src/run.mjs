import { spawnSync } from 'node:child_process';
import { loadConfig } from './config.mjs';

function launch(invocation) {
  return spawnSync(invocation.command, invocation.args);
}
export function runExecutor(text, id) {
  const cfg = loadConfig(text);
  const executor = cfg && cfg.executors[id];
  return launch({ command: executor.command, args: [...executor.args] });
}
