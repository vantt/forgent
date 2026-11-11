// paseo-checks.mjs — doctor readiness of the paseo carrier (adapter `paseo-spawn`).
//
// Readiness only, no repair: paseo's config is the user's, so a missing provider is reported with the
// entry to add, never written. Fails only when an invocation runs through paseo and the daemon answers
// without the provider it needs; a daemon that does not answer only warns (it may simply not be running).

import { spawnSync } from 'node:child_process';
import { execLinkPath, paseoProviderId, resolvePaseoBin } from '../runner/dispatch/paseo-launch.mjs';
import { commandCli } from '../runner/dispatch/provider-capacity.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';

/** `executor/invocation` and the CLI of every invocation that runs through paseo. */
export function paseoInvocationsOf(runnerCfg = {}) {
  const found = [];
  for (const [id, executor] of Object.entries(runnerCfg.executors ?? {})) {
    for (const inv of executor?.invocations ?? []) {
      if (inv?.adapter !== 'paseo-spawn') continue;
      found.push({ name: `${id}/${inv.id ?? '(unnamed)'}`, cli: commandCli(inv.command ?? executor.command) });
    }
  }
  return found;
}

/** The providers the paseo daemon lists, as `{ok, providers: [{provider, status}], detail}`. */
export function askPaseoProviders({ env = process.env } = {}) {
  const bin = resolvePaseoBin(env);
  const out = spawnSync(bin, ['provider', 'ls', '--json'], { env, encoding: 'utf8', timeout: 15_000 });
  if (out.status !== 0) return { ok: false, detail: `${bin} provider ls exited ${out.status ?? out.error?.code ?? 'by a signal'}: ${(out.stderr || '').trim().split('\n').pop() || 'no output'}` };
  try {
    const parsed = JSON.parse(out.stdout);
    return { ok: true, providers: Array.isArray(parsed) ? parsed : parsed.providers ?? [] };
  } catch {
    return { ok: false, detail: `${bin} provider ls printed no JSON` };
  }
}

/** The provider entry paseo's config needs for `cli` (under `agents.providers`). */
export function providerEntryFor(cli, stateRoot) {
  return JSON.stringify({ [paseoProviderId(cli)]: { extends: cli, label: `${cli} (fgOS)`, command: [execLinkPath(stateRoot, cli)] } });
}

export function checkPaseoExecutors(runnerCfg, { ask = askPaseoProviders, stateRoot = resolveStateRoot().stateRoot } = {}) {
  const users = paseoInvocationsOf(runnerCfg);
  if (users.length === 0) return { passed: true, message: 'no invocation runs through paseo' };
  const answer = ask();
  if (!answer.ok) {
    return { passed: true, message: `warning: invocation(s) ${users.map((u) => u.name).join(', ')} run through paseo, and the paseo daemon did not answer (${answer.detail}); start it with \`paseo daemon start\`` };
  }
  const missing = [];
  for (const { name, cli } of users) {
    const provider = answer.providers.find((p) => p?.provider === paseoProviderId(cli));
    if (!provider) missing.push(`${name} needs provider ${paseoProviderId(cli)}: add to agents.providers in paseo's config.json ${providerEntryFor(cli, stateRoot)}`);
    else if (provider.status !== 'available') missing.push(`${name}: provider ${paseoProviderId(cli)} is ${provider.status} (its command ${execLinkPath(stateRoot, cli)} is created by the first launch)`);
  }
  if (missing.length > 0) return { passed: false, message: missing.join('; ') };
  return { passed: true, message: `paseo serves ${[...new Set(users.map((u) => paseoProviderId(u.cli)))].join(', ')} for ${users.map((u) => u.name).join(', ')}` };
}
