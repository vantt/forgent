// test/portfolio/portfolio-check.test.mjs -- Unit and fixture tests for portfolio contract check, items, and generated index
import '../helpers/process-tmp-root.mjs';
import { ensureGitAddon } from '../helpers/git-addon.mjs';
ensureGitAddon();

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  parseBacklogItem,
  formatBacklogItem,
  createBacklogItem,
  editBacklogItem,
  slugify,
} from '../../src/portfolio/item.mjs';
import {
  parseDiscussion,
  formatDiscussion,
} from '../../src/portfolio/discussion.mjs';
import { generateBacklogIndex } from '../../src/portfolio/index-generator.mjs';
import { checkPortfolio } from '../../src/portfolio/portfolio-check.mjs';

function makeTmpDir(prefix = 'fgos-portfolio-test-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return dir;
}

test('parseBacklogItem parses valid item with all required keys and body sections', () => {
  const text = `---
id: p-rw5iadsp2p
title: Item contract, check and generated index
status: proposed
priority: P1
area: portfolio
created: 2026-11-21
---

# Why

Need unified portfolio schema.

# Done when

Check passes.

# Notes

Pre-plan detail.
`;

  const item = parseBacklogItem(text, 'p-rw5iadsp2p-item-check.md');
  assert.equal(item.id, 'p-rw5iadsp2p');
  assert.equal(item.title, 'Item contract, check and generated index');
  assert.equal(item.status, 'proposed');
  assert.equal(item.priority, 'P1');
  assert.equal(item.area, 'portfolio');
  assert.equal(item.created, '2026-11-21');
});

test('parseBacklogItem rejects missing required keys', () => {
  const text = `---
id: p-rw5iadsp2p
status: proposed
priority: P1
area: portfolio
created: 2026-11-21
---

# Why
why
# Done when
done
# Notes
notes
`;

  assert.throws(
    () => parseBacklogItem(text, 'bad.md'),
    /missing required frontmatter key 'title'/
  );
});

test('parseBacklogItem rejects unknown status and priority', () => {
  const textBadStatus = `---
id: p-rw5iadsp2p
title: Valid title
status: in-progress
priority: P1
area: portfolio
created: 2026-11-21
---

# Why
why
# Done when
done
# Notes
notes
`;

  assert.throws(
    () => parseBacklogItem(textBadStatus, 'bad.md'),
    /unknown status 'in-progress'/
  );

  const textBadPriority = textBadStatus.replace('status: in-progress', 'status: proposed').replace('priority: P1', 'priority: P9');
  assert.throws(
    () => parseBacklogItem(textBadPriority, 'bad.md'),
    /unknown priority 'P9'/
  );
});

test('parseBacklogItem rejects missing body section', () => {
  const textMissingNotes = `---
id: p-rw5iadsp2p
title: Valid title
status: proposed
priority: P1
area: portfolio
created: 2026-11-21
---

# Why
why
# Done when
done
`;

  assert.throws(
    () => parseBacklogItem(textMissingNotes, 'bad.md'),
    /missing required body section\(s\): Notes/
  );
});

test('parseDiscussion parses valid discussion and rejects invalid fields', () => {
  const valid = `---
id: ds-234567abcd
title: Work data model
status: settled
source:
  - p-rw5iadsp2p
created: 2026-11-20
---

# Discussion content
`;

  const d = parseDiscussion(valid, 'DISCUSSION.md');
  assert.equal(d.id, 'ds-234567abcd');
  assert.equal(d.title, 'Work data model');
  assert.equal(d.status, 'settled');
  assert.deepEqual(d.source, ['p-rw5iadsp2p']);

  const badStatus = valid.replace('status: settled', 'status: closed');
  assert.throws(() => parseDiscussion(badStatus, 'bad.md'), /unknown status 'closed'/);

  const badSource = valid.replace('source:\n  - p-rw5iadsp2p', 'source: "p-rw5iadsp2p"');
  assert.throws(() => parseDiscussion(badSource, 'bad.md'), /'source' must be an array/);
});

