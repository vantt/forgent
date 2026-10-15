import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('runner liveness retains current decision assertions with complete-record consumer evidence', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const reportDir = 'plans/260925-documentation-authority-unification/reports/phase-06/';
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-liveness-'));
  try {
    const original = fs.readFileSync(path.join(root, reportDir, 'step9-liveness-scan.mjs'), 'utf8');
    // Redirect only report output; all source and consumer evidence stays real.
    const source = original.replace('fs.writeFileSync(R+f,', `fs.writeFileSync(${JSON.stringify(scratch + '/') }+f,`)
      .replace("assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'plan/260925-documentation-authority-unification');", '');
    assert.notEqual(source, original);
    const env = { ...process.env }; delete env.CLAUDE_CODE_SESSION_ID;
    execFileSync(process.execPath, ['--input-type=module'], { cwd: root, input: source, env, maxBuffer: 2e6 });
    const scan = JSON.parse(fs.readFileSync(path.join(scratch, 'step9-liveness.json'), 'utf8'));
    const required = [54, 56, 61, 63, 90, 125, 126, 129, 139, 140, 141, 142, 145, 146, ...Array.from({ length: 17 }, (_, i) => 151 + i)];
    assert.deepEqual(required.filter(i => scan.sections[i - 1].classification !== 'current-decision'), []);
    const newlyProtected = [54, 56, 61, 90, 125, 126, 139, 141, 146, 151, 154, 156, 158];
    for (const i of newlyProtected) {
      const section = scan.sections[i - 1];
      const evidence = section.recordEvidence;
      assert(evidence.consumers.length || evidence.extantPaths.length, section.anchor);
      assert(evidence.startLine <= section.startLine && evidence.endLine >= section.endLine);
      for (const consumer of evidence.consumers) {
        const line = fs.readFileSync(path.join(root, consumer.path), 'utf8').split('\n')[consumer.line - 1];
        assert.equal(line, consumer.text);
        assert(line.includes(consumer.symbol));
      }
      for (const cited of evidence.extantPaths) assert(fs.existsSync(path.join(root, cited)));
      assert.equal(section.retired, false);
      assert.equal(section.retirementEligible, false);
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
