// discovery.mjs — context-discovery engine for stage clarify (per
// stage-clarify D4/D5/D10/D13). Use-case layer: resolves a work item's
// clarify-loop transitions from either a caller-supplied verdict or a
// trusted, already-committed CONTEXT.md.
//
// RETARGET (stage-decompose D2, cell 3): a clear verdict now lands the item
// on stage `decompose`, not `executing` — chia-việc (`decompose.mjs` at the
// time) is the next stop before executing, and it is the one that produces
// children or passes the item through. The clarify-pass settlement
// (replay.mjs) is guarded on `from === 'clarify'`, not the destination, so
// it still fires unchanged.
//
// RE-RETARGET (tsk-4b2 D3/D6): a clear verdict at `clarify` now lands on
// stage `discovery` instead of jumping straight to `decompose` — the
// `discovery`/`exploring` stages were registered (workflow-stage-graphs.mjs)
// but structurally unreachable until this item, because every real caller
// addressed stage transitions through `stepMap`, which deliberately has no
// entry for either stage. This same verdict-driven machinery now also
// drives `discovery -> exploring` (a `fgos-researching` verdict, applied
// by whichever caller invoked it — `fgos-researching` itself never touches
// item state) and `exploring -> decompose` (a clear verdict once
// `fgos-coding-exploring` has locked `CONTEXT.md`) — see `nextDiscoveryEdge`
// below. One verb (`fgos discover --verdict ...`), three edges, picked by
// `work.stage`.
//
// RE-RE-RETARGET (tsk-403 D11/D18): `decompose` is renamed to `planning`
// — `chia-việc` now lives in `plan.mjs` (renamed from `decompose.mjs`).
// `nextDiscoveryEdge` resolves its destination via `stageForStep(domain,
// 'Divide')`, and `Divide` now maps to `planning` in `stepMap` (not
// `decompose` — that key was removed, D18), so both remaining edges above
// — `clarify -> decompose` and `exploring -> decompose` — automatically
// resolve to `clarify -> planning` / `exploring -> planning` for every
// domain that adopted the rename, with ZERO code change needed in this
// function beyond the variable rename below. `decompose` itself survives
// only as a legacy, drain-only stage name (workflow-stage-graphs.mjs) for
// the handful of items still parked there; no new item can reach it
// through this function anymore. `src/runner/loop.mjs`'s own direct
// `moveStage` call for `discovery -> exploring` (a separate, older
// mechanism, pre-dating this
// item) still exists unchanged here — reconciling it to call this same
// verb instead is tsk-4v6's own job, not this item's footprint.
//
// RETIRED (tsk-1x3 D1/D9, docs/history/fanout-and-delegation-rubric/
// CONTEXT.md): this module used to spawn a nested `claude -p` judge
// (judgeDiscovery) whenever no caller-supplied verdict was given — the
// exact "soul re-deriving what a live soul already knows" waste `tsk-1ni`
// found. `resolveDiscovery` now requires an explicit `callerVerdict` from
// any interactive caller; only the trust-signal (a committed CONTEXT.md)
// and a mechanical no-op for the runner's own sweep (D16) remain as
// alternatives.

import path from 'node:path';
import { judgeVerifySemanticCorrectness } from './verify-pattern-check.mjs';
import { readLockedContext, resolveContentRoot } from './plan.mjs';
import { DEFAULTS, validateWorkShape } from '../state/work.mjs';
import { listWork, moveStage, addDiscovery, addDecision, putInAwaiting, editWork, StoreError } from '../state/store.mjs';
import { getDomain, stageForStep, resolveDomainName, discoverableStages } from '../state/workflow-stage-graphs.mjs';
import { rankImpact } from '../state/impact.mjs';
import { computeImpact, computePriority, isRecognizedRisk } from '../state/priority-formula.mjs';

const DEFAULT_UNCLEAR_QUESTION =
  'Không phán được rõ ràng — cần người xác nhận thủ công.';

