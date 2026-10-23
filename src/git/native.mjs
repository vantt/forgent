import { registerGitHandover } from '../holder-lock/native-handover.mjs';
// Git's view of the native door: the Git handover registration on top of the one loader. Git/Event Store policy stays in Rust.
import { loadNativeAddon as loadThroughDoor } from '../native/door.mjs';
export { nativeError, nativeHelperExe } from '../native/door.mjs';
let handover;
export function withNativeLocks(addon, handles, call) {
  if (!handover) handover = registerGitHandover(addon);
  return handover(handles, call);
}
export function loadNativeAddon(options) {
  const addon = loadThroughDoor(options);
  if (!handover) handover = registerGitHandover(addon);
  return addon;
}
