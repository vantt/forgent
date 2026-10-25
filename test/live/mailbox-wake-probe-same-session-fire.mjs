#!/usr/bin/env node
/**
 * test/live/mailbox-wake-probe-same-session-fire.mjs
 *
 * Fires the raw socket write (no `from_mode`) into a probe's already-started Claude Code
 * session and watches it for 60 s, the way `mailbox-wake-probe.live.mjs run` watches a fire.
 * It spends no new session. It was used once, for W7 on 2026-10-24: that probe's first prompt was
 * swallowed by `--allowedTools`, so the head never registered and the probe timed out before
 * firing, and the K1 question needs only the session's socket.
 * Writes `<probe dir>/result-same-session-fire.json`.
 *
 * Usage: node test/live/mailbox-wake-probe-same-session-fire.mjs <probe dir> <herdr pane id>
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as wake from '../../scripts/lib/mailbox-wake-probe.mjs';
import * as runs from '../../scripts/lib/mailbox-behaviour-run.mjs';

const [dir, pane] = process.argv.slice(2);
if (!dir || !pane) {
  process.stderr.write('usage: mailbox-wake-probe-same-session-fire.mjs <probe dir> <herdr pane id>\n');
  process.exit(2);
}
const home = path.join(dir, 'home');
const sessions = path.join(home, '.claude', 'sessions');
const sessionFile = path.join(sessions, fs.readdirSync(sessions).find((f) => /^\d+\.json$/.test(f)));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const status = () => {
  try {
    return JSON.parse(fs.readFileSync(sessionFile, 'utf8')).status;
  } catch {
    return null;
  }
};
const screen = () => spawnSync('herdr', ['pane', 'read', pane, '--source', 'visible'], { encoding: 'utf8' }).stdout ?? '';
const focus = () => wake.focusedPanes(JSON.parse(spawnSync('herdr', ['pane', 'list'], { encoding: 'utf8' }).stdout));

const out = { statusBefore: status(), focusBefore: focus(), samples: [] };
const line = wake.socketLine();
out.fired = { ...(await wake.writeSocket(wake.socketOf(sessionFile, dir), line)), socketLine: line.trimEnd() };
let dialog = null;
for (const end = out.fired.at + 60_000; Date.now() < end; await sleep(wake.SAMPLE_MS)) {
  out.samples.push({ at: Date.now(), status: status() });
  const turn = wake.turnAfter(runs.modelRecords('claude', home), out.fired.at);
  if (out.samples.length % 4 === 0) dialog = dialog ?? wake.dialogOn(screen());
  if (turn.started || dialog) break;
}
await sleep(4_000);
out.turn = wake.turnAfter(runs.modelRecords('claude', home), out.fired.at);
out.dialog = dialog ?? wake.dialogOn(screen());
out.focusAfter = focus();
out.screen = screen().split('\n').filter((l) => l.trim()).slice(-16);
out.verdict = wake.verdict({ started: out.turn.started, dialog: out.dialog, focusBefore: out.focusBefore, focusAfter: out.focusAfter });
fs.writeFileSync(path.join(dir, 'result-same-session-fire.json'), JSON.stringify(out, null, 2));
process.stdout.write(`${JSON.stringify({ statusBefore: out.statusBefore, fired: out.fired, turn: out.turn, dialog: out.dialog, verdict: out.verdict })}\n`);
