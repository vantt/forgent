import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot } from './paths.mjs';
import { ensureRunnerConfigForDir } from './dispatch/config.mjs';
import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { listWork } from '../state/store.mjs';
import { hasWorkerSlotRoom } from '../state/worker-slots.mjs';
import { compileDispatchPlan } from './dispatch/plan.mjs';
import { executeExecutorCli } from './dispatch/cli.mjs';
import { buildPrompt } from './work-compat.mjs';
import fs from 'node:fs';
import { resolveFgosBin } from '../setup/bin-discovery.mjs';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const LOCAL_FGOS_MJS = fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));

function resolveBinFgos() {
  return resolveFgosBin(REPO_ROOT)?.path ?? LOCAL_FGOS_MJS;
}

/**
 * `fanout-batch <id,id,...>` subcommand (fanout-execute-consolidation):
 * Consolidates the out-of-process dispatch chain (pick -> execute -> return)
 * and worker slot-checking/trimming into a single fast, testable call for fgos-fanout.
 *
 * Boundary Note (R1 / M10):
 * Lives in the Work Driver layer (next to loop.mjs) rather than dispatch core.
 * Dispatch core owns compileDispatchPlan and executeExecutorCli; Work lifecycle
 * driving (pick, return, worker slot checking) belongs here in the Work Driver layer.
 *
 * Fault Tolerance Invariant (R1):
 * If `pick` succeeds but execution throws, the item must be returned with status `blocked`
 * via `fgos return --to blocked` rather than leaving the work item claimed in `doing`.
 */
export async function fanoutBatchExecutorCli(
  candidateIdsArg = [],
  { cwd = process.cwd(), repoRoot, hasLiveTaskAccess = false } = {},
) {
  const candidateIds = Array.isArray(candidateIdsArg)
    ? candidateIdsArg
    : String(candidateIdsArg).split(',').map((s) => s.trim()).filter(Boolean);

  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const fgosDir = fgosDirFromRoot(root);
  const cfg = ensureRunnerConfigForDir(root);

  const ceiling = readSharedConfigOrEmpty(root)?.workerSlots?.ceiling;
  const slotsView = listWork(fgosDir);
  const room = hasWorkerSlotRoom(slotsView, { ceiling, batchSize: candidateIds.length });

  if (!room.allowed) {
    return { fired: [], mechanismChanged: [], unavailable: [], deferred: [...candidateIds], slotsFull: true };
  }

  const freeSlots = room.free !== null && room.free !== undefined ? Math.max(0, room.free) : candidateIds.length;
  const batchToRun = candidateIds.slice(0, freeSlots);
  const deferred = candidateIds.slice(freeSlots);

  const fired = [];
  const mechanismChanged = [];
  const unavailable = [];

  const results = await Promise.allSettled(
    batchToRun.map(async (candidateId) => {
      const workItem = slotsView.work[candidateId];
      if (!workItem) {
        return { kind: 'unavailable', entry: { id: candidateId, reason: 'not-found' } };
      }

      const { mechanism, executorId } = compileDispatchPlan(cfg, {
        work: candidateId,
        workItem,
        hasLiveTaskAccess,
      });

      if (mechanism === 'in-process') {
        return { kind: 'mechanismChanged', entry: { id: candidateId, mechanism, executorId } };
      }
      if (mechanism === 'unavailable') {
        return { kind: 'unavailable', entry: { id: candidateId, executorId } };
      }

      const binFgosPath = resolveBinFgos(root);
      const execFgos = (args, options) => {
        if (binFgosPath.endsWith('.mjs')) {
          return execFileSync(process.execPath, [binFgosPath, ...args], options);
        }
        return execFileSync(binFgosPath, args, options);
      };

      let picked = false;
      let wtPath = cwd;

      try {
        const pickStdout = execFgos(['pick', candidateId, '--dir', root], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        const pickedData = JSON.parse(pickStdout);
        wtPath = pickedData.data?.worktree?.path || cwd;
        picked = true;

        const execRes = await executeExecutorCli(executorId, {
          prompt: buildPrompt(workItem),
          cwd: wtPath,
          repoRoot: root,
          hasLiveTaskAccess,
          work: workItem,
        });

        const returnArgs = ['return', candidateId, '--dir', root];
        if (execRes && execRes.verifiedSha) {
          returnArgs.push('--worker-verified-sha', execRes.verifiedSha);
        }
        execFgos(returnArgs, {
          cwd: wtPath,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        return {
          kind: 'fired',
          entry: {
            id: candidateId,
            status: execRes.status ?? 0,
            signal: execRes.signal ?? null,
            errorClass: execRes.errorClass ?? null,
          },
        };
      } catch (err) {
        // R1: If pick succeeded but execute/return threw, return with blocked so item does not hang in doing
        if (picked) {
          try {
            const returnBlockedArgs = [
              'return',
              candidateId,
              '--dir',
              root,
              '--to',
              'blocked',
              '--reason',
              (err.message || 'executor-failed').replace(/[\r\n]+/g, ' ').slice(0, 200),
            ];
            execFgos(returnBlockedArgs, {
              cwd: wtPath,
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'pipe'],
            });
          } catch {
            // best-effort return-with-blocked
          }
        }
        return {
          kind: 'fired',
          entry: {
            id: candidateId,
            status: 1,
            errorClass: err.errorClass || 'error',
            error: err.message,
          },
        };
      }
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (res.status === 'fulfilled') {
      const { kind, entry } = res.value;
      if (kind === 'fired') fired.push(entry);
      else if (kind === 'mechanismChanged') mechanismChanged.push(entry);
      else if (kind === 'unavailable') unavailable.push(entry);
    } else {
      const candidateId = batchToRun[i];
      const err = res.reason;
      fired.push({
        id: candidateId,
        status: 1,
        errorClass: err?.errorClass || 'error',
        error: err?.message || String(err),
      });
    }
  }

  return { fired, mechanismChanged, unavailable, deferred };
}
