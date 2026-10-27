import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CollaborationError,
  checkCatalog,
  loopOf,
} from '../../../../src/runner/execution/patterns/catalog.mjs';
import { shippedCatalog } from '../../../../src/runner/dispatch/shipped-catalog.mjs';

test('CollaborationError carries error code, message and optional source layer', () => {
  const errWithSource = new CollaborationError(
    'pattern-invariant-weakened',
    'pattern invariant was weakened in project layer',
    { source: 'project' },
  );
  assert.ok(errWithSource instanceof Error);
  assert.ok(errWithSource instanceof CollaborationError);
  assert.equal(errWithSource.name, 'CollaborationError');
  assert.equal(errWithSource.code, 'pattern-invariant-weakened');
  assert.equal(errWithSource.message, 'pattern invariant was weakened in project layer');
  assert.equal(errWithSource.source, 'project');

  const errWithoutSource = new CollaborationError(
    'param-unknown',
    'unknown parameter key',
  );
  assert.equal(errWithoutSource.code, 'param-unknown');
  assert.equal(errWithoutSource.source, null);

  const factoryCall = CollaborationError('param-invalid', 'invalid param value');
  assert.ok(factoryCall instanceof CollaborationError);
  assert.equal(factoryCall.code, 'param-invalid');
});

test('bundled standard patterns pass catalog validation with no problems', () => {
  const shipped = shippedCatalog();
  const { entries, problems } = checkCatalog({
    shipped,
    effective: shipped.patterns,
  });

  assert.deepEqual(problems, []);
  assert.ok(entries.solo);
  assert.ok(entries.reviewed);
  assert.ok(entries.panel);
  assert.ok(entries.debate);
  assert.ok(entries['code-change']);
  assert.ok(entries.consult);
  assert.ok(entries.rfc);
  assert.ok(entries['research-fan-out']);
});

test('loopOf resolves execution loop for standard and custom patterns', () => {
  const shipped = shippedCatalog();

  assert.equal(loopOf('solo', { effective: shipped.patterns }), 'solo');
  assert.equal(loopOf('reviewed', { effective: shipped.patterns }), 'reviewed');
  assert.equal(loopOf('panel', { effective: shipped.patterns }), 'panel');
  assert.equal(loopOf('debate', { effective: shipped.patterns }), 'debate');
  assert.equal(loopOf('code-change', { effective: shipped.patterns }), 'reviewed');
  assert.equal(loopOf('consult', { effective: shipped.patterns }), 'solo');
  assert.equal(loopOf('rfc', { effective: shipped.patterns }), 'reviewed');
  assert.equal(loopOf('research-fan-out', { effective: shipped.patterns }), 'panel');

  assert.equal(loopOf('research-fan-out-gated', { effective: shipped.patterns }), null);
  assert.equal(loopOf('nonexistent-pattern', { effective: shipped.patterns }), null);
  assert.equal(loopOf(null, { effective: shipped.patterns }), null);
});

test('project-declared non-coding pattern resolves with plain defaults and no code changes', () => {
  const shipped = shippedCatalog();
  const effective = {
    ...shipped.patterns,
    'editorial-review': {
      promise: 'An editor reviews documentation against quality standards before publishing.',
      loop: 'reviewed',
      defaults: {
        maxRounds: 1,
        roleTasks: {
          reviewer: 'Check prose clarity, grammar, and accuracy.',
        },
      },
    },
  };

  const { entries, problems } = checkCatalog({ shipped, effective });
  assert.deepEqual(problems, []);

  assert.equal(loopOf('editorial-review', { effective: entries }), 'reviewed');
  assert.equal(entries['editorial-review'].promise, 'An editor reviews documentation against quality standards before publishing.');
  assert.equal(entries['editorial-review'].defaults.maxRounds, 1);
  assert.equal(entries['editorial-review'].defaults.roleTasks.reviewer, 'Check prose clarity, grammar, and accuracy.');

  assert.equal(loopOf('reviewed', { effective: entries }), 'reviewed');
  assert.equal(entries.reviewed.defaults?.maxRounds, undefined);
});

