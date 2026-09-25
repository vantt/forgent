import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

test('--plan-out writes valid JSON', () => {
  const planOut = path.join(os.tmpdir(), 'test-plan-out.json');
  if (fs.existsSync(planOut)) fs.rmSync(planOut);
  
  execFileSync(process.execPath, ['scripts/test-select.mjs', '--base', 'main', '--plan-out', planOut], { encoding: 'utf8' });
  
  const content = fs.readFileSync(planOut, 'utf8');
  assert.ok(content.endsWith('}\n'), 'must end with newline');
  const parsed = JSON.parse(content);
  assert.ok(parsed.decision);
  assert.ok(parsed.sha);
  assert.ok(parsed.manifestHash);
});
