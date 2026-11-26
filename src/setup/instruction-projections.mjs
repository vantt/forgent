// instruction-projections.mjs — Render composed instruction sets into
// host-visible managed projections (P5).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { spawnSync } from 'node:child_process';

import { canonicalJson, replaceDurably } from '../native/door.mjs';
import { resolveHostBin } from '../util/host-bin.mjs';

export const INSTRUCTION_PROJECTION_SCHEMA_VERSION = 1;
export const PROJECTION_LEDGER_RELATIVE_PATH = '.fgos/installation/projections/ledger.json';
export const PORTABLE_AGENTS_DESTINATION = 'AGENTS.md';
export const PORTABLE_AGENTS_ADAPTER = 'portable-agents-md';
export const MANAGED_BLOCK_START = '<!-- fgos:instruction-projection:start -->';
export const MANAGED_BLOCK_END = '<!-- fgos:instruction-projection:end -->';
export const PORTABLE_HOST = '*';
export const EFFECTIVE_RULES_RELATIVE_PATH = '.fgos/instructions/effective/rules.json';
const PROJECTION_KEY = 'repo';
const EFFECTIVE_RULES_SCHEMA_VERSION = 1;
const CONTEXT_ENGINE_PREFIX = '\u001eFGOS-CONTEXT-ENGINE ';
const CONTEXT_ENGINE_PROTOCOL = 1;
const CONTEXT_ENGINE_TIMEOUT_MS = 60_000;
const START_CONTEXT_PREFIX = '\u001eFGOS-START-CONTEXT ';
const START_CONTEXT_PROTOCOL = 1;
const RULE_KINDS = ['law', 'boundary', 'procedure', 'preference', 'host-adapter'];

