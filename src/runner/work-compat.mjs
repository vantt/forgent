// src/runner/work-compat.mjs — Work Driver compatibility lookups (R2).
//
// Relocated from dispatch engine to decouple it from the Work system.
// Dispatch core takes execution requirements (capabilities, invocations,
// contracts, models) provided from the outside.
// These compatibility lookups bridge legacy callers that supply raw Work items.

import { DEFAULTS } from '../state/work.mjs';
import {
  DOMAINS, DEFAULT_DOMAIN, resolveDomainName, skillForStep, stepForPhase, effectiveStep, resolveWorkflow,
} from '../state/domain-registry.mjs';
import { stepById } from '../workflow/steps.mjs';
import { selectTemplate, renderTemplate } from './prompt-templates.mjs';
import { resolveCapabilityDetailsFromHints } from './dispatch/resolve.mjs';

/**
 * Executor identifier for a work item's dispatch (D3, tsk-62v): the skill name
 * the item's Workflow declares for the step — the same `skillForStep`/`DOMAINS`
 * formula `buildPrompt` already applies internally to build its own `skillPath`
 * (never recomputed a different way, per D3).
 *
 * `stage` (a step id) defaults to the item's effective step.
 */
export function executorIdForWork(work, stage) {
  const domainObj = DOMAINS[resolveDomainName(work?.domain)];
  const targetStep = stage ?? effectiveStep(work ?? {}, domainObj);
  return skillForStep(domainObj, targetStep, work?.kind);
}

/**
 * What a Work item contributes to capability identity resolution: candidate
 * capability names derived from its step, skill, kind and role, plus the
 * curated capability to prefer. Dispatch's own resolver stays Work-agnostic and
 * takes this as `hints`.
 *
 * @returns {{ candidates: string[], preferred: string|null, fallbackLabel: string|null }}
 */
export function workCapabilityHints({ work, stage, executorId } = {}) {
  const domain = resolveDomainName(work?.domain);
  const domainObj = DOMAINS[domain];
  const executeStep = stepForPhase(domainObj, 'execute', work?.kind);
  const targetStep = stage ?? effectiveStep(work ?? {}, domainObj);
  const stepSkill = skillForStep(domainObj, targetStep, work?.kind);
  const stageSkill = stepSkill ?? (typeof executorId === 'string' ? executorId : null);
  const isCodingExecute = domain === DEFAULT_DOMAIN && (targetStep === executeStep || stageSkill === 'fgos-coding-implement');

  const candidates = [];
  // Curated mapping: the execute step of the coding domain -> code:implement
  if (isCodingExecute) candidates.push('code:implement');
  // Phase of the step, e.g. executing -> execute
  const phase = stepById(resolveWorkflow(domainObj, work?.kind), targetStep)?.phase;
  if (phase) candidates.push(phase);
  // The step itself, and its skill (e.g. fgos-coding-implement)
  if (targetStep && typeof targetStep === 'string') candidates.push(targetStep);
  if (stageSkill && typeof stageSkill === 'string') candidates.push(stageSkill);
  // Work properties (kind, role)
  if (work?.kind && typeof work.kind === 'string') candidates.push(work.kind);
  if (work?.role && typeof work.role === 'string') {
    candidates.push(work.role);
    if (work.role === 'advisor') candidates.push('advise');
    if (work.role === 'reviewer') candidates.push('code:review');
  }
  return { candidates, preferred: isCodingExecute ? 'code:implement' : null, fallbackLabel: stageSkill };
}

/**
 * Canonical capability identity for a Work-driven dispatch (both doors:
 * `spawnWorker` and `executeExecutorCli`): the Work item's hints fed to
 * dispatch's own Work-agnostic resolver.
 */
export function resolveCapabilityIdentityDetails({ cfg, work, stage, executorId, resolvedExecutor, purpose } = {}) {
  return resolveCapabilityDetailsFromHints({
    cfg,
    executorId,
    resolvedExecutor,
    purpose,
    hints: workCapabilityHints({ work, stage, executorId }),
  });
}

export function resolveCapabilityIdentity(args = {}) {
  return resolveCapabilityIdentityDetails(args).capability;
}

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
 * `stage` (a step id): which of the item's own Workflow steps this dispatch is
 * FOR — defaults to the item's effective step. Resolves `skillPath` via the
 * Workflow's `skillForStep`, and threads the step into `selectTemplate` so a
 * non-execute dispatch (today: discovery) picks its own template.
 */
export function buildPrompt(work, feedback, stage) {
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
  const targetStep = stage ?? effectiveStep(work, domainObj);
  const skillName = skillForStep(domainObj, targetStep, work.kind);
  const skillPath = `.claude/skills/${skillName}/SKILL.md`;

  const templateName = selectTemplate({ kind: work.kind, domain: work.domain, stage: targetStep });
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
