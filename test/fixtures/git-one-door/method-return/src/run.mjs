import { execFileSync } from 'node:child_process';
import { createRegistry } from './registry.mjs';

export function runTool(id) {
  const tool = createRegistry().resolve(id);
  return execFileSync(tool.bin, ['commit', '-m', 'x']);
}
