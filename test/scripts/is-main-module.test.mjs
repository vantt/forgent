import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { isMainModule } from '../../scripts/lib/is-main-module.mjs';

test('true when import.meta.url matches the resolved argv[1] file URL', () => {
  const original = process.argv[1];
  try {
    process.argv[1] = '/some/repo/scripts/run-tests.mjs';
    const url = pathToFileURL('/some/repo/scripts/run-tests.mjs').href;
    assert.equal(isMainModule(url), true);
  } finally {
    process.argv[1] = original;
  }
});

test('false when the module was only imported (argv[1] is a different entrypoint)', () => {
  const original = process.argv[1];
  try {
    process.argv[1] = '/some/repo/test/runner.mjs';
    const url = pathToFileURL('/some/repo/scripts/run-tests.mjs').href;
    assert.equal(isMainModule(url), false);
  } finally {
    process.argv[1] = original;
  }
});

test('false when argv[1] is absent (e.g. a REPL or worker context)', () => {
  const original = process.argv[1];
  try {
    delete process.argv[1];
    assert.equal(isMainModule('file:///anything'), false);
  } finally {
    process.argv[1] = original;
  }
});

test('matches even when the resolved path contains a space (the real Linux/macOS bug, not just Windows)', () => {
  const original = process.argv[1];
  try {
    process.argv[1] = '/some/repo with space/scripts/run-tests.mjs';
    const url = pathToFileURL('/some/repo with space/scripts/run-tests.mjs').href;
    assert.equal(isMainModule(url), true);
  } finally {
    process.argv[1] = original;
  }
});

test('a raw, un-normalized template-literal comparison would have failed the space case (regression proof)', () => {
  const argv1 = '/some/repo with space/scripts/run-tests.mjs';
  const importMetaUrl = pathToFileURL(argv1).href;
  const naiveGuard = importMetaUrl === `file://${argv1}`;
  assert.equal(naiveGuard, false, 'the naive guard is expected to mismatch on a space; this pins the bug this fix replaces');
});
