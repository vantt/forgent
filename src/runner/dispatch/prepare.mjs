// dispatch/prepare.mjs — payload assembly (D7, tsk-2uf-1): `buildPrompt`
// (the worker prompt assembled from a work item's own fields) and
// `prepareDispatch` (a new, small, named concept — D7's own note: "a named
// concept in the middle"). Split out of the former `src/runner/dispatch.mjs`
// (2204 lines, 6 concerns in one file) — pure move, no behavior change for
// `buildPrompt`; `src/runner/dispatch.mjs` re-exports every name below
// unchanged as a barrel. See `docs/history/dispatch-activation-and-handoff-
// redesign/CONTEXT.md` D7 for the split rationale.
//
// TRUST INVARIANT (security panel, restored — dropped from the pre-split
// banner during the D7 move, review-caught): `buildPrompt` below assumes
// the `work` item it is given (title, kind, refs, and especially `verify`)
// was authored by the repo's own user, not ingested from an untrusted
// external source. `verify` is run by the runner as a shell command
// (goal-check, a deliberately different and separate trust boundary from
// `dispatch/transport.mjs`'s spawn calls); a work item from an unvetted
// source is an injection vector before it ever reaches dispatch. Never
// wire an external/untrusted intake path into `work` without a review
// gate in between.
//
// `prepareDispatch` scope for THIS item (tsk-2uf-1) is deliberately narrow:
// it validates call legality only — that `unit` is a real, addressable
// dispatch target (a non-empty `id`) — never the dispatch MECHANISM
// (`tsk-5tm-3` D5 forbids re-deciding that; `dispatch/mechanism.mjs`'s
// `decideDispatchMechanism`/`decideExecutorDispatchMechanism` already own
// that judgment and are untouched here). It is additive: no existing
// caller (`spawnWorker`, `executeExecutorCli`, `decideExecutorCli`) is
// wired to call it in this item — introducing that wiring would be a
// behavior change, out of this item's consolidation-only scope. A future
// item widens its body (claim-ownership/footprint refusal, executor.dispatch
// auto-logging, `kind`-aware lifecycle-bearing vs. ephemeral routing per D5)
// once a real caller needs it.

import { DEFAULTS } from '../../state/work.mjs';
import { DOMAINS, resolveDomainName, skillForStage } from '../../state/workflow-stage-graphs.mjs';
import { selectTemplate, renderTemplate } from '../prompt-templates.mjs';
import { RunnerConfigError } from './config.mjs';

/**
 * Build the worker prompt from a work item's own fields (title/kind/refs/
 * verify, per D3) — the five framing sections are a fixed contract (tests
 * pin their presence): Goal, Description, Worktree boundary, Expected
 * proof, and Constraints (the D3 "never call fgos yourself" rule).
 * Description is the work item's full-text intake description (per P30),
 * reproduced verbatim — never truncated — with "(không có)" when absent.
 *
 * The literal prompt TEXT lives in `prompt-templates/*.txt` (P49) — this
 * function only computes the varying pieces (refs/feedbackSection/
 * description/domain/skillPath, each still pure JS conditional logic, never
 * moved into a template) and selects+renders the template via
 * `selectTemplate`/`renderTemplate`. Nothing here reads or writes `.fgos/` —
 * this stays pure string assembly, still returning a plain string (unchanged
 * signature).
 *
 * str91-runner-skill-convergence (D6/D7): `domain`/`skillPath` are two new
 * `renderTemplate` vars, resolved via `workflow-stage-graphs.mjs`'s own
 * domain->skill registry (never a hardcoded path) — they only render for
 * templates that declare the `{domain}`/`{skillPath}` placeholders
 * (currently `worker-prompt-skill-pointer.txt`); an extra unused var is
 * harmless for every other template, per `renderTemplate`'s own per-key
 * substitution loop. `selectTemplate`'s own call below keeps passing the
 * item's raw `work.domain` unchanged — the domain fold lives ONLY inside
 * `selectTemplate` itself (D7), so this function's call site can never
 * diverge from `spawnWorker`'s identical call.
 *
 * `stage` (tsk-5mj D1/D6/D7): which of the item's own domain stages this
 * dispatch is FOR — defaults to `'executing'`, byte-identical to every
 * pre-tsk-5mj call site (none of which ever passed a third argument).
 * Resolves `skillPath` via `skillForStage(domainObj, stage)` instead of the
 * old hardcoded `'executing'` literal, and threads `stage` into
 * `selectTemplate` so a non-executing dispatch (today: `'discovery'`) picks
 * its own template instead of the executing-flavored one.
 */
