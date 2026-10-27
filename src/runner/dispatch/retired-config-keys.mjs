// The retired runner config keys table and detection.
// Keys that moved or were retired are refused with RunnerConfigError code
// 'config-key-retired', naming the file and the replacement key, rather than
// silently dropped in memory or translated.
import fsp from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseYaml } from '../../util/yaml.mjs';
import { RunnerConfigError } from './config.mjs';

/**
 * Table of retired configuration keys and their replacements.
 */
export const RETIRED_CONFIG_KEYS = Object.freeze({
  'runner.patterns.defaultRule': Object.freeze({
    replacement: null,
    instruction: 'delete the key',
  }),
  'runner.patterns.reviewed.maxRounds': Object.freeze({
    replacement: 'runner.loops.reviewed.maxRounds',
    instruction: 'use runner.loops.reviewed.maxRounds instead',
  }),
  'runner.patterns.reviewed.checkersByRigor': Object.freeze({
    replacement: 'runner.loops.reviewed.checkersByRigor',
    instruction: 'use runner.loops.reviewed.checkersByRigor instead',
  }),
  'runner.patterns.research-fan-out-gated': Object.freeze({
    replacement: 'runner.patterns.research-fan-out',
    instruction: 'use runner.patterns.research-fan-out instead',
  }),
});

/**
 * Inspects `runnerRaw` (the parsed runner section or config object) for retired keys.
 * Detects the retired reviewed shape by content: holds `maxRounds` or `checkersByRigor`
 * and no `loop`/`defaults`/`promise`/`invariants`.
 * An entry holding both shapes throws a plain RunnerConfigError.
 *
 * Returns an array of `{ key, file, replacement, message }` descriptors.
 */