// D10: when a clear verdict carries no `verify` (the model failed to propose
// one despite being asked), this is the fallback the item moves out of
// clarify with — a DIFFERENT string from the retired P14 sentinel
// ("chưa xác định — P15 bổ sung"), so nothing from the old placeholder
// survives past clarify (must_haves truth 3).
// EXPORTED (work-graph-intelligence S2b, wgi-8): the runner-automatic
// discovered-from channel reuses this same clarify-entry placeholder for the
// items it creates from a worker's report — a discovered item enters at stage
// `clarify`, so context-discovery later replaces this sentinel with the real
// verify, exactly as a submitted item does. Shared, never a duplicated literal.
export const FALLBACK_VERIFY = 'chưa xác định — bổ sung thủ công';

// Retired P14 sentinel (D10's comment above) — named here so the D2 guard
// below can compare against it without a bare magic-string literal. Still
// live in production today: `bin/fgos.mjs`'s own SUBMIT_VERIFY_SENTINEL
// (a separate local const, CLI layer never imported from here) carries
// this exact same string as every freshly-submitted item's starting
// verify. Exported (tsk-1ni D2) so a test fixture representing a
// not-yet-clarified item can reference the real sentinel instead of an
// unrelated placeholder literal of its own.
export const RETIRED_P14_PLACEHOLDER = 'chưa xác định — P15 bổ sung';

// tsk-13b: every placeholder verify this module (and bin/fgos.mjs's own
// SUBMIT_VERIFY_SENTINEL) has ever produced starts with this prefix --
// FALLBACK_VERIFY/RETIRED_P14_PLACEHOLDER above are the two canonical
// examples, not an exhaustive list. A session writing a *different*
// "chưa xác định — <free text>" placeholder at clarify/discovery time (a
// live pattern found in the backlog: tsk-8v1, tsk-45f, tsk-3y2) used to
// slip past the old exact-match check as if it were a real, runnable verify.
const PLACEHOLDER_VERIFY_PREFIX = 'chưa xác định —';

// tsk-1ni D2: an existing work.verify counts as "real" -- worth protecting
// from an unresolved guess -- when it is set and does not carry the
// placeholder prefix every clarify/discovery-stage sentinel shares.
// EXPORTED (tsk-1zo): `return`'s own pre-flight validation (bin/fgos.mjs)
// reuses this same guard so a placeholder verify refuses cleanly instead of
// being shelled out to (a raw "<word>: not found", exit 127).
export function hasRealVerify(verify) {
  return typeof verify === 'string' && verify.trim() && !verify.startsWith(PLACEHOLDER_VERIFY_PREFIX);
}

// STR8 (D4): terse mechanical graph/impact context, folded from STR43's
// graphMetrics + STR21's rankImpact. work-item-priority-matrix D3: read
// here so resolveDiscovery's own priority computation gets the same real
// number, instead of re-deriving it.
function blocksForItem(work, view) {
  const ranked = rankImpact(view);
  const entry = ranked.find((r) => r.id === work.id);
  return entry ? entry.blocks : 0;
}

// tsk-4b2 D3/D6: the one function both moveStage call sites below share --
// a clear verdict is "a verdict-driven forward move once a Socratic/research
// pass finishes", the same shape at `clarify` (this item's own D3) and at
// `exploring` (D6), so this picks the right edge from `work.stage` instead
// of the two call sites duplicating a hardcoded `stageForStep(...,'Divide')`
// target each.
//
// Domain-aware (found by the real `domain-aware-stage-literals.test.mjs`
// e2e guard, not assumed): `discovery`/`exploring` are additions specific
// to whichever domain actually registers them in its own `stages` array
// (today: only `coding`) -- a domain that never declared either stage
// (the 'triage'/'synthetic' fixture domains this repo's own e2e suite uses
// to prove domain-agnosticism) keeps the original direct `clarify ->
// decompose` edge unchanged, exactly as before this item.
//
// MOVED (tsk-64h): `discoverableStages` used to be defined right here and
// exported for `bin/fgos.mjs`'s own `discover` precondition gate. It now
// lives in `../state/workflow-stage-graphs.mjs` alongside `stageForStep`/
// `effectiveStage`, because `src/state/discover-pool.mjs` needs the exact
// same answer and cannot import a `use-case`-layer module from the
// `domain` layer (`test/architecture.test.mjs`). Same function, same
// behavior, one home -- imported below with the other registry lookups.

