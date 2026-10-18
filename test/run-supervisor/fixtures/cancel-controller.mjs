// A controller the way `fgos run` is one: the Ctrl-C handler installed, then the real CLI.
// argv: <fgos verb and flags...>; env CANCEL_WAIT_MS bounds the wait for the receipts.
import { installCancelOnSignal } from '../../../src/run-supervisor/cancel-registry.mjs';

installCancelOnSignal({ cancelWaitMs: Number(process.env.CANCEL_WAIT_MS ?? 30_000) });
await import('../../../bin/fgos.mjs');
