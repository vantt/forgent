#!/usr/bin/env node
// mailbox-mcp-probe-server.mjs — a stdio MCP server planted by the pi/omp MCP-off falsifier
// (test/live/mailbox-behaviour.live.mjs `mcp-probe`): it offers one tool, `mbx_planted_probe`,
// so a CLI that connected to it lists that tool in its provider request. Node built-ins only.
import readline from 'node:readline';

const reply = (id, result) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
readline.createInterface({ input: process.stdin }).on('line', (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  if (msg.id === undefined) return;
  if (msg.method === 'initialize') reply(msg.id, { protocolVersion: msg.params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'mbx-planted', version: '1.0.0' } });
  else if (msg.method === 'tools/list') reply(msg.id, { tools: [{ name: 'mbx_planted_probe', description: 'A planted probe tool.', inputSchema: { type: 'object', properties: {} } }] });
  else if (msg.method === 'tools/call') reply(msg.id, { content: [{ type: 'text', text: 'planted' }] });
  else process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'not served' } })}\n`);
});
