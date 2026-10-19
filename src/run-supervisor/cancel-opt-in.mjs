// Whether this process is a controller that turns Ctrl-C and SIGTERM into a cancel of the attempts it
// started (cancel-registry.mjs). A leaf of its own so the CLI entry can set it without loading the registry
// on every verb; the runner installs the handlers only when a process asked.

let enabled = false;

/** This process wants Ctrl-C and SIGTERM to cancel the attempts it started (called once, by the CLI entry). */
export function enableCancelOnSignal() {
  enabled = true;
}

export const cancelOnSignalEnabled = () => enabled;