test('project override of a shipped pattern merges per key without repeating promise or loop', () => {
  const shipped = shippedCatalog();
  const effective = {
    reviewed: {
      defaults: {
        maxRounds: 3,
      },
    },
  };

  const { entries, problems } = checkCatalog({ shipped, effective });
  assert.deepEqual(problems, []);

  assert.equal(entries.reviewed.loop, 'reviewed');
  assert.equal(entries.reviewed.promise, shipped.patterns.reviewed.promise);
  assert.equal(entries.reviewed.defaults.maxRounds, 3);
});

test('tightening an invariant by listing a superset is accepted', () => {
  const shipped = shippedCatalog();
  const effective = {
    'code-change': {
      invariants: {
        minCheckers: {
          atLeast: ['reviewer', 'red-team', 'tester'],
        },
      },
    },
  };

  const { entries, problems } = checkCatalog({ shipped, effective });
  assert.deepEqual(problems, []);
  assert.deepEqual(
    entries['code-change'].invariants.minCheckers.atLeast,
    ['reviewer', 'red-team', 'tester'],
  );
});

test('dropping an atLeast element in a shipped invariant is refused with source layer', () => {
  const shipped = shippedCatalog();
  const effective = {
    'code-change': {
      invariants: {
        minCheckers: {
          atLeast: ['reviewer'],
        },
      },
    },
  };
  const layers = { 'code-change': 'project' };

  const { problems } = checkCatalog({ shipped, effective, layers });
  assert.ok(problems.length > 0);

  const error = problems.find((p) => p.code === 'pattern-invariant-weakened');
  assert.ok(error, 'must report pattern-invariant-weakened');
  assert.equal(error.source, 'project');
  assert.match(error.message, /project/);
});

test('changing or removing a fixed invariant on a shipped pattern is refused with source layer', () => {
  const shipped = shippedCatalog();
  const effectiveChanged = {
    consult: {
      invariants: {
        seats: {
          fixed: [{ seat: 'reviewer', role: 'producer' }],
        },
      },
    },
  };
  const layers = { consult: 'global' };

  const resChanged = checkCatalog({ shipped, effective: effectiveChanged, layers });
  assert.ok(resChanged.problems.length > 0);
  const errChanged = resChanged.problems.find((p) => p.code === 'pattern-invariant-weakened');
  assert.ok(errChanged);
  assert.equal(errChanged.source, 'global');
  assert.match(errChanged.message, /global/);

  const effectiveRemoved = {
    consult: {
      invariants: {},
    },
  };
  const resRemoved = checkCatalog({ shipped, effective: effectiveRemoved, layers });
  assert.ok(resRemoved.problems.length > 0);
  assert.ok(resRemoved.problems.some((p) => p.code === 'pattern-invariant-weakened'));
});

test('changing the execution loop of a shipped pattern is refused with source layer', () => {
  const shipped = shippedCatalog();
  const effective = {
    solo: {
      loop: 'panel',
    },
  };
  const layers = { solo: 'project' };

  const { problems } = checkCatalog({ shipped, effective, layers });
  assert.ok(problems.length > 0);

  const error = problems.find((p) => p.code === 'pattern-invariant-weakened');
  assert.ok(error);
  assert.equal(error.source, 'project');
  assert.match(error.message, /solo/);
  assert.match(error.message, /panel/);
});

test('retired pattern name research-fan-out-gated returns null loop and refuses config entry', () => {
  const shipped = shippedCatalog();

  assert.equal(loopOf('research-fan-out-gated', { effective: shipped.patterns }), null);

  const effective = {
    'research-fan-out-gated': {
      promise: 'Retired pattern representation.',
      loop: 'panel',
    },
  };
  const { problems } = checkCatalog({ shipped, effective });
  assert.ok(problems.some((p) => p.code === 'config-key-retired'));
});

test('reserved names used as pattern names are refused as config errors', () => {
  const shipped = shippedCatalog();

  const effectiveSeatBinding = {
    seatBinding: {
      promise: 'Invalid pattern using reserved marker name.',
      loop: 'solo',
    },
  };
  const res1 = checkCatalog({ shipped, effective: effectiveSeatBinding });
  assert.ok(res1.problems.some((p) => p.code === 'config-error'));

  const effectiveDefaultRule = {
    defaultRule: {
      pattern: 'reviewed',
    },
  };
  const res2 = checkCatalog({ shipped, effective: effectiveDefaultRule });
  assert.ok(res2.problems.some((p) => p.code === 'config-key-retired'));
});

