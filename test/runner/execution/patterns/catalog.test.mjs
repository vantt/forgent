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
    layers: { 'custom-reviewed': 'project' },
    effective: {
      'custom-reviewed': {
        promise: 'A reviewed pattern with bad maxRounds.',
        loop: 'reviewed',
        defaults: { maxRounds: 0 },
      },
    },
  });
  const badMaxRounds = resNonInteger.problems.find((p) => p.code === 'param-invalid');
  assert.ok(badMaxRounds);
  assert.equal(badMaxRounds.source, 'project');
  assert.match(badMaxRounds.message, /project/);
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

test('declared seats in reviewed allow custom seat ids', () => {
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
});

test('reviewed pattern rejects declared seats with non-checker roles', () => {
  const shipped = shippedCatalog();

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

test('reviewed pattern declaring only a producer seat passes catalog validation', () => {
  const shipped = shippedCatalog();

  const effectiveProducerOnly = {
    'custom-reviewed-producer-only': {
      promise: 'Reviewed pattern declaring only producer.',
      loop: 'reviewed',
      defaults: {
        seats: [
          { seat: 'author', role: 'producer' },
        ],
      },
    },
  };
  const resProducerOnly = checkCatalog({ shipped, effective: effectiveProducerOnly });
  assert.deepEqual(resProducerOnly.problems, []);
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
          'side-a-rebuttal': 'Rebut opponent points for side A.',
          judge: 'Render an impartial verdict.',
        },
      },
    },
  };
  const resDebate = checkCatalog({ shipped, effective: effectiveDebate });
  assert.deepEqual(resDebate.problems, []);

  const effectiveReviewed = {
    'custom-reviewed': {
      promise: 'Reviewed pattern with checker seats.',
      loop: 'reviewed',
      defaults: {
        roleTasks: {
          producer: 'Produce the initial implementation.',
          reviewer: 'Review all outputs.',
          'red-team': 'Challenge edge cases.',
        },
      },
    },
  };
  const resReviewed = checkCatalog({ shipped, effective: effectiveReviewed });
  assert.deepEqual(resReviewed.problems, []);
});

test('roleTasks rejects targets not present in the loop or declared seats', () => {
  const shipped = shippedCatalog();

  const effectiveInvented = {
    'custom-invented-reviewed': {
      promise: 'Pattern with invented checker target.',
      loop: 'reviewed',
      defaults: {
        roleTasks: {
          checker: 'Invalid checker target.',
        },
      },
    },
    'custom-invented-panel': {
      promise: 'Pattern with invented producer target in panel.',
      loop: 'panel',
      defaults: {
        seats: [
          { seat: 'member-1', role: 'producer' },
          { seat: 'synthesizer', role: 'synthesizer' },
        ],
        roleTasks: {
          producer: 'Invalid producer target in panel.',
        },
      },
    },
    'custom-invented-debate': {
      promise: 'Pattern with invented producer target in debate.',
      loop: 'debate',
      defaults: {
        seats: [
          { seat: 'side-a', role: 'producer' },
          { seat: 'side-b', role: 'producer' },
          { seat: 'judge', role: 'judge' },
        ],
        roleTasks: {
          producer: 'Invalid producer target in debate.',
        },
      },
    },
  };
  const resInvented = checkCatalog({ shipped, effective: effectiveInvented });
  assert.equal(resInvented.problems.length, 3);
  assert.ok(resInvented.problems.every((p) => p.code === 'param-invalid' && /does not exist for loop/.test(p.message)));
});

test('reviewed pattern with declared custom checker seats rejects built-in checker task targets', () => {
  const shipped = shippedCatalog();

  const effectiveWithCustomCheckers = {
    'custom-reviewed-critics': {
      promise: 'Reviewed pattern with custom critic seat.',
      loop: 'reviewed',
      defaults: {
        seats: [
          { seat: 'author', role: 'producer' },
          { seat: 'critic', role: 'reviewer' },
        ],
        roleTasks: {
          reviewer: 'Built-in checker target not in declared roster.',
        },
      },
    },
  };
  const res = checkCatalog({ shipped, effective: effectiveWithCustomCheckers });
  assert.ok(res.problems.some((p) => p.code === 'param-invalid' && p.message.includes('target "reviewer" does not exist for loop "reviewed"')));

  const effectiveWithValidTargets = {
    'custom-reviewed-critics': {
      promise: 'Reviewed pattern with custom critic seat.',
      loop: 'reviewed',
      defaults: {
        seats: [
          { seat: 'author', role: 'producer' },
          { seat: 'critic', role: 'reviewer' },
        ],
        roleTasks: {
          author: 'Draft initial implementation.',
          producer: 'Produce implementation.',
          critic: 'Perform code review.',
        },
      },
    },
  };
  const resValid = checkCatalog({ shipped, effective: effectiveWithValidTargets });
  assert.deepEqual(resValid.problems, []);
});

