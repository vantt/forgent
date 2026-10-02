#!/usr/bin/env node
// build-domain-registry.mjs — compile each domain's YAML (registry.yaml + workflows/*.yaml)
// into domains/<domain>/compiled.json.
//
// src/state/domain-registry.mjs loads the compiled file so the Work lifecycle works in a
// plain unpacked copy of fgOS with no node_modules (doctor and setup must load there, see
// src/setup/registrations.mjs). The YAML stays the source of truth; test/state/
// domain-registry-compiled.test.mjs fails when the two drift, `--check` does the same
// from the command line.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function compileDomain(domainDir) {
  const registryPath = path.join(domainDir, 'registry.yaml');
  if (!fs.existsSync(registryPath)) return null;
  const registry = YAML.parse(fs.readFileSync(registryPath, 'utf8')) ?? {};
  const workflows = {};
  const workflowsDir = path.join(domainDir, 'workflows');
  if (fs.existsSync(workflowsDir)) {
    for (const file of fs.readdirSync(workflowsDir).sort()) {
      if (!/\.ya?ml$/.test(file)) continue;
      workflows[path.basename(file, path.extname(file))] = YAML.parse(fs.readFileSync(path.join(workflowsDir, file), 'utf8'));
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [name, compiled] of Object.entries(compileAllDomains())) {
    const target = path.join(root, 'domains', name, 'compiled.json');
    const next = render(compiled);
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    if (current === next) continue;
    if (check) {
      console.error(`stale: domains/${name}/compiled.json (run: npm run build:domains)`);
      stale += 1;
    } else {
      fs.writeFileSync(target, next);
      console.log(`wrote domains/${name}/compiled.json`);
    }
  }
  if (stale > 0) process.exit(1);
}
