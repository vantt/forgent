import { run } from './run.mjs';

export async function push() {
  return run('git', ['push', 'origin']);
}