test('malformed shipped pattern overrides are rejected with source layer attribution', () => {
  const shipped = shippedCatalog();

  const testCases = [
    { override: null, expectedCode: 'param-invalid', expectedSnippet: 'must be an object' },
    { override: false, expectedCode: 'param-invalid', expectedSnippet: 'must be an object' },
    { override: { defaults: null }, expectedCode: 'param-invalid', expectedSnippet: 'defaults must be an object' },
    { override: { defaults: [] }, expectedCode: 'param-invalid', expectedSnippet: 'defaults must be an object' },
    { override: { invariants: null }, expectedCode: 'param-invalid', expectedSnippet: 'invariants must be an object' },
    { override: { invariants: [] }, expectedCode: 'param-invalid', expectedSnippet: 'invariants must be an object' },
  ];

  for (const { override, expectedCode, expectedSnippet } of testCases) {
    const res = checkCatalog({
      shipped,
      effective: { reviewed: override },
      layers: { 'runner.patterns.reviewed': 'project' },
    });
    assert.ok(res.problems.length > 0, `Expected problem for override ${JSON.stringify(override)}`);
    const problem = res.problems.find((p) => p.code === expectedCode && p.message.includes(expectedSnippet));
    assert.ok(problem, `Expected problem with code "${expectedCode}" matching "${expectedSnippet}", got: ${JSON.stringify(res.problems)}`);
    assert.equal(problem.source, 'project');
    assert.ok(problem.message.includes('(source layer: project)'));
  }
});

test('checker name validation rejects inherited object properties as checker names', () => {
  const shipped = shippedCatalog();

  const resDefaults = checkCatalog({
    shipped,
    effective: {
      'custom-pattern': {
        promise: 'Custom pattern with inherited property checker name.',
        loop: 'reviewed',
        defaults: {
          minCheckers: ['toString', 'constructor'],
        },
      },
    },
    layers: 'project',
  });
  assert.ok(resDefaults.problems.some((p) => p.code === 'param-invalid' && p.message.includes('unknown checker seat "toString"')));
  assert.ok(resDefaults.problems.some((p) => p.code === 'param-invalid' && p.message.includes('unknown checker seat "constructor"')));

  const resInvariants = checkCatalog({
    shipped,
    effective: {
      'custom-pattern-inv': {
        promise: 'Custom pattern with prototype property invariant checker.',
        loop: 'reviewed',
        invariants: {
          minCheckers: {
            atLeast: ['__proto__'],
          },
        },
      },
    },
    layers: 'project',
  });
  assert.ok(resInvariants.problems.some((p) => p.code === 'param-invalid' && p.message.includes('not a valid checker seat')));
});

test('reviewed pattern with producer-only declared seats rejects built-in checker task targets', () => {
  const shipped = shippedCatalog();

  const effective = {
    'custom-reviewed-producer-only': {
      promise: 'Reviewed pattern declaring only a producer seat.',
      loop: 'reviewed',
      defaults: {
        seats: [
          { seat: 'author', role: 'producer' },
        ],
        roleTasks: {
          author: 'Draft initial implementation.',
          reviewer: 'Built-in checker target not in effective roster.',
        },
      },
    },
  };
  const res = checkCatalog({ shipped, effective });
  assert.ok(
    res.problems.some(
      (p) => p.code === 'param-invalid' && p.message.includes('target "reviewer" does not exist for loop "reviewed"'),
    ),
  );
});

test('parameter validation rejects inherited object properties as loop parameters', () => {
  const shipped = shippedCatalog();

  const effective = {
    'custom-pattern-inherited-param': {
      promise: 'Pattern with inherited property as parameter.',
      loop: 'reviewed',
      defaults: {
        toString: 'should be rejected',
        constructor: 'should be rejected',
        valueOf: 'should be rejected',
      },
      invariants: {
        hasOwnProperty: { fixed: 1 },
      },
    },
  };
  const res = checkCatalog({ shipped, effective });
  assert.ok(res.problems.some((p) => p.code === 'param-unknown' && p.message.includes('toString')));
  assert.ok(res.problems.some((p) => p.code === 'param-unknown' && p.message.includes('constructor')));
  assert.ok(res.problems.some((p) => p.code === 'param-unknown' && p.message.includes('valueOf')));
  assert.ok(res.problems.some((p) => p.code === 'param-unknown' && p.message.includes('hasOwnProperty')));
});

test('non-string checker names in minCheckers and seats are rejected with param-invalid', () => {
  const shipped = shippedCatalog();

  const effectiveMinCheckers = {
    'bad-mincheckers-number': {
      promise: 'Pattern with number checker name.',
      loop: 'reviewed',
      defaults: {
        minCheckers: [123],
      },
    },
    'bad-mincheckers-object': {
      promise: 'Pattern with object checker name.',
      loop: 'reviewed',
      defaults: {
        minCheckers: [{}],
      },
    },
    'bad-mincheckers-null': {
      promise: 'Pattern with null checker name.',
      loop: 'reviewed',
      defaults: {
        minCheckers: [null],
      },
    },
    'bad-mincheckers-inv': {
      promise: 'Pattern with invariant non-string checker.',
      loop: 'reviewed',
      invariants: {
        minCheckers: {
          atLeast: [456, null, {}],
        },
      },
    },
  };
  const resMinCheckers = checkCatalog({ shipped, effective: effectiveMinCheckers });
  assert.ok(resMinCheckers.problems.length >= 4);
  assert.ok(resMinCheckers.problems.every((p) => p.code === 'param-invalid'));

  const effectiveSeats = {
    'bad-seats-non-string': {
      promise: 'Pattern with non-string seat name.',
      loop: 'reviewed',
      defaults: {
        seats: [
          { seat: 123, role: 'producer' },
        ],
      },
    },
    'bad-seats-null': {
      promise: 'Pattern with null seat.',
      loop: 'reviewed',
      defaults: {
        seats: [null],
      },
    },
    'bad-seats-non-array': {
      promise: 'Pattern with non-array seats.',
      loop: 'reviewed',
      defaults: {
        seats: 123,
      },
    },
  };
  const resSeats = checkCatalog({ shipped, effective: effectiveSeats });
  assert.ok(resSeats.problems.length >= 3);
  assert.ok(resSeats.problems.every((p) => p.code === 'param-invalid'));
});
