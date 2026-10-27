// runner-config-conversion.mjs — converts a project config file holding retired
// runner.patterns keys to the runner.loops and schema 2 layout.
// Reads the project file only and never rewrites the global file.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseYaml } from '../util/yaml.mjs';
import { retiredKeysIn } from '../runner/dispatch/retired-config-keys.mjs';
import { loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import * as facade from '../config/facade.mjs';

const CONFIG_BASE = 'config';
const YAML_EXT = '.yaml';
const JSON_EXT = '.json';

function findProjectConfigFile(projectDir) {
  const fgosDir = path.join(projectDir, '.fgos');
  if (!fs.existsSync(fgosDir)) return null;
  const yamlPath = path.join(fgosDir, `${CONFIG_BASE}${YAML_EXT}`);
  if (fs.existsSync(yamlPath)) return yamlPath;
  const jsonPath = path.join(fgosDir, `${CONFIG_BASE}${JSON_EXT}`);
  if (fs.existsSync(jsonPath)) return jsonPath;
  return null;
}

/**
 * Converts a project config file if it holds retired runner.patterns keys.
 * Idempotent: returns 'unchanged' when no retired keys are present.
 *
 * @param {string} projectDir
 * @returns {{ status: 'absent'|'unchanged'|'converted', backup?: string, written: string[] }}
 */
export function convertRunnerPatternsConfig(projectDir) {
  const targetPath = findProjectConfigFile(projectDir);
  if (!targetPath) {
    return { status: 'absent', written: [] };
  }

  const originalText = fs.readFileSync(targetPath, 'utf8');
  let parsed;
  try {
    parsed = parseYaml(originalText, { filename: targetPath });
  } catch (err) {
    throw new Error(`cannot parse config file at ${targetPath}: ${err.message}`);
  }

  const retired = retiredKeysIn(parsed, targetPath);
  if (!retired || retired.length === 0) {
    return { status: 'unchanged', written: [] };
  }

  // If the facade provides an applyPatch or patch door, writes go through it
  if (typeof facade.applyPatch === 'function' || typeof facade.patch === 'function') {
    const doorPatch = facade.applyPatch ?? facade.patch;
    try {
      doorPatch({
        projectRoot: projectDir,
        target: 'project',
        reason: 'convert retired runner.patterns keys to runner.loops and schema 2',
      });
    } catch (err) {
      if (err?.code === 'config-key-retired') {
        throw err;
      }
      throw err;
    }
  }

  const now = new Date();
  const ts = now.toISOString().replace(/[-:.]/g, '');
  const backupPath = `${targetPath}.pre-patterns-catalog-${ts}`;
  fs.copyFileSync(targetPath, backupPath);

  const runner = parsed.runner ?? parsed;
  const written = [];

  runner.loops = runner.loops ?? {};
  runner.patterns = runner.patterns ?? {};

  if (runner.patterns.reviewed && typeof runner.patterns.reviewed === 'object' && !Array.isArray(runner.patterns.reviewed)) {
    const rev = runner.patterns.reviewed;
    const hasTuning = 'maxRounds' in rev || 'checkersByRigor' in rev;
    if (hasTuning) {
      runner.loops.reviewed = runner.loops.reviewed ?? {};
      if ('maxRounds' in rev) {
        runner.loops.reviewed.maxRounds = rev.maxRounds;
        delete rev.maxRounds;
        written.push('runner.loops.reviewed.maxRounds');
      }
      if ('checkersByRigor' in rev) {
        runner.loops.reviewed.checkersByRigor = rev.checkersByRigor;
        delete rev.checkersByRigor;
        written.push('runner.loops.reviewed.checkersByRigor');
      }
      written.push('runner.loops.reviewed');
      if (Object.keys(rev).length === 0) {
        delete runner.patterns.reviewed;
      }
    }
  }

  if ('defaultRule' in runner.patterns) {
    delete runner.patterns.defaultRule;
  }

  if ('research-fan-out-gated' in runner.patterns) {
    runner.patterns['research-fan-out'] = runner.patterns['research-fan-out-gated'];
    delete runner.patterns['research-fan-out-gated'];
    written.push('runner.patterns.research-fan-out');
  }

  runner.patterns.seatBinding = runner.patterns.seatBinding ?? {};
  runner.patterns.seatBinding.schema = 2;
  written.push('runner.patterns.seatBinding.schema');

  const explanation = 'runner.loops.reviewed: tuning of the reviewed loop, moved from runner.patterns.reviewed; runner.patterns.seatBinding.schema: 2 marks collaboration patterns and loops.';
  runner.$comment = explanation;
  if (parsed !== runner && parsed && typeof parsed === 'object') {
    parsed.$comment = explanation;
  }

  let nextContent;
  if (targetPath.endsWith(YAML_EXT)) {
    let header = '# @fgos:v1\n\n';
    if (originalText.startsWith('# @fgos:')) {
      const match = originalText.match(/^(#[^\n]*\n+)/);
      if (match) header = match[1];
    }
    nextContent = `${header}${JSON.stringify(parsed, null, 2)}\n`;
  } else {
    nextContent = `${JSON.stringify(parsed, null, 2)}\n`;
  }

  fs.writeFileSync(targetPath, nextContent, 'utf8');

  try {
    loadRunnerConfigForDir(projectDir);
  } catch (err) {
    fs.copyFileSync(backupPath, targetPath);
    throw err;
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
  const yamlPath = path.join(globalDir, `${CONFIG_BASE}${YAML_EXT}`);
  const jsonPath = path.join(globalDir, `${CONFIG_BASE}${JSON_EXT}`);
  const filePath = fs.existsSync(yamlPath) ? yamlPath : (fs.existsSync(jsonPath) ? jsonPath : null);
  if (!filePath) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = parseYaml(raw, { filename: filePath });
    const retired = retiredKeysIn(parsed, filePath);
    if (!retired || retired.length === 0) return null;
    return {
      file: filePath,
      edits: [
        'move runner.patterns.reviewed.{maxRounds,checkersByRigor} to runner.loops.reviewed.*',
        'delete runner.patterns.defaultRule',
      ],
      command: 'fgos config patch <patch-file> --global --reason "convert retired keys to runner.loops"',
    };
  } catch {
    return null;
  }
}
