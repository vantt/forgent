#!/usr/bin/env node
// project-agents.mjs -- projects forgent's own platform-agnostic agent
// definitions (core/agents/*.yaml, domains/<name>/agents/*.yaml) into Claude Code's adapter format
// (.claude/agents/<name>.md). tsk-slq / D24 / D33.
//
// Canonical root location (D5, D24, docs/history/agent-executor-agent-definitions/CONTEXT.md):
// lives at core/agents/ and domains/<name>/agents/ (with legacy fallback to agents/) --
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
// This is a SEPARATE axis from tsk-62v's `executors.<id>.allowedTools`
// (the shared config file's `runner` section), which gates a different
// dispatch path (domain-1 headless CLI spawn), keyed by executorId rather
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
import { modelForTier } from '../src/runner/dispatch.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const TARGET_DIR = path.join(REPO_ROOT, '.claude', 'agents');

// The exact sourceLabel findAgentYamlFiles gives its legacy agents/ scan
// (below) -- shared as a constant, not a bare 'agents' string literal
// re-typed independently in resolveAgentFiles, so the two can never drift
// apart and silently stop matching each other.
const LEGACY_AGENTS_SOURCE = 'agents';

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
// tsk-5tm D9: delegates to `modelForTier` (the one canonical tier->model
// resolver) instead of reading `cfg.runner.models` directly -- that field
// is the legacy flat map D9 introduced `modelPolicies` to replace, and
// `modelForTier` already prefers `modelPolicies` when present, falling
// back to the legacy map otherwise. Reading `cfg.runner.models` here
// directly (this function's pre-D9 shape) meant a `modelPolicies`-only
// config -- the shape this repo's OWN committed `.fgos/config.json` now
// uses -- would silently fall through to DEFAULT_MODELS below with no
// error, hiding any real customization to `modelPolicies.claude`.
// Exported for a real integration test (tsk-5tm) -- previously this
// function was module-private, its own root resolution not injectable, and
// untested; the exact blind spot that let it silently keep reading the
// legacy `models` shape unnoticed. `mainCheckoutRootOverride` is test-only
// (every real call site omits it, resolving exactly as before).
export function readRunnerModels(mainCheckoutRootOverride) {
  const mainCheckoutRoot = mainCheckoutRootOverride ?? resolveMainCheckoutRoot(REPO_ROOT) ?? REPO_ROOT;
  const cfg = readSharedConfig(mainCheckoutRoot);
  const runnerCfg = cfg.runner ?? {};
  const models = {};
  for (const tier of Object.keys(DEFAULT_MODELS)) {
    try {
      models[tier] = modelForTier(runnerCfg, tier);
    } catch {
      models[tier] = DEFAULT_MODELS[tier];
    }
  }
  return models;
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
  // skills (tsk-397 D20): optional, but when present must be a real list
  // of non-empty skill name strings -- same shape discipline tool-scope
  // already gets above.
  if ('skills' in def && (!Array.isArray(def.skills) || def.skills.some((c) => typeof c !== 'string' || !c.trim()))) {
    throw new AgentDefinitionError(`agents/${name}.yaml's skills, when present, must be a non-empty list of skill name strings.`);
  }
}

/**
 * Scans core/agents/, domains/<name>/agents/, and agents/ (legacy) under repoRoot
 * for agent-definition YAML files (D24).
 */
export function findAgentYamlFiles(repoRoot) {
  const files = [];
  const seenPaths = new Set();

  const scanDir = (dir, sourceLabel) => {
    if (!fs.existsSync(dir)) return;
    // D32 "deterministic, never random": readdirSync's own order is
    // filesystem-dependent (directory-hash order on ext4, not lexical),
    // not a stable ordering guarantee -- sorted here so the duplicate-name
    // scan below (and the write loop that follows it) processes entries in
    // the same order on every machine/run (review finding M2).
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        const filePath = path.join(dir, entry.name);
        if (!seenPaths.has(filePath)) {
          seenPaths.add(filePath);
          files.push({
            source: sourceLabel,
            filePath,
            fileName: entry.name,
            name: entry.name.replace(/\.yaml$|\.yml$/, ''),
          });
        }
      }
    }
  };

  scanDir(path.join(repoRoot, 'core', 'agents'), 'core/agents');

  const domainsDir = path.join(repoRoot, 'domains');
  if (fs.existsSync(domainsDir)) {
    const domainEntries = fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const domainEntry of domainEntries) {
      if (domainEntry.isDirectory()) {
        scanDir(path.join(domainsDir, domainEntry.name, 'agents'), `domains/${domainEntry.name}/agents`);
      }
    }
  }

  scanDir(path.join(repoRoot, 'agents'), LEGACY_AGENTS_SOURCE);

  return files;
}

