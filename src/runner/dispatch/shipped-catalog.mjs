// Shipped pattern catalog and loop tuning loader.
// Reads the bundled standard {patterns, loops} through the Config facade,
// caches and deep-freezes it.
import { readStandardValue } from '../../config/facade.mjs';

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

