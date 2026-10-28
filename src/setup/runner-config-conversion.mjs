// runner-config-conversion.mjs — converts a project config file holding retired
// runner.patterns keys to the runner.loops and schema 2 layout.
// Reads the project file only and never rewrites the global file.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseYaml } from '../util/yaml.mjs';
import { retiredKeysIn } from '../runner/dispatch/retired-config-keys.mjs';
import { detectRetiredPatternKeys } from '../runner/execution/patterns/retired-keys.mjs';
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
 * Shared read-only inspection and advice formatting for a legacy JSON config file.
 *
 * @param {string} targetPath
 * @param {object} [parsed]
 * @returns {string}
 */
export function formatLegacyJsonAdvice(targetPath, parsed = null) {
  let doc = parsed;
  if (!doc) {
    try {
      const text = fs.readFileSync(targetPath, 'utf8');
      doc = parseYaml(text, { filename: targetPath });
    } catch {
      doc = null;
    }
  }
  const retired = doc ? retiredKeysIn(doc, targetPath) : [];
  if (retired.length > 0) {
    const editsText = retired.map((r) => r.baseMessage ?? `${r.key} was retired; ${r.instruction}`).join('; ');
    return `${targetPath}: config-format-legacy-json: ${editsText}; edit ${targetPath}, then run \`fgos config migrate\``;
  }
  return `${targetPath}: config-format-legacy-json: legacy JSON configuration format must be migrated first; edit ${targetPath}, then run \`fgos config migrate\``;
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

  // Opening load check must always run
  try {
    loadRunnerConfigForDir(projectDir);
    return { status: 'unchanged', written: [] };
  } catch {
    // Configuration cannot be cleanly loaded by the runner; inspect file for retired keys.
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

  const retired = retiredKeysIn(parsed, targetPath);
  const runner = parsed?.runner ?? parsed;
  const patterns = runner?.patterns ?? {};
  const hasRetired = Array.isArray(retired) && retired.length > 0;
  if (!hasRetired) {
    return { status: 'unchanged', written: [] };
  }

  // H1: for a .json target, no backup and no door call; return blocked with per-key hand edits
  if (targetPath.endsWith('.json')) {
    return {
      status: 'blocked',
      blocker: formatLegacyJsonAdvice(targetPath, parsed),
      written: [],
    };
  }

  // Pre-check: collision between retired research-fan-out-gated and modern research-fan-out
  // Made before backup copy so blocked setup leaves no backup
  if (patterns['research-fan-out-gated'] !== undefined && patterns['research-fan-out'] !== undefined) {
    return {
      status: 'blocked',
      blocker: 'cannot convert retired key runner.patterns.research-fan-out-gated: modern runner.patterns.research-fan-out already exists; reconcile duplicate pattern entries manually',
      written: [],
    };
  }

  const edits = [];
  const written = [];

  if (patterns.defaultRule !== undefined) {
    edits.push({ unset: 'runner.patterns.defaultRule' });
  }

  if (patterns['research-fan-out-gated'] !== undefined) {
    edits.push({ unset: 'runner.patterns.research-fan-out-gated' });
    edits.push({ set: 'runner.patterns.research-fan-out', value: patterns['research-fan-out-gated'] });
    written.push('runner.patterns.research-fan-out');
  }
  if (patterns.reviewed !== undefined && typeof patterns.reviewed === 'object' && !Array.isArray(patterns.reviewed)) {
    const rev = patterns.reviewed;
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

  // Backup copy made immediately before door call, after all pre-checks
  const now = new Date();
  const ts = now.toISOString().replace(/[-:.]/g, '');
  const backupPath = `${targetPath}.pre-patterns-catalog-${ts}`;
  fs.copyFileSync(targetPath, backupPath);

  // Apply edits through Config write door
  try {
    if (typeof options.patchDoor === 'function') {
      options.patchDoor({
        projectRoot: projectDir,
        target: 'project',
        edits,
        reason,
        backupPath,
      });
    } else {
      const host = resolveActiveHostBin({ cwd: projectDir });
      if (host?.bin) {
        applyNativeConfigPatch(host.bin, projectDir, edits, reason);
      } else {
        return {
          status: 'blocked',
          backup: backupPath,
          blocker: 'config-write-door-unavailable: Config write door (native fgos config patch) is unavailable; conversion must go through the Config write door',
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
    return {
      status: 'converted',
      backup: backupPath,
      written,
      remainingValidation: err.message ?? String(err),
    };
  }

  return {
    status: 'converted',
    backup: backupPath,
    written,
  };
}

/**
 * Formats a global retired config notice into human-readable guidance text.
 *
 * @param {{ file: string, edits: string[] }} notice
 * @returns {string}
 */
export function formatGlobalRetiredNotice(notice) {
  if (!notice) return '';
  const patchStr = notice.patchBody ?? (notice.patch ? JSON.stringify(notice.patch) : '');
  const cmdPart = notice.command ? `; ${notice.command}` : '';
  const patchPart = patchStr ? `; patch body: ${patchStr}` : '';
  return `global config holds retired keys; edit ${notice.file} (${notice.edits.join('; ')})${cmdPart}${patchPart}`;
}

/**
 * Inspects the global config file for retired runner.patterns keys without modifying it.
 *
 * @param {string} [globalDir]
 * @returns {{ file: string, edits: string[], command: string, message: string }|null}
 */
export function inspectGlobalRunnerConfig(globalDir = path.join(os.homedir(), '.fgos')) {
  if (!fs.existsSync(globalDir)) return null;

  try {
    facade.readMachineConfig({ globalDir });
    return null;
  } catch (err) {
    if (err instanceof facade.ConfigDoorError && Array.isArray(err.refusals)) {
      const retiredRefusals = err.refusals.filter((r) => {
        if (!r.path) return false;
        const findings = detectRetiredPatternKeys(r.path);
        return findings.length > 0;
      });
      if (retiredRefusals.length === 0) return null;
      const file = retiredRefusals[0].file?.replace(/^(global|machine):/, '') ?? 'config.yaml';
      const edits = [];
      const patch = [];
      if (retiredRefusals.some((r) => detectRetiredPatternKeys(r.path).some((f) => f.classification === 'defaultRule'))) {
        edits.push('delete runner.patterns.defaultRule');
        patch.push({ unset: 'runner.patterns.defaultRule' });
      }
      if (retiredRefusals.some((r) => detectRetiredPatternKeys(r.path).some((f) => f.classification === 'tuning'))) {
        edits.push('move runner.patterns.reviewed to runner.loops.reviewed');
        patch.push({ unset: 'runner.patterns.reviewed' });
      }
      if (retiredRefusals.some((r) => detectRetiredPatternKeys(r.path).some((f) => f.classification === 'gated'))) {
        edits.push('rename runner.patterns.research-fan-out-gated to runner.patterns.research-fan-out');
        patch.push({ unset: 'runner.patterns.research-fan-out-gated' });
      }
      const patchBody = JSON.stringify(patch, null, 2);
      const notice = {
        file: path.join(globalDir, file),
        edits,
        patch,
        patchBody,
        command: 'from a directory outside any fgOS project, run: fgos config patch <patch-file> --global --reason "convert retired keys to runner.loops"',
      };
      notice.message = formatGlobalRetiredNotice(notice);
      return notice;
    }
    return null;
  }
}
