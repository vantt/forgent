// terminal-control-checks.mjs -- the doctor checks of the terminal-control
// component (docs/platform/terminal-control/spec.md, "Configuration" and
// "Failure cases"). `registrations.mjs` registers them; the bodies live here.
//
// Every check reads. Levels follow the doctor convention: `passed: false` fails,
// a message that starts with `warning:` warns, `info:` is informational,
// anything else passes.

import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { createTerminalControl, TerminalControlError } from '../terminal-control/client.mjs';
import { resolveTerminalConfig, terminalConfigProblems, terminalRouteConfig } from '../terminal-control/config.mjs';
import { resolveHerdrBin } from '../runner/dispatch/transport.mjs';
import { READY_TIMEOUT_MS } from '../runner/dispatch/herdr-deadlines.mjs';

/** `FGOS_HERDR_ANCHOR_PANE`, when set, must name a pane herdr can resolve: it is
 * the input of `attach`. Returns a failure message, a note to append, or `''`. */
function checkAnchorPane(bin, env) {
  const anchorPane = env.FGOS_HERDR_ANCHOR_PANE;
  if (anchorPane === undefined) return { note: '' };
  const trimmed = anchorPane.trim();
  if (!trimmed) return { failure: 'FGOS_HERDR_ANCHOR_PANE is empty' };
  try {
    const paneOut = execFileSync(bin, ['pane', 'get', trimmed], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 3000 });
    let parsed;
    try { parsed = JSON.parse(paneOut); } catch {}
    if (parsed?.error) {
      return { failure: `FGOS_HERDR_ANCHOR_PANE="${trimmed}" cannot be resolved: ${parsed.error.message || parsed.error.code}` };
    }
    return { note: `; anchor pane "${trimmed}" verified` };
  } catch (err) {
    return { failure: `FGOS_HERDR_ANCHOR_PANE="${trimmed}" cannot be resolved: ${err.message}` };
  }
}

function incarnationText(incarnation) {
  return incarnation ? `server pid ${incarnation.pid} at ${incarnation.endpoint}` : 'no server incarnation readable';
}

/**
 * terminal-control: the driver the port runs on, what it can do, which herdr
 * server it would talk to, and `terminal.*` after the merge (project over
 * global over default) with each value's source. The core refuses a layout
 * value it cannot run with and names it; the rules only Node can judge (grace
 * against the ready timeout, the retain time) are checked here. A missing herdr
 * only warns (direct mode does not use a terminal); a bad anchor pane or
 * `terminal.*` value fails.
 */
export function checkTerminalControl(repoRoot, { env = process.env, platform = process.platform, globalConfigPath, createClient } = {}) {
  const root = path.resolve(repoRoot);
  const herdrBin = resolveHerdrBin();
  const client = (config) => createClient?.(config) ?? createTerminalControl({ herdrBin, config });
  let explicit;
  try {
    resolveTerminalConfig(root, { globalConfigPath });
    explicit = terminalRouteConfig(root, { globalConfigPath });
  } catch (err) {
    return { passed: false, message: `terminal.* unreadable: ${err.message}` };
  }
  let report;
  let refused = null;
  try {
    try {
      report = client(explicit).capabilities();
    } catch (err) {
      if (!isConfigRefusal(err)) throw err;
      refused = `${err.routeMessage} (${err.code})`;
      report = client({}).capabilities();
    }
  } catch (err) {
    return { passed: true, message: `warning: the terminal-control route did not answer, so terminal mode and terminal.* cannot be judged here (${err.message}); direct mode is unaffected` };
  }
  const resolved = resolveTerminalConfig(root, { globalConfigPath, defaults: report.defaults });
  const problems = terminalConfigProblems(resolved.values, { readyTimeoutMs: READY_TIMEOUT_MS });
  if (refused) problems.push(`the core refused the layout: ${refused}`);
  const answered = report.result === 'capabilities';
  const { driver, capabilities, serverIncarnation } = report;
  const anchor = answered && capabilities.length > 0 ? checkAnchorPane(herdrBin, env) : { note: '' };
  if (anchor.failure) problems.push(`terminal-control driver ${driver} is available, but ${anchor.failure}`);
  if (problems.length > 0) return { passed: false, message: problems.join('; ') };
  if (!answered) return { passed: true, message: `warning: terminal-control answered ${report.result}${report.reason ? ` (${report.reason})` : ''}; direct mode is unaffected` };
  if (capabilities.length === 0) {
    const why = platform === 'win32'
      ? 'Windows has no herdr build, and terminal-control runs on herdr only'
      : `herdr is not usable (${herdrBin})`;
    return { passed: true, message: `warning: terminal mode unsupported: ${why}; direct mode unaffected` };
  }
  const shown = resolved.entries.map(({ name, value, source }) => `${name}=${JSON.stringify(value)} (${source})`).join(', ');
  const summary = `driver ${driver}, ${capabilities.length} capabilities (${capabilities.join(', ')}); ${incarnationText(serverIncarnation)}${anchor.note}; ${shown}`;
  if (!capabilities.includes('layout.geometry')) {
    return { passed: true, message: `info: ${summary}; this herdr cannot report pane geometry, so tabs fall back to the fixed split and only maxPanesPerTab applies` };
  }
  return { passed: true, message: summary };
}

