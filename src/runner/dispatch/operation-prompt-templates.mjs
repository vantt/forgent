// dispatch/operation-prompt-templates.mjs — operation prompt-template registry,
// deterministic resolver, bounded variable renderer, and provenance tracker (Unit I04 / Phase 3),
// per docs/architect/agent-coordination/contracts/flow-definition.md and
// plans/260919-coordination-skill-harness-simplification/plan.md.
//
// Layer: infra (same layer as src/runner/dispatch/assignment.mjs).
// Reads only from filesystem during template discovery. Never performs mutations,
// never writes to session event log or store, never grants or widens authority.
//
// Discovery tiers (fixed precedence: project overrides domain, domain overrides core):
//   1. project: `<cwd>/.fgos/prompt-templates/<templateId>.{md,txt}`
//   2. domain:  `<packageRoot>/domains/<domain>/prompt-templates/<templateId>.{md,txt}`
//   3. core:    `<packageRoot>/core/prompt-templates/<templateId>.{md,txt}`
//
// Bounded variables:
// Only variables derived from validated semantic action / ExecutionContract / Assignment
// are permitted in templates:
//   - {objective}
//   - {contextRefs} (and alias {artifactRefs})
//   - {expectedOutputs}
//   - {role}
//   - {constraints} (filtered to strip internal engine stamps such as protocol-operation:*)
//   - {evidenceContract}
// Any placeholder outside this bounded set fails loudly with 'template-invalid'.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { RunnerConfigError } from './config.mjs';
import { PROTOCOL_OPERATION_STAMP_PREFIX } from './execution-contract.mjs';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.resolve(THIS_DIR, '../../../');

export const CORE_PROMPT_TEMPLATES_DIR = path.join('core', 'prompt-templates');
export const DOMAIN_PROMPT_TEMPLATES_SEGMENT = 'prompt-templates';
export const PROJECT_PROMPT_TEMPLATES_DIR = path.join('.fgos', 'prompt-templates');

export const TEMPLATE_FILE_RE = /\.(md|txt)$/i;
export const TEMPLATE_ID_RE = /^[A-Za-z0-9._-]+$/;

export const BOUNDED_TEMPLATE_VARIABLES = Object.freeze(new Set([
  'objective',
  'contextRefs',
  'artifactRefs',
  'expectedOutputs',
  'role',
  'constraints',
  'evidenceContract',
]));

