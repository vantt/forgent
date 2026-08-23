import test from 'node:test';
import assert from 'node:assert/strict';
import { countVowels } from './count-vowels.mjs';

test('countVowels counts vowels in string', () => {
  assert.equal(countVowels('agy'), 1);
});

test('countVowels handles empty string', () => {
  assert.equal(countVowels(''), 0);
});

test('countVowels is case insensitive', () => {
  assert.equal(countVowels('AEIOU aeiou'), 10);
});
