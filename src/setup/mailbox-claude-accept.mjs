// Whether Claude Code accepts cross-session input, the setting a mailbox wake needs: the mailbox
// writes its fixed nudge line to an idle Claude session's own socket only when that session accepts
// (`crossSessionInbound: accept`); a raw write to one that does not is held behind a dialog.
// The accept lives in the user-level settings file of the Claude config dir (a repository file can
// only tighten it), which a running session re-reads, so turning it on reaches live sessions.
// Accepting widens what may reach a person's session, so fgOS never writes it: `fgos doctor` reports
// it and `fgos wire-agents` shows the edit (src/setup/agent-wiring.mjs).
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
  if (state === 'unreadable') return { passed: false, message: `${location.file} cannot be read as a JSON object; fix it by hand` };
  return { passed: true, message: `${location.file} keeps Claude Code's default for cross-session input, so mail reaches a Claude session at its next tool call or stop. Accepting it globally lets any same-user process start a turn in your sessions (docs/platform/agent-mailbox/spec.md section 7.2), so fgOS never sets it; \`fgos wire-agents\` shows the edit if you want it` };
}
