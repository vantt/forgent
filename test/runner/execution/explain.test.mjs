// fgos dispatch explain on the committed config: it agrees with bind() for every capability. What explain reports
// (the entry that runs, the cell, the walk, the accounts of each pool, a refusal) is owned by the explain vectors of
// packages/execution/contracts/bind.v1.json.

import '../../helpers/process-tmp-root.mjs';
import { seedStubAgentClis } from '../../helpers/agent-clis.mjs';
seedStubAgentClis('claude', 'codex', 'omp', 'pi', 'agy', 'glm', 'disallowed-provider');
import test from 'node:test';
import assert from 'node:assert/strict';
import { explainCapability } from '../../../src/runner/execution/explain.mjs';
import { bind } from '../../../src/runner/execution/bind.mjs';
import { loadRunnerConfigForDir } from '../../../src/runner/dispatch/config.mjs';
import { committedConfigDir } from '../../helpers/committed-config.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const headless = { headless: true, herdrPresent: false };

test('explain on the committed config agrees with bind() for every capability', () => {
  const runnerConfig = loadRunnerConfigForDir(committedConfigDir());
  for (const capability of Object.keys(runnerConfig.capabilities)) {
    for (const session of [headless, { headless: true, herdrPresent: true }]) {
      const explained = explainCapability(runnerConfig, { capability, session });
      const bound = bind({ unit: { id: 'explain', capability, writes: [] }, role: 'producer' }, { runnerConfig, session });
      if (bound.refused) {
        assert.deepEqual(explained.refused, bound.refused, capability);
        continue;
      }
      assert.equal(explained.executor.id, bound.executor, capability);
      assert.equal(explained.invocation, bound.invocation, capability);
      assert.equal(explained.model.value, bound.model, capability);
      assert.equal(explained.tier.value, bound.tier, capability);
      assert.equal(explained.pool, bound.pool, capability);
      if (explained.cell.entries.length > 0) assert.ok(explained.cell.entries.some((e) => e.status === 'used' && e.model === bound.model), `${capability}: the model that runs is marked used`);
    }
  }
});
