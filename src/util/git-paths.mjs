// git-paths.mjs — read the path lists git prints, byte for byte.
//
// Without -z, git C-quotes a path that holds a non-ASCII byte, a tab, a quote or a backslash
// (core.quotePath), status also quotes one with a space, and a parser that splits lines and trims
// cuts a name's edge spaces. Every reader of a git path list asks git with -z and parses the answer
// here, so one rule decides what a path is: the bytes git names, a rename or copy as both halves.
// A diff reader also passes --no-relative: with a user's diff.relative=true and a cwd below the top
// level, diff would name `x.js` where status names `sub/x.js`.

/** Output ceiling for a path list: one file per line of a large untracked tree passes Node's 1 MiB. */
export const GIT_LIST_MAX_BUFFER = 64 * 1024 * 1024;

/** Paths of a NUL-separated list: `diff --name-only -z`, `ls-tree --name-only -z`, `show --name-only -z`. */
export function nulPaths(output) {
  return output.split('\0').filter(Boolean);
}

/**
 * Paths of `git status --porcelain=v1 -z`, each once: a rename or copy (staged, or intent-to-add)
 * as both its halves, and an untracked directory git collapsed (`dir/`, or a nested repository)
 * without its trailing slash, the way it is staged.
 */
export function statusPaths(output) {
  const fields = output.split('\0');
  const paths = [];
  for (let i = 0; i < fields.length; i += 1) {
    const entry = fields[i];
    if (entry.length < 4) continue;
    paths.push(entry.slice(3).replace(/\/$/, ''));
    // `XY new\0orig\0`: the source path follows as its own field.
    if ('RC'.includes(entry[0]) || 'RC'.includes(entry[1])) paths.push(fields[++i]);
  }
  return [...new Set(paths.filter(Boolean))];
}

/** Every path `git diff --name-status -z` names, a rename or copy (`R100\0old\0new\0`) as both halves. */
export function nameStatusPaths(output) {
  const fields = output.split('\0');
  const paths = new Set();
  for (let i = 0; i < fields.length; i += 1) {
    const status = fields[i];
    if (!status) continue;
    const count = 'RC'.includes(status[0]) ? 2 : 1;
    for (let k = 0; k < count && i + 1 < fields.length; k += 1) {
      const p = fields[++i];
      if (p) paths.add(p);
    }
  }
  return paths;
}
