import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const contractsDir = join(root, 'packages', 'terminal-control', 'contracts');
const readJson = (name) => JSON.parse(readFileSync(join(contractsDir, name), 'utf8'));

const port = readJson('terminal-control.port.v1.json');
const record = readJson('allocation-record.v1.json');
const route = readJson('internal-route.terminal-control.v1.json');
const capabilities = readJson('driver-capabilities.v1.json');
const policy = readJson('placement-policy.v1.json');

test('every contract file parses and names itself at version 1', () => {
  const files = readdirSync(contractsDir).filter((name) => name.endsWith('.json'));
  assert.equal(files.length, 5);
  for (const name of files) {
    const contract = readJson(name).contract;
    assert.equal(contract.version, 1, name);
    assert.match(contract.id, /^(internal-route-)?terminal-control/, name);
  }
});

test('driver capability names are unique and every herdr capability is declared', () => {
  const names = capabilities.capabilities.map((c) => c.name);
  assert.equal(new Set(names).size, names.length);
  for (const platform of ['linux', 'macos', 'windows', 'absent']) {
    const list = capabilities.drivers.herdr[platform];
    assert.ok(Array.isArray(list), platform);
    assert.equal(new Set(list).size, list.length, platform);
    for (const name of list) assert.ok(names.includes(name), `${platform}: ${name}`);
  }
  assert.deepEqual(capabilities.drivers.herdr.windows, []);
  assert.deepEqual(capabilities.drivers.herdr.absent, []);
});

test('every port operation has a route op and only names results the port defines', () => {
  const ops = Object.keys(port.operations);
  assert.deepEqual([...route.argv.op.enum].sort(), [...ops].sort());
  for (const [op, spec] of Object.entries(port.operations)) {
    for (const result of spec.results) assert.ok(result in port.results, `${op}: ${result}`);
  }
  assert.ok('unsupported' in port.results);
  assert.ok('unknown' in port.results);
});

test('operations that touch the terminal can answer unsupported and unknown', () => {
  for (const op of ['allocate', 'attach', 'launch', 'send', 'read', 'label']) {
    assert.ok(port.operations[op].results.includes('unsupported'), op);
    assert.ok(port.operations[op].results.includes('unknown'), op);
  }
});

test('the route reports a protocol mismatch the same way the other internal routes do', () => {
  const lockFd = JSON.parse(readFileSync(join(root, 'packages', 'holder-lock', 'contracts', 'internal-route.lock-fd.v1.json'), 'utf8'));
  const mismatchCode = (contract) => Object.entries(contract.exitCodes).find(([, meaning]) => meaning.includes('host-version-mismatch'))?.[0];
  assert.equal(mismatchCode(route), mismatchCode(lockFd));
  assert.ok(route.errorStdout.code.enum.includes('host-version-mismatch'));
});

test('the allocation record carries the full server incarnation and both origins', () => {
  assert.deepEqual(Object.keys(record.record.serverIncarnation).sort(), ['bootId', 'endpoint', 'host', 'pid', 'pidNs', 'startTime']);
  assert.deepEqual(Object.keys(port.types.serverIncarnation).sort(), Object.keys(record.record.serverIncarnation).sort());
  assert.deepEqual(record.record.origin.enum, ['allocated', 'attached']);
  assert.deepEqual(Object.keys(record.markers).sort(), ['launch-requested', 'launched', 'released']);
});

test('the placement policy decides split, newTab or unsupported and its default is registered', () => {
  const shapes = policy.output.oneOf.map((option) => Object.keys(option)[0]);
  assert.deepEqual(shapes, ['split', 'newTab', 'unsupported']);
  assert.deepEqual(policy.output.oneOf[0].split.direction.enum, ['right', 'down']);
  assert.ok(policy.registry.names.includes(policy.registry.default));
  assert.deepEqual(Object.keys(policy.input.limits).sort(), ['maxPanesPerTab', 'minCols', 'minRows']);
});

test('the port lists the answers the core gives, and every named refusal is a route error code', () => {
  assert.ok(port.operations.release.results.includes('unknown'));
  for (const result of ['unsupported', 'unknown']) assert.ok(port.operations['reconcile-scan'].results.includes(result), result);
  assert.ok('paneId' in port.results.scan.findings[0]);
  for (const member of ['endpoint', 'anchorPane', 'agentKinds', 'integrations', 'defaults', 'policies']) assert.ok(member in port.results.capabilities, member);
  assert.ok('agents' in port.operations.capabilities.input);
  assert.match(port.operations.attach.rule, /pane-not-owned/);
  for (const cause of Object.keys(port.configRefusals)) assert.ok(route.errorStdout.code.enum.includes(cause), cause);
});
