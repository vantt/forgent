import './process-tmp-root.mjs';
import './work-store-release.mjs';
import { withMainState } from '../../src/state/runtime-coordination.mjs';
export function appendWorkEvent(dir, event) {
  return withMainState(dir, tx => tx.append(event));
}
