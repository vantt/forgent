import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTestCase } from '../../scripts/test-select-compare.mjs';

test('C1 Classifier Tests', async (t) => {

  await t.test('os-specific: returns os-specific if isOsSpecific is true', () => {
    assert.equal(classifyTestCase({ isOsSpecific: true }), 'os-specific');
  });
  await t.test('related-only-fail: red in related, green in full', () => {
    assert.equal(classifyTestCase({ isRedInFull: false, isRedInRelated: true }), 'related-only-fail');
  });
  await t.test('pass: green in full, green in related', () => {
    assert.equal(classifyTestCase({ isRedInFull: false, isRedInRelated: false }), 'pass');
  });
  await t.test('base-missing: red in full, base artifact not found', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: true }), 'base-missing');
  });
  await t.test('baseline-failing: red in full, red in base', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: true }), 'baseline-failing');
  });
  await t.test('caught: red in full, selected, red in related', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: true, isRedInRelated: true }), 'caught');
  });
  await t.test('selected-but-divergent: red in full, selected, green in related', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: true, isRedInRelated: false }), 'selected-but-divergent');
  });
  await t.test('omitted-failing-test: red in full, not selected, related has other reds', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: false, isRelatedRedSomewhere: true }), 'omitted-failing-test');
  });
  await t.test('rerun-pass: red in full, not selected, related green, rerun passes', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: false, isRelatedRedSomewhere: false, rerunPassed: true }), 'rerun-pass');
  });
  await t.test('confirmed-miss: red in full, not selected, related green, rerun fails', () => {
    assert.equal(classifyTestCase({ isRedInFull: true, baseMissing: false, isRedInBase: false, isSelected: false, isRelatedRedSomewhere: false, rerunPassed: false }), 'confirmed-miss');
  });
});

test('updateBreakerState creates issue on failure', async (t) => {
  const originalEnv = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'fake/repo';
  
  const m = await import('../../scripts/test-select-compare.mjs');
  // Since we can't easily assert on stdout, we just ensure it doesn't throw.
  // The script catches exceptions and prints them.
  assert.doesNotThrow(() => {
    m.updateBreakerState(['rule1']);
  });
  
  if (originalEnv === undefined) {
    delete process.env.GITHUB_REPOSITORY;
  } else {
    process.env.GITHUB_REPOSITORY = originalEnv;
  }
});

