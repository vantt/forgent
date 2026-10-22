// The shared golden contract (packages/seat-binding/contracts) as test input:
// each case is the base input with its patch merged in.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const golden = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'packages/seat-binding/contracts/seat-binding.golden.v1.json'), 'utf8'),
);

/** Objects merge by key, null deletes a key, anything else replaces. */
export function mergePatch(base, patch) {
  const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!plain(base) || !plain(patch)) return structuredClone(patch);
  const out = structuredClone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete out[key];
    else if (key in base) out[key] = mergePatch(base[key], value);
    else out[key] = structuredClone(value);
  }
  return out;
}

export const caseInput = (testCase) => mergePatch(golden.base, testCase.patch);
