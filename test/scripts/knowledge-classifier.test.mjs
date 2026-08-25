import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { classifyDocFile, classifyCorpus, sanitizeRole } from '../../scripts/knowledge-classifier.mjs';

test('knowledge-classifier - sanitizeRole respects Rule Q4', () => {
  assert.equal(sanitizeRole('reference'), 'lookup-table');
  assert.equal(sanitizeRole('how-to'), 'recipe');
  assert.equal(sanitizeRole('explanation'), 'concept');
  assert.equal(sanitizeRole('tutorial'), 'walkthrough');
  assert.equal(sanitizeRole('troubleshooting'), 'troubleshooting');
});

test('knowledge-classifier - authoritative_for priority', () => {
  const content = `---
authoritative_for: worktree reclaim
---
# Random Heading
`;
  const res = classifyDocFile('docs/how-to/reclaim.md', content);
  assert.equal(res.purposeSlug, 'worktree-reclaim');
  assert.equal(res.confidence, 'high');
  assert.ok(res.evidence.includes('authoritative_for'));
});

test('knowledge-classifier - classifyCorpus on mock fixture', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-classifier-test-'));
  try {
    const docsDir = path.join(tmpDir, 'docs');
    const howToDir = path.join(docsDir, 'how-to');
    fs.mkdirSync(howToDir, { recursive: true });

    const f1 = path.join(howToDir, 'task-one.md');
    const f1Content = '# Task One Guide\n\nSome text';
    fs.writeFileSync(f1, f1Content, 'utf8');

    const f2 = path.join(howToDir, 'reference.md');
    const f2Content = '---\nauthoritative_for: system config\n---\n# System Config';
    fs.writeFileSync(f2, f2Content, 'utf8');

    const results = classifyCorpus(docsDir);
    assert.equal(results.length, 2);

    for (const r of results) {
      assert.ok(r.confidence);
      assert.ok(r.evidence);
      assert.notEqual(r.role, 'reference');
      assert.notEqual(r.role, 'how-to');
    }

    // Verify read-only: files are untouched
    assert.equal(fs.readFileSync(f1, 'utf8'), f1Content);
    assert.equal(fs.readFileSync(f2, 'utf8'), f2Content);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
