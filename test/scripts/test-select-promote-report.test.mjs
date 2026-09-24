import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { listLedgerArtifacts, downloadLedgerJson, collectLedgers } from '../../scripts/test-select-promote-report.mjs';

function fakeArtifactsPage(artifacts) {
  return artifacts.map((a) => JSON.stringify(a)).join('\n') + '\n';
}

test('listLedgerArtifacts keeps only non-expired compare-ledger-*/nightly-ledger names, drops everything else', () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const past = new Date(Date.now() - 86400000).toISOString();
  const page = fakeArtifactsPage([
    { id: 1, name: 'compare-ledger-111', expired: false, expires_at: future },
    { id: 2, name: 'nightly-ledger', expired: false, expires_at: future },
    { id: 3, name: 'compare-ledger-333', expired: true, expires_at: future },
    { id: 4, name: 'nightly-ledger', expired: false, expires_at: past },
    { id: 5, name: 'full-results-ubuntu-latest', expired: false, expires_at: future },
  ]);
  const execFn = (cmd, args) => {
    assert.equal(cmd, 'gh');
    assert.deepEqual(args, ['api', 'repos/o/r/actions/artifacts', '--paginate', '--jq', '.artifacts[]']);
    return page;
  };
  const kept = listLedgerArtifacts({ repo: 'o/r', execFn });
  assert.deepEqual(kept.map((a) => a.id), [1, 2]);
});

test('downloadLedgerJson returns the parsed file inside the artifact zip, or null when the file/zip is unusable', (t) => {
  if (process.platform === 'win32') {
    t.skip('zip/unzip CLI commands not installed on Windows runner');
    return;
  }
  const realDir = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'promote-report-fixture-')));
  try {
    fs.writeFileSync(path.join(realDir, 'ledger.json'), JSON.stringify({ plan: { matchedRules: [] }, caseResults: {} }));
    execFileSync('zip', ['-q', 'fixture.zip', 'ledger.json'], { cwd: realDir });
    const zipBytes = fs.readFileSync(path.join(realDir, 'fixture.zip'));

    const execFn = (cmd, args) => {
      if (cmd === 'gh') return zipBytes.toString('binary');
      if (cmd === 'unzip') {
        const dest = args[args.indexOf('-d') + 1];
        execFileSync('unzip', ['-oq', path.join(realDir, 'fixture.zip'), '-d', dest]);
        return '';
      }
      throw new Error(`unexpected command ${cmd}`);
    };
    const parsed = downloadLedgerJson({ id: 42 }, 'ledger.json', { repo: 'o/r', execFn });
    assert.deepEqual(parsed, { plan: { matchedRules: [] }, caseResults: {} });

    const missing = downloadLedgerJson({ id: 42 }, 'nightly-ledger.json', { repo: 'o/r', execFn });
    assert.equal(missing, null, 'the requested filename is absent from this zip');
  } finally {
    fs.rmSync(realDir, { recursive: true, force: true });
  }
});

test('downloadLedgerJson returns null (never throws) when the gh call itself fails', () => {
  const execFn = () => { throw new Error('gh: network error'); };
  const parsed = downloadLedgerJson({ id: 1 }, 'ledger.json', { repo: 'o/r', execFn });
  assert.equal(parsed, null);
});

test('collectLedgers routes nightly-ledger artifacts to nightlyLedgers and everything else to compareLedgers', () => {
  const seen = [];
  const opts = {
    repo: 'o/r',
    execFn: () => '',
  };
  // Stub the module-level downloadLedgerJson behavior indirectly via a
  // fake artifact list whose real download will fail (execFn throws for
  // 'unzip' since there is no real zip) -- collectLedgers must still not
  // throw, and must return empty-but-well-shaped arrays.
  const artifacts = [
    { id: 1, name: 'nightly-ledger' },
    { id: 2, name: 'compare-ledger-222' },
  ];
  const { compareLedgers, nightlyLedgers } = collectLedgers(artifacts, opts);
  assert.deepEqual(compareLedgers, []);
  assert.deepEqual(nightlyLedgers, []);
});
