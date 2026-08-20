// workflow-stage-graphs.mjs — domain registry (per base-workflow-model D1-D3): a domain
// declares (a) its ordered macro-stage list, (b) which base-workflow step
// (Init/Clarify/Divide/Execute/Compound-learn, work-item-lifecycle-vision.md
// §2) each of its stages satisfies, and (c) the legal {from,to} stage-move
// edges for that domain — the same shape stage-fsm.mjs's own (pre-retrofit,
// coding-only) STAGE_TRANSITIONS carried, one level up.
//
// LAYER: kernel, same as work.mjs. work.mjs's validateWork must look up this
// registry (D3, item 4), and work.mjs is already the kernel layer — putting
// this module any shallower (e.g. "domain") would make work.mjs's import of
// it an upward import, which test/architecture.test.mjs's one-way-down check
// forbids. Every other consumer (frontier.mjs, loop.mjs, stage-fsm.mjs — all
// "domain" layer, shallower than kernel) importing a kernel-layer module is
// the same direction they already use for work.mjs itself, so this is not a
// new import shape, only a new file.
//
// NO DISK WRITES, ever. Reads only: `loadDomainsFromDisk` (D7) does a
// synchronous `readdirSync`/`readFileSync`/`yaml.parse` at module-load time
// to load `domains/<name>/registry.yaml` + `workflows/*.yaml` off the
// package's own root (falling back to `fallbackCodingDomain`, a hand-
// maintained equivalent, when that read fails or `yaml` doesn't resolve —
// see the isolated-`node_modules`-less setup path
// test/setup/checks-setup-rc-line.test.mjs proves is real). This module is
// no longer "no fs import" (review finding M3, tsk-397 — the header used
// to claim that before D7's registry split; stale the moment `core/`/
// `domains/` became real files this module reads). The one side effect
// beyond that load is a diagnostic `console.warn` when a genuinely
// unrecognized domain value is folded to the default (see
// resolveDomainName) — never a throw, so every hot-path consumer
// (frontier.mjs, loop.mjs) can call it unconditionally.
//
// 'coding' reproduces work.mjs's pre-retrofit STAGES and stage-fsm.mjs's
// pre-retrofit STAGE_TRANSITIONS byte-for-byte (base-workflow-model D2, zero
// behavior change). The 'compound-learn' stage (compound-learn-enduser-docs
// D2) that used to close this list is RETIRED (work-item-status-delivered-
// retrospective-cleanup D11, supersedes RUL49/RUL50/RUL51) — the synthesis
// layer this stage used to gate is now the status `retrospective`'s job
// (see status-fsm.mjs), not a stage. Init is the only base-workflow step left
// outside the `stage` dimension.
//
// 'synthetic' (Slice 2, D1/D4) is an illustrative, disposable second domain
// that exists only to prove a non-coding domain runs on the same base FSM —
// it declares exactly one stage, mapped only to 'Execute'. It deliberately
// maps no stage to 'Clarify'/'Divide': synthetic has no test coverage for
// that path and staying single-stage/Execute-only keeps it that way on
// purpose, rather than being forced to exercise it. discovery.mjs/
// plan.mjs (renamed from decompose.mjs, tsk-403 D15) now resolve the
// stage name for any domain via
// stageForStep(getDomain(work.domain), step) (tsk-3xo) — a domain reaching
// a Clarify/Divide-mapped stage is handled correctly, not silently
// overwritten; before tsk-3xo, the hardcoded coding literals underneath
// would throw a loud FsmError on a stage-name mismatch (stage.mjs's
// transitionStage), never a silent overwrite. Keeping 'synthetic'
// single-stage/Execute-only sidesteps that gap entirely rather than
// papering over it.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let parseYaml;
try {
  parseYaml = require('yaml').parse;
} catch {
  // If yaml is not available in isolated test environments
}

/** The domain every item without an explicit `domain` field belongs to —
 * matches today's implicit, exclusively-coding behavior (D2). */
export const DEFAULT_DOMAIN = 'coding';

const planningEdges = Object.freeze([
  Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
  Object.freeze({ from: 'implementer', to: 'advisor', reason: 'advise', mode: 'async' }),
]);

