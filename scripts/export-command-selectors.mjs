#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMAND_REGISTRY, parseShape, publicManifest } from '../src/cli/command-registry.mjs';
import { acceptedFlags } from '../src/cli/flag-check.mjs';

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

export const DEFAULT_MANIFEST_PATH = path.join(
  REPO_ROOT,
  'packages/host-runtime/contracts/command-manifest.json'
);

/**
 * Scan raw JSON object text for a duplicate KEY AT DEPTH 1 (i.e. a duplicate
 * selector in the top-level annotations object) -- the one thing `JSON.parse`
 * itself silently allows (last write wins). Tracks object/array nesting depth
 * and string/escape state character by character so a nested field name that
 * happens to repeat across sibling entries (e.g. two different selectors both
 * declaring "operation_id") is never mistaken for a duplicate top-level key.
 * A real tokenizer, not a flat split -- the prior regex-based scan split on
 * `,\s*(?=")` with no depth awareness and false-failed on exactly that case.
 */
function assertNoDuplicateTopLevelKeys(rawText) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let collectingKey = false;
  let keyBuf = '';
  // At each depth, are we currently in "key position" (expecting a property
  // name next) or "value position" (expecting a value, which may itself be a
  // string)? Object literals alternate key -> `:` -> value -> `,` -> key ...
  let inKeyPosition = true;
  const topLevelKeys = new Set();

  // Standard JSON single-character escapes (RFC 8259 §7) -- \uXXXX is handled
  // separately below since it needs four extra input characters decoded.
  const SIMPLE_ESCAPES = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };

  for (let i = 0; i < rawText.length; i++) {
    const ch = rawText[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        if (ch === 'u') {
          // \uXXXX -> the real code unit it represents, so a key written with
          // an escape decodes identically to the same key written literally
          // (JSON.parse's own behavior) -- collapsing version to
          // "version" instead of missing the duplicate, and never
          // mis-decoding an escaped-quote key like a\"b as containing a
          // literal backslash-quote pair.
          const hex = rawText.slice(i + 1, i + 5);
          if (collectingKey && /^[0-9a-fA-F]{4}$/.test(hex)) {
            keyBuf += String.fromCharCode(parseInt(hex, 16));
          }
          i += 4;
        } else if (collectingKey && Object.hasOwn(SIMPLE_ESCAPES, ch)) {
          keyBuf += SIMPLE_ESCAPES[ch];
        } else if (collectingKey) {
          keyBuf += ch; // not standard JSON, but never silently drop input
        }
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        if (collectingKey) {
          collectingKey = false;
          if (depth === 1) {
            if (topLevelKeys.has(keyBuf)) {
              throw new Error(`Double-bound selector: selector "${keyBuf}" declared more than once in annotations`);
            }
            topLevelKeys.add(keyBuf);
          }
        }
      } else if (collectingKey) {
        keyBuf += ch;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      if (depth === 1 && inKeyPosition) {
        collectingKey = true;
        keyBuf = '';
      }
      continue;
    }

    if (ch === '{') {
      depth++;
      inKeyPosition = true;
      continue;
    }
    if (ch === '[') {
      depth++;
      inKeyPosition = false; // array elements are values, never object keys
      continue;
    }
    if (ch === '}' || ch === ']') {
      depth--;
      continue;
    }
    if (ch === ':') {
      inKeyPosition = false;
      continue;
    }
    if (ch === ',') {
      // Re-entering key position only makes sense directly inside an object;
      // depth tracking alone can't distinguish "back in an object" from
      // "still inside an array" at the same nesting depth, but the outer
      // annotations shape is always object-at-depth-1, so this is safe for
      // the one position (depth === 1) this scan actually acts on.
      if (depth === 1) inKeyPosition = true;
      continue;
    }
  }
}

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

  // Detect duplicate top-level (selector) keys in raw JSON text, if available.
  // A depth-aware scan (not a flat split) so a nested field name shared by two
  // different selector entries -- e.g. two annotated selectors both carrying
  // "operation_id" -- is never mistaken for a duplicate top-level key.
  if (rawText && !Array.isArray(parsed)) {
    assertNoDuplicateTopLevelKeys(rawText);
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
      annotationsMap.set(sel, item);
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    for (const [sel, item] of Object.entries(parsed)) {
      if (!item || typeof item !== 'object') {
        throw new Error(`Annotation for selector "${sel}" must be an object`);
      }
      annotationsMap.set(sel, { selector: sel, ...item });
    }
  }

  return annotationsMap;
}

