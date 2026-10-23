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
 * terminal-control: the driver the port runs on, what it can do, and which
 * herdr server it would talk to. A missing herdr is a warning (direct mode
 * does not use a terminal); a bad anchor pane fails.
 */
export function checkTerminalControl({ env = process.env, terminalControl, platform = process.platform } = {}) {
  const herdrBin = resolveHerdrBin();
  let report;
  try {
    report = (terminalControl ?? createTerminalControl({ herdrBin })).capabilities();
  } catch (err) {
    return { passed: true, message: `warning: the terminal-control route did not answer, so terminal mode cannot be judged here (${err.message}); direct mode is unaffected` };
  }
  if (report.result !== 'capabilities') {
    return { passed: true, message: `warning: terminal-control answered ${report.result}${report.reason ? ` (${report.reason})` : ''}; direct mode is unaffected` };
  }
  const { driver, capabilities, serverIncarnation } = report;
  if (capabilities.length === 0) {
    const why = platform === 'win32'
      ? 'Windows has no herdr build, and terminal-control runs on herdr only'
      : `herdr is not usable (${herdrBin})`;
    return { passed: true, message: `warning: terminal mode unsupported: ${why}; direct mode unaffected` };
  }
  const anchor = checkAnchorPane(herdrBin, env);
  if (anchor.failure) return { passed: false, message: `terminal-control driver ${driver} is available, but ${anchor.failure}` };
  const summary = `driver ${driver}, ${capabilities.length} capabilities (${capabilities.join(', ')}); ${incarnationText(serverIncarnation)}${anchor.note}`;
  if (!capabilities.includes('layout.geometry')) {
    return { passed: true, message: `info: ${summary}; this herdr cannot report pane geometry, so tabs fall back to the fixed split and only maxPanesPerTab applies` };
  }
  return { passed: true, message: summary };
}

/**
 * terminal-config: `terminal.*` after the merge (project over global over
 * default), each value with its source. The core refuses a layout value it
 * cannot run with and names it; the two rules only Node can judge are checked here.
 */
export function checkTerminalConfig(repoRoot, { globalConfigPath, createClient } = {}) {
  const root = path.resolve(repoRoot);
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
      report = (createClient?.(explicit) ?? createTerminalControl({ herdrBin: resolveHerdrBin(), config: explicit })).capabilities();
    } catch (err) {
      if (!isConfigRefusal(err)) throw err;
      refused = `${err.routeMessage} (${err.code})`;
      report = (createClient?.({}) ?? createTerminalControl({ herdrBin: resolveHerdrBin(), config: {} })).capabilities();
    }
  } catch (err) {
    return { passed: true, message: `warning: the terminal-control route did not answer, so terminal.* cannot be judged here (${err.message})` };
  }
  const resolved = resolveTerminalConfig(root, { globalConfigPath, defaults: report.defaults });
  const problems = terminalConfigProblems(resolved.values, { readyTimeoutMs: READY_TIMEOUT_MS });
  if (refused) problems.push(`the core refused the layout: ${refused}`);
  if (problems.length > 0) return { passed: false, message: problems.join('; ') };
  const shown = resolved.entries.map(({ name, value, source }) => `${name}=${JSON.stringify(value)} (${source})`).join(', ');
  return { passed: true, message: shown };
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
    return { passed: true, message: 'warning: terminal.allocationGraceMs is invalid (see terminal-config), allocations not scanned' };
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
  const lines = scan.findings.map((f) => `${f.key}: ${FINDING_TEXT[f.kind] ?? f.kind}${f.detail ? ` (${f.detail})` : ''}`);
  return { passed: true, message: `warning: ${scan.findings.length} slot(s) need a person; nothing was closed: ${lines.join('; ')}` };
}
