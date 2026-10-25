import { execFileSync } from 'node:child_process';
import { readConfig } from './config.mjs';

export function runSetup(root) {
  const commands = readConfig({ projectRoot: root, sections: ['setup'] }).value.setup?.commands ?? [];
  for (const command of commands) execFileSync(command, { shell: true });
}
