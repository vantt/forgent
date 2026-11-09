#!/usr/bin/env node
// build-domain-registry.mjs — compile each domain's YAML into domains/<domain>/compiled.json.
//
// src/state/domain-registry.mjs loads the compiled file at import time, so one YAML typo cannot
// take down every verb. The YAML stays the source of truth: `--check`, the doctor check
// `domain-registry-compiled` and the test all judge drift with checkCompiledDomains below.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeYamlError, parseYaml } from '../src/util/yaml.mjs';
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Parses one domain YAML file; a failure names the file as domains/<domain>/<name> with the
// parser's line and column.
function parseDomainFile(file, domain, relName) {
  const rel = `domains/${domain}/${relName}`;
  try {
    return parseYaml(fs.readFileSync(file, 'utf8'), { filename: rel });
  } catch (error) {
    throw new Error(`${rel}: cannot be parsed: ${describeYamlError(error)}`, { cause: error });
  }
}

/** The compiled form of one domain directory, or null when it has no registry.yaml. */
export function compileDomain(domainDir) {
  const registryPath = path.join(domainDir, 'registry.yaml');
  if (!fs.existsSync(registryPath)) return null;
  const domain = path.basename(domainDir);
  const registry = parseDomainFile(registryPath, domain, 'registry.yaml') ?? {};
  const workflows = {};
  const sources = {};
  const workflowsDir = path.join(domainDir, 'workflows');
  if (fs.existsSync(workflowsDir)) {
    for (const file of fs.readdirSync(workflowsDir).sort()) {
      if (!/\.ya?ml$/.test(file)) continue;
      const key = path.basename(file, path.extname(file));
      if (key in sources) throw new Error(`domains/${domain}/workflows: ${sources[key]} and ${file} both define workflow "${key}"`);
      sources[key] = file;
      workflows[key] = parseDomainFile(path.join(workflowsDir, file), domain, `workflows/${file}`);
    }
  }
  return { registry, workflows };
}

export function compileAllDomains(domainsDir = path.join(root, 'domains')) {
  const out = {};
  for (const entry of fs.readdirSync(domainsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const compiled = compileDomain(path.join(domainsDir, entry.name));
    if (compiled) out[entry.name] = compiled;
  }
  return out;
}

function render(compiled) {
  return `${JSON.stringify(compiled, null, 2)}\n`;
}

/** Judges each domain directory with a compiled.json or registry.yaml; the build's --check and the doctor row share it. */
export function checkCompiledDomains(domainsDir = path.join(root, 'domains')) {
  const problems = [];
  let checked = 0;
  for (const entry of fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = path.join(domainsDir, entry.name);
    const [yaml, json] = ['registry.yaml', 'compiled.json'].map((name) => fs.existsSync(path.join(dir, name)));
    if (!entry.isDirectory() || !(yaml || json)) continue;
    checked += 1;
    const rel = `domains/${entry.name}/compiled.json`;
    if (!yaml) { problems.push(`${rel} has no registry.yaml — delete it or restore the YAML`); continue; }
    if (!json) { problems.push(`${rel} is missing`); continue; }
    const text = fs.readFileSync(path.join(dir, 'compiled.json'), 'utf8');
    try { JSON.parse(text); } catch (err) { problems.push(`${rel} is unreadable (${err.message})`); continue; }
    try { if (text !== render(compileDomain(dir))) problems.push(`${rel} is stale — run npm run build:domains`); } catch (err) { problems.push(err.message); }
  }
  return { checked, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureAddonForScript();
  if (process.argv.includes('--check')) {
    const { problems } = checkCompiledDomains();
    for (const problem of problems) console.error(problem);
    process.exit(problems.length > 0 ? 1 : 0);
  }
  for (const [name, compiled] of Object.entries(compileAllDomains())) {
    const target = path.join(root, 'domains', name, 'compiled.json');
    const next = render(compiled);
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === next) continue;
    fs.writeFileSync(target, next);
    console.log(`wrote domains/${name}/compiled.json`);
  }
}