// `verdict` (tsk-30v D2/D6): only the `discovery`-stage branch reads it —
// `clear` skips `exploring` and lands on `planning` directly; `unclear`
// (or no verdict at all, e.g. the readLockedContext trust-signal path,
// which always means clear) goes to `exploring`. The `clarify`/`exploring`
// branches are unaffected: `clarify` is legacy/dead for `coding` and
// `exploring`'s own gate (`fgos-coding-exploring`) never sends anything but
// a clear verdict once CONTEXT.md is locked.
function nextDiscoveryEdge(work, verdict) {
  const domain = getDomain(work.domain);
  const clarifyStage = stageForStep(domain, 'Clarify');
  const planningStage = stageForStep(domain, 'Divide');
  const hasDiscoveryExploring = discoverableStages(domain).length > 1;

  // tsk-qod D1/D2: `clarifyStage !== undefined` guards against a
  // false-positive match -- once a domain retires `clarify` entirely,
  // `clarifyStage` is `undefined`, and `work.stage === undefined` would
  // otherwise wrongly match any item whose own `stage` field is missing or
  // corrupted, regardless of what domain it actually belongs to.
  if (clarifyStage !== undefined && work.stage === clarifyStage) {
    return hasDiscoveryExploring
      ? { to: 'discovery', expectedStage: clarifyStage }
      : { to: planningStage, expectedStage: clarifyStage };
  }
  if (hasDiscoveryExploring && work.stage === 'discovery') {
    return verdict?.clear
      ? { to: planningStage, expectedStage: 'discovery' }
      : { to: 'exploring', expectedStage: 'discovery' };
  }
  if (hasDiscoveryExploring && work.stage === 'exploring') {
    return { to: planningStage, expectedStage: 'exploring' };
  }
  throw new StoreError(
    'validation',
    `resolveDiscovery: work "${work.id}" (domain "${resolveDomainName(work.domain)}") is at stage "${work.stage}", which this engine cannot advance from.`,
  );
}

// D12/D17: the ONE guard every discovery path runs its tier/kind/risk
// report through. Both callers import it from here — the headless runner
// sweep (`src/runner/loop.mjs`, which re-exports it so its own importers
// stay unchanged) and the interactive `fgos discover --tier/--kind/--risk`
// verb (`bin/fgos.mjs`). It lives in this module, the engine both paths
// already call, precisely so neither can drift into a second copy of the
// rule: D12 says classification is decided AT discovery on real evidence,
// and one door is what makes that checkable instead of remembered.
//
// Never applies unless the discovery outcome actually resolved 'clear' AND
// the caller verdict itself was clear — an 'unclear'/'verify-disputed'/
// 'noop' outcome must never pick up a classification the caller only judged
// conditionally on evidence that turned out insufficient. Returns an empty
// object (never null) when there is nothing to apply, so a call site can
// check `Object.keys(patch).length` uniformly. Extracted as its own pure
// function so it is unit-testable without mocking a whole dispatch pipeline.
export function classificationPatchFromVerdict(outcome, callerVerdict) {
  if (outcome !== 'clear' || !callerVerdict?.clear) return {};
  const patch = {};
  if (callerVerdict.tier !== undefined) patch.tier = callerVerdict.tier;
  if (callerVerdict.kind !== undefined) patch.kind = callerVerdict.kind;
  if (callerVerdict.risk !== undefined) patch.risk = callerVerdict.risk;
  return patch;
}

// The pre-flight half of that same door, for a caller whose classification
// came from typed flags rather than untrusted worker stdout. The two cases
// genuinely differ in what a bad value should cost: the headless sweep logs
// and drops a rejected value, because a worker's report must never abort a
// discovery outcome already resolved by the engine; a flag someone typed is
// the opposite — refusing it BEFORE `resolveDiscovery` writes anything is
// what keeps a typo from leaving the item half-advanced (stage moved,
// classification rejected) with no obvious way back.
//
// Reuses `validateWorkShape` with the patch's own touched-field set — the
// exact check `editWork` will run when the patch is applied — so the
// vocabularies stay in one place (`TIERS` and the domain's own
// `classificationVocabulary`, both in work.mjs) rather than being restated
// here. Throws `WorkValidationError` (category `validation`, CLI exit 4);
// a verdict that is unclear, or that carries no classification at all, is a
// silent no-op.
export function assertCallerClassification(work, callerVerdict) {
  if (!callerVerdict?.clear) return;
  const patch = classificationPatchFromVerdict('clear', callerVerdict);
  if (Object.keys(patch).length === 0) return;
  validateWorkShape({ ...work, ...patch }, new Set(Object.keys(patch)));
}

