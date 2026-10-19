import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseYaml } from '../../src/util/yaml.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('mappings, sequences and scalars parse to plain values', () => {
  assert.deepEqual(parseYaml('a: 1\nb: [x, y]\nc:\n  - d: true\n  - null\ne: 1.5\nf: "q"\n'), {
    a: 1,
    b: ['x', 'y'],
    c: [{ d: true }, null],
    e: 1.5,
    f: 'q',
  });
  assert.equal(parseYaml('plain text'), 'plain text');
  assert.equal(parseYaml('42'), 42);
});

test('malformed input throws an error naming the file, the line and the column', () => {
  assert.throws(
    () => parseYaml('a: [1,\nb: }', { filename: 'broken.yaml' }),
    (err) => {
      assert.match(err.message, /broken\.yaml/);
      assert.match(err.message, /\(2:1\)/);
      assert.equal(err.mark.line, 1);
      assert.equal(err.mark.column, 0);
      return true;
    },
  );
  assert.throws(() => parseYaml('a: [1,\nb: }'), /\(2:1\)/);
});

test('empty, whitespace-only and comment-only input return null, as do a bare document marker and ~', () => {
  for (const text of ['', '   \n\t\n', '# only a comment\n', '# one\n\n# two\n', '---\n', '--- # note\n', '~']) {
    assert.equal(parseYaml(text), null, JSON.stringify(text));
  }
});

test('more than one document throws, naming the file and the count', () => {
  assert.throws(() => parseYaml('a: 1\n---\nb: 2\n', { filename: 'multi.yaml' }), /multi\.yaml: expected a single document, found 2/);
  assert.throws(() => parseYaml('a: 1\n---\nb: 2\n---\nc: 3\n'), /YAML input: expected a single document, found 3/);
});

test('a duplicate key throws', () => {
  assert.throws(() => parseYaml('a: 1\na: 2\n'), /duplicated mapping key/);
});

test('core schema: yes/no/on/off and an unquoted ISO date stay strings, << is an ordinary key', () => {
  assert.deepEqual(parseYaml('a: yes\nb: no\nc: on\nd: off\ne: true\nf: false\n'), {
    a: 'yes',
    b: 'no',
    c: 'on',
    d: 'off',
    e: true,
    f: false,
  });
  const dates = parseYaml('day: 2026-10-16\nstamp: 2026-10-16T01:02:03Z\n');
  assert.equal(dates.day, '2026-10-16');
  assert.equal(dates.stamp, '2026-10-16T01:02:03Z');
  const merged = parseYaml('base: &b {x: 1}\nd:\n  <<: *b\n  y: 2\n');
  assert.equal(Object.hasOwn(merged.d, '<<'), true);
  assert.deepEqual(merged.d['<<'], { x: 1 });
  assert.equal(merged.d.x, undefined);
  assert.equal(merged.d.y, 2);
});

test('an unknown tag throws, including !!binary', () => {
  assert.throws(() => parseYaml('a: !!binary aGk='), /unknown scalar tag/);
  assert.throws(() => parseYaml('a: !foo bar'), /unknown scalar tag/);
});

test('an alias bomb throws once aliases pass the limit, flat or nested', () => {
  const flat = `base: &a [x]\nlist: [*a${', *a'.repeat(120)}]\n`;
  assert.throws(() => parseYaml(flat), /aliases exceeded maxAliases \(100\)/);

  const names = 'abcdefghijklmnop'.split('');
  const lines = ['a: &a [x, x, x, x, x, x, x, x, x, x]'];
  for (let i = 1; i < names.length; i++) {
    const prev = names[i - 1];
    lines.push(`${names[i]}: &${names[i]} [${Array(10).fill(`*${prev}`).join(', ')}]`);
  }
  assert.throws(() => parseYaml(`${lines.join('\n')}\n`), /aliases exceeded maxAliases/);
});

test('aliases within the limit still resolve', () => {
  const doc = parseYaml('base: &a [x]\nlist: [*a, *a, *a]\n');
  assert.deepEqual(doc.list, [['x'], ['x'], ['x']]);
});

