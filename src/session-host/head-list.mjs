// Session Host's read-only join: Identity owns live holders; placement owns sleeping and retired heads.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';
import { HeadStartError, lineageDirOf, readHeadPlacement } from './head-start.mjs';

function identitySessions(projectRoot) {
  const { bin } = resolveActiveHostBin();
  if (!bin) throw new HeadStartError('identity-unavailable', 'no fgos host binary found to list sessions');
  const run = spawnSync(bin, ['identity', 'list', '--project', '--json'], { cwd: projectRoot, env: routeEnv(), encoding: 'utf8', timeout: 20_000 });
  if (run.error || run.status !== 0) throw new HeadStartError('identity-unavailable', `Identity did not list sessions: ${run.error?.message ?? run.stderr}`);
  let answer;
  try { answer = JSON.parse(run.stdout); } catch { /* unreadable answers are not an empty live directory */ }
  const sessions = (answer?.data ?? answer)?.sessions;
  if (!Array.isArray(sessions)) throw new HeadStartError('identity-unavailable', 'Identity returned no sessions list');
  return sessions;
}

/** Reads only. `ports.identity(projectRoot)` supplies Identity's project sessions in tests. */
export async function listHeads({ projectRoot }, ports = {}) {
  const sessions = await (ports.identity ?? identitySessions)(projectRoot);
  // Identity lists unknown liveness too: it is not proof a holder ended. Remote entries are not local holders.
  const holders = new Map();
  for (const session of sessions) {
    if (session.liveness === 'remote' || session.liveness === 'dead') continue;
    const roles = (session.roles ?? []).filter((role) => role.startsWith('head:') || role.startsWith('lead:'));
    for (const role of roles) holders.set(role, session);
  }
  const dir = path.dirname(lineageDirOf(projectRoot, 'lead', 'list'));
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (err) { if (err.code !== 'ENOENT') throw err; }
  const rows = new Map();
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const record = readHeadPlacement(path.join(dir, entry.name));
    if (!record?.role) continue;
    const holder = holders.get(record.role) ?? [...holders.values()].find((s) => {
      const head = s.ids?.head;
      return head && `${head.persona}-${head.name}` === entry.name;
    });
    const row = { role: record.role, persona: record.persona, state: holder ? 'live' : record.retiredReason === 'sleep' ? 'sleeping' : 'retired', startedAt: record.startedAt };
    if (!holder) for (const key of ['wakeAt', 'plan', 'phase', 'retiredAt']) if (record[key] != null) row[key] = record[key];
    rows.set(record.role, row);
    if (holder) for (const [role, s] of holders) if (s === holder) holders.delete(role);
  }
  // Heads without a placement (and hand-started short-role leads) still appear from Identity.
  for (const [role, session] of holders) {
    rows.set(role, { role, persona: session.ids?.head?.persona ?? null, state: 'live', startedAt: session.registeredAt });
  }
  return [...rows.values()].sort((a, b) => a.role.localeCompare(b.role));
}
