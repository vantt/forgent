// parse-args.mjs -- the CLI's argv parser: `--flag value` or bare `--flag` (boolean), plus positional args.
// No dependency, no dashes-in-values ambiguity handling beyond what this CLI's own verbs need. A value that
// starts with `--` is read as the next flag, so a generated command must not give one. Kernel layer, like the registry.

// Flags that may be given more than once; each use is collected into a list.
export const REPEATABLE_FLAGS = new Set(['context-ref', 'param']);

export function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = REPEATABLE_FLAGS.has(key) ? [...(flags[key] ?? []), next] : next;
        i += 1;
      } else {
        flags[key] = REPEATABLE_FLAGS.has(key) ? [...(flags[key] ?? []), true] : true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}