test('a self-referencing map is refused as an endless expansion and does not hang', () => {
  assert.throws(() => parseYaml('a: &a {b: *a}', { filename: 'loop.yaml' }), /loop\.yaml: aliases expand to more than 100000 values/);
  assert.throws(() => parseYaml('&a [*a]'), /aliases expand to more than/);
});

test('nested aliases under the alias limit still throw when they expand past the value budget', () => {
  const lines = ['l0: &l0 [x, x, x, x, x, x, x, x, x]'];
  for (let i = 1; i <= 9; i++) lines.push(`l${i}: &l${i} [${Array(9).fill(`*l${i - 1}`).join(', ')}]`);
  const bomb = `${lines.join('\n')}\n`;
  assert.ok((bomb.match(/\*l/g) ?? []).length < 100, 'the alias count stays under the alias limit');
  const started = Date.now();
  assert.throws(() => parseYaml(bomb, { filename: 'bomb.yaml' }), /bomb\.yaml: aliases expand to more than 100000 values/);
  assert.ok(Date.now() - started < 2000, 'refused quickly');
});

test('a large flat document under the value budget parses', () => {
  const items = Array.from({ length: 10000 }, (_, i) => `  - id: ${i}\n    tags: [a, b]`).join('\n');
  const doc = parseYaml(`items:\n${items}\n`);
  assert.equal(doc.items.length, 10000);
});

test('__proto__ and constructor.prototype keys become own keys and never reach Object.prototype', () => {
  const doc = parseYaml('__proto__: {polluted: 1}\nnested:\n  __proto__: {deep: 2}\nconstructor:\n  prototype: {viaCtor: 3}\n');
  assert.equal(Object.hasOwn(doc, '__proto__'), true);
  assert.equal(Object.getPrototypeOf(doc), Object.prototype);
  assert.deepEqual(doc.nested && Object.getOwnPropertyDescriptor(doc.nested, '__proto__').value, { deep: 2 });
  assert.equal(Object.getPrototypeOf(doc.nested), Object.prototype);
  assert.equal(Object.hasOwn(doc.constructor, 'prototype'), true);
  assert.deepEqual(Object.getOwnPropertyDescriptor(doc, '__proto__').value, { polluted: 1 });
  for (const key of ['polluted', 'deep', 'viaCtor']) {
    assert.equal(Object.hasOwn(Object.prototype, key), false, key);
    assert.equal({}[key], undefined, key);
  }
  assert.equal(Object.prototype.polluted, undefined);
});

test('indented block mappings and whitespace-only block scalars parse as the YAML spec intends', () => {
  assert.deepEqual(parseYaml('a:\n  b:\n    c: 1\n  d: 2\n'), { a: { b: { c: 1 }, d: 2 } });
  // A block scalar whose only content is blank lines more indented than what follows is empty.
  assert.deepEqual(parseYaml('top:\n  k: |\n        \nnext: 1\n'), { top: { k: '' }, next: 1 });
  assert.deepEqual(parseYaml('top:\n  k: >\n        \nnext: 1\n'), { top: { k: '' }, next: 1 });
  assert.deepEqual(parseYaml('a:\n  b: |\n      \n  c: 1\n'), { a: { b: '', c: 1 } });
  // Anchored and tagged keys keep reading as one block mapping.
  assert.deepEqual(parseYaml('&k1 a: 1\n&k2 b: 2\n'), { a: 1, b: 2 });
});

test('the vendored js-yaml file is byte-identical to the release it names', () => {
  const file = fs.readFileSync(path.join(repoRoot, 'src/util/third-party/js-yaml.mjs'));
  const marker = Buffer.from('// ---- end of fgOS header; everything below is the upstream bundle ----\n');
  const at = file.indexOf(marker);
  assert.notEqual(at, -1, 'the header marker line is missing');
  const bundle = file.subarray(at + marker.length);
  const sha256 = crypto.createHash('sha256').update(bundle).digest('hex');
  assert.equal(
    sha256,
    '4b208996e4d5bb3a48dc15eee95806173f23062d7ac19d21f25240dfb0501c3a',
    'src/util/third-party/js-yaml.mjs changed; replace the whole file by a new upstream release and update this hash',
  );
  assert.match(file.subarray(0, at).toString('utf8'), /js-yaml 5\.4\.3/);
});
