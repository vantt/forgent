// The runner schema (core/config-schema/runner.schema.yaml) states the vocabularies that the runner's code also
// holds: rigors and the run timeout ceiling. The config door refuses by the schema's lists, so each one must
// equal the code's list; this is the one place that proves they do.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { parseYaml } from '../../src/util/yaml.mjs';
import { RIGOR_VALUES } from '../../src/runner/rigor.mjs';
import { RUN_TIMEOUT_MAX_MS } from '../../src/runner/dispatch/run-timeout.mjs';

const schemaFile = path.resolve(import.meta.dirname, '../../core/config-schema/runner.schema.yaml');
const schema = JSON.parse(JSON.stringify(parseYaml(fs.readFileSync(schemaFile, 'utf8'), { filename: schemaFile })));
const defs = schema.$defs;

test('the schema lists the rigors the code holds', () => {
  assert.deepEqual(defs.capability.properties.rigor.enum, [...RIGOR_VALUES]);
  assert.deepEqual(Object.keys(schema.properties.loops.properties.reviewed.properties.checkersByRigor.properties), [...RIGOR_VALUES]);
});

test('the schema takes the run timeout ceiling and the loop parameter names from the code', () => {
  assert.equal(schema.properties.timeoutMs.maximum, RUN_TIMEOUT_MAX_MS);
});
