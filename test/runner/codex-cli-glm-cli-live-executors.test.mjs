import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { findExecutableOnPath } from '../../src/state/tool-registry.mjs';

// This repo's own `codex-cli` and `glm-cli` executors (`.fgos/config.json`)
// had each been proven live exactly once before, via a one-off manual fgOS
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
const CODEX_SKIP = CODEX_BIN ? false : 'codex binary not found on PATH -- live codex-cli test skips honestly';

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
  GLM_BIN && GLM_API_KEY
    ? false
    : 'claude binary or GLM_OPENROUTER_API_KEY (.fgos/secrets.local.env) not found -- live glm-cli test skips honestly';

test('codex-cli executor (LIVE): dispatches a real self-identification prompt through this repo\'s configured codex-cli executor', { skip: CODEX_SKIP }, async () => {
  const res = await executeExecutorCli('codex-cli', {
    prompt: SELF_ID_PROMPT,
    repoRoot: REPO_ROOT,
    cwd: REPO_ROOT,
    hasLiveTaskAccess: true,
    timeoutMs: 120000,
  });

  assert.equal(res.status, 0, `codex-cli exited non-zero: ${res.stderr}`);
  assert.equal(res.headBefore, res.headAfter, 'codex-cli must not mutate the repo for a pure self-identification prompt');
  assert.match(
    res.stdout,
    /gpt|codex/i,
    `expected a genuine OpenAI/Codex self-identification, got: ${res.stdout}`,
  );
});

test('glm-cli executor (LIVE): dispatches a real self-identification prompt through this repo\'s configured glm-cli executor', { skip: GLM_SKIP }, async () => {
  const res = await executeExecutorCli('glm-cli', {
    prompt: SELF_ID_PROMPT,
    repoRoot: REPO_ROOT,
    cwd: REPO_ROOT,
    hasLiveTaskAccess: true,
    timeoutMs: 90000,
  });

  assert.equal(res.status, 0, `glm-cli exited non-zero: ${res.stderr}`);
  assert.equal(res.headBefore, res.headAfter, 'glm-cli must not mutate the repo for a pure self-identification prompt');
  assert.match(
    res.stdout,
    /z-ai|glm/i,
    `expected a genuine GLM/z-ai self-identification (proving the OpenRouter route actually took effect, not a silent fallback to real Anthropic Claude), got: ${res.stdout}`,
  );
});
