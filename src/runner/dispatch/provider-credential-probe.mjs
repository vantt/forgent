// One real, cheap call made with a provider account's own credential, to learn whether that credential
// works now. Used to unlock an account that was locked for a dead login (provider-capacity.mjs): the
// owner logs in again by hand and fgOS only has to check that the account answers.
//
// The call runs against the account's home itself, not a copy. A login that rotates its refresh token
// when it renews would, in a throwaway copy, use the token up on the provider's side and leave the
// original stale; in the home the owner also uses, the renewed token lands where it belongs.
//
// Only the credential layouts fgOS can name are probed: a Codex home, and a pi account directory (a
// home-files source that carries `auth.json`). Any other layout answers "no probe", so the account stays
// locked for a person to clear, exactly as before.

import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import { AUTH_FAILURE_PATTERNS } from './provider-auth-failure.mjs';

const PROMPT = 'Reply with the single word OK.';
const OUTPUT_LIMIT = 16 * 1024;
const QUOTA_PATTERN = /usage limit|quota|rate limit/i;
export const DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS = 90 * 1000;

const expandHome = (home) => (typeof home === 'string' ? home.replace(/^\$\{HOME\}/, os.homedir()) : null);

/** The command that makes one call with this credential, or null when the layout is not one fgOS can probe. */
export function credentialProbeCommand(credentialSource) {
  const home = expandHome(credentialSource?.home);
  if (!home || !path.isAbsolute(home)) return null;
  if (credentialSource.kind === 'codex-home') {
    return {
      command: 'codex',
      args: ['exec', '--skip-git-repo-check', '-s', 'read-only', PROMPT],
      env: { CODEX_HOME: home },
    };
  }
  if (credentialSource.kind === 'home-files' && Array.isArray(credentialSource.files) && credentialSource.files.includes('auth.json')) {
    return {
      command: 'pi',
      args: ['-p', PROMPT, '--mode', 'json', '--tools', 'read', '--approve'],
      env: { PI_CODING_AGENT_DIR: home },
    };
  }
  return null;
}

/**
 * Judge what the call printed. A zero exit is not enough: a dead login can still end the process
 * quietly, so the text is read for the wordings that mean a credential or a quota problem.
 */
export function judgeProbeOutput({ exitCode, timedOut, output }) {
  if (timedOut) return { ok: false, detail: 'the call did not finish in time' };
  if (AUTH_FAILURE_PATTERNS.some((pattern) => pattern.test(output))) return { ok: false, detail: 'the login is still rejected' };
  if (QUOTA_PATTERN.test(output) && exitCode !== 0) return { ok: false, detail: 'the account answers with a usage limit' };
  if (exitCode !== 0) return { ok: false, detail: `the call exited with code ${exitCode}` };
  return { ok: true };
}

/** A probe function for `probeQuarantinedAccounts`. `spawnFn` is injectable for tests. */
export function createCredentialProbe({ spawnFn = spawn, timeoutMs = DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS, env = process.env } = {}) {
  return async function probeCredential({ account }) {
    const plan = credentialProbeCommand(account?.credentialSource);
    if (!plan) return { ok: false, detail: 'no probe exists for this credential layout' };
    return new Promise((resolve) => {
      let output = '';
      let timedOut = false;
      let child;
      try {
        child = spawnFn(plan.command, plan.args, { env: { ...env, ...plan.env }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
      } catch (err) {
        resolve({ ok: false, detail: `could not start ${plan.command}: ${err.message}` });
        return;
      }
      const collect = (chunk) => { if (output.length < OUTPUT_LIMIT) output += String(chunk); };
      child.stdout?.on('data', collect);
      child.stderr?.on('data', collect);
      const timer = setTimeout(() => {
        timedOut = true;
        try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch { /* already gone */ } }
      }, timeoutMs);
      child.on('error', (err) => { clearTimeout(timer); resolve({ ok: false, detail: `could not run ${plan.command}: ${err.message}` }); });
      child.on('close', (exitCode) => { clearTimeout(timer); resolve(judgeProbeOutput({ exitCode, timedOut, output })); });
    });
  };
}
