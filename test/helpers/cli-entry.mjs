// Which entry answers a CLI test's call: the Rust host for a help token, a native verb, or a native sub-verb of a
// partly native verb; the Node payload for everything else. The data is the generated route file, so a verb that
// moves to the host moves here with no edit.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROUTES = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../packages/host-runtime/contracts/command-routes.json'), 'utf8'));
const HELP_TOKENS = new Set(['--help', '-h']);

/** `'host'` or `'node'`: who answers `args`. */
export function cliEntryFor(args, routes = ROUTES) {
  if (args.some((arg) => HELP_TOKENS.has(arg))) return 'host';
  const positionals = args.filter((arg) => !arg.startsWith('-'));
  const route = routes[positionals[0]];
  if (route?.route_kind === 'native') return 'host';
  if (positionals.length > 1 && route?.native_subcommands?.includes(positionals[1])) return 'host';
  return 'node';
}

/** What a staged host needs of its caller's environment to find its release and its Node payload. */
const HOST_VARIABLES = ['FGOS_HOST_BIN', 'FGOS_ACTIVE_RELEASE_PATH', 'FGOS_ACTIVE_MANIFEST_PATH'];

/**
 * The process an fgos call runs as on the entry that answers it: the staged host (`FGOS_HOST_BIN`) or `fgosMjs`
 * under Node, as `{ command, args, env }` for `spawn` or `spawnSync`.
 */
export function fgosProcess(fgosMjs, args, env = process.env) {
  if (cliEntryFor(args) === 'host') {
    const hostEnv = { ...env };
    // A variable the caller names (even as undefined) is the caller's; one it does not name comes from this process.
    for (const name of HOST_VARIABLES) if (!(name in hostEnv)) hostEnv[name] = process.env[name];
    if (!hostEnv.FGOS_HOST_BIN) {
      throw new Error(`fgos ${args.join(' ')} is answered by the Rust host, but FGOS_HOST_BIN is not set; run this file through node scripts/run-tests.mjs <file>`);
    }
    return { command: hostEnv.FGOS_HOST_BIN, args, env: hostEnv };
  }
  return { command: process.execPath, args: [fgosMjs, ...args], env };
}

/** `spawnSync` of an fgos call on the entry that answers it: the staged host (`FGOS_HOST_BIN`) or `fgosMjs` under Node. */
export function spawnFgos(fgosMjs, args, options = {}) {
  const { command, args: argv, env } = fgosProcess(fgosMjs, args, options.env ?? process.env);
  return spawnSync(command, argv, { ...options, env });
}
