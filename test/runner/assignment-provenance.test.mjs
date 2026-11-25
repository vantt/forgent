import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { domainHarnessFor, loadHarnessModule } from '../../src/runner/work-dispatch.mjs';

// ─── Domain harness seam (src/runner/work-dispatch.mjs) ─────────────────────

test('domainHarnessFor gives no harness when no domain is resolvable (Work attached but no domain, no domain option)', async () => {
  const work = { id: 'tsk-no-domain', workflowStep: 'planning' };
  assert.equal(await domainHarnessFor(work), undefined);
});

test('domainHarnessFor gives no harness when the Work has no declared stage yet, even with a domain present', async () => {
  assert.equal(await domainHarnessFor({ id: 'tsk-no-stage-yet', domain: 'coding' }), undefined);
});

test('domainHarnessFor gives no harness for a domain name that is not a registered domain', async () => {
  assert.equal(await domainHarnessFor({ id: 'tsk-traversal', workflowStep: 'planning', domain: '../coding' }), undefined);
  assert.equal(await domainHarnessFor({ id: 'tsk-unknown', workflowStep: 'planning', domain: 'no-such-domain' }), undefined);
});

test('domainHarnessFor resolves domain from the domain option when the Work carries no domain field of its own', async () => {
  const harness = await domainHarnessFor(
    { id: 'tsk-options-domain', workflowStep: 'planning', workflow: 'feature' },
    { domain: 'coding' },
  );
  assert.equal(typeof harness, 'function');
});

test('domainHarnessFor returns enricher that enriches contextRefs, constraints, and policy for coding domain', async () => {
  const harness = await domainHarnessFor(
    { id: 'item-harness-wiring', workflowStep: 'planning', domain: 'coding', workflow: 'feature', docsRef: 'docs/history/harness-wiring' },
    { domain: 'coding' },
  );
  assert.equal(typeof harness, 'function');
  const enriched = harness({
    objective: 'probe',
    role: 'reviewer',
    supports: 'validate-plan',
    contextRefs: ['src/foo.mjs'],
    constraints: [],
  });
  assert.deepEqual(enriched.contract.contextRefs, [
    'src/foo.mjs',
    'docs/history/harness-wiring',
    'docs/history/harness-wiring/plan.md',
    'docs/history/harness-wiring/CONTEXT.md',
  ]);
  assert.ok(enriched.contract.constraints.includes('scope: repository (read-only)'));
  assert.deepEqual(enriched.policy, { rigor: 'standard' });
});

test('loadHarnessModule isolates a broken domain harness module: it counts as no harness, it does not throw', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-harness-probe-'));
  try {
    const broken = path.join(dir, 'broken.mjs');
    fs.writeFileSync(broken, "throw new Error('probe: broken harness module');\n");
    assert.equal(await loadHarnessModule(broken), undefined);
    const noExport = path.join(dir, 'no-export.mjs');
    fs.writeFileSync(noExport, 'export const other = 1;\n');
    assert.equal(await loadHarnessModule(noExport), undefined);
    assert.equal(await loadHarnessModule(path.join(dir, 'missing.mjs')), undefined);
    const good = path.join(dir, 'good.mjs');
    fs.writeFileSync(good, 'export function enrichAndValidateContract(contract) { return { contract }; }\n');
    assert.equal(typeof (await loadHarnessModule(good)), 'function');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
