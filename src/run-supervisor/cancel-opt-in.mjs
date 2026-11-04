// Whether this process turns Ctrl-C and SIGTERM into a cancel of the attempts it started
// (cancel-registry.mjs). A leaf of its own so the CLI entry can set it without loading the registry.

let enabled = false;

/** This process wants Ctrl-C and SIGTERM to cancel the attempts it started (called once, by the CLI entry). */
export function enableCancelOnSignal() {
  enabled = true;
}

export const cancelOnSignalEnabled = () => enabled;
