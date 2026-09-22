import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('test-ownership-lint', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lint-'));
  
  await t.test('blocks when manifest missing', () => {
    try {
      execSync(`node scripts/test-ownership-lint.mjs ${path.join(tmpDir, 'missing.json')}`, { stdio: 'pipe' });
      assert.fail('Should fail');
    } catch (err) {
      assert.match(err.stderr.toString(), /Block: Manifest missing/);
    }
  });

  await t.test('blocks when rule points to non-existent test', () => {
    const m = path.join(tmpDir, 'm1.json');
    fs.writeFileSync(m, JSON.stringify({
      rules: [{ pathPrefix: 'src/', directTests: ['test/direct/non-existent.test.mjs'] }]
    }));
    try {
      execSync(`node scripts/test-ownership-lint.mjs ${m}`, { stdio: 'pipe' });
      assert.fail('Should fail');
    } catch (err) {
      assert.match(err.stderr.toString(), /references non-existent test file/);
    }
  });

  await t.test('warns when direct test is orphaned', () => {
    const m = path.join(tmpDir, 'm2.json');
    fs.writeFileSync(m, JSON.stringify({
      rules: [{ pathPrefix: 'src/', directTests: [] }]
    }));
    // We need to create a fake test/direct directory
    const directDir = path.join(tmpDir, 'test', 'direct');
    fs.mkdirSync(directDir, { recursive: true });
    fs.writeFileSync(path.join(directDir, 'orphan.test.mjs'), 'test');
    
    // We have to cd into tmpDir so that path.resolve('test/direct') resolves to it
    try {
      const output = execSync(`node ${path.resolve('scripts/test-ownership-lint.mjs')} ${m}`, { cwd: tmpDir, stdio: 'pipe' });
      assert.match(output.toString(), /Lint passed with warnings/);
    } catch (err) {
      console.error(err.stderr ? err.stderr.toString() : err.message);
      assert.fail('Should not block');
    }
  });
});