/**
 * Assert that all COMMAND_REGISTRY selectors end up with a route in the output.
 * R5: any COMMAND_REGISTRY selector ends up with no route in the output (unlisted selector)
 */
export function assertAllSelectorsListed(routes, registry = COMMAND_REGISTRY) {
  // Object.hasOwn, not index truthiness: a selector literally named
  // "__proto__" would otherwise resolve through the prototype chain to a
  // real (truthy, but meaningless) object and silently pass this guard.
  for (const selector of registry.map((cmd) => cmd.name)) {
    if (!Object.hasOwn(routes, selector)) {
      throw new Error(`Unlisted selector: selector "${selector}" has no route in generated output`);
    }
  }

  if (Object.keys(routes).length !== registry.length) {
    throw new Error(`Route count mismatch: expected ${registry.length}, got ${Object.keys(routes).length}`);
  }
}

// What the registry `native` field says: undefined (nothing native), true (the whole verb) or the sorted first positionals.
function nativeDeclaration(cmd) {
  const { name: selector, native } = cmd;
  if (native === undefined || native === true) return native;
  if (!Array.isArray(native) || native.length === 0 || !native.every((sub) => typeof sub === 'string' && sub)) {
    throw new Error(`native on selector "${selector}" must be true or a non-empty list of first positionals`);
  }
  for (const sub of native) {
    if (cmd.subcommands && !Object.hasOwn(cmd.subcommands, sub)) {
      throw new Error(`native on selector "${selector}" names "${sub}", which is not one of its sub-verbs`);
    }
  }
  return [...native].sort();
}

// A store declaration is `true` or a non-empty list of invocation shapes the host can match; the data goes out verbatim.
function storeDeclaration(cmd, field) {
  const value = cmd[field];
  if (value === undefined || value === true) return value;
  if (!Array.isArray(value) || value.length === 0 || !value.every((shape) => parseShape(shape))) {
    throw new Error(`${field} on selector "${cmd.name}" must be true or a non-empty list of invocation shapes`);
  }
  return value;
}

// Land release has no Rust owner yet, so no invocation that lands work may be declared native.
function assertNoNativeLanding(cmd, native, landsWork) {
  if (native === undefined || landsWork === undefined) return;
  const lands = native === true
    || landsWork === true
    || landsWork.some((shape) => native.includes(parseShape(shape).sub));
  if (lands) throw new Error(`Selector "${cmd.name}" declares native but lands work, which has no Rust owner`);
}

function nativeFlagProjection(cmd, onlySubs) {
  const sorted = (set) => [...set].sort();
  if (cmd.subcommands) {
    const subcommand_flags = {};
    for (const sub of onlySubs ?? Object.keys(cmd.subcommands).sort()) subcommand_flags[sub] = sorted(acceptedFlags(cmd, [sub]));
    return { subcommand_flags };
  }
  return { accepted_flags: sorted(acceptedFlags(cmd)) };
}