export class InstructionProjectionError extends Error {
  constructor(message, { code = 'INSTRUCTION_PROJECTION_ERROR', filePath, cause } = {}) {
    super(filePath ? `${message} (in ${filePath})` : message);
    this.name = 'InstructionProjectionError';
    this.code = code;
    this.filePath = filePath;
    if (cause) this.cause = cause;
  }
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function safeRelativePath(filePath, label) {
  if (path.isAbsolute(filePath)) {
    throw new InstructionProjectionError(`${label} must be relative`, {
      code: 'UNSAFE_PROJECTION_PATH',
      filePath,
    });
  }
  const normalized = path.normalize(filePath);
  if (normalized === '.' || normalized === '..' || normalized.startsWith(`..${path.sep}`)) {
    throw new InstructionProjectionError(`${label} must stay inside the project root`, {
      code: 'UNSAFE_PROJECTION_PATH',
      filePath,
    });
  }
  return toPosixPath(normalized);
}

function assertNoSymlinkPath(projectRoot, relativePath, label) {
  const parts = relativePath.split('/').filter(Boolean);
  let cursor = projectRoot;
  for (const part of parts) {
    cursor = path.join(cursor, part);
    let stat;
    try {
      stat = fs.lstatSync(cursor);
    } catch (err) {
      if (err && err.code === 'ENOENT') continue;
      throw err;
    }
    if (stat.isSymbolicLink()) {
      throw new InstructionProjectionError(`${label} must not cross a symlink`, {
        code: 'UNSAFE_PROJECTION_PATH',
        filePath: cursor,
      });
    }
  }
}

function sha256(text) {
  return `sha256:${crypto.createHash('sha256').update(text).digest('hex')}`;
}

function projectionId(targetKey, host, destinationPath) {
  return `instruction:${targetKey}:${host}:${destinationPath}`;
}

function invalidRuleSet(message) {
  return new InstructionProjectionError(`Compiled rule set is invalid: ${message}`, {
    code: 'INVALID_RULE_SET',
    filePath: EFFECTIVE_RULES_RELATIVE_PATH,
  });
}

/** Reads the compiled set through its schema (effective-rules.v1): shape, versions, then the digest. */
export function readEffectiveRules(text) {
  let set;
  try {
    set = JSON.parse(text);
  } catch (err) {
    throw Object.assign(invalidRuleSet('not valid JSON'), { cause: err });
  }
  if (!set || typeof set !== 'object' || Array.isArray(set)) throw invalidRuleSet('not an object');
  if (set.schemaVersion !== EFFECTIVE_RULES_SCHEMA_VERSION) throw invalidRuleSet(`schemaVersion ${JSON.stringify(set.schemaVersion)} is not ${EFFECTIVE_RULES_SCHEMA_VERSION}`);
  if (!Number.isInteger(set.whenKeysVersion)) throw invalidRuleSet('whenKeysVersion is not an integer');
  if (typeof set.digest !== 'string' || !/^[0-9a-f]{64}$/.test(set.digest)) throw invalidRuleSet('digest is not 64 hex characters');
  if (!Array.isArray(set.rules)) throw invalidRuleSet('rules is not an array');
  for (const rule of set.rules) {
    const id = typeof rule?.id === 'string' ? rule.id : '(no id)';
    if (!rule || typeof rule !== 'object') throw invalidRuleSet('a rule is not an object');
    for (const field of ['id', 'owner', 'kind', 'scope', 'body']) {
      if (typeof rule[field] !== 'string') throw invalidRuleSet(`rule ${id}: ${field} is not a string`);
    }
    if (!RULE_KINDS.includes(rule.kind)) throw invalidRuleSet(`rule ${id}: kind ${JSON.stringify(rule.kind)} is unknown`);
    if (!Number.isInteger(rule.specificity)) throw invalidRuleSet(`rule ${id}: specificity is not an integer`);
    if (rule.title !== undefined && typeof rule.title !== 'string') throw invalidRuleSet(`rule ${id}: title is not a string`);
    if (!Array.isArray(rule.sources) || rule.sources.length === 0 || rule.sources.some((source) => typeof source !== 'string')) {
      throw invalidRuleSet(`rule ${id}: sources is not a non-empty list of strings`);
    }
    if (!rule.when || typeof rule.when !== 'object' || Array.isArray(rule.when)
      || Object.values(rule.when).some((values) => !Array.isArray(values) || values.some((value) => typeof value !== 'string'))) {
      throw invalidRuleSet(`rule ${id}: when is not a mapping of keys to lists of strings`);
    }
  }
  const digest = crypto.createHash('sha256').update(canonicalJson(set.rules)).digest('hex');
  if (digest !== set.digest) throw invalidRuleSet('its digest does not match its rules');
  return set;
}

function contextEngineError(code, message, extra = {}) {
  return Object.assign(new InstructionProjectionError(message, { code }), extra);
}

/**
 * Compiles the project's rule units through the host (`fgos internal context-engine compile`), which checks them
 * and writes `.fgos/instructions/effective/rules.json`. The host is `FGOS_HOST_BIN` or the activated release; with
 * neither there is no composer to run and the refusal names that.
 */
/** Runs one host route and answers its framed line; the host is `FGOS_HOST_BIN` or the activated release. */
function runHostRoute(projectRoot, args, input, prefix, what) {
  const hostBin = resolveHostBin(projectRoot);
  if (!hostBin) {
    throw contextEngineError(
      'CONTEXT_ENGINE_HOST_UNAVAILABLE',
      `No fgos host binary found to ${what} (set FGOS_HOST_BIN or activate a release)`,
    );
  }
  const run = spawnSync(hostBin, args, {
    input,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: CONTEXT_ENGINE_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    windowsHide: true,
  });
  if (run.error) {
    throw contextEngineError('CONTEXT_ENGINE_HOST_FAILED', `The fgos host at ${hostBin} could not ${what}: ${run.error.message}`);
  }
  const answerLine = (run.stdout ?? '').split('\n').find((line) => line.startsWith(prefix));
  try {
    return JSON.parse(answerLine.slice(prefix.length));
  } catch {
    throw contextEngineError(
      'CONTEXT_ENGINE_HOST_FAILED',
      `The fgos host at ${hostBin} gave no answer to ${args.slice(0, 3).join(' ')} (exit ${run.status}): ${String(run.stderr ?? '').trim().slice(0, 300) || 'no output'}; it may predate that door`,
    );
  }
}

/**
 * Compiles the project's rule units through the host (`fgos internal context-engine compile`), which checks them
 * and writes `.fgos/instructions/effective/rules.json`. The host is `FGOS_HOST_BIN` or the activated release; with
 * neither there is no composer to run and the refusal names that.
 */
function compileRuleSet(projectRoot) {
  const line = runHostRoute(
    projectRoot,
    ['internal', 'context-engine', 'compile', '--protocol', String(CONTEXT_ENGINE_PROTOCOL)],
    `${JSON.stringify({ root: path.resolve(projectRoot) })}\n`,
    CONTEXT_ENGINE_PREFIX,
    'compile the rule units',
  );
  if (line.error) {
    throw contextEngineError('CONTEXT_ENGINE_HOST_FAILED', `The context engine failed (${line.error.code}): ${line.error.message}`);
  }
  const result = line.result ?? {};
  if (result.ok !== true) {
    const refusals = Array.isArray(result.refusals) ? result.refusals : [];
    const detail = refusals.map((refusal) => `${refusal.code}${refusal.source ? ` in ${refusal.source}` : ''}: ${refusal.message}`).join('; ');
    throw contextEngineError('CONTEXT_ENGINE_REFUSED', `The rule units are refused: ${detail || 'no detail given'}`, { refusals });
  }
}

/**
 * The rules a setup start receives, chosen by the one selector (`fgos internal start-context compose`) with the
 * standing facts and the file delivery: the ids of the matched rules. The answer must name the same rule set digest as
 * the set being rendered, so the block never mixes two sets.
 */
function selectRulesForSetup(projectRoot, effectiveSet) {
  const request = { facts: { project: path.basename(path.resolve(projectRoot)) }, payloads: [], delivery: 'agent-file' };
  const line = runHostRoute(
    projectRoot,
    ['internal', 'start-context', 'compose', '--protocol', String(START_CONTEXT_PROTOCOL), '--root', path.resolve(projectRoot)],
    `${JSON.stringify(request)}\n`,
    START_CONTEXT_PREFIX,
    'compose the setup start',
  );
  if (line.error) {
    throw contextEngineError('START_CONTEXT_FAILED', `The start-context composer failed (${line.error.code}): ${line.error.message}`);
  }
  if (line.refusal) {
    throw contextEngineError('START_CONTEXT_REFUSED', `The setup start is refused: ${line.refusal.code}: ${line.refusal.message}`, { refusal: line.refusal });
  }
  const context = line.result ?? {};
  if (context.ruleSetDigest !== effectiveSet.digest) {
    throw contextEngineError('START_CONTEXT_REFUSED', `The composer read rule set ${context.ruleSetDigest}, not the compiled ${effectiveSet.digest}`);
  }
  return new Set(Array.isArray(context.matched) ? context.matched : []);
}

function assertNoManagedMarkerLiterals(projectionContent, filePath) {
  const start = projectionContent.indexOf(MANAGED_BLOCK_START);
  const end = projectionContent.lastIndexOf(MANAGED_BLOCK_END);
  const body = projectionContent.slice(start + MANAGED_BLOCK_START.length, end);
  if (body.includes(MANAGED_BLOCK_START) || body.includes(MANAGED_BLOCK_END)) {
    throw new InstructionProjectionError('Rendered instruction projection must not contain managed marker literals', {
      code: 'UNSAFE_RENDERED_CONTENT',
      filePath,
    });
  }
}

function groupRulesByKind(rules) {
  const grouped = new Map();
  for (const rule of rules) {
    if (!grouped.has(rule.kind)) grouped.set(rule.kind, []);
    grouped.get(rule.kind).push(rule);
  }
  return grouped;
}

function renderRule(rule) {
  const lines = [
    `#### ${rule.title || rule.id}`,
    '',
    `- id: \`${rule.id}\``,
    `- source: \`${rule.sources.join('`, `')}\``,
  ];
  const body = String(rule.body ?? '').trim();
  if (body) lines.push('', body, '');
  else lines.push('');
  return lines.join('\n');
}

/** Renders the managed AGENTS.md block from the rules `selected` names (ids), in the set's order, grouped by kind. */
export function renderPortableAgentsProjection(effectiveSet, selected) {
  const grouped = groupRulesByKind(effectiveSet.rules.filter((rule) => selected.has(rule.id)));
  const lines = [
    MANAGED_BLOCK_START,
    '<!-- generated by fgos instruction projection; edit canonical instruction sources, not this block -->',
    `<!-- effective-set: ${EFFECTIVE_RULES_RELATIVE_PATH}; key=${PROJECTION_KEY}; host=${PORTABLE_HOST} -->`,
    '',
    '## fgOS Effective Instructions',
    '',
  ];
  for (const kind of RULE_KINDS) {
    const rules = grouped.get(kind) ?? [];
    if (rules.length === 0) continue;
    lines.push(`### ${kind}`, '');
    for (const rule of rules) lines.push(renderRule(rule));
  }
  lines.push(MANAGED_BLOCK_END, '');
  return lines.join('\n');
}

export function spliceManagedProjection(existingContent, blockContent, filePath = PORTABLE_AGENTS_DESTINATION) {
  const existing = existingContent ?? '';
  const starts = markerPositions(existing, MANAGED_BLOCK_START);
  const ends = markerPositions(existing, MANAGED_BLOCK_END);
  if (
    starts.length !== ends.length ||
    starts.length > 1 ||
    (starts.length === 1 && ends[0] < starts[0])
  ) {
    throw new InstructionProjectionError('Instruction projection managed block markers are malformed', {
      code: 'MALFORMED_MANAGED_BLOCK',
      filePath,
    });
  }
  if (starts.length === 0) {
    const prefix = existing.length === 0
      ? ''
      : `${existing}${existing.endsWith('\n') ? '\n' : '\n\n'}`;
    return `${prefix}${blockContent}`;
  }
  const start = starts[0];
  const end = ends[0];
  const afterEnd = end + MANAGED_BLOCK_END.length;
  return `${existing.slice(0, start)}${blockContent.replace(/\n$/, '')}${existing.slice(afterEnd)}`;
}

function markerPositions(content, marker) {
  const positions = [];
  let index = content.indexOf(marker);
  while (index !== -1) {
    positions.push(index);
    index = content.indexOf(marker, index + marker.length);
  }
  return positions;
}

function readLedger(ledgerPath) {
  if (!fs.existsSync(ledgerPath)) {
    return { schemaVersion: INSTRUCTION_PROJECTION_SCHEMA_VERSION, projections: [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  } catch (err) {
    throw new InstructionProjectionError('Projection ledger is not valid JSON', {
      code: 'INVALID_LEDGER',
      filePath: ledgerPath,
      cause: err,
    });
  }
  if (
    !parsed ||
    parsed.schemaVersion !== INSTRUCTION_PROJECTION_SCHEMA_VERSION ||
    !Array.isArray(parsed.projections)
  ) {
    throw new InstructionProjectionError('Projection ledger has an invalid shape', {
      code: 'INVALID_LEDGER',
      filePath: ledgerPath,
    });
  }
  return parsed;
}

function serializeLedger(ledger) {
  const normalized = {
    schemaVersion: INSTRUCTION_PROJECTION_SCHEMA_VERSION,
    projections: [...ledger.projections].sort((a, b) => a.id.localeCompare(b.id)),
  };
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

function upsertLedgerEntry(ledger, entry) {
  const next = {
    schemaVersion: INSTRUCTION_PROJECTION_SCHEMA_VERSION,
    projections: ledger.projections.filter((item) => item.id !== entry.id),
  };
  next.projections.push(entry);
  return next;
}

export function computeInstructionProjection(projectRoot, options = {}) {
  const host = options.host ?? PORTABLE_HOST;
  if (host !== PORTABLE_HOST) {
    throw new InstructionProjectionError(`Unsupported instruction projection host "${host}"`, {
      code: 'UNSUPPORTED_PROJECTION_HOST',
    });
  }
  const destinationPath = options.destinationPath ?? PORTABLE_AGENTS_DESTINATION;
  const destinationRelativePath = safeRelativePath(destinationPath, 'Instruction projection destination path');
  assertNoSymlinkPath(projectRoot, EFFECTIVE_RULES_RELATIVE_PATH, 'Effective instruction set path');
  compileRuleSet(projectRoot);
  const effectiveSetContent = fs.readFileSync(path.join(projectRoot, EFFECTIVE_RULES_RELATIVE_PATH), 'utf8');
  const effectiveSet = readEffectiveRules(effectiveSetContent);
  const projectionContent = renderPortableAgentsProjection(effectiveSet, selectRulesForSetup(projectRoot, effectiveSet));
  assertNoManagedMarkerLiterals(projectionContent, destinationRelativePath);
  const ledgerEntry = Object.freeze({
    id: projectionId(PROJECTION_KEY, host, destinationRelativePath),
    kind: 'instruction-projection',
    runtime: 'local-fgos',
    source: EFFECTIVE_RULES_RELATIVE_PATH,
    effectiveSetDigest: `sha256:${effectiveSet.digest}`,
    renderAdapter: PORTABLE_AGENTS_ADAPTER,
    destinationPath: destinationRelativePath,
    ownership: 'managed-block',
    markers: { start: MANAGED_BLOCK_START, end: MANAGED_BLOCK_END },
    contentDigest: sha256(projectionContent),
  });
  return Object.freeze({
    effectiveSet,
    effectiveSetRelativePath: EFFECTIVE_RULES_RELATIVE_PATH,
    effectiveSetContent,
    projectionContent,
    destinationRelativePath,
    ledgerRelativePath: PROJECTION_LEDGER_RELATIVE_PATH,
    ledgerEntry,
  });
}

export function inspectInstructionProjection(projectRoot, options = {}) {
  const computed = computeInstructionProjection(projectRoot, options);
  const destinationPath = path.join(projectRoot, computed.destinationRelativePath);
  const ledgerPath = path.join(projectRoot, computed.ledgerRelativePath);
  const problems = [];
  let hasManagedBlock = false;
  let hasLedgerEntry = false;

  assertNoSymlinkPath(projectRoot, computed.destinationRelativePath, 'Instruction projection destination path');
  assertNoSymlinkPath(projectRoot, computed.ledgerRelativePath, 'Projection ledger path');

  if (!fs.existsSync(destinationPath)) {
    hasManagedBlock = false;
  } else {
    const content = fs.readFileSync(destinationPath, 'utf8');
    const hasAnyMarker = content.includes(MANAGED_BLOCK_START) || content.includes(MANAGED_BLOCK_END);
    if (hasAnyMarker && spliceManagedProjection(content, computed.projectionContent, destinationPath) !== content) {
      problems.push(`${computed.destinationRelativePath} managed instruction block stale`);
    }
    hasManagedBlock = hasAnyMarker;
  }

  if (fs.existsSync(ledgerPath)) {
    const ledger = readLedger(ledgerPath);
    const existing = ledger.projections.find((entry) => entry.id === computed.ledgerEntry.id);
    hasLedgerEntry = Boolean(existing);
    if (existing && JSON.stringify(existing) !== JSON.stringify(computed.ledgerEntry)) {
      problems.push(`${computed.ledgerRelativePath} missing or stale entry ${computed.ledgerEntry.id}`);
    }
  }

  // The compiled set is rebuilt from the rule units by every compute, so it never counts as materialized state.
  const materialized = hasManagedBlock || hasLedgerEntry;
  if (hasLedgerEntry) {
    if (!hasManagedBlock) problems.push(`${computed.destinationRelativePath} missing managed instruction block`);
  }

  return Object.freeze({ passed: problems.length === 0, problems, materialized, computed });
}

export function materializeInstructionProjection(projectRoot, options = {}) {
  const computed = computeInstructionProjection(projectRoot, options);
  const destinationPath = path.join(projectRoot, computed.destinationRelativePath);
  const ledgerPath = path.join(projectRoot, computed.ledgerRelativePath);
  assertNoSymlinkPath(projectRoot, computed.destinationRelativePath, 'Instruction projection destination path');
  assertNoSymlinkPath(projectRoot, computed.ledgerRelativePath, 'Projection ledger path');

  let changed = false;
  const writeIfChanged = (filePath, content, { durable = false } = {}) => {
    const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
    if (existing === content) return;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (durable) {
      // A user-owned file: keep its mode, and never leave it half written.
      const mode = existing === undefined ? 0o644 : fs.statSync(filePath).mode & 0o7777;
      replaceDurably(path.dirname(filePath), path.basename(filePath), content, mode);
    } else {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    changed = true;
  };

  const existingDestination = fs.existsSync(destinationPath) ? fs.readFileSync(destinationPath, 'utf8') : '';
  const nextDestination = spliceManagedProjection(existingDestination, computed.projectionContent, destinationPath);
  writeIfChanged(destinationPath, nextDestination, { durable: true });

  const ledger = readLedger(ledgerPath);
  const nextLedger = upsertLedgerEntry(ledger, computed.ledgerEntry);
  writeIfChanged(ledgerPath, serializeLedger(nextLedger));

  return Object.freeze({ changed, computed });
}
