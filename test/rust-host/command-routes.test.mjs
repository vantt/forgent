import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import {
  DEFAULT_ANNOTATIONS_PATH,
  DEFAULT_ROUTES_PATH,
  generateCommandRoutes,
  checkCommandRoutes,
  loadAnnotations,
  assertAllSelectorsListed,
} from '../../scripts/export-command-selectors.mjs';
import { explainCommandRoute } from '../../scripts/explain-command-route.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const EXPORT_SCRIPT = path.join(REPO_ROOT, 'scripts/export-command-selectors.mjs');
const EXPLAIN_SCRIPT = path.join(REPO_ROOT, 'scripts/explain-command-route.mjs');

test('all 73 COMMAND_REGISTRY selectors appear exactly once in generated output', () => {
  assert.equal(COMMAND_REGISTRY.length, 73, 'COMMAND_REGISTRY must contain exactly 73 selectors');

  const content = fs.readFileSync(DEFAULT_ROUTES_PATH, 'utf8');
  const routes = JSON.parse(content);
  const routeKeys = Object.keys(routes);

  assert.equal(routeKeys.length, 73, 'command-routes.json must contain exactly 73 selectors');

  // Lexicographical sort check
  const sortedKeys = [...routeKeys].sort();
  assert.deepEqual(routeKeys, sortedKeys, 'Keys must be sorted lexicographically');

  // Verify sub-positional selectors stay one entry
  const subPositional = ['coordination', 'dispatch', 'session', 'tool', 'doc', 'workflow'];
  for (const sub of subPositional) {
    assert.ok(routes[sub], `Sub-positional selector "${sub}" must exist as exactly one entry`);
    assert.equal(routes[sub].selector, sub);
  }

  // Verify every registry selector exists and is valid
  for (const cmd of COMMAND_REGISTRY) {
    const entry = routes[cmd.name];
    assert.ok(entry, `Selector "${cmd.name}" missing from command-routes.json`);
    assert.equal(entry.selector, cmd.name);
    assert.ok(entry.route_kind === 'native' || entry.route_kind === 'legacy-cli');
    assert.ok(typeof entry.owner_path === 'string' && entry.owner_path.length > 0);
    assert.ok(Array.isArray(entry.compatibility_tests) && entry.compatibility_tests.length > 0);

    if (entry.route_kind === 'native') {
      assert.ok(typeof entry.operation_id === 'string' && entry.operation_id.length > 0);
      assert.equal(entry.legacy_payload, undefined);
    } else {
      assert.equal(entry.legacy_payload, 'legacy-node');
      assert.equal(entry.operation_id, undefined);
      assert.equal(entry.owner_path, 'src/cli/command-registry.mjs');
    }
  }

  // Specific check for native version
  assert.equal(routes.version.route_kind, 'native');
  assert.equal(routes.version.operation_id, 'distribution.build.show');
  assert.equal(routes.version.owner_path, 'packages/distribution/rust');
  assert.equal(routes.version.legacy_payload, undefined);
  assert.deepEqual(routes.version.compatibility_tests, ['test/rust-host/command-routes.test.mjs']);
});

