import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture } from './land-fixture.mjs';
import { createGitRepositoryConfig } from '../../src/git/index.mjs';

test('RepositoryConfig fills empty hooks, reports missing enforcement and removes only its exact value', () => {
  const f = fixture();
  try {
    const port = createGitRepositoryConfig(f.options, f.loader);
    const ownedPath = path.join(f.repo, '.githooks');
    assert.equal(port.inspectHooks({ ownedPath }).status, 'empty');
    const installed = port.ensureHooks({ ownedPath, operationId: 'hooks' });
    assert.equal(installed.status, 'owned');
    assert.equal(installed.provenance, 'hooks');
    assert.equal(installed.enforcementMissing, true);
    assert.equal(f.git('config', 'core.hooksPath'), ownedPath);
    fs.mkdirSync(ownedPath); fs.writeFileSync(path.join(ownedPath, 'pre-commit'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    assert.equal(port.inspectHooks({ ownedPath }).enforcementMissing, false);
    assert.equal(port.recover({ operationId: 'hooks' }).status, 'owned');
    assert.equal(port.removeOwnedHooksConfig({ ownedPath, operationId: 'remove' }).status, 'empty');
    f.git('config', 'core.hooksPath', '/custom/hooks');
    assert.equal(port.ensureHooks({ ownedPath, operationId: 'custom' }).status, 'skippedExisting');
    assert.equal(port.removeOwnedHooksConfig({ ownedPath, operationId: 'custom-remove' }).status, 'skippedExisting');
    assert.equal(f.git('config', 'core.hooksPath'), '/custom/hooks');
    assert.throws(() => port.ensureHooks({ ownedPath: '.githooks', operationId: 'relative' }), /invalid-hooks-path/);
  } finally { f.close(); }
});
