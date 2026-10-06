// Multi-family executor fixture for Workflow tests.
//
// Panels (members plus a synthesizer) and reviewed units need a distinct provider family per role, so a
// fixture config with one fake executor can only run solo units. This clones the config's
// `test-node` executor into `count` executors, each its own provider family (distinct
// providerModel and model policy), and lets every capability prefer all of them.

export function withProviderFamilies(cfg, count = 4) {
  const base = cfg.runner.executors['test-node'];
  const names = ['test-node'];
  for (let i = 2; i <= count; i += 1) {
    const name = `test-node-${i}`;
    names.push(name);
    cfg.runner.executors[name] = { ...base, providerModel: `node${i}` };
    cfg.runner.modelPolicies[`node${i}`] = { ...(cfg.runner.modelPolicies.node || {}) };
  }
  for (const capability of Object.values(cfg.runner.capabilities || {})) {
    capability.prefer = names.map((executor) => ({ executor }));
  }
  return cfg;
}