test('createBacklogItem and editBacklogItem manage item files on disk', () => {
  const repo = makeTmpDir();
  try {
    const created = createBacklogItem(repo, {
      id: 'p-234567abcd',
      title: 'Test Create Item',
      status: 'proposed',
      priority: 'P2',
      area: 'test',
      why: 'Because we need it',
      doneWhen: 'Tests pass',
      notes: 'Initial notes',
    });

    assert.equal(created.id, 'p-234567abcd');
    assert.ok(fs.existsSync(created.fullPath));

    // Verify it parses back
    const fileContent = fs.readFileSync(created.fullPath, 'utf8');
    const parsed = parseBacklogItem(fileContent, created.filename);
    assert.equal(parsed.title, 'Test Create Item');
    assert.equal(parsed.status, 'proposed');

    // Edit item
    const edited = editBacklogItem(repo, 'p-234567abcd', {
      status: 'in-flight',
      priority: 'P0',
      notes: 'Updated notes',
    });

    const editedContent = fs.readFileSync(edited.fullPath, 'utf8');
    const parsedEdited = parseBacklogItem(editedContent, edited.filename);
    assert.equal(parsedEdited.status, 'in-flight');
    assert.equal(parsedEdited.priority, 'P0');
    assert.ok(parsedEdited.body.includes('Updated notes'));
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('generateBacklogIndex compiles markdown table with citing discussions and plans', () => {
  const items = [
    {
      id: 'p-nsngcpgoi2',
      title: 'Second item',
      status: 'in-flight',
      priority: 'P0',
      area: 'core',
      created: '2026-11-20',
      filename: 'p-nsngcpgoi2-second.md',
    },
    {
      id: 'p-rw5iadsp2p',
      title: 'First item',
      status: 'proposed',
      priority: 'P1',
      area: 'runner',
      created: '2026-11-19',
      filename: 'p-rw5iadsp2p-first.md',
    },
  ];

  const discussions = [
    {
      id: 'ds-234567abcd',
      dir: 'ds-234567abcd-shaping',
      status: 'open',
      source: ['p-nsngcpgoi2'],
    },
  ];

  const plans = [
    {
      dir: '261120-1200-plan',
      status: 'running',
      source: ['p-nsngcpgoi2'],
    },
  ];

  const index = generateBacklogIndex({ items, discussions, plans });
  assert.ok(index.includes('| ID | Title | Status | Priority | Area | Citing |'));
  // item P0 should appear before item P1
  const posP0 = index.indexOf('p-nsngcpgoi2');
  const posP1 = index.indexOf('p-rw5iadsp2p');
  assert.ok(posP0 < posP1, 'P0 item must precede P1 item');

  // Check citing column
  assert.ok(index.includes('[ds-234567abcd](discussions/ds-234567abcd-shaping/DISCUSSION.md) (open)'));
  assert.ok(index.includes('[261120-1200-plan](261120-1200-plan/plan.md) (running)'));
});

test('checkPortfolio validates clean portfolio fixture successfully', () => {
  const repo = makeTmpDir();
  try {
    const plansDir = path.join(repo, 'plans');
    const backlogDir = path.join(plansDir, 'backlog');
    const discDir = path.join(plansDir, 'discussions', 'ds-234567abcd-disc');
    const planDir = path.join(plansDir, '261120-0625-plan');

    fs.mkdirSync(backlogDir, { recursive: true });
    fs.mkdirSync(discDir, { recursive: true });
    fs.mkdirSync(planDir, { recursive: true });

    const itemText = formatBacklogItem({
      id: 'p-rw5iadsp2p',
      title: 'Portfolio Item',
      status: 'in-flight',
      priority: 'P1',
      area: 'portfolio',
      why: 'Why explanation',
      doneWhen: 'Criteria met',
      notes: 'Notes here',
    });
    fs.writeFileSync(path.join(backlogDir, 'p-rw5iadsp2p-item.md'), itemText);

    const discText = formatDiscussion({
      id: 'ds-234567abcd',
      title: 'Discussion Title',
      status: 'settled',
      source: ['p-rw5iadsp2p'],
      body: 'Some discussion notes',
    });
    fs.writeFileSync(path.join(discDir, 'DISCUSSION.md'), discText);

    const planText = `---
contract: plan-v1
title: Phase Plan
status: running
source:
  - p-rw5iadsp2p
  - ds-234567abcd
---

# Outcome
Plan outcome
`;
    fs.writeFileSync(path.join(planDir, 'plan.md'), planText);

    // Generate matching index
    const index = generateBacklogIndex({
      items: [
        {
          id: 'p-rw5iadsp2p',
          title: 'Portfolio Item',
          status: 'in-flight',
          priority: 'P1',
          area: 'portfolio',
          filename: 'p-rw5iadsp2p-item.md',
        },
      ],
      discussions: [
        {
          id: 'ds-234567abcd',
          dir: 'ds-234567abcd-disc',
          status: 'settled',
          source: ['p-rw5iadsp2p'],
        },
      ],
      plans: [
        {
          dir: '261120-0625-plan',
          status: 'running',
          source: ['p-rw5iadsp2p', 'ds-234567abcd'],
        },
      ],
    });
    fs.writeFileSync(path.join(plansDir, 'backlog.md'), index);

    const report = checkPortfolio({ repoRoot: repo });
    assert.deepEqual(report.errors, []);
    assert.equal(report.ok, true);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('checkPortfolio detects citation of non-existent item', () => {
  const repo = makeTmpDir();
  try {
    const plansDir = path.join(repo, 'plans');
    const discDir = path.join(plansDir, 'discussions', 'ds-234567abcd-disc');
    fs.mkdirSync(discDir, { recursive: true });

    const discText = formatDiscussion({
      id: 'ds-234567abcd',
      title: 'Discussion Title',
      status: 'open',
      source: ['p-234567nonx'],
    });
    fs.writeFileSync(path.join(discDir, 'DISCUSSION.md'), discText);

    const report = checkPortfolio({ repoRoot: repo, checkIndex: false });
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => e.includes("non-existent backlog item 'p-234567nonx'")));
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('checkPortfolio enforces in-flight backlog item must have citing discussion or plan', () => {
  const repo = makeTmpDir();
  try {
    const plansDir = path.join(repo, 'plans');
    const backlogDir = path.join(plansDir, 'backlog');
    fs.mkdirSync(backlogDir, { recursive: true });

    const itemText = formatBacklogItem({
      id: 'p-rw5iadsp2p',
      title: 'Uncited In-flight Item',
      status: 'in-flight',
      priority: 'P1',
      area: 'portfolio',
      why: 'Why',
      doneWhen: 'Done',
      notes: 'Notes',
    });
    fs.writeFileSync(path.join(backlogDir, 'p-rw5iadsp2p-item.md'), itemText);

    const report = checkPortfolio({ repoRoot: repo, checkIndex: false });
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => e.includes("in-flight-uncited: backlog item 'p-rw5iadsp2p'")));
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('checkPortfolio enforces new discussion or plan must cite at least one backlog item', () => {
  const repo = makeTmpDir();
  try {
    const plansDir = path.join(repo, 'plans');
    const discDir = path.join(plansDir, 'discussions', 'ds-234567abcd-disc');
    fs.mkdirSync(discDir, { recursive: true });

    const discText = formatDiscussion({
      id: 'ds-234567abcd',
      title: 'Discussion Title',
      status: 'open',
      source: [],
    });
    fs.writeFileSync(path.join(discDir, 'DISCUSSION.md'), discText);

    // With strict = true (all new)
    const reportStrict = checkPortfolio({ repoRoot: repo, strict: true, checkIndex: false });
    assert.equal(reportStrict.ok, false);
    assert.ok(reportStrict.errors.some((e) => e.includes('missing-backlog-source')));

    // Without strict and isNewFile returning false -> warning only
    const reportWarn = checkPortfolio({ repoRoot: repo, strict: false, checkIndex: false });
    assert.equal(reportWarn.ok, true);
    assert.ok(reportWarn.warnings.some((w) => w.includes('missing-backlog-source')));
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('checkPortfolio detects drift between item status and plan status', () => {
  const repo = makeTmpDir();
  try {
    const plansDir = path.join(repo, 'plans');
    const backlogDir = path.join(plansDir, 'backlog');
    const planDir = path.join(plansDir, '261120-0625-plan');
    fs.mkdirSync(backlogDir, { recursive: true });
    fs.mkdirSync(planDir, { recursive: true });

    // Item done but plan running
    const doneItem = formatBacklogItem({
      id: 'p-rw5iadsp2p',
      title: 'Done Item',
      status: 'done',
      priority: 'P1',
      area: 'portfolio',
      why: 'Why',
      doneWhen: 'Done',
      notes: 'Notes',
    });
    fs.writeFileSync(path.join(backlogDir, 'p-rw5iadsp2p-item.md'), doneItem);

    const planText = `---
contract: plan-v1
title: Running Plan
status: running
source:
  - p-rw5iadsp2p
---
`;
    fs.writeFileSync(path.join(planDir, 'plan.md'), planText);

    const reportDrift1 = checkPortfolio({ repoRoot: repo, checkIndex: false });
    assert.equal(reportDrift1.ok, false);
    assert.ok(reportDrift1.errors.some((e) => e.includes('drift-done-item-plan-running')));

    // Item in-flight with all citing plans ended and no active discussion
    const inFlightItem = formatBacklogItem({
      id: 'p-rw5iadsp2p',
      title: 'In Flight Item',
      status: 'in-flight',
      priority: 'P1',
      area: 'portfolio',
      why: 'Why',
      doneWhen: 'Done',
      notes: 'Notes',
    });
    fs.writeFileSync(path.join(backlogDir, 'p-rw5iadsp2p-item.md'), inFlightItem);

    const donePlanText = `---
contract: plan-v1
title: Done Plan
status: done
source:
  - p-rw5iadsp2p
---
`;
    fs.writeFileSync(path.join(planDir, 'plan.md'), donePlanText);

    const reportDrift2 = checkPortfolio({ repoRoot: repo, checkIndex: false });
    assert.equal(reportDrift2.ok, false);
    assert.ok(reportDrift2.errors.some((e) => e.includes('drift-in-flight-plans-ended')));
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('checkPortfolio flags index drift or missing index', () => {
  const repo = makeTmpDir();
  try {
    const plansDir = path.join(repo, 'plans');
    const backlogDir = path.join(plansDir, 'backlog');
    fs.mkdirSync(backlogDir, { recursive: true });

    const itemText = formatBacklogItem({
      id: 'p-rw5iadsp2p',
      title: 'Item',
      status: 'proposed',
      priority: 'P1',
      area: 'portfolio',
      why: 'Why',
      doneWhen: 'Done',
      notes: 'Notes',
    });
    fs.writeFileSync(path.join(backlogDir, 'p-rw5iadsp2p-item.md'), itemText);

    // Missing index
    const reportMissing = checkPortfolio({ repoRoot: repo, checkIndex: true });
    assert.equal(reportMissing.ok, false);
    assert.ok(reportMissing.errors.some((e) => e.includes('index-missing')));

    // Stale/outdated index
    fs.writeFileSync(path.join(plansDir, 'backlog.md'), '# Outdated backlog index\n');
    const reportDrift = checkPortfolio({ repoRoot: repo, checkIndex: true });
    assert.equal(reportDrift.ok, false);
    assert.ok(reportDrift.errors.some((e) => e.includes('index-drift')));
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});
