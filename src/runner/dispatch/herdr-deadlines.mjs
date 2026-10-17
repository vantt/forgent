// herdr-deadlines.mjs -- the transport deadline that other modules measure
// themselves against. A leaf: it imports nothing, so doctor can read it
// without pulling in the herdr round.

/** `agent start`'s own documented default: how long a launched agent gets to become ready.
 * `terminal.allocationGraceMs` must stay larger than this (doctor `terminal-config`). */
export const READY_TIMEOUT_MS = 30000;