test('drift detection: clean committed file passes --check silently', () => {
  const check = checkCommandRoutes({
    routesPath: DEFAULT_ROUTES_PATH,
    annotationsPath: DEFAULT_ANNOTATIONS_PATH,
  });
  assert.equal(check.clean, true);
  assert.equal(check.summary, '');

  const stdout = execFileSync('node', [EXPORT_SCRIPT, '--check'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  assert.equal(stdout, '');
});

test('drift detection: mutated copy of committed file fails --check', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-drift-test-'));
  const tmpRoutes = path.join(tmpDir, 'command-routes.json');

  try {
    const routes = JSON.parse(fs.readFileSync(DEFAULT_ROUTES_PATH, 'utf8'));
    // Mutate one entry
    routes.version.route_kind = 'legacy-cli';
    delete routes.version.operation_id;
    routes.version.legacy_payload = 'legacy-node';
    fs.writeFileSync(tmpRoutes, JSON.stringify(routes, null, 2) + '\n', 'utf8');

    const result = checkCommandRoutes({
      routesPath: tmpRoutes,
      annotationsPath: DEFAULT_ANNOTATIONS_PATH,
    });
    assert.equal(result.clean, false);
    assert.match(result.summary, /Modified selectors: version/);

    assert.throws(
      () => {
        execFileSync('node', [EXPORT_SCRIPT, '--check', '--routes', tmpRoutes], {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      },
      (err) => {
        assert.notEqual(err.status, 0);
        assert.match(err.stderr, /Command routes drift detected/);
        assert.match(err.stderr, /Modified selectors: version/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('unlisted selector fails the build', () => {
  const routes = generateCommandRoutes({ registry: COMMAND_REGISTRY });
  delete routes['add'];

  assert.throws(
    () => {
      assertAllSelectorsListed(routes, COMMAND_REGISTRY);
    },
    /Unlisted selector: selector "add" has no route in generated output/
  );
});

test('unlisted selector fails the build through generateCommandRoutes itself (not just the standalone guard)', () => {
  // The above test proves assertAllSelectorsListed itself rejects a gap; this
  // test proves generateCommandRoutes actually WIRES that guard in on every
  // call, so a regression that silently drops the guard call from
  // generateCommandRoutes (a real edit generateCommandRoutes could survive
  // without failing this file at all otherwise) is caught. A registry with a
  // duplicate `name` entry makes the routes map collapse to fewer keys than
  // registry.length purely as a side effect of generateCommandRoutes's own
  // loop (`routes[selector] = descriptor` overwrites on the duplicate) --
  // this drives the real gap into the real function, never a hand-edited map.
  const registryWithDuplicateName = [
    ...COMMAND_REGISTRY,
    { ...COMMAND_REGISTRY.find((c) => c.name === 'version') },
  ];

  assert.throws(
    () => {
      generateCommandRoutes({ registry: registryWithDuplicateName });
    },
    /Route count mismatch/
  );
});

test('double-annotated selector fails the build (array duplicate entries)', () => {
  const badAnnotations = [
    { selector: 'version', route_kind: 'native', operation_id: 'distribution.build.show' },
    { selector: 'version', route_kind: 'legacy-cli' },
  ];

  assert.throws(
    () => {
      loadAnnotations(badAnnotations);
    },
    /Double-bound selector.*declared more than once/
  );
});

test('a second annotated selector does not false-fail the duplicate-top-level-key scan', () => {
  // Regression for the HIGH finding: the old regex-on-flat-text scan mistook
  // a nested field name shared by two DIFFERENT selectors (operation_id) for
  // a duplicate top-level key and threw on this exact shape.
  const twoSelectors = JSON.stringify({
    version: { route_kind: 'native', operation_id: 'distribution.build.show', owner_path: 'packages/distribution/rust' },
    init: { route_kind: 'native', operation_id: 'some.other.op', owner_path: 'packages/distribution/rust' },
  });

  const map = loadAnnotations(twoSelectors);
  assert.equal(map.size, 2);
});

test('a genuine top-level duplicate selector key is still caught as raw text', () => {
  const dup = '{ "version": {"route_kind":"native","operation_id":"a"}, "version": {"route_kind":"legacy-cli"} }';

  assert.throws(
    () => {
      loadAnnotations(dup);
    },
    /Double-bound selector: selector "version" declared more than once in annotations/
  );
});

test('unicode-escaped duplicate selector key is caught (decode, not skip, \\uXXXX)', () => {
  // Regression for red-team's HIGH finding: JSON.parse collapses
  // "version" and "version" to the identical key "version" (last one
  // wins, silently); the raw-text scan must decode the escape to see the
  // same collision, not just skip past it.
  const dup = '{ "version": {"route_kind":"native","operation_id":"a"}, "\\u0076ersion": {"route_kind":"legacy-cli"} }';

  assert.throws(
    () => {
      loadAnnotations(dup);
    },
    /Double-bound selector: selector "version" declared more than once in annotations/
  );
});

test('an escaped quote inside one key is not confused with a different key', () => {
  // Regression for red-team's MEDIUM finding: two distinct keys `ab` and
  // `a\"b` must decode to two DIFFERENT strings, not both collapse to "ab".
  const distinctKeys = '{ "ab": {"route_kind":"legacy-cli"}, "a\\"b": {"route_kind":"legacy-cli"} }';

  const map = loadAnnotations(distinctKeys);
  assert.equal(map.size, 2);
  assert.ok(map.has('ab'));
  assert.ok(map.has('a"b'));
});

test('native route without an explicit owner_path fails the build', () => {
  const badAnnotations = {
    version: { route_kind: 'native', operation_id: 'distribution.build.show' },
  };

  assert.throws(
    () => {
      generateCommandRoutes({ annotations: badAnnotations });
    },
    /Native route for selector "version" requires an explicit owner_path/
  );
});

test('double-annotated selector fails the build (multiple route_kinds in single entry)', () => {
  const badAnnotations = {
    version: {
      route_kind: ['native', 'legacy-cli'],
      operation_id: 'distribution.build.show',
    },
  };

  assert.throws(
    () => {
      loadAnnotations(badAnnotations);
    },
    /Double-bound selector.*declares more than one route_kind/
  );
});

test('stale annotation fails the build', () => {
  const staleAnnotations = {
    'nonexistent-command-selector': {
      route_kind: 'native',
      operation_id: 'fake.operation',
    },
  };

  assert.throws(
    () => {
      generateCommandRoutes({
        registry: COMMAND_REGISTRY,
        annotations: staleAnnotations,
      });
    },
    /Stale annotation: selector "nonexistent-command-selector" is absent from COMMAND_REGISTRY/
  );
});

test('explain-command-route explains native and legacy selectors and rejects unknown', () => {
  const versionInfo = explainCommandRoute('version');
  assert.equal(versionInfo.selector, 'version');
  assert.equal(versionInfo.route_kind, 'native');
  assert.equal(versionInfo.operation_id, 'distribution.build.show');
  assert.equal(versionInfo.owner_path, 'packages/distribution/rust');
  assert.deepEqual(versionInfo.compatibility_tests, ['test/rust-host/command-routes.test.mjs']);

  const addInfo = explainCommandRoute('add');
  assert.equal(addInfo.selector, 'add');
  assert.equal(addInfo.route_kind, 'legacy-cli');
  assert.equal(addInfo.legacy_payload, 'legacy-node');
  assert.equal(addInfo.owner_path, 'src/cli/command-registry.mjs');
  assert.deepEqual(addInfo.compatibility_tests, ['test/rust-host/command-routes.test.mjs']);

  assert.throws(
    () => {
      explainCommandRoute('bogus-selector');
    },
    /Unknown command selector: "bogus-selector"/
  );

  // CLI execution checks
  const versionOutput = execFileSync('node', [EXPLAIN_SCRIPT, 'version'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  assert.match(versionOutput, /route_kind: native/);
  assert.match(versionOutput, /operation_id: distribution\.build\.show/);
  assert.match(versionOutput, /owner_path: packages\/distribution\/rust/);

  assert.throws(
    () => {
      execFileSync('node', [EXPLAIN_SCRIPT, 'bogus-selector'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    },
    (err) => {
      assert.notEqual(err.status, 0);
      assert.match(err.stderr, /Unknown command selector: "bogus-selector"/);
      return true;
    }
  );
});