export function buildPrompt(work, feedback, stage = 'executing') {
  const refs = Array.isArray(work.refs) && work.refs.length ? work.refs.join(', ') : '(none)';

  // Human feedback (worker-feedback): when the item carries a human answer
  // (clarify gate) or the latest reject/park reason, the worker must see it —
  // a reject loop can only converge if the objection reaches the next round.
  // With no feedback at all the section is omitted entirely, keeping the
  // prompt byte-identical to the pre-feedback shape for every other item.
  let feedbackSection = '';
  const answer = feedback && typeof feedback.answer === 'string' && feedback.answer.trim() ? feedback.answer : null;
  const reason = feedback && typeof feedback.reason === 'string' && feedback.reason.trim() ? feedback.reason : null;
  if (answer || reason) {
    const lines = [];
    if (answer) lines.push(`Human answer (binding decision):\n${answer}`);
    if (reason) lines.push(`Latest human rejection/park reason (fix THIS before anything else):\n${reason}`);
    feedbackSection = `\n# Human feedback\n${lines.join('\n\n')}\n`;
  }
  const description = work.description ?? '(không có)';

  // Directive prose (tsk-3xd D1/D3, docs/history/tsk-3xd-decompose-child-
  // directive-prose/CONTEXT.md): `action` is the item's own new optional
  // field (tầng 3 fix — decompose.mjs's addWork now passes it through for a
  // decompose-generated child). `readFirst` is NOT a stored field (D1: "no
  // new mechanism") — it is derived here, at render time, straight from the
  // item's existing `footprint` (work-graph-intelligence S9), same
  // "(không có)" absent-placeholder convention as `description` above.
  const action = typeof work.action === 'string' && work.action.trim() ? work.action : '(không có)';
  const readFirst =
    Array.isArray(work.footprint) && work.footprint.length ? work.footprint.join(', ') : '(không có)';
  const docsRefPointer =
    typeof work.docsRef === 'string' && work.docsRef.trim()
      ? `${work.docsRef.replace(/\/+$/, '')}/plan.md and .../CONTEXT.md (if present) — the locked decisions and chosen approach for this item`
      : '(none)';

  // Skill-pointer vars (str91-runner-skill-convergence D6/D7): resolved once
  // here via the SAME domain registry `fgos-routing`/STR89 already use, never
  // a hardcoded literal — `resolveDomainName` folds an absent/unrecognized
  // domain to `DEFAULT_DOMAIN` exactly like `selectTemplate`'s own internal
  // fold does, so this call site's single console.warn (when the domain is
  // genuinely unrecognized) is the only one buildPrompt triggers.
  const domainName = resolveDomainName(work.domain);
  const domainObj = DOMAINS[domainName];
  const skillName = skillForStage(domainObj, stage);
  const skillPath = `.claude/skills/${skillName}/SKILL.md`;

  const templateName = selectTemplate({ kind: work.kind, tier: work.tier ?? DEFAULTS.tier, domain: work.domain, stage });
  return renderTemplate(templateName, {
    title: work.title,
    kind: work.kind,
    description,
    feedbackSection,
    action,
    readFirst,
    docsRefPointer,
    refs,
    verify: work.verify,
    domain: domainName,
    skillPath,
  });
}

/**
 * Validate that a dispatch call is legal BEFORE any payload is built for
 * it — the "named concept in the middle" D7 introduces (`docs/history/
 * dispatch-activation-and-handoff-redesign/CONTEXT.md`). Deliberately
 * narrow for this item: checks call legality only (`unit` is a real,
 * addressable dispatch target — a non-empty `id`), never the dispatch
 * MECHANISM (`tsk-5tm-3` D5 forbids re-deciding that here; `decide`'s own
 * judgment in `dispatch/mechanism.mjs` is untouched and unconsulted by this
 * function). Throws `RunnerConfigError` — the same error vocabulary every
 * other call-legality gate in this module family already uses — for a
 * `unit` with no `id`, rather than silently building a payload for nothing.
 * `opts` is accepted and returned unchanged: no options are validated yet,
 * kept for forward compatibility with the fuller shape a later item may
 * grow into (claim-ownership/footprint refusal, `kind`-aware routing per
 * D5) without changing this function's own call signature again.
 */
export function prepareDispatch(unit, opts = {}) {
  if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
    throw new RunnerConfigError('prepareDispatch requires a "unit" object (the work item, or ad-hoc task, this dispatch is for).');
  }
  if (typeof unit.id !== 'string' || !unit.id.trim()) {
    throw new RunnerConfigError('prepareDispatch requires "unit.id" (a non-empty string) — the dispatch target must be addressable.');
  }
  return { unit, opts };
}
