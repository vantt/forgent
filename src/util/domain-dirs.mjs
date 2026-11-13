// domain-dirs.mjs — the one walk over a `domains/` directory and the one domain catalog. KERNEL leaf: node:fs,
// node:path and node:url only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The fgOS payload this process runs: the directory above `src/`. Domain doctrine is read from here and nowhere
 * else (owner decision 79 Q4); a project's own `domains/` directory is never doctrine. */
export const PAYLOAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The contract a `compiled.json` carries; the reader refuses another major version by name. */
export const DOMAIN_COMPILED_CONTRACT = Object.freeze({ id: 'domain-compiled', version: 1 });

/**
 * The sorted names of the domain directories directly under `domainsDir`
 * (the `domains/` folder itself). A file or a link is not a domain; an absent
 * `domainsDir` is an empty list. Filters that belong to one caller (a dot name,
 * a `registry.yaml`, a `skills/` subdir) stay at that caller.
 */
export function listDomainDirs(domainsDir) {
  let entries;
  try {
    entries = fs.readdirSync(domainsDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return [];
    throw err;
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The domains of the running payload and where each one keeps its parts, answered once:
 * `{ root, domainsDir, domains: [{ name, dir, registryPath, compiledPath, agentsDir, workflowsDir, skillsDir,
 * taskSpecsDir, promptTemplatesDir }] }`, sorted by name. The directories are named, not checked for existence.
 * `payloadRoot` is a seam for tests and the build of the payload itself; a caller that reads doctrine passes nothing.
 */
export function domainCatalog({ payloadRoot = PAYLOAD_ROOT } = {}) {
  const domainsDir = path.join(payloadRoot, 'domains');
  const domains = listDomainDirs(domainsDir).map((name) => {
    const dir = path.join(domainsDir, name);
    return {
      name,
      dir,
      registryPath: path.join(dir, 'registry.yaml'),
      compiledPath: path.join(dir, 'compiled.json'),
      agentsDir: path.join(dir, 'agents'),
      workflowsDir: path.join(dir, 'workflows'),
      skillsDir: path.join(dir, 'skills'),
      taskSpecsDir: path.join(dir, 'task-specs'),
      promptTemplatesDir: path.join(dir, 'prompt-templates'),
    };
  });
  return { root: payloadRoot, domainsDir, domains };
}

/**
 * The parsed `compiled.json` at `compiledPath`. A file with no `contract`, or one whose id or major version is not
 * this reader's, is refused by name: the Work lifecycle never runs on a registry form it does not know.
 */
export function readCompiledDomain(compiledPath) {
  const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
  const { id, version } = compiled?.contract ?? {};
  if (id !== DOMAIN_COMPILED_CONTRACT.id || version !== DOMAIN_COMPILED_CONTRACT.version) {
    throw new Error(`${compiledPath}: unsupported compiled domain contract ${JSON.stringify(compiled?.contract ?? null)}; this fgOS reads ${DOMAIN_COMPILED_CONTRACT.id} version ${DOMAIN_COMPILED_CONTRACT.version}, run npm run build:domains`);
  }
  return compiled;
}
