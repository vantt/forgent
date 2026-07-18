import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  selectTemplate,
  loadTemplate,
  renderTemplate,
  hashTemplate,
  TEMPLATE_DIR,
} from '../../src/runner/prompt-templates.mjs';

// --- selectTemplate: mechanical table lookup, no LLM ---------------------

test('selectTemplate resolves to the default template for any kind/tier/domain combination (mechanical wildcard, no differentiated template today)', () => {
  assert.equal(selectTemplate({ kind: 'behavior_change', tier: 'light', domain: 'coding' }), 'worker-prompt-default.txt');
  assert.equal(selectTemplate({ kind: 'bug', tier: 'heavy', domain: 'coding' }), 'worker-prompt-default.txt');
  assert.equal(selectTemplate({ kind: 'chore', tier: 'standard', domain: undefined }), 'worker-prompt-default.txt');
});

test('selectTemplate resolves even with no arguments at all (wildcard rule always matches)', () => {
  assert.equal(selectTemplate(), 'worker-prompt-default.txt');
  assert.equal(selectTemplate({}), 'worker-prompt-default.txt');
});

// --- loadTemplate / renderTemplate: golden-file render --------------------

test('loadTemplate reads worker-prompt-default.txt from TEMPLATE_DIR and it contains the six named placeholders', () => {
  const raw = loadTemplate('worker-prompt-default.txt');
  for (const placeholder of ['{title}', '{kind}', '{description}', '{feedbackSection}', '{refs}', '{verify}']) {
    assert.ok(raw.includes(placeholder), `expected template to include ${placeholder}`);
  }
  assert.ok(TEMPLATE_DIR.endsWith('prompt-templates'));
});

test('renderTemplate(worker-prompt-default.txt, ...) golden output — no-feedback shape, byte-for-byte', () => {
  const rendered = renderTemplate('worker-prompt-default.txt', {
    title: 'Add the widget',
    kind: 'behavior_change',
    description: '(không có)',
    feedbackSection: '',
    refs: 'src/widget.mjs, docs/specs/widget.md',
    verify: 'npm test',
  });

  const golden = `# Goal
Add the widget (kind: behavior_change)

# Description
(không có)

# Worktree boundary
You are running on an isolated git worktree, checked out on its own branch for
this work item only. Stay inside this checkout — never touch the main
working tree, another branch, or another worktree. Relevant refs: src/widget.mjs, docs/specs/widget.md.

# Expected proof
Your work is judged only by this verify command, which the runner runs
itself after you finish (your own report is never trusted on its own):
npm test

# Constraints
Never call \`fgos\` yourself and never write to \`.fgos/\` directly — the
runner is the sole writer through that door during this dispatch. Commit
your changes on this branch and report; do not merge, push, or approve your
own work.

# Reporting discovered work (report, not write)
If — while doing this item — you discover a NEW unit of work that deserves its
own work item (a follow-up, a newly surfaced dependency, a separable concern),
you MAY surface it as DATA ONLY by emitting one fenced block per discovery in
your output:

\`\`\`fgos-discovered
{"title": "<one-line title>", "kind": "<optional>", "risk": "<optional>", "description": "<optional>"}
\`\`\`

\`title\` is required; \`kind\`/\`risk\`/\`description\` are optional. This is a
report, not a write — you still MUST NOT call \`fgos\` or touch \`.fgos/\`. The
runner reads these blocks after you finish and creates each item itself,
stamping it as discovered-from this item.
`;

  assert.equal(rendered, golden);
});

test('renderTemplate golden output — with-feedback shape includes the Human feedback section verbatim', () => {
  const feedbackSection = '\n# Human feedback\nHuman answer (binding decision):\nCHỐT (a): do X.\n\nLatest human rejection/park reason (fix THIS before anything else):\nMissing test Y.\n';
  const rendered = renderTemplate('worker-prompt-default.txt', {
    title: 'Add the widget',
    kind: 'behavior_change',
    description: '(không có)',
    feedbackSection,
    refs: '(none)',
    verify: 'npm test',
  });
  assert.match(rendered, /# Human feedback/);
  assert.match(rendered, /CHỐT \(a\): do X\./);
  assert.match(rendered, /Missing test Y\./);
  // section sits between Description and Worktree boundary, same as before
  assert.match(rendered, /\(không có\)\n\n# Human feedback[\s\S]*\n\n# Worktree boundary/);
});

// --- hashTemplate: stable content-identity hash ---------------------------

test('hashTemplate returns a stable 64-hex-char sha256 digest for the same template across repeated calls', () => {
  const first = hashTemplate('worker-prompt-default.txt');
  const second = hashTemplate('worker-prompt-default.txt');
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
});
