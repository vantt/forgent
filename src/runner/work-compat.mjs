// src/runner/work-compat.mjs — Work Driver compatibility lookups (R2).
//
// Relocated from dispatch engine to decouple it from the Work system.
// Dispatch core takes execution requirements (capabilities, invocations,
// contracts, models) provided from the outside.
// These compatibility lookups bridge legacy callers that supply raw Work items.

import { DEFAULTS } from '../state/work.mjs';
import { DOMAINS, DEFAULT_DOMAIN, resolveDomainName, skillForStage } from '../state/workflow-stage-graphs.mjs';
import { selectTemplate, renderTemplate } from './prompt-templates.mjs';

/**
 * Executor identifier for a work item's executing-stage dispatch (D3,
 * tsk-62v): the skill name executing-stage resolves to for the item's
 * domain — the same `skillForStage`/`DOMAINS` formula `buildPrompt` already
 * applies internally to build its own `skillPath` (never recomputed a
 * different way, per D3).
 *
 * `stage` defaults to `stage ?? work?.stage ?? 'executing'`.
 */
export function executorIdForWork(work, stage) {
  const domainObj = DOMAINS[resolveDomainName(work?.domain)];
  const targetStage = stage ?? work?.stage ?? 'executing';
  return skillForStage(domainObj, targetStage);
}

/**
 * Resolves canonical capability identity across both dispatch doors
 * (`spawnWorker` and `executeExecutorCli`), covering the full catalog
 * with single, order-independent resolution rules (MED-1, MED-2, MED-3).
 */
export function resolveCapabilityIdentityDetails({
  cfg,
  work,
  stage,
  executorId,
  resolvedExecutor,
  purpose,
} = {}) {
  const capabilities = cfg?.capabilities && typeof cfg.capabilities === 'object' ? cfg.capabilities : {};

  function resolveAlias(name) {
    if (!name || typeof name !== 'string') return name;
    if (capabilities[name]) return name;
    for (const [capName, capEntry] of Object.entries(capabilities)) {
      if (Array.isArray(capEntry?.aliases) && capEntry.aliases.includes(name)) {
        return capName;
      }
    }
    return name;
  }

  const explicitPurpose = purpose && typeof purpose === 'string' && purpose.trim()
    ? resolveAlias(purpose.trim())
    : null;

  const domain = resolveDomainName(work?.domain);
  const domainObj = DOMAINS[domain];
  const targetStage = stage ?? work?.stage ?? 'executing';
  const stageSkill = skillForStage(domainObj, targetStage) ?? (typeof executorId === 'string' ? executorId : null);

  const candidateSet = new Set();

  // Curated mapping: executing / fgos-coding-implement -> code:implement for coding domain
  if (domain === DEFAULT_DOMAIN && (targetStage === 'executing' || stageSkill === 'fgos-coding-implement')) {
    candidateSet.add('code:implement');
  }

  // Step mapping: e.g. executing -> Execute -> execute
  const step = domainObj?.stepMap?.[targetStage];
  if (step && typeof step === 'string') {
    candidateSet.add(step.toLowerCase());
  }

  // Domain-folded stage name itself (e.g. discovery, exploring, planning, validating, executing)
  if (targetStage && typeof targetStage === 'string') {
    candidateSet.add(targetStage);
  }

  // Stage skill name itself (e.g. fgos-coding-implement, fgos-coding-planning)
  if (stageSkill && typeof stageSkill === 'string') {
    candidateSet.add(stageSkill);
  }

  // Work properties (kind, role)
  if (work?.kind && typeof work.kind === 'string') {
    candidateSet.add(work.kind);
  }
  if (work?.role && typeof work.role === 'string') {
    candidateSet.add(work.role);
    if (work.role === 'advisor') candidateSet.add('advise');
    if (work.role === 'reviewer') candidateSet.add('code:review');
  }

  // Executor declared capabilities (`for: [...]`)
  if (Array.isArray(resolvedExecutor?.for)) {
    for (const f of resolvedExecutor.for) {
      if (typeof f === 'string' && f.trim()) {
        candidateSet.add(f.trim());
      }
    }
  }

  // Capabilities in config that `prefer` this executor
  if (executorId || resolvedExecutor) {
    for (const [capName, capEntry] of Object.entries(capabilities)) {
      if (capEntry?.prefer && (capEntry.prefer === executorId || (resolvedExecutor && cfg?.executors?.[capEntry.prefer] === resolvedExecutor))) {
        candidateSet.add(capName);
      }
    }
  }

  // Executor ID itself
  if (executorId && typeof executorId === 'string') {
    candidateSet.add(executorId);
  }

  // Normalize all candidates through aliases
  const normalizedCandidates = Array.from(candidateSet)
    .map((c) => resolveAlias(c))
    .filter(Boolean);

  let capability = explicitPurpose;
  if (!capability && normalizedCandidates.length === 0) {
    capability = stageSkill ?? executorId ?? '(unknown-capability)';
  }

  // Order-independent resolution rule:
  // 1. Any candidate with required confinement (confinement.mode === 'required') wins!
  const requiredCandidates = normalizedCandidates.filter(
    (c) => capabilities[c]?.confinement?.mode === 'required',
  );
  if (!capability && requiredCandidates.length > 0) {
    requiredCandidates.sort();
    capability = requiredCandidates[0];
  }

  // 2. Any candidate with configured confinement wins next
  const configuredConfinementCandidates = normalizedCandidates.filter(
    (c) => Boolean(capabilities[c]?.confinement),
  );
  if (!capability && configuredConfinementCandidates.length > 0) {
    configuredConfinementCandidates.sort();
    capability = configuredConfinementCandidates[0];
  }

  // 3. Prefer curated 'code:implement' if coding executing
  if (!capability && domain === DEFAULT_DOMAIN && (targetStage === 'executing' || stageSkill === 'fgos-coding-implement') && normalizedCandidates.includes('code:implement')) {
    capability = 'code:implement';
  }

  // 4. Prefer registered capabilities in cfg.capabilities
  const registeredCandidates = normalizedCandidates.filter((c) => Boolean(capabilities[c]));
  if (!capability && registeredCandidates.length > 0) {
    registeredCandidates.sort();
    capability = registeredCandidates[0];
  }

  // 5. Fallback: sorted candidates first.
  if (!capability) {
    normalizedCandidates.sort();
    capability = normalizedCandidates[0];
  }

  const policyAnchors = normalizedCandidates
    .filter((candidate) => candidate !== capability && capabilities[candidate]?.confinement);
  const requiredAnchors = policyAnchors.filter(
    (candidate) => capabilities[candidate]?.confinement?.mode === 'required',
  ).sort();
  const anchorCapability = requiredAnchors[0] ?? policyAnchors.sort()[0] ?? null;

  return { capability, anchorCapability };
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

  const templateName = selectTemplate({ kind: work.kind, domain: work.domain, stage });
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
