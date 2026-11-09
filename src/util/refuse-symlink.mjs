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
