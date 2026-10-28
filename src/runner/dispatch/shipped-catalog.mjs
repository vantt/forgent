// Shipped pattern catalog and loop tuning loader.
// Reads the bundled standard {patterns, loops} through the Config facade,
// caches and deep-freezes it. Also provides catalogLayersOf(mainRoot) for Branch A.
import { readConfig, readStandardValue } from '../../config/facade.mjs';

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
 * Branch A implementation asks the facade for the origins of `runner.patterns`.
 * Project layer beats global, which beats shipped.
 */
export function catalogLayersOf(mainRoot) {
  const { value, origins = [] } = readConfig({
    projectRoot: mainRoot,
    sections: ['runner'],
    origins: ['runner.patterns'],
  });

  const patterns = value?.runner?.patterns ?? {};
  const shipped = shippedCatalog().patterns;

  const names = new Set([
    ...Object.keys(patterns),
    ...Object.keys(shipped),
  ]);
  names.delete('seatBinding');
  names.delete('defaultRule');

  const layers = {};
  for (const name of names) {
    const prefix = `runner.patterns.${name}`;
    const matchingOrigins = origins.filter((o) => o.path === prefix || o.path.startsWith(`${prefix}.`));

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

  for (const o of origins) {
    if (!o?.path || !o?.layer) continue;
    const layer = o.layer === 'standard' ? 'shipped' : o.layer;
    layers[o.path] = layer;
    if (o.path.startsWith('runner.patterns.')) {
      const fieldPath = o.path.slice('runner.patterns.'.length);
      if (fieldPath.includes('.')) {
        layers[fieldPath] = layer;
      }
      const parts = o.path.split('.');
      for (let i = 4; i < parts.length; i++) {
        const sub = parts.slice(0, i).join('.');
        if (!layers[sub] || (layer === 'project' && layers[sub] !== 'project')) {
          layers[sub] = layer;
          layers[sub.slice('runner.patterns.'.length)] = layer;
        }
      }
    }
  }

  return layers;
}
