#!/usr/bin/env node
/**
 * scripts/regenerate-observe-fixtures.mjs
 *
 * Generates golden fixtures for Observe and owner crates under test/fixtures/observe/.
 * - friction/ and cases/ shards are generated using the native Rust CLI.
 * - owner stores (Event Store, assignments/) are generated
 *   using Node CLI / standard deterministic store structure in a temporary directory.
 * - All timestamps, IDs, PIDs, and git hashes are pinned so that running this script
 *   multiple times produces ZERO git diff.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { sandboxGit } from './lib/sandbox-git.mjs';
import { ensureGitAddon } from './git-addon.mjs';
import { prepareStore } from '../src/event-store/index.mjs';
import { fixEventStoreLockDirs } from '../src/setup/event-store-fixes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(REPO_ROOT, 'test', 'fixtures', 'observe');
const RUST_BIN = path.join(process.env.CARGO_TARGET_DIR ?? path.join(REPO_ROOT, 'target'), 'debug', 'fgos');

const PINNED_SESSION_ID = 'golden-fixture-writer';
const PINNED_CALLER_PID = 42000;
const PINNED_PROJECT_NAME = 'observe-golden-fixture';
const PINNED_GIT_HEAD_OPEN = '0123456789abcdef0123456789abcdef01234567';
const PINNED_GIT_HEAD_CLOSE = 'fedcba9876543210fedcba9876543210fedcba98';

// The native writer stamps the real clock, pid and git head; golden fixtures pin them.
// The appended stamps must be strictly increasing first (record < resolve, open < close),
// so pinning never hides a writer that stamps out of order. Stamping itself is owned by the
// Rust unit tests; the fixtures prove readers and shapes.
function pinAppended(file, fromLine, pin) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const appended = lines.slice(fromLine).map((line) => JSON.parse(line));
  const instants = appended.map((record) => Date.parse(record.ts));
  assert.ok(
    instants.every((instant, i) => Number.isFinite(instant) && (i === 0 || instant > instants[i - 1])),
    `${path.basename(file)}: appended stamps are not strictly increasing: ${appended.map((r) => r.ts).join(', ')}`,
  );
  const pinned = appended.map((record, i) => JSON.stringify(pin(record, i)));
  fs.writeFileSync(file, [...lines.slice(0, fromLine), ...pinned].join('\n') + '\n', 'utf8');
}

function main() {
  // The Work seed below goes through the native Event Store door, which needs this checkout's addon.
  ensureGitAddon();
  console.log('Building fgos binary if needed...');
  execFileSync('cargo', ['build', '-p', 'fgos'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'observe-fixture-'));
  const fgosDir = path.join(tmpDir, '.fgos');

  try {
    console.log(`Setting up temporary store at ${tmpDir}...`);
    const git = sandboxGit(tmpDir);
    git(['init', tmpDir]);
    git(['-C', tmpDir, 'config', 'fgos.machineId', PINNED_SESSION_ID]);
    git(['commit', '--allow-empty', '-m', 'init'], { cwd: tmpDir });
    fixEventStoreLockDirs(tmpDir, { trustedMain: tmpDir });

    // 1. Initialize store with Node CLI
    execFileSync(process.execPath, [path.join(REPO_ROOT, 'bin', 'fgos.mjs'), 'init'], {
      cwd: tmpDir,
      stdio: 'pipe',
    });

    // 2. Seed Work through the real store; its events live outside the worktree.
    const workEvents = [
      {
        seq: 1,
        ts: '2026-09-29T08:00:00.000Z',
        type: 'work.add',
        payload: {
          id: 'tsk-golden-1',
          title: 'Implement observe contracts',
          kind: 'task',
          risk: 'standard',
          verify: 'npm test',
          description: 'Add versioned contracts and golden fixtures for observe component.',
        },
        v: 2,
      },
      {
        seq: 2,
        ts: '2026-09-29T08:10:00.000Z',
        type: 'work.move',
        payload: {
          id: 'tsk-golden-1',
          from: 'blocked',
          to: 'done',
          actor: 'human',
        },
        v: 2,
      },
    ];

    const workStore = prepareStore(tmpDir, { trustedMain: tmpDir });
    workStore.append('project', workEvents.map(e => ({
      eventType: e.type, schemaVersion: 1, payload: e.payload, ts: e.ts,
    })), {}, PINNED_SESSION_ID, []);

    // 3. Setup deterministic RunResult store (.fgos/assignments/)
    const asgnDir = path.join(fgosDir, 'assignments', 'asgn-golden-01');
    const runDir = path.join(asgnDir, 'runs', 'run-golden-01');
    fs.mkdirSync(runDir, { recursive: true });

    fs.writeFileSync(
      path.join(asgnDir, 'assignment.json'),
      JSON.stringify(
        {
          id: 'asgn-golden-01',
          role: 'reviewer',
          adapter: 'gemini',
          createdAt: '2026-09-29T08:30:00.000Z',
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    fs.writeFileSync(
      path.join(runDir, 'result.json'),
      JSON.stringify(
        {
          runId: 'run-golden-01',
          assignmentId: 'asgn-golden-01',
          executorId: 'gemini-worker',
          status: 'settled',
          settledAt: '2026-09-29T08:45:00.000Z',
          classification: {
            reason: 'success',
            confidence: 0.95,
          },
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    // Retain the frozen legacy friction journal. Its retired work.friction type cannot be appended to a
    // current Work registry, so the journal comes from a committed fixture; new records below still use
    // the native writer on top of these real existing journal bytes.
    const frictionDir = path.join(fgosDir, 'observe/friction');
    fs.mkdirSync(frictionDir, { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'test/fixtures/observe-legacy-friction.jsonl'),
      path.join(frictionDir, PINNED_SESSION_ID + '.jsonl'));

    // 5. Generate current Observe records using the native CLI
    const frictionShard = path.join(frictionDir, PINNED_SESSION_ID + '.jsonl');
    const frozenFrictionLines = fs.readFileSync(frictionShard, 'utf8').split('\n').filter(Boolean).length;
    console.log('Recording friction via native Rust CLI...');
    const rustEnv = {
      ...process.env,
      FGOS_SESSION_ID: PINNED_SESSION_ID,
      FGOS_PROJECT_NAME: PINNED_PROJECT_NAME,
    };

    execFileSync(
      RUST_BIN,
      [
        'friction',
        'record',
        '--dir',
        tmpDir,
        '--subject',
        'work:tsk-golden-1',
        '--layer',
        'verification',
        '--error-class',
        'contract-mismatch',
        '--disposition',
        'advisory',
        '--producer',
        'runner.loop',
        '--detail',
        'Contract and fixture generator verified',
      ],
      {
        env: rustEnv,
        stdio: 'pipe',
      }
    );

    console.log('Resolving friction via native Rust CLI...');
    execFileSync(
      RUST_BIN,
      [
        'friction',
        'resolve',
        '--dir',
        tmpDir,
        '--subject',
        'work:tsk-golden-1',
        '--reason',
        'done',
        '--by',
        'work',
      ],
      {
        env: rustEnv,
        stdio: 'pipe',
      }
    );

    // 6. Generate Observe cases shard using Rust CLI
    console.log('Opening and closing case via native Rust CLI...');
    execFileSync(
      RUST_BIN,
      [
        'metrics',
        'case',
        'open',
        '--dir',
        tmpDir,
        'golden-case-1',
        '--harness',
        'fgos',
        '--task',
        'Verify observe component migration and contract boundaries',
      ],
      {
        env: rustEnv,
        stdio: 'pipe',
      }
    );

    execFileSync(
      RUST_BIN,
      [
        'metrics',
        'case',
        'close',
        '--dir',
        tmpDir,
        'golden-case-1',
        '--interventions',
        '0',
        '--verdict',
        'usable',
        '--items',
        'tsk-golden-1',
        '--sessions',
        'coord-golden-01',
      ],
      {
        env: rustEnv,
        stdio: 'pipe',
      }
    );

    const pinCaller = (record, stamp) => ({ ...record, ts: stamp, caller: { ...record.caller, pid: PINNED_CALLER_PID } });
    pinAppended(frictionShard, frozenFrictionLines, (record, i) =>
      pinCaller(record, ['2026-09-29T10:00:00.000Z', '2026-09-29T10:15:00.000Z'][i]));
    pinAppended(path.join(fgosDir, 'observe/cases', PINNED_SESSION_ID + '.jsonl'), 0, (record, i) =>
      i === 0
        ? { ...record, ts: '2026-09-29T08:00:00.000Z', headAtOpen: PINNED_GIT_HEAD_OPEN }
        : { ...record, ts: '2026-09-29T10:30:00.000Z', headAtClose: PINNED_GIT_HEAD_CLOSE });

    // 7. Write deterministic Observe snapshots shard
    const snapshotsDir = path.join(fgosDir, 'observe', 'snapshots');
    fs.mkdirSync(snapshotsDir, { recursive: true });
    const snapshotRecord = {
      v: 1,
      type: 'snapshot',
      ts: '2026-09-29T10:30:00.000Z',
      case: 'golden-case-1',
      entropy: {
        score: 0.12,
        components: {
          'missing-actual': 0.0,
          'stale-doing': 0.0,
          'stage-entry': 0.05,
          'awaiting-human': 0.0,
          'friction-unsettled': 0.07,
        },
      },
    };
    fs.writeFileSync(
      path.join(snapshotsDir, `${PINNED_SESSION_ID}.jsonl`),
      JSON.stringify(snapshotRecord) + '\n',
      'utf8'
    );

    // 8. Copy generated .fgos structure into FIXTURES_DIR
    console.log(`Writing golden fixtures to ${FIXTURES_DIR}...`);
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });

    // Copy only owner snapshots: native identity, cursors and locks are runtime state.
    for (const name of ['assignments', 'observe']) {
      fs.cpSync(path.join(fgosDir, name), path.join(FIXTURES_DIR, '.fgos', name), { recursive: true });
    }
    const history = workStore.read({ streams: ['project'] }, []).sequence;
    const snapshot = history.map(({ seq, ts, type, payload }) => ({ seq, ts, type, payload, v: 2 }));
    fs.writeFileSync(path.join(FIXTURES_DIR, 'work-events.jsonl'), snapshot.map(e => JSON.stringify(e)).join('\n') + '\n');

    console.log('Golden fixtures regenerated successfully.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
