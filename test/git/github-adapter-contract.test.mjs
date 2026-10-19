import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeGitHubPR } from '../../src/runner/github-adapter.mjs';

test('consumer-authorized API merge stays in GitHub; a timed out merge is queried before retry', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'github-contract-'));
  try {
    const log = path.join(root, 'calls');
    const fake = path.join(root, 'gh.cjs');
    fs.writeFileSync(fake, `#!/usr/bin/env node
const fs = require('node:fs');
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2))+'\\n');
if (process.argv[3] === 'merge') { fs.writeFileSync(${JSON.stringify(path.join(root, 'merged'))}, 'yes'); console.error('request timed out'); process.exit(1); }
console.log(JSON.stringify({state:fs.existsSync(${JSON.stringify(path.join(root, 'merged'))})?'MERGED':'OPEN',mergeable:'MERGEABLE',mergeCommit:{oid:'server-merge'}}));
`, { mode: 0o755 });
    // Calling the adapter represents the consumer's already granted approval.
    const uncertain = await mergeGitHubPR(root, 7, { ghCommand: fake });
    assert.equal(uncertain.step, 'merge');
    assert.equal(uncertain.outcome, 'merged');
    const observed = await mergeGitHubPR(root, 7, { ghCommand: fake });
    assert.equal(observed.outcome, 'merged');
    const calls = fs.readFileSync(log,'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(calls.filter(c => c[1] === 'merge').length, 1);
    assert.deepEqual(calls.at(-1).slice(0,2), ['pr','view']);
    assert.equal(fs.existsSync(path.join(root,'.git')), false);
    // Local mutations belong to typed Git ports, never this API adapter.
    const adapter = fs.readFileSync(new URL('../../src/runner/github-adapter.mjs', import.meta.url),'utf8');
    assert.doesNotMatch(adapter, /(['"`])git\1/);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('an unreachable merge with no server confirmation remains outcome-unknown', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'github-unknown-'));
  try {
    const fake = path.join(root, 'gh.cjs');
    const log = path.join(root, 'calls');
    fs.writeFileSync(fake, `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args)+'\\n');
if (args[1] === 'merge') { console.error('request timed out'); process.exit(1); }
console.log(JSON.stringify({state:'OPEN',mergeable:'MERGEABLE',mergeCommit:null}));
`, { mode: 0o755 });
    const result = await mergeGitHubPR(root, 8, { ghCommand: fake });
    assert.equal(result.outcome, 'blocked');
    assert.equal(result.reason, 'outcome-unknown');
    assert.equal(result.observed.state, 'OPEN');
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
    assert.deepEqual(calls.map(c => c[1]), ['view', 'merge', 'view']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
