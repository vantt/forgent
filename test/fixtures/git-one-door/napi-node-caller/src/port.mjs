// The constructor argument crosses N-API: the Rust spawn's binary is what Node passes here.
export function openPort(addon) {
  return new addon.Port('git');
}
