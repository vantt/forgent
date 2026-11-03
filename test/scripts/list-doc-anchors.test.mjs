import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listAnchors, anchorExists, githubSlug, runCli } from '../../scripts/list-doc-anchors.mjs';

const DOC = ['# Title', '', '## 4. Exit Codes', '', 'A paragraph that is long enough to be a unit.', '', '## Install/setup & gate', '', 'Another paragraph that is long enough to be a unit.'].join('\n');

test('lists heading and block anchors with the numbering prefix kept', () => {
  const anchors = listAnchors(DOC);
  assert.ok(anchors.some((a) => a.anchor === '4-exit-codes' && a.kind === 'heading'));
  assert.ok(anchors.some((a) => a.anchor === 'unheaded-block-1'));
  assert.equal(anchorExists(DOC, 'exit-codes'), false);
  assert.equal(anchorExists(DOC, '4-exit-codes'), true);
});

test('accepts GitHub spelling of a heading with punctuation', () => {
  assert.equal(githubSlug('Install/setup & gate'), 'installsetup--gate');
  assert.equal(anchorExists(DOC, 'installsetup--gate'), true);
});

test('the CLI prints anchors and checks one citation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchors-'));
  const logs = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => logs.push(a.join(' '));
  try {
    fs.writeFileSync(path.join(dir, 'doc.md'), DOC);
    assert.equal(runCli(['doc.md'], dir), 0);
    assert.ok(logs.some((l) => l.startsWith('4-exit-codes\theading')));
    assert.equal(runCli(['--check', 'doc.md#4-exit-codes'], dir), 0);
    assert.equal(runCli(['--check', 'doc.md#exit-codes'], dir), 1);
    assert.equal(runCli(['--check', 'doc.md'], dir), 1);
    assert.equal(runCli(['--check', 'missing.md#x'], dir), 1);
  } finally {
    console.log = log;
    console.error = err;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
