// instruction-registry.mjs — Canonical instruction source registry & discovery (P3)
// (docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md).
//
// Discovers canonical instruction fragments from:
//   - core/instructions/
//   - components/<component>/instructions/
//   - domains/<domain>/instructions/
//
// Classifies fragments into rule forces:
//   law, boundary, procedure, host-adapter, preference.
//
// Attaches metadata for authority, specificity, and applicability.
// Merge policy (P4) and projection rendering (P5) are downstream.

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

/**
 * Valid instruction rule forces (Section 6)
 */
export const INSTRUCTION_KINDS = Object.freeze([
  'law',
  'boundary',
  'procedure',
  'host-adapter',
  'preference',
]);

/**
 * Valid composition modes (Section 5)
 */
export const INSTRUCTION_MODES = Object.freeze([
  'append',
  'refine',
  'override',
  'forbid',
]);

/**
 * Valid instruction scopes (Section 5 & 7)
 */
export const INSTRUCTION_SCOPES = Object.freeze([
  'repo',
  'platform',
  'component',
  'domain',
  'workspace',
  'project',
  'command',
  'skill',
  'host',
  'session',
]);

/**
 * Valid authority types
 */
export const AUTHORITY_TYPES = Object.freeze([
  'platform',
  'component',
  'domain',
]);

/**
 * Default scope specificity scores (Section 7: broad to narrow)
 * platform/repo (10) -> component (20) -> domain (30) -> workspace/project (40) -> command (50) -> skill (60) -> session (70)
 */
export const DEFAULT_SCOPE_SPECIFICITY = Object.freeze({
  repo: 10,
  platform: 10,
  component: 20,
  domain: 30,
  workspace: 40,
  project: 40,
  command: 50,
  skill: 60,
  session: 70,
  host: 80,
});

/**
 * Pattern for extracting YAML frontmatter fenced by `---`.
 */
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

/**
 * Custom error class for instruction registry operations.
 */
export class InstructionRegistryError extends Error {
  constructor(message, { filePath, code, cause } = {}) {
    super(filePath ? `${message} (in ${filePath})` : message);
    this.name = 'InstructionRegistryError';
    this.filePath = filePath;
    this.code = code || 'INSTRUCTION_REGISTRY_ERROR';
    if (cause) this.cause = cause;
  }
}

/**
 * Normalized posix path helper.
 */
function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

/**
 * Extract YAML frontmatter and markdown body from instruction content.
 */
export function extractInstructionFrontmatter(rawContent, filePath = '') {
  if (typeof rawContent !== 'string') {
    throw new InstructionRegistryError('Instruction content must be a string', {
      filePath,
      code: 'INVALID_METADATA',
    });
  }

  const match = FRONTMATTER_PATTERN.exec(rawContent);
  if (!match) {
    throw new InstructionRegistryError(
      'Instruction file is missing YAML frontmatter block (--- ... ---)',
      { filePath, code: 'INVALID_METADATA' },
    );
  }

  let meta;
  try {
    meta = YAML.parse(match[1]);
  } catch (err) {
    throw new InstructionRegistryError(
      `Failed to parse YAML frontmatter: ${err.message}`,
      { filePath, code: 'INVALID_METADATA', cause: err },
    );
  }

  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new InstructionRegistryError(
      'Instruction frontmatter must be a key-value object',
      { filePath, code: 'INVALID_METADATA' },
    );
  }

  const body = rawContent.slice(match[0].length);
  return { meta, body, rawContent };
}

/**
 * Compile parsed frontmatter and body into an Instruction Unit with validated metadata.
 */
