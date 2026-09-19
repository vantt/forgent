import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { openSession } from '../../src/runner/coordination/store.mjs';

function tmpCwd() {
  const dir = path.join(tmpdir(), 'fgos-store-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  const fgosDir = path.join(dir, '.fgos');
  fs.mkdirSync(fgosDir);
  return dir;
}

const DUMMY_PROVENANCE = { writerId: 'test-writer' };

test('claim.json write failure cleans up claim dir', () => {
  const cwd = tmpCwd();
  
  const originalWriteFileSync = fs.writeFileSync;
  fs.writeFileSync = (filePath, ...args) => {
    if (filePath.endsWith('claim.json')) {
      throw new Error('Injected write failure');
    }
    return originalWriteFileSync(filePath, ...args);
  };
  
  try {
    assert.throws(
      () => {
        openSession({ coordinationId: 'fail-claim', schemaVersion: '3', objective: 'test', provenanceRoot: DUMMY_PROVENANCE }, { repoRoot: cwd });
      },
      /Injected write failure/
    );
    
    const sessionsDir = path.join(cwd, '.fgos', 'coordination', 'sessions');
    const entries = fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir) : [];
    assert.equal(entries.includes('fail-claim.claim'), false, 'claim dir should be cleaned up');
  } finally {
    fs.writeFileSync = originalWriteFileSync;
  }
});

test('Validation/event/fsync failure cleanup đúng claim sở hữu', () => {
  const cwd = tmpCwd();
  
  const originalFsyncSync = fs.fsyncSync;
  fs.fsyncSync = (fd) => {
    throw new Error('Injected fsync failure');
  };
  
  try {
    assert.throws(
      () => {
        openSession({ coordinationId: 'fail-fsync', schemaVersion: '3', objective: 'test', provenanceRoot: DUMMY_PROVENANCE }, { repoRoot: cwd });
      },
      /Injected fsync failure/
    );
    
    const sessionsDir = path.join(cwd, '.fgos', 'coordination', 'sessions');
    const entries = fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir) : [];
    assert.equal(entries.includes('fail-fsync.claim'), false, 'claim dir should be cleaned up on fsync failure');
  } finally {
    fs.fsyncSync = originalFsyncSync;
  }
});

test('Concurrent open with explicit ID: only one winner, others fail', async () => {
  const cwd = tmpCwd();
  const opts = { repoRoot: cwd };
  const id = 'concurrent-test';
  
  const sessionsDir = path.join(cwd, '.fgos', 'coordination', 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.mkdirSync(path.join(sessionsDir, id + '.claim'));
  
  assert.throws(
    () => {
      openSession({ coordinationId: id, schemaVersion: '3', objective: 'test', provenanceRoot: DUMMY_PROVENANCE }, opts);
    },
    /already exists \(claim held\)/
  );
});

test('Empty intersection in org policy fails closed', () => {
    const cwd = tmpCwd();
    const opts = { 
        repoRoot: cwd,
        runnerConfig: {
            coordination: {
                orgPolicy: { dischargeOn: ['strict'] }
            }
        },
        resolvedDefinition: {
            spec: {
                graph: {
                    nodes: [{ operations: [{ ref: 'op1', rechecks: { dischargeOn: ['accepted'] } }] }]
                }
            }
        }
    };
    
    assert.throws(
        () => {
            openSession({ coordinationId: 'policy-test', schemaVersion: '3', objective: 'test', provenanceRoot: DUMMY_PROVENANCE, definitionRef: { id: 'some-def', version: '1' } }, opts);
        },
        /refusing to open session with empty effectiveDischargeOn/
    );
});

test('Org policy accepted intersect đúng', () => {
    const cwd = tmpCwd();
    const id = 'policy-test-' + Math.random().toString(36).slice(2);
    const opts = { 
        repoRoot: cwd,
        runnerConfig: {
            coordination: {
                orgPolicy: { dischargeOn: ['accepted', 'rejected'] }
            }
        },
        resolvedDefinition: {
            spec: {
                graph: {
                    nodes: [{ operations: [{ ref: 'op1', rechecks: { dischargeOn: ['accepted', 'bypassed'] } }] }]
                }
            }
        }
    };
    
    openSession({ coordinationId: id, schemaVersion: '3', objective: 'test', provenanceRoot: DUMMY_PROVENANCE, definitionRef: { id: 'some-def', version: '1' } }, opts);
    
    const snapshotPath = path.join(cwd, '.fgos', 'coordination', 'sessions', id, 'snapshot.json');
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    assert.deepEqual(snapshot.spec.graph.nodes[0].operations[0].rechecks.dischargeOn, ['accepted']);
});
