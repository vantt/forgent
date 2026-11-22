// dispatch-depth.mjs — how deep in a chain of dispatches this process runs (`FGOS_DISPATCH_DEPTH`), read without
// loading anything: bin/fgos.mjs asks it on every verb, also where no native addon is shipped.
// An accepted Node twin of `fgos_execution::dispatch_env::dispatch_depth_of` (a trivial environment parse); the
// Rust function stays the owner every host and engine path asks. Tier 0: Node built-ins only, none needed.

/** `FGOS_DISPATCH_DEPTH` as a finite number of at least zero, else 0. */
export function currentDispatchDepth(env = process.env) {
  const raw = env.FGOS_DISPATCH_DEPTH;
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