test('an entry combining catalog fields with retired loop tuning is refused as a config error', () => {
  const shipped = shippedCatalog();
  const effective = {
    reviewed: {
      loop: 'reviewed',
      promise: 'A producer executes followed by review.',
      maxRounds: 2,
      checkersByRigor: {
        standard: ['reviewer'],
      },
    },
  };

  const { problems } = checkCatalog({ shipped, effective });
  assert.ok(problems.some((p) => p.code === 'config-error'));
});

test('stray parameter keys not read by the final loop cannot survive', () => {
  const shipped = shippedCatalog();
  const effectiveDefaults = {
    'custom-solo': {
      promise: 'A solo custom worker.',
      loop: 'solo',
      defaults: {
        maxRounds: 2,
      },
    },
  };

  const res1 = checkCatalog({ shipped, effective: effectiveDefaults });
  assert.ok(res1.problems.some((p) => p.code === 'param-unknown'));

  const effectiveInvariants = {
    'custom-solo': {
      promise: 'A solo custom worker.',
      loop: 'solo',
      invariants: {
        minCheckers: {
          atLeast: ['reviewer'],
        },
      },
    },
  };
  const res2 = checkCatalog({ shipped, effective: effectiveInvariants });
  assert.ok(res2.problems.some((p) => p.code === 'param-unknown'));
});

test('parameter domain validation rejects invalid default values', () => {
  const shipped = shippedCatalog();

  const resNonInteger = checkCatalog({
    shipped,
    effective: {
      'custom-reviewed': {
        promise: 'A reviewed pattern with bad maxRounds.',
        loop: 'reviewed',
        defaults: { maxRounds: 0 },
      },
    },
  });
  assert.ok(resNonInteger.problems.some((p) => p.code === 'param-invalid'));

  const resUnknownChecker = checkCatalog({
    shipped,
    effective: {
      'custom-reviewed': {
        promise: 'A reviewed pattern with unknown checker.',
        loop: 'reviewed',
        defaults: { minCheckers: ['nonexistent-checker'] },
      },
    },
  });
  assert.ok(resUnknownChecker.problems.some((p) => p.code === 'param-invalid'));

  const resBadRebuttal = checkCatalog({
    shipped,
    effective: {
      'custom-debate': {
        promise: 'A debate pattern with non-boolean rebuttal.',
        loop: 'debate',
        defaults: { rebuttal: 'not-a-boolean' },
      },
    },
  });
  assert.ok(resBadRebuttal.problems.some((p) => p.code === 'param-invalid'));

  const resReservedSeat = checkCatalog({
    shipped,
    effective: {
      'custom-solo': {
        promise: 'A solo pattern declaring reserved seat id.',
        loop: 'solo',
        defaults: {
          seats: [{ seat: 'verify', role: 'producer' }],
        },
      },
    },
  });
  assert.ok(resReservedSeat.problems.some((p) => p.code === 'param-invalid'));

  const resSeatMultiplicity = checkCatalog({
    shipped,
    effective: {
      'custom-solo': {
        promise: 'A solo pattern with two producers.',
        loop: 'solo',
        defaults: {
          seats: [
            { seat: 'producer-1', role: 'producer' },
            { seat: 'producer-2', role: 'producer' },
          ],
        },
      },
    },
  });
  assert.ok(resSeatMultiplicity.problems.some((p) => p.code === 'seat-multiplicity'));

  const resBadRoleTask = checkCatalog({
    shipped,
    effective: {
      'custom-panel': {
        promise: 'A panel pattern with roleTask targeting unknown role.',
        loop: 'panel',
        defaults: {
          roleTasks: {
            arbitraryRole: 'Do something.',
          },
        },
      },
    },
  });
  assert.ok(resBadRoleTask.problems.some((p) => p.code === 'param-invalid'));
});

test('custom pattern missing required promise or loop is rejected', () => {
  const shipped = shippedCatalog();

  const missingPromise = {
    'custom-incomplete': {
      loop: 'solo',
    },
  };
  const res1 = checkCatalog({ shipped, effective: missingPromise });
  assert.ok(res1.problems.some((p) => p.code === 'param-invalid'));

  const missingLoop = {
    'custom-incomplete': {
      promise: 'Has promise but no loop.',
    },
  };
  const res2 = checkCatalog({ shipped, effective: missingLoop });
  assert.ok(res2.problems.some((p) => p.code === 'param-invalid'));
});