const isConfigRefusal = (err) => err instanceof TerminalControlError && ['terminal-control-route-usage', 'terminal-config-below-floor'].includes(err.code);

const FINDING_TEXT = {
  'allocated-not-launched-bare-shell': 'a slot was allocated but never launched and its pane is a bare shell',
  'retain-expired': 'a retained pane is past its retain time',
  'stale-incarnation': 'a record belongs to a herdr server that is gone',
  unknown: 'a record could not be judged',
};

/**
 * terminal-allocations: slots past `allocationGraceMs` that never launched,
 * retained panes past their time. Reports only; nothing is closed.
 */
export function checkTerminalAllocations(repoRoot, { globalConfigPath, terminalControl } = {}) {
  const tc = terminalControl ?? createTerminalControl({ herdrBin: resolveHerdrBin() });
  let defaults;
  try {
    ({ defaults } = tc.capabilities());
  } catch (err) {
    return { passed: true, message: `warning: the terminal-control route did not answer, allocations not scanned (${err.message})` };
  }
  let grace;
  try {
    grace = resolveTerminalConfig(path.resolve(repoRoot), { globalConfigPath, defaults }).values.allocationGraceMs;
  } catch (err) {
    return { passed: true, message: `warning: terminal.* unreadable, allocations not scanned: ${err.message}` };
  }
  if (!Number.isInteger(grace) || grace < 0) {
    return { passed: true, message: 'warning: terminal.allocationGraceMs is invalid (see terminal-control), allocations not scanned' };
  }
  let scan;
  try {
    scan = tc.reconcileScan({ olderThanMs: grace });
  } catch (err) {
    return { passed: true, message: `warning: the terminal-control route did not answer, allocations not scanned (${err.message})` };
  }
  if (scan.result === 'unsupported') return { passed: true, message: `info: allocations not scanned: terminal mode is unsupported here (${scan.detail ?? scan.capability})` };
  if (scan.result !== 'scan') return { passed: true, message: `warning: allocation scan answered ${scan.result}${scan.reason ? ` (${scan.reason})` : ''}` };
  if (scan.findings.length === 0) return { passed: true, message: `no slot older than ${grace} ms is stuck and no retained pane is past its time` };
  const lines = scan.findings.map((f) => `${f.key}${f.paneId ? ` (pane ${f.paneId})` : ''}: ${FINDING_TEXT[f.kind] ?? f.kind}${f.detail ? ` (${f.detail})` : ''}`);
  return { passed: true, message: `warning: ${scan.findings.length} slot(s) need a person; nothing was closed: ${lines.join('; ')}` };
}
