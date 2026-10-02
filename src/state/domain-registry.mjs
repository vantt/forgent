// src/state/domain-registry.mjs — the Work-lifecycle domain registry
//
// A domain's registry.yaml declares what a Work item of that domain needs that is
// NOT a sequence of steps: status labels, park reasons, classification
// vocabulary, role graph, worktree policy. The steps a Work item walks, the skill
// and operations each step offers, and the legal step moves live in the domain's
// Workflow definition (domains/<domain>/workflows/*.yaml, src/workflow/definition.mjs);
// the helpers here only resolve a Work item's domain + kind to that Workflow.
//
// Architecture guard: kernel layer — may import src/workflow/{definition,steps}.mjs
// (also kernel) but nothing above it.

import fs from 'node:fs';
import path from 'node:path';
import { validateWorkflow } from '../workflow/definition.mjs';
import {
  walkableSteps,
  stepForPhase as workflowStepForPhase,
  stepsForPhases,
  resolveStepAlias,
  isLegalStepMove as workflowIsLegalStepMove,
  skillForStep as workflowSkillForStep,
  taskSpecForStep as workflowTaskSpecForStep,
  operationsForStep as workflowOperationsForStep,
} from '../workflow/steps.mjs';

/** The domain every item without an explicit `domain` field belongs to. */
export const DEFAULT_DOMAIN = 'coding';

function deepFreezeEdges(roleGraph) {
  if (!roleGraph || typeof roleGraph !== 'object') return;
  if (Array.isArray(roleGraph.roles)) Object.freeze(roleGraph.roles);
  if (roleGraph.edges && typeof roleGraph.edges === 'object') {
    const frozenByArray = new Map();
    for (const key of Object.keys(roleGraph.edges)) {
      const origArr = roleGraph.edges[key];
      if (!Array.isArray(origArr)) continue;
      if (frozenByArray.has(origArr)) {
        roleGraph.edges[key] = frozenByArray.get(origArr);
      } else {
        const frozenArr = Object.freeze(origArr.map((e) => Object.freeze({ ...e })));
        frozenByArray.set(origArr, frozenArr);
        roleGraph.edges[key] = frozenArr;
      }
    }
    Object.freeze(roleGraph.edges);
  }
  Object.freeze(roleGraph);
}

function freezeRegistryData(registryData) {
  deepFreezeEdges(registryData.roleGraph);
  if (registryData.statusLabels) Object.freeze(registryData.statusLabels);
  if (registryData.parkReason) Object.freeze(registryData.parkReason);
  if (registryData.classification) {
    if (Array.isArray(registryData.classification.kind)) Object.freeze(registryData.classification.kind);
    if (Array.isArray(registryData.classification.risk)) Object.freeze(registryData.classification.risk);
    Object.freeze(registryData.classification);
  }
}