export function retiredKeysIn(runnerRaw, file) {
  if (!runnerRaw || typeof runnerRaw !== 'object') return [];
  const patterns = runnerRaw.patterns ?? runnerRaw.runner?.patterns;
  if (!patterns || typeof patterns !== 'object' || Array.isArray(patterns)) return [];

  const findings = [];
  const fileName = file ?? '<config>';

  if (patterns.defaultRule !== undefined) {
    findings.push({
      key: 'runner.patterns.defaultRule',
      file: fileName,
      replacement: null,
      message: `${fileName}: runner.patterns.defaultRule was retired; delete the key.`,
    });
  }

  if (patterns['research-fan-out-gated'] !== undefined) {
    findings.push({
      key: 'runner.patterns.research-fan-out-gated',
      file: fileName,
      replacement: 'runner.patterns.research-fan-out',
      message: `${fileName}: runner.patterns.research-fan-out-gated was retired; use runner.patterns.research-fan-out instead.`,
    });
  }

  if (patterns.reviewed !== undefined) {
    const entry = patterns.reviewed;
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const hasTuning = 'maxRounds' in entry || 'checkersByRigor' in entry;
      const hasCatalog = 'loop' in entry || 'defaults' in entry || 'promise' in entry || 'invariants' in entry;
      if (hasTuning && hasCatalog) {
        throw new RunnerConfigError(
          `runner config (${fileName} patterns.reviewed) cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.reviewed.`,
        );
      }
      if (hasTuning && !hasCatalog) {
        if ('maxRounds' in entry) {
          findings.push({
            key: 'runner.patterns.reviewed.maxRounds',
            file: fileName,
            replacement: 'runner.loops.reviewed.maxRounds',
            message: `${fileName}: runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead.`,
          });
        }
        if ('checkersByRigor' in entry) {
          findings.push({
            key: 'runner.patterns.reviewed.checkersByRigor',
            file: fileName,
            replacement: 'runner.loops.reviewed.checkersByRigor',
            message: `${fileName}: runner.patterns.reviewed.checkersByRigor was retired; use runner.loops.reviewed.checkersByRigor instead.`,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Asserts that `runnerRaw` holds no retired keys, throwing RunnerConfigError
 * with code 'config-key-retired' on the first finding.
 */
export function assertNoRetiredKeys(runnerRaw, file) {
  const retired = retiredKeysIn(runnerRaw, file);
  if (retired.length > 0) {
    throw new RunnerConfigError(retired[0].message, { code: 'config-key-retired' });
  }
}

/**
 * Maps a ConfigDoorError's refusals to a RunnerConfigError with code 'config-key-retired'
 * when the refusal path corresponds to a retired key.
 */
export function checkDoorRefusalsForRetiredKeys(err, options = {}) {
  if (!err || !Array.isArray(err.refusals)) return;
  for (const r of err.refusals) {
    if (!r.path) continue;
    const isDefaultRule = r.path === 'runner.patterns.defaultRule' || r.path.startsWith('runner.patterns.defaultRule.');
    const isResearchFanOutGated = r.path === 'runner.patterns.research-fan-out-gated' || r.path.startsWith('runner.patterns.research-fan-out-gated.');
    const isReviewed = r.path === 'runner.patterns.reviewed' || r.path.startsWith('runner.patterns.reviewed.');

    if (isDefaultRule || isResearchFanOutGated || isReviewed) {
      const displayFile = r.file?.startsWith('global:')
        ? `~/.fgos/${r.file.replace(/^global:/, '')}`
        : (r.file ?? '<file>');
      const pos = Number.isInteger(r.line) ? `:${r.line}:${r.column}` : '';
      const where = `${displayFile}${pos}`;

      if (isDefaultRule) {
        throw new RunnerConfigError(
          `${where}: runner.patterns.defaultRule was retired; delete the key.`,
          { code: 'config-key-retired' },
        );
      }
      if (isResearchFanOutGated) {
        throw new RunnerConfigError(
          `${where}: runner.patterns.research-fan-out-gated was retired; use runner.patterns.research-fan-out instead.`,
          { code: 'config-key-retired' },
        );
      }
      if (isReviewed) {
        let actualFile = null;
        if (r.file?.startsWith('global:') || r.file?.startsWith('machine:')) {
          actualFile = path.join(process.env.HOME || os.homedir(), '.fgos', r.file.replace(/^(global|machine):/, ''));
        } else if (r.file?.startsWith('project:')) {
          if (options.projectRoot) {
            actualFile = path.join(options.projectRoot, '.fgos', r.file.replace(/^project:/, ''));
          }
        } else if (r.file) {
          actualFile = path.isAbsolute(r.file)
            ? r.file
            : (options.projectRoot ? path.join(options.projectRoot, r.file) : path.resolve(r.file));
        }
        if (actualFile && !fsp.existsSync(actualFile)) {
          actualFile = null;
        }
        if (actualFile) {
          try {
            const raw = parseYaml(fsp.readFileSync(actualFile, 'utf8'), { filename: actualFile });
            const reviewed = raw?.runner?.patterns?.reviewed ?? raw?.patterns?.reviewed;
            if (reviewed && typeof reviewed === 'object' && !Array.isArray(reviewed)) {
              const hasTuning = 'maxRounds' in reviewed || 'checkersByRigor' in reviewed;
              const hasCatalog = 'loop' in reviewed || 'defaults' in reviewed || 'promise' in reviewed || 'invariants' in reviewed;
              if (hasTuning && hasCatalog) {
                throw new RunnerConfigError(
                  `${where}: runner.patterns.reviewed cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.reviewed.`,
                );
              }
              if ('maxRounds' in reviewed) {
                throw new RunnerConfigError(
                  `${where}: runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead.`,
                  { code: 'config-key-retired' },
                );
              }
              if ('checkersByRigor' in reviewed) {
                throw new RunnerConfigError(
                  `${where}: runner.patterns.reviewed.checkersByRigor was retired; use runner.loops.reviewed.checkersByRigor instead.`,
                  { code: 'config-key-retired' },
                );
              }
            }
          } catch (e) {
            if (e instanceof RunnerConfigError) throw e;
          }
        } else {
          if (r.path === 'runner.patterns.reviewed.maxRounds') {
            throw new RunnerConfigError(
              `${where}: runner.patterns.reviewed.maxRounds was retired; use runner.loops.reviewed.maxRounds instead.`,
              { code: 'config-key-retired' },
            );
          }
          if (r.path === 'runner.patterns.reviewed.checkersByRigor') {
            throw new RunnerConfigError(
              `${where}: runner.patterns.reviewed.checkersByRigor was retired; use runner.loops.reviewed.checkersByRigor instead.`,
              { code: 'config-key-retired' },
            );
          }
        }
      }
    }
  }
}