test('checkCatalog with throwOnError throws the first problem encountered', () => {
  const shipped = shippedCatalog();
  const effective = {
    solo: {
      loop: 'panel',
    },
  };

  assert.throws(
    () => checkCatalog({ shipped, effective, throwOnError: true }),
    (err) => err instanceof CollaborationError && err.code === 'pattern-invariant-weakened',
  );
});

test('carrier validity refuses unknown key on pattern entry with param-unknown', () => {
  const shipped = shippedCatalog();
  const layers = [{ path: 'runner.patterns.custom-pattern.unexpectedKey', layer: 'project' }];
  const effective = {
    'custom-pattern': {
      promise: 'A custom pattern with an unexpected key.',
      loop: 'solo',
      unexpectedKey: 'not-allowed',
    },
  };
  const { problems } = checkCatalog({ shipped, effective, layers });
  assert.ok(problems.length > 0);
  const err = problems.find((p) => p.code === 'param-unknown');
  assert.ok(err);
  assert.equal(err.source, 'project');
});

test('tightening a shipped pattern by adding an invariant on another parameter is accepted', () => {
  const shipped = shippedCatalog();
  const effective = {
    'code-change': {
      invariants: {
        roleTasks: {
          fixed: {
            reviewer: 'Carefully review all touched files.',
          },
        },
      },
    },
  };
  const { entries, problems } = checkCatalog({ shipped, effective });
  assert.deepEqual(problems, []);
  assert.deepEqual(
    entries['code-change'].invariants.minCheckers.atLeast,
    ['reviewer', 'red-team'],
  );
  assert.deepEqual(
    entries['code-change'].invariants.roleTasks.fixed,
    { reviewer: 'Carefully review all touched files.' },
  );
});

test('invariant form validation requires form fitting the parameter and rejects invalid forms', () => {
  const shipped = shippedCatalog();

  const resListFixed = checkCatalog({
    shipped,
    effective: {
      'custom-reviewed': {
        promise: 'List param with fixed form.',
        loop: 'reviewed',
        invariants: {
          minCheckers: {
            fixed: ['reviewer'],
          },
        },
      },
    },
  });
  assert.ok(resListFixed.problems.some((p) => p.code === 'param-invalid'));

  const resScalarAtLeast = checkCatalog({
    shipped,
    effective: {
      'custom-debate': {
        promise: 'Boolean param with atLeast form.',
        loop: 'debate',
        invariants: {
          rebuttal: {
            atLeast: [true],
          },
        },
      },
    },
  });
  assert.ok(resScalarAtLeast.problems.some((p) => p.code === 'param-invalid'));

  const resExtraKeys = checkCatalog({
    shipped,
    effective: {
      'custom-reviewed': {
        promise: 'Invariant with extra unknown keys.',
        loop: 'reviewed',
        invariants: {
          minCheckers: {
            atLeast: ['reviewer'],
            extraKey: true,
          },
        },
      },
    },
  });
  assert.ok(resExtraKeys.problems.some((p) => p.code === 'param-invalid'));
});

test('declared seats in reviewed allow custom seat ids and reject invalid roles', () => {
  const shipped = shippedCatalog();

  const effectiveOk = {
    'custom-reviewed': {
      promise: 'Reviewed pattern with custom checker seat ids.',
      loop: 'reviewed',
      defaults: {
        seats: [
          { seat: 'author', role: 'producer' },
          { seat: 'security', role: 'red-team' },
          { seat: 'quality', role: 'reviewer' },
        ],
      },
    },
  };
  const resOk = checkCatalog({ shipped, effective: effectiveOk });
  assert.deepEqual(resOk.problems, []);

  const effectiveWrongRole = {
    'custom-reviewed': {
      promise: 'Reviewed pattern declaring synthesizer seat.',
      loop: 'reviewed',
      defaults: {
        seats: [
          { seat: 'author', role: 'producer' },
          { seat: 'chair', role: 'synthesizer' },
        ],
      },
    },
  };
  const resWrongRole = checkCatalog({ shipped, effective: effectiveWrongRole });
  assert.ok(resWrongRole.problems.some((p) => p.code === 'seat-multiplicity'));
});

