#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMAND_REGISTRY } from '../src/cli/command-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const DEFAULT_ANNOTATIONS_PATH = path.join(
  REPO_ROOT,
  'packages/host-runtime/contracts/command-route-annotations.json'
);

export const DEFAULT_ROUTES_PATH = path.join(
  REPO_ROOT,
  'packages/host-runtime/contracts/command-routes.json'
);

/**
 * Load and validate annotations from file or object/string.
 * Handles both object and array formats, checking for duplicates and multi-bound route kinds.
 */
export function loadAnnotations(input) {
  let rawText = '';
  let parsed;

  if (typeof input === 'string') {
    if (fs.existsSync(input)) {
      rawText = fs.readFileSync(input, 'utf8');
      parsed = JSON.parse(rawText);
    } else {
      rawText = input;
      parsed = JSON.parse(rawText);
    }
  } else if (typeof input === 'object' && input !== null) {
    parsed = input;
  } else {
    throw new Error('Invalid annotations input');
  }

  // Detect duplicate keys in raw JSON text if available
  if (rawText && !Array.isArray(parsed)) {
    const objMatch = rawText.match(/^\s*\{([\s\S]*)\}\s*$/);
    if (objMatch) {
      const topLevelKeys = new Set();
      const entries = objMatch[1].split(/,\s*(?=")/);
      for (const entry of entries) {
        const keyMatch = entry.match(/^\s*"([^"\\]+)"\s*:/);
        if (keyMatch) {
          const k = keyMatch[1];
          if (topLevelKeys.has(k)) {
            throw new Error(`Double-bound selector: selector "${k}" declared more than once in annotations`);
          }
          topLevelKeys.add(k);
        }
      }
    }
  }

  const annotationsMap = new Map();

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (!item || typeof item !== 'object' || !item.selector) {
        throw new Error('Annotation array item missing selector property');
      }
      const sel = item.selector;
      if (annotationsMap.has(sel)) {
        throw new Error(`Double-bound selector: selector "${sel}" declared more than once in annotations`);
      }
      checkRouteKind(sel, item);
      annotationsMap.set(sel, item);
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    for (const [sel, item] of Object.entries(parsed)) {
      if (!item || typeof item !== 'object') {
        throw new Error(`Annotation for selector "${sel}" must be an object`);
      }
      checkRouteKind(sel, item);
      annotationsMap.set(sel, { selector: sel, ...item });
    }
  }

  return annotationsMap;
}

function checkRouteKind(sel, item) {
  if (Array.isArray(item.route_kind) && item.route_kind.length > 1) {
    throw new Error(`Double-bound selector: selector "${sel}" declares more than one route_kind`);
  }
  if (Array.isArray(item.route_kinds) && item.route_kinds.length > 1) {
    throw new Error(`Double-bound selector: selector "${sel}" declares more than one route_kind`);
  }
  if (item.route_kind && item.route_kinds) {
    throw new Error(`Double-bound selector: selector "${sel}" declares both route_kind and route_kinds`);
  }
}

/**
 * Assert that all COMMAND_REGISTRY selectors end up with a route in the output.
 * R5: any COMMAND_REGISTRY selector ends up with no route in the output (unlisted selector)
 */
export function assertAllSelectorsListed(routes, registry = COMMAND_REGISTRY) {
  for (const cmd of registry) {
    if (!routes[cmd.name]) {
      throw new Error(`Unlisted selector: selector "${cmd.name}" has no route in generated output`);
    }
  }

  if (Object.keys(routes).length !== registry.length) {
    throw new Error(`Route count mismatch: expected ${registry.length}, got ${Object.keys(routes).length}`);
  }
}

/**
 * Generate CommandRouteDescriptor map from registry and annotations.
 */