export class TemplateResolutionError extends RunnerConfigError {
  /**
   * @param {string} code - typed error code e.g. 'template-not-found', 'template-ambiguous', 'template-invalid', 'template-path-escape'
   * @param {string} message
   * @param {object} [details]
   */
  constructor(code, message, details = {}) {
    super(`operation-prompt-templates [${code}]: ${message}`);
    this.name = 'TemplateResolutionError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function computeSha256Digest(content) {
  const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${hash}`;
}

function relativeToPackageRoot(filePath, packageRoot = PACKAGE_ROOT) {
  return path.relative(packageRoot, filePath) || filePath;
}

/**
 * Path-escape guard: target must resolve strictly inside rootDir.
 */
function assertContained(rootDir, filePath) {
  const resolvedRoot = fs.existsSync(rootDir) ? fs.realpathSync(rootDir) : path.resolve(rootDir);
  const resolvedTarget = fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  if (rel === '' || rel.startsWith(`..${path.sep}`) || rel === '..' || path.isAbsolute(rel)) {
    throw new TemplateResolutionError(
      'template-path-escape',
      `template "${filePath}" resolves outside its scan root "${resolvedRoot}"`,
      { rootDir, filePath },
    );
  }
}

/**
 * Extract template ID from filename (basename without extension).
 */
export function templateIdFromFileName(fileName) {
  return fileName.replace(TEMPLATE_FILE_RE, '');
}

/**
 * Validate raw template text against the bounded variable whitelist.
 * Throws TemplateResolutionError('template-invalid') on any unrecognized placeholder.
 *
 * @param {string} rawContent
 * @param {string} [templateId='']
 * @returns {Set<string>} detected valid placeholders
 */
export function validateOperationPromptTemplate(rawContent, templateId = '') {
  if (typeof rawContent !== 'string') {
    throw new TemplateResolutionError('template-invalid', `template content for "${templateId}" must be a string`);
  }

  const detectedVariables = new Set();
  const placeholderRegex = /\{([A-Za-z0-9_-]+)\}/g;
  let match;
  while ((match = placeholderRegex.exec(rawContent)) !== null) {
    const varName = match[1];
    if (!BOUNDED_TEMPLATE_VARIABLES.has(varName)) {
      throw new TemplateResolutionError(
        'template-invalid',
        `template "${templateId}" references forbidden or unknown variable "{${varName}}". Only bounded variables are permitted: ${[...BOUNDED_TEMPLATE_VARIABLES].join(', ')}`,
        { templateId, variable: varName, allowed: [...BOUNDED_TEMPLATE_VARIABLES] },
      );
    }
    detectedVariables.add(varName);
  }

  return detectedVariables;
}

/**
 * Scan one directory for prompt template files (.md, .txt).
 * Rejects duplicate template IDs within the same directory.
 *
 * @param {string} tier
 * @param {string} dir
 * @param {string} source
 * @param {string} [packageRoot]
 * @returns {Array<object>}
 */
function scanTier(tier, dir, source, packageRoot = PACKAGE_ROOT) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((name) => TEMPLATE_FILE_RE.test(name)).sort((a, b) => a.localeCompare(b));

  const seenIds = new Map();
  const entries = [];

  for (const fileName of files) {
    const filePath = path.join(dir, fileName);
    assertContained(dir, filePath);

    const templateId = templateIdFromFileName(fileName);
    if (!TEMPLATE_ID_RE.test(templateId)) {
      throw new TemplateResolutionError(
        'template-invalid',
        `template filename "${fileName}" produces invalid template id "${templateId}" (must match ${TEMPLATE_ID_RE})`,
        { fileName, templateId },
      );
    }

    if (seenIds.has(templateId)) {
      const existingFile = seenIds.get(templateId);
      throw new TemplateResolutionError(
        'template-ambiguous',
        `duplicate template id "${templateId}" within ${source} (${fileName} conflicts with ${existingFile})`,
        { templateId, tier, source, fileName, existingFile },
      );
    }
    seenIds.set(templateId, fileName);

    const content = fs.readFileSync(filePath, 'utf8');
    validateOperationPromptTemplate(content, templateId);
    const contentDigest = computeSha256Digest(content);

    entries.push(Object.freeze({
      id: templateId,
      tier,
      source,
      filePath,
      relativeFilePath: relativeToPackageRoot(filePath, packageRoot),
      content,
      contentDigest,
    }));
  }

  return entries;
}

/**
 * Discover all operation prompt templates across project, domain, and core tiers.
 * Precedence: project > domain > core.
 *
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {string} [options.packageRoot]
 * @returns {ReadonlyArray<object>}
 */
export function discoverOperationPromptTemplates({ cwd = process.cwd(), packageRoot = PACKAGE_ROOT } = {}) {
  const byId = new Map();
  const domainTiers = new Map(); // templateId -> domainName for collision check across domains

  // 1. Project tier
  const projectDir = path.join(cwd, PROJECT_PROMPT_TEMPLATES_DIR);
  const projectEntries = scanTier('project', projectDir, 'project', packageRoot);
  for (const entry of projectEntries) {
    byId.set(entry.id, entry);
  }

  // 2. Domain tier
  const domainsRoot = path.join(packageRoot, 'domains');
  if (fs.existsSync(domainsRoot)) {
    const domainNames = fs
      .readdirSync(domainsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    for (const domainName of domainNames) {
      const domainDir = path.join(domainsRoot, domainName, DOMAIN_PROMPT_TEMPLATES_SEGMENT);
      const entries = scanTier('domain', domainDir, `domain:${domainName}`, packageRoot);
      for (const entry of entries) {
        if (domainTiers.has(entry.id) && domainTiers.get(entry.id) !== domainName) {
          throw new TemplateResolutionError(
            'template-ambiguous',
            `template id "${entry.id}" collides across domains "${domainTiers.get(entry.id)}" and "${domainName}"`,
            { templateId: entry.id, domain1: domainTiers.get(entry.id), domain2: domainName },
          );
        }
        domainTiers.set(entry.id, domainName);
        if (!byId.has(entry.id)) {
          byId.set(entry.id, entry);
        }
      }
    }
  }

  // 3. Core tier
  const coreDir = path.join(packageRoot, CORE_PROMPT_TEMPLATES_DIR);
  const coreEntries = scanTier('core', coreDir, 'core', packageRoot);
  for (const entry of coreEntries) {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }

  return Object.freeze([...byId.values()]);
}

/**
 * Load and resolve one operation prompt template by id.
 * Precedence: project > domain (if specified, that domain; otherwise any domain) > core.
 *
 * @param {string} templateId
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {string} [options.packageRoot]
 * @param {string} [options.domain]
 * @returns {object} resolved template entry
 */
export function loadOperationPromptTemplate(templateId, options = {}) {
  if (!templateId || typeof templateId !== 'string' || !TEMPLATE_ID_RE.test(templateId)) {
    throw new TemplateResolutionError('template-invalid', `invalid template id "${templateId}"`);
  }

  const cwd = options.cwd ?? process.cwd();
  const packageRoot = options.packageRoot ?? PACKAGE_ROOT;
  const targetDomain = options.domain;

  // 1. Check project tier
  const projectDir = path.join(cwd, PROJECT_PROMPT_TEMPLATES_DIR);
  if (fs.existsSync(projectDir)) {
    const projectEntries = scanTier('project', projectDir, 'project', packageRoot);
    const found = projectEntries.find((e) => e.id === templateId);
    if (found) return found;
  }

  // 2. Check domain tier
  if (targetDomain) {
    const domainDir = path.join(packageRoot, 'domains', targetDomain, DOMAIN_PROMPT_TEMPLATES_SEGMENT);
    if (fs.existsSync(domainDir)) {
      const domainEntries = scanTier('domain', domainDir, `domain:${targetDomain}`, packageRoot);
      const found = domainEntries.find((e) => e.id === templateId);
      if (found) return found;
    }
  } else {
    // If no target domain, scan all domains
    const domainsRoot = path.join(packageRoot, 'domains');
    if (fs.existsSync(domainsRoot)) {
      const domainNames = fs
        .readdirSync(domainsRoot, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b));

      let matchedDomainEntry = null;
      for (const domainName of domainNames) {
        const domainDir = path.join(domainsRoot, domainName, DOMAIN_PROMPT_TEMPLATES_SEGMENT);
        if (!fs.existsSync(domainDir)) continue;
        const domainEntries = scanTier('domain', domainDir, `domain:${domainName}`, packageRoot);
        const found = domainEntries.find((e) => e.id === templateId);
        if (found) {
          if (matchedDomainEntry) {
            throw new TemplateResolutionError(
              'template-ambiguous',
              `template id "${templateId}" collides across domains "${matchedDomainEntry.source}" and "${found.source}"`,
              { templateId, source1: matchedDomainEntry.source, source2: found.source },
            );
          }
          matchedDomainEntry = found;
        }
      }
      if (matchedDomainEntry) return matchedDomainEntry;
    }
  }

  // 3. Check core tier
  const coreDir = path.join(packageRoot, CORE_PROMPT_TEMPLATES_DIR);
  if (fs.existsSync(coreDir)) {
    const coreEntries = scanTier('core', coreDir, 'core', packageRoot);
    const found = coreEntries.find((e) => e.id === templateId);
    if (found) return found;
  }

  throw new TemplateResolutionError(
    'template-not-found',
    `no operation prompt template found for id "${templateId}" (searched project, domain, and core tiers)`,
    { templateId, cwd, domain: targetDomain },
  );
}

/**
 * Check if an operation prompt template exists and is valid.
 * Returns true if found and valid.
 * Returns false if not found.
 * Throws TemplateResolutionError if ambiguous, invalid, or path-escaped.
 *
 * @param {string} templateId
 * @param {object} [options]
 * @returns {boolean}
 */
export function hasOperationPromptTemplate(templateId, options = {}) {
  try {
    loadOperationPromptTemplate(templateId, options);
    return true;
  } catch (err) {
    if (err instanceof TemplateResolutionError && err.code === 'template-not-found') {
      return false;
    }
    throw err;
  }
}

function formatItemList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '- (none)';
  }
  return items.map((item) => `- ${item}`).join('\n');
}

/**
 * Filter out engine-reserved constraints (like protocol-operation:*) so internal
 * engine markers never leak to the model prompt.
 */
function formatConstraints(constraints) {
  if (!Array.isArray(constraints)) {
    return '- (none)';
  }
  const filtered = constraints.filter(
    (c) => typeof c === 'string' && !c.startsWith(PROTOCOL_OPERATION_STAMP_PREFIX),
  );
  if (filtered.length === 0) {
    return '- (none)';
  }
  return filtered.map((c) => `- ${c}`).join('\n');
}

/**
 * Render an operation prompt template with bounded variables.
 *
 * @param {string} templateContent
 * @param {object} variables
 * @returns {string} rendered prompt string
 */
export function renderOperationPromptTemplate(templateContent, variables = {}) {
  validateOperationPromptTemplate(templateContent);

  const objective = variables.objective ?? '';
  const role = variables.role ?? '';
  const contextRefs = Array.isArray(variables.contextRefs)
    ? formatItemList(variables.contextRefs)
    : (variables.contextRefs ?? '- (none)');
  const artifactRefs = Array.isArray(variables.artifactRefs)
    ? formatItemList(variables.artifactRefs)
    : (variables.artifactRefs ?? contextRefs);
  const expectedOutputs = Array.isArray(variables.expectedOutputs)
    ? formatItemList(variables.expectedOutputs)
    : (variables.expectedOutputs ?? '- (none)');
  const constraints = Array.isArray(variables.constraints)
    ? formatConstraints(variables.constraints)
    : (variables.constraints ?? '- (none)');
  const evidenceContract = variables.evidenceContract ?? (variables.evidence?.required ?? 'reported');

  return templateContent
    .replaceAll('{objective}', objective)
    .replaceAll('{role}', role)
    .replaceAll('{contextRefs}', contextRefs)
    .replaceAll('{artifactRefs}', artifactRefs)
    .replaceAll('{expectedOutputs}', expectedOutputs)
    .replaceAll('{constraints}', constraints)
    .replaceAll('{evidenceContract}', evidenceContract);
}

/**
 * Resolve an operation prompt template and render it for an assignment.
 * Accepts either an assignment object with contractTemplate, or a string templateId with options.variables.
 * Returns the rendered prompt body and complete template provenance.
 *
 * @param {object|string} assignmentOrTemplateId
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {string} [options.packageRoot]
 * @param {string} [options.domain]
 * @param {object} [options.variables]
 * @returns {{ renderedBody: string, templateProvenance: object }}
 */
export function resolveAndRenderOperationPrompt(assignmentOrTemplateId, options = {}) {
  let templateId;
  let target = {};
  if (typeof assignmentOrTemplateId === 'string') {
    templateId = assignmentOrTemplateId;
    target = options.variables || options.assignment || {};
  } else if (assignmentOrTemplateId && typeof assignmentOrTemplateId === 'object') {
    target = assignmentOrTemplateId;
    templateId = assignmentOrTemplateId.contractTemplate;
  } else {
    throw new TemplateResolutionError('template-invalid', 'assignment object or templateId string is required');
  }

  // I04-REV-01 & I04-REV-02: Check for already-pinned template snapshot in provenance or options.
  // When an assignment already has a pinned template snapshot (from initial resolution or stored
  // assignment.json), render directly from the pinned snapshot so retry/replay attribution is
  // strictly deterministic even if the disk template changes or is removed later.
  // Enforce strict integrity: validate schema, recompute digest of snapshot against contentDigest,
  // recompute renderedPromptDigest and verify match with stored digest. Fail closed on any corruption
  // with typed 'template-provenance-mismatch'.
  const pinnedTemplate = target.provenance?.template ?? options.templateProvenance ?? options.pinnedTemplate;
  const SHA256_HEX_REGEX = /^sha256:[0-9a-f]{64}$/;

  let templateEntry;
  if (pinnedTemplate !== undefined && pinnedTemplate !== null) {
    if (typeof pinnedTemplate !== 'object' || Array.isArray(pinnedTemplate)) {
      throw new TemplateResolutionError('template-provenance-mismatch', 'pinned template provenance must be a non-null object', { pinnedTemplate });
    }
    if (typeof pinnedTemplate.templateSnapshot !== 'string' || !pinnedTemplate.templateSnapshot.trim()) {
      throw new TemplateResolutionError('template-provenance-mismatch', 'pinned template provenance contains missing or non-string templateSnapshot', { pinnedTemplate });
    }
    if (typeof pinnedTemplate.id !== 'string' || !pinnedTemplate.id.trim()) {
      throw new TemplateResolutionError('template-provenance-mismatch', 'pinned template provenance missing non-empty id', { pinnedTemplate });
    }
    if (templateId && pinnedTemplate.id !== templateId) {
      throw new TemplateResolutionError(
        'template-provenance-mismatch',
        `pinned template id "${pinnedTemplate.id}" does not match contractTemplate "${templateId}"`,
        { pinnedId: pinnedTemplate.id, templateId },
      );
    }
    templateId = pinnedTemplate.id;

    if (pinnedTemplate.tier !== undefined && (typeof pinnedTemplate.tier !== 'string' || !pinnedTemplate.tier.trim())) {
      throw new TemplateResolutionError('template-provenance-mismatch', 'pinned template tier must be a non-empty string when present', { pinnedTemplate });
    }
    if (pinnedTemplate.source !== undefined && (typeof pinnedTemplate.source !== 'string' || !pinnedTemplate.source.trim())) {
      throw new TemplateResolutionError('template-provenance-mismatch', 'pinned template source must be a non-empty string when present', { pinnedTemplate });
    }
    if (pinnedTemplate.filePath !== undefined && pinnedTemplate.filePath !== null && (typeof pinnedTemplate.filePath !== 'string' || !pinnedTemplate.filePath.trim())) {
      throw new TemplateResolutionError('template-provenance-mismatch', 'pinned template filePath must be a string or null when present', { pinnedTemplate });
    }

    const actualContentDigest = computeSha256Digest(pinnedTemplate.templateSnapshot);
    if (pinnedTemplate.contentDigest !== undefined) {
      if (typeof pinnedTemplate.contentDigest !== 'string' || !SHA256_HEX_REGEX.test(pinnedTemplate.contentDigest)) {
        throw new TemplateResolutionError('template-provenance-mismatch', `pinned template contentDigest is malformed: "${pinnedTemplate.contentDigest}"`, { contentDigest: pinnedTemplate.contentDigest });
      }
      if (pinnedTemplate.contentDigest !== actualContentDigest) {
        throw new TemplateResolutionError(
          'template-provenance-mismatch',
          `pinned template contentDigest mismatch: expected "${actualContentDigest}", got "${pinnedTemplate.contentDigest}"`,
          { expectedContentDigest: actualContentDigest, actualContentDigest: pinnedTemplate.contentDigest },
        );
      }
    }

    if (pinnedTemplate.renderedPromptDigest !== undefined) {
      if (typeof pinnedTemplate.renderedPromptDigest !== 'string' || !SHA256_HEX_REGEX.test(pinnedTemplate.renderedPromptDigest)) {
        throw new TemplateResolutionError('template-provenance-mismatch', `pinned template renderedPromptDigest is malformed: "${pinnedTemplate.renderedPromptDigest}"`, { renderedPromptDigest: pinnedTemplate.renderedPromptDigest });
      }
    }

    // Re-verify bounded variables on the snapshot to preserve template-invalid invariants
    validateOperationPromptTemplate(pinnedTemplate.templateSnapshot, templateId);

    templateEntry = {
      id: pinnedTemplate.id,
      tier: pinnedTemplate.tier || 'pinned',
      source: pinnedTemplate.source || 'pinned',
      relativeFilePath: pinnedTemplate.filePath || null,
      content: pinnedTemplate.templateSnapshot,
      contentDigest: actualContentDigest,
    };
  } else {
    if (!templateId || typeof templateId !== 'string') {
      throw new TemplateResolutionError('template-invalid', 'assignment does not declare valid contractTemplate string');
    }
    templateEntry = loadOperationPromptTemplate(templateId, {
      cwd: options.cwd,
      packageRoot: options.packageRoot,
      domain: options.domain || target.domain,
    });
  }

  const variables = {
    objective: target.objective ?? '',
    role: target.role ?? '',
    contextRefs: target.contextRefs ?? target.artifactRefs ?? [],
    artifactRefs: target.artifactRefs ?? target.contextRefs ?? [],
    expectedOutputs: target.expectedOutputs ?? [],
    constraints: target.constraints ?? [],
    evidenceContract: target.evidenceContract ?? target.evidence?.required ?? 'reported',
  };

  const renderedBody = renderOperationPromptTemplate(templateEntry.content, variables);
  const renderedPromptDigest = computeSha256Digest(renderedBody);

  // I04-REV-02: Recompute rendered digest and verify against stored renderedPromptDigest when retry/replay
  // occurs with immutable Assignment inputs. Fail closed if there is a mismatch.
  if (pinnedTemplate && pinnedTemplate.renderedPromptDigest !== undefined) {
    if (pinnedTemplate.renderedPromptDigest !== renderedPromptDigest) {
      throw new TemplateResolutionError(
        'template-provenance-mismatch',
        `rendered prompt digest mismatch for pinned template "${templateEntry.id}": expected "${pinnedTemplate.renderedPromptDigest}", computed "${renderedPromptDigest}"`,
        {
          expectedRenderedPromptDigest: pinnedTemplate.renderedPromptDigest,
          computedRenderedPromptDigest: renderedPromptDigest,
        },
      );
    }
  }

  const templateProvenance = Object.freeze({
    id: templateEntry.id,
    tier: templateEntry.tier,
    source: templateEntry.source,
    filePath: templateEntry.relativeFilePath,
    contentDigest: templateEntry.contentDigest,
    renderedPromptDigest,
    templateSnapshot: templateEntry.content,
  });

  return { renderedBody, templateProvenance };
}
