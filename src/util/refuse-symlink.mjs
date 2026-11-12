import fs from 'node:fs';

/**
 * The one symlink-refusal rule: lstat the path and refuse a symbolic link by name, never follow it
 * (a followed link copies foreign bytes or writes outside the root). Returns the lstat result.
 * A missing path throws the lstat error, or returns null when `optional` is set.
 */
export function refuseSymlink(entryPath, context, { optional = false } = {}) {
  let stat;
  try {
    stat = fs.lstatSync(entryPath);
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw error;
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlink refused in ${context}: ${entryPath}`);
  }
  return stat;
}

/**
 * The first symbolic link on the way from `root` down `relativePath` (each component below `root`,
 * the last included), or null when there is none or the path stops existing. `root` itself is the
 * caller's own ground and is not tested. For a reader or remover that must never act through a link
 * in a parent directory, which a check of the leaf alone does not see.
 */
export function firstSymlinkUnder(root, relativePath) {
  let current = root;
  for (const part of relativePath.split(/[\\/]/).filter(Boolean)) {
    current = `${current}${current.endsWith('/') || current.endsWith('\\') ? '' : '/'}${part}`;
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch {
      return null;
    }
    if (stat.isSymbolicLink()) return current;
  }
  return null;
}
