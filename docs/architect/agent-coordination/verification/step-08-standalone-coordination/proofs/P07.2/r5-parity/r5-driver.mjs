// r5-driver.mjs -- R5 capability-parity live proof driver. Real dispatch,
// no mocks: dispatches the SAME declared-consult fixture
// (core/coordination-protocols/declared-consult.yaml, via the already-
// published docs/how-to/coordination-examples/declared-consult-request.json
// content) once through the interactive CLI door (bin/fgos.mjs coordination
// run, a fresh `node` subprocess) and once through the headless adapter
// door (runCoordinationHeadless, called in-process -- the realistic shape
// of a headless caller: a Node script that imports the module directly).
// Both runs execute against the SAME real REPO_ROOT config/executors,
// sequentially (never concurrently -- avoids the documented pre-existing
// per-cwd dispatch-lock collision, P07.1/P05.2/P04.2b Gaps), each under its
// own distinct coordinationId so persisted state never collides.
//
// Writes raw envelopes/persisted records to ./out/ for r5-diff.mjs to
// compare. Never edits declared-consult.yaml or any already-closed phase
// file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../../../../../..');
const OUT_DIR = path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_REQUEST = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'docs/how-to/coordination-examples/declared-consult-request.json'), 'utf8'),
);

function writeJson(name, value) {
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readSessionState(coordinationId) {
  const sessionDir = path.join(REPO_ROOT, '.fgos', 'coordination', 'sessions', coordinationId);
  const manifest = JSON.parse(fs.readFileSync(path.join(sessionDir, 'session.json'), 'utf8'));
  const events = fs
    .readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const assignmentsDir = path.join(REPO_ROOT, '.fgos', 'assignments');
  const assignments = {};
  for (const ref of manifest.assignmentRefs ?? []) {
    const assignmentId = ref.assignmentId ?? ref;
    const assignmentDir = path.join(assignmentsDir, assignmentId);
    const assignment = JSON.parse(fs.readFileSync(path.join(assignmentDir, 'assignment.json'), 'utf8'));
    const runsDir = path.join(assignmentDir, 'runs');
    const runs = {};
    if (fs.existsSync(runsDir)) {
      for (const runNo of fs.readdirSync(runsDir).sort()) {
        const runDir = path.join(runsDir, runNo);
        const runJsonPath = path.join(runDir, 'run.json');
        const resultJsonPath = path.join(runDir, 'result.json');
        const evidenceJsonPath = path.join(runDir, 'evidence.json');
        runs[runNo] = {
          run: fs.existsSync(runJsonPath) ? JSON.parse(fs.readFileSync(runJsonPath, 'utf8')) : null,
          result: fs.existsSync(resultJsonPath) ? JSON.parse(fs.readFileSync(resultJsonPath, 'utf8')) : null,
          evidence: fs.existsSync(evidenceJsonPath) ? JSON.parse(fs.readFileSync(evidenceJsonPath, 'utf8')) : null,
        };
      }
    }
    assignments[assignmentId] = { assignment, runs };
  }
  return { manifest, events, assignments };
}

async function runHeadless(requestObject) {
  const { runCoordinationHeadless } = await import(
    path.join(REPO_ROOT, 'src/runner/coordination/headless-adapter.mjs')
  );
  const { ensureRunnerConfigForDir } = await import(path.join(REPO_ROOT, 'src/runner/dispatch.mjs'));
  return runCoordinationHeadless(requestObject, {
    ctx: { cwd: REPO_ROOT, repoRoot: REPO_ROOT, runnerConfig: ensureRunnerConfigForDir(REPO_ROOT) },
    executor: 'claude',
  });
}

function runCli(requestPath) {
  const raw = execFileSync(
    process.execPath,
    [path.join(REPO_ROOT, 'bin/fgos.mjs'), 'coordination', 'run', '--file', requestPath, '--executor', 'claude'],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  return JSON.parse(raw);
}

async function positiveCase() {
  console.log('=== R5 positive case: declared-consult through both doors ===');

  const cliRequest = { ...BASE_REQUEST, coordinationId: 'p072r5cli', writerId: 'p072-r5-parity-proof' };
  const cliRequestPath = path.join(OUT_DIR, 'positive-cli-request.json');
  fs.writeFileSync(cliRequestPath, JSON.stringify(cliRequest, null, 2), 'utf8');
  console.log('-- running interactive CLI door...');
  const cliEnvelope = runCli(cliRequestPath);
  writeJson('positive-cli-envelope.json', cliEnvelope);
  const cliState = readSessionState('p072r5cli');
  writeJson('positive-cli-state.json', cliState);
  console.log('   CLI door done, status:', cliEnvelope.data?.status, 'closed:', cliEnvelope.data?.closed);

  const headlessRequest = { ...BASE_REQUEST, coordinationId: 'p072r5headless', writerId: 'p072-r5-parity-proof' };
  console.log('-- running headless door...');
  const headlessResult = await runHeadless(headlessRequest);
  writeJson('positive-headless-result.json', headlessResult);
  const headlessState = readSessionState('p072r5headless');
  writeJson('positive-headless-state.json', headlessState);
  console.log('   headless door done, status:', headlessResult.status, 'closed:', headlessResult.closed);
}

async function negativeCase() {
  console.log('=== R5 negative case: unknown top-level field through both doors ===');
  const badRequest = { ...BASE_REQUEST, coordinationId: 'p072r5negcli', unknownField: 'boom' };

  const badRequestPath = path.join(OUT_DIR, 'negative-request.json');
  fs.writeFileSync(badRequestPath, JSON.stringify(badRequest, null, 2), 'utf8');

  let cliError = null;
  try {
    execFileSync(
      process.execPath,
      [path.join(REPO_ROOT, 'bin/fgos.mjs'), 'coordination', 'run', '--file', badRequestPath, '--executor', 'claude'],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
  } catch (err) {
    cliError = { status: err.status, stderr: err.stderr?.toString('utf8').trim() };
  }
  writeJson('negative-cli-error.json', cliError);
  console.log('   CLI negative:', JSON.stringify(cliError));

  let headlessError = null;
  try {
    await runHeadless({ ...badRequest, coordinationId: 'p072r5neghl' });
  } catch (err) {
    headlessError = { name: err.constructor.name, category: err.category ?? null, message: err.message };
  }
  writeJson('negative-headless-error.json', headlessError);
  console.log('   headless negative:', JSON.stringify(headlessError));
}

await positiveCase();
await negativeCase();
console.log('=== R5 driver done. Raw output under', OUT_DIR, '===');