/**
 * Read `id` from the store at `dir` and resolve its clarify-loop
 * transition — the ONE function both the sync `discover` verb and the
 * async runner sweep call (D5/D13), so the clarify-loop logic never
 * duplicates.
 *
 * TRUST SIGNAL (tsk-ozl D1-D3): before requiring an explicit verdict, check
 * whether the item already carries a committed, non-empty CONTEXT.md under
 * its `docsRef` (`readLockedContext`, shared with plan.mjs's own
 * locked-context read). When it does, decisions are already locked and
 * approved — advance directly, logging a `discovery skip:` decision for
 * the audit trail (mirrors `logDecomposeVerdict`'s pattern in
 * plan.mjs) — same content-based signal for BOTH the sync `session`
 * caller and the runner's RUL19 sweep (`role: 'runner'`), never a role
 * branch: a sweep that finds a real committed CONTEXT.md on an untouched
 * item trusts it too, which also covers the crashed-mid-explore-session
 * case RUL19 exists to catch.
 *
 * Per stage-decompose D3/D6: the discovery record is written for BOTH
 * outcomes (clear and unclear), never only the failure path. A clear
 * verdict moves the item forward via `nextDiscoveryEdge` (tsk-4b2 D3/D6) —
 * `clarify -> discovery` when the item is at `clarify`, or
 * `exploring -> planning` when it is at `exploring` (`fgos-coding-exploring`'s
 * own Gate calling this same verb once `CONTEXT.md` is locked) — always
 * carrying a `verify` (D10 — the caller's proposal, or `FALLBACK_VERIFY`
 * when it did not supply one — never the retired P14 placeholder). An
 * unclear verdict parks the item in `awaiting-human` with the verdict's
 * question.
 *
 * `role` (per Phase 3 S3-closeout settlement design) attributes WHO ran
 * this pass — the two call sites disagree, so it is the caller's job to say:
 * the runner's clarify sweep passes `'runner'`, the sync `discover` verb
 * passes `'session'`. Optional; a clear verdict's `moveStage` only stamps it
 * on the settlement record when a caller actually supplies it.
 *
 * `callerVerdict` (tsk-27y D1/D2): `{clear: boolean, question?, verify?}` —
 * when supplied (`fgos discover --verdict ...`), used INSTEAD of any
 * subprocess judgment, checked before the `readLockedContext` trust-signal
 * above (explicit beats heuristic — the whole point of this protocol: a
 * live session that already reasoned about clarity, fgos-coding-exploring, should
 * never fall through to a blind subprocess judge or a second heuristic
 * guess).
 *
 * MISSING BOTH (tsk-1x3 D1/D9/D16): no `callerVerdict` and no locked
 * CONTEXT.md. A `'runner'` role — the mechanical clarify sweep
 * (`src/runner/loop.mjs`) — degrades to a safe no-op: the item is left
 * exactly where it is for a live session to pick up later, the same
 * reasoning D6 already established (the runner has never spawned a real
 * dispatch in this repo's history, so a no-op here changes no observed
 * behavior; throwing would be the actual regression if the runner is ever
 * turned on before it dispatches a real worker for this stage). Any other
 * role reaching this point genuinely omitted `--verdict` — refuse loudly
 * instead of silently guessing.
 */
