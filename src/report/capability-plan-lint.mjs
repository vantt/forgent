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
const PIN_LINE = /^\s+(executor|provider|model|tier|prefer|invocation|actors):\s*\S/;
// Exact literal token "unresolved" only -- a negative lookahead blocks any
// word char or hyphen immediately after it, so "unresolved-foo" is never
// mistaken for the hedge marker the way a bare `\b` boundary would allow.
const UNRESOLVED_MARK = /^unresolved(?![\w-])/i;

const GENERIC_SHAPE = /^[a-z][a-z0-9-]*$/;
const DOMAIN_SCOPED_SHAPE = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

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
 *   (severity `warn`) finding instead.
 * @returns {{
 *   ok: boolean,
 *   units: Array<{unit: string, capability: string|null, line: number, source: 'unit-block'|'product-gates'}>,
 *   findings: Array<{line: number|null, unit: string|null, source: string|null, code: string, severity: 'hard'|'warn', message: string}>,
 * }}
 */
export function lintPlanCapabilityAnnotations(text, registeredCapabilities, options = {}) {
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
      severity: 'warn',
      code: 'capability.undeclared',
      message: `--cell "${cellId}" matches no unit block or Product Gates row`,
    });
  }
  return { ok: !filteredFindings.some((f) => f.severity === 'hard'), units: filteredUnits, findings: filteredFindings };
}
