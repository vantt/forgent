// One wiring proof of the Node YAML door over the addon's `yaml` namespace. What YAML text means (the `tool`
// profile, every refusal rule, the alias and size bounds) is owned by the fgos-yaml-doc golden fixtures, one
// runner in packages/yaml-doc/rust/tests/golden_parse.rs over packages/yaml-doc/contracts/fixtures/parse.v1.json.
// The cases of the earlier Node test now live there as: plain-values, plain-scalar-root, integer-root,
// syntax-error-position, null-*, multi-doc-*, dup-key-*, core-*, merge-key-*, tag-*, alias-*, flat-*, proto-keys-*,
// indent-nested, blockscalar-blank-*, anchored-keys. The vendored-parser hash test left with the vendored file.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { YamlParseError, describeYamlError, parseYaml } from '../../src/util/yaml.mjs';

const door = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/util/yaml.mjs')).href;

test('a document reaches JavaScript as plain values, own __proto__ keys and restored non-finite floats', () => {
  assert.deepEqual(parseYaml('a: 1\nb: [x, .nan]\nc:\n  - d: true\n  - null\n'), { a: 1, b: ['x', NaN], c: [{ d: true }, null] });
  assert.equal(parseYaml('-.inf'), -Infinity);
  assert.equal(parseYaml('# nothing but a comment\n'), null);
  const doc = parseYaml('__proto__: {polluted: yes}\nok: .inf\n');
  assert.equal(Object.getPrototypeOf(doc), Object.prototype);
  assert.deepEqual(Object.keys(doc), ['__proto__', 'ok']);
  assert.equal(Object.getOwnPropertyDescriptor(doc, '__proto__').value.polluted, 'yes');
  assert.equal(doc.ok, Infinity);
  assert.equal({}.polluted, undefined);
});

test('a refusal names the rule, the file, the line and the column and never echoes the input', () => {
  assert.throws(
    () => parseYaml('a: [SECRET-7731,\nb: }', { filename: 'broken.yaml' }),
    (err) => {
      assert.ok(err instanceof YamlParseError);
      assert.deepEqual([err.code, err.file, err.line], ['syntax-error', 'broken.yaml', 2]);
      assert.match(err.message, /^broken\.yaml: syntax-error \(line 2, column \d+\)$/);
      assert.match(describeYamlError(err), /^syntax error \(line 2, column \d+\)$/);
      assert.doesNotMatch(err.message, /SECRET/);
      return true;
    },
  );
  assert.throws(() => parseYaml('a: 1\n---\nb: 2\n'), /^YamlParseError: YAML input: multiple-documents/);
});

test('adversarial input is a named refusal and the process keeps running', () => {
  assert.throws(() => parseYaml(`${'['.repeat(200_000)}`), (err) => err instanceof YamlParseError && /^(depth-exceeded|node-limit)$/.test(err.rule));
  const bomb = ['l0: &l0 [x, x, x, x, x, x, x, x, x]'];
  for (let i = 1; i < 9; i++) bomb.push(`l${i}: &l${i} [${Array(9).fill(`*l${i - 1}`).join(', ')}]`);
  assert.throws(() => parseYaml(`${bomb.join('\n')}\n`), (err) => err instanceof YamlParseError && /^(alias-limit|expanded-too-large|node-limit)$/.test(err.rule));
  assert.deepEqual(parseYaml('still: alive'), { still: 'alive' });
});

test('a process that cannot load the addon fails every read with the door error and never falls back', () => {
  const { FGOS_HOST_BIN: _host, FGOS_ACTIVE_MANIFEST_PATH: _manifest, FGOS_ACTIVE_RELEASE_PATH: _release, ...env } = process.env;
  const probe = `import(${JSON.stringify(door)}).then(({ parseYaml }) => { try { parseYaml('a: 1'); console.log('parsed'); } catch (e) { console.log(e.code); } });`;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { cwd: os.tmpdir(), env, encoding: 'utf8', timeout: 20_000 });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout.trim(), 'git-addon-not-shipped');
});