const fallbackCodingDomain = Object.freeze({
  stages: Object.freeze(['discovery', 'exploring', 'decompose', 'planning', 'executing']),
  stepMap: Object.freeze({ planning: 'Divide', executing: 'Execute' }),
  transitions: Object.freeze([
    Object.freeze({ from: 'clarify', to: 'discovery' }),
    Object.freeze({ from: 'clarify', to: 'exploring' }),
    Object.freeze({ from: 'decompose', to: 'executing' }),
    Object.freeze({ from: 'exploring', to: 'decompose' }),
    Object.freeze({ from: 'discovery', to: 'exploring' }),
    Object.freeze({ from: 'discovery', to: 'planning' }),
    Object.freeze({ from: 'exploring', to: 'planning' }),
    Object.freeze({ from: 'planning', to: 'executing' }),
  ]),
  skillMap: Object.freeze({
    discovery: 'fgos-coding-discovering',
    exploring: 'fgos-coding-exploring',
    decompose: 'fgos-coding-planning',
    planning: 'fgos-coding-planning',
    executing: 'fgos-coding-implement',
    retrospective: 'fgos-coding-compounding',
  }),
  taskSpecMap: Object.freeze({
    discovery: 'judge-ambiguity',
    exploring: 'lock-decisions',
    planning: 'shape-plan',
    executing: 'implement-item',
    retrospective: 'compound-learn',
  }),
  worktreeBacked: true,
  statusLabels: Object.freeze({
    backlog: 'backlog',
    todo: 'todo',
    doing: 'in-progress',
    blocked: 'in-progress',
    'awaiting-human': 'in-progress',
    'awaiting-approval': 'review',
    wontfix: 'canceled',
  }),
  parkReason: Object.freeze({
    blocked: 'system-error',
    'awaiting-human': 'human-question',
    'awaiting-approval': 'natural-finish',
  }),
  classification: Object.freeze({
    kind: Object.freeze(['bug', 'chore', 'design', 'docs', 'feature', 'task']),
    risk: Object.freeze(['light', 'standard', 'heavy']),
  }),
  roleGraph: Object.freeze({
    roles: Object.freeze(['implementer', 'researcher', 'reviewer', 'helper', 'advisor']),
    defaultRole: 'implementer',
    callstackCap: 3,
    edges: Object.freeze({
      discovery: Object.freeze([
        Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
      ]),
      exploring: Object.freeze([
        Object.freeze({ from: 'implementer', to: 'advisor', reason: 'advise', mode: 'async' }),
        Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
      ]),
      planning: planningEdges,
      decompose: planningEdges,
      executing: Object.freeze([
        Object.freeze({ from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' }),
        Object.freeze({ from: 'implementer', to: 'helper', reason: 'assist', mode: 'sync' }),
        Object.freeze({ from: 'implementer', to: 'reviewer', reason: 'review', mode: 'async' }),
        Object.freeze({ from: 'implementer', to: 'advisor', reason: 'advise', mode: 'async' }),
        Object.freeze({ from: 'reviewer', to: 'researcher', reason: 'consult', mode: 'sync' }),
        Object.freeze({ from: 'reviewer', to: 'advisor', reason: 'advise', mode: 'async' }),
      ]),
    }),
  }),
  workerContract: '.agents/skills/_shared/coding-worker-contract.md',
  defaultWorkflow: 'feature',
  workflowFor: Object.freeze({}),
  workflows: Object.freeze({
    feature: Object.freeze({
      stages: Object.freeze(['discovery', 'exploring', 'decompose', 'planning', 'executing']),
      stepMap: Object.freeze({ planning: 'Divide', executing: 'Execute' }),
      transitions: Object.freeze([
        Object.freeze({ from: 'clarify', to: 'discovery' }),
        Object.freeze({ from: 'clarify', to: 'exploring' }),
        Object.freeze({ from: 'decompose', to: 'executing' }),
        Object.freeze({ from: 'exploring', to: 'decompose' }),
        Object.freeze({ from: 'discovery', to: 'exploring' }),
        Object.freeze({ from: 'discovery', to: 'planning' }),
        Object.freeze({ from: 'exploring', to: 'planning' }),
        Object.freeze({ from: 'planning', to: 'executing' }),
      ]),
      skillMap: Object.freeze({
        discovery: 'fgos-coding-discovering',
        exploring: 'fgos-coding-exploring',
        decompose: 'fgos-coding-planning',
        planning: 'fgos-coding-planning',
        executing: 'fgos-coding-implement',
        retrospective: 'fgos-coding-compounding',
      }),
      taskSpecMap: Object.freeze({
        discovery: 'judge-ambiguity',
        exploring: 'lock-decisions',
        planning: 'shape-plan',
        executing: 'implement-item',
        retrospective: 'compound-learn',
      }),
    }),
  }),
});

function normalizeWorkflow(raw) {
  if (!raw) return undefined;

  const stages = [];
  const stepMap = {};
  const skillMap = {};
  const taskSpecMap = {};

  if (Array.isArray(raw.stages)) {
    for (const item of raw.stages) {
      if (typeof item === 'string') {
        stages.push(item);
      } else if (item && typeof item === 'object') {
        if (item.name) {
          stages.push(item.name);
          if (item.step) stepMap[item.name] = item.step;
          if (item.skill !== undefined) skillMap[item.name] = item.skill;
          if (item.taskSpec !== undefined) taskSpecMap[item.name] = item.taskSpec;
        }
      }
    }
  }

  if (raw.stepMap && typeof raw.stepMap === 'object') {
    Object.assign(stepMap, raw.stepMap);
  }
  if (raw.skillMap && typeof raw.skillMap === 'object') {
    Object.assign(skillMap, raw.skillMap);
  }
  if (raw.taskSpecMap && typeof raw.taskSpecMap === 'object') {
    Object.assign(taskSpecMap, raw.taskSpecMap);
  }
  if (raw.statusSkills && typeof raw.statusSkills === 'object') {
    for (const [key, val] of Object.entries(raw.statusSkills)) {
      if (val && typeof val === 'object') {
        if (val.skill !== undefined) skillMap[key] = val.skill;
        if (val.taskSpec !== undefined) taskSpecMap[key] = val.taskSpec;
      }
    }
  }

  const transitions = Array.isArray(raw.transitions)
    ? raw.transitions.map((t) => Object.freeze({ from: t.from, to: t.to }))
    : [];

  return Object.freeze({
    stages: Object.freeze(stages),
    stepMap: Object.freeze(stepMap),
    transitions: Object.freeze(transitions),
    skillMap: Object.freeze(skillMap),
    taskSpecMap: Object.freeze(taskSpecMap),
  });
}

function loadDomainsFromDisk() {
  if (typeof parseYaml !== 'function') return {};
  const domains = {};
  const repoRoot = path.resolve(import.meta.dirname, '../../');
  const domainsDir = path.join(repoRoot, 'domains');

  if (fs.existsSync(domainsDir)) {
    const entries = fs.readdirSync(domainsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const domainName = entry.name;
      const registryPath = path.join(domainsDir, domainName, 'registry.yaml');
      if (!fs.existsSync(registryPath)) continue;

      const registryText = fs.readFileSync(registryPath, 'utf8');
      const registryData = parseYaml(registryText) || {};

      const workflowsDir = path.join(domainsDir, domainName, 'workflows');
      const workflows = {};

      if (fs.existsSync(workflowsDir)) {
        const wfFiles = fs.readdirSync(workflowsDir);
        for (const wfFile of wfFiles) {
          if (wfFile.endsWith('.yaml') || wfFile.endsWith('.yml')) {
            const wfName = path.basename(wfFile, path.extname(wfFile));
            const wfText = fs.readFileSync(path.join(workflowsDir, wfFile), 'utf8');
            const wfData = parseYaml(wfText);
            workflows[wfName] = normalizeWorkflow(wfData);
          }
        }
      }

      const defaultWorkflow = registryData.defaultWorkflow || 'feature';
      const workflowFor = registryData.workflowFor || {};
      const activeWorkflow = workflows[defaultWorkflow];

      const roleGraph = registryData.roleGraph;
      if (roleGraph && typeof roleGraph === 'object') {
        if (Array.isArray(roleGraph.roles)) Object.freeze(roleGraph.roles);
        if (roleGraph.edges && typeof roleGraph.edges === 'object') {
          const frozenEdgesMap = new Map();
          for (const key of Object.keys(roleGraph.edges)) {
            const origArr = roleGraph.edges[key];
            if (Array.isArray(origArr)) {
              if (frozenEdgesMap.has(origArr)) {
                roleGraph.edges[key] = frozenEdgesMap.get(origArr);
              } else {
                const frozenArr = Object.freeze(
                  origArr.map((e) => Object.freeze({ ...e }))
                );
                frozenEdgesMap.set(origArr, frozenArr);
                roleGraph.edges[key] = frozenArr;
              }
            }
          }
          Object.freeze(roleGraph.edges);
        }
        Object.freeze(roleGraph);
      }

      if (registryData.statusLabels) Object.freeze(registryData.statusLabels);
      if (registryData.parkReason) Object.freeze(registryData.parkReason);
      if (registryData.classification) {
        if (Array.isArray(registryData.classification.kind)) Object.freeze(registryData.classification.kind);
        if (Array.isArray(registryData.classification.risk)) Object.freeze(registryData.classification.risk);
        Object.freeze(registryData.classification);
      }

      const domainObj = {
        ...registryData,
        ...(activeWorkflow ? {
          stages: activeWorkflow.stages,
          stepMap: activeWorkflow.stepMap,
          transitions: activeWorkflow.transitions,
          skillMap: activeWorkflow.skillMap,
          taskSpecMap: activeWorkflow.taskSpecMap,
        } : {}),
        workflows: Object.freeze(workflows),
        defaultWorkflow,
        workflowFor: Object.freeze(workflowFor),
      };

      domains[domainName] = Object.freeze(domainObj);
    }
  }

  return domains;
}

const loadedDomains = loadDomainsFromDisk();

export const DOMAINS = Object.freeze({
  coding: loadedDomains.coding || fallbackCodingDomain,
  ...loadedDomains,
  synthetic: Object.freeze({
    stages: Object.freeze(['assembling']),
    stepMap: Object.freeze({
      assembling: 'Execute',
    }),
    transitions: Object.freeze([]),
    // Synthetic is illustrative/throwaway (see file header) and has never
    // loaded a skill — preserve that with an explicit null, not an absent
    // key, so skillForStage's behavior is identical either way.
    skillMap: Object.freeze({
      assembling: null,
    }),
    // No real worktree or merge ever happens for this domain (file header:
    // "illustrative, disposable... exists only to prove... runs on the
    // same base FSM") — the cleanup harness must not hold it to a
    // merge-still-resolves check it was never claiming in the first
    // place.
    worktreeBacked: false,
  }),
  // 'triage' (tsk-3xo) is a second illustrative, disposable domain, same
  // spirit as 'synthetic' above — it exists only as a regression fixture
  // proving a non-coding domain can cross Clarify/Divide-mapped stages
  // under non-coding-literal stage names (the exact gap tsk-3xo fixed:
  // discovery.mjs/decompose.mjs's moveStage calls and bin/fgos.mjs's CLI
  // gates used to hardcode 'clarify'/'decompose'/'executing' literally).
  // Mirrors coding's 3-step shape (Clarify -> Divide -> Execute) with
  // different literal names so a regression back to a hardcoded coding
  // literal fails loudly instead of silently passing.
  triage: Object.freeze({
    stages: Object.freeze(['triage', 'shaping', 'assembling']),
    stepMap: Object.freeze({
      triage: 'Clarify',
      shaping: 'Divide',
      assembling: 'Execute',
    }),
    transitions: Object.freeze([
      Object.freeze({ from: 'triage', to: 'assembling' }),
      Object.freeze({ from: 'triage', to: 'shaping' }),
      Object.freeze({ from: 'shaping', to: 'assembling' }),
    ]),
    // No skill ever loads for this fixture domain, same reasoning as
    // 'synthetic' above.
    skillMap: Object.freeze({
      triage: null,
      shaping: null,
      assembling: null,
    }),
    // Disposable, no real worktree/merge — same reasoning as 'synthetic'.
    worktreeBacked: false,
  }),
  // 'fixture-marketing' (tsk-38t-7, the capstone proof for decision record
  // 0027/tsk-38t's whole Phase 2 multi-domain schema — docs/history/phase-2-
  // status-category-schema/DISCUSSION.md §"Test domain giả lập thứ 2 chứng
  // minh thiết kế") is a clearly-fixture SECOND production-shaped domain,
  // disposable like 'synthetic'/'triage' but built to cover the one gap
  // those two never close: neither ever declares a `statusLabels` or
  // `skillMap.retrospective` entry, so nothing before this item ever
  // exercised 0027's D2/D3/D5 machinery end to end for a domain other than
  // 'coding'. Reuses coding's exact stages/stepMap/transitions shape
  // verbatim (this domain's own job is to prove status/category/skill/field
  // generalize, not to add new stage-machinery coverage — that's already
  // 'synthetic'/'triage''s job) — this also keeps `transitions` non-empty,
  // unlike 'synthetic''s deliberately-empty array (see that entry's own
  // block comment above), which the item's own recorded verify command
  // depends on.
  'fixture-marketing': Object.freeze({
    stages: Object.freeze(['clarify', 'decompose', 'executing']),
    stepMap: Object.freeze({
      clarify: 'Clarify',
      decompose: 'Divide',
      executing: 'Execute',
    }),
    transitions: Object.freeze([
      Object.freeze({ from: 'clarify', to: 'executing' }),
      Object.freeze({ from: 'clarify', to: 'decompose' }),
      Object.freeze({ from: 'decompose', to: 'executing' }),
    ]),
    // No stage skill ever loads for this fixture domain (same reasoning as
    // 'synthetic'/'triage' above) — only `retrospective` (a STATUS key
    // reusing this same field, 0027 D5) gets a real, distinct value below.
    // 'fgos-fixture-retro' is deliberately NOT a real skill file anywhere
    // in `.claude/skills/` (per this item's own constraint: no CLI flags,
    // skill files, or production docs for this fixture) — its only job is
    // to be a value that is NOT 'fgos-coding-compounding', proving
    // `getDomain('fixture-marketing').skillMap.retrospective` reads THIS
    // domain's own table rather than silently falling back to coding's.
    skillMap: Object.freeze({
      clarify: null,
      decompose: null,
      executing: null,
      retrospective: 'fgos-fixture-retro',
    }),
    // No real worktree/merge for this domain — same reasoning as
    // 'synthetic'/'triage' above; keeps this item's own `fgos cleanup`
    // e2e proof from needing a real branch/merge to verify.
    worktreeBacked: false,
    // statusLabels (0027 D2/D3, mirrors DOMAINS.coding.statusLabels's own
    // doc comment above): the field this whole item exists to exercise for
    // a domain other than coding. Judgment call, documented per this item's
    // own instructions — the canceled-equivalent slot is deliberately NOT
    // `wontfix` here, unlike coding: `wontfix` is kept (still a legal FSM
    // edge, still mapped to `canceled`, so it stays inert-but-correct), but
    // `blocked` ALSO maps to `canceled` in this domain — this fixture's own
    // business framing is that a `blocked` item here represents a
    // stakeholder's outright decline (closed, not a temporary park), unlike
    // coding's `blocked` (active, retryable, maps to `in-progress`). This
    // is the strongest real proof available within today's constraints:
    // status-fsm.mjs's TRANSITIONS is ONE shared flat table for every domain
    // (0027's own "Quyết định" section, reconfirmed by reading status-fsm.mjs
    // and work.mjs's STATUSES directly — both are closed to the same 11
    // literal names, so no domain can introduce a genuinely new status
    // literal like a hypothetical "declined"; only D1-D3's original
    // "domain sở hữu TOÀN BỘ bảng transition" framing, explicitly REJECTED
    // in DISCUSSION.md §1/§6, would have allowed that). Mapping a DIFFERENT
    // literal (`blocked`, not `wontfix`) into `canceled` is the real,
    // store-backed way to prove `isResolvedStatus` (frontier.mjs) reads
    // `item.statusCategory` generically rather than a hardcoded `'wontfix'`
    // string comparison — a regression that hardcoded the literal instead
    // would make this domain's `blocked` items wrongly stay "unresolved"
    // forever, exactly the bug this table exists to catch. `doing`/
    // `awaiting-human` keep coding's own `in-progress` grouping (same
    // structural-effect-on-frontier reasoning DISCUSSION.md §6 gives for
    // coding); `awaiting-approval`/`todo` are unchanged too — only the
    // canceled slot needed to differ to prove the point D2 exists for.
    statusLabels: Object.freeze({
      todo: 'todo',
      doing: 'in-progress',
      blocked: 'canceled',
      'awaiting-human': 'in-progress',
      'awaiting-approval': 'review',
      wontfix: 'canceled',
    }),
    // fieldSchema (0027 D6): small, deliberately toy schema so this item's
    // e2e test can prove BOTH an accepted and a rejected `domainFields`
    // shape through the real store (validateDomainFields, work.mjs) for a
    // domain other than the throwaway test-only object
    // test/state/domain-fields.test.mjs already used for the same purpose.
    fieldSchema: Object.freeze({ campaign: 'string', budget: 'number' }),
  }),
});

/**
 * Resolve a (possibly absent or unrecognized) domain name to a real key in
 * `DOMAINS`. Absent (`undefined`/`null`) reads as `DEFAULT_DOMAIN` silently —
 * the same lazy-default shape as `stage`'s D8 precedent, and NOT a warning
 * case: every existing item today has no `domain` field at all, and that is
 * expected, not an anomaly. A genuinely unrecognized non-empty value also
 * folds to `DEFAULT_DOMAIN`, but never silently: it reports itself via
 * `onUnrecognized` when supplied, otherwise a single `console.warn` line.
 * This function never throws, by design — callers in a hot dispatch loop
 * (frontier.mjs, loop.mjs) and a precondition check (stage-fsm.mjs) all rely on
 * that.
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

/** Resolve straight to the domain's registry entry — never `undefined`, per
 * the same fail-safe as `resolveDomainName`. */
export function getDomain(name, opts) {
  return DOMAINS[resolveDomainName(name, opts)];
}

/** The stage name (if any) within `domain` whose `stepMap` entry equals
 * `step` — e.g. `stageForStep(DOMAINS.coding, 'Execute')` -> `'executing'`.
 * Returns `undefined` if the domain declares no stage for that step. */
export function stageForStep(domain, step) {
  return Object.keys(domain.stepMap).find((stage) => domain.stepMap[stage] === step);
}

/** Resolve `kind` to `domain`'s own workflow entry (tsk-2t9c D7/D7a) —
 * `domain.workflows[domain.workflowFor[kind] ?? domain.defaultWorkflow]`,
 * folding an absent/unrecognized kind to the default, never throwing —
 * same never-throw fold every sibling resolver in this module keeps.
 * `undefined` when `domain` declares no `workflows` at all (every domain
 * but `coding` today), the same "this axis does not apply here" shape
 * `roleGraphFor`/`classificationVocabulary` already use one field over.
 *
 * `domain.stages`/`stepMap`/`transitions` stay valid to read directly
 * even once a domain registers a SECOND, genuinely different workflow —
 * not because they happen to be reference-identical to
 * `resolveWorkflow(domain, domain.defaultWorkflow)` today (D16 retracts
 * that framing; it was only ever true by coincidence of nothing else
 * being registered yet), but because `kind` — the only thing that could
 * make an item's own resolved workflow diverge from the domain's default
 * — is locked the moment `status` leaves `todo` (`editWork`'s own guard,
 * `src/state/store.mjs`). An item only ever walks a stage graph once
 * claimed (`status: 'doing'` onward), and by then `kind` can no longer
 * change under it — so a caller resolving an item's stage graph through
 * `resolveWorkflow(domain, work.kind)` and a caller reading
 * `domain.stages` directly agree for that item's ENTIRE walk, without
 * needing a separate frozen `work.workflow` field or a second write
 * door. This still means: a caller that genuinely needs the correct
 * per-item graph should resolve through `resolveWorkflow`, not assume
 * `domain.stages` is always right — the guarantee above is why direct
 * reads happen to be SAFE today, not a license to keep skipping the
 * resolver once a real second workflow exists to differ. */
export function resolveWorkflow(domain, kind) {
  if (!domain?.workflows) return undefined;
  const name = (kind !== undefined && domain.workflowFor?.[kind]) || domain.defaultWorkflow;
  return domain.workflows[name] ?? domain.workflows[domain.defaultWorkflow];
}

/** The stages within `domain` that `fgos discover` can legally act on — the
 * domain's own Clarify-mapped stage (if it still declares one) plus
 * `discovery`/`exploring` when the domain registers both.
 *
 * tsk-qod D1/D2: `stageForStep(domain, 'Clarify')` resolves to `undefined`
 * for a domain that retired `clarify` entirely (today: only `coding`) —
 * `.filter(Boolean)` drops that phantom entry instead of letting
 * `undefined` leak out as if it were a real, valid stage name. A domain
 * that still has a real Clarify-mapped stage (e.g. `triage`) is unaffected.
 *
 * tsk-64h: lives here, in the registry module, rather than in
 * `src/intake/discovery.mjs` where it started. It is a pure question about
 * a domain's own `stages`/`stepMap` — and `src/state/discover-pool.mjs`
 * (layer `domain`) needs the same answer, which it could not get from a
 * `use-case`-layer module without the upward import
 * `test/architecture.test.mjs` forbids. One definition, three callers
 * (`discover-pool.mjs`, `discovery.mjs`'s own `nextDiscoveryEdge`, and
 * `bin/fgos.mjs`'s `discover` precondition), no literal copy anywhere. */
export function discoverableStages(domain) {
  const clarifyStage = stageForStep(domain, 'Clarify');
  const hasDiscoveryExploring = domain.stages?.includes('discovery') && domain.stages?.includes('exploring');
  return (hasDiscoveryExploring ? [clarifyStage, 'discovery', 'exploring'] : [clarifyStage]).filter(Boolean);
}

/** The stage `item` should be treated as being at, whether or not `stage`
 * was ever explicitly written (D8 lazy-default) — `item.stage ??
 * stageForStep(domain, 'Execute')`, the same expression `frontier.mjs`/
 * `stage-fsm.mjs`/`impact.mjs` already apply independently. Read-surface
 * verbs (`bin/fgos.mjs`) call this so a reader can tell "explicitly at
 * this stage" from "defaulted here because `stage` was never set" instead
 * of seeing an absent field with no explanation either way. */
export function effectiveStage(item, domain) {
  return item.stage ?? stageForStep(domain, 'Execute');
}

/** Which fgOS skill (if any) a session should load for `stage` within
 * `domain` (str89-fgos-domain-skills D3/D4) — `null` both when the domain
 * declares no skill for that stage (today's exact default) and when the
 * stage is absent from the domain's `skillMap` entirely. Never throws. */
export function skillForStage(domain, stage) {
  return (domain.skillMap && domain.skillMap[stage]) ?? null;
}

/**
 * Resolves both the skill and taskSpec for `stage` within `domain` (D14).
 * Resolves the workflow first via `resolveWorkflow(domainObj, kind)` to read
 * `skillMap` and `taskSpecMap` from that workflow (D29/D30).
 *
 * @param {string|object} domain Domain name or domain object
 * @param {string} stage Stage name
 * @param {string|object} [options] Optional kind string or options object { kind }
 * @returns {{ skill: string|null, taskSpec: string|null }}
 */
export function bundleForStage(domain, stage, options = {}) {
  const domainObj = typeof domain === 'object' && domain !== null ? domain : getDomain(domain);
  const kind = typeof options === 'string' ? options : options?.kind;
  const wf = resolveWorkflow(domainObj, kind);

  const skillMap = wf?.skillMap ?? domainObj?.skillMap;
  const taskSpecMap = wf?.taskSpecMap ?? domainObj?.taskSpecMap;

  const skill = (skillMap && skillMap[stage]) ?? null;
  const taskSpec = (taskSpecMap && taskSpecMap[stage]) ?? null;

  return { skill, taskSpec };
}


/** `domain`'s own `roleGraph`, or `undefined` when the domain declares
 * none (tsk-2t9c D1) -- every domain but `coding` today. `undefined`,
 * deliberately not `null`, matching `classificationVocabulary`'s own
 * absent-key shape one field over: callers treat "this domain has no
 * role axis at all" and "this domain declared roleGraph but left a field
 * empty" as different questions. */
export function roleGraphFor(domain) {
  return domain?.roleGraph;
}

/** `domain`'s own `workerContract` path (tsk-2uf-2 D4/D6), or `undefined`
 * when the domain declares none -- every domain but `coding` today, same
 * absent-key-means-not-declared shape `roleGraphFor` uses one field above.
 * Never throws, safe to call unconditionally. */
export function workerContractFor(domain) {
  return domain?.workerContract;
}

/** The legal call edges for `fromRole` at `stage` within `domain`'s
 * `roleGraph` -- always an array, `[]` when the domain has no roleGraph,
 * the stage has no edges declared, or `fromRole` has none at that stage.
 * Never throws (same never-throw contract every sibling helper in this
 * module keeps, for the same hot-dispatch-path reason). */
export function legalCallEdges(domain, stage, fromRole) {
  const edgesForStage = domain?.roleGraph?.edges?.[stage];
  if (!Array.isArray(edgesForStage)) return [];
  return edgesForStage.filter((edge) => edge.from === fromRole);
}

/** The `statusCategory` (work.mjs's STATUS_CATEGORIES) `status` maps to
 * within `domain`'s own `statusLabels` table (decision record 0027, D2/D3)
 * — `undefined`, deliberately NOT `null`, both when the domain declares no
 * `statusLabels` at all (every domain but `coding` today — `synthetic`/
 * `triage` never move status through a domain-owned table) and when
 * `status` is absent from a declared `statusLabels` entirely (coding's own
 * four tail-segment statuses, which carry no entry there by design — see
 * `DOMAINS.coding.statusLabels`'s own comment). `undefined` here is the
 * caller's (`store.mjs`) signal to stamp nothing onto the event payload,
 * mirroring `skillForStage`'s `null`-for-absent shape one level down: never
 * throws, safe to call unconditionally. */
export function statusCategoryFor(domain, status) {
  return domain?.statusLabels?.[status];
}

/** Which stop-reason (if any) `status` represents within `domain`'s own
 * `parkReason` table (tsk-3w3 follow-up) — `'system-error'`,
 * `'human-question'`, `'natural-finish'`, or `undefined` when `status`
 * isn't a park state for this domain (no entry declared at all, same as
 * `statusCategoryFor`'s shape one field over). A domain-agnostic driving
 * loop reads this instead of comparing `status` against a coding literal,
 * so it can tell "stopped because a person needs to answer" apart from
 * "stopped because something broke" even though both currently share the
 * same `statusCategory` (`in-progress`) — `parkReason` and `statusLabels`
 * answer different questions and are never meant to collapse into one
 * table. Never throws, safe to call unconditionally. */
export function parkReasonForStatus(domain, status) {
  return domain?.parkReason?.[status];
}

/** The vocabulary `field` (`'kind'` or `'risk'`) is allowed to take within
 * `domain`'s own `classification` table — a frozen array, or `undefined` when
 * this domain declares no vocabulary for that field (every domain but
 * `coding` today). `undefined` is the caller's (`work.mjs`) signal to fall
 * back to the pre-existing "any non-empty string" rule rather than to reject,
 * mirroring `statusCategoryFor`/`parkReasonForStatus`'s own absent-key shape
 * one field over. Never throws, safe to call unconditionally. */
export function classificationVocabulary(domain, field) {
  return domain?.classification?.[field];
}

/** Resolve the file path for a task-spec (`specId`) belonging to `domain` (or `'core'`) —
 * `domains/<domain>/task-specs/<specId>.md` or `core/task-specs/<specId>.md` (tsk-397 D11).
 * Accepts domain name (string) or domain object, or `'core'`.
 * Optional third parameter `options` can be a cwd path string or object `{ cwd }`.
 * Returns the path string. Never throws. */
export function resolveTaskSpecPath(domain, specId, options = {}) {
  const root = typeof options === 'string' ? options : (options?.cwd ?? '');
  let domainName;
  if (typeof domain === 'string') {
    domainName = domain === 'core' ? 'core' : resolveDomainName(domain);
  } else if (domain && typeof domain === 'object') {
    if (domain.name === 'core') {
      domainName = 'core';
    } else {
      const matchKey = Object.keys(DOMAINS).find((k) => DOMAINS[k] === domain);
      domainName = domain.name ?? matchKey ?? DEFAULT_DOMAIN;
    }
  } else {
    domainName = DEFAULT_DOMAIN;
  }

  const filename = specId && specId.endsWith('.md') ? specId : `${specId}.md`;
  const relativePath = domainName === 'core'
    ? path.join('core', 'task-specs', filename)
    : path.join('domains', domainName, 'task-specs', filename);

  return root ? path.join(root, relativePath) : relativePath;
}

