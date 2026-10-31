// Whether Claude Code accepts cross-session input, the setting a mailbox wake needs: the mailbox
// writes its fixed nudge line to an idle Claude session's own socket only when that session accepts
// (`crossSessionInbound: accept`); a raw write to one that does not is held behind a dialog.
// The accept lives in the user-level settings file of the Claude config dir (a repository file can
// only tighten it), which a running session re-reads, so turning it on reaches live sessions.
// `fgos doctor` reports it and `--fix` writes that one key and nothing else.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { mailboxOptIn } from './mailbox-limits.mjs';

const KEY = 'crossSessionInbound';

/** The Claude config dir and its user-level settings file, as Claude Code itself resolves them. */
export function claudeUserSettings({ env = process.env, home = os.homedir() } = {}) {
  const dir = env.CLAUDE_CONFIG_DIR || path.join(home, '.claude');
  return { dir, file: path.join(dir, 'settings.json') };
}

/** `accept`, `hold` (a choice of the person's own), another value, no key, no file, or unreadable. */
export function readAccept(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    return { state: err.code === 'ENOENT' ? 'absent' : 'unreadable' };
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch {
    return { state: 'unreadable' };
  }
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return { state: 'unreadable' };
  if (!(KEY in doc)) return { state: 'absent', doc };
  if (doc[KEY] === 'accept') return { state: 'accept', doc };
  return { state: doc[KEY] === 'hold' ? 'hold' : 'other', doc };
}

export function checkMailboxClaudeAccept(cwd, { location = claudeUserSettings(), optIn = () => mailboxOptIn(cwd) } = {}) {
  if (optIn().state !== 'on') return { passed: true, message: 'mailbox is not enabled here; no accept needed' };
  if (!fs.existsSync(location.dir)) return { passed: true, message: `no Claude Code config dir at ${location.dir}; nothing to set` };
  const { state } = readAccept(location.file);
  if (state === 'accept') return { passed: true, message: `${location.file} accepts cross-session input: an idle Claude session is woken by mail` };
  if (state === 'hold') return { passed: true, message: `${location.file} holds cross-session input by your choice: mail reaches a Claude session only at its next tool call` };
  if (state === 'unreadable') return { passed: false, message: `${location.file} cannot be read as a JSON object; fix it by hand, then run fgos doctor --fix` };
  return { passed: false, message: `${location.file} does not accept cross-session input, so an idle Claude session is not woken by mail (fgos doctor --fix writes ${KEY}: "accept"; remove the key to undo)` };
}

/** Writes `crossSessionInbound: accept` and leaves every other key as it was; never replaces a `hold` or an unreadable file. */
export function fixMailboxClaudeAccept(cwd, { location = claudeUserSettings(), optIn = () => mailboxOptIn(cwd) } = {}) {
  if (optIn().state !== 'on') return { fixed: false, message: 'skipped: mailbox is not enabled here' };
  const read = readAccept(location.file);
  if (read.state === 'accept') return { fixed: true, message: `${location.file} already accepts` };
  if (read.state === 'hold') return { fixed: false, message: `skipped: ${location.file} holds by your choice; change ${KEY} yourself to accept` };
  if (read.state === 'unreadable') return { fixed: false, message: `skipped: ${location.file} cannot be read as a JSON object` };
  const doc = { ...(read.doc ?? {}), [KEY]: 'accept' };
  fs.mkdirSync(location.dir, { recursive: true });
  let mode = 0o600;
  try {
    mode = fs.statSync(location.file).mode & 0o777;
  } catch {
    // a new file keeps the private default
  }
  const temp = `${location.file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(doc, null, 2)}\n`, { mode });
  fs.renameSync(temp, location.file);
  return { fixed: true, message: `wrote ${KEY}: "accept" to ${location.file}; remove the key to undo` };
}