const ANNOTATION_FIELDS = ['selector', 'operation_id', 'owner_path', 'subcommands', 'legacy_payload', 'compatibility_tests'];

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
  // The registry `native` field decides the route and what is served natively; an annotation can only name what the
  // registry cannot hold (operation, owner, payload, tests), so any other field is a second authority and is refused.
  for (const [sel, ann] of annotationsMap) {
    for (const field of Object.keys(ann)) {
      if (!ANNOTATION_FIELDS.includes(field)) {
        throw new Error(`Unknown annotation field "${field}" on selector "${sel}": the registry decides the route and what is native`);
      }
    }
  }

  const routes = {};

  // Sort selectors lexicographically for deterministic output. Iteration
  // order here is discarded anyway -- formatCommandRoutesJson re-sorts
  // output keys with the same default .sort() before serializing -- so this
  // uses the identical comparator rather than a second, locale-sensitive one
  // that would only diverge from it silently.
  const sortedCommands = [...registry].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  for (const cmd of sortedCommands) {
    const selector = cmd.name;
    const ann = annotationsMap.get(selector);

    const native = nativeDeclaration(cmd);
    const mutatesStore = storeDeclaration(cmd, 'mutatesStore');
    const landsWork = storeDeclaration(cmd, 'landsWork');
    const eventStoreChild = storeDeclaration(cmd, 'eventStoreChild');
    assertNoNativeLanding(cmd, native, landsWork);
    const route_kind = native === true ? 'native' : 'legacy-cli';
    let operation_id;
    let legacy_payload;
    let owner_path;

    if (route_kind === 'native') {
      operation_id = ann?.operation_id;
      if (!operation_id) {
        throw new Error(`Native route for selector "${selector}" requires operation_id`);
      }
      owner_path = ann.owner_path;
      if (!owner_path) {
        throw new Error(`Native route for selector "${selector}" requires an explicit owner_path`);
      }
    } else {
      legacy_payload = ann?.legacy_payload ?? 'legacy-node';
      owner_path = ann?.owner_path ?? 'src/cli/command-registry.mjs';
    }
    const compatibility_tests = ann?.compatibility_tests ?? ['test/rust-host/command-routes.test.mjs'];

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
      ...(ann?.subcommands !== undefined ? { subcommands: Boolean(ann.subcommands) } : {}),
      // A legacy-cli selector may name first positionals the host serves natively before the composition root; every
      // other one still reaches the legacy payload.
      ...(Array.isArray(native) ? { native_subcommands: native } : {}),
      // The Rust host validates a native verb's flags itself (the legacy-node
      // payload does it for every other verb), from this projection of the
      // registry: one list of valid flags, two enforcement points.
      ...(native === true ? nativeFlagProjection(cmd) : {}),
      ...(Array.isArray(native) && cmd.subcommands ? nativeFlagProjection(cmd, native) : {}),
      // The store declarations the shell reads, as data the host can read too (the registry holds them once).
      store: cmd.store,
      ...(mutatesStore !== undefined ? { mutates_store: mutatesStore } : {}),
      ...(landsWork !== undefined ? { lands_work: landsWork } : {}),
      ...(eventStoreChild !== undefined ? { event_store_child: eventStoreChild } : {}),
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

/** The bytes `fgos --help --json` prints: the verb manifest, two-space JSON and a final newline. */
export function formatCommandManifestJson(manifest = publicManifest()) {
  return JSON.stringify(manifest, null, 2) + '\n';
}

// Same directory as `target` (never os.tmpdir()): fs.renameSync is only
// atomic within one filesystem, and /tmp is commonly a separate mount from
// the checkout. A crash mid-write can still leave a tmp file behind, so
// .gitignore covers its exact naming pattern.
function writeAtomic(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmpPath = `${target}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, target);
}

export function exportCommandRoutes({
  routesPath = DEFAULT_ROUTES_PATH,
  manifestPath = DEFAULT_MANIFEST_PATH,
  annotationsPath = DEFAULT_ANNOTATIONS_PATH,
  registry = COMMAND_REGISTRY,
} = {}) {
  const routes = generateCommandRoutes({ registry, annotations: annotationsPath });
  const content = formatCommandRoutesJson(routes);
  writeAtomic(manifestPath, formatCommandManifestJson());

  writeAtomic(routesPath, content);
  return { routes, content };
}

/** Whether the committed manifest file holds exactly the bytes the registry projects to. */
export function checkCommandManifest({ manifestPath = DEFAULT_MANIFEST_PATH } = {}) {
  if (!fs.existsSync(manifestPath)) {
    return { clean: false, summary: `Target manifest file does not exist: ${manifestPath}` };
  }
  const actual = fs.readFileSync(manifestPath, 'utf8').replace(/\r\n/g, '\n');
  if (actual === formatCommandManifestJson()) return { clean: true, summary: '' };
  return { clean: false, summary: `Committed file ${manifestPath} differs from the registry projection` };
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
  if (actualContent.replace(/\r\n/g, '\n') === expectedContent.replace(/\r\n/g, '\n')) {
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
  let manifestPath = DEFAULT_MANIFEST_PATH;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--annotations' && args[i + 1]) {
      annotationsPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--routes' && args[i + 1]) {
      routesPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--manifest' && args[i + 1]) {
      manifestPath = path.resolve(args[i + 1]);
      i++;
    }
  }

  try {
    if (isCheck) {
      const routes = checkCommandRoutes({ routesPath, annotationsPath });
      const manifest = checkCommandManifest({ manifestPath });
      if (routes.clean && manifest.clean) process.exit(0);
      if (!routes.clean) {
        console.error('Command routes drift detected:');
        console.error(routes.summary);
      }
      if (!manifest.clean) {
        console.error('Command manifest drift detected:');
        console.error(manifest.summary);
      }
      process.exit(1);
    } else {
      exportCommandRoutes({ routesPath, manifestPath, annotationsPath });
      process.exit(0);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
