import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decodeLegacyFiles } from '../../src/event-store/index.mjs';
import { loaderOptions } from './phase07-fixture.mjs';
const vectors = JSON.parse(fs.readFileSync(new URL('../../packages/event-store/contracts/vectors/legacy-order.v1.json', import.meta.url)));
test('frozen legacy vectors equal the facade crate ordering', () => {
  const files = Object.fromEntries(vectors.files.map(({ file, lines }) => [file, lines.join('\n') + '\n']));
  assert.deepEqual(decodeLegacyFiles(files, loaderOptions).map(e => e.event), vectors.expected.map(e => e.event));
});
