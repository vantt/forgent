// Only src/git/native.mjs may import this registration seam.
import { registerNativeHandover } from './index.mjs';
export function registerGitHandover(addon) {
  const capability = addon.takeGitHandover();
  return registerNativeHandover(
    (fd, name, lockPath, killWaitMs, reachFloorTicks) => addon.mintGitLoan(capability, fd, name, lockPath, killWaitMs, reachFloorTicks),
    loan => addon.closeGitLoan(loan),
  );
}
