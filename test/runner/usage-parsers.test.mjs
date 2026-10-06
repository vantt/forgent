import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parsePiUsage,
  parseCodexCliUsage,
  parseClaudeUsage,
  parseHerdrUsage,
  parseUsageForAdapter,
} from '../../src/runner/dispatch/usage-parsers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/usage');

test('parsePiUsage: parses multi-turn pi output correctly', () => {
  const file = path.join(FIXTURES_DIR, 'pi-multiturn-normal.jsonl');
  const content = fs.readFileSync(file, 'utf8');
  const usage = parsePiUsage(content);

  assert.ok(usage !== null, 'usage should not be null');
  assert.equal(usage.source, 'pi');
  // Two assistant turns in fixture:
  // Turn 1: input 12924, output 391, cacheRead 512, cacheWrite 0, total 13827
  // Turn 2: input 14083, output 172, cacheRead 640, cacheWrite 0, total 14895
  assert.equal(usage.inputTokens, 12924 + 14083);
  assert.equal(usage.outputTokens, 391 + 172);
  assert.equal(usage.cacheReadTokens, 512 + 640);
  assert.equal(usage.cacheCreationTokens, 0);
  assert.equal(usage.totalTokens, 13827 + 14895);
});

test('parsePiUsage: parses multi-turn pi output when agent_end is omitted', () => {
  const file = path.join(FIXTURES_DIR, 'pi-multiturn-no-agent-end.jsonl');
  const content = fs.readFileSync(file, 'utf8');
  const usage = parsePiUsage(content);

  assert.ok(usage !== null, 'usage should not be null');
  assert.equal(usage.source, 'pi');
  // Two turns:
  // Turn 1: input 13459, output 415, total 13874
  // Turn 2: input 14153, output 233, total 14898
  assert.equal(usage.inputTokens, 13459 + 14153);
  assert.equal(usage.outputTokens, 415 + 233);
  assert.equal(usage.totalTokens, 13874 + 14898);
});

test('parsePiUsage: handles rate limit error run safely', () => {
  const file = path.join(FIXTURES_DIR, 'pi-codex-rate-limit.jsonl');
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const usage = parsePiUsage(content);
    // Rate limit error turn has usage: { input: 0, output: 0, totalTokens: 0 }
    if (usage) {
      assert.equal(usage.totalTokens, 0);
      assert.equal(usage.source, 'pi');
    }
  }
});

test('parsePiUsage: returns null on empty or non-json content', () => {
  assert.equal(parsePiUsage(''), null);
  assert.equal(parsePiUsage('just some random stdout\nwithout json\n'), null);
  assert.equal(parsePiUsage('{"type": "user_event"}'), null);
});

test('parseCodexCliUsage: extracts totalTokens from end of normal stderr.log', () => {
  const file = path.join(FIXTURES_DIR, 'codex-cli-normal.stderr.log');
  const content = fs.readFileSync(file, 'utf8');
  const usage = parseCodexCliUsage(content);

  assert.ok(usage !== null, 'usage should not be null');
  assert.equal(usage.source, 'codex-cli');
  assert.equal(usage.totalTokens, 75387);
  assert.equal(usage.inputTokens, null);
  assert.equal(usage.outputTokens, null);
});

test('parseCodexCliUsage: ignores tool output containing "tokens used" in middle of file', () => {
  const file = path.join(FIXTURES_DIR, 'codex-cli-grep-tokens-used.stderr.log');
  const content = fs.readFileSync(file, 'utf8');
  const usage = parseCodexCliUsage(content);

  assert.ok(usage !== null, 'usage should not be null');
  assert.equal(usage.source, 'codex-cli');
  // Must extract 80,961 from the end, NOT grep lines
  assert.equal(usage.totalTokens, 80961);
});

test('parseCodexCliUsage: ignores earlier nested "tokens used" and captures final total', () => {
  const file = path.join(FIXTURES_DIR, 'codex-cli-nested-tokens-used.stderr.log');
  const content = fs.readFileSync(file, 'utf8');
  const usage = parseCodexCliUsage(content);

  assert.ok(usage !== null, 'usage should not be null');
  assert.equal(usage.source, 'codex-cli');
  // Must extract 84,606, NOT the earlier 4,043
  assert.equal(usage.totalTokens, 84606);
});

test('parseCodexCliUsage: returns null when tokens used is in the middle but not at end', () => {
  const syntheticStderr = `
Some build output
tokens used
12,345
Process failed with segmentation fault!
Stack trace: at line 42
`;
  const usage = parseCodexCliUsage(syntheticStderr);
  assert.equal(usage, null);
});

test('parseClaudeUsage: returns transcript source marker', () => {
  const usage = parseClaudeUsage();
  assert.deepEqual(usage, {
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    cacheReadTokens: null,
    cacheCreationTokens: null,
    source: 'transcript',
  });
});

test('parseHerdrUsage: returns unavailable-herdr marker', () => {
  const usage = parseHerdrUsage();
  assert.deepEqual(usage, {
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    cacheReadTokens: null,
    cacheCreationTokens: null,
    source: 'unavailable-herdr',
  });
});

test('parseUsageForAdapter: dispatches correctly by adapter name', () => {
  const piFile = path.join(FIXTURES_DIR, 'pi-multiturn-normal.jsonl');
  const codexFile = path.join(FIXTURES_DIR, 'codex-cli-normal.stderr.log');
  const piStdout = fs.readFileSync(piFile, 'utf8');
  const codexStderr = fs.readFileSync(codexFile, 'utf8');

  // pi adapter
  const piResult = parseUsageForAdapter('pi', { stdout: piStdout });
  assert.equal(piResult.source, 'pi');
  assert.equal(piResult.totalTokens, 13827 + 14895);

  // codex-cli adapter
  const codexResult = parseUsageForAdapter('codex-cli', { stderr: codexStderr });
  assert.equal(codexResult.source, 'codex-cli');
  assert.equal(codexResult.totalTokens, 75387);

  // claude adapter
  const claudeResult = parseUsageForAdapter('claude-bwrap');
  assert.equal(claudeResult.source, 'transcript');

  // herdr adapter
  const herdrResult = parseUsageForAdapter('codex-herdr');
  assert.equal(herdrResult.source, 'unavailable-herdr');

  // unsupported adapter
  const unknownResult = parseUsageForAdapter('unknown-worker');
  assert.equal(unknownResult.source, 'unsupported');
});
