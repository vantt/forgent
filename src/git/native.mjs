import { registerGitHandover } from '../holder-lock/native-handover.mjs';
// Git's view of the native door: the Git handover registration on top of the one loader. Git/Event Store policy stays in Rust.
import { loadNativeAddon as loadThroughDoor } from '../native/door.mjs';
export { nativeHelperExe } from '../native/door.mjs';
let handover;
/** A native port error as its typed fields (`cause`, `stderr` bytes, ...);
 * an error that is not one keeps its message as the cause. */
export function nativeError(error) {
  try { return JSON.parse(error.message); } catch { return { cause: error.message ?? error.code, stderr: [] }; }
}
export function withNativeLocks(addon, handles, call) {
  if (!handover) handover = registerGitHandover(addon);
  return handover(handles, call);
}
export function loadNativeAddon(options) {
  const addon = loadThroughDoor(options);
  if (!handover) handover = registerGitHandover(addon);
  return addon;
}
