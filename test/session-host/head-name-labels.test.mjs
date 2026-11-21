// The owning proof of how a head is named: the tab label it is started with (role whole, then a readable subject)
// and the head name of a plan, which stays unique for two plans that share their first 24 characters.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headNameOf, nameTag, planOfHead, subjectOfDir } from '../../src/session-host/head-plan.mjs';
import { placeHead } from '../../src/session-host/head-start.mjs';

const LONG = '261118-0947-session-verb-for-agent-sessions';
const TWIN = `${LONG}-2`;

const planText = (status) => `---\ncontract: plan-v1\nstatus: ${status}\nfootprint:\n  - plans/x/**\n---\n`;
const planPorts = (dirs) => ({
  handle: 'forgent',
  listPlanDirs: (_root, prefix) => Object.keys(dirs).filter((d) => d.startsWith(prefix)),
  readPlan: (_root, dir) => planText(dirs[dir]),
});

async function startedDisplay(persona, name, dirs = {}) {
  let display = null;
  await placeHead({ persona, name, projectRoot: '/nowhere' }, {
    planOfHead: (root, p, n) => planOfHead(root, p, n, planPorts(dirs)),
    taskOfHead: persona === 'lead' ? undefined : async () => null,
    pin: () => ({ name: persona, text: '' }),
    handoff: () => null,
    opening: () => 'opening',
    runnerConfig: () => ({}),
    bind: ({ key }) => ({ key }),
    launch: (request) => { display = request.display; return { placement: { key: request.key }, runDir: '/run' }; },
  });
  return display;
}

test('the tag of a directory is the one the Rust head name writes', () => {
  // Pinned to the same values as packages/supervision/rust/tests/portfolio.rs.
  assert.equal(nameTag(LONG), 'f24d0');
  assert.equal(nameTag(TWIN), '1062f');
  assert.equal(headNameOf('forgent', LONG).length, 32);
  assert.equal(headNameOf('forgent', '261121-0707-head-tab'), 'forgent-261121-0707-head-tab');
});

test('a lead of a plan starts with its whole role and the plan directory without its date as the tab label parts', async () => {
  const dirs = { '261121-0707-head-tab-labels': 'running' };
  const display = await startedDisplay('lead', headNameOf('forgent', '261121-0707-head-tab-labels'), dirs);
  assert.deepEqual(display, { role: 'lead', title: 'head-tab-labels' });
  assert.equal(subjectOfDir('261121-0707-head-tab-labels'), 'head-tab-labels');
});

test('a head with no task of its own shows its name as the subject', async () => {
  assert.deepEqual(await startedDisplay('secretary', 'miu'), { role: 'secretary', title: 'miu' });
});

test('leads of two plans that share their first 24 characters each start and resolve to their own plan', async () => {
  const dirs = { [LONG]: 'running', [TWIN]: 'running' };
  const [a, b] = [headNameOf('forgent', LONG), headNameOf('forgent', TWIN)];
  assert.notEqual(a, b);
  assert.equal((await planOfHead('/nowhere', 'lead', a, planPorts(dirs))).dir, LONG);
  assert.equal((await planOfHead('/nowhere', 'lead', b, planPorts(dirs))).dir, TWIN);
  assert.equal((await startedDisplay('lead', a, dirs)).title, subjectOfDir(LONG));
  assert.equal((await startedDisplay('lead', b, dirs)).title, subjectOfDir(TWIN));
});
