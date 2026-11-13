// domain-compile.mjs — compiles each domain's YAML into the `compiled.json` the Work lifecycle reads, and judges
// whether the committed files are in step. One judge for `npm run build:domains`, `--check`, the doctor row
// `domain-registry-compiled` and the tests. The domains are the running payload's, through `domainCatalog`.
import fs from 'node:fs';
import path from 'node:path';

import { describeYamlError, parseYaml } from './yaml.mjs';
import { DOMAIN_COMPILED_CONTRACT, domainCatalog } from './domain-dirs.mjs';

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
  return { contract: DOMAIN_COMPILED_CONTRACT, registry, workflows };
}

export function compileAllDomains(payloadRoot) {
  const out = {};
  for (const { name, dir } of domainCatalog({ payloadRoot }).domains) {
    const compiled = compileDomain(dir);
    if (compiled) out[name] = compiled;
  }
  return out;
}

export function renderCompiledDomain(compiled) {
  return `${JSON.stringify(compiled, null, 2)}\n`;
}

/** Judges each domain directory with a compiled.json or registry.yaml; the build's --check and the doctor row share it. */
export function checkCompiledDomains(payloadRoot) {
  const problems = [];
  let checked = 0;
  for (const { name, dir } of domainCatalog({ payloadRoot }).domains) {
    const [yaml, json] = ['registry.yaml', 'compiled.json'].map((file) => fs.existsSync(path.join(dir, file)));
    if (!(yaml || json)) continue;
    checked += 1;
    const rel = `domains/${name}/compiled.json`;
    if (!yaml) { problems.push(`${rel} has no registry.yaml — delete it or restore the YAML`); continue; }
    if (!json) { problems.push(`${rel} is missing`); continue; }
    const text = fs.readFileSync(path.join(dir, 'compiled.json'), 'utf8');
    let parsed;
    try { parsed = JSON.parse(text); } catch (err) { problems.push(`${rel} is unreadable (${err.message})`); continue; }
    if (parsed?.contract?.id !== DOMAIN_COMPILED_CONTRACT.id || parsed.contract.version !== DOMAIN_COMPILED_CONTRACT.version) {
      problems.push(`${rel} has no ${DOMAIN_COMPILED_CONTRACT.id} version ${DOMAIN_COMPILED_CONTRACT.version} contract — run npm run build:domains`);
      continue;
    }
    try { if (text !== renderCompiledDomain(compileDomain(dir))) problems.push(`${rel} is stale — run npm run build:domains`); } catch (err) { problems.push(err.message); }
  }
  return { checked, problems };
}
