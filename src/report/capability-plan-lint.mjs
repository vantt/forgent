// capability-plan-lint.mjs — P3 static/read-only harness
// (docs/history/agent-coordination-foundation/plan.md): checks a plan's own
// text against the shared planning-capability-awareness doctrine without
// touching Work schema, Assignment shape, or lifecycle state, and without
// an execution-boundary guard -- P3 gates that guard on real dogfood
// non-compliance evidence, which does not exist yet. This module is exactly
// the harness: pure read of plan text in, findings out, nothing written,
// nothing enforced.
//
// Scans the `- unit: ... / capability: <name>` convention
// core/skills/_shared/planning-capability-awareness.md documents as the
// example shape a plan writes down. No plan.md in this repo uses it yet
// (P3's own second stage -- an execution-boundary guard -- is deliberately
// not built here), so this is infrastructure ready for a real plan to
// adopt, not something wired into `fgos doctor` or any automatic gate.

const UNIT_LINE = /^-\s*unit:\s*(.+)$/;
const CAPABILITY_LINE = /^\s+capability:\s*(.+)$/;
const PIN_LINE = /^\s+(executor|provider|model|tier):\s*\S/;
const UNRESOLVED_MARK = /^unresolved\b/i;

const GENERIC_SHAPE = /^[a-z][a-z0-9-]*$/;
const DOMAIN_SCOPED_SHAPE = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

/**
 * @param {string} text - raw plan.md content
 * @param {string[]} registeredCapabilities - canonical names to check
 *   against (e.g. `Object.keys(DEFAULT_CAPABILITY_SLOTS)` plus any other
 *   live-registered capability, such as `impact-analysis`). Never
 *   defaulted here -- the caller owns what "registered" means for its own
 *   config, this module has no opinion.
 * @returns {{ ok: boolean, units: Array<{unit: string, capability: string|null, line: number}>, findings: Array<{line: number, unit: string|null, message: string}> }}
 */
export function lintPlanCapabilityAnnotations(text, registeredCapabilities) {
  const registered = new Set(registeredCapabilities ?? []);
  const lines = String(text ?? '').split('\n');
  const units = [];
  const findings = [];

  let current = null; // { unit, unitLine, capability, capabilityLine, pins: [] }

  const closeCurrent = () => {
    if (!current) return;
    units.push({ unit: current.unit, capability: current.capability ?? null, line: current.unitLine });
    if (current.capability == null) {
      findings.push({ line: current.unitLine, unit: current.unit, message: `unit "${current.unit}" has no "capability:" line` });
    } else {
      const bare = current.capability.replace(/\s*\(.*\)\s*$/, '').trim();
      const isExplicitlyUnresolved = UNRESOLVED_MARK.test(current.capability);
      if (!isExplicitlyUnresolved) {
        if (!GENERIC_SHAPE.test(bare) && !DOMAIN_SCOPED_SHAPE.test(bare)) {
          findings.push({
            line: current.capabilityLine,
            unit: current.unit,
            message: `capability "${bare}" is not a valid canonical shape (generic "name" or domain-scoped "domain:name")`,
          });
        } else if (!registered.has(bare)) {
          findings.push({
            line: current.capabilityLine,
            unit: current.unit,
            message: `capability "${bare}" is not registered -- mark it "unresolved" explicitly or register it in DEFAULT_CAPABILITY_SLOTS first`,
          });
        }
      }
    }
    for (const pin of current.pins) {
      findings.push({
        line: pin.line,
        unit: current.unit,
        message: `unit "${current.unit}" pins "${pin.key}" -- a plan never pins provider/model/executor/tier; that is execution-time decide's job`,
      });
    }
    current = null;
  };

  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1;
    const unitMatch = UNIT_LINE.exec(rawLine);
    if (unitMatch) {
      closeCurrent();
      current = { unit: unitMatch[1].trim(), unitLine: lineNo, capability: null, capabilityLine: null, pins: [] };
      return;
    }
    if (!current) return;
    const capMatch = CAPABILITY_LINE.exec(rawLine);
    if (capMatch) {
      current.capability = capMatch[1].trim();
      current.capabilityLine = lineNo;
      return;
    }
    const pinMatch = PIN_LINE.exec(rawLine);
    if (pinMatch) {
      current.pins.push({ key: pinMatch[1], line: lineNo });
    }
  });
  closeCurrent();

  return { ok: findings.length === 0, units, findings };
}