/** Pure: source yaml text -> generated adapter markdown text. */
export function projectAgentMarkdown(name, sourceYamlText, models, sourcePath = `agents/${name}.yaml`) {
  const def = parseYaml(sourceYamlText);
  assertPlatformAgnostic(name, sourceYamlText);
  validateDefinition(name, def);

  const model = models[def.model_tier];
  const tools = def['tool-scope'].join(', ');

  // skills (tsk-397 D20): OPTIONAL -- declared capabilities of this agent-type
  // used for eligibility matching against a task-spec's requires-skill.
  const frontmatterLines = ['---', `name: ${def.name}`, `description: ${def.description}`, `model: ${model}`, `tools: ${tools}`];
  if (Array.isArray(def.skills) && def.skills.length > 0) {
    frontmatterLines.push(`skills: [${def.skills.join(', ')}]`);
  }
  frontmatterLines.push('---');
  const frontmatter = frontmatterLines.join('\n');

  const body = [
    `# ${def.role}`,
    '',
    `> Generated by \`scripts/project-agents.mjs\` from \`${sourcePath}\` -- do not hand-edit this file; edit the source yaml and re-run the projection script instead.`,
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

/**
 * D33: Resolves duplicate agent-type names globally across all sources.
 * Deprioritizes legacy agents/ source when a non-legacy source (core/agents or
 * domains/<name>/agents) collides with it (logs warning, legacy is skipped).
 * Throws AgentDefinitionError if two non-legacy sources collide.
 */
export function resolveAgentFiles(agentFiles, repoRoot = REPO_ROOT) {
  const nameToEntries = new Map();
  for (const file of agentFiles) {
    let agentName = file.name;
    try {
      const sourceYamlText = fs.readFileSync(file.filePath, 'utf8');
      const def = parseYaml(sourceYamlText);
      if (def && typeof def.name === 'string') {
        agentName = def.name;
      }
    } catch {}
    const relPath = path.relative(repoRoot, file.filePath);
    const entry = { ...file, agentName, relPath };
    if (!nameToEntries.has(agentName)) {
      nameToEntries.set(agentName, []);
    }
    nameToEntries.get(agentName).push(entry);
  }

  const resolved = [];
  for (const [agentName, entries] of nameToEntries.entries()) {
    if (entries.length === 1) {
      resolved.push(entries[0]);
      continue;
    }

    const nonLegacy = entries.filter((e) => e.source !== LEGACY_AGENTS_SOURCE);
    const legacy = entries.filter((e) => e.source === LEGACY_AGENTS_SOURCE);

    if (nonLegacy.length === 1 && legacy.length > 0) {
      const winner = nonLegacy[0];
      for (const leg of legacy) {
        console.warn(
          `warning: legacy agents/ entry "${leg.relPath}" skipped due to duplicate agent-type name "${agentName}" in ${winner.relPath} (D33)`
        );
      }
      resolved.push(winner);
    } else {
      const paths = entries.map((e) => e.relPath);
      throw new AgentDefinitionError(
        `duplicate agent-type name "${agentName}" found in multiple files: ${paths.join(', ')} (D33)`
      );
    }
  }

  return resolved;
}

function main() {
  const rawAgentFiles = findAgentYamlFiles(REPO_ROOT);
  const agentFiles = resolveAgentFiles(rawAgentFiles, REPO_ROOT);
  if (agentFiles.length === 0) {
    console.log(`no agent yaml files found -- nothing to project.`);
    return;
  }

  const models = readRunnerModels();
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  for (const file of agentFiles) {
    const sourceYamlText = fs.readFileSync(file.filePath, 'utf8');
    const def = parseYaml(sourceYamlText);
    const name = def?.name ?? file.name;
    const relPath = path.relative(REPO_ROOT, file.filePath);
    const markdown = projectAgentMarkdown(name, sourceYamlText, models, relPath);
    fs.writeFileSync(path.join(TARGET_DIR, `${name}.md`), markdown, 'utf8');
    console.log(`projected ${relPath} -> .claude/agents/${name}.md`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