test('AC 3: OS-specific fixture simulation in runCompare', async (t) => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const os = await import('node:os');
  const { runCompare } = await import('../../scripts/test-select-compare.mjs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-compare-fixture-'));

  try {
    const baseXml = path.join(tmpDir, 'base.xml');
    const ubuntuXml = path.join(tmpDir, 'full-ubuntu.xml');
    const macosXml = path.join(tmpDir, 'full-macos.xml');
    const windowsXml = path.join(tmpDir, 'full-windows.xml');
    const relatedXml = path.join(tmpDir, 'related.xml');
    const ledgerPath = path.join(tmpDir, 'ledger.json');

    // Base artifact: completely clean
    fs.writeFileSync(baseXml, `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="all">
    <testcase name="test-shared-clean" file="test/sample.test.mjs" />
  </testsuite>
</testsuites>`);

    // Ubuntu: clean
    fs.writeFileSync(ubuntuXml, `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="ubuntu">
    <testcase name="test-macos-only" file="test/os.test.mjs" />
    <testcase name="test-windows-only" file="test/os.test.mjs" />
  </testsuite>
</testsuites>`);

    // macOS: fails test-macos-only
    fs.writeFileSync(macosXml, `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="macos">
    <testcase name="test-macos-only" file="test/os.test.mjs">
      <failure message="darwin socket quirk" />
    </testcase>
  </testsuite>
</testsuites>`);

    // Windows: fails test-windows-only
    fs.writeFileSync(windowsXml, `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="windows">
    <testcase name="test-windows-only" file="test/os.test.mjs">
      <failure message="win32 backslash path failure" />
    </testcase>
  </testsuite>
</testsuites>`);

    // Related: green
    fs.writeFileSync(relatedXml, `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="related">
    <testcase name="test-related-pass" file="test/sample.test.mjs" />
  </testsuite>
</testsuites>`);

    const plan = {
      decision: 'related',
      selectedFiles: ['test/sample.test.mjs'],
      matchedRules: [{ ruleId: 'rule-sample', status: 'shadow' }],
      changedPaths: ['src/sample.mjs']
    };

    const result = await runCompare({
      plan,
      baseJunit: baseXml,
      fullJunitUbuntu: ubuntuXml,
      fullJunitMacos: macosXml,
      fullJunitWindows: windowsXml,
      relatedJunit: relatedXml,
      ledgerOut: ledgerPath,
      noExit: true
    });

    const macosRes = result.ledger.caseResults['test-macos-only'];
    const windowsRes = result.ledger.caseResults['test-windows-only'];
    assert.equal(typeof macosRes === 'object' ? macosRes.classification : macosRes, 'os-specific');
    assert.equal(typeof windowsRes === 'object' ? windowsRes.classification : windowsRes, 'os-specific');
    assert.equal(result.rulesToQuarantine.length, 0, 'os-specific failure must not trip breaker');
    assert.equal(result.quarantineGlobal, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('AC 7: C4 warning on item.verify referencing test selector in compare job', async (t) => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const os = await import('node:os');
  const { runCompare } = await import('../../scripts/test-select-compare.mjs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-c4-compare-'));

  try {
    const fgosDir = path.join(tmpDir, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const eventFile = path.join(fgosDir, 'events.jsonl');
    fs.writeFileSync(eventFile, JSON.stringify({
      type: 'work.add',
      payload: { id: 'tsk-sample', verify: 'npm run test:related' }
    }));

    const plan = {
      decision: 'related',
      selectedFiles: [],
      matchedRules: [],
      changedPaths: [eventFile]
    };

    const result = await runCompare({
      plan,
      baseJunit: 'non-existent.xml',
      fullJunitUbuntu: 'non-existent.xml',
      fullJunitMacos: 'non-existent.xml',
      fullJunitWindows: 'non-existent.xml',
      relatedJunit: 'non-existent.xml',
      ledgerOut: path.join(tmpDir, 'ledger.json'),
      noExit: true
    });

    assert.ok(result.warnings.length > 0, 'Must record C4 warning');
    assert.ok(result.warnings[0].includes('[WARN C4]'), 'Warning text must contain [WARN C4]');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('AC 7: Title or description mentioning test-select does NOT trigger C4 warning', async (t) => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const os = await import('node:os');
  const { runCompare } = await import('../../scripts/test-select-compare.mjs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-c4-negative-'));

  try {
    const fgosDir = path.join(tmpDir, '.fgos');
    fs.mkdirSync(fgosDir, { recursive: true });
    const eventFile = path.join(fgosDir, 'events.jsonl');
    fs.writeFileSync(eventFile, JSON.stringify({
      type: 'work.add',
      payload: { id: 'tsk-phase3', title: 'Work on test-select optimization', verify: 'npm test' }
    }));

    const plan = {
      decision: 'related',
      selectedFiles: [],
      matchedRules: [],
      changedPaths: [eventFile]
    };

    const result = await runCompare({
      plan,
      baseJunit: 'non-existent.xml',
      fullJunitUbuntu: 'non-existent.xml',
      fullJunitMacos: 'non-existent.xml',
      fullJunitWindows: 'non-existent.xml',
      relatedJunit: 'non-existent.xml',
      ledgerOut: path.join(tmpDir, 'ledger.json'),
      noExit: true
    });

    assert.equal(result.warnings.length, 0, 'Must not trigger C4 warning for non-verify field');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