export function compileInstructionUnit(meta, body, rawContent, context) {
  const { projectRoot, fullPath, sourcePath, rootType, rootOwner, knownOwners } = context;

  // 1. Validate ID
  if (!meta.id || typeof meta.id !== 'string' || !meta.id.trim()) {
    throw new InstructionRegistryError('Instruction unit missing or invalid "id"', {
      filePath: sourcePath,
      code: 'INVALID_METADATA',
    });
  }
  const id = meta.id.trim();
  if (!/^[a-zA-Z0-9_.-]+$/.test(id)) {
    throw new InstructionRegistryError(
      `Instruction "id" contains invalid characters: "${id}". Must be alphanumeric with dashes, underscores, or dots.`,
      { filePath: sourcePath, code: 'INVALID_METADATA' },
    );
  }

  // 2. Validate Kind (Rule Force)
  if (!meta.kind || typeof meta.kind !== 'string') {
    throw new InstructionRegistryError('Instruction unit missing or invalid "kind"', {
      filePath: sourcePath,
      code: 'INVALID_METADATA',
    });
  }
  const kind = meta.kind.trim();
  if (!INSTRUCTION_KINDS.includes(kind)) {
    throw new InstructionRegistryError(
      `Invalid instruction "kind": "${kind}". Must be one of: ${INSTRUCTION_KINDS.join(', ')}`,
      { filePath: sourcePath, code: 'INVALID_METADATA' },
    );
  }

  // 3. Validate Mode
  let mode = 'append';
  if (meta.mode !== undefined) {
    if (typeof meta.mode !== 'string' || !INSTRUCTION_MODES.includes(meta.mode.trim())) {
      throw new InstructionRegistryError(
        `Invalid instruction "mode": "${meta.mode}". Must be one of: ${INSTRUCTION_MODES.join(', ')}`,
        { filePath: sourcePath, code: 'INVALID_METADATA' },
      );
    }
    mode = meta.mode.trim();
  }

  // 4. Validate Scope
  let scope;
  if (meta.scope !== undefined) {
    if (typeof meta.scope !== 'string' || !INSTRUCTION_SCOPES.includes(meta.scope.trim())) {
      throw new InstructionRegistryError(
        `Invalid instruction "scope": "${meta.scope}". Must be one of: ${INSTRUCTION_SCOPES.join(', ')}`,
        { filePath: sourcePath, code: 'INVALID_METADATA' },
      );
    }
    scope = meta.scope.trim();
  } else {
    if (rootType === 'platform') {
      scope = 'repo';
    } else if (rootType === 'component') {
      scope = 'component';
    } else if (rootType === 'domain') {
      scope = 'domain';
    } else {
      scope = 'repo';
    }
  }

  // 5. Validate Owner and Authority
  const unitOwner = meta.owner ? String(meta.owner).trim() : rootOwner;
  if (!unitOwner) {
    throw new InstructionRegistryError('Instruction unit missing or invalid "owner"', {
      filePath: sourcePath,
      code: 'INVALID_METADATA',
    });
  }

  // Check against knownOwners if provided
  if (knownOwners && !knownOwners.has(unitOwner)) {
    throw new InstructionRegistryError(
      `Unknown owner "${unitOwner}". Known owners are: ${[...knownOwners].sort().join(', ')}`,
      { filePath: sourcePath, code: 'UNKNOWN_OWNER' },
    );
  }

  // If owner is explicitly provided, verify it does not conflict with authority root owner
  if (meta.owner && unitOwner !== rootOwner) {
    throw new InstructionRegistryError(
      `Instruction declares owner "${unitOwner}" which mismatches authority root owner "${rootOwner}"`,
      { filePath: sourcePath, code: 'AUTHORITY_MISMATCH' },
    );
  }

  const authorityType = rootType === 'platform' ? 'platform' : rootType;
  const authority = Object.freeze({
    type: authorityType,
    name: unitOwner,
    toString() {
      return `${authorityType}:${unitOwner}`;
    },
  });

  // 6. Validate Specificity
  let specificity;
  if (meta.specificity !== undefined) {
    if (typeof meta.specificity !== 'number' || !Number.isFinite(meta.specificity)) {
      throw new InstructionRegistryError(
        `Invalid "specificity": "${meta.specificity}". Must be a finite number.`,
        { filePath: sourcePath, code: 'INVALID_METADATA' },
      );
    }
    specificity = meta.specificity;
  } else {
    specificity = DEFAULT_SCOPE_SPECIFICITY[scope] ?? 10;
  }

  // 7. Validate Applicability (appliesTo)
  const rawAppliesTo = meta.appliesTo ?? meta.applicability ?? ['*'];
  let appliesTo;
  if (typeof rawAppliesTo === 'string') {
    appliesTo = [rawAppliesTo.trim()];
  } else if (Array.isArray(rawAppliesTo) && rawAppliesTo.every((item) => typeof item === 'string')) {
    appliesTo = rawAppliesTo.map((item) => item.trim());
  } else {
    throw new InstructionRegistryError(
      'Invalid "appliesTo" or "applicability": must be a string or array of strings',
      { filePath: sourcePath, code: 'INVALID_METADATA' },
    );
  }

  // 8. Normalise relationship arrays
  const toArrayOfStrings = (val, fieldName) => {
    if (!val) return [];
    if (typeof val === 'string') return [val.trim()];
    if (Array.isArray(val) && val.every((item) => typeof item === 'string')) {
      return val.map((item) => item.trim());
    }
    throw new InstructionRegistryError(
      `Invalid "${fieldName}": must be a string or array of strings`,
      { filePath: sourcePath, code: 'INVALID_METADATA' },
    );
  };

  const dependsOn = toArrayOfStrings(meta.dependsOn, 'dependsOn');
  const refines = toArrayOfStrings(meta.refines, 'refines');
  const supersedes = toArrayOfStrings(meta.supersedes, 'supersedes');
  const conflictsWith = toArrayOfStrings(meta.conflictsWith, 'conflictsWith');

  const renderHints = meta.renderHints && typeof meta.renderHints === 'object' && !Array.isArray(meta.renderHints)
    ? { ...meta.renderHints }
    : {};

  return Object.freeze({
    id,
    owner: unitOwner,
    authority,
    sourcePath,
    fullPath,
    scope,
    kind,
    mode,
    appliesTo,
    applicability: appliesTo,
    specificity,
    dependsOn,
    refines,
    supersedes,
    conflictsWith,
    renderHints,
    title: typeof meta.title === 'string' ? meta.title : '',
    description: typeof meta.description === 'string' ? meta.description : '',
    body: body.trim(),
    rawContent,
  });
}

