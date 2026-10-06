#!/usr/bin/env node
/**
 * scripts/regenerate-observe-fixtures.mjs
 *
 * Generates golden fixtures for Observe and owner crates under test/fixtures/observe/.
 * - friction/ and cases/ shards are generated using the native Rust CLI.
 * - owner stores (.fgos/events.jsonl, assignments/, coordination/) are generated
 *   using Node CLI / standard deterministic store structure in a temporary directory.
 * - All timestamps, IDs, PIDs, and git hashes are pinned so that running this script
 *   multiple times produces ZERO git diff.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(REPO_ROOT, 'test', 'fixtures', 'observe');
const RUST_BIN = path.join(REPO_ROOT, 'target', 'debug', 'fgos');

const PINNED_SESSION_ID = 'golden-fixture-writer';
const PINNED_CALLER_PID = '42000';
const PINNED_PROJECT_NAME = 'observe-golden-fixture';
const PINNED_GIT_HEAD_OPEN = '0123456789abcdef0123456789abcdef01234567';
const PINNED_GIT_HEAD_CLOSE = 'fedcba9876543210fedcba9876543210fedcba98';

function main() {
  console.log('Building fgos binary if needed...');
  execFileSync('cargo', ['build', '-p', 'fgos'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });

  const tmpDir = fs.mkdtempSync(path.join(REPO_ROOT, 'target', 'observe-fixture-'));
  const fgosDir = path.join(tmpDir, '.fgos');

  try {
    console.log(`Setting up temporary store at ${tmpDir}...`);
    execFileSync('git', ['init', tmpDir], { stdio: 'pipe' });
    execFileSync('git', ['commit', '--allow-empty', '-m', 'init'], {
      cwd: tmpDir,
      stdio: 'pipe',
    });

    // 1. Initialize store with Node CLI
    execFileSync(process.execPath, [path.join(REPO_ROOT, 'bin', 'fgos.mjs'), 'init'], {
      cwd: tmpDir,
      stdio: 'pipe',
    });

    // 2. Setup deterministic Work store (.fgos/events.jsonl)
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
        ts: '2026-09-29T08:05:00.000Z',
        type: 'work.friction',
        payload: {
          id: 'tsk-golden-1',
          layer: 'verification',
          errorClass: 'verify-miss',
          disposition: 'advisory',
          detail: 'Contract schema validation failed for observe.observation',
          attempts: 1,
          docType: null,
          producer: 'runner.loop',
        },
        v: 2,
      },
      {
        seq: 3,
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

    fs.writeFileSync(
      path.join(fgosDir, 'events.jsonl'),
      workEvents.map((e) => JSON.stringify(e)).join('\n') + '\n',
      'utf8'
    );

    // Remove any per-process event shards in .fgos/events/ to keep events.jsonl baseline pure
    const eventsSubdir = path.join(fgosDir, 'events');
    if (fs.existsSync(eventsSubdir)) {
      fs.rmSync(eventsSubdir, { recursive: true, force: true });
    }

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

    // 4. Setup deterministic Coordination store (.fgos/coordination/sessions/)
    const sessionDir = path.join(fgosDir, 'coordination', 'sessions', 'coord-golden-01');
    fs.mkdirSync(sessionDir, { recursive: true });

    fs.writeFileSync(
      path.join(sessionDir, 'session.json'),
      JSON.stringify(
        {
          id: 'coord-golden-01',
          status: 'completed',
          completedAt: '2026-09-29T09:30:00.000Z',
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    const sessionEvents = [
      {
        type: 'session-opened',
        ts: '2026-09-29T09:00:00.000Z',
        payload: {
          protocolRef: 'rfc-deliberation@v1',
          driver: 'interactive',
        },
      },
      {
        type: 'assignment-created',
        ts: '2026-09-29T09:05:00.000Z',
        payload: {
          actorId: 'agent-1',
          assignmentId: 'asgn-golden-01',
        },
      },
      {
        type: 'result-linked',
        ts: '2026-09-29T09:20:00.000Z',
        payload: {
          assignmentId: 'asgn-golden-01',
          runId: 'run-golden-01',
        },
      },
      {
        type: 'session-completed',
        ts: '2026-09-29T09:30:00.000Z',
        payload: {
          verdict: 'approved',
        },
      },
    ];

    fs.writeFileSync(
      path.join(sessionDir, 'events.jsonl'),
      sessionEvents.map((e) => JSON.stringify(e)).join('\n') + '\n',
      'utf8'
    );

    // 5. Generate Observe friction shard using Rust CLI (triggers lazy migration + records friction)
    console.log('Recording friction via native Rust CLI...');
    const rustEnv = {
      ...process.env,
      FGOS_SESSION_ID: PINNED_SESSION_ID,
      FGOS_CALLER_PID: PINNED_CALLER_PID,
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
        env: {
          ...rustEnv,
          FGOS_NOW: '2026-09-29T10:00:00.000Z',
        },
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
        env: {
          ...rustEnv,
          FGOS_NOW: '2026-09-29T10:15:00.000Z',
        },
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
        '--name',
        'golden-case-1',
        '--harness',
        'fgos',
        '--task',
        'Verify observe component migration and contract boundaries',
      ],
      {
        env: {
          ...rustEnv,
          FGOS_NOW: '2026-09-29T08:00:00.000Z',
          FGOS_GIT_HEAD: PINNED_GIT_HEAD_OPEN,
        },
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
        '--name',
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
        env: {
          ...rustEnv,
          FGOS_NOW: '2026-09-29T10:30:00.000Z',
          FGOS_GIT_HEAD: PINNED_GIT_HEAD_CLOSE,
        },
        stdio: 'pipe',
      }
    );

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

    // Remove any store locks or temporary files
    const lockFile = path.join(fgosDir, 'observe', '.lock');
    if (fs.existsSync(lockFile)) {
      fs.rmSync(lockFile, { force: true });
    }

    // 8. Copy generated .fgos structure into FIXTURES_DIR
    console.log(`Writing golden fixtures to ${FIXTURES_DIR}...`);
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });

    // Copy .fgos directory
    fs.cpSync(fgosDir, path.join(FIXTURES_DIR, '.fgos'), { recursive: true });

    console.log('Golden fixtures regenerated successfully.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
