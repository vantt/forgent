// @ts-nocheck
// mailbox-role-probe-ext.ts — the pi/omp extension of the role probes (test/live/mailbox-behaviour.live.mjs
// `role-probe`), run against the recording endpoint only (scripts/lib/mailbox-role-recorder.mjs), never a
// model. At the first tool result it injects the marker `MARK-<method>` through the method named in
// MBX_METHOD, and it logs to MBX_LOG what the probes read: the API's member names, each session id it sees,
// the tools the CLI offers (MCP ones included), the process and its parent, and whether a session is a subagent's (its header names a parent session).
import fs from 'node:fs';

const LOG = process.env.MBX_LOG;
const log = (o) => fs.appendFileSync(LOG, `${JSON.stringify({ t: Date.now(), ...o })}\n`);
const names = (o) => {
  const s = new Set();
  for (let p = o; p && p !== Object.prototype; p = Object.getPrototypeOf(p)) for (const k of Object.getOwnPropertyNames(p)) s.add(`${k}${typeof o[k] === 'function' ? '()' : ''}`);
  return [...s].sort();
};
const proc = (pid) => {
  try {
    return { exe: fs.readlinkSync(`/proc/${pid}/exe`), comm: fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim() };
  } catch {
    return null;
  }
};
const self = () => ({ pid: process.pid, self: proc('self'), parent: proc(process.ppid), FGOS_SESSION_ID: process.env.FGOS_SESSION_ID ?? null });
const parentSession = (ctx) => {
  try {
    return typeof ctx?.sessionManager?.getHeader?.()?.parentSession === 'string';
  } catch {
    return null;
  }
};

export default function (api) {
  const method = process.env.MBX_METHOD || 'none';
  const mark = `MARK-${method}`;
  const [kind, as] = method.split(':');
  let fired = false;
  log({ at: 'load', proc: self(), api: names(api) });
  api.on('session_start', async (_e, ctx) => log({ at: 'session_start', id: ctx?.sessionManager?.getSessionId?.(), subagent: parentSession(ctx) }));
  api.on('before_agent_start', async (e) => {
    if (method === 'system') return { systemPrompt: `${e.systemPrompt}\n${mark}` };
  });
  api.on('context', async (e) => {
    if (!fired) return;
    if (method === 'context') return { messages: [...e.messages, { role: 'custom', customType: 'fgos-mailbox', content: mark, display: false, timestamp: Date.now() }] };
    if (method === 'context-developer') return { messages: [...e.messages, { role: 'developer', content: [{ type: 'text', text: mark }], timestamp: Date.now() }] };
  });
  api.on('context_with_system', async (e) => {
    if (!fired || method !== 'context-with-system') return;
    const [sys, ...rest] = e.messages;
    return { messages: [{ ...sys, content: typeof sys.content === 'string' ? `${sys.content}\n${mark}` : [...sys.content, { type: 'text', text: mark }] }, ...rest] };
  });
  api.on('before_provider_request', async (e) => {
    if (!fired || method !== 'provider-request' || !Array.isArray(e?.payload?.input)) return;
    e.payload.input.push({ type: 'message', role: 'developer', content: [{ type: 'input_text', text: mark }] });
    return e.payload;
  });
  api.on('tool_result', async (e, ctx) => {
    try {
      log({ at: 'tools', all: (api.getAllTools?.() ?? []).map((t) => t?.name ?? t) });
    } catch (error) {
      log({ at: 'error', method: 'getAllTools', error: String(error?.message ?? error) });
    }
    log({ at: 'tool_result', tool: e?.toolName, id: ctx?.sessionManager?.getSessionId?.(), subagent: parentSession(ctx), proc: self() });
    if (fired) return;
    fired = true;
    if (method === 'tool-result') return { content: [...(e.content ?? []), { type: 'text', text: mark }] };
    try {
      if (kind === 'sendMessage') await api.sendMessage({ customType: 'fgos-mailbox', content: mark, display: false }, as && as !== 'none' ? { deliverAs: as } : undefined);
      if (kind === 'sendUserMessage') await api.sendUserMessage(mark, as && as !== 'none' ? { deliverAs: as } : undefined);
    } catch (error) {
      log({ at: 'error', method, error: String(error?.message ?? error) });
    }
  });
}