/**
 * Scan directory recursively for markdown files (*.md).
 * Enforces containment policy and lowercase .md extension case policy.
 */
function scanMarkdownFiles(dir, containmentRoot = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  let realContainmentRoot;
  try {
    realContainmentRoot = fs.realpathSync(containmentRoot);
  } catch {
    realContainmentRoot = path.resolve(containmentRoot);
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);

    // Verify containment (disallow symlinks escaping containmentRoot)
    let realEntryPath;
    try {
      realEntryPath = fs.realpathSync(fullPath);
    } catch {
      continue;
    }

    const relToRoot = path.relative(realContainmentRoot, realEntryPath);
    if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
      throw new InstructionRegistryError(
        `Instruction source "${toPosixPath(fullPath)}" resolves outside containment root "${toPosixPath(containmentRoot)}" via symlink`,
        { filePath: fullPath, code: 'CONTAINMENT_VIOLATION' },
      );
    }

    if (entry.isDirectory()) {
      results.push(...scanMarkdownFiles(fullPath, containmentRoot));
    } else if (entry.isFile()) {
      // Case policy: only lowercase .md extension is recognized
      if (entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * Discover allowed components and domains under project root from the authoritative
 * architecture manifest (e.g. docs/architecture-manifest.json), rejecting unregistered roots.
 *
 * Options:
 *   - manifestPath: custom path to architecture manifest (internal/test-only)
 *   - allowedComponents: explicit array/set of allowed component names (internal/test-only)
 *   - allowedDomains: explicit array/set of allowed domain names (internal/test-only)
 */
export function discoverKnownOwners(projectRoot, options = {}) {
  const manifestPath = options.manifestPath ?? path.join(projectRoot, 'docs', 'architecture-manifest.json');
  const owners = new Set(['core', 'platform']);

  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(manifest.components)) {
        for (const comp of manifest.components) {
          if (typeof comp === 'string' && comp.trim()) {
            owners.add(comp.trim());
          }
        }
      }
      if (Array.isArray(manifest.domains)) {
        for (const dom of manifest.domains) {
          if (typeof dom === 'string' && dom.trim()) {
            owners.add(dom.trim());
          }
        }
      }
    } catch (err) {
      throw new InstructionRegistryError(
        `Failed to parse architecture manifest at ${manifestPath}: ${err.message}`,
        { filePath: manifestPath, code: 'MANIFEST_ERROR', cause: err },
      );
    }
  }

  if (options.allowedComponents) {
    for (const comp of options.allowedComponents) {
      if (typeof comp === 'string' && comp.trim()) owners.add(comp.trim());
    }
  }
  if (options.allowedDomains) {
    for (const dom of options.allowedDomains) {
      if (typeof dom === 'string' && dom.trim()) owners.add(dom.trim());
    }
  }

  return owners;
}