export function generateCommandRoutes({ registry = COMMAND_REGISTRY, annotations = null } = {}) {
  const annotationsMap = annotations instanceof Map
    ? annotations
    : (annotations ? loadAnnotations(annotations) : loadAnnotations(DEFAULT_ANNOTATIONS_PATH));

  const registrySelectors = new Set(registry.map((e) => e.name));

  // R5: Fail if annotation names a selector absent from COMMAND_REGISTRY (stale annotation)
  for (const sel of annotationsMap.keys()) {
    if (!registrySelectors.has(sel)) {
      throw new Error(`Stale annotation: selector "${sel}" is absent from COMMAND_REGISTRY`);
    }
  }

  const routes = {};

  // Sort selectors lexicographically for deterministic output
  const sortedCommands = [...registry].sort((a, b) => a.name.localeCompare(b.name));

  for (const cmd of sortedCommands) {
    const selector = cmd.name;
    const ann = annotationsMap.get(selector);

    let route_kind;
    let operation_id;
    let legacy_payload;
    let owner_path;
    let compatibility_tests;

    if (ann) {
      route_kind = Array.isArray(ann.route_kind) ? ann.route_kind[0] : ann.route_kind;
      if (!route_kind) {
        throw new Error(`Annotation for selector "${selector}" is missing route_kind`);
      }
      if (route_kind === 'native') {
        operation_id = ann.operation_id;
        if (!operation_id) {
          throw new Error(`Native route for selector "${selector}" requires operation_id`);
        }
        owner_path = ann.owner_path ?? (selector === 'version' ? 'packages/distribution/rust' : 'packages/distribution/rust');
      } else if (route_kind === 'legacy-cli') {
        legacy_payload = ann.legacy_payload ?? 'legacy-node';
        owner_path = ann.owner_path ?? 'src/cli/command-registry.mjs';
      } else {
        throw new Error(`Invalid route_kind "${route_kind}" for selector "${selector}"`);
      }
      compatibility_tests = ann.compatibility_tests ?? ['test/rust-host/command-routes.test.mjs'];
    } else {
      // Default to legacy-cli
      route_kind = 'legacy-cli';
      legacy_payload = 'legacy-node';
      owner_path = 'src/cli/command-registry.mjs';
      compatibility_tests = ['test/rust-host/command-routes.test.mjs'];
    }

    if (!Array.isArray(compatibility_tests) || compatibility_tests.length === 0) {
      throw new Error(`Selector "${selector}" has empty compatibility_tests`);
    }

    const descriptor = {
      selector,
      route_kind,
      ...(operation_id ? { operation_id } : {}),
      ...(legacy_payload ? { legacy_payload } : {}),
      owner_path,
      compatibility_tests,
    };

    routes[selector] = descriptor;
  }

  // R5: Fail if any COMMAND_REGISTRY selector ends up with no route in output (unlisted selector)
  assertAllSelectorsListed(routes, registry);

  return routes;
}

export function formatCommandRoutesJson(routes) {
  const sortedKeys = Object.keys(routes).sort();
  const sortedObj = {};
  for (const k of sortedKeys) {
    sortedObj[k] = routes[k];
  }
  return JSON.stringify(sortedObj, null, 2) + '\n';
}

export function exportCommandRoutes({
  routesPath = DEFAULT_ROUTES_PATH,
  annotationsPath = DEFAULT_ANNOTATIONS_PATH,
  registry = COMMAND_REGISTRY,
} = {}) {
  const routes = generateCommandRoutes({ registry, annotations: annotationsPath });
  const content = formatCommandRoutesJson(routes);

  fs.mkdirSync(path.dirname(routesPath), { recursive: true });
  const tmpPath = `${routesPath}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, routesPath);
  return { routes, content };
}

export function checkCommandRoutes({
  routesPath = DEFAULT_ROUTES_PATH,
  annotationsPath = DEFAULT_ANNOTATIONS_PATH,
  registry = COMMAND_REGISTRY,
} = {}) {
  const routes = generateCommandRoutes({ registry, annotations: annotationsPath });
  const expectedContent = formatCommandRoutesJson(routes);

  if (!fs.existsSync(routesPath)) {
    return {
      clean: false,
      summary: `Target routes file does not exist: ${routesPath}`,
    };
  }

  const actualContent = fs.readFileSync(routesPath, 'utf8');
  if (actualContent === expectedContent) {
    return { clean: true, summary: '' };
  }

  // Diff summary
  let actualObj = null;
  try {
    actualObj = JSON.parse(actualContent);
  } catch {
    return {
      clean: false,
      summary: `Committed file ${routesPath} contains invalid JSON`,
    };
  }

  const actualKeys = Object.keys(actualObj);
  const expectedKeys = Object.keys(routes);

  const missing = expectedKeys.filter((k) => !actualKeys.includes(k));
  const extra = actualKeys.filter((k) => !expectedKeys.includes(k));
  const modified = [];

  for (const k of expectedKeys) {
    if (actualObj[k] && JSON.stringify(actualObj[k]) !== JSON.stringify(routes[k])) {
      modified.push(k);
    }
  }

  const diffLines = [];
  if (missing.length > 0) diffLines.push(`Missing selectors in committed file: ${missing.join(', ')}`);
  if (extra.length > 0) diffLines.push(`Extra selectors in committed file: ${extra.join(', ')}`);
  if (modified.length > 0) diffLines.push(`Modified selectors: ${modified.join(', ')}`);
  if (diffLines.length === 0) diffLines.push('Content formatting or order differs');

  return {
    clean: false,
    summary: diffLines.join('\n'),
  };
}

// CLI entry point
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const isCheck = args.includes('--check');

  let annotationsPath = DEFAULT_ANNOTATIONS_PATH;
  let routesPath = DEFAULT_ROUTES_PATH;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--annotations' && args[i + 1]) {
      annotationsPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--routes' && args[i + 1]) {
      routesPath = path.resolve(args[i + 1]);
      i++;
    }
  }

  try {
    if (isCheck) {
      const result = checkCommandRoutes({ routesPath, annotationsPath });
      if (result.clean) {
        process.exit(0);
      } else {
        console.error('Command routes drift detected:');
        console.error(result.summary);
        process.exit(1);
      }
    } else {
      exportCommandRoutes({ routesPath, annotationsPath });
      process.exit(0);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
