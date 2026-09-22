import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

test('test-ownership-lint', async (t) => {
  await t.test('lints the real repo manifest successfully', () => {
    try {
      execSync(`node scripts/test-ownership-lint.mjs`, { stdio: 'pipe' });
      assert.ok(true);
    } catch (err) {
      console.error(err.stderr ? err.stderr.toString() : err.message);
      assert.fail('Lint script failed on the real manifest');
    }
  });
});
