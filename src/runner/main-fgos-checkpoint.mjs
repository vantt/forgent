// Compatibility adapter: event truth is outside the checkout; no checkpoint duty.
import { LockHandle } from '../holder-lock/index.mjs';
export function checkpointMainFgos(mainHandle) {
  if (!(mainHandle instanceof LockHandle) || mainHandle.name !== 'main-checkout' || mainHandle.released) {
    throw new TypeError('checkpointMainFgos needs the live main-checkout handle from withMainCheckout');
  }
  return { changed: false };
}
