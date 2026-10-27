import '../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { requestFromFlags, RunRequestError } from '../../../src/runner/execution/run-request.mjs';

test('requestFromFlags with neither flag returns empty scalars', () => {
  assert.deepEqual(requestFromFlags({}), { scalars: [] });
  assert.deepEqual(requestFromFlags(), { scalars: [] });
  assert.deepEqual(requestFromFlags({ params: undefined, param: undefined }), { scalars: [] });
});

test('requestFromFlags with only params returns parsed params and empty scalars', () => {
  const result = requestFromFlags({ params: '{"maxRounds": 3, "rebuttal": true}' });
  assert.deepEqual(result, {
    params: { maxRounds: 3, rebuttal: true },
    scalars: [],
  });
});

test('requestFromFlags with only param returns scalars with key and raw string', () => {
  const result = requestFromFlags({ param: 'maxRounds=2' });
  assert.deepEqual(result, {
    scalars: [{ key: 'maxRounds', raw: '2' }],
  });
  assert.equal(result.scalars[0].value, '2');
});

test('param splits on the first equals sign preserving later equals signs', () => {
  const result = requestFromFlags({ param: 'expr=a=b=c' });
  assert.deepEqual(result, {
    scalars: [{ key: 'expr', raw: 'a=b=c' }],
  });
});

test('scalars preserve raw string values without trimming or coercion', () => {
  const result = requestFromFlags({
    param: ['float=1.5', 'text=abc', 'spaced=  hello  '],
  });
  assert.deepEqual(result, {
    scalars: [
      { key: 'float', raw: '1.5' },
      { key: 'text', raw: 'abc' },
      { key: 'spaced', raw: '  hello  ' },
    ],
  });
});

test('empty param value is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: 'maxRounds=' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('missing equals sign in param is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: 'maxRounds' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('empty param key is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: '=2' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('bare param flag without value is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: true }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
  assert.throws(
    () => requestFromFlags({ param: [true] }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('non-string param value is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ param: 123 }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('params array is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ params: '[1, 2, 3]' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('params primitive JSON values are refused as param-invalid', () => {
  for (const input of ['"string"', '123', 'true', 'false', 'null']) {
    assert.throws(
      () => requestFromFlags({ params: input }),
      (err) => err instanceof RunRequestError && err.code === 'param-invalid',
      `expected refusal for ${input}`,
    );
  }
});

test('params non-string flag is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ params: true }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('params with invalid JSON syntax is refused as param-invalid', () => {
  assert.throws(
    () => requestFromFlags({ params: '{malformed' }),
    (err) => err instanceof RunRequestError && err.code === 'param-invalid',
  );
});

test('repeated key in param is refused as param-request-conflict', () => {
  assert.throws(
    () => requestFromFlags({ param: ['maxRounds=1', 'maxRounds=2'] }),
    (err) => err instanceof RunRequestError && err.code === 'param-request-conflict',
  );
});

test('same key in both params and param is refused as param-request-conflict', () => {
  assert.throws(
    () => requestFromFlags({ params: '{"maxRounds": 1}', param: 'maxRounds=2' }),
    (err) => err instanceof RunRequestError && err.code === 'param-request-conflict',
  );
});

test('distinct keys across params and param are accepted and combined', () => {
  const result = requestFromFlags({
    params: '{"reviewer": "human"}',
    param: ['maxRounds=2', 'rebuttal=false'],
  });
  assert.deepEqual(result, {
    params: { reviewer: 'human' },
    scalars: [
      { key: 'maxRounds', raw: '2' },
      { key: 'rebuttal', raw: 'false' },
    ],
  });
});
