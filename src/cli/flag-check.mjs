// flag-check.mjs -- rejects a flag the command registry does not declare for
// the verb being run. Pure data in, message out: the registry
// (command-registry.mjs) is the only list of valid flags, so a new flag is
// declared once, in its verb's `parameters`, and is then both documented and
// accepted. Kernel layer, like the registry itself.

// Accepted by every verb: the store root the `fgos` shell function appends,
// the JSON/help switches the entry point handles before any verb runs.
export const GLOBAL_FLAGS = ['dir', 'json', 'help'];

function propertyNames(parameters) {
  return Object.keys(parameters?.properties ?? {});
}

/**
 * Flag names (without `--`) a registry entry accepts. For a verb with
 * sub-verbs the first positional picks the sub-verb's own schema; when it is
 * missing or unknown the union of all sub-verbs is returned.
 */
export function acceptedFlags(entry, positional = []) {
  // `retiredFlags` are not valid flags: the handler refuses each with its own
  // migration hint, which the generic unknown-flag message would replace.
  const names = new Set([...GLOBAL_FLAGS, ...(entry.retiredFlags ?? [])]);
  if (entry.subcommands) {
    const sub = positional[0];
    const subs = Object.hasOwn(entry.subcommands, sub)
      ? [entry.subcommands[sub]]
      : Object.values(entry.subcommands);
    for (const spec of subs) for (const n of propertyNames(spec.parameters)) names.add(n);
  } else {
    for (const n of propertyNames(entry.parameters)) names.add(n);
  }
  return names;
}

/**
 * Error message for the first flag in `flags` (parseArgs output) that `entry`
 * does not accept, or null when every flag is declared.
 */
export function unknownFlagMessage(entry, flags, positional = []) {
  // A missing or unknown sub-verb has no schema to check against: the handler
  // reports that (or a retired sub-verb's own pointer) itself.
  if (entry.subcommands && !Object.hasOwn(entry.subcommands, positional[0])) return null;
  const accepted = acceptedFlags(entry, positional);
  const unknown = Object.keys(flags).find((name) => !accepted.has(name));
  if (unknown === undefined) return null;
  const sub = entry.subcommands ? ` ${positional[0]}` : '';
  const hint = unknown.includes('=') ? ` (write "--${unknown.split('=')[0]} <value>", not "--name=value")` : '';
  const valid = [...accepted].filter((n) => !GLOBAL_FLAGS.includes(n) && !(entry.retiredFlags ?? []).includes(n)).map((n) => `--${n}`);
  return `unknown flag "--${unknown}" for "fgos ${entry.name}${sub}"${hint}. `
    + (valid.length > 0 ? `Valid flags: ${valid.join(', ')}, --dir, --json.` : 'It takes no flags besides --dir, --json.')
    + ` See "fgos ${entry.name}${sub} --help".`;
}
