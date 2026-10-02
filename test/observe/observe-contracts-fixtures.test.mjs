import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const FIXTURES_DIR = path.join(REPO_ROOT, 'test', 'fixtures', 'observe', '.fgos');

function readJson(relPath) {
  const fullPath = path.join(REPO_ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}

function readJsonl(relPath) {
  const fullPath = path.join(REPO_ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`Failed parsing line ${idx + 1} in ${relPath}: ${err.message}`);
      }
    });
}

test('Observe contracts exist and have standard schemas', () => {
  const contracts = [
    'packages/observe/contracts/observe.observation.v1.json',
    'packages/observe/contracts/observe.friction.v1.json',
    'packages/observe/contracts/observe.case.v1.json',
    'packages/observe/contracts/observe.snapshot.v1.json',
    'packages/run-result/contracts/run-result.read.v1.json',
    'packages/observe/contracts/coordination-session.read.v1.json',
    'packages/work-state/contracts/work-events.read.v1.json',
  ];

  for (const c of contracts) {
    const schema = readJson(c);
    assert.ok(schema.$schema, `${c} must specify $schema`);
    assert.ok(schema.$id, `${c} must specify $id`);
    assert.ok(schema.title, `${c} must specify title`);
    assert.ok(schema.description, `${c} must specify description`);
  }
});

test('Golden fixture friction shard matches observe.friction.v1 schema', () => {
  const schema = readJson('packages/observe/contracts/observe.friction.v1.json');
  assert.ok(Array.isArray(schema.oneOf), 'observe.friction.v1 schema must declare oneOf');

  const records = readJsonl('test/fixtures/observe/.fgos/observe/friction/golden-fixture-writer.jsonl');
  assert.ok(records.length >= 4, `expected at least 4 records, got ${records.length}`);

  const types = new Set();
  for (const record of records) {
    assert.equal(record.v, 1);
    assert.ok(typeof record.type === 'string');
    assert.ok(typeof record.ts === 'string');
    types.add(record.type);

    if (record.type === 'friction-recorded') {
      assert.ok(record.subject && record.subject.kind && record.subject.id);
      assert.ok(typeof record.layer === 'string');
      assert.ok(typeof record.errorClass === 'string');
      assert.ok(typeof record.disposition === 'string');
      assert.ok(typeof record.producer === 'string');
      assert.ok(record.caller && typeof record.caller.pid === 'number');
    } else if (record.type === 'friction-resolved') {
      assert.ok(record.subject && record.subject.kind && record.subject.id);
      assert.ok(typeof record.reason === 'string');
      assert.ok(typeof record.by === 'string');
      assert.ok(record.caller && typeof record.caller.pid === 'number');
    } else if (record.type === 'migration') {
      assert.equal(record.from, 'work.friction');
      assert.ok(typeof record.count === 'number');
      assert.ok(typeof record.resolved === 'number');
    } else {
      assert.fail(`unexpected friction shard record type: ${record.type}`);
    }
  }

  assert.ok(types.has('migration'), 'must have migration record');
  assert.ok(types.has('friction-recorded'), 'must have friction-recorded record');
  assert.ok(types.has('friction-resolved'), 'must have friction-resolved record');
});

test('Golden fixture cases shard matches observe.case.v1 schema', () => {
  const schema = readJson('packages/observe/contracts/observe.case.v1.json');
  assert.ok(Array.isArray(schema.oneOf), 'observe.case.v1 schema must declare oneOf');

  const records = readJsonl('test/fixtures/observe/.fgos/observe/cases/golden-fixture-writer.jsonl');
  assert.equal(records.length, 2, 'expected exactly 2 case records (open + close)');

  const [openRec, closeRec] = records;
  assert.equal(openRec.v, 1);
  assert.equal(openRec.type, 'case-opened');
  assert.equal(openRec.name, 'golden-case-1');
  assert.equal(openRec.project, 'observe-golden-fixture');
  assert.equal(openRec.harness, 'fgos');
  assert.ok(typeof openRec.ts === 'string');
  assert.ok(typeof openRec.headAtOpen === 'string');

  assert.equal(closeRec.v, 1);
  assert.equal(closeRec.type, 'case-closed');
  assert.equal(closeRec.name, 'golden-case-1');
  assert.equal(closeRec.interventions, 0);
  assert.equal(closeRec.verdict, 'usable');
  assert.deepEqual(closeRec.items, ['tsk-golden-1']);
  assert.deepEqual(closeRec.sessions, ['coord-golden-01']);
  assert.ok(typeof closeRec.ts === 'string');
  assert.ok(typeof closeRec.headAtClose === 'string');
});

