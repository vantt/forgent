// dispatch.mjs — the entry of `node src/runner/dispatch.mjs probe-account|probe-session|reconcile ...`, the
// compatibility alias of `fgos dispatch`. It re-exports nothing: import from the module under dispatch/
// that owns the name. `decide` and `explain` are served by the native host only (`fgos dispatch decide`).
import { runDispatchCli } from './dispatch/cli.mjs';
import { isMainModule } from '../../scripts/lib/is-main-module.mjs';

if (isMainModule(import.meta.url)) {
  runDispatchCli();
}
