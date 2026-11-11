import path from 'node:path';
import { mintMachineId } from '../../util/identity-mint.mjs';
import { resolveStateRoot } from '../../holder-lock/state-root.mjs';
import { fixEventStoreLockDirs } from '../../setup/event-store-fixes.mjs';
import { initStore } from '../../state/store.mjs';
import { writeCoexistenceManifest } from '../../install/coexist.mjs';
import { inspectGit } from '../../runner/worktree.mjs';
import { recoverGitOperations } from '../../git/status.mjs';

/**
 * Create the store of the project whose `.fgos` is `dir`, and settle what a fresh or upgraded machine needs around it:
 * the machine id and the locks directory (the store cannot open without them; both steps are idempotent, an existing
 * id is kept and a clone's own `fgos.machineId` still wins), the store itself, the harness coexistence manifest, the
 * headless-repository notice and the recovery of an interrupted Git operation. Only the first three can refuse; every
 * later step is fail-safe, so a quirk there still leaves `.fgos/` initialized.
 *
 * @returns {{ dir: string, detectedHarnesses: object[], gitHeadless?: true, gitRecovery?: object, gitRecoveryWarning?: string }}
 */
export function initStoreUseCase({ dir }) {
  const root = path.dirname(dir);
  mintMachineId(resolveStateRoot().stateRoot);
  fixEventStoreLockDirs(root);
  initStore(dir);
  let detectedHarnesses = [];
  try {
    detectedHarnesses = writeCoexistenceManifest(root, dir).detected_harnesses;
  } catch {
    // A permissions quirk or an unexpected error here must never fail init.
  }
  // A failed HEAD lookup (zero commits, an unreadable ref) is a plain non-fatal notice, not a distinction worth making.
  // A directory that is no repository never gets here: the lock-dirs fix above resolves the repository and refuses it.
  let gitHeadless = false;
  try {
    gitHeadless = typeof inspectGit(root).resolveCommit({ name: 'HEAD' }) !== 'string';
  } catch {
    gitHeadless = true;
  }
  // Last: an interrupted Land, ScopedCommit or remote transfer is recovered here, so a machine that only runs `init` on
  // upgrade settles it without `fgos git recover` by hand.
  let gitRecovery;
  let gitRecoveryWarning;
  try {
    const { recovered, kept } = recoverGitOperations(root);
    if (recovered.length || kept.length) gitRecovery = { recovered, kept };
  } catch (err) {
    gitRecoveryWarning = `Git recovery refused: ${err.message}; run \`fgos git recover\``;
  }
  return {
    dir,
    detectedHarnesses,
    ...(gitHeadless ? { gitHeadless: true } : {}),
    ...(gitRecovery ? { gitRecovery } : {}),
    ...(gitRecoveryWarning ? { gitRecoveryWarning } : {}),
  };
}
