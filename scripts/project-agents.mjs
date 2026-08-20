#!/usr/bin/env node
// project-agents.mjs -- projects forgent's own platform-agnostic agent
// definitions (core/agents/*.yaml, domains/<name>/agents/*.yaml) into Claude Code's adapter format
// (.claude/agents/<name>.md). tsk-slq / D24 / D33.

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

import { resolveMainCheckoutRoot } from '../src/runner/paths.mjs';
import { readSharedConfig } from '../src/config/shared-config-file.mjs';
import { modelForTier } from '../src/runner/dispatch.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const TARGET_DIR = path.join(REPO_ROOT, '.claude', 'agents');

const FORBIDDEN_PLATFORM_NAMES = ['claude', 'codex', 'anthropic'];

const REQUIRED_FIELDS = ['name', 'version', 'description', 'role', 'persona', 'decision_boundary', 'model_tier', 'tool-scope'];

export const DEFAULT_MODELS = { light: 'haiku', standard: 'sonnet', heavy: 'opus' };

export class AgentDefinitionError extends Error {}

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

  scanDir(path.join(repoRoot, 'agents'), 'agents');

  return files;
}

/** Pure: source yaml text -> generated adapter markdown text. */
export function projectAgentMarkdown(name, sourceYamlText, models, sourcePath = `agents/${name}.yaml`) {
  const def = parseYaml(sourceYamlText);
  assertPlatformAgnostic(name, sourceYamlText);
  validateDefinition(name, def);

  const model = models[def.model_tier];
  const tools = def['tool-scope'].join(', ');

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

function main() {
  const agentFiles = findAgentYamlFiles(REPO_ROOT);
  if (agentFiles.length === 0) {
    console.log(`no agent yaml files found -- nothing to project.`);
    return;
  }

  // D33: Check for duplicate agent-type names globally across all sources
  const nameToFiles = new Map();
  for (const file of agentFiles) {
    const sourceYamlText = fs.readFileSync(file.filePath, 'utf8');
    let agentName = file.name;
    try {
      const def = parseYaml(sourceYamlText);
      if (def && typeof def.name === 'string') {
        agentName = def.name;
      }
    } catch {}
    if (!nameToFiles.has(agentName)) {
      nameToFiles.set(agentName, []);
    }
    const relPath = path.relative(REPO_ROOT, file.filePath);
    nameToFiles.get(agentName).push(relPath);
  }

  for (const [agentName, paths] of nameToFiles.entries()) {
    if (paths.length > 1) {
      throw new AgentDefinitionError(
        `duplicate agent-type name "${agentName}" found in multiple files: ${paths.join(', ')} (D33)`,
      );
    }
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
