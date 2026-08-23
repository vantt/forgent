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

test('selectTemplate resolves a coding-domain input to the skill-pointer template, for any kind/tier (mechanical table lookup, keyed on domain)', () => {
  assert.equal(selectTemplate({ kind: 'feature', tier: 'light', domain: 'coding' }), 'worker-prompt-skill-pointer.txt');
  assert.equal(selectTemplate({ kind: 'bug', tier: 'heavy', domain: 'coding' }), 'worker-prompt-skill-pointer.txt');
  assert.equal(selectTemplate({ kind: 'chore', tier: 'standard', domain: undefined }), 'worker-prompt-skill-pointer.txt');
});

test('selectTemplate resolves even with no arguments at all — an absent domain folds to "coding", which resolves to the skill-pointer template', () => {
  assert.equal(selectTemplate(), 'worker-prompt-skill-pointer.txt');
  assert.equal(selectTemplate({}), 'worker-prompt-skill-pointer.txt');
});

test('selectTemplate folds an unrecognized domain string to "coding" too (same fold as undefined, not a fall-back to the old default)', () => {
  assert.equal(selectTemplate({ domain: 'made-up-domain' }), 'worker-prompt-skill-pointer.txt');
});

test('selectTemplate still resolves a real registered non-coding domain ("synthetic") to the default template — the wildcard fallback survives for domains that exist but are not "coding"', () => {
  assert.equal(selectTemplate({ kind: 'feature', tier: 'light', domain: 'synthetic' }), 'worker-prompt-default.txt');
});

// --- tsk-5mj D1/D6/D7: stage-aware selection (discovery dispatch) --------

test('selectTemplate resolves a coding-domain, stage:"discovery" input to the discovery template instead of the skill-pointer one', () => {
  assert.equal(selectTemplate({ kind: 'feature', tier: 'standard', domain: 'coding', stage: 'discovery' }), 'worker-prompt-discovery.txt');
});

test('selectTemplate omitting stage entirely (every pre-tsk-5mj call site) still resolves to the skill-pointer template, byte-identical to before', () => {
  assert.equal(selectTemplate({ kind: 'feature', tier: 'standard', domain: 'coding' }), 'worker-prompt-skill-pointer.txt');
});

test('selectTemplate with stage:"discovery" on a non-coding domain still falls through to that domain\'s own rule (stage only narrows the coding rule)', () => {
  assert.equal(selectTemplate({ kind: 'feature', tier: 'standard', domain: 'synthetic', stage: 'discovery' }), 'worker-prompt-default.txt');
});

// --- loadTemplate / renderTemplate: golden-file render --------------------

test('loadTemplate reads worker-prompt-default.txt from TEMPLATE_DIR and it contains the eight named placeholders', () => {
  const raw = loadTemplate('worker-prompt-default.txt');
  for (const placeholder of [
    '{title}',
    '{kind}',
    '{description}',
    '{feedbackSection}',
    '{action}',
    '{readFirst}',
    '{refs}',
    '{verify}',
  ]) {
    assert.ok(raw.includes(placeholder), `expected template to include ${placeholder}`);
  }
  assert.ok(TEMPLATE_DIR.endsWith('prompt-templates'));
});

test('renderTemplate(worker-prompt-default.txt, ...) golden output — no-feedback shape, byte-for-byte', () => {
  const rendered = renderTemplate('worker-prompt-default.txt', {
    title: 'Add the widget',
    kind: 'feature',
    description: '(không có)',
    feedbackSection: '',
    action: '(không có)',
    readFirst: '(không có)',
    refs: 'src/widget.mjs, docs/specs/widget.md',
    verify: 'npm test',
  });

  const golden = `# Goal
Add the widget (kind: feature)

# Description
(không có)

# Directive
(không có)

# Files to read first
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

\`title\` is required; \`kind\`/\`risk\`/\`description\` are optional — pick \`kind\`/\`risk\` from the domain's own declared vocabulary (\`classificationVocabulary(domain, field)\`, \`src/state/workflow-stage-graphs.mjs\`), never invent a value outside either list, and omit a field entirely rather than guess when the evidence does not support a judgment for it. This is a report, not a write — you still MUST NOT call \`fgos\` or touch \`.fgos/\`. The runner reads these blocks after you finish and creates each item itself, stamping it as discovered-from this item.
`;

  assert.equal(rendered, golden);
});

test('renderTemplate golden output — with-feedback shape includes the Human feedback section verbatim', () => {
  const feedbackSection = '\n# Human feedback\nHuman answer (binding decision):\nCHỐT (a): do X.\n\nLatest human rejection/park reason (fix THIS before anything else):\nMissing test Y.\n';
  const rendered = renderTemplate('worker-prompt-default.txt', {
    title: 'Add the widget',
    kind: 'feature',
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

test('renderTemplate(worker-prompt-skill-pointer.txt, ...) golden output — no-feedback shape, byte-for-byte', () => {
  const rendered = renderTemplate('worker-prompt-skill-pointer.txt', {
    title: 'Add the widget',
    kind: 'feature',
    description: '(không có)',
    feedbackSection: '',
    action: '(không có)',
    readFirst: '(không có)',
    refs: 'src/widget.mjs, docs/specs/widget.md',
    verify: 'npm test',
    domain: 'coding',
    skillPath: '.claude/skills/fgos-code-implement/SKILL.md',
  });

  const golden = `# Goal
Add the widget (kind: feature)

# Agent skill
You are a fgOS agent for domain coding at the executing stage. Before doing
anything else, read .claude/skills/fgos-code-implement/SKILL.md in your own checkout — it is the same skill
an interactive fgOS session loads for this exact domain and stage, and it
governs how this work item must be done.

# Description
(không có)

# Directive
(không có)

# Files to read first
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

\`title\` is required; \`kind\`/\`risk\`/\`description\` are optional — pick \`kind\`/\`risk\` from the domain's own declared vocabulary (\`classificationVocabulary(domain, field)\`, \`src/state/workflow-stage-graphs.mjs\`), never invent a value outside either list, and omit a field entirely rather than guess when the evidence does not support a judgment for it. This is a report, not a write — you still MUST NOT call \`fgos\` or touch \`.fgos/\`. The runner reads these blocks after you finish and creates each item itself, stamping it as discovered-from this item.
`;

  assert.equal(rendered, golden);
});

// --- hashTemplate: stable content-identity hash ---------------------------

test('hashTemplate returns a stable 64-hex-char sha256 digest for the same template across repeated calls', () => {
  const first = hashTemplate('worker-prompt-default.txt');
  const second = hashTemplate('worker-prompt-default.txt');
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
});
