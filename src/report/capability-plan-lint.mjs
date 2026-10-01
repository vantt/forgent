import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

import { validateUnit } from '../runner/execution/unit.mjs';

// capability-plan-lint.mjs — static/read-only harness (docs/history/
// agent-coordination-foundation/plan.md): checks a plan's own text against
// the shared planning-capability-awareness doctrine without touching Work
// schema, Assignment shape, or lifecycle state. Pure read of plan text in,
// findings out, nothing written, nothing enforced by itself -- `fgos
// plan-lint` (bin/fgos.mjs) is the one real caller today.
//
// Scans the `- unit: ... / capability: <name>` convention
// core/skills/_shared/planning-capability-awareness.md documents, plus the
// `## Product Gates` markdown table convention
// (docs/how-to/author-a-plan-loop-track.md).

const UNIT_LINE = /^-\s*unit:\s*(.+)$/;
const CAPABILITY_LINE = /^\s+capability:\s*(.+)$/;
// Case-insensitive; tolerates whitespace on either side of the colon and an
// optional leading list-bullet ("- "/"* ") -- "Model: x", "provider : x",
// and "  - model: x" all count as a pin, the same as "  model: x" always
// did. Still requires the literal key immediately before the colon (no
// trailing letters), so a near-miss like "executors:"/"actor:" is still
// never mistaken for a real pin key.
const PIN_LINE = /^\s+(?:[-*]\s+)?(executor|provider|model|tier|prefer|invocation|actors)\s*:\s*\S/i;
// Exact literal token "unresolved" only -- a negative lookahead blocks any
// word char or hyphen immediately after it, so "unresolved-foo" is never
// mistaken for the hedge marker the way a bare `\b` boundary would allow.
const UNRESOLVED_MARK = /^unresolved(?![\w-])/i;
// ATX heading ("#" through "######"), and a fenced code block delimiter
// (three-or-more backticks or tildes) -- both are parsing-context
// boundaries: a heading ends whatever unit block/table is currently open,
// and anything strictly between a fence's open/close line is prose/example
// text, never real plan content.
const HEADING_LINE = /^#{1,6}(\s|$)/;
// Captures the marker run plus everything after it on the same line, so
// callers can enforce CommonMark's fence-close rule (nothing but trailing
// whitespace after the marker) and the backtick-opener rule (an info string
// on a backtick-fence opener can never itself contain a backtick) -- see
// call site below.
const FENCE_LINE = /^\s*(`{3,}|~{3,})(.*)$/;

const GENERIC_SHAPE = /^[a-z][a-z0-9-]*$/;
const DOMAIN_SCOPED_SHAPE = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;
const DISALLOWED_G2_FIELDS = Object.freeze([
  'executor',
  'provider',
  'model',
  'tier',
  'invocation',
  'actors',
  'prefer',
  'overrides',
]);

const KNOWN_PATTERNS = Object.freeze(new Set([
  'solo',
  'reviewed',
  'panel',
  'code-change',
  'consult',
  'research-fan-out',
  'rfc',
]));

export function resolvePhaseFile(dirPath, phase) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`Not a directory: "${dirPath}"`);
  }
  const phaseNum = typeof phase === 'number' ? phase : parseInt(String(phase), 10);
  if (Number.isNaN(phaseNum)) {
    throw new Error(`Invalid phase number: "${phase}"`);
  }
  const files = fs.readdirSync(dirPath);
  const pattern = new RegExp(`^phase-0*${phaseNum}(?:-.*)?\\.md$`, 'i');
  const matching = files.filter((f) => pattern.test(f)).sort();
  if (matching.length === 0) {
    throw new Error(`No phase file matching phase ${phase} in "${dirPath}"`);
  }
  return path.join(dirPath, matching[0]);
}

export function globToRegex(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§DOUBLE§')
    .replace(/\*/g, '[^/]*')
    .replace(/§DOUBLE§/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function pathsOverlap(a, b) {
  if (a === b) return true;
  const normA = a.replace(/\/+$/, '');
  const normB = b.replace(/\/+$/, '');
  if (normA === normB) return true;
  if (normB.startsWith(normA + '/') || normA.startsWith(normB + '/')) return true;

  const hasGlobA = a.includes('*');
  const hasGlobB = b.includes('*');

  if (hasGlobA || hasGlobB) {
    if (globToRegex(a).test(b) || globToRegex(b).test(a)) return true;

    const hasDoubleA = a.includes('**');
    const hasDoubleB = b.includes('**');
    const prefixA = hasDoubleA ? a.split('**')[0].replace(/\/+$/, '') : null;
    const prefixB = hasDoubleB ? b.split('**')[0].replace(/\/+$/, '') : null;

    if (hasDoubleA && hasDoubleB) {
      if (!prefixA || !prefixB || prefixA === prefixB || prefixA.startsWith(prefixB + '/') || prefixB.startsWith(prefixA + '/')) {
        return true;
      }
    } else if (hasDoubleA) {
      if (!prefixA || normB === prefixA || normB.startsWith(prefixA + '/')) {
        return true;
      }
    } else if (hasDoubleB) {
      if (!prefixB || normA === prefixB || normA.startsWith(prefixB + '/')) {
        return true;
      }
    }
  }
  return false;
}

function isCapabilityDeclared(cap, catalog) {
  if (!catalog || typeof catalog !== 'object') return true;
  if (Array.isArray(catalog) || catalog instanceof Set) {
    const set = catalog instanceof Set ? catalog : new Set(catalog);
    if (set.has(cap)) return true;
    if (cap.includes(':')) {
      const verb = cap.split(':')[1];
      if (set.has(verb)) return true;
    }
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(catalog, cap)) return true;
  if (cap.includes(':')) {
    const verb = cap.split(':')[1];
    if (Object.prototype.hasOwnProperty.call(catalog, verb)) return true;
  }
  for (const [name, entry] of Object.entries(catalog)) {
    if (name === cap) return true;
    if (entry?.aliases && Array.isArray(entry.aliases) && entry.aliases.includes(cap)) return true;
    if (cap.includes(':')) {
      const verb = cap.split(':')[1];
      if (name === verb) return true;
      if (entry?.aliases && Array.isArray(entry.aliases) && entry.aliases.includes(verb)) return true;
    }
  }
  return false;
}

function extractUnitBlocks(content) {
  const lines = String(content ?? '').split(/\r?\n/);
  let fenceState = null;
  let hasExplicitUnits = false;

  for (const rawLine of lines) {
    const fenceMatch = FENCE_LINE.exec(rawLine);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const rest = fenceMatch[2];
      if (fenceState) {
        if (marker[0] === fenceState.char && marker.length >= fenceState.len && /^\s*$/.test(rest)) {
          fenceState = null;
        }
        continue;
      }
      if (!(marker[0] === '`' && rest.includes('`'))) {
        fenceState = { char: marker[0], len: marker.length };
        continue;
      }
    }
    if (fenceState) continue;
    if (/^##+\s+Units\b/i.test(rawLine)) {
      hasExplicitUnits = true;
      break;
    }
  }

  fenceState = null;
  let inUnits = !hasExplicitUnits;
  const blocks = [];
  let currentBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNo = i + 1;

    const fenceMatch = FENCE_LINE.exec(rawLine);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const rest = fenceMatch[2];
      if (fenceState) {
        if (marker[0] === fenceState.char && marker.length >= fenceState.len && /^\s*$/.test(rest)) {
          fenceState = null;
        }
        continue;
      }
      if (!(marker[0] === '`' && rest.includes('`'))) {
        fenceState = { char: marker[0], len: marker.length };
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }
    }
    if (fenceState) continue;

    if (hasExplicitUnits) {
      if (/^##+\s+Units\b/i.test(rawLine)) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inUnits = true;
        continue;
      }
      if (inUnits && /^#{1,6}(\s|$)/.test(rawLine)) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inUnits = false;
        continue;
      }
    } else {
      if (/^#{1,6}(\s|$)/.test(rawLine)) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }
    }

    if (!inUnits) continue;

    if (UNIT_LINE.test(rawLine)) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        startLine: lineNo,
        lines: [rawLine],
      };
      continue;
    }

    if (currentBlock) {
      if (/^\s*$/.test(rawLine) || /^\s+/.test(rawLine)) {
        currentBlock.lines.push(rawLine);
      } else {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

export function lintPhaseUnits(contentOrPath, { config, phase, cellId } = {}) {
  let content = contentOrPath;
  let resolvedPath = null;
  if (typeof contentOrPath === 'string' && !contentOrPath.includes('\n')) {
    if (fs.existsSync(contentOrPath)) {
      const stat = fs.statSync(contentOrPath);
      if (stat.isDirectory()) {
        resolvedPath = resolvePhaseFile(contentOrPath, phase);
        content = fs.readFileSync(resolvedPath, 'utf8');
      } else if (stat.isFile()) {
        resolvedPath = contentOrPath;
        content = fs.readFileSync(resolvedPath, 'utf8');
      }
    }
  }

  const blocks = extractUnitBlocks(content);
  const units = [];
  const findings = [];
  const pushFinding = (f) => findings.push(f);

  for (const block of blocks) {
    const unitText = block.lines.join('\n');
    let parsed;
    try {
      parsed = YAML.parse(unitText);
    } catch (err) {
      pushFinding({
        line: block.startLine,
        unit: null,
        source: 'unit-block',
        severity: 'hard',
        code: 'unit.syntax-error',
        message: `failed to parse YAML unit block: ${err.message}`,
      });
      continue;
    }

    const rawUnit = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!rawUnit || typeof rawUnit !== 'object') {
      pushFinding({
        line: block.startLine,
        unit: null,
        source: 'unit-block',
        severity: 'hard',
        code: 'unit.invalid',
        message: 'unit block must be an object',
      });
      continue;
    }

    const unitId = typeof (rawUnit.id ?? rawUnit.unit) === 'string' ? String(rawUnit.id ?? rawUnit.unit).trim() : null;

    // Check G2 pinned fields
    for (const field of DISALLOWED_G2_FIELDS) {
      const matchingKey = Object.keys(rawUnit).find((k) => k.toLowerCase() === field.toLowerCase());
      if (matchingKey && rawUnit[matchingKey] !== undefined) {
        let pinLine = block.startLine;
        const pinRegex = new RegExp(`^\\s*(?:[-*]\\s+)?${matchingKey}\\s*:`, 'i');
        for (let l = 0; l < block.lines.length; l++) {
          if (pinRegex.test(block.lines[l])) {
            pinLine = block.startLine + l;
            break;
          }
        }
        pushFinding({
          line: pinLine,
          unit: unitId,
          source: 'unit-block',
          severity: 'hard',
          code: 'capability.pinned',
          message: `unit "${unitId}" pins "${matchingKey}" -- a plan never pins executor/provider/model/tier/prefer/invocation/actors/overrides; that is execution-time decide's job`,
        });
        delete rawUnit[matchingKey];
      }
    }

    // Normalize unit -> id
    const toValidate = {
      ...rawUnit,
      id: unitId,
    };
    delete toValidate.unit;

    let validated = null;
    try {
      validated = validateUnit(toValidate);
    } catch (err) {
      pushFinding({
        line: block.startLine,
        unit: unitId,
        source: 'unit-block',
        severity: 'hard',
        code: 'unit.invalid',
        message: err.message,
      });
    }

    if (validated) {
      const u = {
        ...validated,
        unit: validated.id,
        line: block.startLine,
        source: 'unit-block',
      };
      units.push(u);
    }
  }

  // Duplicate unit IDs check
  const seenIds = new Map();
  for (const u of units) {
    if (seenIds.has(u.id)) {
      pushFinding({
        line: u.line,
        unit: u.id,
        source: 'unit-block',
        severity: 'hard',
        code: 'unit.duplicate-id',
        message: `duplicate unit id "${u.id}" in phase (first declared at line ${seenIds.get(u.id)})`,
      });
    } else {
      seenIds.set(u.id, u.line);
    }
  }

  // Dependency cycles check
  const unitMap = new Map(units.map((u) => [u.id, u]));
  const visited = new Map();
  const reportedCycles = new Set();

  function dfsCycle(nodeId, currentPath) {
    visited.set(nodeId, 1);
    const unit = unitMap.get(nodeId);
    if (unit && Array.isArray(unit.dependsOn)) {
      for (const depId of unit.dependsOn) {
        if (!unitMap.has(depId)) continue;
        const state = visited.get(depId) || 0;
        if (state === 1) {
          const cyclePath = [...currentPath, depId];
          const cycleStart = cyclePath.indexOf(depId);
          const cycle = cyclePath.slice(cycleStart);
          const cycleKey = [...cycle].sort().join(',');
          if (!reportedCycles.has(cycleKey)) {
            reportedCycles.add(cycleKey);
            pushFinding({
              line: unit.line,
              unit: unit.id,
              source: 'unit-block',
              severity: 'hard',
              code: 'unit.dependency-cycle',
              message: `dependency cycle detected among units: ${cycle.join(' -> ')}`,
            });
          }
        } else if (state === 0) {
          dfsCycle(depId, [...currentPath, depId]);
        }
      }
    }
    visited.set(nodeId, 2);
  }

  for (const u of units) {
    if (!visited.has(u.id) || visited.get(u.id) === 0) {
      dfsCycle(u.id, [u.id]);
    }
  }

  // Dependency reachability & writes collision check
  const reachable = new Map();
  for (const u of units) {
    const set = new Set();
    const queue = [...(u.dependsOn ?? [])];
    while (queue.length > 0) {
      const dep = queue.pop();
      if (!set.has(dep)) {
        set.add(dep);
        const depUnit = unitMap.get(dep);
        if (depUnit && Array.isArray(depUnit.dependsOn)) {
          for (const nextDep of depUnit.dependsOn) {
            if (!set.has(nextDep)) queue.push(nextDep);
          }
        }
      }
    }
    reachable.set(u.id, set);
  }

  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const uA = units[i];
      const uB = units[j];
      const aDependsOnB = reachable.get(uA.id)?.has(uB.id);
      const bDependsOnA = reachable.get(uB.id)?.has(uA.id);
      if (!aDependsOnB && !bDependsOnA) {
        let collisionFound = false;
        for (const wA of uA.writes ?? []) {
          for (const wB of uB.writes ?? []) {
            if (pathsOverlap(wA, wB)) {
              pushFinding({
                line: uB.line,
                unit: uB.id,
                source: 'unit-block',
                severity: 'hard',
                code: 'unit.writes-collision',
                message: `units "${uA.id}" and "${uB.id}" have overlapping writes ("${wA}" and "${wB}") without a dependency between them`,
              });
              collisionFound = true;
              break;
            }
          }
          if (collisionFound) break;
        }
      }
    }
  }

  // Capability catalog check
  const catalog = config?.runner?.capabilities ?? config?.capabilities ?? (config && typeof config === 'object' && !('runner' in config) && !('capabilities' in config) ? config : null);
  for (const u of units) {
    const cap = u.capability;
    if (cap) {
      if (UNRESOLVED_MARK.test(cap)) {
        pushFinding({
          line: u.line,
          unit: u.id,
          source: 'unit-block',
          severity: 'warn',
          code: 'capability.unresolved',
          message: `unit "${u.id}" capability is unresolved -- resolve before merge`,
        });
      } else if (catalog && !isCapabilityDeclared(cap, catalog)) {
        pushFinding({
          line: u.line,
          unit: u.id,
          source: 'unit-block',
          severity: 'warn',
          code: 'capability.unregistered',
          message: `unit "${u.id}" capability "${cap}" is not declared in config.runner.capabilities`,
        });
      }
    }

    if (u.pattern && !KNOWN_PATTERNS.has(u.pattern)) {
      pushFinding({
        line: u.line,
        unit: u.id,
        source: 'unit-block',
        severity: 'warn',
        code: 'pattern.unknown',
        message: `unit "${u.id}" specifies unknown pattern "${u.pattern}"`,
      });
    }
  }

  if (cellId !== undefined) {
    const filteredUnits = units.filter((entry) => matchesCellId(entry, cellId));
    const filteredFindings = findings.filter((entry) => matchesCellId(entry, cellId));
    if (filteredUnits.length === 0) {
      filteredFindings.push({
        line: null,
        unit: null,
        source: null,
        severity: 'hard',
        code: 'capability.undeclared',
        message: `--cell "${cellId}" matches no unit block`,
      });
    }
    return {
      ok: !filteredFindings.some((f) => f.severity === 'hard'),
      units: filteredUnits,
      findings: filteredFindings,
      ...(resolvedPath ? { path: resolvedPath } : {}),
    };
  }

  return {
    ok: !findings.some((f) => f.severity === 'hard'),
    units,
    findings,
    ...(resolvedPath ? { path: resolvedPath } : {}),
  };
}


function splitTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|') || trimmed.length < 2) return null;
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

// Product Gates DATA rows only: the Exit cell is free-form prose that can
// legitimately contain a literal "|" (e.g. `<dir|tar.gz>`). Splitting on
// every "|" like a header/separator row would silently truncate the whole
// table at that row. Split on only the first 3 delimiters after
// Phase/Cell/Capability; everything left, pipes included, is the Exit cell.
function splitProductGatesDataRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|') || trimmed.length < 2) return null;
  const parts = trimmed.slice(1, -1).split('|');
  if (parts.length < 4) return null;
  const [phase, cellName, capability, ...rest] = parts;
  return [phase.trim(), cellName.trim(), capability.trim(), rest.join('|').trim()];
}

// A Capability/Cell cell written as `` `code:implement` `` is markdown
// styling, not part of the value -- strip one surrounding pair before
// validating or matching it.
function stripSurroundingBackticks(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.length >= 2 && trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isProductGatesHeader(cells) {
  return (
    cells.length === 4 &&
    cells[0].toLowerCase() === 'phase' &&
    cells[1].toLowerCase() === 'cell' &&
    cells[2].toLowerCase() === 'capability' &&
    cells[3].toLowerCase() === 'exit'
  );
}

function isSeparatorRow(cells) {
  return cells.length === 4 && cells.every((cell) => /^:?-+:?$/.test(cell));
}

function firstToken(label) {
  const match = /^(\S+)/.exec(String(label ?? '').trim());
  return match ? match[1] : String(label ?? '').trim();
}

function matchesCellId(entry, cellId) {
  if (!entry || entry.unit == null) return false;
  if (entry.source === 'product-gates') return entry.unit === cellId;
  return firstToken(entry.unit) === cellId;
}

/**
 * @param {string} text - raw plan.md content
 * @param {string[]} registeredCapabilities - canonical names to check
 *   against (e.g. `Object.keys(runner.capabilities)` from the caller's own
 *   config). Never defaulted here -- the caller owns what "registered"
 *   means for its own config, this module has no opinion. Never reads
 *   config or infers from prose itself; stays pure.
 * @param {{ cellId?: string }} [options] - `cellId` scopes the result to
 *   only the unit block or Product Gates row whose id matches; when given
 *   and nothing matches, the result carries a single `capability.undeclared`
 *   (severity `hard`) finding instead.
 * @returns {{
 *   ok: boolean,
 *   units: Array<{unit: string, capability: string|null, line: number, source: 'unit-block'|'product-gates'}>,
 *   findings: Array<{line: number|null, unit: string|null, source: string|null, code: string, severity: 'hard'|'warn', message: string}>,
 * }}
 */
export function lintPlanCapabilityAnnotations(textOrPath, registeredCapabilitiesOrOptions = [], maybeOptions = {}) {
  let registeredCapabilities;
  let options;

  if (Array.isArray(registeredCapabilitiesOrOptions) || registeredCapabilitiesOrOptions instanceof Set) {
    registeredCapabilities = registeredCapabilitiesOrOptions;
    options = maybeOptions ?? {};
  } else {
    options = registeredCapabilitiesOrOptions ?? {};
    registeredCapabilities = options.registeredCapabilities ?? (options.config?.capabilities ? Object.keys(options.config.capabilities) : []);
  }

  if (options.phase !== undefined) {
    const planDir = typeof textOrPath === 'string' && fs.existsSync(textOrPath) && fs.statSync(textOrPath).isDirectory()
      ? textOrPath
      : (typeof textOrPath === 'string' && fs.existsSync(textOrPath) ? path.dirname(textOrPath) : null);
    if (planDir) {
      const resolvedFile = resolvePhaseFile(planDir, options.phase);
      return lintPhaseUnits(resolvedFile, options);
    }
    return lintPhaseUnits(textOrPath, options);
  }

  if (typeof textOrPath === 'string' && !textOrPath.includes('\n') && fs.existsSync(textOrPath)) {
    if (/^phase-\d+/i.test(path.basename(textOrPath))) {
      return lintPhaseUnits(textOrPath, options);
    }
  }

  let text = textOrPath;
  if (typeof textOrPath === 'string' && !textOrPath.includes('\n') && fs.existsSync(textOrPath)) {
    const stat = fs.statSync(textOrPath);
    if (stat.isDirectory()) {
      const planMd = path.join(textOrPath, 'plan.md');
      if (fs.existsSync(planMd)) {
        text = fs.readFileSync(planMd, 'utf8');
      }
    } else if (stat.isFile()) {
      text = fs.readFileSync(textOrPath, 'utf8');
    }
  }

  const { cellId } = options;
  const registered = new Set(registeredCapabilities ?? []);
  const lines = String(text ?? '').split('\n');
  const units = [];
  const findings = [];

  const pushFinding = (finding) => findings.push(finding);

  // Shared by a "- unit:" block's capability and a Product Gates row's
  // Capability cell -- one evaluation path, two callers.
  const evaluateCapabilityText = (rawText, ctx) => {
    const text = stripSurroundingBackticks(rawText);
    if (UNRESOLVED_MARK.test(text)) {
      pushFinding({
        line: ctx.line,
        unit: ctx.unit,
        source: ctx.source,
        severity: 'warn',
        code: 'capability.unresolved',
        message: `unit "${ctx.unit}" capability is unresolved -- resolve before merge`,
      });
      return;
    }
    if (text.includes('(')) {
      pushFinding({
        line: ctx.line,
        unit: ctx.unit,
        source: ctx.source,
        severity: 'hard',
        code: 'capability.hedged',
        message: `unit "${ctx.unit}" capability "${text}" hedges with a parenthetical -- only "unresolved (...)" may use one`,
      });
    }
    const bare = text.replace(/\s*\(.*\)\s*$/, '').trim();
    if (!GENERIC_SHAPE.test(bare) && !DOMAIN_SCOPED_SHAPE.test(bare)) {
      pushFinding({
        line: ctx.line,
        unit: ctx.unit,
        source: ctx.source,
        severity: 'hard',
        code: 'capability.invalid-shape',
        message: `capability "${bare}" is not a valid canonical shape (generic "name" or domain-scoped "domain:name")`,
      });
    } else if (!registered.has(bare)) {
      pushFinding({
        line: ctx.line,
        unit: ctx.unit,
        source: ctx.source,
        severity: 'hard',
        code: 'capability.unregistered',
        message: `capability "${bare}" is not registered -- mark it "unresolved" explicitly or register it in DEFAULT_CAPABILITY_SLOTS first`,
      });
    }
  };

  let current = null; // { unit, unitLine, capability, capabilityLine, pins: [] }
  let tableState = 'none'; // 'none' | 'awaiting-separator' | 'active'
  let fenceState = null; // null | { char: '`'|'~', len: number }

  const closeCurrentUnitBlock = () => {
    if (!current) return;
    units.push({ unit: current.unit, capability: current.capability ?? null, line: current.unitLine, source: 'unit-block' });
    if (current.capability == null) {
      pushFinding({
        line: current.unitLine,
        unit: current.unit,
        source: 'unit-block',
        severity: 'hard',
        code: 'capability.missing',
        message: `unit "${current.unit}" has no "capability:" line`,
      });
    } else {
      evaluateCapabilityText(current.capability, { line: current.capabilityLine, unit: current.unit, source: 'unit-block' });
    }
    for (const pin of current.pins) {
      pushFinding({
        line: pin.line,
        unit: current.unit,
        source: 'unit-block',
        severity: 'hard',
        code: 'capability.pinned',
        message: `unit "${current.unit}" pins "${pin.key}" -- a plan never pins executor/provider/model/tier/prefer/invocation/actors; that is execution-time decide's job`,
      });
    }
    current = null;
  };

  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1;

    const fenceMatch = FENCE_LINE.exec(rawLine);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const rest = fenceMatch[2];
      if (fenceState) {
        // Per CommonMark, a line only closes an open fence when it is the
        // same (or a longer) run of the same fence character with nothing
        // else on the line but trailing whitespace -- a same-line info
        // string or trailing content never closes a fence.
        if (marker[0] === fenceState.char && marker.length >= fenceState.len && /^\s*$/.test(rest)) {
          fenceState = null;
        }
        // A fence delimiter line is never itself a heading/unit/capability/
        // pin/table-row line, whether it closed the fence or not.
        return;
      }
      // A backtick fence's info string can never itself contain a backtick
      // (CommonMark) -- e.g. "``` not a fence ```" never opens a fence, so
      // fall through and let this line be evaluated as ordinary text below.
      const isInvalidBacktickOpener = marker[0] === '`' && rest.includes('`');
      if (!isInvalidBacktickOpener) {
        fenceState = { char: marker[0], len: marker.length };
        return;
      }
    }
    if (fenceState) return; // strictly inside a fence: prose/example, inert

    if (HEADING_LINE.test(rawLine)) {
      closeCurrentUnitBlock();
      tableState = 'none';
      return;
    }

    const cells = splitTableRow(rawLine);
    if (cells) {
      if (tableState === 'none' && isProductGatesHeader(cells)) {
        tableState = 'awaiting-separator';
        return;
      }
      if (tableState === 'awaiting-separator') {
        tableState = isSeparatorRow(cells) ? 'active' : 'none';
        return;
      }
      if (tableState === 'active') {
        const dataCells = splitProductGatesDataRow(rawLine);
        if (!dataCells) {
          tableState = 'none';
          return;
        }
        const [phase, cellName, capabilityText] = dataCells;
        const unitLabel = stripSurroundingBackticks(cellName);
        units.push({ unit: unitLabel, capability: capabilityText || null, line: lineNo, source: 'product-gates', phase });
        if (!capabilityText) {
          pushFinding({
            line: lineNo,
            unit: unitLabel,
            source: 'product-gates',
            severity: 'hard',
            code: 'capability.missing',
            message: `Product Gates row for cell "${unitLabel}" has no Capability value`,
          });
        } else {
          evaluateCapabilityText(capabilityText, { line: lineNo, unit: unitLabel, source: 'product-gates' });
        }
        return;
      }
      tableState = 'none';
      // fall through: a pipe-shaped line outside an active table is never a
      // "- unit:"/capability/pin line either, so nothing below matches it.
    } else if (tableState !== 'none') {
      tableState = 'none';
    }

    const unitMatch = UNIT_LINE.exec(rawLine);
    if (unitMatch) {
      closeCurrentUnitBlock();
      current = { unit: unitMatch[1].trim(), unitLine: lineNo, capability: null, capabilityLine: null, pins: [] };
      return;
    }
    if (!current) return;
    const capMatch = CAPABILITY_LINE.exec(rawLine);
    if (capMatch) {
      if (current.capability != null) {
        pushFinding({
          line: lineNo,
          unit: current.unit,
          source: 'unit-block',
          severity: 'hard',
          code: 'capability.duplicate',
          message: `unit "${current.unit}" declares "capability:" twice (first at line ${current.capabilityLine}) -- remove the duplicate`,
        });
        return;
      }
      current.capability = capMatch[1].trim();
      current.capabilityLine = lineNo;
      return;
    }
    const pinMatch = PIN_LINE.exec(rawLine);
    if (pinMatch) {
      current.pins.push({ key: pinMatch[1], line: lineNo });
    }
  });
  closeCurrentUnitBlock();

  if (cellId === undefined) {
    return { ok: !findings.some((f) => f.severity === 'hard'), units, findings };
  }

  const filteredUnits = units.filter((entry) => matchesCellId(entry, cellId));
  const filteredFindings = findings.filter((entry) => matchesCellId(entry, cellId));
  if (filteredUnits.length === 0) {
    filteredFindings.push({
      line: null,
      unit: null,
      source: null,
      severity: 'hard',
      code: 'capability.undeclared',
      message: `--cell "${cellId}" matches no unit block or Product Gates row`,
    });
  }
  return { ok: !filteredFindings.some((f) => f.severity === 'hard'), units: filteredUnits, findings: filteredFindings };
}
