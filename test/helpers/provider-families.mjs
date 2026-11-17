// Multi-family executor fixture for Workflow tests.
//
// Panels (members plus a synthesizer) and reviewed units need a distinct provider family per role, so a
// fixture config with one fake executor can only run solo units. This clones the config's
// `test-node` executor into `count` executors, each its own provider family (distinct
// providerModel and model policy), and lets every capability, role and persona prefer all of them.

import { tasteServedBy } from './config-fixture.mjs';

export function withProviderFamilies(cfg, count = 4) {
  const base = cfg.runner.executors['test-node'];
  const names = ['test-node'];
  for (let i = 2; i <= count; i += 1) {
    const name = `test-node-${i}`;
    names.push(name);
    cfg.runner.executors[name] = { ...base, providerModel: `node${i}` };
    cfg.runner.modelPolicies[`node${i}`] = { ...(cfg.runner.modelPolicies.node || {}) };
  }
  for (const capability of Object.values(cfg.runner.capabilities || {})) capability.prefer = names.map((executor) => ({ executor }));
  // Role and persona taste (the standard's, and the config's own) has a pool of its own, which wins over the capability's.
  const taste = tasteServedBy(names);
  for (const group of ['roles', 'personas']) {
    cfg.runner[group] = { ...taste[group], ...cfg.runner[group] };
    for (const scope of Object.values(cfg.runner[group])) scope.prefer = names.map((executor) => ({ executor }));
  }
  return cfg;
}
