import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { findExecutableOnPath } from '../../src/state/tool-registry.mjs';

// This repo's own `openai` (formerly `codex-cli`) and `glm` (formerly
// `glm-cli`) executors (`.fgos/config.json`) had each been proven live
// exactly once before, via a one-off manual fgOS
// work item (docs/history/codex-bypass-executor/plan.md tsk-3tkc;
// docs/history/glm-executor-smoke-test/plan.md tsk-3gr), never as a
// repeatable, automated test. Both tests below dispatch a real,
// self-identification-only prompt through THIS repo's own real
// `.fgos/config.json` (not a synthetic fixture) — the question they answer
// is "does the executor this project actually has configured work", which
// a fixture copy could silently stop answering if the real config drifted
// out of sync with it. Safety: the prompt only ever asks for one line of
// text, and both executors are independently confirmed (`headBefore ===
// headAfter` below) to make zero repo changes.

const REPO_ROOT = process.cwd();
const SELF_ID_PROMPT =
  'Reply with exactly one line in the format MODEL=<your model name or identifier>. No other text, no explanation.';

const CODEX_BIN = findExecutableOnPath(['codex']);
const LIVE_EXECUTOR_TESTS_ENABLED = process.env.FGOS_RUN_LIVE_EXECUTOR_TESTS === '1';
const CODEX_SKIP = LIVE_EXECUTOR_TESTS_ENABLED && CODEX_BIN
  ? false
  : 'set FGOS_RUN_LIVE_EXECUTOR_TESTS=1 with codex on PATH to run the live codex-cli proof';

function readGlmApiKey() {
  if (process.env.GLM_OPENROUTER_API_KEY) return process.env.GLM_OPENROUTER_API_KEY;
  const secretsPath = path.join(REPO_ROOT, '.fgos', 'secrets.local.env');
  if (!fs.existsSync(secretsPath)) return undefined;
  const match = fs.readFileSync(secretsPath, 'utf8').match(/^GLM_OPENROUTER_API_KEY=(.+)$/m);
  return match ? match[1].trim() : undefined;
}

// Loaded once at module scope (never logged) so `dispatch/transport.mjs`'s
// `${GLM_OPENROUTER_API_KEY}` substitution (against `process.env` at spawn
// time) has a real value, whether or not the caller's shell already
// exported it.
const GLM_API_KEY = readGlmApiKey();
if (GLM_API_KEY && !process.env.GLM_OPENROUTER_API_KEY) {
  process.env.GLM_OPENROUTER_API_KEY = GLM_API_KEY;
}
const GLM_BIN = findExecutableOnPath(['claude']);
const GLM_SKIP =
  LIVE_EXECUTOR_TESTS_ENABLED && GLM_BIN && GLM_API_KEY
    ? false
    : 'set FGOS_RUN_LIVE_EXECUTOR_TESTS=1 with claude and GLM_OPENROUTER_API_KEY (.fgos/secrets.local.env) to run the live glm proof';

test('openai executor (LIVE): dispatches a real self-identification prompt through this repo\'s configured openai executor', { skip: CODEX_SKIP }, async () => {
  const res = await executeExecutorCli('openai', {
    prompt: SELF_ID_PROMPT,
    repoRoot: REPO_ROOT,
    cwd: REPO_ROOT,
    hasLiveTaskAccess: true,
    timeoutMs: 120000,
  });

  assert.equal(res.status, 0, `openai executor exited non-zero: ${res.stderr}`);
  assert.equal(res.headBefore, res.headAfter, 'openai executor must not mutate the repo for a pure self-identification prompt');
  assert.match(
    res.stdout,
    /gpt|codex/i,
    `expected a genuine OpenAI/Codex self-identification, got: ${res.stdout}`,
  );
});

test('glm executor (LIVE): dispatches a real self-identification prompt through this repo\'s configured glm executor', { skip: GLM_SKIP }, async () => {
  const res = await executeExecutorCli('glm', {
    prompt: SELF_ID_PROMPT,
    repoRoot: REPO_ROOT,
    cwd: REPO_ROOT,
    hasLiveTaskAccess: true,
    timeoutMs: 90000,
  });

  assert.equal(res.status, 0, `glm executor exited non-zero: ${res.stderr}`);
  assert.equal(res.headBefore, res.headAfter, 'glm executor must not mutate the repo for a pure self-identification prompt');
  assert.match(
    res.stdout,
    /z-ai|glm/i,
    `expected a genuine GLM/z-ai self-identification (proving the OpenRouter route actually took effect, not a silent fallback to real Anthropic Claude), got: ${res.stdout}`,
  );
});
