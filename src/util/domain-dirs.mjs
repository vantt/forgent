// domain-dirs.mjs — the one walk over a `domains/` directory. KERNEL leaf: node:fs and node:path only.
import fs from 'node:fs';

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
