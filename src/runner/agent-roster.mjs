// agent-roster.mjs — reads the real agent-type roster (core/agents/ +
// domains/<name>/agents/ + legacy agents/) and a task-spec's own header
// fields, for docs/history/core-foundation-domain-boundary/DISCUSSION.md's D20/D22
// eligibility-inversion resolution (resolveAgentTypeForTaskSpec, src/runner/dispatch/cli.mjs). LAYER: infra
// (same tier as dispatch/cli.mjs, which is the runtime consumer this
// module exists for) -- one-directional-layer forbids dispatch/cli.mjs
// (infra) importing src/setup/registrations.mjs (use-case, shallower). Both
// read an agent file through `readAgentDefinition` (agent-definitions.mjs),
// so the name and skills of an agent have one reader.

import fs from 'node:fs';
import path from 'node:path';

import { readAgentDefinition } from './agent-definitions.mjs';

/**
 * Every real agent-type's `{name, skills}` across `core/agents/`,
 * `domains/<name>/agents/`, and the legacy `agents/` (D24/D33 precedence:
 * core, then domains in sorted order, then legacy last, first occurrence
 * of a name wins -- same order `registrations.mjs`'s own
 * `allAgentYamlFiles` uses). Sorted directory scans throughout (D32,
 * review finding M2) so the roster is identical on every machine/run.
 * Never throws on a malformed individual file: a file that is unreadable or
 * not valid YAML is left out of the roster and named in `problems`
 * (`<file>: cannot be parsed: <reason> (line L, column C)`), so the caller
 * can surface it instead of losing the agent silently.
 *
 * @returns {{ defs: Array<{ name: string, skills: string[] }>, problems: string[] }}
 */
export function loadAgentRoster(cwd) {
  const files = [];
  const seen = new Set();

  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir).sort((a, b) => a.localeCompare(b))) {
      if (!name.endsWith('.yaml') && !name.endsWith('.yml')) continue;
      const filePath = path.join(dir, name);
      if (seen.has(filePath)) continue;
      seen.add(filePath);
      files.push(filePath);
    }
  };

  scanDir(path.join(cwd, 'core', 'agents'));
  const domainsDir = path.join(cwd, 'domains');
  if (fs.existsSync(domainsDir)) {
    for (const entry of fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory()) scanDir(path.join(domainsDir, entry.name, 'agents'));
    }
  }
  scanDir(path.join(cwd, 'agents'));

  const defs = [];
  const problems = [];
  const namesSeen = new Set();
  for (const filePath of files) {
    const rel = path.relative(cwd, filePath).split(path.sep).join('/');
    let text;
    try {
      text = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      problems.push(`${rel}: cannot be read (${error.message})`);
      continue;
    }
    const { error, name: declared, skills } = readAgentDefinition(text, { filename: rel });
    if (error) {
      problems.push(`${rel}: ${error}`);
      continue;
    }
    const name = declared ?? path.basename(filePath).replace(/\.ya?ml$/, '');
    if (namesSeen.has(name)) continue; // first occurrence wins, D33's own precedence
    namesSeen.add(name);
    defs.push({ name, skills });
  }
  return { defs, problems };
}

/**
 * A task-spec markdown file's own header fields (the same `key: value |
 * key: value` line `registrations.mjs`'s `parseTaskSpecHeaderFields`
 * already parses for the doctor check) -- only `agent`/`requires-skill`
 * matter to `resolveAgentTypeForTaskSpec`, always normalized to arrays.
 * Returns `{}` (never throws) when the file is missing, unreadable, or
 * has no `domain:`-led header line -- "no header content" is a legitimate
 * "nothing to resolve from" input, not an error.
 */
export function readTaskSpecHeader(filePath) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch {
    return {};
  }
  const headerLine = text.split('\n').find((l) => l.startsWith('domain:'));
  if (!headerLine) return {};
  const res = {};
  for (const part of headerLine.split('|').map((p) => p.trim())) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.slice(0, colonIdx).trim();
    const valStr = part.slice(colonIdx + 1).trim();
    if (key === 'requires-skill' || key === 'agent') {
      if (valStr.startsWith('[') && valStr.endsWith(']')) {
        res[key] = valStr.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      } else if (valStr.includes(',')) {
        res[key] = valStr.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (valStr) {
        res[key] = [valStr];
      } else {
        res[key] = [];
      }
    } else {
      res[key] = valStr;
    }
  }
  return res;
}