// Each domain's registry.yaml and workflows/*.yaml are compiled to domains/<d>/compiled.json
// (scripts/build-domain-registry.mjs) so this module needs no YAML parser: the Work lifecycle
// must load in a plain unpacked copy with no node_modules. A test keeps the two in step.
function loadDomainsFromDisk() {
  const domains = {};
  const repoRoot = path.resolve(import.meta.dirname, '../../');
  const domainsDir = path.join(repoRoot, 'domains');
  if (!fs.existsSync(domainsDir)) return domains;

  for (const entry of fs.readdirSync(domainsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const compiledPath = path.join(domainsDir, entry.name, 'compiled.json');
    if (!fs.existsSync(compiledPath)) continue;

    const { registry: registryData = {}, workflows: rawWorkflows = {} } = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
    const workflows = {};
    for (const [name, raw] of Object.entries(rawWorkflows)) workflows[name] = validateWorkflow(raw);

    freezeRegistryData(registryData);
    domains[entry.name] = Object.freeze({
      ...registryData,
      workflows: Object.freeze(workflows),
      defaultWorkflow: registryData.defaultWorkflow || 'feature',
      workflowFor: Object.freeze(registryData.workflowFor || {}),
    });
  }
  return domains;
}

/** Build a one-workflow fixture domain from a compact step list. */
function fixtureWorkflow(id, steps, { transitions = [], statusSkills } = {}) {
  return validateWorkflow({
    id,
    steps: steps.map(({ id: stepId, phase }) => ({ id: stepId, phase })),
    transitions,
    ...(statusSkills ? { statusSkills } : {}),
  });
}

const loadedDomains = loadDomainsFromDisk();

export const DOMAINS = Object.freeze({
  ...loadedDomains,
  // Illustrative, disposable fixture domains: they exist to prove the Work
  // lifecycle reads steps, phases and status tables from a domain generically
  // instead of a coding-specific literal. None of them loads a skill.
  synthetic: Object.freeze({
    workflows: Object.freeze({
      main: fixtureWorkflow('synthetic/main', [{ id: 'assembling', phase: 'execute' }]),
    }),
    defaultWorkflow: 'main',
    workflowFor: Object.freeze({}),
    worktreeBacked: false,
  }),
  triage: Object.freeze({
    workflows: Object.freeze({
      main: fixtureWorkflow(
        'triage/main',
        [
          { id: 'triage', phase: 'clarify' },
          { id: 'shaping', phase: 'plan' },
          { id: 'assembling', phase: 'execute' },
        ],
        {
          transitions: [
            { from: 'triage', to: 'assembling' },
            { from: 'triage', to: 'shaping' },
            { from: 'shaping', to: 'assembling' },
          ],
        },
      ),
    }),
    defaultWorkflow: 'main',
    workflowFor: Object.freeze({}),
    worktreeBacked: false,
  }),
  // A second production-shaped domain: it carries its own statusLabels (where
  // `blocked` means canceled, unlike coding), a retrospective status skill, and a
  // fieldSchema, proving those generalize beyond coding.
  'fixture-marketing': Object.freeze({
    workflows: Object.freeze({
      main: fixtureWorkflow(
        'fixture-marketing/main',
        [
          { id: 'clarify', phase: 'clarify' },
          { id: 'decompose', phase: 'plan' },
          { id: 'executing', phase: 'execute' },
        ],
        {
          transitions: [
            { from: 'clarify', to: 'executing' },
            { from: 'clarify', to: 'decompose' },
            { from: 'decompose', to: 'executing' },
          ],
          statusSkills: { retrospective: { skill: 'fgos-fixture-retro' } },
        },
      ),
    }),
    defaultWorkflow: 'main',
    workflowFor: Object.freeze({}),
    worktreeBacked: false,
    statusLabels: Object.freeze({
      todo: 'todo',
      doing: 'in-progress',
      blocked: 'canceled',
      'awaiting-human': 'in-progress',
      'awaiting-approval': 'review',
      wontfix: 'canceled',
    }),
    fieldSchema: Object.freeze({ campaign: 'string', budget: 'number' }),
  }),
});

/**
 * Resolve a (possibly absent or unrecognized) domain name to a real key in
 * `DOMAINS`. Absent reads as `DEFAULT_DOMAIN` silently (every legacy item has no
 * `domain`); an unrecognized value also folds to the default but reports itself
 * through `onUnrecognized` or one `console.warn`. Never throws.
 */
export function resolveDomainName(name, { onUnrecognized } = {}) {
  if (name === undefined || name === null) return DEFAULT_DOMAIN;
  if (Object.hasOwn(DOMAINS, name)) return name;
  if (typeof onUnrecognized === 'function') {
    onUnrecognized(name);
  } else {
    console.warn(`fgos: unrecognized domain "${name}" — folding to "${DEFAULT_DOMAIN}".`);
  }
  return DEFAULT_DOMAIN;
}

/** Resolve straight to the domain's registry entry — never `undefined`. */
export function getDomain(name, opts) {
  return DOMAINS[resolveDomainName(name, opts)];
}

/**
 * The domain's Workflow for a Work item of `kind` — `workflowFor[kind]` or the
 * domain's default. Folds an unknown kind to the default; `undefined` only when
 * the domain declares no workflow at all.
 */
export function resolveWorkflow(domain, kind) {
  if (!domain?.workflows) return undefined;
  const name = (kind !== undefined && domain.workflowFor?.[kind]) || domain.defaultWorkflow;
  return domain.workflows[name] ?? domain.workflows[domain.defaultWorkflow];
}

/** Step ids a Work item of `kind` can be at in `domain`. */
export function domainSteps(domain, kind) {
  return walkableSteps(resolveWorkflow(domain, kind));
}

/** The first step playing `phase` (clarify | discover | plan | execute) for a Work item of `kind`. */
export function stepForPhase(domain, phase, kind) {
  return workflowStepForPhase(resolveWorkflow(domain, kind), phase);
}

/** The steps `fgos discover` can act on: the clarify-phase step plus every discover-phase step. */
export function discoverableSteps(domain, kind) {
  return stepsForPhases(resolveWorkflow(domain, kind), ['clarify', 'discover']);
}

/**
 * The step a Work item is treated as being at, whether or not a step was ever
 * written: its recorded `workflowStep` (an older name resolved through the
 * workflow's aliases) or the workflow's execute-phase step.
 */
export function effectiveStep(item, domain) {
  const wf = resolveWorkflow(domain, item.kind);
  if (item.workflowStep !== undefined) return resolveStepAlias(wf, item.workflowStep);
  return workflowStepForPhase(wf, 'execute');
}

/** Whether a Work item of `kind` may move from step `from` to step `to`. */
export function isLegalStepMove(domain, kind, from, to) {
  return workflowIsLegalStepMove(resolveWorkflow(domain, kind), from, to);
}

/** Skill a session should load for a step (or a status handled by a skill); null when none. */
export function skillForStep(domain, stepOrStatus, kind) {
  return workflowSkillForStep(resolveWorkflow(domain, kind), stepOrStatus);
}

/** `{ skill, taskSpec }` for a step or status; either may be null. */
export function bundleForStep(domain, stepOrStatus, kind) {
  const wf = resolveWorkflow(domain, kind);
  return {
    skill: workflowSkillForStep(wf, stepOrStatus),
    taskSpec: workflowTaskSpecForStep(wf, stepOrStatus),
  };
}

/** Operations legal at a step for a Work item of `kind`. Never throws; [] when none. */
export function operationsForStep(domain, step, kind) {
  if (!step) return Object.freeze([]);
  return workflowOperationsForStep(resolveWorkflow(domain, kind), step, {
    defaultRole: domain?.roleGraph?.defaultRole || 'implementer',
  });
}

/** `domain`'s own `roleGraph`, or `undefined` when it declares none. */
export function roleGraphFor(domain) {
  return domain?.roleGraph;
}

/** `domain`'s own `workerContract` path, or `undefined` when it declares none. */
export function workerContractFor(domain) {
  return domain?.workerContract;
}

/** Legal call edges for `fromRole` at `step` within `domain`'s roleGraph; always an array. */
export function legalCallEdges(domain, step, fromRole) {
  const edgesForStep = domain?.roleGraph?.edges?.[step];
  if (!Array.isArray(edgesForStep)) return [];
  return edgesForStep.filter((edge) => edge.from === fromRole);
}

/** The status category `status` maps to in `domain`'s statusLabels, or `undefined`. */
export function statusCategoryFor(domain, status) {
  return domain?.statusLabels?.[status];
}

/** The stop-reason a park `status` represents in `domain`'s parkReason table, or `undefined`. */
export function parkReasonForStatus(domain, status) {
  return domain?.parkReason?.[status];
}

/** The vocabulary `field` ('kind' | 'risk') may take in `domain`'s classification, or `undefined`. */
export function classificationVocabulary(domain, field) {
  return domain?.classification?.[field];
}
