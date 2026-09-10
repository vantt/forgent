#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROUTES_PATH = path.resolve(
  __dirname,
  '../packages/host-runtime/contracts/command-routes.json'
);

export function explainCommandRoute(selector, routesPath = DEFAULT_ROUTES_PATH) {
  if (!fs.existsSync(routesPath)) {
    throw new Error(`Command routes file not found at ${routesPath}`);
  }

  const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
  // Object.hasOwn, not `routes[selector]` truthiness: a selector literally
  // named "__proto__" or "constructor" would otherwise resolve through the
  // prototype chain to a real (truthy, but meaningless) object and fall
  // through to a confusing TypeError instead of the clear unknown-selector
  // message below.
  const route = Object.hasOwn(routes, selector) ? routes[selector] : undefined;

  if (!route) {
    throw new Error(`Unknown command selector: "${selector}"`);
  }

  return route;
}

// CLI entry point
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const selector = process.argv[2];
  if (!selector) {
    console.error('Usage: node scripts/explain-command-route.mjs <selector>');
    process.exit(1);
  }

  try {
    const route = explainCommandRoute(selector);
    console.log(`selector: ${route.selector}`);
    console.log(`route_kind: ${route.route_kind}`);
    if (route.route_kind === 'native') {
      console.log(`operation_id: ${route.operation_id}`);
    } else if (route.route_kind === 'legacy-cli') {
      console.log(`legacy_payload: ${route.legacy_payload}`);
    }
    console.log(`owner_path: ${route.owner_path}`);
    console.log(`compatibility_tests: ${route.compatibility_tests.join(', ')}`);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
