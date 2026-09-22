import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lintManifest } from '../../scripts/test-ownership-lint.mjs';

test('test-ownership-lint', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lint-'));
  fs.mkdirSync(path.join(tmpDir, 'src'));
  fs.writeFileSync(path.join(tmpDir, 'src/file.mjs'), 'test');
  
  const oldConsoleError = console.error;
  const oldConsoleLog = console.log;
  let errorOutput = '';
  
  function captureConsole() {
    errorOutput = '';
    console.error = (msg) => { errorOutput += msg + '\n'; };
    console.log = () => {};
  }
  
  function restoreConsole() {
    console.error = oldConsoleError;
    console.log = oldConsoleLog;
  }

  t.afterEach(restoreConsole);

  await t.test('blocks when rule points to non-existent field', () => {
    captureConsole();
    const m = [{ id: 'fake', pattern: 'src/file.mjs', unknownField: true, status: 'live' }];
    try {
      lintManifest(m, tmpDir);
      assert.fail('Should fail');
    } catch (err) {
      assert.match(errorOutput, /unsupported field/);
    }
  });

  await t.test('blocks when direct test is orphaned', () => {
    try { fs.rmSync(path.join(tmpDir, 'test/direct/valid.test.mjs'), {force:true}); } catch(e){}
    captureConsole();
    const m = [{ id: 'r1', pattern: 'src/file.mjs', directTests: [], status: 'live' }];
    const directDir = path.join(tmpDir, 'test', 'direct');
    fs.mkdirSync(directDir, { recursive: true });
    fs.writeFileSync(path.join(directDir, 'orphan.test.mjs'), 'test');
    
    
    try {
      lintManifest(m, tmpDir);
      assert.fail('Should fail');
    } catch (err) {
      assert.match(errorOutput, /Orphaned test file not referenced in manifest/);
    }
  });
  
  await t.test('passes when no orphans and no bad fields', () => {
    try { fs.rmSync(path.join(tmpDir, 'test/direct/orphan.test.mjs'), {force:true}); } catch(e){}
    captureConsole();
    const directDir = path.join(tmpDir, 'test', 'direct');
    fs.mkdirSync(directDir, { recursive: true });
    fs.writeFileSync(path.join(directDir, 'valid.test.mjs'), 'test');
    // also need to write the test file in the tmpdir so it exists
    fs.writeFileSync(path.join(tmpDir, 'test/direct/valid.test.mjs'), 'test');
    const m = [{ id: 'r1', pattern: 'src/file.mjs', directTests: ['test/direct/valid.test.mjs'], status: 'live' }];
    
    try {
      lintManifest(m, tmpDir);
      assert.ok(true);
    } catch (err) {
      assert.fail('Should pass cleanly');
    }
  });
});
