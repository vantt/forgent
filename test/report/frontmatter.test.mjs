import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, renderFrontmatter } from '../../src/report/frontmatter.mjs';

// parseFrontmatter/renderFrontmatter are pure string transforms (per this
// cell's must_haves: no fs, no side effects) — every test below hand-builds
// its own doc string, never reads a real file.

test('parseFrontmatter on a doc with a --- block returns the parsed meta and the body with the block stripped', () => {
  const content = [
    '---',
    'type: explanation',
    'title: Why the system is shaped this way',
    'tags: [gate-bypass, escalation]',
    'timestamp: 2026-07-22T00:00:00.000Z',
    'source_capture_ids: [abc123]',
    '---',
    '',
    '# Why the system is shaped this way',
    '',
    'Body text.',
    '',
  ].join('\n');

  const { meta, body } = parseFrontmatter(content);
  assert.deepEqual(meta, {
    type: 'explanation',
    title: 'Why the system is shaped this way',
    tags: ['gate-bypass', 'escalation'],
    timestamp: '2026-07-22T00:00:00.000Z',
    source_capture_ids: ['abc123'],
  });
  assert.equal(body, '\n# Why the system is shaped this way\n\nBody text.\n');
});

test('parseFrontmatter on a doc with no frontmatter returns {meta: {}, body: original content unchanged}', () => {
  const content = '# How to check a rollup\n\nUse this when...\n';
  const { meta, body } = parseFrontmatter(content);
  assert.deepEqual(meta, {});
  assert.equal(body, content);
});

test('parseFrontmatter never throws on malformed or missing-close-delimiter input', () => {
  assert.doesNotThrow(() => parseFrontmatter('---\ntype: explanation\n(no closing delimiter)\n'));
  assert.doesNotThrow(() => parseFrontmatter(''));
  const { meta, body } = parseFrontmatter('---\ntype: explanation\n(no closing delimiter)\n');
  assert.deepEqual(meta, {});
  assert.equal(body, '---\ntype: explanation\n(no closing delimiter)\n');
});

test('parseFrontmatter handles an empty array value (source_capture_ids: [])', () => {
  const content = '---\nsource_capture_ids: []\n---\nbody\n';
  const { meta } = parseFrontmatter(content);
  assert.deepEqual(meta.source_capture_ids, []);
});

test('renderFrontmatter(meta, body) followed by parseFrontmatter round-trips type/title/tags/timestamp/source_capture_ids exactly', () => {
  const meta = {
    type: 'explanation',
    title: 'Gate bypass semantics',
    tags: ['bee-process', 'gate-bypass'],
    timestamp: '2026-07-22T11:00:00.000Z',
    source_capture_ids: [],
  };
  const body = '\n# Gate bypass semantics\n\nDistilled content.\n';

  const rendered = renderFrontmatter(meta, body);
  const parsed = parseFrontmatter(rendered);

  assert.deepEqual(parsed.meta, meta);
  assert.equal(parsed.body, body);
});

test('renderFrontmatter round-trips a non-empty source_capture_ids array', () => {
  const meta = {
    type: 'how-to',
    title: 'Check rollup progress',
    tags: [],
    timestamp: '2026-07-14T00:00:00.000Z',
    source_capture_ids: ['cap-1', 'cap-2'],
  };
  const body = '\n# Check rollup progress\n';

  const parsed = parseFrontmatter(renderFrontmatter(meta, body));
  assert.deepEqual(parsed.meta, meta);
  assert.equal(parsed.body, body);
});

test('parseFrontmatter parses a real ADR-shaped doc (title/date/status/array field) without crashing', () => {
  const content = [
    '---',
    'title: Nhat ky su kien la su that',
    'date: 2026-07-13',
    'status: accepted',
    'source_decisions: [ae461c8b, 451ca088]',
    '---',
    '',
    '# 0001 — Nhat ky su kien la su that',
    '',
  ].join('\n');

  const { meta, body } = parseFrontmatter(content);
  assert.equal(meta.title, 'Nhat ky su kien la su that');
  assert.equal(meta.date, '2026-07-13');
  assert.equal(meta.status, 'accepted');
  assert.deepEqual(meta.source_decisions, ['ae461c8b', '451ca088']);
  assert.ok(body.startsWith('\n# 0001'));
});

test('parseFrontmatter parses a real H1-only doc (no frontmatter, e.g. 0010-style ADR) without crashing', () => {
  const content = '# 0010 — Ban do kien truc la ban chuan\n\n**Ngay:** 2026-07-16\n';
  const { meta, body } = parseFrontmatter(content);
  assert.deepEqual(meta, {});
  assert.equal(body, content);
});
