// dispatch.mjs — the entry of `node src/runner/dispatch.mjs decide|probe-account|reconcile ...`, the
// compatibility alias of `fgos dispatch`. It re-exports nothing: import from the module under dispatch/
// that owns the name. `decide --work` needs a Work lookup, which `fgos dispatch decide` hands in from bin;
// run bare, it refuses and names that door.
import { runDispatchCli } from './dispatch/cli.mjs';
import { isMainModule } from '../../scripts/lib/is-main-module.mjs';

if (isMainModule(import.meta.url)) {
  runDispatchCli();
}
