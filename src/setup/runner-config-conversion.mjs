// runner-config-conversion.mjs — converts a project config file holding retired
// runner.patterns keys to the runner.loops and schema 2 layout.
// Reads the project file only and never rewrites the global file.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseYaml } from '../util/yaml.mjs';
import { retiredKeysIn } from '../runner/dispatch/retired-config-keys.mjs';
import { loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import * as facade from '../config/facade.mjs';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';

function findProjectConfigFile(projectDir) {
  const fgosDir = path.join(projectDir, '.fgos');
  try {
    const entries = fs.readdirSync(fgosDir);
    if (entries.includes('config.yaml')) return path.join(fgosDir, 'config.yaml');
    if (entries.includes('config.json')) return path.join(fgosDir, 'config.json');
  } catch {
    return null;
  }
  return null;
}

function applyNativeConfigPatch(hostBin, projectDir, edits, reason) {
  const tmpPatch = path.join(os.tmpdir(), `fgos-patch-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  try {
    fs.writeFileSync(tmpPatch, JSON.stringify(edits), 'utf8');
    execFileSync(hostBin, ['config', 'patch', tmpPatch, '--reason', reason, '--dir', projectDir], {
      encoding: 'utf8',
      env: process.env,
    });
  } finally {
    try {
      if (fs.existsSync(tmpPatch)) fs.unlinkSync(tmpPatch);
    } catch {
      // ignore tmp cleanup error
    }
  }
}

/**
 * Converts a project config file if it holds retired runner.patterns keys.
 * Idempotent: returns 'unchanged' when no retired keys are present.
 *
 * @param {string} projectDir
 * @param {object} [options]
 * @param {Function} [options.patchDoor]
 * @returns {{ status: 'absent'|'unchanged'|'converted'|'blocked', backup?: string, written: string[], blocker?: string }}
 */
export function convertRunnerPatternsConfig(projectDir, options = {}) {
  const targetPath = findProjectConfigFile(projectDir);
  if (!targetPath) {
    return { status: 'absent', written: [] };
  }

  if (typeof options.patchDoor !== 'function') {
    try {
      loadRunnerConfigForDir(projectDir);
      return { status: 'unchanged', written: [] };
    } catch {
      // Configuration cannot be cleanly loaded by the runner; inspect file for retired keys.
    }
  }

  // Side-read raw config text to extract values of retired keys (maxRounds, checkersByRigor, etc.)
  // for patch edits; the validating door refuses to load configs holding retired keys.
  let originalText;
  try {
    originalText = fs.readFileSync(targetPath, 'utf8');
  } catch {
    return { status: 'absent', written: [] };
  }

  let parsed;
  try {
    parsed = parseYaml(originalText, { filename: targetPath });
  } catch (err) {
    throw new Error(`cannot parse config file at ${targetPath}: ${err.message}`);
  }

  let retired = [];
  try {
    retired = retiredKeysIn(parsed, targetPath);
  } catch (err) {
    const rev = parsed?.runner?.patterns?.reviewed ?? parsed?.patterns?.reviewed;
    const hasTuning = rev && typeof rev === 'object' && !Array.isArray(rev) && ('maxRounds' in rev || 'checkersByRigor' in rev);
    if (!hasTuning) {
      throw err;
    }
  }

  const runner = parsed?.runner ?? parsed;
  const patterns = runner?.patterns ?? {};
  const rev = patterns?.reviewed;
  const hasReviewedTuning = rev && typeof rev === 'object' && !Array.isArray(rev) && ('maxRounds' in rev || 'checkersByRigor' in rev);
  const hasRetired = (retired && retired.length > 0) || hasReviewedTuning;
  if (!hasRetired) {
    return { status: 'unchanged', written: [] };
  }

  const now = new Date();
  const ts = now.toISOString().replace(/[-:.]/g, '');
  const backupPath = `${targetPath}.pre-patterns-catalog-${ts}`;
  // Backup copy of the user's config file before applying edits; this and the restore below are the only raw writes in this module.
  fs.copyFileSync(targetPath, backupPath);

  const edits = [];
  const written = [];

  if (patterns.defaultRule !== undefined) {
    edits.push({ unset: 'runner.patterns.defaultRule' });
  }

  if (patterns['research-fan-out-gated'] !== undefined) {
    if (patterns['research-fan-out'] !== undefined) {
      return {
        status: 'blocked',
        backup: backupPath,
        blocker: 'cannot convert retired key runner.patterns.research-fan-out-gated: modern runner.patterns.research-fan-out already exists; reconcile duplicate pattern entries manually',
        written: [],
      };
    }
    edits.push({ unset: 'runner.patterns.research-fan-out-gated' });
    edits.push({ set: 'runner.patterns.research-fan-out', value: patterns['research-fan-out-gated'] });
    written.push('runner.patterns.research-fan-out');
  }

  if (patterns.reviewed !== undefined && typeof patterns.reviewed === 'object' && !Array.isArray(patterns.reviewed)) {
    const hasTuning = 'maxRounds' in rev || 'checkersByRigor' in rev;
    const hasModern = Object.keys(rev).some((k) => k !== 'maxRounds' && k !== 'checkersByRigor');
    if ('maxRounds' in rev) {
      edits.push({ set: 'runner.loops.reviewed.maxRounds', value: rev.maxRounds });
      written.push('runner.loops.reviewed.maxRounds');
      if (hasModern) {
        edits.push({ unset: 'runner.patterns.reviewed.maxRounds' });
      }
    }
    if ('checkersByRigor' in rev) {
      edits.push({ set: 'runner.loops.reviewed.checkersByRigor', value: rev.checkersByRigor });
      written.push('runner.loops.reviewed.checkersByRigor');
      if (hasModern) {
        edits.push({ unset: 'runner.patterns.reviewed.checkersByRigor' });
      }
    }
    if (hasTuning && !hasModern) {
      edits.push({ unset: 'runner.patterns.reviewed' });
    }
    if (hasTuning) {
      written.push('runner.loops.reviewed');
    }
  }

  edits.push({ set: 'runner.patterns.seatBinding.schema', value: 2 });
  written.push('runner.patterns.seatBinding.schema');
  const reason = 'convert retired runner.patterns keys to runner.loops and schema 2';

  // Apply edits through Config write door (Branch A)
  try {
    if (typeof options.patchDoor === 'function') {
      options.patchDoor({
        projectRoot: projectDir,
        target: 'project',
        edits,
        reason,
        backupPath,
      });
    } else if (typeof facade.applyPatch === 'function' || typeof facade.patch === 'function') {
      const door = facade.applyPatch ?? facade.patch;
      door({
        projectRoot: projectDir,
        target: 'project',
        edits,
        reason,
      });
    } else {
      const host = resolveActiveHostBin({ cwd: projectDir });
      if (host?.bin) {
        applyNativeConfigPatch(host.bin, projectDir, edits, reason);
      } else {
        return {
          status: 'blocked',
          backup: backupPath,
          blocker: 'config-write-door-unavailable: Config write door (facade.applyPatch or native fgos config patch) is unavailable; question U6 requires Branch A conversion to go through the Config write door and not write around it',
          written: [],
        };
      }
    }
  } catch (err) {
    return {
      status: 'blocked',
      backup: backupPath,
      blocker: err.message ?? String(err),
      written: [],
    };
  }

  try {
    loadRunnerConfigForDir(projectDir);
  } catch (err) {
    const isGlobalOnlyRefusal =
      (err instanceof facade.ConfigDoorError && err.refusals?.every((r) => r.file?.startsWith('global:'))) ||
      (typeof err.message === 'string' && (err.message.includes('~/.fgos/') || err.message.includes('global:')));
    if (isGlobalOnlyRefusal) {
      return {
        status: 'converted',
        backup: backupPath,
        written,
        globalPending: true,
      };
    }
    // Restores the user's own bytes from backup after a refused write; this and the backup copy are the only raw writes in this module.
    fs.copyFileSync(backupPath, targetPath);
    return {
      status: 'blocked',
      backup: backupPath,
      blocker: err.message ?? String(err),
      written: [],
    };
  }

  return {
    status: 'converted',
    backup: backupPath,
    written,
  };
}

/**
 * Inspects the global config file for retired runner.patterns keys without modifying it.
 *
 * @param {string} [globalDir]
 * @returns {{ file: string, edits: string[], command: string }|null}
 */
export function inspectGlobalRunnerConfig(globalDir = path.join(os.homedir(), '.fgos')) {
  if (!fs.existsSync(globalDir)) return null;

  try {
    facade.readMachineConfig({ globalDir });
    return null;
  } catch (err) {
    if (err instanceof facade.ConfigDoorError && Array.isArray(err.refusals)) {
      const retiredRefusals = err.refusals.filter((r) =>
        r.path && (
          r.path.startsWith('runner.patterns.defaultRule') ||
          r.path.startsWith('runner.patterns.reviewed') ||
          r.path.startsWith('runner.patterns.research-fan-out-gated')
        )
      );
      if (retiredRefusals.length === 0) return null;
      const file = retiredRefusals[0].file?.replace(/^(global|machine):/, '') ?? 'config.yaml';
      const edits = [];
      if (retiredRefusals.some((r) => r.path.startsWith('runner.patterns.defaultRule'))) {
        edits.push('delete runner.patterns.defaultRule');
      }
      if (retiredRefusals.some((r) => r.path.startsWith('runner.patterns.reviewed'))) {
        edits.push('move runner.patterns.reviewed to runner.loops.reviewed');
      }
      if (retiredRefusals.some((r) => r.path.startsWith('runner.patterns.research-fan-out-gated'))) {
        edits.push('rename runner.patterns.research-fan-out-gated to runner.patterns.research-fan-out');
      }
      return {
        file: path.join(globalDir, file),
        edits,
        command: 'fgos config patch <patch-file> --global --reason "convert retired keys to runner.loops"',
      };
    }
    return null;
  }
}
