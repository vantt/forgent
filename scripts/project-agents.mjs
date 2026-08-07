#!/usr/bin/env node
// project-agents.mjs -- projects forgent's own platform-agnostic agent
// definitions (agents/<name>.yaml) into Claude Code's adapter format
// (.claude/agents/<name>.md). tsk-slq.
//
// Canonical root location (D5, docs/history/agent-executor-agent-definitions/CONTEXT.md):
// lives at the plain top-level agents/, a sibling to docs/scripts/src/ --
// NOT under .fgos/. .fgos/ is reserved exclusively for the runner's own
// state store: src/runner/worktree.mjs's createWorktree() unconditionally
// wipes .fgos/ from every freshly-created worktree (ADR0020), and
// src/runner/merge.mjs rejects any merge that stages a change under
// .fgos/ outright (outcome 'fgos-write-rejected'). A canonical root
// living inside .fgos/ could never survive a worktree cycle or be merged.
//
// Tool-scope field authority (D1, docs/history/agent-executor-agent-definitions/CONTEXT.md):
// the source yaml's `tool-scope` list IS the authoritative, harness-enforced
// grant for the projected agent-type's Task-tool dispatch -- it is written
// straight into the generated .md's `tools:` frontmatter below, unfiltered.
// This is a SEPARATE axis from tsk-62v's `capacities.<id>.allowedTools`
// (the shared config file's `runner` section), which gates a different
// dispatch path (domain-1 headless CLI spawn), keyed by capacityId rather
// than agent-type name. Neither field is descriptive-only; neither is
// dropped; they never collide because they key differently.
//
// Copy/convert only -- not a converter engine (CONTEXT.md Feature boundary).
// One platform target exists today (Claude Code); a second platform gets
// its own adapter directory and its own small script when it's real.

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

import { resolveMainCheckoutRoot } from '../src/runner/paths.mjs';
import { readSharedConfig } from '../src/config/shared-config-file.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = path.join(REPO_ROOT, 'agents');
const TARGET_DIR = path.join(REPO_ROOT, '.claude', 'agents');

// Content in the platform-agnostic root must never name a specific
// platform (CONTEXT.md Pinned terms) -- checked here, not only by
// convention, so a violation fails loud at projection time rather than
// silently shipping.
const FORBIDDEN_PLATFORM_NAMES = ['claude', 'codex', 'anthropic'];

const REQUIRED_FIELDS = ['name', 'version', 'description', 'role', 'persona', 'decision_boundary', 'model_tier', 'tool-scope'];

// Matches the shared config file's own `runner.models` block + dispatch.mjs's
// modelForTier default fallback -- reused as-is, not a second mapping.
export const DEFAULT_MODELS = { light: 'haiku', standard: 'sonnet', heavy: 'opus' };

export class AgentDefinitionError extends Error {}

// Reads the shared config file at the MAIN CHECKOUT, not at REPO_ROOT
// (this script's own on-disk location -- correct for agents/.claude/agents,
// wrong here): `.fgos/` is unconditionally wiped from every freshly-created
// worktree (ADR0020), so a worktree-local REPO_ROOT would silently find
// nothing and fall back to defaults on every run inside one, defeating the
// point of reading real config at all (tsk-5hv, found by fgos-validating).
// `resolveMainCheckoutRoot` (not `resolveRepoRoot`, both `src/runner/
// paths.mjs`: `resolveRepoRoot` shells out to `--show-toplevel` and
// returns a worktree's own root unchanged, not its main checkout) is the
// one helper that actually resolves via `--git-common-dir` the way this
// needs.
function readRunnerModels() {
  const mainCheckoutRoot = resolveMainCheckoutRoot(REPO_ROOT) ?? REPO_ROOT;
  const cfg = readSharedConfig(mainCheckoutRoot);
  const models = cfg.runner?.models;
  if (models && typeof models === 'object') {
    return { ...DEFAULT_MODELS, ...models };
  }
  return DEFAULT_MODELS;
}

function assertPlatformAgnostic(name, text) {
  const lower = text.toLowerCase();
  for (const forbidden of FORBIDDEN_PLATFORM_NAMES) {
    if (lower.includes(forbidden)) {
      throw new AgentDefinitionError(
        `agents/${name}.yaml names a specific platform ("${forbidden}") -- the canonical root must stay platform-agnostic (CONTEXT.md D1's own boundary).`,
      );
    }
  }
}

function validateDefinition(name, def) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in def)) {
      throw new AgentDefinitionError(`agents/${name}.yaml is missing required field "${field}".`);
    }
  }
  if (!Array.isArray(def['tool-scope']) || def['tool-scope'].length === 0 || def['tool-scope'].some((t) => typeof t !== 'string' || !t.trim())) {
    throw new AgentDefinitionError(`agents/${name}.yaml's tool-scope must be a non-empty list of tool-name strings.`);
  }
  if (!(def.model_tier in DEFAULT_MODELS)) {
    throw new AgentDefinitionError(
      `agents/${name}.yaml's model_tier "${def.model_tier}" is not one of ${Object.keys(DEFAULT_MODELS).join('/')}.`,
    );
  }
}

/** Pure: source yaml text -> generated adapter markdown text. */
export function projectAgentMarkdown(name, sourceYamlText, models) {
  const def = parseYaml(sourceYamlText);
  assertPlatformAgnostic(name, sourceYamlText);
  validateDefinition(name, def);

  const model = models[def.model_tier];
  const tools = def['tool-scope'].join(', ');

  const frontmatter = ['---', `name: ${def.name}`, `description: ${def.description}`, `model: ${model}`, `tools: ${tools}`, '---'].join('\n');

  const body = [
    `# ${def.role}`,
    '',
    '> Generated by `scripts/project-agents.mjs` from `agents/' + name + '.yaml` -- do not hand-edit this file; edit the source yaml and re-run the projection script instead.',
    '',
    '## Persona',
    '',
    `- **Voice:** ${def.persona.voice}`,
    `- **Style:** ${def.persona.style}`,
    `- **Archetype:** ${def.persona.archetype}`,
    '',
    '## Decision Boundary',
    '',
    '**Can decide:**',
    ...def.decision_boundary.can_decide.map((item) => `- ${item}`),
    '',
    '**Must escalate:**',
    ...def.decision_boundary.must_escalate.map((item) => `- ${item}`),
  ].join('\n');

  return `${frontmatter}\n\n${body}\n`;
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`no agents/ directory -- nothing to project.`);
    return;
  }
  const models = readRunnerModels();
  const sourceFiles = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.yaml'));
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  for (const file of sourceFiles) {
    const name = file.slice(0, -'.yaml'.length);
    const sourceYamlText = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');
    const markdown = projectAgentMarkdown(name, sourceYamlText, models);
    fs.writeFileSync(path.join(TARGET_DIR, `${name}.md`), markdown, 'utf8');
    console.log(`projected agents/${file} -> .claude/agents/${name}.md`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
