// src/runner/execution/legacy-seat-read.mjs — the one read path for records written before seats existed.
// Architecture guard: pure. No I/O, no clock.
//
// A record without `seatSchema` keyed everything by a role name that was also the name of the seat's
// directory (`<unitRun>/<name>/<round>`): `producer`, `reviewer`, `panelist-N`, `synthesizer`, `thesis`,
// `judge`. Such a record stays readable (history, summaries, handoff refs, metrics) and is refused on
// resume. Readers do not branch on those names: they ask here which seats the old pattern had and
// what each one was. This is the only module that knows the retired names.


const posture = (fields) => Object.freeze({
  readOnly: false, writer: false, forceOutOfProcess: false, stance: false, verdict: false, ...fields,
});
const seat = (name, role, fields) => Object.freeze({ seat: name, role, posture: posture(fields) });

/** The seat key of a result or history entry: its `seat`, or for a pre-fence one the role name it was keyed by. */
export function seatKeyOf(result) {
  return result?.seat ?? result?.role;
}

/** Whether a result carries a checker's verdict. Pre-fence results say so only through their role name. */
export function isVerdictResult(result) {
  if (result?.posture) return result.posture.verdict === true;
  return /^(reviewer|red-team|checker)/.test(String(seatKeyOf(result) ?? ''));
}

/** Whether a result is the harness's own verify round. */
export function isVerifyResult(result) {
  return /^verif(y|ier)$/.test(String(seatKeyOf(result) ?? ''));
}

const LEGACY_DEFAULT_CHECKERS = Object.freeze({
  low: ['reviewer'], standard: ['reviewer'], high: ['reviewer', 'red-team'], critical: ['reviewer', 'red-team'],
});

/**
 * The checker names a pre-fence reviewed unit ran, by the unit's own rigor key (the rule it was written under).
 * Decodes stored records (pre-fence historical units), never live config; keeps reading cfg.patterns.reviewed untouched.
 */
function legacyCheckers(unit, cfg, params) {
  const rigor = unit?.rigor || 'standard';
  const byRigor = cfg?.patterns?.reviewed?.checkersByRigor || LEGACY_DEFAULT_CHECKERS;
  const names = new Set([
    ...(byRigor[rigor] || LEGACY_DEFAULT_CHECKERS[rigor] || ['reviewer']),
    ...(cfg?.capabilities?.[unit?.capability]?.minCheckers || []),
    ...(Array.isArray(params?.minCheckers) ? params.minCheckers : (params?.minCheckers ? [params.minCheckers] : [])),
  ]);
  if (unit?.capability?.startsWith('code:') || unit?.capability === 'code') names.add('red-team');
  return [...names];
}

// The presets that carried role names as params before seats; a record that stored one by name must
// still be read the way it ran.
const HISTORICAL_PATTERNS = Object.freeze({
  consult: { pattern: 'solo', params: { role: 'advisor' } },
  'research-fan-out': { pattern: 'panel', params: { members: 3, role: 'researcher', synthesizeRole: 'synthesizer' } },
  'research-fan-out-gated': { pattern: 'panel', params: { members: 3, role: 'researcher', synthesizeRole: 'synthesizer', gated: true } },
  'code-change': { pattern: 'reviewed', params: { minCheckers: ['reviewer', 'red-team'] } },
  rfc: { pattern: 'reviewed', params: {} },
});

function legacyResolve(pattern) {
  const name = typeof pattern === 'string' ? pattern : pattern?.pattern ?? pattern?.patternName;
  const preset = typeof name === 'string' && Object.hasOwn(HISTORICAL_PATTERNS, name) ? HISTORICAL_PATTERNS[name] : null;
  if (preset) {
    return { patternName: preset.pattern, params: { ...preset.params, ...(typeof pattern === 'object' && pattern !== null ? pattern.params : {}) } };
  }
  return { patternName: name || 'solo', params: { ...(typeof pattern === 'object' && pattern !== null ? pattern.params : {}) } };
}

/**
 * The seats a pre-fence unit record's pattern had, in the order the pattern listed them.
 * @param {object} record parsed `unit.json` without `seatSchema`
 * @returns {Array<{ seat: string, role: string, posture: object }>} empty when the record never said which pattern ran
 */
