/**
 * scripts/lib/mailbox-role-recorder.mjs
 *
 * The recording endpoint of the pi/omp role probes (docs/platform/agent-mailbox/spec.md §7):
 * a harness instrument, never a model. A CLI whose provider base URL points here sends its
 * request; the endpoint keeps the request (path, header names, parsed body; never a header
 * value, so no credential is kept) in a 0600 file inside the run directory and answers in the
 * OpenAI Responses stream shape with a scripted exchange: while the input holds no tool call,
 * one function call running `ls`; after it, the final text `done`. Reading which input item
 * carried an injected marker gives the role each injection method reaches the provider under.
 * Node built-ins only.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';

/** The scripted tool call: the bash tool running `ls`. */
export const SCRIPTED_CALL = Object.freeze({ name: 'bash', arguments: JSON.stringify({ command: 'ls' }) });
export const FINAL_TEXT = 'done';

const usage = { input_tokens: 10, input_tokens_details: { cached_tokens: 0 }, output_tokens: 5, output_tokens_details: { reasoning_tokens: 0 }, total_tokens: 15 };

/**
 * The events of one scripted response: `forced`, a function call the caller names, when given;
 * else the bash tool running `ls` when `input` holds no function call yet; else the final text.
 */
export function scriptedEvents(input, n, forced = null) {
  const id = `resp_${n}`;
  const called = !forced && (input ?? []).some((item) => item?.type === 'function_call');
  const call = forced ?? SCRIPTED_CALL;
  const item = called
    ? { type: 'message', id: `msg_${n}`, role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: FINAL_TEXT, annotations: [] }] }
    : { type: 'function_call', id: `fc_${n}`, call_id: `call_${n}`, status: 'completed', ...call };
  const added = called ? { ...item, status: 'in_progress', content: [] } : { ...item, status: 'in_progress', arguments: '' };
  const response = { id, object: 'response', status: 'in_progress', model: 'recorder', output: [] };
  const events = [
    { type: 'response.created', response },
    { type: 'response.in_progress', response },
    { type: 'response.output_item.added', output_index: 0, item: added },
  ];
  if (called) {
    events.push(
      { type: 'response.content_part.added', output_index: 0, item_id: item.id, content_index: 0, part: { type: 'output_text', text: '', annotations: [] } },
      { type: 'response.output_text.delta', output_index: 0, item_id: item.id, content_index: 0, delta: FINAL_TEXT },
      { type: 'response.output_text.done', output_index: 0, item_id: item.id, content_index: 0, text: FINAL_TEXT },
      { type: 'response.content_part.done', output_index: 0, item_id: item.id, content_index: 0, part: item.content[0] },
    );
  } else {
    events.push(
      { type: 'response.function_call_arguments.delta', output_index: 0, item_id: item.id, delta: item.arguments },
      { type: 'response.function_call_arguments.done', output_index: 0, item_id: item.id, arguments: item.arguments },
    );
  }
  events.push({ type: 'response.output_item.done', output_index: 0, item }, { type: 'response.completed', response: { ...response, status: 'completed', output: [item], usage } });
  return events;
}

/** A request body decoded by its content encoding (the Codex providers compress with zstd). */
function decode(buffer, encoding) {
  switch ((encoding ?? '').toLowerCase()) {
    case 'zstd':
      return zlib.zstdDecompressSync(buffer);
    case 'gzip':
      return zlib.gunzipSync(buffer);
    case 'br':
      return zlib.brotliDecompressSync(buffer);
    case 'deflate':
      return zlib.inflateSync(buffer);
    default:
      return buffer;
  }
}

/** The events of a server-sent event stream, parsed. */
export const parseSse = (text) => text.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6)).filter((d) => d !== '[DONE]').map((d) => JSON.parse(d));

/**
 * Starts the endpoint on 127.0.0.1 (a free port) writing into `dir`. `callFor(body)` may name
 * the function call that answers a request (a subagent probe's `task` and `wait` calls); null
 * keeps the script. Returns
 * its `url`, `requests()` (the kept files, in arrival order) and `close()`.
 */
export async function startRecorder({ dir, callFor = () => null }) {
  fs.mkdirSync(dir, { recursive: true });
  const kept = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const n = kept.length + 1;
      const raw = decode(Buffer.concat(chunks), req.headers['content-encoding']).toString('utf8');
      let body = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        body = { unparsed: raw.length };
      }
      const file = path.join(dir, `request-${String(n).padStart(3, '0')}.json`);
      fs.writeFileSync(file, `${JSON.stringify({ n, method: req.method, path: req.url, headerNames: Object.keys(req.headers).sort(), contentEncoding: req.headers['content-encoding'] ?? null, body }, null, 2)}\n`, { mode: 0o600 });
      kept.push(file);
      if (req.method !== 'POST' || !/\/responses$/.test(req.url.split('?')[0])) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end('{"error":{"message":"not served by the recorder"}}');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      for (const event of scriptedEvents(body?.input, n, callFor(body))) res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      res.end();
    });
  });
  // A websocket upgrade is refused (logged as a request line), so a client falls back to HTTP.
  server.on('upgrade', (req, socket) => {
    const n = kept.length + 1;
    const file = path.join(dir, `request-${String(n).padStart(3, '0')}.json`);
    fs.writeFileSync(file, `${JSON.stringify({ n, method: req.method, path: req.url, upgrade: true, headerNames: Object.keys(req.headers).sort(), body: null }, null, 2)}\n`, { mode: 0o600 });
    kept.push(file);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    requests: () => [...kept],
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.();
      server.close(() => resolve());
    }),
  };
}

/**
 * Per kept request that carries `marker`, the carriers: `instructions` for the system prompt,
 * else `<item type>:<role>` of each input item holding it (`function_call_output:` for a tool
 * output). Requests are numbered from 1.
 */
export function rolesCarrying(requests, marker) {
  return requests.flatMap((r, i) => {
    const body = r.body ?? {};
    const carriers = [
      ...(JSON.stringify(body.instructions ?? '').includes(marker) ? ['instructions'] : []),
      ...(Array.isArray(body.input) ? body.input : []).filter((item) => JSON.stringify(item).includes(marker)).map((item) => `${item.type ?? 'message'}:${item.role ?? ''}`),
    ];
    return carriers.length ? [{ request: i + 1, carriers }] : [];
  });
}
