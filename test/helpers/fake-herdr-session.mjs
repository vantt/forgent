// test/helpers/fake-herdr-session.mjs -- the smallest fake herdr a terminal-control
// route needs to allocate a pane, keep it, and later be asked whether it is open.
//
// Point FGOS_HERDR_BIN at `bin`. Panes are plain ids kept in a file; `open(id)` and
// `close(id)` change what `pane get` answers (`pane_not_found` once closed), so a test
// plays "the person closed the pane" without a process. Every call is logged with the
// HERDR_SESSION it was made under, which is how a test proves which server was asked.

import fs from 'node:fs';
import path from 'node:path';

const SCRIPT = String.raw`
import fs from 'node:fs';
import path from 'node:path';
const dir = process.env.FAKE_HERDR_SESSION_DIR;
const args = process.argv.slice(2);
fs.appendFileSync(path.join(dir, 'calls.jsonl'), JSON.stringify({ args, session: process.env.HERDR_SESSION ?? null, socket: process.env.HERDR_SOCKET_PATH ?? null }) + '\n');
const open = () => new Set(fs.readFileSync(path.join(dir, 'open'), 'utf8').split('\n').filter(Boolean));
const save = (set) => fs.writeFileSync(path.join(dir, 'open'), [...set].join('\n'));
const ok = (result) => { console.log(JSON.stringify({ id: 'cli:mock', result })); process.exit(0); };
const fail = (code) => { console.error(JSON.stringify({ error: { code, message: code }, id: 'cli:mock' })); process.exit(1); };
if (args[0] === '--version') { console.log('herdr 0.9.1-fake'); process.exit(0); }
if (args[0] === 'pane' && args[1] === 'layout' && args[2] === '--help') process.exit(0);
if (args[0] === 'tab' && args[1] === 'create') {
  const queue = fs.readFileSync(path.join(dir, 'next'), 'utf8').split('\n').filter(Boolean);
  const pane = queue.shift();
  if (!pane) fail('no_pane_queued');
  fs.writeFileSync(path.join(dir, 'next'), queue.join('\n'));
  const set = open(); set.add(pane); save(set);
  ok({ tab: { tab_id: 'tab-of-' + pane }, root_pane: { pane_id: pane } });
}
if (args[0] === 'pane' && args[1] === 'get') (open().has(args[2]) ? ok({ pane: { pane_id: args[2] } }) : fail('pane_not_found'));
if (args[0] === 'pane' && args[1] === 'process-info') (open().has(args[3]) ? ok({ process_info: { pane_id: args[3], shell_pid: 100, foreground_process_group_id: 100, foreground_processes: [{ pid: 100, argv: ['zsh'] }] } }) : fail('pane_not_found'));
if (args[0] === 'pane' && args[1] === 'close') {
  const set = open();
  if (!set.has(args[2])) fail('pane_not_found');
  set.delete(args[2]); save(set);
  ok({ closed: true });
}
ok({});
`;

/**
 * @param {string} dir scratch directory
 * @param {{ queue?: string[] }} [options] pane ids `tab create` hands out, in order
 */
export function createSessionFake(dir, { queue = [] } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const script = path.join(dir, 'fake-herdr-session.mjs');
  const bin = path.join(dir, 'fake-herdr-session.sh');
  fs.writeFileSync(script, SCRIPT);
  fs.writeFileSync(path.join(dir, 'open'), '');
  fs.writeFileSync(path.join(dir, 'next'), queue.join('\n'));
  fs.writeFileSync(path.join(dir, 'calls.jsonl'), '');
  fs.writeFileSync(bin, `#!/bin/sh\nFAKE_HERDR_SESSION_DIR=${JSON.stringify(dir)} exec node "${script}" "$@"\n`, { mode: 0o755 });
  const read = () => fs.readFileSync(path.join(dir, 'open'), 'utf8').split('\n').filter(Boolean);
  const write = (ids) => fs.writeFileSync(path.join(dir, 'open'), ids.join('\n'));
  return {
    bin,
    calls: () => fs.readFileSync(path.join(dir, 'calls.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)),
    /** The sessions herdr was asked under, in order. */
    askedSessions: () => fs.readFileSync(path.join(dir, 'calls.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).session),
    open: (id) => write([...new Set([...read(), id])]),
    close: (id) => write(read().filter((p) => p !== id)),
  };
}
