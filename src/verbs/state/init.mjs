import path from 'node:path';
import { mintMachineId } from '../../util/identity-mint.mjs';
import { resolveStateRoot } from '../../holder-lock/state-root.mjs';
import { fixEventStoreLockDirs } from '../../setup/event-store-fixes.mjs';
import { initStore } from '../../state/store.mjs';
import { writeCoexistenceManifest } from '../../install/coexist.mjs';
import { inspectGit } from '../../runner/worktree.mjs';
import { recoverGitOperations } from '../../git/status.mjs';
import { initConfigFile } from '../../config/facade.mjs';
import { settleLegacyConfig } from './settle-legacy-config.mjs';

/**
 * Give the project and the machine their header-only `config.yaml` when a scope has no file (the config door's
 * create-only `init`: an existing file, a legacy `config.json` included, is left alone). Nothing needs these files to
 * run; they are what a person edits. A refusal (a confined session, an unwritable home) is returned, not thrown, so it
 * never fails init.
 *
 * @returns {{ project?: { created: boolean, file: string }, global?: { created: boolean, file: string }, warning?: string }}
 */
export function createConfigFiles(projectRoot) {
  try {
    const project = initConfigFile({ projectRoot, target: 'project' });
    const global = initConfigFile({ projectRoot, target: 'global' });
    return { project, global };
  } catch (err) {
    return { warning: `config files not created: ${err.message}` };
  }
}

/**
 * Create the store of the project whose `.fgos` is `dir`, and settle what a fresh or upgraded machine needs around it:
 * the legacy JSON config an older release left (moved to the files the Config component reads, before anything reads
 * config), the machine id and the locks directory (the store cannot open without them; both steps are idempotent, an existing
 * id is kept and a clone's own `fgos.machineId` still wins), the store itself, the harness coexistence manifest, the
 * headless-repository notice, the header-only config files and the recovery of an interrupted Git operation. Only the
 * first three can refuse; every later step is fail-safe, so a quirk there still leaves `.fgos/` initialized.
 *
 * @returns {{ dir: string, detectedHarnesses: object[], config: object, gitHeadless?: true, gitRecovery?: object, gitRecoveryWarning?: string }}
 */
export function initStoreUseCase({ dir }) {
  const root = path.dirname(dir);
  mintMachineId(resolveStateRoot().stateRoot);
  settleLegacyConfig(root);
  fixEventStoreLockDirs(root);
  initStore(dir);
  let detectedHarnesses = [];
  try {
    detectedHarnesses = writeCoexistenceManifest(root, dir).detected_harnesses;
  } catch {
    // A permissions quirk or an unexpected error here must never fail init.
  }
  const config = createConfigFiles(root);
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
    config,
    ...(gitHeadless ? { gitHeadless: true } : {}),
    ...(gitRecovery ? { gitRecovery } : {}),
    ...(gitRecoveryWarning ? { gitRecoveryWarning } : {}),
  };
}