export function legacySeatsOf(record) {
  const pattern = record?.pattern ?? record?.unit?.pattern ?? null;
  if (pattern === null) return [];
  const { patternName, params } = legacyResolve(pattern);
  const cfg = record?.configSnapshot?.runner ?? {};
  switch (patternName) {
    case 'solo':
      return [seat(params.role || 'producer', 'producer', { writer: true })];
    case 'reviewed':
      return [
        seat('producer', 'producer', { writer: true }),
        ...legacyCheckers(record.unit, cfg, params).map((name) => (name === 'tester'
          ? seat(name, 'reviewer', { readOnly: true, forceOutOfProcess: true })
          : seat(name, name === 'red-team' ? 'red-team' : 'reviewer', { readOnly: true, forceOutOfProcess: true, verdict: true }))),
      ];
    case 'panel': {
      const count = params.members ?? cfg?.patterns?.panel?.members ?? 3;
      const base = params.role || 'panelist';
      const names = Array.isArray(params.role) ? params.role : Array.from({ length: count }, (_, i) => `${base}-${i + 1}`);
      return [
        ...names.map((name) => seat(name, 'producer', { readOnly: true, forceOutOfProcess: true, stance: true })),
        seat(params.synthesizeRole || 'synthesizer', 'synthesizer', { forceOutOfProcess: true }),
      ];
    }
    case 'debate':
      return [
        seat('thesis', 'producer', { readOnly: true, forceOutOfProcess: true }),
        seat('antithesis', 'producer', { readOnly: true, forceOutOfProcess: true }),
        seat('judge', 'judge', { readOnly: true, forceOutOfProcess: true }),
      ];
    default:
      return [];
  }
}

/**
 * Whether a unit record is fenced: written by a runner that keys by seat. Anything else is a pre-fence
 * record, whatever its `execution` says (or lacks).
 */
export function isSeatRecord(record) {
  return typeof record?.seatSchema === 'number' && record.seatSchema >= 1;
}

/** The seats of a record: its own list when fenced, else what its pattern had before the fence. */
export function seatsOfRecord(record) {
  return isSeatRecord(record) ? (record.seats ?? []) : legacySeatsOf(record);
}

/**
 * The single, pure record-read path for records with no `collaboration` (every in-flight unit at upgrade).
 * Decodes stored selector to a catalog name, reads snapshot `patterns.reviewed.*` as loop tuning,
 * uses shipped catalog for defaults, and presents snapshot `patterns.reviewed` as `loops.reviewed`.
 *
 * @param {object} record parsed `unit.json`
 * @param {object} options
 * @param {object} options.shipped shipped catalog from `shippedCatalog()`
 * @returns {{ collaboration: object, effective: object, runner: object }}
 */
export function collaborationOfRecord(record, { shipped } = {}) {
  if (record?.collaboration) {
    return {
      collaboration: record.collaboration,
      effective: record.collaboration.effective,
      runner: record.configSnapshot?.runner ?? {},
    };
  }

  const rawPattern = record?.pattern ?? record?.unit?.pattern ?? 'solo';
  let selectorName;
  let selectorParams = {};
  if (typeof rawPattern === 'string') {
    selectorName = rawPattern;
  } else if (rawPattern && typeof rawPattern === 'object') {
    selectorName = rawPattern.pattern ?? rawPattern.patternName ?? 'solo';
    selectorParams = rawPattern.params ?? {};
  } else {
    selectorName = 'solo';
  }

  const catalogName = selectorName === 'research-fan-out-gated' ? 'research-fan-out' : selectorName;

  const shippedPatterns = shipped?.patterns ?? shipped ?? {};
  const shippedEntry = shippedPatterns[catalogName] ?? {};
  const loop = shippedEntry.loop ?? (['solo', 'reviewed', 'panel', 'debate'].includes(catalogName) ? catalogName : 'solo');
  const patternDefaults = { ...(shippedEntry.defaults ?? {}), ...(shippedEntry.params ?? {}) };

  const snapshotRunner = record?.configSnapshot?.runner ?? {};
  const reviewedTuning = snapshotRunner?.patterns?.reviewed ?? snapshotRunner?.loops?.reviewed ?? {};

  const effectiveParams = { ...patternDefaults, ...selectorParams };
  if (loop === 'reviewed' && reviewedTuning.maxRounds !== undefined) {
    effectiveParams.maxRounds = reviewedTuning.maxRounds;
  }

  const storedSeats = record?.seats ?? seatsOfRecord(record);
  if (storedSeats && storedSeats.length > 0) {
    effectiveParams.seats = storedSeats.map(({ seat, role, persona, tier }) => ({
      seat,
      ...(role ? { role } : {}),
      ...(persona ? { persona } : {}),
      ...(tier ? { tier } : {}),
    }));
  }

  const runnerView = {
    ...snapshotRunner,
    loops: {
      ...snapshotRunner.loops,
      ...(snapshotRunner?.patterns?.reviewed ? {
        reviewed: {
          ...snapshotRunner.loops?.reviewed,
          ...snapshotRunner.patterns.reviewed,
        },
      } : {}),
    },
  };

  const collaboration = {
    pattern: {
      name: catalogName,
      layer: 'shipped',
    },
    effective: {
      loop,
      params: effectiveParams,
      seats: storedSeats,
    },
  };

  return {
    collaboration,
    effective: collaboration.effective,
    runner: runnerView,
  };
}
