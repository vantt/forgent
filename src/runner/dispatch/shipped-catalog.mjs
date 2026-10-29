// Shipped pattern catalog and loop tuning loader.
// Reads the bundled standard {patterns, loops} through the Config facade,
// caches and deep-freezes it. Also provides catalogLayersOf(origins, patterns).
import { readStandardValue } from '../../config/facade.mjs';
import { RESERVED_PATTERN_NAMES } from '../execution/patterns/retired-keys.mjs';

function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  for (const val of Object.values(obj)) {
    deepFreeze(val);
  }
  return obj;
}

let cachedShipped = null;

/**
 * Returns the bundled standard `{ patterns, loops }`, frozen and cached per process.
 * Read through `readStandardValue('runner')`.
 */
export function shippedCatalog() {
  if (cachedShipped) return cachedShipped;
  const standard = readStandardValue('runner');
  const runner = standard?.value ?? {};
  const patterns = deepFreeze(JSON.parse(JSON.stringify(runner.patterns ?? {})));
  const loops = deepFreeze(JSON.parse(JSON.stringify(runner.loops ?? {})));
  cachedShipped = Object.freeze({ patterns, loops });
  return cachedShipped;
}

/**
 * Answers `{ <pattern name>: 'project' | 'global' | 'shipped' }` for the pin:
 * Computed from origins without a second door read.
 * Project layer beats global, which beats shipped.
 */
export function catalogLayersOf(origins, patterns = {}) {
  const effectiveOrigins = Array.isArray(origins) ? origins : [];
  const effectivePatterns = (patterns && typeof patterns === 'object') ? patterns : {};
  const shipped = shippedCatalog().patterns;

  const names = new Set([
    ...Object.keys(effectivePatterns),
    ...Object.keys(shipped),
  ]);
  for (const name of RESERVED_PATTERN_NAMES) {
    names.delete(name);
  }

  const layers = {};
  for (const name of names) {
    const prefix = `runner.patterns.${name}`;
    const matchingOrigins = effectiveOrigins.filter((o) => o?.path === prefix || o?.path?.startsWith(`${prefix}.`) || o?.path?.startsWith(`${prefix}[`));

    let layer = 'shipped';
    if (matchingOrigins.some((o) => o.layer === 'project')) {
      layer = 'project';
    } else if (matchingOrigins.some((o) => o.layer === 'global')) {
      layer = 'global';
    } else {
      layer = 'shipped';
    }
    layers[name] = layer;
  }

  return layers;
}