// `cfg` (tsk-1x3 D9 finding): unused inside this function's own body now
// that judgeDiscovery is retired — kept as a positional parameter only for
// call-site compatibility with callers outside this item's declared
// footprint (bin/fgos.mjs's `discover` verb, src/runner/loop.mjs's clarify
// sweep). Removing it would shift `role`/`callerVerdict`'s positions and
// ripple into files this item never touches; left as a named, honest
// finding rather than a silent no-op parameter.
export function resolveDiscovery(dir, id, cfg, role, callerVerdict) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolveDiscovery: work "${id}" not found.`);
  }

  let verdict;
  if (callerVerdict) {
    verdict = { clear: callerVerdict.clear === true };
    if (verdict.clear) {
      if (typeof callerVerdict.verify === 'string' && callerVerdict.verify.trim()) {
        verdict.verify = callerVerdict.verify;
      }
    } else {
      verdict.question =
        typeof callerVerdict.question === 'string' && callerVerdict.question.trim()
          ? callerVerdict.question
          : DEFAULT_UNCLEAR_QUESTION;
    }
    addDecision(dir, {
      id,
      text: `discovery caller-supplied: clear=${verdict.clear}`,
      source: 'resolveDiscovery',
      kind: 'engine',
      rationale:
        'tsk-27y D2: caller-supplied verdict — session already reasoned live (fgos-coding-exploring), skipping the readLockedContext trust-signal check',
    });
  } else {
    // repoRoot (tsk-1ni D1): resolved to the item's own worktree when one
    // exists, never the raw state root -- see resolveContentRoot's own
    // comment in plan.mjs.
    const stateRoot = path.dirname(dir);
    const repoRoot = resolveContentRoot(stateRoot, id, work.docsRef);
    const lockedContext = readLockedContext(repoRoot, work.docsRef);
    if (lockedContext) {
      addDecision(dir, {
        id,
        text: 'discovery skip: trusted committed CONTEXT.md, no verdict required',
        source: 'resolveDiscovery',
        kind: 'engine',
        rationale:
          'docsRef points at a non-empty CONTEXT.md (D2 trust signal, tsk-ozl) — advancing without re-deriving a decision already locked and approved',
      });
      addDiscovery(dir, { id, clear: true });
      // Real verify (tsk-19j D1/D11, closes gap 2): `gates[id].contextApprove.
      // verify` is the real command fgos-coding-exploring's own Gate recorded for
      // this item when it approved CONTEXT.md — preferred over the retired
      // placeholder whenever a Track A approve record actually exists (an item
      // that never went through that Gate, e.g. from before this item, keeps
      // today's fallback unchanged). tsk-1ni D2: work.verify wins over both
      // when it is already real.
      moveStage(dir, {
        id,
        ...nextDiscoveryEdge(work, { clear: true }),
        verify: hasRealVerify(work.verify) ? work.verify : (view.gates?.[id]?.contextApprove?.verify ?? FALLBACK_VERIFY),
        role,
      });
      return { outcome: 'clear', id, verdict: { clear: true, skipped: true } };
    }

    // tsk-1x3 D1/D9/D16: no callerVerdict, no locked context — the old
    // fallback (judgeDiscovery, a nested `claude -p` subprocess) is
    // retired. 'runner' degrades to a safe no-op (see this function's own
    // doc comment above); any other role refuses loudly.
    if (role === 'runner') {
      return { outcome: 'noop', id };
    }
    throw new StoreError(
      'validation',
      `discover: work "${id}" has no committed CONTEXT.md and no --verdict was given -- run "fgos discover ${id} --verdict clear --verify \"<cmd>\"" (or --verdict unclear --question "<text>") after reasoning about it yourself.`,
    );
  }

  addDiscovery(dir, { id, ...verdict });

  // work-item-priority-matrix D6/D7 (was STR8 D4's intentScore -> work.intent):
  // a SECOND standard-door write, never merged into moveStage's or
  // putInAwaiting's payload below — scored on EITHER outcome (an unclear
  // verdict still gets scored; the item just doesn't advance stage). D7:
  // `intent` is retired IN PLACE — this is the rough clarify-stage pass
  // computing `priority` instead (effort is not yet known here, so it
  // defaults to EFFORT_FLOOR inside computePriority; `planning`'s refined
  // pass recomputes once effort/blast-radius are known, per plan.md Phase
  // B). Wrapped in its own try/catch so a write-door rejection never aborts
  // the clarify/unclear resolution that follows. tsk-1ne (`store.mjs`'s
  // `editWork`) scoped validation to only the fields a patch actually
  // touches, so a legacy-invalid field elsewhere on the item (e.g. an
  // out-of-enum `risk`) no longer rejects this `{priority}`-only patch —
  // this try/catch now guards a narrower, still-real surface (a transient
  // store/lock error) rather than that specific legacy-shape rejection.
  try {
    const impact = computeImpact({
      blocks: blocksForItem(work, view),
      semanticRelatedness: Number.isInteger(verdict.impactScore) ? verdict.impactScore : 0,
    });
    const priority = computePriority({ impact, urgent: work.urgent, risk: work.risk });
    editWork(dir, { id, patch: { priority }, role });
    // tsk-4hb: risk is free text (Data Dictionary #6) -- a present-but-
    // unrecognized value silently folds to the same discount as "absent"
    // inside discountForRisk, with no signal anywhere. Log it here so the
    // fold is visible in the audit trail instead of invisible.
    if (work.risk && !isRecognizedRisk(work.risk)) {
      addDecision(dir, {
        id,
        text: `priority: work.risk "${work.risk}" is not a recognized RISK_DISCOUNTS key -- discountForRisk folded it to the "standard" default`,
        source: 'resolveDiscovery',
        kind: 'engine',
        rationale: 'tsk-4hb: making the silent unrecognized-value fallback observable',
      });
    }
  } catch (err) {
    // tsk-6d8: swallowed intentionally (see comment above), but never
    // silently -- a stderr line is the visible signal that "every write
    // failed" no longer looks identical to "every write succeeded". Never
    // a second write-door call here (could itself fail and recurse into
    // the same silence) or a re-throw (defeats the fail-safe).
    process.stderr.write(`fgos: priority write for "${id}" failed (${err?.message ?? err}) -- swallowed intentionally\n`);
  }

  if (verdict.clear) {
    // tsk-5q5-1 (D2/D4): a proposed `verify` never rode into the item's
    // record unchecked before — only "is it a non-empty string" (D10's own
    // FALLBACK_VERIFY case has nothing to check, since it's a fixed system
    // string). A second, independent check (tsk-1x3 D17: mechanical-only
    // since retirement of the LLM-fallback branch — see
    // verify-pattern-check.mjs's own header for what this no longer
    // catches) checks the proposal against the one documented syntactic
    // trap. Disagreement parks the item exactly like an unclear first-pass
    // verdict does.
    if (typeof verdict.verify === 'string' && verdict.verify.trim()) {
      const secondPass = judgeVerifySemanticCorrectness(verdict.verify);
      if (!secondPass.agrees) {
        // tsk-5cf D1b: a caller that already reasoned live through this
        // exact disagreement can force past it explicitly -- never silent:
        // always logged with the disagreement reason it overrode, per the
        // "never silently overridden" stance
        // docs/explanation/judge-verdict-second-pass-semantic-check.md
        // already states for this exact two-judge-disagreement path.
        //
        // tsk-12t D6: EXCEPT when `secondPass.mechanical` is true -- that
        // disagreement is a syntactic fact, not a judgement call `--force`
        // exists to override. Falls through to the park branch below
        // unconditionally in that case, same as `force` had never been
        // passed.
        if (callerVerdict?.force === true && secondPass.mechanical !== true) {
          // tsk-nfa D1: --force overrides the verify dispute only, never a
          // park state. An item already `awaiting-human` here means a PRIOR
          // discover call parked it (this dispute, or an unclear verdict) --
          // continuing on to moveStage below would advance stage while
          // status stays parked, and fgos return's `status !== 'doing'`
          // guard (bin/fgos.mjs) then refuses with no obvious way out.
          // Refuse here instead, pointing at the real resume path: status
          // changes stay exclusively behind the ask/answer door
          // (putInAwaiting/answerAwaiting, src/state/store.mjs), never a
          // synthetic answer manufactured by --force itself.
          if (work.status === 'awaiting-human') {
            throw new StoreError(
              'validation',
              `discover --force: work "${id}" is already "awaiting-human" -- run "fgos answer ${id} --text ..." to resume it before retrying --force.`,
            );
          }
          addDecision(dir, {
            id,
            text: `discover --force overrode a disputed verify: "${verdict.verify}"`,
            source: 'resolveDiscovery',
            kind: 'engine',
            rationale: `second pass disagreed: ${secondPass.reason}`,
          });
        } else {
          const ask =
            `## Context\n\n` +
            `Đề xuất verify bị nghi ngờ (chưa ghi vào clarify->planning, cần xác nhận) — ` +
            `vòng 1 đề xuất: ${verdict.verify}\n\n` +
            `## Why this matters\n\n` +
            `vòng 2 (kiểm tra độc lập) không đồng ý: ${secondPass.reason}`;
          // statusAtAsk (claim-lock §5.1, tsk-40m P1 fix): informational/
          // audit only — `work` comes from the EFFECTIVE view (listWork),
          // legitimately 'doing' for a claimed item. putInAwaiting/moveWork
          // compute the resume-safe `durableStatusAtAsk` themselves, from a
          // fresh durable read, never from this value.
          putInAwaiting(dir, { id, ask, statusAtAsk: work.status });
          return { outcome: 'verify-disputed', id, verdict, secondPass };
        }
      }
    }

    // tsk-60r D1: the plain agree-path (no dispute above, or a dispute the
    // second pass accepted) reaches here regardless of whether this SAME
    // clarify pass already parked the item in `awaiting-human` via an
    // earlier round's verify dispute (`putInAwaiting` above). `moveStage`
    // below only moves `stage` -- it never touches `status` -- so without
    // this guard the item would end up with `stage` advanced but `status`
    // still `awaiting-human`, and `fgos return` later refuses on that
    // stale park. Refuse here instead, same shape and wording as the
    // `--force` branch's own guard above: status transitions stay
    // exclusively behind the ask/answer door, never silently left
    // inconsistent by this call.
    if (work.status === 'awaiting-human') {
      throw new StoreError(
        'validation',
        `discover: work "${id}" is already "awaiting-human" -- run "fgos answer ${id} --text ..." to resume it before retrying discover.`,
      );
    }

    // tsk-1ni D2: never let a caller's guess overwrite a verify a prior
    // stage already locked (e.g. fgos-coding-validating's planApprove, reached
    // because this item's stage never got moved off clarify before later
    // stages ran) -- only an empty/placeholder field gets filled, same
    // "locked beats fresh guess" trust the D1 skip-and-advance path above
    // already gives a committed CONTEXT.md.
    const verify = hasRealVerify(work.verify) ? work.verify : (verdict.verify ?? FALLBACK_VERIFY);

    moveStage(dir, {
      id,
      ...nextDiscoveryEdge(work, verdict),
      verify,
      role,
    });
    return { outcome: 'clear', id, verdict };
  }

  // tsk-30v (D2/D3/D6): an unclear verdict at `discovery` no longer parks
  // "in place" — it also advances stage to `exploring` (a real, registered
  // edge nextDiscoveryEdge already picks for `verdict.clear === false`) so
  // a person who answers the park below resumes already sitting at
  // `exploring`, ready for `fgos-coding-exploring`'s own Socratic collab,
  // instead of looping back through `fgos-coding-discovering` for the same
  // unresolved question. `moveStage` and `putInAwaiting` touch disjoint
  // fields (`stage` vs. `status`) — confirmed safe to call in sequence
  // here (RESEARCH.md Round 1, tsk-30v: `stage-fsm.mjs`'s `transitionStage`
  // reads only `work.stage`, `status-fsm.mjs`'s `transitionWork` reads
  // only `work.status`, neither guards against the other). Scoped to
  // `discovery` only — `clarify` (legacy) and `exploring` (its own gate
  // never sends unclear) keep today's park-in-place behavior unchanged.
  if (work.stage === 'discovery') {
    moveStage(dir, {
      id,
      ...nextDiscoveryEdge(work, verdict),
      verify: hasRealVerify(work.verify) ? work.verify : FALLBACK_VERIFY,
      role,
    });
  }

  // tsk-wcl: `putInAwaiting` always attempts a real `awaiting-human` status
  // transition (moveWork), and status-fsm.mjs has no self-transition edge for it —
  // calling it on an item that is ALREADY `awaiting-human` (re-running
  // `fgos discover <id>` directly on a still-parked item, bypassing the
  // pool picker that normally never re-selects a parked item) throws
  // StoreError and the whole call dies, losing this round's verdict
  // entirely. `addDiscovery` above already recorded the fresh verdict
  // unconditionally — only the redundant re-park is guarded here, so a
  // second consecutive unclear call on an already-parked item still
  // succeeds (with the item staying parked, its discovery history gaining
  // the new entry) instead of throwing.
  //
  // statusAtAsk (claim-lock §5.1, tsk-40m P1 fix): informational/audit
  // only — `work` comes from the EFFECTIVE view (listWork). putInAwaiting/
  // moveWork compute the resume-safe `durableStatusAtAsk` themselves.
  if (work.status !== 'awaiting-human') {
    putInAwaiting(dir, { id, ask: verdict.question, statusAtAsk: work.status });
  }
  return { outcome: 'unclear', id, verdict };
}