test('loop seat cardinality checks enforce role multiplicities for panel and debate', () => {
  const shipped = shippedCatalog();

  const panelNoSynth = {
    'custom-panel': {
      promise: 'Panel pattern without synthesizer.',
      loop: 'panel',
      defaults: {
        seats: [
          { seat: 'worker-1', role: 'producer' },
          { seat: 'worker-2', role: 'producer' },
        ],
      },
    },
  };
  const resPanel1 = checkCatalog({ shipped, effective: panelNoSynth });
  assert.ok(resPanel1.problems.some((p) => p.code === 'seat-multiplicity'));

  const panelInvalidRole = {
    'custom-panel': {
      promise: 'Panel pattern with judge role.',
      loop: 'panel',
      defaults: {
        seats: [
          { seat: 'worker-1', role: 'producer' },
          { seat: 'synth', role: 'synthesizer' },
          { seat: 'judge-seat', role: 'judge' },
        ],
      },
    },
  };
  const resPanel2 = checkCatalog({ shipped, effective: panelInvalidRole });
  assert.ok(resPanel2.problems.some((p) => p.code === 'seat-multiplicity'));

  const debateOneProducer = {
    'custom-debate': {
      promise: 'Debate pattern with single producer.',
      loop: 'debate',
      defaults: {
        seats: [
          { seat: 'side-a', role: 'producer' },
          { seat: 'referee', role: 'judge' },
        ],
      },
    },
  };
  const resDebate1 = checkCatalog({ shipped, effective: debateOneProducer });
  assert.ok(resDebate1.problems.some((p) => p.code === 'seat-multiplicity'));

  const debateReservedVerifier = {
    'custom-debate': {
      promise: 'Debate pattern with reserved verifier seat.',
      loop: 'debate',
      defaults: {
        seats: [
          { seat: 'side-a', role: 'producer' },
          { seat: 'verifier', role: 'producer' },
          { seat: 'referee', role: 'judge' },
        ],
      },
    },
  };
  const resDebate2 = checkCatalog({ shipped, effective: debateReservedVerifier });
  assert.ok(resDebate2.problems.some((p) => p.code === 'param-invalid'));
});

test('roleTasks target validation accepts loop kinds and declared seats', () => {
  const shipped = shippedCatalog();

  const effectivePanel = {
    'custom-panel': {
      promise: 'Panel pattern with panelist roleTask and declared seat task.',
      loop: 'panel',
      defaults: {
        seats: [
          { seat: 'researcher-1', role: 'producer' },
          { seat: 'synthesizer', role: 'synthesizer' },
        ],
        roleTasks: {
          panelist: 'Investigate independently.',
          'researcher-1': 'Special focus on data.',
          synthesizer: 'Synthesize all findings.',
        },
      },
    },
  };
  const resPanel = checkCatalog({ shipped, effective: effectivePanel });
  assert.deepEqual(resPanel.problems, []);

  const effectiveDebate = {
    'custom-debate': {
      promise: 'Debate pattern with rebuttal kinds.',
      loop: 'debate',
      defaults: {
        seats: [
          { seat: 'side-a', role: 'producer' },
          { seat: 'side-b', role: 'producer' },
          { seat: 'judge', role: 'judge' },
        ],
        roleTasks: {
          thesis: 'Argue in favor.',
          antithesis: 'Argue against.',
          'thesis-rebuttal': 'Rebut opponent points.',
          'antithesis-rebuttal': 'Rebut opponent points.',
          judge: 'Render an impartial verdict.',
        },
      },
    },
  };
  const resDebate = checkCatalog({ shipped, effective: effectiveDebate });
  assert.deepEqual(resDebate.problems, []);

  const effectiveReviewed = {
    'custom-reviewed': {
      promise: 'Reviewed pattern with checker kind.',
      loop: 'reviewed',
      defaults: {
        roleTasks: {
          checker: 'Review all outputs.',
        },
      },
    },
  };
  const resReviewed = checkCatalog({ shipped, effective: effectiveReviewed });
  assert.deepEqual(resReviewed.problems, []);
});