test('Golden fixture snapshots shard matches observe.snapshot.v1 schema', () => {
  const schema = readJson('packages/observe/contracts/observe.snapshot.v1.json');
  assert.equal(schema.type, 'object');

  const records = readJsonl('test/fixtures/observe/.fgos/observe/snapshots/golden-fixture-writer.jsonl');
  assert.equal(records.length, 1);

  const snapshot = records[0];
  assert.equal(snapshot.v, 1);
  assert.equal(snapshot.type, 'snapshot');
  assert.equal(snapshot.case, 'golden-case-1');
  assert.ok(typeof snapshot.ts === 'string');
  assert.ok(snapshot.entropy && typeof snapshot.entropy.score === 'number');
  assert.ok(snapshot.entropy.components && typeof snapshot.entropy.components === 'object');
});

test('Owner stores match their read contracts', () => {
  // 1. RunResult owner store
  const runResultRead = readJson('packages/run-result/contracts/run-result.read.v1.json');
  assert.ok(runResultRead.properties.result);
  assert.ok(runResultRead.properties.assignment);

  const asgn = readJson('test/fixtures/observe/.fgos/assignments/asgn-golden-01/assignment.json');
  assert.ok(asgn.id);
  assert.ok(asgn.role);
  assert.ok(asgn.adapter);
  assert.ok(asgn.createdAt);

  const result = readJson('test/fixtures/observe/.fgos/assignments/asgn-golden-01/runs/run-golden-01/result.json');
  assert.ok(result.runId);
  assert.ok(result.assignmentId);
  assert.ok(result.status);
  assert.ok(result.settledAt);
  assert.ok(result.classification);

  // 2. Historic coordination sessions (engine retired; Observe still reads what it wrote)
  const coordRead = readJson('packages/observe/contracts/coordination-session.read.v1.json');
  assert.ok(coordRead.properties.sessionEvents);
  assert.ok(coordRead.properties.sessionJson);

  const session = readJson('test/fixtures/observe/.fgos/coordination/sessions/coord-golden-01/session.json');
  assert.equal(session.status, 'completed');
  assert.ok(session.completedAt);

  const sessionEvents = readJsonl('test/fixtures/observe/.fgos/coordination/sessions/coord-golden-01/events.jsonl');
  const allowedTypes = new Set(coordRead.properties.sessionEvents.properties.type.enum);
  for (const ev of sessionEvents) {
    assert.ok(allowedTypes.has(ev.type), `Session event type ${ev.type} must be allowed in read contract`);
    assert.ok(typeof ev.ts === 'string');
  }

  // 3. Work owner store
  const workRead = readJson('packages/work-state/contracts/work-events.read.v1.json');
  assert.ok(workRead.properties.type);
  assert.ok(workRead.properties.payload);

  const workEvents = readJsonl('test/fixtures/observe/.fgos/events.jsonl');
  const allowedWorkTypes = new Set(workRead.properties.type.enum);
  for (const ev of workEvents) {
    assert.ok(allowedWorkTypes.has(ev.type), `Work event type ${ev.type} must be allowed in read contract`);
    assert.ok(typeof ev.seq === 'number');
    assert.ok(typeof ev.ts === 'string');
    assert.ok(ev.payload && typeof ev.payload.id === 'string');
  }
});
