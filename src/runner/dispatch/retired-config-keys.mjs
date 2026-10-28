// The retired runner config keys table and detection.
// Keys that moved or were retired are refused with RunnerConfigError code
// 'config-key-retired', naming the file and the replacement key, rather than
// silently dropped in memory or translated.
import fsp from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseYaml } from '../../util/yaml.mjs';
import { RunnerConfigError } from './config.mjs';
import {
  RETIRED_CONFIG_KEYS,
  detectRetiredPatternKeys,
} from '../execution/patterns/retired-keys.mjs';

export { RETIRED_CONFIG_KEYS };

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
  const detected = detectRetiredPatternKeys(patterns);
  for (const item of detected) {
    if (item.kind === 'both-shapes') {
      throw new RunnerConfigError(
        `runner config (${fileName} patterns.${item.name}) cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.${item.name}.`,
      );
    }
    if (item.kind === 'defaultRule') {
      findings.push({
        key: 'runner.patterns.defaultRule',
        file: fileName,
        replacement: null,
        message: `${fileName}: runner.patterns.defaultRule was retired; delete the key.`,
      });
    } else if (item.kind === 'gated') {
      findings.push({
        key: item.key,
        file: fileName,
        replacement: item.replacement,
        message: `${fileName}: ${item.baseMessage}.`,
      });
    } else if (item.kind === 'tuning-only') {
      if (item.hasMaxRounds) {
        findings.push({
          key: `runner.patterns.${item.name}.maxRounds`,
          file: fileName,
          replacement: `runner.loops.${item.name}.maxRounds`,
          message: `${fileName}: runner.patterns.${item.name}.maxRounds was retired; use runner.loops.${item.name}.maxRounds instead.`,
        });
      }
      if (item.hasCheckersByRigor) {
        findings.push({
          key: `runner.patterns.${item.name}.checkersByRigor`,
          file: fileName,
          replacement: `runner.loops.${item.name}.checkersByRigor`,
          message: `${fileName}: runner.patterns.${item.name}.checkersByRigor was retired; use runner.loops.${item.name}.checkersByRigor instead.`,
        });
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
        const meta = RETIRED_CONFIG_KEYS['runner.patterns.defaultRule'];
        throw new RunnerConfigError(
          `${where}: runner.patterns.defaultRule was retired; ${meta?.instruction ?? 'delete the key'}.`,
          { code: 'config-key-retired' },
        );
      }
      if (isResearchFanOutGated) {
        const key = 'runner.patterns.research-fan-out-gated';
        const meta = RETIRED_CONFIG_KEYS[key];
        throw new RunnerConfigError(
          `${where}: ${key} was retired; ${meta?.instruction ?? 'use runner.patterns.research-fan-out instead'}.`,
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
            const patterns = raw?.runner?.patterns ?? raw?.patterns;
            const reviewed = patterns?.reviewed;
            if (reviewed && typeof reviewed === 'object' && !Array.isArray(reviewed)) {
              const findings = detectRetiredPatternKeys({ reviewed });
              for (const f of findings) {
                if (f.kind === 'both-shapes') {
                  throw new RunnerConfigError(
                    `${where}: runner.patterns.reviewed cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.reviewed.`,
                  );
                }
                if (f.kind === 'tuning-only') {
                  if (f.hasMaxRounds) {
                    const meta = RETIRED_CONFIG_KEYS['runner.patterns.reviewed.maxRounds'];
                    throw new RunnerConfigError(
                      `${where}: runner.patterns.reviewed.maxRounds was retired; ${meta?.instruction ?? 'use runner.loops.reviewed.maxRounds instead'}.`,
                      { code: 'config-key-retired' },
                    );
                  }
                  if (f.hasCheckersByRigor) {
                    const meta = RETIRED_CONFIG_KEYS['runner.patterns.reviewed.checkersByRigor'];
                    throw new RunnerConfigError(
                      `${where}: runner.patterns.reviewed.checkersByRigor was retired; ${meta?.instruction ?? 'use runner.loops.reviewed.checkersByRigor instead'}.`,
                      { code: 'config-key-retired' },
                    );
                  }
                  throw new RunnerConfigError(
                    `${where}: runner.patterns.reviewed was retired; ${f.instruction}.`,
                    { code: 'config-key-retired' },
                  );
                }
              }
            }
          } catch (e) {
            if (e instanceof RunnerConfigError) throw e;
          }
        } else {
          const meta = RETIRED_CONFIG_KEYS[r.path];
          if (meta) {
            throw new RunnerConfigError(
              `${where}: ${r.path} was retired; ${meta.instruction}.`,
              { code: 'config-key-retired' },
            );
          }
        }
      }
    }
  }
}