/**
 * InstructionRegistry extends Array to provide array iteration alongside query lookups.
 * Instances are frozen post-construction to prevent mutation and index corruption.
 * Array operations (map, slice, filter, concat) maintain correct types and lookup semantics.
 */
export class InstructionRegistry extends Array {
  static get [Symbol.species]() {
    return Array;
  }

  #byId;

  constructor(...items) {
    super(...items);
    this.#byId = new Map();
    for (const unit of this) {
      if (unit && unit.id) {
        this.#byId.set(unit.id, unit);
      }
    }
    Object.freeze(this);
  }

  get(id) {
    return this.#byId.get(id);
  }

  has(id) {
    return this.#byId.has(id);
  }

  list() {
    return [...this];
  }

  get units() {
    return [...this];
  }

  get byId() {
    return new Map(this.#byId);
  }

  filter(callback, thisArg) {
    const results = Array.prototype.filter.call(this, callback, thisArg);
    return new InstructionRegistry(...results);
  }

  slice(start, end) {
    const results = Array.prototype.slice.call(this, start, end);
    return new InstructionRegistry(...results);
  }

  concat(...items) {
    const results = Array.prototype.concat.call(this, ...items);
    return new InstructionRegistry(...results);
  }

  findByOwner(owner) {
    return this.filter((u) => u.owner === owner);
  }

  findByKind(kind) {
    return this.filter((u) => u.kind === kind);
  }

  findByAuthority(authorityType) {
    return this.filter((u) => u.authority.type === authorityType);
  }

  findByScope(scope) {
    return this.filter((u) => u.scope === scope);
  }
}

/**
 * Discover canonical instruction sources from:
 *   - core/instructions/
 *   - components/<component>/instructions/
 *   - domains/<domain>/instructions/
 *
 * In production default discovery, instruction sources are strictly discovered
 * from within projectRoot. Allowed component and domain owners are authoritatively
 * resolved from docs/architecture-manifest.json. Unregistered default roots are rejected.
 *
 * Custom roots (coreRoot, componentsRoot, domainsRoot) are test-only/internal options
 * intended solely for test harness fixture isolation and cannot be used by production
 * default discovery.
 *
 * Options:
 *   - coreRoot: (internal/test-only) custom path to core/instructions/
 *   - componentsRoot: (internal/test-only) custom path to components/
 *   - domainsRoot: (internal/test-only) custom path to domains/
 *   - manifestPath: (internal/test-only) custom path to architecture manifest
 *   - knownOwners: Set or Array of valid owner names (internal/test-only override)
 *   - allowDuplicates: boolean (default false, throws on duplicate id)
 */
export function discoverInstructionSources(projectRoot, options = {}) {
  const coreRoot = options.coreRoot ?? path.join(projectRoot, 'core', 'instructions');
  const componentsRoot = options.componentsRoot ?? path.join(projectRoot, 'components');
  const domainsRoot = options.domainsRoot ?? path.join(projectRoot, 'domains');

  // Discover or use provided known owners
  let knownOwners = null;
  if (options.knownOwners) {
    knownOwners = options.knownOwners instanceof Set
      ? options.knownOwners
      : new Set(options.knownOwners);
  } else {
    knownOwners = discoverKnownOwners(projectRoot, {
      manifestPath: options.manifestPath,
      allowedComponents: options.allowedComponents,
      allowedDomains: options.allowedDomains,
    });
  }

  const collected = [];
  const idToPaths = new Map();

  // 1. Core / platform instructions
  if (fs.existsSync(coreRoot)) {
    const files = scanMarkdownFiles(coreRoot, options.coreRoot ? coreRoot : projectRoot);
    for (const fullPath of files) {
      const sourcePath = toPosixPath(path.relative(projectRoot, fullPath));
      const content = fs.readFileSync(fullPath, 'utf8');
      const { meta, body, rawContent } = extractInstructionFrontmatter(content, sourcePath);
      const unit = compileInstructionUnit(meta, body, rawContent, {
        projectRoot,
        fullPath,
        sourcePath,
        rootType: 'platform',
        rootOwner: 'core',
        knownOwners,
      });
      collected.push(unit);
    }
  }

  // 2. Component instructions
  if (fs.existsSync(componentsRoot)) {
    for (const compEntry of fs.readdirSync(componentsRoot, { withFileTypes: true })) {
      if (!compEntry.isDirectory() || compEntry.name.startsWith('.')) continue;
      const componentName = compEntry.name;

      if (!knownOwners.has(componentName)) {
        throw new InstructionRegistryError(
          `Unknown component owner "${componentName}" in components directory. Known owners are: ${[...knownOwners].sort().join(', ')}`,
          {
            filePath: toPosixPath(path.relative(projectRoot, path.join(componentsRoot, componentName))),
            code: 'UNKNOWN_OWNER',
          },
        );
      }

      const instructionsDir = path.join(componentsRoot, componentName, 'instructions');
      if (fs.existsSync(instructionsDir)) {
        const files = scanMarkdownFiles(instructionsDir, options.componentsRoot ? componentsRoot : projectRoot);
        for (const fullPath of files) {
          const sourcePath = toPosixPath(path.relative(projectRoot, fullPath));
          const content = fs.readFileSync(fullPath, 'utf8');
          const { meta, body, rawContent } = extractInstructionFrontmatter(content, sourcePath);
          const unit = compileInstructionUnit(meta, body, rawContent, {
            projectRoot,
            fullPath,
            sourcePath,
            rootType: 'component',
            rootOwner: componentName,
            knownOwners,
          });
          collected.push(unit);
        }
      }
    }
  }

  // 3. Domain instructions
  if (fs.existsSync(domainsRoot)) {
    for (const domainEntry of fs.readdirSync(domainsRoot, { withFileTypes: true })) {
      if (!domainEntry.isDirectory() || domainEntry.name.startsWith('.')) continue;
      const domainName = domainEntry.name;

      if (!knownOwners.has(domainName)) {
        throw new InstructionRegistryError(
          `Unknown domain owner "${domainName}" in domains directory. Known owners are: ${[...knownOwners].sort().join(', ')}`,
          {
            filePath: toPosixPath(path.relative(projectRoot, path.join(domainsRoot, domainName))),
            code: 'UNKNOWN_OWNER',
          },
        );
      }

      const instructionsDir = path.join(domainsRoot, domainName, 'instructions');
      if (fs.existsSync(instructionsDir)) {
        const files = scanMarkdownFiles(instructionsDir, options.domainsRoot ? domainsRoot : projectRoot);
        for (const fullPath of files) {
          const sourcePath = toPosixPath(path.relative(projectRoot, fullPath));
          const content = fs.readFileSync(fullPath, 'utf8');
          const { meta, body, rawContent } = extractInstructionFrontmatter(content, sourcePath);
          const unit = compileInstructionUnit(meta, body, rawContent, {
            projectRoot,
            fullPath,
            sourcePath,
            rootType: 'domain',
            rootOwner: domainName,
            knownOwners,
          });
          collected.push(unit);
        }
      }
    }
  }

  // Check for duplicate IDs
  if (!options.allowDuplicates) {
    for (const unit of collected) {
      if (!idToPaths.has(unit.id)) {
        idToPaths.set(unit.id, [unit.sourcePath]);
      } else {
        idToPaths.get(unit.id).push(unit.sourcePath);
      }
    }

    for (const [id, paths] of idToPaths.entries()) {
      if (paths.length > 1) {
        throw new InstructionRegistryError(
          `Duplicate instruction id "${id}" found in multiple files:\n - ${paths.join('\n - ')}`,
          { code: 'DUPLICATE_ID' },
        );
      }
    }
  }

  return new InstructionRegistry(...collected);
}
