#!/usr/bin/env node
// Entry for a hook registration that still names this file: `fgos hook dispatch-decide` is the door, and the verdict
// is src/runner/hook.mjs, so there is one body for every agent and both payload formats.
import { serveHook } from '../src/runner/hook.mjs';

await serveHook('dispatch-decide', process.argv.slice(2));
