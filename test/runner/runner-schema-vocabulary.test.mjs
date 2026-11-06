// The runner schema (core/config-schema/runner.schema.yaml) states the vocabularies that the runner's code also
// holds: adapter names, checker seats, loops, rigors, tiers, efforts, seat roles, content classes, the run
// timeout ceiling and the loop parameter names. The config door refuses by the schema's lists, so each one must
// equal the code's list; this is the one place that proves they do.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { parseYaml } from '../../src/util/yaml.mjs';
import { EXECUTOR_ADAPTER_NAMES } from '../../src/runner/dispatch/adapters.mjs';
import { CHECKER_SEATS, SEAT_ROLES, LOOP_NAMES } from '../../src/runner/execution/seat-resolver.mjs';
import { paramTableOf } from '../../src/runner/execution/loops/index.mjs';
import { RIGOR_VALUES } from '../../src/runner/rigor.mjs';
import { RUN_TIMEOUT_MAX_MS } from '../../src/runner/dispatch/run-timeout.mjs';
import { MODEL_POLICY_TIERS, EXECUTOR_CARRIES, REASONING_EFFORT_VALUES } from '../../src/runner/dispatch/config.mjs';

const schemaFile = path.resolve(import.meta.dirname, '../../core/config-schema/runner.schema.yaml');
const schema = JSON.parse(JSON.stringify(parseYaml(fs.readFileSync(schemaFile, 'utf8'), { filename: schemaFile })));
const defs = schema.$defs;
const sorted = (list) => [...list].sort();

test('the schema lists the adapters, loops, rigors, tiers, efforts, seat roles and content classes the code holds', () => {
  assert.deepEqual(defs.adapterName.enum, [...EXECUTOR_ADAPTER_NAMES]);
  assert.deepEqual(defs.patternEntry.properties.loop.enum, [...LOOP_NAMES]);
  assert.deepEqual(Object.keys(schema.properties.loops.properties), [...LOOP_NAMES]);
  assert.deepEqual(defs.capability.properties.rigor.enum, [...RIGOR_VALUES]);
  assert.deepEqual(Object.keys(schema.properties.loops.properties.reviewed.properties.checkersByRigor.properties), [...RIGOR_VALUES]);
  assert.deepEqual(defs.tierName.enum, [...MODEL_POLICY_TIERS]);
  assert.deepEqual(Object.keys(schema.properties.modelPolicies.additionalProperties.properties), [...MODEL_POLICY_TIERS]);
  assert.deepEqual(Object.keys(schema.properties.tierFallback.properties), [...MODEL_POLICY_TIERS]);
  assert.deepEqual(defs.tierEntry.properties.effort.enum, [...REASONING_EFFORT_VALUES]);
  assert.deepEqual(defs.executorEntry.properties.supports.properties.reasoningEffort.items.enum, [...REASONING_EFFORT_VALUES]);
  assert.deepEqual(defs.declaredSeat.properties.role.enum, [...SEAT_ROLES]);
  assert.deepEqual(Object.keys(defs.capability.properties.roles.properties), [...SEAT_ROLES]);
  assert.deepEqual(defs.executorEntry.properties.carries.enum, [...EXECUTOR_CARRIES]);
});

test('the schema lists the checker seats of the code at each place a checker is named', () => {
  const checkers = Object.keys(CHECKER_SEATS);
  assert.deepEqual(defs.capability.properties.minCheckers.items.enum, checkers);
  assert.deepEqual(defs.patternEntry.properties.defaults.properties.minCheckers.items.enum, checkers);
  assert.deepEqual(schema.properties.loops.properties.reviewed.properties.checkersByRigor.properties.low.items.enum, checkers);
});

test('the schema takes the run timeout ceiling and the loop parameter names from the code', () => {
  assert.equal(schema.properties.timeoutMs.maximum, RUN_TIMEOUT_MAX_MS);
  const loopParams = LOOP_NAMES.flatMap((name) => Object.keys(paramTableOf(name) ?? {}));
  assert.deepEqual(sorted(Object.keys(defs.patternEntry.properties.defaults.properties)), sorted(new Set(loopParams)));
});
